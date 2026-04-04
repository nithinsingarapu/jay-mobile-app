"""Content pipeline: fetch from sources -> structure with Gemini -> upsert to DB."""
import json
import asyncio
import logging
import re
from datetime import datetime, timezone
from slugify import slugify

from google import genai
from google.genai.types import GenerateContentConfig
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from .models import Ingredient, Article, Concern, Myth, Tip
from .fetchers import (
    serper_search, pubmed_search, incidecoder_ingredient,
    dermnet_condition, youtube_transcript, reddit_search, fetch_webpage,
    FetchResult,
)
from .prompts import (
    INGREDIENT_PROMPT, ARTICLE_PROMPT, CONCERN_PROMPT,
    MYTHS_PROMPT, TIPS_PROMPT, build_sources_block,
)

logger = logging.getLogger(__name__)


def _gemini_client():
    return genai.Client(api_key=get_settings().gemini_api_key)


def _parse_json(text: str) -> dict | list | None:
    """Extract JSON from Gemini response, stripping markdown fences."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini JSON: {text[:300]}")
        return None


async def _ask_gemini(prompt: str, max_tokens: int = 4096) -> str:
    """Single Gemini call, returns raw text response."""
    client = _gemini_client()
    config = GenerateContentConfig(temperature=0.2, max_output_tokens=max_tokens)
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config,
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return ""


async def _fetch_image_url(query: str) -> str | None:
    """Use Serper image search to find a relevant image."""
    api_key = get_settings().serper_api_key
    if not api_key:
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://google.serper.dev/images",
                json={"q": query, "gl": "in", "num": 3},
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            images = resp.json().get("images", [])
            for img in images:
                url = img.get("imageUrl", "")
                if url.startswith("http") and not url.startswith("data:"):
                    return url
    except Exception as e:
        logger.debug(f"Image search failed: {e}")
    return None


def _collect_results(gathered: list) -> list[FetchResult]:
    """Flatten asyncio.gather results (mix of FetchResult and list[FetchResult])."""
    all_results: list[FetchResult] = []
    for r in gathered:
        if isinstance(r, FetchResult) and r.raw_text.strip():
            all_results.append(r)
        elif isinstance(r, list):
            all_results.extend(fr for fr in r if isinstance(fr, FetchResult) and fr.raw_text.strip())
    return all_results


# -- Ingredient Pipeline ----------------------------------------------------------

async def fetch_ingredient(name: str, db: AsyncSession) -> Ingredient | None:
    slug = slugify(name)

    results = await asyncio.gather(
        incidecoder_ingredient(slug),
        pubmed_search(name, max_results=2),
        serper_search(f'"{name}" skincare ingredient benefits site:paulaschoice.com OR site:ncbi.nlm.nih.gov', num=3),
        return_exceptions=True,
    )

    all_results = _collect_results(results)
    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        logger.warning(f"No source data found for ingredient '{name}'")
        return None

    prompt = INGREDIENT_PROMPT.format(name=name, sources_block=sources_block)
    raw = await _ask_gemini(prompt)
    data = _parse_json(raw)
    if not data or not isinstance(data, dict):
        return None

    image_url = await _fetch_image_url(f"{name} skincare ingredient")
    now = datetime.now(timezone.utc)
    source_list = [{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url]

    existing = (await db.execute(select(Ingredient).where(Ingredient.slug == slug))).scalar_one_or_none()
    if existing:
        for key, val in data.items():
            if hasattr(existing, key) and val is not None:
                setattr(existing, key, val)
        existing.image_url = image_url or existing.image_url
        existing.sources = source_list
        existing.fetched_at = now
        await db.commit()
        return existing

    ingredient = Ingredient(name=name, slug=slug, image_url=image_url, sources=source_list, fetched_at=now)
    for key, val in data.items():
        if hasattr(ingredient, key) and val is not None:
            setattr(ingredient, key, val)
    db.add(ingredient)
    await db.commit()
    return ingredient


# -- Article Pipeline -------------------------------------------------------------

async def fetch_article(topic: str, db: AsyncSession) -> Article | None:
    slug = slugify(topic)

    serper_results = await serper_search(f"{topic} skincare guide", num=5)
    page_tasks = [fetch_webpage(r.source_url) for r in serper_results[:3] if r.source_url]
    pages = await asyncio.gather(*page_tasks, return_exceptions=True)
    all_results = _collect_results(pages)

    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        return None

    prompt = ARTICLE_PROMPT.format(topic=topic, sources_block=sources_block)
    raw = await _ask_gemini(prompt, max_tokens=6000)
    data = _parse_json(raw)
    if not data or not isinstance(data, dict):
        return None

    image_query = data.pop("image_search_query", f"{topic} skincare")
    image_url = await _fetch_image_url(image_query)
    primary_source = all_results[0] if all_results else None
    now = datetime.now(timezone.utc)

    values = {
        "title": data.get("title", topic.title()),
        "type": data.get("type", "guide_101"),
        "summary": data.get("summary"),
        "body": data.get("body"),
        "author_name": data.get("author_name"),
        "author_credential": data.get("author_credential"),
        "image_url": image_url,
        "read_time_minutes": data.get("read_time_minutes", 5),
        "tags": data.get("tags"),
        "departments": data.get("departments"),
        "concerns": data.get("concerns"),
        "source_url": primary_source.source_url if primary_source else None,
        "source_name": primary_source.source_name if primary_source else None,
        "fetched_at": now,
    }

    existing = (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none()
    if existing:
        for key, val in values.items():
            if val is not None:
                setattr(existing, key, val)
        await db.commit()
        return existing

    article = Article(slug=slug, **{k: v for k, v in values.items() if v is not None})
    db.add(article)
    await db.commit()
    return article


# -- Concern Pipeline -------------------------------------------------------------

async def fetch_concern(name: str, db: AsyncSession) -> Concern | None:
    slug = slugify(name)

    results = await asyncio.gather(
        dermnet_condition(slug),
        pubmed_search(f"{name} skin treatment", max_results=2),
        serper_search(f"{name} causes treatment skincare dermatologist", num=3),
        return_exceptions=True,
    )

    all_results = _collect_results(results)
    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        return None

    prompt = CONCERN_PROMPT.format(name=name, sources_block=sources_block)
    raw = await _ask_gemini(prompt, max_tokens=4096)
    data = _parse_json(raw)
    if not data or not isinstance(data, dict):
        return None

    image_query = data.pop("image_search_query", f"{name} skin condition")
    image_url = await _fetch_image_url(image_query)
    now = datetime.now(timezone.utc)
    source_list = [{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url]

    existing = (await db.execute(select(Concern).where(Concern.slug == slug))).scalar_one_or_none()
    if existing:
        for key, val in data.items():
            if hasattr(existing, key) and val is not None:
                setattr(existing, key, val)
        existing.image_url = image_url or existing.image_url
        existing.sources = source_list
        existing.fetched_at = now
        await db.commit()
        return existing

    concern = Concern(name=name, slug=slug, image_url=image_url, sources=source_list, fetched_at=now)
    for key, val in data.items():
        if hasattr(concern, key) and val is not None:
            setattr(concern, key, val)
    db.add(concern)
    await db.commit()
    return concern


# -- Myths Pipeline ---------------------------------------------------------------

async def fetch_myths(department: str, db: AsyncSession, count: int = 10) -> list[Myth]:
    results = await asyncio.gather(
        reddit_search(f"skincare myths debunked {department}", limit=5),
        serper_search(f"common {department} myths facts dermatologist", num=5),
        return_exceptions=True,
    )
    all_results = _collect_results(results)

    # Follow top serper links for richer content
    for r in list(all_results)[:3]:
        if r.source_url and "reddit.com" not in r.source_url:
            page = await fetch_webpage(r.source_url)
            if page.raw_text.strip():
                all_results.append(page)

    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        return []

    prompt = MYTHS_PROMPT.format(count=count, sources_block=sources_block)
    raw = await _ask_gemini(prompt, max_tokens=4096)
    data = _parse_json(raw)
    if not data or not isinstance(data, list):
        return []

    now = datetime.now(timezone.utc)
    myths = []
    for item in data:
        if not item.get("myth"):
            continue
        myth = Myth(
            myth=item["myth"],
            truth=item.get("truth", ""),
            explanation=item.get("explanation"),
            source_url=item.get("source_url"),
            source_name=item.get("source_name"),
            departments=item.get("departments", [department]),
            tags=item.get("tags"),
            fetched_at=now,
        )
        db.add(myth)
        myths.append(myth)
    await db.commit()
    return myths


# -- Tips Pipeline ----------------------------------------------------------------

async def fetch_tips(department: str, db: AsyncSession, count: int = 10) -> list[Tip]:
    results = await asyncio.gather(
        reddit_search(f"best {department} tips routine", limit=5),
        youtube_transcript(f"{department} tips dermatologist"),
        serper_search(f"top {department} tips dermatologist recommended", num=5),
        return_exceptions=True,
    )
    all_results = _collect_results(results)

    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        return []

    prompt = TIPS_PROMPT.format(count=count, sources_block=sources_block)
    raw = await _ask_gemini(prompt, max_tokens=4096)
    data = _parse_json(raw)
    if not data or not isinstance(data, list):
        return []

    now = datetime.now(timezone.utc)
    tips = []
    for item in data:
        if not item.get("title"):
            continue
        tip = Tip(
            title=item["title"],
            body=item.get("body", ""),
            category=item.get("category"),
            source_url=item.get("source_url"),
            source_name=item.get("source_name"),
            departments=item.get("departments", [department]),
            tags=item.get("tags"),
            fetched_at=now,
        )
        db.add(tip)
        tips.append(tip)
    await db.commit()
    return tips
