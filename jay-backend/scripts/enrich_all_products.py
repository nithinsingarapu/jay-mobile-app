#!/usr/bin/env python3
"""
One-time bulk enrichment of all products via Serper.dev.

Usage:
  cd jay-backend
  .venv/Scripts/Activate.ps1
  python scripts/enrich_all_products.py --batch-size 50 --delay 0.5

Safe to stop and restart — already-enriched products are skipped.
"""
import os
import sys
import asyncio
import argparse
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from app.database import async_session_factory
from app.features.products.models import Product
from app.features.products.enrichment import enrich_single_product

logging.basicConfig(level=logging.WARNING, format="%(asctime)s %(message)s")
logger = logging.getLogger("enrich")
logger.setLevel(logging.INFO)
# Silence SQLAlchemy echo
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


async def main(batch_size: int, delay: float):
    if not os.environ.get("SERPER_API_KEY"):
        logger.error("SERPER_API_KEY not set!")
        logger.error("  PowerShell: $env:SERPER_API_KEY='your_key'")
        logger.error("  bash: export SERPER_API_KEY=your_key")
        sys.exit(1)

    # Get counts
    async with async_session_factory() as db:
        total = (await db.execute(select(func.count(Product.id)))).scalar() or 0
        done = (await db.execute(
            select(func.count(Product.id)).where(Product.serp_enriched_at.isnot(None))
        )).scalar() or 0
        remaining = total - done

    logger.info(f"Total: {total} | Done: {done} | Remaining: {remaining}")
    logger.info(f"Batch: {batch_size}, Delay: {delay}s")
    logger.info("=" * 60)

    if remaining == 0:
        logger.info("All products already enriched!")
        return

    processed = 0
    enriched = 0
    failed = 0
    no_results = 0

    while True:
        # Get next batch of product IDs (fresh session for the query)
        async with async_session_factory() as db:
            result = await db.execute(
                select(Product.id, Product.brand, Product.name)
                .where(Product.serp_enriched_at.is_(None))
                .order_by(Product.id)
                .limit(batch_size)
            )
            product_rows = result.all()

        if not product_rows:
            break

        for pid, brand, name in product_rows:
            processed += 1

            # Use a FRESH session per product — so failures don't poison the transaction
            try:
                async with async_session_factory() as db:
                    res = await enrich_single_product(pid, db)

                status = res.get("status", "unknown")
                price = res.get("price")
                rating = res.get("rating")

                if status == "enriched":
                    enriched += 1
                    logger.info(f"[{processed}/{remaining}] ✓ {brand} — {name} (₹{price}, ★{rating})")
                elif status == "no_results":
                    no_results += 1
                    logger.info(f"[{processed}/{remaining}] ○ {brand} — {name} (no shopping results)")
                elif "error" in res:
                    failed += 1
                    logger.warning(f"[{processed}/{remaining}] ✗ {brand} — {name}: {res['error']}")
                else:
                    failed += 1
                    logger.warning(f"[{processed}/{remaining}] ? {brand} — {name}: {res}")
            except Exception as e:
                failed += 1
                logger.error(f"[{processed}/{remaining}] ✗ {brand} — {name}: {e}")

            await asyncio.sleep(delay)

        logger.info(f"--- Batch done. Enriched: {enriched}, No results: {no_results}, Failed: {failed} ---")

    logger.info("=" * 60)
    logger.info(f"COMPLETE. Processed: {processed}, Enriched: {enriched}, No results: {no_results}, Failed: {failed}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk enrich products via Serper.dev")
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--delay", type=float, default=0.5)
    args = parser.parse_args()
    asyncio.run(main(args.batch_size, args.delay))
