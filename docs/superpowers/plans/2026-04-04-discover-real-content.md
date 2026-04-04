# Discover Real Content Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock editorial content in the Discover section with real web-sourced data, attributed to original sources, using a multi-source aggregator + Gemini structurer pipeline.

**Architecture:** Seven source fetchers (Serper, PubMed, Incidecoder, DermNet, YouTube, Reddit, Webpage) feed raw text into an aggregator. Gemini 2.5 Flash structures and categorizes the raw data into typed database records. Batch job pre-populates ~170 items weekly; on-demand pipeline fills gaps at request time.

**Tech Stack:** FastAPI, SQLAlchemy async, PostgreSQL, Alembic, httpx, BeautifulSoup4, youtube-transcript-api, google-genai, Serper.dev API

**Spec:** `docs/superpowers/specs/2026-04-04-discover-real-content-design.md`

---

## File Map

### Backend — New feature: `jay-backend/app/features/content/`

| File | Responsibility |
|------|---------------|
| `__init__.py` | Package init |
| `models.py` | SQLAlchemy models: Ingredient, Article, Concern, Myth, Tip |
| `schemas.py` | Pydantic schemas: IngredientOut, ArticleOut, ConcernOut, MythOut, TipOut |
| `router.py` | API endpoints: GET /ingredients, /articles, /concerns, /myths, /tips |
| `service.py` | DB queries + on-demand pipeline trigger |
| `pipeline.py` | Orchestrator: aggregator → LLM structurer → DB upsert |
| `prompts.py` | Gemini prompt templates per content type |
| `seed_data.py` | Seed lists for batch pipeline |
| `batch_job.py` | CLI entry point for weekly cron |
| `fetchers/__init__.py` | Fetcher exports |
| `fetchers/base.py` | BaseFetcher abstract class + FetchResult dataclass |
| `fetchers/serper.py` | Google Search via Serper.dev |
| `fetchers/pubmed.py` | PubMed E-utilities |
| `fetchers/incidecoder.py` | Incidecoder.com scraper |
| `fetchers/dermnet.py` | DermNet NZ scraper |
| `fetchers/youtube.py` | YouTube transcript extractor |
| `fetchers/reddit.py` | Reddit JSON fetcher |
| `fetchers/webpage.py` | Generic URL → clean text |

### Backend — Modified files

| File | Change |
|------|--------|
| `jay-backend/app/main.py` | Register content router |
| `jay-backend/alembic/env.py` | Import content models |

### Frontend — New files

| File | Responsibility |
|------|---------------|
| `jay-app/services/content.ts` | API client for content endpoints |
| `jay-app/stores/contentStore.ts` | Zustand store for content data |
| `jay-app/components/discover/SourceAttribution.tsx` | "Source: X" link component |

### Frontend — Modified files

| File | Change |
|------|--------|
| `jay-app/components/discover/ForYouTab.tsx` | Replace mock data with contentStore |
| `jay-app/components/discover/LearnTab.tsx` | Replace mock data with contentStore |
| `jay-app/app/(screens)/product-detail.tsx` | Wire alternatives tab to real API |

---

## Task 1: Database Models

**Files:**
- Create: `jay-backend/app/features/content/__init__.py`
- Create: `jay-backend/app/features/content/models.py`

- [ ] **Step 1: Create package and models file**

```python
# jay-backend/app/features/content/__init__.py
```

```python
# jay-backend/app/features/content/models.py
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Ingredient(Base):
    __tablename__ = "content_ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    also_known_as: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    what_it_does: Mapped[str | None] = mapped_column(Text, nullable=True)
    how_it_works: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefits: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    who_its_for: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    avoid_with: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    safety_rating: Mapped[str | None] = mapped_column(String(20), nullable=True)
    concentration_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    facts: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Article(Base):
    __tablename__ = "content_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    author_credential: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    read_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    concerns: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Concern(Base):
    __tablename__ = "content_concerns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    causes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    symptoms: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    treatments: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    recommended_ingredients: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    avoid_ingredients: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    lifestyle_tips: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    severity_levels: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Myth(Base):
    __tablename__ = "content_myths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    myth: Mapped[str] = mapped_column(Text, nullable=False)
    truth: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Tip(Base):
    __tablename__ = "content_tips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departments: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 2: Register models in Alembic env.py**

Add this import to `jay-backend/alembic/env.py` alongside the existing model imports:

```python
from app.features.content.models import Ingredient, Article, Concern, Myth, Tip
```

- [ ] **Step 3: Generate and run migration**

```bash
cd jay-backend
alembic revision --autogenerate -m "add content tables for discover"
alembic upgrade head
```

- [ ] **Step 4: Commit**

```bash
git add jay-backend/app/features/content/__init__.py jay-backend/app/features/content/models.py jay-backend/alembic/
git commit -m "feat(content): add database models for 5 content tables"
```

---

## Task 2: Pydantic Schemas

**Files:**
- Create: `jay-backend/app/features/content/schemas.py`

- [ ] **Step 1: Write schemas**

```python
# jay-backend/app/features/content/schemas.py
from pydantic import BaseModel
from datetime import datetime


class SourcedFact(BaseModel):
    text: str
    source_url: str | None = None
    source_name: str | None = None


class IngredientOut(BaseModel):
    id: int
    name: str
    slug: str
    also_known_as: list[str] | None = None
    category: str | None = None
    what_it_does: str | None = None
    how_it_works: str | None = None
    benefits: list[str] | None = None
    who_its_for: list[str] | None = None
    avoid_with: list[str] | None = None
    safety_rating: str | None = None
    concentration_range: str | None = None
    facts: list[SourcedFact] | None = None
    image_url: str | None = None
    sources: list[dict] | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class ArticleOut(BaseModel):
    id: int
    slug: str
    title: str
    type: str
    summary: str | None = None
    body: str | None = None
    author_name: str | None = None
    author_credential: str | None = None
    author_image_url: str | None = None
    image_url: str | None = None
    read_time_minutes: int | None = None
    tags: list[str] | None = None
    departments: list[str] | None = None
    concerns: list[str] | None = None
    source_url: str | None = None
    source_name: str | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConcernOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    causes: list[SourcedFact] | None = None
    symptoms: list[SourcedFact] | None = None
    treatments: list[SourcedFact] | None = None
    recommended_ingredients: list[str] | None = None
    avoid_ingredients: list[str] | None = None
    lifestyle_tips: list[SourcedFact] | None = None
    image_url: str | None = None
    severity_levels: dict | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    sources: list[dict] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class MythOut(BaseModel):
    id: int
    myth: str
    truth: str
    explanation: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}


