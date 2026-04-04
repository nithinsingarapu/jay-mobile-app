from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.shared.exceptions import NotFoundError
from . import service
from .schemas import IngredientOut, ArticleOut, ConcernOut, MythOut, TipOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/ingredients", response_model=list[IngredientOut])
async def list_ingredients(
    db: DbSession,
    department: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await service.get_ingredients(db, department, category, limit, offset)


@router.get("/ingredients/{slug}", response_model=IngredientOut)
async def get_ingredient(slug: str, db: DbSession):
    ingredient = await service.get_ingredient_by_slug(db, slug)
    if not ingredient:
        raise NotFoundError("Ingredient", slug)
    return ingredient


@router.get("/articles", response_model=list[ArticleOut])
async def list_articles(
    db: DbSession,
    type: str | None = Query(None),
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.get_articles(db, type, department, limit, offset)


@router.get("/articles/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: DbSession):
    article = await service.get_article_by_slug(db, slug)
    if not article:
        raise NotFoundError("Article", slug)
    return article


@router.get("/concerns", response_model=list[ConcernOut])
async def list_concerns(
    db: DbSession,
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_concerns(db, department, limit)


@router.get("/concerns/{slug}", response_model=ConcernOut)
async def get_concern(slug: str, db: DbSession):
    concern = await service.get_concern_by_slug(db, slug)
    if not concern:
        raise NotFoundError("Concern", slug)
    return concern


@router.get("/myths", response_model=list[MythOut])
async def list_myths(
    db: DbSession,
    department: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_myths(db, department, limit)


@router.get("/tips", response_model=list[TipOut])
async def list_tips(
    db: DbSession,
    department: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    return await service.get_tips(db, department, category, limit)
