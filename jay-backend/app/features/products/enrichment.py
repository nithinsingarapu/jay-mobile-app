"""
Product enrichment via Serper.dev (Google Shopping + Google Images).
Ensures complete data — retries with alternate queries if fields are missing.
"""
import os
import re
import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Product
from app.config import get_settings

logger = logging.getLogger(__name__)

SERPER_SHOPPING_URL = "https://google.serper.dev/shopping"
SERPER_IMAGES_URL = "https://google.serper.dev/images"


def _get_serper_key() -> str:
    return os.environ.get("SERPER_API_KEY", "") or get_settings().serper_api_key


def _parse_price(price_str: str | None) -> Decimal | None:
    if not price_str:
        return None
    cleaned = re.sub(r'[^\d.]', '', str(price_str))
    try:
        val = Decimal(cleaned).quantize(Decimal("0.01"))
        return val if val > 0 else None
    except Exception:
        return None


def _is_real_url(url: str | None) -> bool:
    """Filter out base64 data URIs and empty strings."""
    return bool(url and url.startswith("http"))


async def _serper_request(endpoint: str, query: str) -> dict | None:
    api_key = _get_serper_key()
    if not api_key:
        return None
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    payload = {"q": query, "gl": "in", "hl": "en", "num": 10}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(endpoint, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def _search_shopping(query: str) -> list[dict]:
    data = await _serper_request(SERPER_SHOPPING_URL, query)
    return data.get("shopping", []) if data else []


async def _search_images(query: str) -> list[str]:
    data = await _serper_request(SERPER_IMAGES_URL, query)
    if not data:
        return []
    return [img["imageUrl"] for img in data.get("images", []) if _is_real_url(img.get("imageUrl"))]


async def enrich_single_product(product_id: int, db: AsyncSession) -> dict:
    """
    Enrich a single product. Tries multiple strategies to get complete data.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        return {"error": "Product not found"}

    if not _get_serper_key():
        return {"error": "No SERPER_API_KEY configured"}

    now = datetime.now(timezone.utc)

    # Try multiple search queries (most specific → broader)
    queries = [
        f"{product.brand} {product.name} price India",
        f"{product.brand} {product.name} buy online India",
        f"{product.name} skincare India",
    ]

    best_price: Decimal | None = None
    best_image: str | None = None
    best_rating: Decimal | None = None
    best_reviews: int | None = None
    best_link: str | None = None
    best_source: str | None = None
    all_images: list[str] = []

    for query in queries:
        try:
            shopping = await _search_shopping(query)
        except Exception as e:
            logger.warning(f"[Enrich] Shopping search failed for '{query}': {e}")
            continue

        for item in shopping:
            # Price
            if best_price is None:
                best_price = _parse_price(item.get("price"))

            # Image (only real URLs)
            img = item.get("imageUrl", "")
            if _is_real_url(img):
                if best_image is None:
                    best_image = img
                if img not in all_images:
                    all_images.append(img)

            # Rating
            if best_rating is None and item.get("rating") is not None:
                try:
                    best_rating = Decimal(str(item["rating"])).quantize(Decimal("0.1"))
                except Exception:
                    pass

            # Reviews
            if best_reviews is None and item.get("ratingCount") is not None:
                try:
                    best_reviews = int(item["ratingCount"])
                except Exception:
                    pass

            # Buy link
            if best_link is None and item.get("link"):
                best_link = item["link"]

            # Source
            if best_source is None and item.get("source"):
                best_source = item["source"]

        # If we have all critical fields, stop early
        if all([best_price, best_image, best_rating is not None]):
            break

    # If still no image, try Google Images as fallback
    if not best_image:
        try:
            image_results = await _search_images(f"{product.brand} {product.name} product")
            if image_results:
                best_image = image_results[0]
                all_images = image_results[:10]
        except Exception as e:
            logger.warning(f"[Enrich] Image search failed: {e}")

    # Fallback values — never leave critical fields as null
    if best_price is None:
        best_price = Decimal("0.00")  # 0 signals "price not found" — frontend shows "Price TBD"
    if best_rating is None:
        best_rating = Decimal("0.0")
    if best_reviews is None:
        best_reviews = 0
    if best_source is None:
        best_source = "Google Shopping"
    if best_image is None:
        best_image = ""  # empty string, frontend handles with placeholder

    updates = {
        "price_inr": best_price if best_price > 0 else None,  # keep null for genuinely unknown prices
        "image_url": best_image or None,
        "image_urls": all_images[:10] if all_images else [],
        "rating": best_rating if best_rating > 0 else None,
        "review_count": best_reviews if best_reviews > 0 else None,
        "buy_url": best_link,
        "price_source": best_source,
        "price_updated_at": now,
        "serp_enriched_at": now,
        "updated_at": now,
    }

    await db.execute(
        update(Product).where(Product.id == product_id).values(**updates)
    )
    await db.commit()

    return {
        "status": "enriched",
        "product_id": product_id,
        "price": float(best_price) if best_price and best_price > 0 else None,
        "rating": float(best_rating) if best_rating and best_rating > 0 else None,
        "review_count": best_reviews,
        "image": best_image or None,
        "source": best_source,
        "total_images": len(all_images),
    }


async def enrich_bulk(db: AsyncSession, limit: int = 50, delay: float = 0.5) -> dict:
    result = await db.execute(
        select(Product)
        .where(Product.serp_enriched_at.is_(None))
        .order_by(Product.id)
        .limit(limit)
    )
    products = result.scalars().all()

    if not products:
        return {"status": "nothing_to_enrich", "processed": 0}

    enriched = 0
    failed = 0

    for product in products:
        try:
            res = await enrich_single_product(product.id, db)
            if res.get("status") == "enriched":
                enriched += 1
            else:
                failed += 1
        except Exception as e:
            logger.error(f"[Enrich] Failed product {product.id}: {e}")
            failed += 1
        await asyncio.sleep(delay)

    return {"status": "complete", "total": len(products), "enriched": enriched, "failed": failed}
