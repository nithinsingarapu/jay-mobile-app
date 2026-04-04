# Discover Section — Real Content from Web Sources

> **Date:** 2026-04-04
> **Status:** Approved
> **Approach:** Multi-Source Aggregator + LLM Categorizer/Structurer (Approach C)

---

## Summary

Replace all mock/hardcoded editorial content in the Discover section with real data scraped from authoritative web sources. Every piece of content is attributed to its source. An LLM (Gemini) categorizes and structures raw web data — it does not generate content.

**Content types:** Ingredients, Articles/Guides, Expert Tips, Myth Busters, Concerns, Quick Tips, Product Alternatives.

**Data freshness:** Batch pipeline (weekly) pre-populates top ~170 items. On-demand pipeline fills gaps when users request content not yet in DB. Content older than 30 days is considered stale and re-fetched.

---

## 1. Database Schema

All tables live in the existing `jay-backend` PostgreSQL database. No user-specific data — shared reference content.

### 1.1 `ingredients`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(100) | "Niacinamide", "Salicylic Acid" |
| slug | varchar(100) | URL-safe, unique |
| also_known_as | text[] | Alternate names |
| category | varchar(50) | LLM-assigned: vitamin, acid, peptide, antioxidant, humectant, emollient, surfactant, preservative, botanical, other |
| what_it_does | text | One-liner summary |
| how_it_works | text | 2-3 sentence mechanism |
| benefits | text[] | List of benefits |
| who_its_for | text[] | Skin types / concerns it helps |
| avoid_with | text[] | Conflicting ingredients |
| safety_rating | varchar(20) | LLM-assigned: safe, caution, prescription |
| concentration_range | varchar(50) | Effective % range if known |
| facts | jsonb | `[{text, source_url, source_name}]` — attributed claims |
| image_url | varchar(500) | |
| sources | jsonb | All source URLs used |
| departments | text[] | LLM-assigned: skincare, haircare, bodycare |
| tags | text[] | LLM-assigned freeform tags |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fetched_at | timestamptz | When last refreshed from sources |

### 1.2 `articles`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| slug | varchar(200) | unique |
| title | varchar(300) | |
| type | varchar(30) | LLM-assigned: guide_101, expert_tip, editorial, popular_read |
| summary | text | 2-3 sentence preview |
| body | text | Full content (markdown), every claim attributed |
| author_name | varchar(100) | Original author |
| author_credential | varchar(200) | "Board-Certified Dermatologist" etc. |
| author_image_url | varchar(500) | |
| image_url | varchar(500) | Hero image |
| read_time_minutes | int | LLM-estimated |
| tags | text[] | LLM-assigned |
| departments | text[] | LLM-assigned |
| concerns | text[] | LLM-assigned related concerns |
| source_url | varchar(500) | Original article URL |
| source_name | varchar(100) | "DermNet NZ", "AAD", etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fetched_at | timestamptz | |

### 1.3 `concerns`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(100) | "Acne", "Hair Fall" |
| slug | varchar(100) | unique |
| description | text | What it is |
| causes | jsonb | `[{text, source_url, source_name}]` |
| symptoms | jsonb | `[{text, source_url, source_name}]` |
| treatments | jsonb | `[{text, source_url, source_name}]` |
| recommended_ingredients | text[] | Ingredient names (link to ingredients table by name) |
| avoid_ingredients | text[] | |
| lifestyle_tips | jsonb | `[{text, source_url, source_name}]` |
| image_url | varchar(500) | |
| severity_levels | jsonb | LLM-structured: mild/moderate/severe descriptions |
| departments | text[] | LLM-assigned |
| tags | text[] | LLM-assigned |
| sources | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fetched_at | timestamptz | |

### 1.4 `myths`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| myth | text | The false claim |
| truth | text | The evidence-based reality |
| explanation | text | Why it's wrong, with nuance |
| source_url | varchar(500) | Primary source debunking it |
| source_name | varchar(100) | |
| departments | text[] | LLM-assigned |
| tags | text[] | LLM-assigned |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fetched_at | timestamptz | |

### 1.5 `tips`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| title | varchar(200) | |
| body | text | Actionable advice |
| category | varchar(50) | LLM-assigned: hydration, sun_protection, cleansing, exfoliation, anti_aging, diet, lifestyle, etc. |
| source_url | varchar(500) | |
| source_name | varchar(100) | |
| departments | text[] | LLM-assigned |
| tags | text[] | LLM-assigned |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| fetched_at | timestamptz | |

---

## 2. Content Pipeline

### 2.1 Source Fetchers

Seven typed fetchers, each returns `{raw_text: str, source_url: str, source_name: str}`:

