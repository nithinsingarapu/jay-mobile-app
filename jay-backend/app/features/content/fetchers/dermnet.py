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
