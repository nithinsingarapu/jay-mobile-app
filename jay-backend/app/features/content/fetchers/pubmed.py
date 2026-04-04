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
            search_resp = await client.get(ESEARCH, params={
                "db": "pubmed", "term": f"{query} skincare",
                "retmax": max_results, "retmode": "json", "sort": "relevance",
            })
            search_resp.raise_for_status()
            ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []

            fetch_resp = await client.get(EFETCH, params={
                "db": "pubmed", "id": ",".join(ids),
                "rettype": "abstract", "retmode": "text",
            })
            fetch_resp.raise_for_status()
            full_text = fetch_resp.text

    except Exception as e:
        logger.error(f"PubMed fetch failed for '{query}': {e}")
        return []

    url = f"https://pubmed.ncbi.nlm.nih.gov/{ids[0]}/"
    return [FetchResult(raw_text=full_text[:6000], source_url=url, source_name="PubMed")]
