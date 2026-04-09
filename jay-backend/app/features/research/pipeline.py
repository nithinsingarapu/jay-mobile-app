"""
JAY Research Pipeline — adapted from JAY_RESEARCH CLI for the backend API.

3-stage pipeline:
  Stage 1: Product identification (1 Gemini + Google Search call)
  Stage 2: 5 parallel research branches (5 concurrent Gemini + Google Search)
  Stage 3: Report assembly + overlay (1 Gemini call)
"""
import asyncio
import json
import re
import time
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from .models import ProductResearch

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI CLIENT WITH GOOGLE SEARCH GROUNDING
# ═══════════════════════════════════════════════════════════════════════════════

_GROUNDING_URL_RE = re.compile(
    r"https?://[^\s\)\]\"']*(?:vertexaisearch|grounding-api-redirect)[^\s\)\]\"']*",
    re.IGNORECASE,
)
MAX_CONTINUATION_ROUNDS = 2


def _strip_grounding(text: str) -> str:
    if not text:
        return text
    cleaned = _GROUNDING_URL_RE.sub("", text)
    return re.sub(r"\n{4,}", "\n\n\n", cleaned)


def _get_client():
    from google import genai
    return genai.Client(api_key=get_settings().gemini_api_key)


def _build_config(system_prompt: str, max_tokens: int):
    from google.genai import types
    return types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=0.4,
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )


async def _research(system_prompt: str, user_prompt: str, max_tokens: int = 16384, stage: str = "") -> str:
    """Single Gemini call with Google Search grounding + auto-continuation."""
    from google.genai import types
    client = _get_client()
    config = _build_config(system_prompt, max_tokens)
    contents = user_prompt
    accumulated = ""

    for cont in range(MAX_CONTINUATION_ROUNDS + 1):
        for attempt in range(3):
            try:
                resp = await client.aio.models.generate_content(
                    model="gemini-2.5-flash", contents=contents, config=config,
                )
                text = _strip_grounding(resp.text or "")
                if not text.strip():
                    continue
                accumulated += text

                # Check if hit max tokens
                fr = str(getattr(resp.candidates[0], "finish_reason", "")) if resp.candidates else ""
                if "MAX_TOKENS" in fr.upper() and cont < MAX_CONTINUATION_ROUNDS:
                    logger.info(f"  [{stage}] continuing ({cont + 1}/{MAX_CONTINUATION_ROUNDS})...")
                    if isinstance(contents, str):
                        contents = [
                            types.Content(role="user", parts=[types.Part(text=user_prompt)]),
                            types.Content(role="model", parts=[types.Part(text=text)]),
                            types.Content(role="user", parts=[types.Part(text="Continue EXACTLY where you stopped. Do not repeat.")]),
                        ]
                    else:
                        contents.append(types.Content(role="model", parts=[types.Part(text=text)]))
                        contents.append(types.Content(role="user", parts=[types.Part(text="Continue EXACTLY where you stopped.")]))
                    break
                return accumulated

            except Exception as e:
                if "429" in str(e).lower() or "resource_exhausted" in str(e).lower():
                    wait = 2 ** (attempt + 1)
                    logger.warning(f"  [{stage}] rate limited, waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif attempt < 2:
                    logger.warning(f"  [{stage}] error: {e}, retrying...")
                    await asyncio.sleep(2)
                else:
                    logger.error(f"  [{stage}] failed: {e}")
                    return f"[RESEARCH FAILED: {stage} — {e}]"
        else:
            return accumulated or f"[RESEARCH FAILED: {stage} — exhausted retries]"

    return accumulated


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPTS (inline, adapted from JAY_RESEARCH/prompts.py)
# ═══════════════════════════════════════════════════════════════════════════════

STAGE1_SYSTEM = """You are a product identification specialist for skincare, haircare, and bodycare.
Given a product name, identify the EXACT product — full name, brand, INCI list, price, claims, certifications.
Use web search to verify everything. Do not guess INCI lists.
OUTPUT: ONLY valid JSON (no markdown fences):
{"found": true, "product_name": "", "brand": "", "parent_company": "", "category": "",
 "format": "", "price": {"amount": 0, "currency": "", "size": ""},
 "primary_market": "", "target_skin_type": "", "inci_list": "",
 "key_claims": [], "certifications": [], "notes": ""}"""

STAGE2A_SYSTEM = """You are a cosmetic chemist. Analyze the INCI list: identify every active ingredient,
estimated concentration from INCI position, clinical evidence, safety flags, conflicts,
pregnancy safety, comedogenicity. Rate formula richness 1-10. Use PubMed. Output markdown."""

STAGE2B_SYSTEM = """You are a review analyst. Search Amazon, Reddit (r/SkincareAddiction, r/IndianSkincareAddicts),
Nykaa, Sephora for real user reviews. Aggregate ratings, top 5 positives, top 5 negatives,
demographic patterns, fake review assessment. Output markdown with tables."""

STAGE2C_SYSTEM = """You are a medical research analyst. Search for dermatologist and expert reviews —
Dr. Dray, Dr. Sam Bunting, Dr. Shereene Idriss, Dr. Aanchal Panth, Lab Muffin.
Also search PubMed for studies on key ingredients. Note if review was sponsored.
Output structured markdown."""

STAGE2D_SYSTEM = """You are a brand intelligence analyst. Research: founding history, parent company,
controversies, FDA/regulatory warnings, transparency assessment, certifications
(cruelty-free, vegan, GMP). Output markdown."""

STAGE2E_SYSTEM = """You are a claims verification analyst. For each marketing claim, find evidence and rate:
Clinically Verified / Partially Verified / Unverified / Misleading.
Then find up to 3 better alternatives IF warranted. Output markdown with claims table."""

STAGE3_OVERLAY_SYSTEM = """Write ONLY three sections with exact ## headers:
## TL;DR — EXECUTIVE SUMMARY (6-8 sentences, verdict, who it suits, score /10)
## 7. USAGE PROTOCOL (application, frequency, layering, what to avoid, patch testing)
## 8. REPORT CARD (table with 6 metrics scored 1-10 + overall, then 4-6 sentence verdict)
Keep concise but specific. Do NOT invent facts not in the excerpts."""


# ═══════════════════════════════════════════════════════════════════════════════
# PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def _parse_json(text: str) -> dict | None:
    stripped = text.strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass
    s, e = stripped.find('{'), stripped.rfind('}')
    if s != -1 and e > s:
        try:
            return json.loads(stripped[s:e + 1])
        except json.JSONDecodeError:
            pass
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return None


def _parse_report_card(text: str) -> dict | None:
    """Extract report card scores from markdown table."""
    scores = {}
    mapping = {
        "ingredient quality": "ingredient_quality",
        "formula safety": "formula_safety",
        "value for money": "value_for_money",
        "brand transparency": "brand_transparency",
        "user satisfaction": "user_satisfaction",
        "dermatologist endorsement": "derm_endorsement",
        "overall": "overall",
    }
    for line in text.splitlines():
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) >= 2:
            label = parts[0].lower().strip("* ")
            for key, field in mapping.items():
                if key in label:
                    try:
                        score = int(re.search(r"\d+", parts[1]).group())
                        scores[field] = min(10, max(1, score))
                    except (AttributeError, ValueError):
                        pass
    return scores if scores else None


