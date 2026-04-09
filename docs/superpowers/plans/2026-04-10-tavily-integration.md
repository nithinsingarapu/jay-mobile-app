# Tavily Search Integration — Implementation Plan

## 1. Architecture

```
BEFORE (current):
  prompt ──► [Gemini + black-box GoogleSearch()] ──► answer
             (no control over what's searched)

AFTER (Tavily):
  queries ──► [Tavily API] ──► structured results ──► prompt + context ──► [Gemini] ──► answer
  (explicit)   (controlled)     (visible, cached)      (synthesis only)     (no search tool)
```

**Data flow per branch:**

```
┌──────────────────────────────────────────────────────────────┐
│  Stage 2A: Ingredient Analysis                                │
│                                                                │
│  1. Build 3 Tavily queries from Stage 1 data                  │
│     ├── "{product} INCI ingredient list"                       │
│     ├── "{active_1} {active_2} clinical evidence PubMed"       │
│     └── "{product} ingredient safety comedogenic"              │
│                                                                │
│  2. asyncio.gather(query_1, query_2, query_3)                  │
│     └── Returns: [{title, url, content}, ...]                  │
│                                                                │
│  3. Format into context block:                                 │
│     ━━━ SEARCH RESULT 1: {title} ({url}) ━━━                  │
│     {content snippet, max 1500 chars}                          │
│     ━━━ SEARCH RESULT 2: ...                                   │
│                                                                │
│  4. Inject context into Gemini prompt:                         │
│     system_prompt + "\n\nRESEARCH CONTEXT:\n{context_block}"   │
│     user_prompt (unchanged)                                    │
│     NO GoogleSearch() tool                                     │
│                                                                │
│  5. Gemini synthesizes from provided context                   │
└──────────────────────────────────────────────────────────────┘
```

## 2. File Structure

```
jay-backend/app/features/research/
├── __init__.py           (no change)
├── models.py             (no change)
├── schemas.py            (no change)
├── router.py             (no change)
├── pdf_export.py         (no change)
├── pipeline.py           (MODIFY: add Tavily context injection)
└── tavily_client.py      (NEW: Tavily async client + query builder)
```

**Modified: `app/config.py`** — add Tavily settings

## 3. New File: `tavily_client.py`

```python
"""
Tavily Search client for JAY Research pipeline.
Fetches structured search results for LLM consumption.
"""
import asyncio
import logging
from dataclasses import dataclass

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    title: str
    url: str
    content: str
    score: float  # Tavily relevance score 0-1


async def tavily_search(
    query: str,
    search_depth: str = "advanced",
    max_results: int = 5,
    include_domains: list[str] | None = None,
    topic: str = "general",
) -> list[SearchResult]:
    """
    Single Tavily search call. Returns structured results.
    Falls back to empty list on any error.
    """
    api_key = get_settings().tavily_api_key
    if not api_key:
        return []

    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=api_key)
        params = {
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "topic": topic,
        }
        if include_domains:
            params["include_domains"] = include_domains

        resp = await client.search(**params)
        results = []
        for r in resp.get("results", []):
            results.append(SearchResult(
                title=r.get("title", ""),
                url=r.get("url", ""),
                content=r.get("content", "")[:2000],  # cap per result
                score=r.get("score", 0),
            ))
        return results
    except Exception as e:
        logger.warning(f"Tavily search failed for '{query[:60]}': {e}")
        return []


async def tavily_multi_search(
    queries: list[dict],
) -> dict[str, list[SearchResult]]:
    """
    Run multiple Tavily searches in parallel.
    queries = [{"key": "inci", "query": "...", "max_results": 5, ...}, ...]
    Returns: {"inci": [SearchResult, ...], "safety": [...]}
    """
    async def _run(q: dict) -> tuple[str, list[SearchResult]]:
        results = await tavily_search(
            query=q["query"],
            search_depth=q.get("search_depth", "advanced"),
            max_results=q.get("max_results", 5),
            include_domains=q.get("include_domains"),
            topic=q.get("topic", "general"),
        )
        return q["key"], results

    gathered = await asyncio.gather(*[_run(q) for q in queries], return_exceptions=True)
    out = {}
    for item in gathered:
        if isinstance(item, tuple):
            out[item[0]] = item[1]
        # Exceptions silently produce empty results
    return out


def format_context_block(
    results: dict[str, list[SearchResult]],
    max_total_chars: int = 12000,
) -> str:
    """
    Format Tavily results into a context block for Gemini prompt injection.
    Respects token budget by truncating.
    """
    parts = []
    chars = 0
    for key, items in results.items():
        for i, r in enumerate(items):
            if chars >= max_total_chars:
                break
            block = f"━━━ {key.upper()} RESULT {i+1}: {r.title} ({r.url}) ━━━\n{r.content}\n"
            parts.append(block)
            chars += len(block)
        if chars >= max_total_chars:
            break
    return "\n".join(parts)
```

