"""Content service — DB queries with on-demand pipeline fallback."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Ingredient, Article, Concern, Myth, Tip

STALE_DAYS = 30


def _is_stale(fetched_at: datetime | None) -> bool:
    if not fetched_at:
        return True
    return datetime.now(timezone.utc) - fetched_at > timedelta(days=STALE_DAYS)


async def get_ingredients(
    db: AsyncSession, department: str | None = None, category: str | None = None,
    limit: int = 50, offset: int = 0,
) -> list[Ingredient]:
    stmt = select(Ingredient)
    if department:
        stmt = stmt.where(Ingredient.departments.contains([department]))
    if category:
        stmt = stmt.where(Ingredient.category == category)
    stmt = stmt.order_by(Ingredient.name).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_ingredient_by_slug(db: AsyncSession, slug: str) -> Ingredient | None:
    result = await db.execute(select(Ingredient).where(Ingredient.slug == slug))
    ingredient = result.scalar_one_or_none()
    if ingredient and not _is_stale(ingredient.fetched_at):
        return ingredient
    name = slug.replace("-", " ").title()
    from . import pipeline
    fetched = await pipeline.fetch_ingredient(name, db)
    return fetched or ingredient


async def get_articles(
    db: AsyncSession, type: str | None = None, department: str | None = None,
    limit: int = 20, offset: int = 0,
) -> list[Article]:
    stmt = select(Article)
    if type:
        stmt = stmt.where(Article.type == type)
    if department:
        stmt = stmt.where(Article.departments.contains([department]))
    stmt = stmt.order_by(Article.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_article_by_slug(db: AsyncSession, slug: str) -> Article | None:
    result = await db.execute(select(Article).where(Article.slug == slug))
    return result.scalar_one_or_none()


async def get_concerns(
    db: AsyncSession, department: str | None = None, limit: int = 20,
) -> list[Concern]:
    stmt = select(Concern)
    if department:
        stmt = stmt.where(Concern.departments.contains([department]))
    stmt = stmt.order_by(Concern.name).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_concern_by_slug(db: AsyncSession, slug: str) -> Concern | None:
    result = await db.execute(select(Concern).where(Concern.slug == slug))
    concern = result.scalar_one_or_none()
    if concern and not _is_stale(concern.fetched_at):
        return concern
    name = slug.replace("-", " ").title()
    from . import pipeline
    fetched = await pipeline.fetch_concern(name, db)
    return fetched or concern


async def get_myths(
    db: AsyncSession, department: str | None = None, limit: int = 20,
) -> list[Myth]:
    stmt = select(Myth)
    if department:
        stmt = stmt.where(Myth.departments.contains([department]))
    stmt = stmt.order_by(func.random()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_tips(
    db: AsyncSession, department: str | None = None, category: str | None = None,
    limit: int = 20,
) -> list[Tip]:
    stmt = select(Tip)
    if department:
        stmt = stmt.where(Tip.departments.contains([department]))
    if category:
        stmt = stmt.where(Tip.category == category)
    stmt = stmt.order_by(func.random()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
