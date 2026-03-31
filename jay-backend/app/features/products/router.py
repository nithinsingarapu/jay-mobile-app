from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.shared.exceptions import NotFoundError
from . import service
from .schemas import ProductOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/brands")
async def get_brands(db: DbSession) -> list[str]:
    return await service.get_brands(db)


@router.get("/categories")
async def get_categories(db: DbSession) -> list[str]:
    return await service.get_categories(db)


@router.get("", response_model=list[ProductOut])
async def search_products(
    db: DbSession,
    q: str | None = Query(None),
    brand: str | None = Query(None),
    category: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return await service.search_products(db, q, brand, category, min_price, max_price, limit, offset)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: DbSession):
    product = await service.get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", product_id)
    return product