## 4. Query Design Per Branch

### Stage 1: Product Identification
**Queries (3, parallel):**

| Key | Query Template | max_results | include_domains | Rationale |
|-----|---------------|-------------|-----------------|-----------|
| `product_info` | `"{product_name}" official product details ingredients price` | 5 | None | Core product page |
| `inci` | `"{product_name}" INCI ingredient list full` | 3 | `["incidecoder.com", "skinsort.com", "cosdna.com"]` | INCI from trusted decoders |
| `price` | `"{product_name}" price buy {market}` | 3 | `["amazon.in", "amazon.com", "nykaa.com"]` | Real pricing |

**Context budget:** ~4000 chars (Stage 1 has 4096 output tokens — keep input lean)

### Stage 2A: Ingredient Analysis
**Queries (3, parallel):**

| Key | Query Template | max_results | topic | Rationale |
|-----|---------------|-------------|-------|-----------|
| `inci_analysis` | `"{product_name}" ingredient analysis safety review` | 5 | general | General ingredient commentary |
| `actives_evidence` | `{top_3_actives} clinical study efficacy skin PubMed` | 5 | general | Clinical evidence for key actives |
| `safety` | `"{product_name}" ingredient safety pregnancy comedogenic` | 3 | general | Safety concerns |

**Context budget:** ~8000 chars (prompt + context must leave room for 16384 output)

### Stage 2B: User Reviews
**Queries (4, parallel):**

| Key | Query Template | max_results | include_domains | Rationale |
|-----|---------------|-------------|-----------------|-----------|
| `amazon` | `"{product_name}" review` | 5 | `["amazon.in", "amazon.com"]` | Amazon reviews |
| `reddit` | `"{product_name}" review experience` | 5 | `["reddit.com"]` | Reddit threads |
| `beauty` | `"{product_name}" review` | 3 | `["nykaa.com", "sephora.com", "makeupalley.com"]` | Beauty platform reviews |
| `youtube` | `"{product_name}" review honest` | 3 | `["youtube.com"]` | YouTube review summaries |

**Context budget:** ~10000 chars (reviews need the most context)

### Stage 2C: Expert/Derm Reviews
**Queries (3, parallel):**

| Key | Query Template | max_results | include_domains | Rationale |
|-----|---------------|-------------|-----------------|-----------|
| `derm_youtube` | `"{product_name}" dermatologist review Dr. Dray OR Dr. Sam Bunting` | 5 | `["youtube.com"]` | Derm YouTube reviews |
| `expert_blog` | `"{product_name}" dermatologist opinion review` | 5 | None | Expert blogs/articles |
| `pubmed` | `{key_active_ingredients} skin clinical trial` | 3 | `["pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov"]` | PubMed studies |

**Context budget:** ~8000 chars

### Stage 2D: Brand Intelligence
**Queries (3, parallel):**

| Key | Query Template | max_results | Rationale |
|-----|---------------|-------------|-----------|
| `brand_history` | `"{brand}" {parent_company} history founding ownership` | 5 | Company background |
| `controversy` | `"{brand}" controversy lawsuit recall FDA warning` | 5 | Red flags |
| `reputation` | `"{brand}" brand reputation review transparency cruelty-free` | 3 | Certifications + perception |

