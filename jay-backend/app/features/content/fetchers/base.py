from __future__ import annotations
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class FetchResult:
    raw_text: str
    source_url: str
    source_name: str
    success: bool = True
    error: str | None = None


EMPTY_RESULT = FetchResult(raw_text="", source_url="", source_name="", success=False)