| Fetcher | Source | Method | Rate Limits |
|---------|--------|--------|-------------|
| `SerperFetcher` | Google Search | Serper.dev API (existing key) | 2,500/mo free |
| `PubMedFetcher` | PubMed | E-utilities API (free, no key) | 3 req/sec |
| `IncidecoderFetcher` | Incidecoder.com | HTTP scrape + BeautifulSoup | Respectful: 1 req/2sec |
| `DermNetFetcher` | DermNet NZ | HTTP scrape + BeautifulSoup | Respectful: 1 req/2sec |
| `YouTubeFetcher` | YouTube | youtube-transcript-api (Python lib) | Transcript extraction, no API key |
| `RedditFetcher` | Reddit | old.reddit.com/{sub}.json | No auth, 1 req/2sec |
| `WebpageFetcher` | Any URL | HTTP + readability extraction | For following Serper result URLs |

All fetchers:
- Have retry logic (3 attempts, exponential backoff)
- Return empty result on failure (never crash the pipeline)
- Log source, status, and latency
- Respect robots.txt and rate limits

### 2.2 Aggregator

Per content type, the aggregator queries 2-4 sources **in parallel** (asyncio.gather):

| Content Type | Sources | Query Pattern |
|---|---|---|
| **Ingredient** | Incidecoder + PubMed + Serper | `incidecoder.com/ingredients/{slug}`, PubMed `{name} skin`, Serper `"{name}" skincare benefits site:ncbi.nlm.nih.gov OR site:paulaschoice.com` |
| **Article** | Serper → WebpageFetcher (top 3) + DermNet | Serper `{topic} skincare guide`, fetch top 3 result pages |
| **Expert Tip** | YouTube + Serper | YouTube transcript from derm channels, Serper `dermatologist {topic} advice` |
| **Myth** | Reddit + PubMed + Serper | Reddit search in skincare subs, PubMed for evidence, Serper for context |
| **Concern** | DermNet + PubMed + Serper | DermNet `/{condition}`, PubMed `{condition} treatment`, Serper for images |
| **Tip** | Reddit + YouTube + Serper | Reddit top tips, derm YouTube tips, Serper lifestyle tips |
| **Alternative** | Incidecoder + Serper | Incidecoder ingredient overlap, Serper `"{product}" alternatives India` |

### 2.3 LLM Structurer + Categorizer (Gemini 2.5 Flash)

Single Gemini call per content item. The LLM:

**Structures:** Converts messy web text into the exact JSON schema for the target table.

**Categorizes:** Assigns departments, tags, concern links, safety ratings, skin type suitability, article type, tip category — all from analyzing the raw content.

**Attributes:** Every factual claim in the output includes `source_url` and `source_name` from the provided sources.

**Does NOT:** Generate new claims, invent facts, or add information not present in the source material.

Prompt template pattern:
```
You are a skincare content processor. Given raw data from multiple web sources
about {content_type} "{name}", produce a structured JSON entry.

RULES:
- Every factual claim MUST cite a source_url from the provided sources
- Categorize: {category_instructions_per_type}
- Assign departments from: [skincare, haircare, bodycare]
- Assign relevant tags for discoverability
- Do NOT generate information not present in the sources
- If sources conflict, note both views with their respective sources
- Output valid JSON matching the schema exactly

RAW SOURCES:
---SOURCE 1: {source_1_name} ({source_1_url})---
{source_1_text}
---SOURCE 2: {source_2_name} ({source_2_url})---
{source_2_text}
...

OUTPUT JSON SCHEMA:
{json_schema}
```

### 2.4 Execution Modes

**Batch (weekly cron job):**
```
Seed lists:
- 50 ingredients (niacinamide, retinol, hyaluronic acid, vitamin c, salicylic acid, ...)
- 20 concerns (acne, pigmentation, hair fall, dryness, sensitivity, aging, ...)
- 40 article topics ("skincare 101 beginners", "how to use retinol", "SPF guide india", ...)
- 30 myths (common skincare/haircare myths)
- 30 tips (quick actionable skincare tips)

Flow:
1. For each seed item, check DB: skip if fetched_at < 7 days old
2. Run Aggregator → LLM → upsert to DB
3. Concurrency: 5 items in parallel (respect rate limits)
4. Log: items processed, failures, token usage, total time
5. Report: send summary to console/log
```

**On-demand (user request, miss or stale):**
```
1. API receives request for ingredient/concern/article
2. Check DB: if exists and fetched_at < 30 days → return from DB
3. If miss or stale: run Aggregator → LLM → insert/update DB
4. Return result to frontend
5. Timeout: 30 seconds max, return partial if available
```

### 2.5 Cost Estimate

- Gemini 2.5 Flash: ~$0.15/1M input, ~$0.60/1M output tokens
- Batch of 170 items × ~4K input + ~1K output tokens avg = ~850K tokens total ≈ **$0.15 per full weekly batch**
- Serper: ~340 searches per batch (2 per item avg) = fits in 2,500/mo free tier
- PubMed: free, no limits at our volume
- On-demand: ~$0.001 per request