**Context budget:** ~8000 chars

### Stage 2E: Claims & Alternatives
**Queries (3, parallel):**

| Key | Query Template | max_results | Rationale |
|-----|---------------|-------------|-----------|
| `claims_evidence` | `"{product_name}" {claim_1} {claim_2} evidence clinical` | 5 | Evidence for top claims |
| `alternatives` | `best {category} alternative to {product_name} {market}` | 5 | Alternative products |
| `comparison` | `"{product_name}" vs comparison {category}` | 3 | Head-to-head comparisons |

**Context budget:** ~8000 chars

## 5. Pipeline Modification (`pipeline.py`)

### New function: `_research_with_tavily()`

```python
async def _research_with_tavily(
    system_prompt: str,
    user_prompt: str,
    tavily_queries: list[dict],
    max_tokens: int = 16384,
    stage: str = "",
    context_budget: int = 8000,
) -> str:
    """
    1. Run Tavily queries in parallel
    2. Format results as context block
    3. Inject into Gemini prompt (WITHOUT GoogleSearch tool)
    4. Fallback to GoogleSearch if Tavily returns nothing
    """
    from .tavily_client import tavily_multi_search, format_context_block

    # Step 1: Fetch Tavily results
    results = await tavily_multi_search(tavily_queries)
    context = format_context_block(results, max_total_chars=context_budget)

    if context.strip():
        # Step 2: Gemini synthesis (NO search tool)
        augmented_prompt = (
            f"{user_prompt}\n\n"
            f"━━━ RESEARCH CONTEXT (from web search) ━━━\n"
            f"{context}\n"
            f"━━━ END CONTEXT ━━━\n\n"
            f"Use the research context above to ground your analysis. "
            f"Cite specific sources by URL where relevant."
        )
        return await _research_no_search(system_prompt, augmented_prompt, max_tokens, stage)
    else:
        # Step 3: Fallback to GoogleSearch grounding
        logger.warning(f"  [{stage}] Tavily returned no results, falling back to GoogleSearch")
        return await _research(system_prompt, user_prompt, max_tokens, stage)
```

### New function: `_research_no_search()`

```python
async def _research_no_search(
    system_prompt: str, user_prompt: str, max_tokens: int = 16384, stage: str = ""
) -> str:
    """Gemini call WITHOUT Google Search tool (pure synthesis from provided context)."""
    from google.genai import types
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        max_output_tokens=max_tokens,
        temperature=0.4,
        # NO tools — Gemini synthesizes from the injected context only
    )
    # Same retry + continuation logic as _research(), minus grounding strip
    # [identical loop structure, just using config without tools]
```

### Modified `_run_branch()` in `run_research()`

```python
async def _run_branch(key, system, prompt, tavily_queries):
    await _save(key)
    result = await _research_with_tavily(
        system_prompt=system,
        user_prompt=prompt,
        tavily_queries=tavily_queries,
        max_tokens=16384,
        stage=key,
    )
    setattr(research, FIELD_MAP[key], result)
    await db.commit()
    return result
```

## 6. Fallback Strategy

```
tavily_multi_search(queries)
    ├── ALL succeed → format_context_block → _research_no_search()
    ├── SOME succeed → format from partial results → _research_no_search()
    ├── ALL fail → log warning → _research() [with GoogleSearch tool, current behavior]
    └── Tavily disabled (no API key) → _research() [current behavior]
```

**The fallback is zero-risk:** if Tavily is unavailable, the pipeline behaves exactly as it does today.

## 7. Config Additions

```python
# app/config.py — add to Settings class:
tavily_api_key: str = ""
tavily_enabled: bool = True         # feature flag
tavily_search_depth: str = "advanced"  # "basic" or "advanced"
tavily_max_results: int = 5
```

```env
# .env additions:
TAVILY_API_KEY=tvly-...
TAVILY_ENABLED=true
```

