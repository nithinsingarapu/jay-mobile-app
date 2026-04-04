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

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    article = soup.select_one("article") or soup.select_one("[role=main]") or soup.select_one("main") or soup.body
    text = article.get_text(separator="\n", strip=True) if article else ""

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean = "\n".join(lines)

    domain = url.split("//")[-1].split("/")[0].replace("www.", "")
    return FetchResult(raw_text=clean[:8000], source_url=url, source_name=domain)
