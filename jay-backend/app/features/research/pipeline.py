"""
JAY Research Pipeline — Hybrid Tavily + Gemini Search

Stage 1:  Gemini + GoogleSearch  (product identification)
Stage 2A: Gemini + GoogleSearch  (ingredients — chemistry reasoning)
Stage 2B: Tavily → Gemini       (reviews — needs real Amazon/Reddit/Nykaa)
Stage 2C: Tavily → Gemini       (experts — targeted derm/PubMed search)
Stage 2D: Gemini + GoogleSearch  (brand — general info)
Stage 2E: Tavily → Gemini       (claims — evidence for specific claims)
Stage 3:  Gemini only            (overlay synthesis, no search)
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

MAX_CONTINUATION_ROUNDS = 2

_GROUNDING_URL_RE = re.compile(
    r"https?://[^\s\)\]\"']*(?:vertexaisearch|grounding-api-redirect)[^\s\)\]\"']*",
    re.IGNORECASE,
)


def _strip_grounding(text: str) -> str:
    if not text:
        return text
    return re.sub(r"\n{4,}", "\n\n\n", _GROUNDING_URL_RE.sub("", text))


def _get_client():
    from google import genai
    return genai.Client(api_key=get_settings().gemini_api_key)


# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI CALL — WITH Google Search (for Stage 1, 2A, 2D)
# ═══════════════════════════════════════════════════════════════════════════════

async def _research_with_search(
    system_prompt: str, user_prompt: str, max_tokens: int = 16384, stage: str = "",
) -> str:
    """Gemini call WITH GoogleSearch() tool — Gemini decides what to search."""
    from google.genai import types
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=0.4,
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    return await _gemini_call(client, config, user_prompt, max_tokens, stage, strip_grounding=True)


# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI CALL — WITHOUT search (for Tavily-backed branches + Stage 3)
# ═══════════════════════════════════════════════════════════════════════════════

async def _research_no_search(
    system_prompt: str, user_prompt: str, max_tokens: int = 16384, stage: str = "",
) -> str:
    """Gemini call WITHOUT search tool — pure synthesis from provided context."""
    from google.genai import types
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=0.4,
    )
    return await _gemini_call(client, config, user_prompt, max_tokens, stage, strip_grounding=False)


# ═══════════════════════════════════════════════════════════════════════════════
# SHARED GEMINI CALL (retry + continuation logic)
# ═══════════════════════════════════════════════════════════════════════════════

async def _gemini_call(client, config, user_prompt, max_tokens, stage, strip_grounding=True) -> str:
    from google.genai import types
    contents = user_prompt
    accumulated = ""

    for cont in range(MAX_CONTINUATION_ROUNDS + 1):
        for attempt in range(3):
            try:
                resp = await client.aio.models.generate_content(
                    model="gemini-2.5-flash", contents=contents, config=config,
                )
                text = resp.text or ""
                if strip_grounding:
                    text = _strip_grounding(text)
                if not text.strip():
                    continue
                accumulated += text

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
                    await asyncio.sleep(2 ** (attempt + 1))
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
# TAVILY-BACKED RESEARCH (for 2B, 2C, 2E)
# ═══════════════════════════════════════════════════════════════════════════════

async def _research_with_tavily(
    system_prompt: str,
    user_prompt: str,
    tavily_queries: list[dict],
    max_tokens: int = 16384,
    stage: str = "",
    context_budget: int = 10000,
) -> str:
    """
    1. Tavily parallel search
    2. Format as context block
    3. Inject into Gemini (no search tool)
    4. Fallback to Gemini+GoogleSearch if Tavily empty
    """
    from .tavily_client import tavily_multi, format_context

    results = await tavily_multi(tavily_queries)
    context = format_context(results, max_chars=context_budget)

    if context.strip():
        augmented = (
            f"{user_prompt}\n\n"
            f"━━━ WEB RESEARCH RESULTS ━━━\n"
            f"{context}\n"
            f"━━━ END RESEARCH ━━━\n\n"
            f"Use the research results above to ground your analysis. Cite sources by URL."
        )
        return await _research_no_search(system_prompt, augmented, max_tokens, stage)
    else:
        logger.warning(f"  [{stage}] Tavily empty, falling back to Gemini+GoogleSearch")
        return await _research_with_search(system_prompt, user_prompt, max_tokens, stage)


# ═══════════════════════════════════════════════════════════════════════════════
# PROMPTS
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

STAGE2B_SYSTEM = """You are a consumer review analyst. Synthesize the provided web search results about
user reviews of this product. Aggregate ratings, identify top 5 positives and negatives,
demographic patterns, short-term vs long-term feedback, and fake review risk assessment.
Output structured markdown with a ratings summary table. Only use data from the provided research results."""

STAGE2C_SYSTEM = """You are a medical research analyst. Analyze the provided search results about
dermatologist and expert reviews of this product. For each expert found: name, credentials,
platform, sponsored/independent, key conclusions. Also summarize any PubMed studies on key ingredients.
Output structured markdown. Only use data from the provided research results."""

STAGE2D_SYSTEM = """You are a brand intelligence analyst. Research: founding history, parent company,
controversies, FDA/regulatory warnings, transparency assessment, certifications
(cruelty-free, vegan, GMP). Output markdown."""

STAGE2E_SYSTEM = """You are a claims verification analyst. Using the provided research results,
verify each marketing claim and rate: Clinically Verified / Partially Verified / Unverified / Misleading.
Output a claims verification table. Then analyze any alternatives found in the results.
Only use evidence from the provided research results."""

STAGE3_OVERLAY_SYSTEM = """Write ONLY three sections with exact ## headers:
## TL;DR — EXECUTIVE SUMMARY (6-8 sentences, verdict, who it suits, score /10)
## 7. USAGE PROTOCOL (application, frequency, layering, what to avoid, patch testing)
## 8. REPORT CARD (table with 6 metrics scored 1-10 + overall, then 4-6 sentence verdict)
Keep concise but specific. Do NOT invent facts not in the excerpts."""


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITIES
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
    scores = {}
    mapping = {
        "ingredient quality": "ingredient_quality", "formula safety": "formula_safety",
        "value for money": "value_for_money", "brand transparency": "brand_transparency",
        "user satisfaction": "user_satisfaction", "dermatologist endorsement": "derm_endorsement",
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
                        scores[field] = min(10, max(1, int(re.search(r"\d+", parts[1]).group())))
                    except (AttributeError, ValueError):
                        pass
    return scores if scores else None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

FIELD_MAP = {
    "ingredients": "ingredients_analysis",
    "reviews": "review_synthesis",
    "experts": "expert_reviews",
    "brand": "brand_intelligence",
    "claims": "claims_alternatives",
}


async def _update_research(research_id: int, **kwargs):
    """Update research record in its own session (safe for concurrent use)."""
    from app.database import async_session_factory
    async with async_session_factory() as session:
        from sqlalchemy import update
        await session.execute(
            update(ProductResearch).where(ProductResearch.id == research_id).values(**kwargs)
        )
        await session.commit()


async def run_research(product_name: str, product_id: int | None, db: AsyncSession) -> ProductResearch:
    """Hybrid Tavily+Gemini pipeline. Each branch saves via its own DB session to avoid concurrent commit crashes."""
    start = time.time()

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

    rid = research.id

    try:
        # ── STAGE 1: Identify (Gemini + GoogleSearch) ─────────
        await _update_research(rid, current_stage="identify")
        logger.info(f"[Research #{rid}] Stage 1: Identifying '{product_name}'...")
        s1_raw = await _research_with_search(
            STAGE1_SYSTEM,
            f'Identify this product: "{product_name}". Search official website, Amazon, INCIDecoder.',
            max_tokens=4096, stage="identify",
        )
        product_data = _parse_json(s1_raw)
        if not product_data or not product_data.get("found", False):
            await _update_research(rid, status="failed", current_stage="failed",
                                   error_message="Could not identify product",
                                   product_data=product_data)
            return research

        await _update_research(rid, product_data=product_data, brand=product_data.get("brand"),
                               current_stage="identified")

        pname = product_data.get("product_name", product_name)
        inci = product_data.get("inci_list", "")
        brand = product_data.get("brand", "")
        market = product_data.get("primary_market", "")
        claims = product_data.get("key_claims", [])
        price = product_data.get("price", {})
        category = product_data.get("category", "")
        parent = product_data.get("parent_company", "")

        # ── STAGE 2: 5 parallel branches ──────────────────────
        await _update_research(rid, current_stage="researching")
        logger.info(f"[Research #{rid}] Stage 2: 5 parallel branches...")

        async def _branch_ingredients():
            r = await _research_with_search(
                STAGE2A_SYSTEM,
                f"Product: {pname}\nCategory: {category}\nINCI: {inci}\nAnalyze all ingredients.",
                max_tokens=16384, stage="ingredients",
            )
            await _update_research(rid, ingredients_analysis=r)
            logger.info(f"  [ingredients] done ({len(r)} chars)")
            return r

        async def _branch_reviews():
            nykaa = "nykaa.com" if market == "India" else "sephora.com"
            queries = [
                {"key": "amazon", "query": f'"{pname}" review', "max": 5, "domains": ["amazon.in", "amazon.com"]},
                {"key": "reddit", "query": f'"{pname}" review experience', "max": 5, "domains": ["reddit.com"]},
                {"key": "beauty", "query": f'"{pname}" review', "max": 3, "domains": [nykaa, "makeupalley.com"]},
                {"key": "youtube", "query": f'"{pname}" honest review', "max": 3, "domains": ["youtube.com"]},
            ]
            r = await _research_with_tavily(
                STAGE2B_SYSTEM,
                f"Product: {pname}\nBrand: {brand}\nMarket: {market}\nSynthesize user reviews.",
                tavily_queries=queries, max_tokens=16384, stage="reviews", context_budget=10000,
            )
            await _update_research(rid, review_synthesis=r)
            logger.info(f"  [reviews] done ({len(r)} chars)")
            return r

        async def _branch_experts():
            top_actives = " ".join(inci.split(",")[:5]) if inci else pname
            queries = [
                {"key": "derm", "query": f'"{pname}" dermatologist review', "max": 5, "domains": ["youtube.com"]},
                {"key": "expert", "query": f'"{pname}" expert opinion review', "max": 5},
                {"key": "pubmed", "query": f'{top_actives} skin clinical study', "max": 3, "domains": ["pubmed.ncbi.nlm.nih.gov"]},
            ]
            r = await _research_with_tavily(
                STAGE2C_SYSTEM,
                f"Product: {pname}\nBrand: {brand}\nKey ingredients: {inci[:300]}\nAnalyze expert reviews.",
                tavily_queries=queries, max_tokens=16384, stage="experts", context_budget=8000,
            )
            await _update_research(rid, expert_reviews=r)
            logger.info(f"  [experts] done ({len(r)} chars)")
            return r

        async def _branch_brand():
            r = await _research_with_search(
                STAGE2D_SYSTEM,
                f"Brand: {brand}\nParent: {parent}\nResearch brand history, reputation, controversies.",
                max_tokens=16384, stage="brand",
            )
            await _update_research(rid, brand_intelligence=r)
            logger.info(f"  [brand] done ({len(r)} chars)")
            return r

        async def _branch_claims():
            claims_text = ", ".join(claims[:5]) if claims else pname
            queries = [
                {"key": "evidence", "query": f'"{pname}" {claims_text} evidence', "max": 5},
                {"key": "alternatives", "query": f'best {category} alternative to "{pname}" {market}', "max": 5},
                {"key": "comparison", "query": f'"{pname}" vs comparison {category}', "max": 3},
            ]
            r = await _research_with_tavily(
                STAGE2E_SYSTEM,
                f"Product: {pname}\nBrand: {brand}\nCategory: {category}\nPrice: {price}\nMarket: {market}\nClaims: {chr(10).join(claims)}\nVerify claims and find alternatives.",
                tavily_queries=queries, max_tokens=16384, stage="claims", context_budget=8000,
            )
            await _update_research(rid, claims_alternatives=r)
            logger.info(f"  [claims] done ({len(r)} chars)")
            return r

        branch_results = await asyncio.gather(
            _branch_ingredients(), _branch_reviews(), _branch_experts(),
            _branch_brand(), _branch_claims(),
        )

        # ── STAGE 3: Overlay ──────────────────────────────────
        await _update_research(rid, current_stage="compiling")
        logger.info(f"[Research #{rid}] Stage 3: Overlay...")

        ctx_parts = [f"PRODUCT: {json.dumps(product_data, indent=2)[:3000]}"]
        for label, text in zip(["INGREDIENTS","REVIEWS","EXPERTS","BRAND","CLAIMS"], branch_results):
            ctx_parts.append(f"\n━━━ {label} ━━━\n{(text or '')[:4000]}")

        overlay = await _research_no_search(
            STAGE3_OVERLAY_SYSTEM,
            f"Product: {pname}\n\nResearch excerpts:\n{''.join(ctx_parts)}\n\nWrite TL;DR, §7 Usage, §8 Report Card.",
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
        report_md = "\n".join(p for p in report_parts if p)

        elapsed = time.time() - start
        await _update_research(rid,
            tldr=tldr, usage_protocol=sec7,
            report_card=_parse_report_card(sec8),
            report_markdown=report_md,
            duration_seconds=round(elapsed, 1),
            status="completed", current_stage="done",
        )
        logger.info(f"[Research #{rid}] Completed in {elapsed:.0f}s")

    except Exception as e:
        logger.error(f"[Research #{rid}] Failed: {e}")
        await _update_research(rid, status="failed", current_stage="failed", error_message=str(e))

    return research