## 8. Parallelization Strategy

```
Stage 1 (sequential):
  [3 Tavily queries in parallel] → format → [1 Gemini call]

Stage 2 (5 branches in parallel, each with internal parallelism):
  Branch 2A: [3 Tavily queries ∥] → format → [1 Gemini call]
  Branch 2B: [4 Tavily queries ∥] → format → [1 Gemini call]
  Branch 2C: [3 Tavily queries ∥] → format → [1 Gemini call]
  Branch 2D: [3 Tavily queries ∥] → format → [1 Gemini call]
  Branch 2E: [3 Tavily queries ∥] → format → [1 Gemini call]

Stage 3 (sequential, no Tavily — pure synthesis):
  [1 Gemini call, no search]

Total: All 5 branches fire at once, each branch's 3-4 Tavily queries fire in parallel.
Peak concurrent Tavily calls: ~19 (3 + 4 + 3 + 3 + 3 + 3 from Stage 1 finishing)
Practical peak: ~16 (Stage 1 finishes before Stage 2 starts)
```

## 9. API Call Count & Cost

| Stage | Tavily Calls | Gemini Calls |
|-------|-------------|-------------|
| Stage 1 | 3 | 1 |
| Stage 2A | 3 | 1 |
| Stage 2B | 4 | 1 |
| Stage 2C | 3 | 1 |
| Stage 2D | 3 | 1 |
| Stage 2E | 3 | 1 |
| Stage 3 | 0 | 1 |
| **Total** | **19** | **7** |

**Cost per report:**
- Tavily: 19 calls × ~$0.005 = ~$0.10 (on paid plan)
- Gemini: ~$0.02-0.10 (unchanged)
- **Total: ~$0.12-0.20 per report** (vs ~$0.02-0.10 before)

**Free tier:** 1000 Tavily calls/month = ~52 reports/month

## 10. Phased Rollout

| Phase | Branch | Rationale | Risk |
|-------|--------|-----------|------|
| **Phase 1** | Stage 2B (reviews) | Highest impact — Tavily finds real Amazon/Reddit/Nykaa reviews that Gemini's GoogleSearch often misses. Review quality is the most user-visible improvement. | Low — reviews are non-critical |
| **Phase 2** | Stage 2D (brand) | Brand controversies, FDA actions, ownership info — Tavily's targeted domain search excels here. Currently weakest branch. | Low |
| **Phase 3** | Stage 2C (experts) | Derm YouTube reviews + PubMed — domain-filtered search gives much better results than Gemini's broad search. | Low |
| **Phase 4** | Stage 2E (claims) + Stage 2A (ingredients) | Claims verification benefits from targeted evidence search. Ingredients is already strong with Gemini's chemistry reasoning. | Medium — ingredients may not improve much |
| **Phase 5** | Stage 1 (identify) | Product identification is already reliable. Tavily could help with INCI lists from INCIDecoder. | Low priority |

**Recommendation for v1:** Implement Phases 1-3 (reviews, brand, experts). These are the branches where controlled search gives the biggest quality jump. Stage 2A (ingredients) and Stage 1 work well with Gemini's built-in reasoning — Tavily adds less value there.

## 11. Implementation Checklist

- [ ] `pip install tavily-python` in venv
- [ ] Add `tavily_api_key` + `tavily_enabled` to `app/config.py`
- [ ] Add `TAVILY_API_KEY` to `.env`
- [ ] Create `jay-backend/app/features/research/tavily_client.py`
- [ ] Add `_research_no_search()` to `pipeline.py`
- [ ] Add `_research_with_tavily()` to `pipeline.py`
- [ ] Update `_run_branch()` to accept `tavily_queries` param
- [ ] Wire Stage 2B (reviews) queries — test first
- [ ] Wire Stage 2D (brand) queries
- [ ] Wire Stage 2C (experts) queries
- [ ] Test full pipeline with Tavily enabled
- [ ] Test fallback with Tavily disabled
- [ ] Commit and push