---

## 3. Backend API Endpoints

New router: `/api/v1/content/`

All endpoints are public (noAuth) — this is reference content.

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/ingredients` | `IngredientOut[]` | Query: `?department=&category=&limit=&offset=` |
| GET | `/ingredients/{slug}` | `IngredientOut` | On-demand fetch if missing/stale |
| GET | `/articles` | `ArticleOut[]` | Query: `?type=&department=&limit=&offset=` |
| GET | `/articles/{slug}` | `ArticleOut` | Full article with body |
| GET | `/concerns` | `ConcernOut[]` | Query: `?department=&limit=` |
| GET | `/concerns/{slug}` | `ConcernOut` | On-demand fetch if missing/stale |
| GET | `/myths` | `MythOut[]` | Query: `?department=&limit=` |
| GET | `/tips` | `TipOut[]` | Query: `?department=&category=&limit=` |
| GET | `/products/{product_id}/alternatives` | `ProductOut[]` | On-demand: finds alternatives by ingredient overlap + Serper |

---

## 4. Frontend Integration

### 4.1 New Service: `services/content.ts`

```typescript
contentService.getIngredients(params)        // GET /api/v1/content/ingredients
contentService.getIngredient(slug)           // GET /api/v1/content/ingredients/{slug}
contentService.getArticles(params)           // GET /api/v1/content/articles
contentService.getArticle(slug)              // GET /api/v1/content/articles/{slug}
contentService.getConcerns(params)           // GET /api/v1/content/concerns
contentService.getConcern(slug)              // GET /api/v1/content/concerns/{slug}
contentService.getMyths(params)              // GET /api/v1/content/myths
contentService.getTips(params)               // GET /api/v1/content/tips
contentService.getAlternatives(productId)    // GET /api/v1/content/products/{id}/alternatives
```

### 4.2 New Store: `stores/contentStore.ts`

Zustand store holding:
- `ingredients`, `articles`, `concerns`, `myths`, `tips` — arrays loaded per department
- `selectedIngredient`, `selectedArticle`, `selectedConcern` — detail views
- `isLoading` per content type
- Actions: `loadIngredients(dept)`, `loadArticles(dept, type)`, etc.

### 4.3 Tab Content Changes

**For You Tab** — Replace mock data:
- Featured article → `articles` where type = "editorial", limit 1
- Trending → keep (real products already)
- Ingredient spotlight → `ingredients` random 1 per department
- Concern pills → `concerns` filtered by department
- Expert corner → `articles` where type = "expert_tip", limit 3
- Quick tips → `tips` filtered by department, limit 5
- Popular reads → `articles` where type = "popular_read", limit 4

**Products Tab** — Mostly unchanged (already real). Add:
- Product detail Alternatives tab → `contentService.getAlternatives(id)`

**Learn Tab** — Replace mock data:
- Guides 101 → `articles` where type = "guide_101"
- Ingredient dictionary → `ingredients` with search/filter
- By Concern grid → `concerns`
- Myth busters → `myths`
- Expert articles → `articles` where type = "expert_tip"

### 4.4 Source Attribution UI

Every piece of content shows a small "Source: {source_name}" link at the bottom. Tapping opens the source URL in the in-app browser. This builds trust and gives credit.

---

## 5. File Structure

### Backend
```
jay-backend/app/features/content/
├── __init__.py
├── models.py          # SQLAlchemy models (5 tables)
├── schemas.py         # Pydantic input/output schemas
├── router.py          # API endpoints
├── service.py         # DB queries + on-demand pipeline trigger
├── pipeline.py        # Aggregator + LLM structurer orchestration
├── fetchers/
│   ├── __init__.py
│   ├── base.py        # BaseFetcher abstract class
│   ├── serper.py      # Google Search via Serper
│   ├── pubmed.py      # PubMed E-utilities
│   ├── incidecoder.py # Incidecoder scraper
│   ├── dermnet.py     # DermNet NZ scraper
│   ├── youtube.py     # YouTube transcript extractor
│   ├── reddit.py      # Reddit JSON fetcher
│   └── webpage.py     # Generic URL → clean text
├── prompts.py         # Gemini prompt templates per content type
├── seed_data.py       # Seed lists for batch pipeline
└── batch_job.py       # Weekly cron entry point
```

### Frontend
```
jay-app/
├── services/content.ts          # API client
├── stores/contentStore.ts       # Zustand store
└── components/discover/
    ├── SourceAttribution.tsx     # "Source: X" link component
    └── (existing components updated to use real data)
```

---

## 6. Migration & Rollout

1. Create Alembic migration for 5 new tables
2. Register content router in `main.py` at `/api/v1/content`
3. Run initial batch job to seed ~170 items
4. Update frontend tabs to consume real API (fallback to existing mock if API returns empty)
5. Remove `mockDiscoverContent.ts` once all content flows through API
