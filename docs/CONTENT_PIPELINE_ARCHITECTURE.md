# JAY Content Pipeline — Architecture & Flow

> **Version:** 1.0
> **Date:** 2026-04-04
> **Status:** Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow](#data-flow)
4. [Source Fetchers](#source-fetchers)
5. [LLM Structurer](#llm-structurer)
6. [Database Schema](#database-schema)
7. [API Layer](#api-layer)
8. [Execution Modes](#execution-modes)
9. [Frontend Integration](#frontend-integration)
10. [Cost & Rate Limits](#cost--rate-limits)
11. [File Reference](#file-reference)

---

## Overview

The Content Pipeline replaces hardcoded mock content in JAY's Discover section with **real, web-sourced, attributed data**. It aggregates information from 7 external sources, uses Gemini 2.5 Flash to categorize and structure the raw data, and stores it in PostgreSQL for the frontend to consume.

**Key Principles:**
- Every factual claim is attributed to its original source URL
- The LLM structures and categorizes — it does NOT generate new claims
- Batch pre-populates common content; on-demand fills gaps in real-time
- Frontend falls back to mock data when API returns empty

**Content Types:** Ingredients, Articles, Concerns, Myths, Tips

---

## System Architecture

```
                                    JAY Content Pipeline
    ============================================================================

    +------------------+     +------------------+     +------------------+
    |   Source Layer    |     |  Processing Layer|     |   Storage Layer  |
    |                  |     |                  |     |                  |
    |  7 Fetchers:     |     |  Aggregator      |     |  PostgreSQL      |
    |  - Serper.dev    | --> |  (parallel fetch) | --> |  5 tables:       |
    |  - PubMed        |     |       |          |     |  - ingredients   |
    |  - Incidecoder   |     |       v          |     |  - articles      |
    |  - DermNet NZ    |     |  Gemini 2.5      |     |  - concerns      |
    |  - YouTube       |     |  Flash           |     |  - myths         |
    |  - Reddit        |     |  (structure +    |     |  - tips          |
    |  - Webpage       |     |   categorize)    |     |                  |
    +------------------+     +------------------+     +------------------+
                                                             |
                                                             v
                                                    +------------------+
                                                    |    API Layer     |
                                                    |                  |
                                                    |  FastAPI Router  |
                                                    |  /api/v1/content |
                                                    +------------------+
                                                             |
                                                             v
                                                    +------------------+
                                                    |   Frontend       |
                                                    |                  |
                                                    |  contentStore.ts |
                                                    |  ForYouTab.tsx   |
                                                    |  LearnTab.tsx    |
                                                    +------------------+
```

---

## Data Flow

### Batch Pipeline (Weekly Cron)

```
    +-----------+      +----------------+      +-----------+      +--------+
    | Seed List | ---> | For each item: | ---> | Gemini    | ---> |  DB    |
    | (170 items)|     | fetch 2-4      |      | Structure |      | Upsert |
    +-----------+      | sources in     |      | + Categorize     +--------+
                       | parallel       |      +-----------+
                       +----------------+
                              |
                    +---------+---------+
                    |         |         |
                    v         v         v
               +--------+ +------+ +--------+
               | Serper  | |PubMed| |DermNet |
               | Search  | | API  | |Scrape  |
               +--------+ +------+ +--------+

    Seed Lists:
    - 50 ingredients (niacinamide, retinol, hyaluronic acid, ...)
    - 20 concerns (acne, pigmentation, hair fall, ...)
    - 40 article topics ("skincare 101", "SPF guide india", ...)
    - 3x myth batches (skincare, haircare, bodycare departments)
    - 3x tip batches (skincare, haircare, bodycare departments)

    Concurrency: 3 parallel items via asyncio.Semaphore
    Each item gets its own DB session (async with async_session_factory)
```

### On-Demand Pipeline (User Request)

```
    User requests            DB                Pipeline              Response
    /ingredients/retinol --> Check DB -------> Hit? Fresh? --------> Return from DB
                                |                    |
                                |                    | Miss or stale (>30 days)
                                |                    v
                                |              Run full pipeline:
                                |              Fetch -> Gemini -> Upsert
                                |                    |
                                |                    v
                                +<------- Return freshly fetched data
```

### Single Item Pipeline (Detailed)

```
    Input: ingredient name "Niacinamide"
    =============================================

    Step 1: FETCH (parallel, ~3-5 seconds)
    +---------------------------------------------+
    |  asyncio.gather(                            |
    |    incidecoder_ingredient("niacinamide"),    |  --> FetchResult{raw_text, url, name}
    |    pubmed_search("Niacinamide", 2),          |  --> [FetchResult, ...]
    |    serper_search('"Niacinamide" skincare...') |  --> [FetchResult, ...]
    |  )                                           |
    +---------------------------------------------+
                        |
                        v
    Step 2: AGGREGATE
    +---------------------------------------------+
    |  Flatten results into list[FetchResult]      |
    |  Filter out empty results                    |
    |  Build sources_block text:                   |
    |                                              |
    |  ---SOURCE 1: Incidecoder (url)---           |
    |  {raw text from incidecoder}                 |
    |                                              |
    |  ---SOURCE 2: PubMed (url)---                |
    |  {abstract text}                             |
    |                                              |
    |  ---SOURCE 3: paulaschoice.com (url)---      |
    |  {snippet from serper}                       |
    +---------------------------------------------+
                        |
                        v
    Step 3: LLM STRUCTURE (Gemini 2.5 Flash, ~2-4 seconds)
    +---------------------------------------------+
    |  Prompt = INGREDIENT_PROMPT.format(          |
    |    name="Niacinamide",                       |
    |    sources_block=<aggregated text>            |
    |  )                                           |
    |                                              |
    |  Gemini returns JSON:                        |
    |  {                                           |
    |    "category": "vitamin",                    |
    |    "what_it_does": "...",                     |
    |    "safety_rating": "safe",                  |
    |    "departments": ["skincare"],              |
    |    "facts": [                                |
    |      {"text": "claim", "source_url": "..."}  |
    |    ],                                        |
    |    ...                                       |
    |  }                                           |
    +---------------------------------------------+
                        |
                        v
    Step 4: IMAGE FETCH (Serper Images, ~1 second)
    +---------------------------------------------+
    |  Serper Image Search:                        |
    |  "Niacinamide skincare ingredient"           |
    |  --> Pick first valid HTTP image URL         |
    +---------------------------------------------+
                        |
                        v
    Step 5: DB UPSERT
    +---------------------------------------------+
    |  Check: SELECT WHERE slug = "niacinamide"    |
    |                                              |
    |  If exists: UPDATE all fields + fetched_at   |
    |  If new: INSERT with all fields              |
    |                                              |
    |  COMMIT                                      |
    +---------------------------------------------+
                        |
                        v
    Output: Ingredient ORM object (returned to caller)
```

---

## Source Fetchers

Each fetcher is an async function returning `FetchResult` (or `list[FetchResult]`).

```python
@dataclass
class FetchResult:
    raw_text: str       # Extracted text content
    source_url: str     # Original URL for attribution
    source_name: str    # Human-readable source name
    success: bool       # Whether fetch succeeded
    error: str | None   # Error message if failed
```

### Fetcher Details

| # | Fetcher | File | Source | Method | Rate Limit | Fallback |
|---|---------|------|--------|--------|------------|----------|
| 1 | **Serper** | `serper.py` | Google Search | POST to Serper.dev API | 2,500/mo free | Return `[]` |
| 2 | **PubMed** | `pubmed.py` | PubMed/NCBI | GET E-utilities (free) | 3 req/sec | Return `[]` |
| 3 | **Incidecoder** | `incidecoder.py` | incidecoder.com | HTTP scrape + BeautifulSoup | 1 req/2s sleep | Return `EMPTY_RESULT` |
| 4 | **DermNet** | `dermnet.py` | dermnetnz.org | HTTP scrape + BeautifulSoup | 1 req/2s sleep | Search fallback, then `EMPTY_RESULT` |
| 5 | **YouTube** | `youtube.py` | YouTube videos | Serper to find URL -> `youtube-transcript-api` | Via Serper quota | Return `EMPTY_RESULT` |
| 6 | **Reddit** | `reddit.py` | Reddit JSON API | GET old.reddit.com/.json | 1 req/2s per sub | Return `[]` |
| 7 | **Webpage** | `webpage.py` | Any URL | HTTP GET + BeautifulSoup | None | Return `EMPTY_RESULT` |

### Source Selection Per Content Type

```
    INGREDIENT
    +-- Incidecoder (ingredient page — detailed function, safety)
    +-- PubMed (scientific abstracts — mechanism, studies)
    +-- Serper (paulaschoice.com, ncbi — benefits, usage)

    ARTICLE
    +-- Serper (find top 5 articles on topic)
    +-- Webpage (fetch & extract top 3 article full text)

    CONCERN
    +-- DermNet NZ (condition page — causes, symptoms, treatment)
    +-- PubMed (treatment studies)
    +-- Serper (dermatologist advice)

    MYTHS
    +-- Reddit (r/SkincareAddiction, r/IndianSkincareAddicts — myth posts)
    +-- Serper (myth debunking articles)
    +-- Webpage (follow top Serper links for full text)

    TIPS
    +-- Reddit (tip threads from skincare subs)
    +-- YouTube (dermatologist video transcripts)
    +-- Serper (dermatologist recommended tips articles)
```

### Error Handling

```
    All fetchers follow this pattern:

    try:
        fetch data
        parse/extract
        return FetchResult(raw_text=..., source_url=..., source_name=...)
    except Exception:
        log error
        return EMPTY_RESULT  (or empty list)
        # NEVER raise — pipeline continues with remaining sources
```

---

## LLM Structurer

### Gemini Configuration

```
    Model:       gemini-2.5-flash
    Temperature: 0.2 (low — we want consistent structuring, not creativity)
    Max Tokens:  4096 (6000 for articles with full body text)
```

### Prompt Architecture

Each content type has a dedicated prompt template in `prompts.py`:

```
    +-------------------+     +-------------------+
    | INGREDIENT_PROMPT |     | ARTICLE_PROMPT    |
    | - categorize      |     | - classify type   |
    | - safety rate     |     | - extract author  |
    | - find conflicts  |     | - estimate read   |
    | - assign depts    |     |   time            |
    | - cite sources    |     | - cite sources    |
    +-------------------+     +-------------------+

    +-------------------+     +-------------------+     +-------------------+
    | CONCERN_PROMPT    |     | MYTHS_PROMPT      |     | TIPS_PROMPT       |
    | - causes          |     | - extract N myths |     | - extract N tips  |
    | - treatments      |     | - debunk each     |     | - categorize each |
    | - ingredients     |     | - cite evidence   |     | - cite source     |
    | - severity levels |     | - assign depts    |     | - assign depts    |
    +-------------------+     +-------------------+     +-------------------+
```

### Prompt Template Structure

```
    Every prompt follows this pattern:

    1. ROLE:     "You are a skincare content processor"
    2. TASK:     "Given raw data about {name}, produce structured JSON"
    3. RULES:    (5-8 hard rules including source citation mandate)
    4. SOURCES:  (formatted raw text blocks with URLs)
    5. SCHEMA:   (exact JSON output schema)

    Critical Rules (in every prompt):
    - "Every factual claim MUST cite a source_url"
    - "Do NOT generate information not present in the sources"
    - "Output ONLY valid JSON, no markdown fences"
```

### JSON Parsing

```python
def _parse_json(text: str) -> dict | list | None:
    # Strip markdown fences: ```json ... ```
    # Parse JSON
    # Return None on failure (logged, pipeline skips item)
```

---

## Database Schema

### Entity Relationship

```
    content_ingredients          content_articles          content_concerns
    +------------------+        +------------------+      +------------------+
    | id (PK)          |        | id (PK)          |      | id (PK)          |
    | name             |        | slug (unique)    |      | name             |
    | slug (unique)    |        | title            |      | slug (unique)    |
    | category         |        | type (indexed)   |      | description      |
    | what_it_does     |        | summary          |      | causes (JSONB)   |
    | how_it_works     |        | body             |      | symptoms (JSONB) |
    | benefits[]       |        | author_name      |      | treatments(JSONB)|
    | who_its_for[]    |        | author_credential|      | recommended_     |
    | avoid_with[]     |        | image_url        |      |   ingredients[]  |
    | safety_rating    |        | read_time_minutes|      | avoid_           |
    | facts (JSONB)    |        | tags[]           |      |   ingredients[]  |
    | image_url        |        | departments[]    |      | lifestyle_tips   |
    | sources (JSONB)  |        | concerns[]       |      |   (JSONB)        |
    | departments[]    |        | source_url       |      | severity_levels  |
    | tags[]           |        | source_name      |      |   (JSONB)        |
    | fetched_at       |        | fetched_at       |      | departments[]    |
    +------------------+        +------------------+      | sources (JSONB)  |
                                                          | fetched_at       |
    content_myths               content_tips              +------------------+
    +------------------+        +------------------+
    | id (PK)          |        | id (PK)          |
    | myth             |        | title            |
    | truth            |        | body             |
    | explanation      |        | category         |
    | source_url       |        | source_url       |
    | source_name      |        | source_name      |
    | departments[]    |        | departments[]    |
    | tags[]           |        | tags[]           |
    | fetched_at       |        | fetched_at       |
    +------------------+        +------------------+

    All tables also have: created_at, updated_at (auto-managed)
```

### JSONB Structures

```json
// facts (ingredients)
[
  {
    "text": "Niacinamide inhibits melanosome transfer at 5% concentration",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/...",
    "source_name": "PubMed"
  }
]

// causes / symptoms / treatments / lifestyle_tips (concerns)
[
  {
    "text": "Excess sebum production combined with P. acnes bacteria",
    "source_url": "https://dermnetnz.org/topics/acne",
    "source_name": "DermNet NZ"
  }
]

// sources (ingredients, concerns)
[
  {"url": "https://incidecoder.com/ingredients/niacinamide", "name": "Incidecoder"},
  {"url": "https://pubmed.ncbi.nlm.nih.gov/12345/", "name": "PubMed"}
]

// severity_levels (concerns)
{
  "mild": "Occasional whiteheads, minimal inflammation",
  "moderate": "Regular breakouts with papules and pustules",
  "severe": "Cystic acne, widespread inflammation, scarring risk"
}
```

### Staleness Policy

```
    fetched_at < 30 days ago  -->  FRESH (serve from DB)
    fetched_at >= 30 days ago -->  STALE (re-fetch on next request)
    fetched_at is NULL        -->  NEVER FETCHED (fetch on demand)
```

---

## API Layer

### Endpoints

```
    Base: /api/v1/content
    Auth: None required (public reference content)

    GET /ingredients                    List ingredients
        ?department=skincare            Filter by department
        ?category=acid                  Filter by category
        ?limit=50&offset=0              Pagination

    GET /ingredients/{slug}             Get single ingredient
                                        Triggers on-demand fetch if stale/missing

    GET /articles                       List articles
        ?type=guide_101                 Filter by type
        ?department=skincare            Filter by department
        ?limit=20&offset=0              Pagination

    GET /articles/{slug}                Get single article (full body)

    GET /concerns                       List concerns
        ?department=skincare            Filter by department
        ?limit=20                       Limit

    GET /concerns/{slug}                Get single concern
                                        Triggers on-demand fetch if stale/missing

    GET /myths                          List myths (random order)
        ?department=skincare            Filter by department
        ?limit=20                       Limit

    GET /tips                           List tips (random order)
        ?department=skincare            Filter by department
        ?category=hydration             Filter by category
        ?limit=20                       Limit
```

### Response Flow

```
    Client Request
         |
         v
    +----------+     +---------+     +----------+
    | Router   | --> | Service | --> | Database |
    | (FastAPI)|     | Layer   |     | (SELECT) |
    +----------+     +---------+     +----------+
                          |                |
                          |   miss/stale   |  hit & fresh
                          v                v
                     +---------+     +-----------+
                     | Pipeline|     | Return    |
                     | (fetch  |     | from DB   |
                     |  + LLM) |     +-----------+
                     +---------+
                          |
                          v
                     +---------+
                     | Upsert  |
                     | to DB   |
                     +---------+
                          |
                          v
                     +-----------+
                     | Return    |
                     | fresh data|
                     +-----------+
```

---

## Execution Modes

### Batch Mode

```
    Trigger:  python -c "from app.features.content.batch_job import main; main()"
    Schedule: Weekly cron (recommended: Sunday 3 AM)
    Duration: ~15-30 minutes for full 170 items
    Cost:     ~$0.15 (Gemini tokens) + ~340 Serper searches

    Flow:
    1. For each seed list (ingredients, concerns, articles, myths, tips):
    2.   Create asyncio tasks with Semaphore(3) for concurrency
    3.   Each task: get own DB session -> fetch -> structure -> upsert
    4.   Log success/failure per item
    5.   Print summary stats at end

    Output Example:
    2026-04-04 03:00:15 INFO: Processing 50 ingredients...
    2026-04-04 03:00:17 INFO:   [ingredients] OK: Niacinamide
    2026-04-04 03:00:22 INFO:   [ingredients] OK: Retinol
    ...
    2026-04-04 03:25:41 INFO: Batch complete in 1526.3s:
        {"ingredients": 48, "articles": 37, "concerns": 19, "myths": 28, "tips": 27, "errors": 5}
```

### On-Demand Mode

```
    Trigger:  GET /api/v1/content/ingredients/bakuchiol (not in DB)
    Duration: ~5-10 seconds (user sees loading state)
    Cost:     ~$0.001 per request

    Flow:
    1. Service checks DB for slug "bakuchiol"
    2. Not found (or fetched_at > 30 days)
    3. Derive name from slug: "Bakuchiol"
    4. Run pipeline: fetch_ingredient("Bakuchiol", db)
    5. Return freshly created Ingredient to client
    6. Subsequent requests served from DB instantly
```

---

## Frontend Integration

### Data Flow

```
    Discover Screen
         |
         | useEffect on department change
         v
    contentStore.loadAllForDepartment("skincare")
         |
         | Promise.allSettled (5 parallel API calls)
         v
    +-------------+  +------------+  +-----------+  +--------+  +-------+
    | ingredients |  | articles   |  | concerns  |  | myths  |  | tips  |
    | GET /content|  | GET /content|  | GET /...  |  | GET /..| | GET /..|
    | /ingredients|  | /articles  |  | /concerns |  | /myths |  | /tips |
    +-------------+  +------------+  +-----------+  +--------+  +-------+
         |                |               |             |           |
         v                v               v             v           v
    contentStore state (zustand)
         |
         +---> ForYouTab (articles, ingredients, concerns, tips)
         |        |
         |        +---> HeroCard (featured editorial)
         |        +---> IngredientSpotlightCard (first ingredient)
         |        +---> ConcernPills (concern list)
         |        +---> ExpertCorner (expert_tip articles)
         |        +---> QuickTipsScroll (tips)
         |        +---> PopularReads (popular_read articles)
         |
         +---> LearnTab (articles, ingredients, concerns, myths)
                  |
                  +---> Guides101 (guide_101 articles)
                  +---> IngredientDictionary (ingredients list)
                  +---> ByConcernGrid (concerns)
                  +---> MythBustersScroll (myths)
                  +---> FromTheExperts (expert_tip articles)
```

### Mock Fallback Pattern

```typescript
// Every data derivation follows this pattern:

const concerns = useMemo(() => {
  // Try real API data first
  if (contentConcerns.length > 0) {
    return contentConcerns.map(adapt_to_component_type);
  }
  // Fall back to mock data
  return MOCK_CONCERNS.filter(c => c.departments.includes(department));
}, [contentConcerns, department]);
```

### Source Attribution

```
    Every content card can show:

    +----------------------------------+
    |  Niacinamide                     |
    |  A form of vitamin B3 that...    |
    |                                  |
    |  Source: incidecoder.com  [link] |  <-- SourceAttribution component
    +----------------------------------+

    Tapping "Source" opens the original URL in the browser.
```

---

## Cost & Rate Limits

### Per Batch Run (~170 items)

| Resource | Usage | Cost | Limit |
|----------|-------|------|-------|
| Gemini 2.5 Flash | ~850K tokens | ~$0.15 | Pay-per-use |
| Serper.dev | ~340 searches | Free tier | 2,500/month |
| PubMed E-utilities | ~120 requests | Free | 3 req/sec |
| Incidecoder | ~50 page scrapes | Free | Self-rate-limited 1/2s |
| DermNet NZ | ~20 page scrapes | Free | Self-rate-limited 1/2s |
| Reddit JSON | ~16 requests | Free | Self-rate-limited 1/2s |

### Per On-Demand Request

| Resource | Usage | Cost |
|----------|-------|------|
| Gemini | ~5K tokens | ~$0.001 |
| Serper | 1-3 searches | Free |
| Other sources | 1-2 fetches | Free |

### Monthly Estimates (with weekly batch)

```
    Gemini:  4 batches x $0.15 + ~100 on-demand x $0.001 = ~$0.70/month
    Serper:  4 batches x 340 + ~300 on-demand = ~1,660 searches/month (under 2,500 free)
    Total:   ~$0.70/month
```

---

## File Reference

### Backend: `jay-backend/app/features/content/`

```
content/
+-- __init__.py                  Package init
+-- models.py                    5 SQLAlchemy models (Ingredient, Article, Concern, Myth, Tip)
+-- schemas.py                   Pydantic response schemas (IngredientOut, ArticleOut, etc.)
+-- router.py                    FastAPI endpoints (GET /ingredients, /articles, etc.)
+-- service.py                   DB queries + on-demand pipeline trigger
+-- pipeline.py                  Orchestrator: per-type fetch -> Gemini -> upsert
+-- prompts.py                   Gemini prompt templates (5 templates + helper)
+-- seed_data.py                 Seed lists (50 ingredients, 20 concerns, 40 articles, etc.)
+-- batch_job.py                 CLI entry point for weekly cron
+-- fetchers/
    +-- __init__.py              Exports all fetchers
    +-- base.py                  FetchResult dataclass + EMPTY_RESULT
    +-- serper.py                Google Search via Serper.dev API
    +-- pubmed.py                PubMed E-utilities (free scientific abstracts)
    +-- incidecoder.py           Incidecoder.com ingredient scraper
    +-- dermnet.py               DermNet NZ condition scraper
    +-- youtube.py               YouTube transcript extractor
    +-- reddit.py                Reddit JSON API fetcher
    +-- webpage.py               Generic URL -> clean text extractor
```

### Frontend: `jay-app/`

```
services/content.ts              API client (contentService.getIngredients, etc.)
stores/contentStore.ts            Zustand store (loadAllForDepartment, per-type loaders)
components/discover/
    SourceAttribution.tsx         "Source: X" link component
    ForYouTab.tsx                 Wired to contentStore with mock fallback
    LearnTab.tsx                  Wired to contentStore with mock fallback
```

### Modified Files

```
jay-backend/app/main.py          Registered content router at /api/v1/content
jay-backend/alembic/env.py       Imported content models for migration detection
jay-app/app/(tabs)/discover.tsx   Added contentStore loading on department change
```

---

## Running the Pipeline

### First-Time Setup

```bash
# 1. Activate venv
cd jay-backend
.venv\Scripts\Activate.ps1   # Windows PowerShell

# 2. Install dependencies (if not already)
pip install beautifulsoup4 lxml youtube-transcript-api

# 3. Run database migration
alembic revision --autogenerate -m "add content tables"
alembic upgrade head

# 4. Run initial batch (populates ~170 items)
python -c "from app.features.content.batch_job import main; main()"
```

### Weekly Cron (Linux/Mac)

```cron
0 3 * * 0 cd /path/to/jay-backend && .venv/bin/python -c "from app.features.content.batch_job import main; main()" >> /var/log/jay-content-batch.log 2>&1
```

### Testing Endpoints

```bash
# List ingredients
curl http://localhost:8000/api/v1/content/ingredients?department=skincare

# Get specific ingredient (triggers on-demand if missing)
curl http://localhost:8000/api/v1/content/ingredients/niacinamide

# List articles by type
curl http://localhost:8000/api/v1/content/articles?type=guide_101

# List concerns
curl http://localhost:8000/api/v1/content/concerns?department=skincare

# Random myths
curl http://localhost:8000/api/v1/content/myths?department=skincare&limit=5

# Random tips by category
curl http://localhost:8000/api/v1/content/tips?category=hydration
```
