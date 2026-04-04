import logging
from urllib.parse import urlparse, parse_qs
from .base import FetchResult, EMPTY_RESULT
from .serper import serper_search

logger = logging.getLogger(__name__)


async def youtube_transcript(topic: str) -> FetchResult:
    """Get transcript from a dermatologist YouTube video on the topic."""
    query = f"site:youtube.com {topic} skincare dermatologist"
    serper_results = await serper_search(query, num=3)

    for result in serper_results:
        if "youtube.com/watch" not in result.source_url:
            continue
        try:
            video_id = _extract_video_id(result.source_url)
            if not video_id:
                continue

            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            text = " ".join(entry["text"] for entry in transcript_list)
            title = result.raw_text.split("\n")[0]
            return FetchResult(
                raw_text=f"YouTube video: {title}\n\nTranscript:\n{text[:6000]}",
                source_url=result.source_url,
                source_name="YouTube",
            )
        except Exception as e:
            logger.debug(f"Transcript failed for {result.source_url}: {e}")
            continue

    return EMPTY_RESULT


def _extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")
    return None
