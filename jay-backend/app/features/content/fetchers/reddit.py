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