class TipOut(BaseModel):
    id: int
    title: str
    body: str
    category: str | None = None
    source_url: str | None = None
    source_name: str | None = None
    departments: list[str] | None = None
    tags: list[str] | None = None
    fetched_at: datetime | None = None

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Commit**

```bash
git add jay-backend/app/features/content/schemas.py
git commit -m "feat(content): add pydantic schemas for content API"
```

---

## Task 3: Source Fetchers

**Files:**
- Create: `jay-backend/app/features/content/fetchers/base.py`
- Create: `jay-backend/app/features/content/fetchers/__init__.py`
- Create: `jay-backend/app/features/content/fetchers/serper.py`
- Create: `jay-backend/app/features/content/fetchers/pubmed.py`
- Create: `jay-backend/app/features/content/fetchers/incidecoder.py`
- Create: `jay-backend/app/features/content/fetchers/dermnet.py`
- Create: `jay-backend/app/features/content/fetchers/youtube.py`
- Create: `jay-backend/app/features/content/fetchers/reddit.py`
- Create: `jay-backend/app/features/content/fetchers/webpage.py`

- [ ] **Step 1: Install dependencies**

```bash
cd jay-backend
pip install beautifulsoup4 youtube-transcript-api lxml
pip freeze | grep -E "beautifulsoup4|youtube-transcript-api|lxml" >> requirements.txt
```

- [ ] **Step 2: Create base fetcher**

```python
# jay-backend/app/features/content/fetchers/base.py
from __future__ import annotations
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class FetchResult:
    raw_text: str
    source_url: str
    source_name: str
    success: bool = True
    error: str | None = None


EMPTY_RESULT = FetchResult(raw_text="", source_url="", source_name="", success=False)
```

```python
# jay-backend/app/features/content/fetchers/__init__.py
from .base import FetchResult, EMPTY_RESULT
from .serper import serper_search
from .pubmed import pubmed_search
from .incidecoder import incidecoder_ingredient
from .dermnet import dermnet_condition
from .youtube import youtube_transcript
from .reddit import reddit_search
from .webpage import fetch_webpage
```

- [ ] **Step 3: Serper fetcher**

```python
# jay-backend/app/features/content/fetchers/serper.py
import httpx
import logging
from app.config import get_settings
from .base import FetchResult, EMPTY_RESULT

logger = logging.getLogger(__name__)


async def serper_search(query: str, num: int = 5) -> list[FetchResult]:
    """Search Google via Serper.dev API, return top results with snippets."""
    api_key = get_settings().serper_api_key
    if not api_key:
        logger.warning("SERPER_API_KEY not set, skipping search")
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
        logger.error(f"Serper search failed for '{query}': {e}")
        return []

    results = []
    for item in data.get("organic", [])[:num]:
        snippet = item.get("snippet", "")
        title = item.get("title", "")
        link = item.get("link", "")
        text = f"{title}\n{snippet}"
        results.append(FetchResult(
            raw_text=text,
            source_url=link,
            source_name=_domain(link),
        ))
    return results


def _domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url
```

- [ ] **Step 4: PubMed fetcher**

```python
# jay-backend/app/features/content/fetchers/pubmed.py
import httpx
import logging
from .base import FetchResult

logger = logging.getLogger(__name__)

ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


async def pubmed_search(query: str, max_results: int = 3) -> list[FetchResult]:
    """Search PubMed for abstracts matching query."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            # Step 1: search for IDs
            search_resp = await client.get(ESEARCH, params={
                "db": "pubmed", "term": f"{query} skincare", "retmax": max_results,
                "retmode": "json", "sort": "relevance",
            })
            search_resp.raise_for_status()
            ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []

            # Step 2: fetch abstracts
            fetch_resp = await client.get(EFETCH, params={
                "db": "pubmed", "id": ",".join(ids), "rettype": "abstract", "retmode": "text",
            })
            fetch_resp.raise_for_status()
            full_text = fetch_resp.text

    except Exception as e:
        logger.error(f"PubMed fetch failed for '{query}': {e}")
        return []

    # Split abstracts (PubMed returns them concatenated with double newlines)
    results = []
    for i, pmid in enumerate(ids):
        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        results.append(FetchResult(
            raw_text=full_text if i == 0 else "",  # full text in first result
            source_url=url,
            source_name="PubMed",
        ))
    return results[:1]  # Return combined abstracts as one result
```

- [ ] **Step 5: Incidecoder fetcher**

```python
# jay-backend/app/features/content/fetchers/incidecoder.py
import httpx
import logging
import asyncio
from bs4 import BeautifulSoup
from .base import FetchResult, EMPTY_RESULT

logger = logging.getLogger(__name__)
BASE = "https://incidecoder.com"


async def incidecoder_ingredient(slug: str) -> FetchResult:
    """Fetch ingredient info from incidecoder.com."""
    url = f"{BASE}/ingredients/{slug}"
    try:
        await asyncio.sleep(1)  # rate limit
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                return EMPTY_RESULT
            soup = BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.error(f"Incidecoder fetch failed for '{slug}': {e}")
        return EMPTY_RESULT

    # Extract main content
    content_div = soup.select_one("#defined-ingredient") or soup.select_one("article") or soup.select_one("main")
    text = content_div.get_text(separator="\n", strip=True) if content_div else soup.get_text(separator="\n", strip=True)

    return FetchResult(raw_text=text[:5000], source_url=url, source_name="Incidecoder")
```

- [ ] **Step 6: DermNet fetcher**

```python
# jay-backend/app/features/content/fetchers/dermnet.py
import httpx
import logging
import asyncio
from bs4 import BeautifulSoup
from .base import FetchResult, EMPTY_RESULT

logger = logging.getLogger(__name__)
BASE = "https://dermnetnz.org"


async def dermnet_condition(slug: str) -> FetchResult:
    """Fetch condition/topic info from DermNet NZ."""
    url = f"{BASE}/topics/{slug}"
    try:
        await asyncio.sleep(1)
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                # Try search fallback
                return await _dermnet_search(slug)
            soup = BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.error(f"DermNet fetch failed for '{slug}': {e}")
        return EMPTY_RESULT

    article = soup.select_one("article") or soup.select_one(".topic__content") or soup.select_one("main")
    text = article.get_text(separator="\n", strip=True) if article else ""
    return FetchResult(raw_text=text[:8000], source_url=url, source_name="DermNet NZ")


async def _dermnet_search(query: str) -> FetchResult:
    """Fallback: search DermNet for the topic."""
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(f"{BASE}/search", params={"q": query}, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, "lxml")
            first_link = soup.select_one("a.search-result__link")
            if first_link and first_link.get("href"):
                href = first_link["href"]
                full_url = href if href.startswith("http") else f"{BASE}{href}"
                page = await client.get(full_url, headers={"User-Agent": "Mozilla/5.0"})
                page_soup = BeautifulSoup(page.text, "lxml")
                article = page_soup.select_one("article") or page_soup.select_one("main")
                text = article.get_text(separator="\n", strip=True) if article else ""
                return FetchResult(raw_text=text[:8000], source_url=full_url, source_name="DermNet NZ")
    except Exception as e:
        logger.error(f"DermNet search failed for '{query}': {e}")
    return EMPTY_RESULT
```

