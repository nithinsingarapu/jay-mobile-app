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
        await asyncio.sleep(1)
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                return EMPTY_RESULT
            soup = BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.error(f"Incidecoder fetch failed for '{slug}': {e}")
        return EMPTY_RESULT

    content_div = (
        soup.select_one("#defined-ingredient")
        or soup.select_one("article")
        or soup.select_one("main")
    )
    text = content_div.get_text(separator="\n", strip=True) if content_div else soup.get_text(separator="\n", strip=True)
    return FetchResult(raw_text=text[:5000], source_url=url, source_name="Incidecoder")
