"""
Tavily Search client for JAY Research.
Used for high-value branches: reviews (2B), experts (2C), claims (2E).
Other branches use Gemini's built-in GoogleSearch.
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
    score: float


async def tavily_search(
    query: str,
    search_depth: str = "advanced",
    max_results: int = 5,
    include_domains: list[str] | None = None,
) -> list[SearchResult]:
    """Single Tavily search. Returns empty list on any failure."""
    api_key = get_settings().tavily_api_key
    if not api_key:
        return []
    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=api_key)
        params: dict = {
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
        }
        if include_domains:
            params["include_domains"] = include_domains

        resp = await client.search(**params)
        return [
            SearchResult(
                title=r.get("title", ""),
                url=r.get("url", ""),
                content=r.get("content", "")[:2000],
                score=r.get("score", 0),
            )
            for r in resp.get("results", [])
        ]
    except Exception as e:
        logger.warning(f"Tavily failed for '{query[:50]}': {e}")
        return []


async def tavily_multi(queries: list[dict]) -> dict[str, list[SearchResult]]:
    """Run multiple Tavily queries in parallel. Returns {key: [results]}."""
    async def _run(q: dict) -> tuple[str, list[SearchResult]]:
        return q["key"], await tavily_search(
            query=q["query"],
            search_depth=q.get("depth", "advanced"),
            max_results=q.get("max", 5),
            include_domains=q.get("domains"),
        )

    gathered = await asyncio.gather(*[_run(q) for q in queries], return_exceptions=True)
    out: dict[str, list[SearchResult]] = {}
    for item in gathered:
        if isinstance(item, tuple):
            out[item[0]] = item[1]
    return out


def format_context(results: dict[str, list[SearchResult]], max_chars: int = 10000) -> str:
    """Format Tavily results into a context block for Gemini prompt injection."""
    parts = []
    chars = 0
    for key, items in results.items():
        for i, r in enumerate(items):
            if chars >= max_chars:
                return "\n".join(parts)
            block = f"━━━ [{key.upper()}] {r.title} ({r.url}) ━━━\n{r.content}\n"
            parts.append(block)
            chars += len(block)
    return "\n".join(parts)