- [ ] **Step 7: YouTube fetcher**

```python
# jay-backend/app/features/content/fetchers/youtube.py
import logging
from .base import FetchResult, EMPTY_RESULT
from .serper import serper_search

logger = logging.getLogger(__name__)

DERM_CHANNELS = ["Dr Dray", "Dr Shereene Idriss", "Doctorly", "Dr Davin Lim", "Hyram"]


async def youtube_transcript(topic: str) -> FetchResult:
    """Get transcript from a dermatologist YouTube video on the topic."""
    query = f"site:youtube.com {topic} skincare dermatologist"
    serper_results = await serper_search(query, num=3)

    for result in serper_results:
        if "youtube.com/watch" not in result.source_url:
            continue
        try:
            video_id = _extract_video_id(result.source_url)
            if not video_id:
                continue

            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            text = " ".join(entry["text"] for entry in transcript_list)
            return FetchResult(
                raw_text=f"YouTube video: {result.raw_text.split(chr(10))[0]}\n\nTranscript:\n{text[:6000]}",
                source_url=result.source_url,
                source_name="YouTube",
            )
        except Exception as e:
            logger.debug(f"Transcript failed for {result.source_url}: {e}")
            continue

    return EMPTY_RESULT


def _extract_video_id(url: str) -> str | None:
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")
    return None
```

- [ ] **Step 8: Reddit fetcher**

```python
# jay-backend/app/features/content/fetchers/reddit.py
import httpx
import logging
import asyncio
from .base import FetchResult

logger = logging.getLogger(__name__)

SUBREDDITS = ["SkincareAddiction", "IndianSkincareAddicts"]


async def reddit_search(query: str, limit: int = 5) -> list[FetchResult]:
    """Search Reddit skincare subs for relevant posts."""
    results = []
    for sub in SUBREDDITS:
        try:
            await asyncio.sleep(1)
            url = f"https://old.reddit.com/r/{sub}/search.json"
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params={
                    "q": query, "restrict_sr": "on", "sort": "relevance", "limit": limit,
                }, headers={"User-Agent": "JAY-Skincare-App/1.0"})
                if resp.status_code != 200:
                    continue
                data = resp.json()
        except Exception as e:
            logger.error(f"Reddit search failed for r/{sub} '{query}': {e}")
            continue

        for post in data.get("data", {}).get("children", []):
            pd = post.get("data", {})
            title = pd.get("title", "")
            selftext = pd.get("selftext", "")
            permalink = pd.get("permalink", "")
            if not title:
                continue
            results.append(FetchResult(
                raw_text=f"{title}\n\n{selftext[:3000]}",
                source_url=f"https://reddit.com{permalink}",
                source_name=f"r/{sub}",
            ))
    return results[:limit]
```

- [ ] **Step 9: Webpage fetcher**

```python
# jay-backend/app/features/content/fetchers/webpage.py
import httpx
import logging
from bs4 import BeautifulSoup
from .base import FetchResult, EMPTY_RESULT

logger = logging.getLogger(__name__)


async def fetch_webpage(url: str) -> FetchResult:
    """Fetch a URL and extract clean article text."""
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                return EMPTY_RESULT
            soup = BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.error(f"Webpage fetch failed for '{url}': {e}")
        return EMPTY_RESULT

    # Remove scripts, styles, nav, footer
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    article = soup.select_one("article") or soup.select_one("[role=main]") or soup.select_one("main") or soup.body
    text = article.get_text(separator="\n", strip=True) if article else ""

    # Clean excessive whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean = "\n".join(lines)

    domain = url.split("//")[-1].split("/")[0].replace("www.", "")
    return FetchResult(raw_text=clean[:8000], source_url=url, source_name=domain)
```

- [ ] **Step 10: Commit**

```bash
git add jay-backend/app/features/content/fetchers/
git commit -m "feat(content): add 7 source fetchers (serper, pubmed, incidecoder, dermnet, youtube, reddit, webpage)"
```

---

## Task 4: Gemini Prompts

**Files:**
- Create: `jay-backend/app/features/content/prompts.py`

- [ ] **Step 1: Write prompt templates**

