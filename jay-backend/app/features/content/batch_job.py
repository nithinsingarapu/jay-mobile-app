"""Batch job to pre-populate content from web sources. Run weekly via cron."""
import asyncio
import logging
import time

from app.database import async_session_factory
from .pipeline import fetch_ingredient, fetch_article, fetch_concern, fetch_myths, fetch_tips
from .seed_data import (
    SEED_INGREDIENTS, SEED_CONCERNS, SEED_ARTICLE_TOPICS,
    SEED_MYTH_DEPARTMENTS, SEED_TIP_DEPARTMENTS,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

CONCURRENCY = 3


async def run_batch():
    start = time.time()
    stats = {"ingredients": 0, "articles": 0, "concerns": 0, "myths": 0, "tips": 0, "errors": 0}
    sem = asyncio.Semaphore(CONCURRENCY)

    async def _run(coro_fn, *args, category: str):
        async with sem:
            try:
                async with async_session_factory() as db:
                    result = await coro_fn(*args, db)
                    if result is not None:
                        stats[category] += 1 if not isinstance(result, list) else len(result)
                    logger.info(f"  [{category}] OK: {args[0] if args else '?'}")
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"  [{category}] Error for {args[0] if args else '?'}: {e}")

    # Ingredients
    logger.info(f"Processing {len(SEED_INGREDIENTS)} ingredients...")
    tasks = [_run(fetch_ingredient, name, category="ingredients") for name in SEED_INGREDIENTS]
    await asyncio.gather(*tasks)

    # Concerns
    logger.info(f"Processing {len(SEED_CONCERNS)} concerns...")
    tasks = [_run(fetch_concern, name, category="concerns") for name in SEED_CONCERNS]
    await asyncio.gather(*tasks)

    # Articles
    logger.info(f"Processing {len(SEED_ARTICLE_TOPICS)} articles...")
    tasks = [_run(fetch_article, topic, category="articles") for topic in SEED_ARTICLE_TOPICS]
    await asyncio.gather(*tasks)

    # Myths
    logger.info("Processing myths...")
    tasks = [_run(fetch_myths, dept, category="myths") for dept in SEED_MYTH_DEPARTMENTS]
    await asyncio.gather(*tasks)

    # Tips
    logger.info("Processing tips...")
    tasks = [_run(fetch_tips, dept, category="tips") for dept in SEED_TIP_DEPARTMENTS]
    await asyncio.gather(*tasks)

    elapsed = time.time() - start
    logger.info(f"Batch complete in {elapsed:.1f}s: {stats}")
    return stats


def main():
    asyncio.run(run_batch())


if __name__ == "__main__":
    main()
