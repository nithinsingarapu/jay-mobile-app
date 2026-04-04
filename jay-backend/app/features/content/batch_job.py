"""Batch job to pre-populate content from web sources.

Each content type has its own separate function call.
Run: python -c "from app.features.content.batch_job import main; main()"
"""
import asyncio
import logging
import time

from app.database import async_session_factory
from .pipeline import (
    fetch_all_ingredients, fetch_all_articles,
    fetch_all_concerns, fetch_all_myths, fetch_all_tips,
)
from .seed_data import (
    SEED_INGREDIENTS, SEED_CONCERNS, SEED_ARTICLE_TOPICS,
    SEED_MYTH_DEPARTMENTS, SEED_TIP_DEPARTMENTS,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


async def run_ingredients():
    logger.info(f"=== INGREDIENTS ({len(SEED_INGREDIENTS)} items) ===")
    async with async_session_factory() as db:
        count = await fetch_all_ingredients(SEED_INGREDIENTS, db)
    logger.info(f"=== INGREDIENTS DONE: {count}/{len(SEED_INGREDIENTS)} ===")
    return count


async def run_articles():
    logger.info(f"=== ARTICLES ({len(SEED_ARTICLE_TOPICS)} items) ===")
    async with async_session_factory() as db:
        count = await fetch_all_articles(SEED_ARTICLE_TOPICS, db)
    logger.info(f"=== ARTICLES DONE: {count}/{len(SEED_ARTICLE_TOPICS)} ===")
    return count


async def run_concerns():
    logger.info(f"=== CONCERNS ({len(SEED_CONCERNS)} items) ===")
    async with async_session_factory() as db:
        count = await fetch_all_concerns(SEED_CONCERNS, db)
    logger.info(f"=== CONCERNS DONE: {count}/{len(SEED_CONCERNS)} ===")
    return count


async def run_myths():
    logger.info(f"=== MYTHS ({len(SEED_MYTH_DEPARTMENTS)} departments) ===")
    async with async_session_factory() as db:
        count = await fetch_all_myths(SEED_MYTH_DEPARTMENTS, db)
    logger.info(f"=== MYTHS DONE: {count} total ===")
    return count


async def run_tips():
    logger.info(f"=== TIPS ({len(SEED_TIP_DEPARTMENTS)} departments) ===")
    async with async_session_factory() as db:
        count = await fetch_all_tips(SEED_TIP_DEPARTMENTS, db)
    logger.info(f"=== TIPS DONE: {count} total ===")
    return count


async def run_batch():
    """Run all content types sequentially."""
    start = time.time()
    stats = {}

    stats["ingredients"] = await run_ingredients()
    stats["articles"] = await run_articles()
    stats["concerns"] = await run_concerns()
    stats["myths"] = await run_myths()
    stats["tips"] = await run_tips()

    elapsed = time.time() - start
    logger.info(f"\n{'='*60}")
    logger.info(f"BATCH COMPLETE in {elapsed:.1f}s")
    logger.info(f"  Ingredients: {stats['ingredients']}/{len(SEED_INGREDIENTS)}")
    logger.info(f"  Articles:    {stats['articles']}/{len(SEED_ARTICLE_TOPICS)}")
    logger.info(f"  Concerns:    {stats['concerns']}/{len(SEED_CONCERNS)}")
    logger.info(f"  Myths:       {stats['myths']}")
    logger.info(f"  Tips:        {stats['tips']}")
    logger.info(f"{'='*60}")
    return stats


def main():
    """Run full batch."""
    asyncio.run(run_batch())


# Individual runners for testing
def run_only_ingredients():
    asyncio.run(run_ingredients())

def run_only_articles():
    asyncio.run(run_articles())

def run_only_concerns():
    asyncio.run(run_concerns())

def run_only_myths():
    asyncio.run(run_myths())

def run_only_tips():
    asyncio.run(run_tips())


if __name__ == "__main__":
    main()