```python
# jay-backend/app/features/content/prompts.py
"""Gemini prompt templates for structuring web-sourced content."""

INGREDIENT_PROMPT = """You are a skincare content processor. Given raw data from multiple web sources about the ingredient "{name}", produce a structured JSON entry.

RULES:
- Every factual claim MUST cite a source_url from the provided sources
- Categorize into exactly one of: vitamin, acid, peptide, antioxidant, humectant, emollient, surfactant, preservative, botanical, retinoid, exfoliant, other
- Assign departments from: skincare, haircare, bodycare (can be multiple)
- Rate safety: safe | caution | prescription
- Identify which concerns this helps from: acne, aging, pigmentation, dryness, sensitivity, dullness, oiliness, redness, hair_fall, dandruff, frizz, breakage, stretch_marks, body_acne
- Identify conflicting ingredients (e.g. retinol + AHA)
- Assign descriptive tags for discoverability (e.g. "brightening", "anti-inflammatory")
- Do NOT generate information not in the sources. If unsure, omit the field.
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "also_known_as": ["string"],
  "category": "string",
  "what_it_does": "one sentence",
  "how_it_works": "2-3 sentences",
  "benefits": ["string"],
  "who_its_for": ["string — skin types or concerns"],
  "avoid_with": ["ingredient names"],
  "safety_rating": "safe|caution|prescription",
  "concentration_range": "e.g. 2-5% or null",
  "facts": [{{"text": "claim", "source_url": "url", "source_name": "name"}}],
  "departments": ["skincare"],
  "tags": ["string"]
}}"""


ARTICLE_PROMPT = """You are a skincare content editor. Given raw web page text from multiple sources about "{topic}", produce a structured article JSON.

RULES:
- Write a clear, informative article synthesizing the sources
- Every factual claim in the body must be attributable to a provided source
- Classify the article type as exactly one of: guide_101, expert_tip, editorial, popular_read
- Assign departments from: skincare, haircare, bodycare
- Assign related concern names from: acne, aging, pigmentation, dryness, sensitivity, dullness, hair_fall, dandruff, frizz
- Estimate read time in minutes (body word count / 200)
- If there's a clear expert author, extract their name and credentials
- Do NOT invent quotes or credentials not in the sources
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "title": "string",
  "type": "guide_101|expert_tip|editorial|popular_read",
  "summary": "2-3 sentences",
  "body": "full article in markdown, cite sources inline as [Source Name](url)",
  "author_name": "string or null",
  "author_credential": "string or null",
  "read_time_minutes": 5,
  "tags": ["string"],
  "departments": ["skincare"],
  "concerns": ["acne"],
  "image_search_query": "search query to find a relevant hero image"
}}"""


CONCERN_PROMPT = """You are a dermatology content processor. Given raw data from multiple sources about the skin/hair concern "{name}", produce a structured JSON entry.

RULES:
- Every factual claim MUST cite source_url from provided sources
- Assign departments from: skincare, haircare, bodycare
- List recommended and avoid ingredients by common name
- Include lifestyle tips if mentioned in sources
- Structure severity levels if the condition has mild/moderate/severe forms
- Do NOT invent medical advice not in the sources
- Output ONLY valid JSON, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA:
{{
  "description": "what this condition is, 2-3 sentences",
  "causes": [{{"text": "cause", "source_url": "url", "source_name": "name"}}],
  "symptoms": [{{"text": "symptom", "source_url": "url", "source_name": "name"}}],
  "treatments": [{{"text": "treatment approach", "source_url": "url", "source_name": "name"}}],
  "recommended_ingredients": ["niacinamide", "salicylic acid"],
  "avoid_ingredients": ["alcohol", "fragrance"],
  "lifestyle_tips": [{{"text": "tip", "source_url": "url", "source_name": "name"}}],
  "severity_levels": {{"mild": "description", "moderate": "description", "severe": "description"}} or null,
  "departments": ["skincare"],
  "tags": ["string"],
  "image_search_query": "search query for a relevant image"
}}"""


MYTHS_PROMPT = """You are a skincare myth-buster. Given raw data from multiple sources, extract {count} common skincare/haircare myths and their evidence-based truths.

RULES:
- Each myth must be a real widely-believed misconception found in the sources
- Each truth must cite a source_url
- Assign departments from: skincare, haircare, bodycare
- Do NOT invent myths not discussed in the sources
- Output ONLY valid JSON array, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA (array):
[{{
  "myth": "the false claim people believe",
  "truth": "the evidence-based reality",
  "explanation": "why the myth is wrong, with nuance",
  "source_url": "primary source url",
  "source_name": "source name",
  "departments": ["skincare"],
  "tags": ["string"]
}}]"""


TIPS_PROMPT = """You are a skincare advisor. Given raw data from multiple sources, extract {count} actionable skincare/haircare tips.

RULES:
- Each tip must be practical and specific
- Categorize each as: hydration, sun_protection, cleansing, exfoliation, anti_aging, acne, diet, lifestyle, routine_building, ingredient_usage, hair_care, body_care
- Cite the source for each tip
- Assign departments from: skincare, haircare, bodycare
- Do NOT invent tips not supported by the sources
- Output ONLY valid JSON array, no markdown fences.

RAW SOURCES:
{sources_block}

OUTPUT JSON SCHEMA (array):
[{{
  "title": "short title (3-6 words)",
  "body": "actionable advice, 1-3 sentences",
  "category": "hydration|sun_protection|cleansing|...",
  "source_url": "url",
  "source_name": "name",
  "departments": ["skincare"],
  "tags": ["string"]
}}]"""


def build_sources_block(results: list) -> str:
    """Format FetchResult list into a sources block for prompts."""
    parts = []
    for i, r in enumerate(results, 1):
        if not r.raw_text.strip():
            continue
        parts.append(f"---SOURCE {i}: {r.source_name} ({r.source_url})---\n{r.raw_text}")
    return "\n\n".join(parts)
```

- [ ] **Step 2: Commit**

```bash
git add jay-backend/app/features/content/prompts.py
git commit -m "feat(content): add Gemini prompt templates for all 5 content types"
```

---

## Task 5: Pipeline Orchestrator

**Files:**
- Create: `jay-backend/app/features/content/pipeline.py`

- [ ] **Step 1: Write pipeline**