async def run_research(product_name: str, product_id: int | None, db: AsyncSession) -> ProductResearch:
    """Run the full 3-stage research pipeline. Commits after EACH branch so frontend can poll partial results."""
    start = time.time()

    # Get existing record (created by router)
    from sqlalchemy import select as sa_select
    result = await db.execute(
        sa_select(ProductResearch).where(
            ProductResearch.product_name == product_name,
            ProductResearch.status.in_(["pending", "running"]),
        ).order_by(ProductResearch.id.desc()).limit(1)
    )
    research = result.scalar_one_or_none()
    if not research:
        research = ProductResearch(product_name=product_name, product_id=product_id, status="running", model_used="gemini-2.5-flash")
        db.add(research)
        await db.commit()
        await db.refresh(research)

    async def _save(stage: str):
        research.current_stage = stage
        await db.commit()

    try:
        # ── Stage 1: Identify ─────────────────────────────────
        await _save("identify")
        logger.info(f"[Research #{research.id}] Stage 1: Identifying '{product_name}'...")
        s1_raw = await _research(
            STAGE1_SYSTEM,
            f'Identify this product: "{product_name}". Search official website, Amazon, INCIDecoder.',
            max_tokens=4096, stage="identify",
        )
        product_data = _parse_json(s1_raw)
        if not product_data or not product_data.get("found", False):
            research.status = "failed"
            research.current_stage = "failed"
            research.error_message = "Could not identify product"
            research.product_data = product_data
            await db.commit()
            return research

        research.product_data = product_data
        research.brand = product_data.get("brand")
        await _save("identified")

        pname = product_data.get("product_name", product_name)
        inci = product_data.get("inci_list", "")
        brand = product_data.get("brand", "")
        market = product_data.get("primary_market", "")
        claims = product_data.get("key_claims", [])
        price = product_data.get("price", {})
        category = product_data.get("category", "")
        parent = product_data.get("parent_company", "")

        # ── Stage 2: Parallel branches (save each as it completes) ──
        logger.info(f"[Research #{research.id}] Stage 2: Running 5 parallel branches...")
        await _save("researching")

        async def _run_branch(key: str, system: str, prompt: str):
            await _save(key)
            result = await _research(system, prompt, max_tokens=16384, stage=key)
            setattr(research, {
                "ingredients": "ingredients_analysis",
                "reviews": "review_synthesis",
                "experts": "expert_reviews",
                "brand": "brand_intelligence",
                "claims": "claims_alternatives",
            }[key], result)
            await db.commit()  # Save this branch immediately
            logger.info(f"  [{key}] done ({len(result)} chars)")
            return result

        branch_results = await asyncio.gather(
            _run_branch("ingredients", STAGE2A_SYSTEM, f"Product: {pname}\nCategory: {category}\nINCI: {inci}\nAnalyze all ingredients."),
            _run_branch("reviews", STAGE2B_SYSTEM, f"Product: {pname}\nBrand: {brand}\nMarket: {market}\nSearch reviews on Amazon, Reddit, {'Nykaa' if market == 'India' else 'Sephora'}."),
            _run_branch("experts", STAGE2C_SYSTEM, f"Product: {pname}\nBrand: {brand}\nKey ingredients: {inci[:300]}\nSearch for derm/expert reviews."),
            _run_branch("brand", STAGE2D_SYSTEM, f"Brand: {brand}\nParent: {parent}\nResearch brand history, reputation, controversies."),
            _run_branch("claims", STAGE2E_SYSTEM, f"Product: {pname}\nBrand: {brand}\nCategory: {category}\nPrice: {price}\nMarket: {market}\nClaims: {chr(10).join(claims)}\nVerify claims, find alternatives."),
        )

        # ── Stage 3: Overlay ──────────────────────────────────
        await _save("compiling")
        logger.info(f"[Research #{research.id}] Stage 3: Generating overlay...")

        ctx_parts = [f"PRODUCT: {json.dumps(product_data, indent=2)[:3000]}"]
        for label, text in [("INGREDIENTS", branch_results[0]), ("REVIEWS", branch_results[1]),
                           ("EXPERTS", branch_results[2]), ("BRAND", branch_results[3]), ("CLAIMS", branch_results[4])]:
            ctx_parts.append(f"\n━━━ {label} ━━━\n{(text or '')[:4000]}")
        context = "\n".join(ctx_parts)

        overlay = await _research(
            STAGE3_OVERLAY_SYSTEM,
            f"Product: {pname}\n\nResearch excerpts:\n{context}\n\nWrite TL;DR, §7 Usage, §8 Report Card.",
            max_tokens=8192, stage="overlay",
        )

        tldr, sec7, sec8 = "", "", ""
        m7 = re.search(r"(?m)^## 7\.\s*", overlay)
        m8 = re.search(r"(?m)^## 8\.\s*", overlay)
        if m7 and m8 and m7.start() < m8.start():
            tldr = overlay[:m7.start()].strip()
            sec7 = overlay[m7.start():m8.start()].strip()
            sec8 = overlay[m8.start():].strip()
        elif overlay:
            tldr = overlay.strip()

        research.tldr = tldr
        research.usage_protocol = sec7
        research.report_card = _parse_report_card(sec8)

        # Assemble full markdown
        report_parts = [
            f"# JAY Research — {pname}\n",
            f"## TL;DR\n{tldr}\n" if tldr else "",
            f"## 1. Product & Brand Intelligence\n```json\n{json.dumps(product_data, indent=2)}\n```\n",
            f"### Brand Intelligence\n{branch_results[3]}\n" if branch_results[3] else "",
            f"## 2. Ingredient Analysis\n{branch_results[0]}\n" if branch_results[0] else "",
            f"## 3. User Review Synthesis\n{branch_results[1]}\n" if branch_results[1] else "",
            f"## 4. Expert & Dermatologist Reviews\n{branch_results[2]}\n" if branch_results[2] else "",
            f"## 5. Claims Verification & Alternatives\n{branch_results[4]}\n" if branch_results[4] else "",
            f"{sec7}\n" if sec7 else "",
            f"{sec8}\n" if sec8 else "",
        ]
        research.report_markdown = "\n".join(p for p in report_parts if p)

        elapsed = time.time() - start
        research.duration_seconds = round(elapsed, 1)
        research.status = "completed"
        research.current_stage = "done"
        logger.info(f"[Research #{research.id}] Completed in {elapsed:.0f}s")

    except Exception as e:
        logger.error(f"[Research #{research.id}] Failed: {e}")
        research.status = "failed"
        research.current_stage = "failed"
        research.error_message = str(e)

    await db.commit()
    return research
