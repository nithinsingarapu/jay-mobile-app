"""Content pipeline: search web sources -> store preview cards with redirect URLs.

Each content item is a card: title, snippet, image, source URL.
Clicking opens the original page. No content republishing — just curated links.
"""
import json
import asyncio
import logging
import re
import unicodedata
from datetime import datetime, timezone

from google import genai
from google.genai.types import GenerateContentConfig
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.config import get_settings
from .models import Ingredient, Article, Concern, Myth, Tip
from .fetchers import (
    serper_search, pubmed_search, incidecoder_ingredient,
    dermnet_condition, reddit_search, FetchResult,
)
from .prompts import (
    INGREDIENT_PROMPT, CONCERN_PROMPT, MYTHS_PROMPT, TIPS_PROMPT,
    build_sources_block,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")


def _gemini_client():
    return genai.Client(api_key=get_settings().gemini_api_key)


def _parse_json(text: str) -> dict | list | None:
    cleaned = text.strip()
    # Strip markdown fences
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?\s*```\s*$", "", cleaned)

    # Try direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try finding complete JSON object/array
    for sc, ec in [('{', '}'), ('[', ']')]:
        s, e = cleaned.find(sc), cleaned.rfind(ec)
        if s != -1 and e > s:
            try:
                return json.loads(cleaned[s:e + 1])
            except json.JSONDecodeError:
                continue

    # Truncated array recovery: find last complete object in a truncated array
    arr_start = cleaned.find('[')
    if arr_start != -1:
        # Find the last complete }, then close the array
        last_brace = cleaned.rfind('}')
        if last_brace > arr_start:
            candidate = cleaned[arr_start:last_brace + 1] + ']'
            try:
                result = json.loads(candidate)
                if isinstance(result, list) and len(result) > 0:
                    logger.info(f"Recovered {len(result)} items from truncated JSON")
                    return result
            except json.JSONDecodeError:
                pass

    logger.error(f"JSON parse failed: {text[:300]}")
    return None


async def _ask_gemini(prompt: str, max_tokens: int = 8192) -> str:
    client = _gemini_client()
    config = GenerateContentConfig(temperature=0.2, max_output_tokens=max_tokens)
    try:
        resp = await client.aio.models.generate_content(
            model="gemini-2.5-flash", contents=prompt, config=config,
        )
        return resp.text or ""
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return ""


async def _serper_with_images(query: str, num: int = 8) -> list[dict]:
    """Serper search returning results with images. Each dict has: title, snippet, link, image_url, source_name."""
    api_key = get_settings().serper_api_key
    if not api_key:
        return []
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                json={"q": query, "gl": "in", "hl": "en", "num": num},
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"Serper failed for '{query}': {e}")
        return []

    results = []
    for item in data.get("organic", [])[:num]:
        link = item.get("link", "")
        domain = ""
        try:
            from urllib.parse import urlparse
            domain = urlparse(link).netloc.replace("www.", "")
        except Exception:
            domain = link

        results.append({
            "title": item.get("title", ""),
            "snippet": item.get("snippet", ""),
            "link": link,
            "image_url": item.get("thumbnail") or item.get("imageUrl") or None,
            "source_name": domain,
        })
    return results


async def _fetch_image(query: str) -> str | None:
    """Serper image search — returns first valid image URL."""
    api_key = get_settings().serper_api_key
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://google.serper.dev/images",
                json={"q": query, "gl": "in", "num": 5},
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            for img in resp.json().get("images", []):
                url = img.get("imageUrl", "")
                if url.startswith("http") and not url.startswith("data:"):
                    return url
    except Exception as e:
        logger.debug(f"Image search failed: {e}")
    return None


def _collect(gathered: list) -> list[FetchResult]:
    out: list[FetchResult] = []
    for r in gathered:
        if isinstance(r, FetchResult) and r.raw_text.strip():
            out.append(r)
        elif isinstance(r, list):
            out.extend(fr for fr in r if isinstance(fr, FetchResult) and fr.raw_text.strip())
    return out


# ═══════════════════════════════════════════════════════════════════════════════
# 1. INGREDIENTS — structured data from Incidecoder + PubMed + Serper
#    (ingredients need actual structured data, not just links)
# ═══════════════════════════════════════════════════════════════════════════════

async def fetch_all_ingredients(names: list[str], db: AsyncSession) -> int:
    count = 0
    for name in names:
        try:
            result = await fetch_ingredient(name, db)
            if result:
                count += 1
                logger.info(f"  [ingredient] OK: {name}")
        except Exception as e:
            logger.error(f"  [ingredient] ERROR {name}: {e}")
    return count


async def fetch_ingredient(name: str, db: AsyncSession) -> Ingredient | None:
    slug = slugify(name)

    # Primary: Serper searches (most reliable) + Incidecoder + PubMed as bonus
    serper1 = await _serper_with_images(f"{name} skincare ingredient benefits uses", num=8)
    serper2 = await _serper_with_images(f"{name} for skin what it does side effects", num=5)

    # Build source text from Serper snippets (title + snippet)
    all_r: list[FetchResult] = []
    for r in serper1 + serper2:
        if r["title"] and r["snippet"]:
            all_r.append(FetchResult(
                raw_text=f"{r['title']}\n{r['snippet']}",
                source_url=r["link"],
                source_name=r["source_name"],
            ))

    # Bonus: try Incidecoder and PubMed (non-blocking)
    try:
        inci = await incidecoder_ingredient(slug)
        if inci.raw_text.strip():
            all_r.append(inci)
    except Exception:
        pass
    try:
        pm = await pubmed_search(name, max_results=2)
        all_r.extend(p for p in pm if p.raw_text.strip())
    except Exception:
        pass

    src = build_sources_block(all_r)
    if not src.strip():
        logger.warning(f"No source data for ingredient '{name}'")
        return None

    data = _parse_json(await _ask_gemini(INGREDIENT_PROMPT.format(name=name, sources_block=src)))
    if not data or not isinstance(data, dict):
        return None

    # Image: try multiple queries for best result
    image_url = await _fetch_image(f"{name} skincare ingredient")
    if not image_url:
        image_url = await _fetch_image(f"{name} serum product")
    if not image_url:
        image_url = await _fetch_image(name)
    now = datetime.now(timezone.utc)
    source_list = [{"url": r.source_url, "name": r.source_name} for r in all_r if r.source_url]

    existing = (await db.execute(select(Ingredient).where(Ingredient.slug == slug))).scalar_one_or_none()
    if existing:
        for k, v in data.items():
            if hasattr(existing, k) and v is not None:
                setattr(existing, k, v)
        existing.image_url = image_url or existing.image_url
        existing.sources = source_list
        existing.fetched_at = now
        await db.commit()
        return existing

    obj = Ingredient(name=name, slug=slug, image_url=image_url, sources=source_list, fetched_at=now)
    for k, v in data.items():
        if hasattr(obj, k) and v is not None:
            setattr(obj, k, v)
    db.add(obj)
    await db.commit()
    return obj


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ARTICLES — curated link cards from Serper
#    title + snippet + image + redirect URL to original article
# ═══════════════════════════════════════════════════════════════════════════════

async def fetch_all_articles(topics: list[str], db: AsyncSession) -> int:
    count = 0
    for topic in topics:
        try:
            result = await fetch_article(topic, db)
            if result:
                count += 1
                logger.info(f"  [article] OK: {topic}")
        except Exception as e:
            logger.error(f"  [article] ERROR {topic}: {e}")
    return count


async def fetch_article(topic: str, db: AsyncSession) -> Article | None:
    slug = slugify(topic)

    # Search for real articles on this topic
    results = await _serper_with_images(f"{topic} dermatologist guide", num=5)
    if not results:
        results = await _serper_with_images(topic, num=5)
    if not results:
        return None

    # Pick the best result (first one)
    best = results[0]

    # Always run dedicated image search for high-quality hero image
    image_url = await _fetch_image(f"{best['title']} skincare article")
    if not image_url:
        image_url = await _fetch_image(f"{topic} skincare")
    if not image_url:
        image_url = best.get("image_url")  # Serper thumbnail as last resort

    # Use Gemini to classify the article type and extract tags
    classify_prompt = f"""Classify this article and extract metadata. Output ONLY valid JSON.

Title: {best['title']}
Snippet: {best['snippet']}
Source: {best['source_name']}
Topic query: {topic}

JSON schema:
{{
  "type": "guide_101|expert_tip|editorial|popular_read",
  "departments": ["skincare|haircare|bodycare"],
  "concerns": ["acne|aging|pigmentation|dryness|sensitivity|dullness|hair_fall|dandruff|frizz"],
  "tags": ["string"],
  "read_time_minutes": 5
}}"""
    meta = _parse_json(await _ask_gemini(classify_prompt, max_tokens=500))
    if not meta or not isinstance(meta, dict):
        meta = {"type": "guide_101", "departments": ["skincare"], "tags": [], "read_time_minutes": 5}

    now = datetime.now(timezone.utc)
    values = {
        "title": best["title"],
        "type": meta.get("type", "guide_101"),
        "summary": best["snippet"],
        "body": None,  # No republished content — redirect to source
        "author_name": None,
        "author_credential": None,
        "image_url": image_url,
        "read_time_minutes": meta.get("read_time_minutes", 5),
        "tags": meta.get("tags"),
        "departments": meta.get("departments", ["skincare"]),
        "concerns": meta.get("concerns"),
        "source_url": best["link"],  # THE REDIRECT URL
        "source_name": best["source_name"],
        "fetched_at": now,
    }

    existing = (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none()
    if existing:
        for k, v in values.items():
            if v is not None:
                setattr(existing, k, v)
        await db.commit()
        return existing

    article = Article(slug=slug, **{k: v for k, v in values.items() if v is not None})
    db.add(article)
    await db.commit()
    return article


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CONCERNS — structured data from DermNet + PubMed, with source links
# ═══════════════════════════════════════════════════════════════════════════════

async def fetch_all_concerns(names: list[str], db: AsyncSession) -> int:
    count = 0
    for name in names:
        try:
            result = await fetch_concern(name, db)
            if result:
                count += 1
                logger.info(f"  [concern] OK: {name}")
        except Exception as e:
            logger.error(f"  [concern] ERROR {name}: {e}")
    return count


async def fetch_concern(name: str, db: AsyncSession) -> Concern | None:
    slug = slugify(name)

    results = await asyncio.gather(
        dermnet_condition(slug),
        pubmed_search(f"{name} skin treatment", max_results=3),
        serper_search(f"{name} causes treatment skincare dermatologist", num=5),
        return_exceptions=True,
    )
    all_r = _collect(results)

    if not all_r:
        fb = await asyncio.gather(
            serper_search(f"what is {name} skin condition treatment", num=5),
            return_exceptions=True,
        )
        all_r = _collect(fb)

    src = build_sources_block(all_r)
    if not src.strip():
        return None

    data = _parse_json(await _ask_gemini(CONCERN_PROMPT.format(name=name, sources_block=src)))
    if not data or not isinstance(data, dict):
        return None

    img_query = data.pop("image_search_query", f"{name} skin condition")
    image_url = await _fetch_image(img_query)
    if not image_url:
        image_url = await _fetch_image(f"{name} skincare treatment")
    now = datetime.now(timezone.utc)
    source_list = [{"url": r.source_url, "name": r.source_name} for r in all_r if r.source_url]

    existing = (await db.execute(select(Concern).where(Concern.slug == slug))).scalar_one_or_none()
    if existing:
        for k, v in data.items():
            if hasattr(existing, k) and v is not None:
                setattr(existing, k, v)
        existing.image_url = image_url or existing.image_url
        existing.sources = source_list
        existing.fetched_at = now
        await db.commit()
        return existing

    obj = Concern(name=name, slug=slug, image_url=image_url, sources=source_list, fetched_at=now)
    for k, v in data.items():
        if hasattr(obj, k) and v is not None:
            setattr(obj, k, v)
    db.add(obj)
    await db.commit()
    return obj


# ═══════════════════════════════════════════════════════════════════════════════
# 4. MYTHS — curated myth-busting cards from Serper + Gemini extraction
# ═══════════════════════════════════════════════════════════════════════════════

async def fetch_all_myths(departments: list[str], db: AsyncSession) -> int:
    count = 0
    for dept in departments:
        try:
            result = await fetch_myths(dept, db)
            count += len(result)
            logger.info(f"  [myths] OK: {dept} ({len(result)} myths)")
        except Exception as e:
            logger.error(f"  [myths] ERROR {dept}: {e}")
    return count


async def fetch_myths(department: str, db: AsyncSession, count: int = 6) -> list[Myth]:
    # Find myth-busting articles via Serper
    results = await _serper_with_images(
        f"common {department} myths debunked dermatologist", num=8,
    )
    results2 = await _serper_with_images(
        f"{department} skincare facts vs fiction wrong beliefs", num=8,
    )
    all_serper = results + results2

    if not all_serper:
        return []

    # Build source text from snippets (titles + snippets are enough for myth extraction)
    source_parts = []
    for i, r in enumerate(all_serper, 1):
        source_parts.append(
            f"---SOURCE {i}: {r['source_name']} ({r['link']})---\n{r['title']}\n{r['snippet']}"
        )
    sources_block = "\n\n".join(source_parts)

    data = _parse_json(await _ask_gemini(MYTHS_PROMPT.format(count=count, sources_block=sources_block)))
    if not data or not isinstance(data, list):
        return []

    now = datetime.now(timezone.utc)
    myths = []
    for item in data:
        if not item.get("myth"):
            continue
        # Use source_url from the Serper result that this myth came from
        src_url = item.get("source_url")
        src_name = item.get("source_name")
        # If Gemini didn't provide a URL, use the first Serper result
        if not src_url and all_serper:
            src_url = all_serper[0]["link"]
            src_name = all_serper[0]["source_name"]

        myth = Myth(
            myth=item["myth"], truth=item.get("truth", ""),
            explanation=item.get("explanation"),
            source_url=src_url, source_name=src_name,
            departments=item.get("departments", [department]),
            tags=item.get("tags"), fetched_at=now,
        )
        db.add(myth)
        myths.append(myth)
    await db.commit()
    return myths


# ═══════════════════════════════════════════════════════════════════════════════
# 5. TIPS — curated tip cards from Serper + Gemini extraction
# ═══════════════════════════════════════════════════════════════════════════════

async def fetch_all_tips(departments: list[str], db: AsyncSession) -> int:
    count = 0
    for dept in departments:
        try:
            result = await fetch_tips(dept, db)
            count += len(result)
            logger.info(f"  [tips] OK: {dept} ({len(result)} tips)")
        except Exception as e:
            logger.error(f"  [tips] ERROR {dept}: {e}")
    return count


async def fetch_tips(department: str, db: AsyncSession, count: int = 6) -> list[Tip]:
    # Find tip articles via Serper
    results = await _serper_with_images(
        f"best {department} tips dermatologist recommended 2024", num=8,
    )
    results2 = await _serper_with_images(
        f"{department} routine tips mistakes to avoid expert", num=8,
    )
    all_serper = results + results2

    if not all_serper:
        return []

    # Build source text from snippets
    source_parts = []
    for i, r in enumerate(all_serper, 1):
        source_parts.append(
            f"---SOURCE {i}: {r['source_name']} ({r['link']})---\n{r['title']}\n{r['snippet']}"
        )
    sources_block = "\n\n".join(source_parts)

    data = _parse_json(await _ask_gemini(TIPS_PROMPT.format(count=count, sources_block=sources_block)))
    if not data or not isinstance(data, list):
        return []

    now = datetime.now(timezone.utc)
    tips = []
    for item in data:
        if not item.get("title"):
            continue
        src_url = item.get("source_url")
        src_name = item.get("source_name")
        if not src_url and all_serper:
            src_url = all_serper[0]["link"]
            src_name = all_serper[0]["source_name"]

        tip = Tip(
            title=item["title"], body=item.get("body", ""),
            category=item.get("category"),
            source_url=src_url, source_name=src_name,
            departments=item.get("departments", [department]),
            tags=item.get("tags"), fetched_at=now,
        )
        db.add(tip)
        tips.append(tip)
    await db.commit()
    return tips