```python
# jay-backend/app/features/content/pipeline.py
"""Content pipeline: fetch from sources → structure with Gemini → upsert to DB."""
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
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


def _parse_json(text: str) -> dict | list | None:
    """Extract JSON from Gemini response, stripping markdown fences."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini JSON: {text[:200]}")
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


# ── Ingredient Pipeline ──────────────────────────────────────────

async def fetch_ingredient(name: str, db: AsyncSession) -> Ingredient | None:
    slug = slugify(name)

    # Fetch from 3 sources in parallel
    results = await asyncio.gather(
        incidecoder_ingredient(slug),
        pubmed_search(name, max_results=2),
        serper_search(f'"{name}" skincare ingredient benefits site:paulaschoice.com OR site:ncbi.nlm.nih.gov', num=3),
        return_exceptions=True,
    )

    all_results: list[FetchResult] = []
    for r in results:
        if isinstance(r, FetchResult):
            all_results.append(r)
        elif isinstance(r, list):
            all_results.extend(r)

    sources_block = build_sources_block(all_results)
    if not sources_block.strip():
        logger.warning(f"No source data found for ingredient '{name}'")
        return None

    prompt = INGREDIENT_PROMPT.format(name=name, sources_block=sources_block)
    raw = await _ask_gemini(prompt)
    data = _parse_json(raw)
    if not data or not isinstance(data, dict):
        return None

    image_url = await _fetch_image_url(f"{name} skincare ingredient molecule")

    now = datetime.now(timezone.utc)
    existing = (await db.execute(select(Ingredient).where(Ingredient.slug == slug))).scalar_one_or_none()

    if existing:
        for key, val in data.items():
            if hasattr(existing, key) and val is not None:
                setattr(existing, key, val)
        existing.image_url = image_url or existing.image_url
        existing.sources = [{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url]
        existing.fetched_at = now
        await db.commit()
        return existing

    ingredient = Ingredient(
        name=name, slug=slug, image_url=image_url,
        sources=[{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url],
        fetched_at=now,
        **{k: v for k, v in data.items() if hasattr(Ingredient, k) and v is not None},
    )
    db.add(ingredient)
    await db.commit()
    return ingredient


# ── Article Pipeline ─────────────────────────────────────────────

async def fetch_article(topic: str, db: AsyncSession) -> Article | None:
    slug = slugify(topic)

    # Fetch from Serper → follow top 3 URLs + DermNet
    serper_results = await serper_search(f"{topic} skincare guide", num=5)
    page_tasks = [fetch_webpage(r.source_url) for r in serper_results[:3] if r.source_url]
    pages = await asyncio.gather(*page_tasks, return_exceptions=True)
    all_results = [p for p in pages if isinstance(p, FetchResult) and p.raw_text.strip()]

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

    # Pick the best source as primary
    primary_source = all_results[0] if all_results else None

    now = datetime.now(timezone.utc)
    existing = (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none()

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


# ── Concern Pipeline ─────────────────────────────────────────────

async def fetch_concern(name: str, db: AsyncSession) -> Concern | None:
    slug = slugify(name)

    results = await asyncio.gather(
        dermnet_condition(slug),
        pubmed_search(f"{name} skin treatment", max_results=2),
        serper_search(f"{name} causes treatment skincare dermatologist", num=3),
        return_exceptions=True,
    )

    all_results: list[FetchResult] = []
    for r in results:
        if isinstance(r, FetchResult):
            all_results.append(r)
        elif isinstance(r, list):
            all_results.extend(r)

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
    existing = (await db.execute(select(Concern).where(Concern.slug == slug))).scalar_one_or_none()

    if existing:
        for key, val in data.items():
            if hasattr(existing, key) and val is not None:
                setattr(existing, key, val)
        existing.image_url = image_url or existing.image_url
        existing.sources = [{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url]
        existing.fetched_at = now
        await db.commit()
        return existing

    concern = Concern(
        name=name, slug=slug, image_url=image_url,
        sources=[{"url": r.source_url, "name": r.source_name} for r in all_results if r.source_url],
        fetched_at=now,
        **{k: v for k, v in data.items() if hasattr(Concern, k) and v is not None},
    )
    db.add(concern)
    await db.commit()
    return concern


# ── Myths Pipeline ───────────────────────────────────────────────

async def fetch_myths(department: str, db: AsyncSession, count: int = 10) -> list[Myth]:
    results = await asyncio.gather(
        reddit_search(f"skincare myths debunked {department}", limit=5),
        serper_search(f"common {department} myths facts dermatologist", num=5),
        return_exceptions=True,
    )

    all_results: list[FetchResult] = []
    for r in results:
        if isinstance(r, list):
            all_results.extend(r)
        elif isinstance(r, FetchResult):
            all_results.append(r)

    # Follow top Serper links
    for r in all_results[:3]:
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
        myth_text = item.get("myth", "")
        if not myth_text:
            continue
        myth = Myth(
            myth=myth_text,
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


# ── Tips Pipeline ────────────────────────────────────────────────

async def fetch_tips(department: str, db: AsyncSession, count: int = 10) -> list[Tip]:
    results = await asyncio.gather(
        reddit_search(f"best {department} tips routine", limit=5),
        youtube_transcript(f"{department} tips dermatologist"),
        serper_search(f"top {department} tips dermatologist recommended", num=5),
        return_exceptions=True,
    )

    all_results: list[FetchResult] = []
    for r in results:
        if isinstance(r, list):
            all_results.extend(r)
        elif isinstance(r, FetchResult):
            all_results.append(r)

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
        title = item.get("title", "")
        if not title:
            continue
        tip = Tip(
            title=title,
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
```

- [ ] **Step 2: Install python-slugify**

```bash
cd jay-backend
pip install python-slugify
echo "python-slugify" >> requirements.txt
```

- [ ] **Step 3: Commit**

```bash
git add jay-backend/app/features/content/pipeline.py
git commit -m "feat(content): add pipeline orchestrator — fetch, structure, upsert for all 5 types"
```

---

## Task 6: Seed Data + Batch Job

**Files:**
- Create: `jay-backend/app/features/content/seed_data.py`
- Create: `jay-backend/app/features/content/batch_job.py`

- [ ] **Step 1: Write seed lists**

```python
# jay-backend/app/features/content/seed_data.py
"""Seed lists for batch content pipeline."""

SEED_INGREDIENTS = [
    "Niacinamide", "Retinol", "Hyaluronic Acid", "Vitamin C", "Salicylic Acid",
    "Glycolic Acid", "Lactic Acid", "Azelaic Acid", "Benzoyl Peroxide", "Ceramides",
    "Peptides", "Squalane", "Centella Asiatica", "Tea Tree Oil", "Zinc",
    "Alpha Arbutin", "Kojic Acid", "Tranexamic Acid", "Bakuchiol", "Adenosine",
    "Panthenol", "Allantoin", "Urea", "Snail Mucin", "Propolis",
    "Madecassoside", "Green Tea Extract", "Licorice Root", "Resveratrol", "Ferulic Acid",
    "Vitamin E", "Jojoba Oil", "Rosehip Oil", "Argan Oil", "Shea Butter",
    "Aloe Vera", "Witch Hazel", "Clindamycin", "Adapalene", "Tretinoin",
    "Minoxidil", "Biotin", "Keratin", "Caffeine", "Collagen",
    "AHA", "BHA", "PHA", "Mandelic Acid", "Sulfur",
]

SEED_CONCERNS = [
    "Acne", "Pigmentation", "Dark Spots", "Aging", "Fine Lines",
    "Dryness", "Oily Skin", "Sensitivity", "Rosacea", "Eczema",
    "Dullness", "Uneven Skin Tone", "Large Pores", "Blackheads", "Dark Circles",
    "Hair Fall", "Dandruff", "Frizzy Hair", "Dry Scalp", "Thinning Hair",
]

SEED_ARTICLE_TOPICS = [
    "skincare routine for beginners guide",
    "how to use retinol safely beginner",
    "complete guide to sunscreen SPF India",
    "korean skincare routine steps explained",
    "how to treat acne scars at home",
    "niacinamide benefits and how to use",
    "double cleansing method explained",
    "chemical exfoliation AHA BHA guide",
    "anti aging skincare routine 30s",
    "how to build a minimalist skincare routine",
    "vitamin C serum guide how to choose",
    "skincare ingredients you should never mix",
    "best skincare routine for oily skin India",
    "how to treat hyperpigmentation dark spots",
    "moisturizer guide for every skin type",
    "dermatologist recommended skincare products India",
    "how to repair damaged skin barrier",
    "sunscreen myths and facts dermatologist",
    "skincare routine for dry sensitive skin",
    "hair fall treatment and prevention guide",
    "dandruff causes and treatment dermatologist",
    "body care routine for smooth skin",
    "how to get rid of dark circles",
    "pregnancy safe skincare guide",
    "teenage skincare routine guide",
    "winter skincare routine tips India",
    "summer skincare routine tips India",
    "how to use AHA BHA PHA correctly",
    "retinol vs retinoid difference guide",
    "how to layer skincare products correctly",
    "men skincare routine guide beginner",
    "scalp care routine for healthy hair",
    "body acne treatment and prevention",
    "lip care routine for dry chapped lips",
    "eye cream guide do you need one",
    "fungal acne causes treatment guide",
    "ceramide skincare benefits guide",
    "Indian skin specific skincare tips",
    "budget skincare routine under 1000 rupees",
    "glass skin routine steps and products",
]

SEED_MYTH_DEPARTMENTS = ["skincare", "haircare", "bodycare"]

SEED_TIP_DEPARTMENTS = ["skincare", "haircare", "bodycare"]
```

