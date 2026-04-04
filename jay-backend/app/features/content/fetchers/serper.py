import httpx
import logging
from urllib.parse import urlparse
from app.config import get_settings
from .base import FetchResult

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
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url