- [ ] **Step 2: Write batch job**

```python
# jay-backend/app/features/content/batch_job.py
"""Batch job to pre-populate content from web sources. Run weekly via cron."""
import asyncio
import logging
import time

from app.database import async_session_factory
from .pipeline import fetch_ingredient, fetch_article, fetch_concern, fetch_myths, fetch_tips
from .seed_data import (
    SEED_INGREDIENTS, SEED_CONCERNS, SEED_ARTICLE_TOPICS,
    SEED_MYTH_DEPARTMENTS, SEED_TIP_DEPARTMENTS,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

CONCURRENCY = 3  # Max parallel pipeline runs


async def run_batch():
    start = time.time()
    stats = {"ingredients": 0, "articles": 0, "concerns": 0, "myths": 0, "tips": 0, "errors": 0}

    sem = asyncio.Semaphore(CONCURRENCY)

    async def _run(coro, category: str):
        async with sem:
            try:
                result = await coro
                if result is not None:
                    stats[category] += 1 if not isinstance(result, list) else len(result)
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"[{category}] Error: {e}")

    async with async_session_factory() as db:
        # Ingredients
        logger.info(f"Processing {len(SEED_INGREDIENTS)} ingredients...")
        for name in SEED_INGREDIENTS:
            await _run(fetch_ingredient(name, db), "ingredients")

        # Concerns
        logger.info(f"Processing {len(SEED_CONCERNS)} concerns...")
        for name in SEED_CONCERNS:
            await _run(fetch_concern(name, db), "concerns")

        # Articles
        logger.info(f"Processing {len(SEED_ARTICLE_TOPICS)} articles...")
        for topic in SEED_ARTICLE_TOPICS:
            await _run(fetch_article(topic, db), "articles")

        # Myths
        logger.info("Processing myths...")
        for dept in SEED_MYTH_DEPARTMENTS:
            await _run(fetch_myths(dept, db, count=10), "myths")

        # Tips
        logger.info("Processing tips...")
        for dept in SEED_TIP_DEPARTMENTS:
            await _run(fetch_tips(dept, db, count=10), "tips")

    elapsed = time.time() - start
    logger.info(f"Batch complete in {elapsed:.1f}s: {stats}")
    return stats


def main():
    asyncio.run(run_batch())


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit**

```bash
git add jay-backend/app/features/content/seed_data.py jay-backend/app/features/content/batch_job.py
git commit -m "feat(content): add seed data lists and batch job for weekly cron"
```

---

## Task 7: Service Layer + API Router

**Files:**
- Create: `jay-backend/app/features/content/service.py`
- Create: `jay-backend/app/features/content/router.py`
- Modify: `jay-backend/app/main.py`

- [ ] **Step 1: Write service**

```python
# jay-backend/app/features/content/service.py
"""Content service — DB queries with on-demand pipeline fallback."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Ingredient, Article, Concern, Myth, Tip
from . import pipeline

STALE_DAYS = 30


def _is_stale(fetched_at: datetime | None) -> bool:
    if not fetched_at:
        return True
    return datetime.now(timezone.utc) - fetched_at > timedelta(days=STALE_DAYS)


async def get_ingredients(
    db: AsyncSession, department: str | None = None, category: str | None = None,
    limit: int = 50, offset: int = 0,
) -> list[Ingredient]:
    stmt = select(Ingredient)
    if department:
        stmt = stmt.where(Ingredient.departments.contains([department]))
    if category:
        stmt = stmt.where(Ingredient.category == category)
    stmt = stmt.order_by(Ingredient.name).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_ingredient_by_slug(db: AsyncSession, slug: str) -> Ingredient | None:
    result = await db.execute(select(Ingredient).where(Ingredient.slug == slug))
    ingredient = result.scalar_one_or_none()
    if ingredient and not _is_stale(ingredient.fetched_at):
        return ingredient
    # On-demand fetch
    name = slug.replace("-", " ").title()
    fetched = await pipeline.fetch_ingredient(name, db)
    return fetched or ingredient


async def get_articles(
    db: AsyncSession, type: str | None = None, department: str | None = None,
    limit: int = 20, offset: int = 0,
) -> list[Article]:
    stmt = select(Article)
    if type:
        stmt = stmt.where(Article.type == type)
    if department:
        stmt = stmt.where(Article.departments.contains([department]))
    stmt = stmt.order_by(Article.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_article_by_slug(db: AsyncSession, slug: str) -> Article | None:
    result = await db.execute(select(Article).where(Article.slug == slug))
    return result.scalar_one_or_none()


async def get_concerns(
    db: AsyncSession, department: str | None = None, limit: int = 20,
) -> list[Concern]:
    stmt = select(Concern)
    if department:
        stmt = stmt.where(Concern.departments.contains([department]))
    stmt = stmt.order_by(Concern.name).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_concern_by_slug(db: AsyncSession, slug: str) -> Concern | None:
    result = await db.execute(select(Concern).where(Concern.slug == slug))
    concern = result.scalar_one_or_none()
    if concern and not _is_stale(concern.fetched_at):
        return concern
    name = slug.replace("-", " ").title()
    fetched = await pipeline.fetch_concern(name, db)
    return fetched or concern


async def get_myths(
    db: AsyncSession, department: str | None = None, limit: int = 20,
) -> list[Myth]:
    stmt = select(Myth)
    if department:
        stmt = stmt.where(Myth.departments.contains([department]))
    stmt = stmt.order_by(func.random()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_tips(
    db: AsyncSession, department: str | None = None, category: str | None = None,
    limit: int = 20,
) -> list[Tip]:
    stmt = select(Tip)
    if department:
        stmt = stmt.where(Tip.departments.contains([department]))
    if category:
        stmt = stmt.where(Tip.category == category)
    stmt = stmt.order_by(func.random()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
```

- [ ] **Step 2: Write router**

```python
# jay-backend/app/features/content/router.py
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.shared.exceptions import NotFoundError
from . import service
from .schemas import IngredientOut, ArticleOut, ConcernOut, MythOut, TipOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/ingredients", response_model=list[IngredientOut])
async def list_ingredients(
    db: DbSession,
    department: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await service.get_ingredients(db, department, category, limit, offset)


@router.get("/ingredients/{slug}", response_model=IngredientOut)
async def get_ingredient(slug: str, db: DbSession):
    ingredient = await service.get_ingredient_by_slug(db, slug)
    if not ingredient:
        raise NotFoundError("Ingredient", slug)
    return ingredient


@router.get("/articles", response_model=list[ArticleOut])
async def list_articles(
    db: DbSession,
    type: str | None = Query(None),
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.get_articles(db, type, department, limit, offset)


@router.get("/articles/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: DbSession):
    article = await service.get_article_by_slug(db, slug)
    if not article:
        raise NotFoundError("Article", slug)
    return article


@router.get("/concerns", response_model=list[ConcernOut])
async def list_concerns(
    db: DbSession,
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_concerns(db, department, limit)


@router.get("/concerns/{slug}", response_model=ConcernOut)
async def get_concern(slug: str, db: DbSession):
    concern = await service.get_concern_by_slug(db, slug)
    if not concern:
        raise NotFoundError("Concern", slug)
    return concern


@router.get("/myths", response_model=list[MythOut])
async def list_myths(
    db: DbSession,
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_myths(db, department, limit)


@router.get("/tips", response_model=list[TipOut])
async def list_tips(
    db: DbSession,
    department: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_tips(db, department, category, limit)
```

- [ ] **Step 3: Register router in main.py**

Add to `jay-backend/app/main.py` alongside existing router registrations:

```python
from app.features.content.router import router as content_router
app.include_router(content_router, prefix="/api/v1/content", tags=["Content"])
```

- [ ] **Step 4: Commit**

```bash
git add jay-backend/app/features/content/service.py jay-backend/app/features/content/router.py jay-backend/app/main.py
git commit -m "feat(content): add service layer, API router, register in main.py"
```

---

## Task 8: Frontend Service + Store

**Files:**
- Create: `jay-app/services/content.ts`
- Create: `jay-app/stores/contentStore.ts`

- [ ] **Step 1: Write content service**

```typescript
// jay-app/services/content.ts
import { apiFetch } from '../lib/api';

export interface SourcedFact {
  text: string;
  source_url?: string;
  source_name?: string;
}

export interface IngredientOut {
  id: number;
  name: string;
  slug: string;
  also_known_as?: string[];
  category?: string;
  what_it_does?: string;
  how_it_works?: string;
  benefits?: string[];
  who_its_for?: string[];
  avoid_with?: string[];
  safety_rating?: string;
  facts?: SourcedFact[];
  image_url?: string;
  departments?: string[];
  tags?: string[];
  source_url?: string;
}

export interface ArticleOut {
  id: number;
  slug: string;
  title: string;
  type: string;
  summary?: string;
  body?: string;
  author_name?: string;
  author_credential?: string;
  author_image_url?: string;
  image_url?: string;
  read_time_minutes?: number;
  tags?: string[];
  departments?: string[];
  concerns?: string[];
  source_url?: string;
  source_name?: string;
}

export interface ConcernOut {
  id: number;
  name: string;
  slug: string;
  description?: string;
  causes?: SourcedFact[];
  treatments?: SourcedFact[];
  recommended_ingredients?: string[];
  avoid_ingredients?: string[];
  image_url?: string;
  departments?: string[];
  tags?: string[];
}

export interface MythOut {
  id: number;
  myth: string;
  truth: string;
  explanation?: string;
  source_url?: string;
  source_name?: string;
  departments?: string[];
}

export interface TipOut {
  id: number;
  title: string;
  body: string;
  category?: string;
  source_url?: string;
  source_name?: string;
  departments?: string[];
}

export const contentService = {
  getIngredients: (params?: { department?: string; category?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.category) q.set('category', params.category);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<IngredientOut[]>(`/api/v1/content/ingredients?${q}`, { noAuth: true });
  },

  getIngredient: (slug: string) =>
    apiFetch<IngredientOut>(`/api/v1/content/ingredients/${slug}`, { noAuth: true }),

  getArticles: (params?: { type?: string; department?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.department) q.set('department', params.department);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<ArticleOut[]>(`/api/v1/content/articles?${q}`, { noAuth: true });
  },

  getArticle: (slug: string) =>
    apiFetch<ArticleOut>(`/api/v1/content/articles/${slug}`, { noAuth: true }),

  getConcerns: (params?: { department?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<ConcernOut[]>(`/api/v1/content/concerns?${q}`, { noAuth: true });
  },

  getConcern: (slug: string) =>
    apiFetch<ConcernOut>(`/api/v1/content/concerns/${slug}`, { noAuth: true }),

  getMyths: (params?: { department?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<MythOut[]>(`/api/v1/content/myths?${q}`, { noAuth: true });
  },

  getTips: (params?: { department?: string; category?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.category) q.set('category', params.category);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<TipOut[]>(`/api/v1/content/tips?${q}`, { noAuth: true });
  },
};
```

- [ ] **Step 2: Write content store**

```typescript
// jay-app/stores/contentStore.ts
import { create } from 'zustand';
import { contentService, type IngredientOut, type ArticleOut, type ConcernOut, type MythOut, type TipOut } from '../services/content';

interface ContentState {
  ingredients: IngredientOut[];
  articles: ArticleOut[];
  concerns: ConcernOut[];
  myths: MythOut[];
  tips: TipOut[];
  isLoading: boolean;

  loadIngredients: (department?: string) => Promise<void>;
  loadArticles: (department?: string, type?: string) => Promise<void>;
  loadConcerns: (department?: string) => Promise<void>;
  loadMyths: (department?: string) => Promise<void>;
  loadTips: (department?: string) => Promise<void>;
  loadAllForDepartment: (department: string) => Promise<void>;
}

export const useContentStore = create<ContentState>((set) => ({
  ingredients: [],
  articles: [],
  concerns: [],
  myths: [],
  tips: [],
  isLoading: false,

  loadIngredients: async (department) => {
    try {
      const ingredients = await contentService.getIngredients({ department, limit: 50 });
      set({ ingredients });
    } catch (e) {
      console.error('[Content] Load ingredients:', e);
    }
  },

  loadArticles: async (department, type) => {
    try {
      const articles = await contentService.getArticles({ department, type, limit: 30 });
      set({ articles });
    } catch (e) {
      console.error('[Content] Load articles:', e);
    }
  },

  loadConcerns: async (department) => {
    try {
      const concerns = await contentService.getConcerns({ department, limit: 20 });
      set({ concerns });
    } catch (e) {
      console.error('[Content] Load concerns:', e);
    }
  },

  loadMyths: async (department) => {
    try {
      const myths = await contentService.getMyths({ department, limit: 20 });
      set({ myths });
    } catch (e) {
      console.error('[Content] Load myths:', e);
    }
  },

  loadTips: async (department) => {
    try {
      const tips = await contentService.getTips({ department, limit: 20 });
      set({ tips });
    } catch (e) {
      console.error('[Content] Load tips:', e);
    }
  },

  loadAllForDepartment: async (department) => {
    set({ isLoading: true });
    try {
      const [ingredients, articles, concerns, myths, tips] = await Promise.allSettled([
        contentService.getIngredients({ department, limit: 50 }),
        contentService.getArticles({ department, limit: 30 }),
        contentService.getConcerns({ department, limit: 20 }),
        contentService.getMyths({ department, limit: 20 }),
        contentService.getTips({ department, limit: 20 }),
      ]);
      set({
        ingredients: ingredients.status === 'fulfilled' ? ingredients.value : [],
        articles: articles.status === 'fulfilled' ? articles.value : [],
        concerns: concerns.status === 'fulfilled' ? concerns.value : [],
        myths: myths.status === 'fulfilled' ? myths.value : [],
        tips: tips.status === 'fulfilled' ? tips.value : [],
      });
    } catch (e) {
      console.error('[Content] Load all:', e);
    }
    set({ isLoading: false });
  },
}));
```

- [ ] **Step 3: Commit**

```bash
git add jay-app/services/content.ts jay-app/stores/contentStore.ts
git commit -m "feat(content): add frontend service and zustand store for content API"
```

---

## Task 9: Source Attribution Component

**Files:**
- Create: `jay-app/components/discover/SourceAttribution.tsx`

- [ ] **Step 1: Write component**

```tsx
// jay-app/components/discover/SourceAttribution.tsx
import React from 'react';
import { Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SourceAttributionProps {
  sourceName?: string;
  sourceUrl?: string;
}

export function SourceAttribution({ sourceName, sourceUrl }: SourceAttributionProps) {
  const { colors } = useTheme();
  if (!sourceName && !sourceUrl) return null;

  const label = sourceName || new URL(sourceUrl!).hostname.replace('www.', '');

  return (
    <Pressable
      onPress={() => sourceUrl && Linking.openURL(sourceUrl)}
      disabled={!sourceUrl}
      hitSlop={8}
    >
      <Text style={[s.text, { color: colors.tertiaryLabel }]}>
        Source: <Text style={{ color: sourceUrl ? colors.systemBlue : colors.tertiaryLabel }}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 6,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add jay-app/components/discover/SourceAttribution.tsx
git commit -m "feat(content): add SourceAttribution component for content cards"
```

---

## Task 10: Wire ForYou + Learn Tabs to Real Data

**Files:**
- Modify: `jay-app/components/discover/ForYouTab.tsx`
- Modify: `jay-app/components/discover/LearnTab.tsx`

- [ ] **Step 1: Update ForYouTab**

At the top of ForYouTab.tsx, add imports and replace mock data usage:

```typescript
import { useContentStore } from '../../stores/contentStore';
import { SourceAttribution } from './SourceAttribution';
```

In the component body, add:

```typescript
const { articles, ingredients, concerns, tips } = useContentStore();

// Derive content from store (with mock fallback)
const featuredArticle = articles.find(a => a.type === 'editorial') ?? null;
const expertArticles = articles.filter(a => a.type === 'expert_tip').slice(0, 3);
const quickTips = tips.slice(0, 5);
const ingredientSpotlight = ingredients[0] ?? null;
const concernList = concerns;
const popularReads = articles.filter(a => a.type === 'popular_read').slice(0, 4);
```

Replace mock data references with these derived values. Add `<SourceAttribution>` below each card that has `source_url` and `source_name`.

- [ ] **Step 2: Update LearnTab**

At the top of LearnTab.tsx, add the same imports:

```typescript
import { useContentStore } from '../../stores/contentStore';
import { SourceAttribution } from './SourceAttribution';
```

Replace mock data usage:

```typescript
const { articles, ingredients, concerns, myths } = useContentStore();

const guides = articles.filter(a => a.type === 'guide_101');
const expertArticles = articles.filter(a => a.type === 'expert_tip');
const ingredientDictionary = ingredients;
const concernGrid = concerns;
const mythBusters = myths;
```

- [ ] **Step 3: Load content when department changes**

In the main Discover screen (`jay-app/app/(tabs)/discover.tsx`), add content loading:

```typescript
import { useContentStore } from '../../stores/contentStore';

// Inside the component:
const department = useDiscoverStore(s => s.department);
const loadAllContent = useContentStore(s => s.loadAllForDepartment);

useEffect(() => {
  loadAllContent(department);
}, [department]);
```

- [ ] **Step 4: Commit**

```bash
git add jay-app/components/discover/ForYouTab.tsx jay-app/components/discover/LearnTab.tsx jay-app/app/(tabs)/discover.tsx
git commit -m "feat(content): wire ForYou and Learn tabs to real content API with source attribution"
```

---

## Task 11: Run Initial Batch + Integration Test

- [ ] **Step 1: Run migration**

```bash
cd jay-backend
alembic upgrade head
```

- [ ] **Step 2: Run batch job for a few items to test**

```bash
cd jay-backend
python -c "
import asyncio
from app.features.content.batch_job import run_batch
asyncio.run(run_batch())
"
```

- [ ] **Step 3: Test API endpoints**

```bash
curl http://localhost:8000/api/v1/content/ingredients | python -m json.tool | head -30
curl http://localhost:8000/api/v1/content/articles?type=guide_101 | python -m json.tool | head -30
curl http://localhost:8000/api/v1/content/concerns | python -m json.tool | head -30
curl http://localhost:8000/api/v1/content/myths?department=skincare | python -m json.tool | head -20
curl http://localhost:8000/api/v1/content/tips?department=skincare | python -m json.tool | head -20
```

- [ ] **Step 4: Test on-demand fetch**

```bash
curl http://localhost:8000/api/v1/content/ingredients/niacinamide | python -m json.tool
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(content): complete discover real content pipeline — 7 fetchers, Gemini structurer, 5 content types"
```
