from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Product


async def search_products(
    db: AsyncSession, q: str | None = None, brand: str | None = None,
    category: str | None = None, min_price: float | None = None,
    max_price: float | None = None, limit: int = 20, offset: int = 0,
) -> list[Product]:
    stmt = select(Product).where(Product.is_available == True)
    if q:
        stmt = stmt.where(or_(Product.name.ilike(f"%{q}%"), Product.brand.ilike(f"%{q}%")))
    if brand:
        stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))
    if category:
        stmt = stmt.where(Product.category == category)
    if min_price is not None:
        stmt = stmt.where(Product.price_inr >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price_inr <= max_price)
    stmt = stmt.order_by(Product.name).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()


async def get_brands(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(Product.brand).distinct().order_by(Product.brand)
    )
    return [r[0] for r in result.all()]


async def get_categories(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(Product.category).distinct().order_by(Product.category)
    )
    return [r[0] for r in result.all()]


# Map routine step categories to DB category search patterns
_CATEGORY_SEARCH = {
    "cleanser": ["cleanser", "face-wash", "face-cleanser", "micellar-water"],
    "oil_cleanser": ["cleanser", "face-cleanser", "micellar-water"],
    "water_cleanser": ["cleanser", "face-wash", "face-cleanser"],
    "gentle_cleanser": ["cleanser", "face-wash", "face-cleanser"],
    "toner": ["toner", "face-toner", "tonic", "essence"],
    "essence": ["essence", "toner", "face-toner"],
    "serum": ["serum", "face-serum"],
    "niacinamide_serum": ["serum", "face-serum"],
    "barrier_serum": ["serum", "face-serum"],
    "treatment": ["treatment", "face-treatment"],
    "bha_treatment": ["treatment", "face-treatment", "serum", "face-serum"],
    "eye_cream": ["eye-cream", "eye-care", "eye-serum"],
    "spot_treatment": ["treatment", "face-treatment"],
    "exfoliant": ["exfoliant", "treatment", "face-treatment"],
    "moisturizer": ["moisturizer", "face-moisturiser", "cream"],
    "oil_free_moisturizer": ["moisturizer", "face-moisturiser"],
    "barrier_moisturizer": ["moisturizer", "face-moisturiser"],
    "face_oil": ["face-serum", "serum"],  # oils often categorized as serums
    "sleeping_mask": ["mask", "face-treatment"],
    "sunscreen": ["sunscreen"],
    "lip_balm": ["lip-care", "lip-balm", "lip-treatment"],
}


async def search_for_routine_step(
    db: AsyncSession, category: str, budget: float | None = None,
    exclude_ingredients: list[str] | None = None, skin_type: str | None = None,
    limit: int = 5,
) -> list[Product]:
    # Match multiple DB categories for a single routine step category
    db_categories = _CATEGORY_SEARCH.get(category, [category])
    stmt = select(Product).where(Product.is_available == True, Product.category.in_(db_categories))
    if budget is not None and budget > 0:
        stmt = stmt.where(or_(Product.price_inr <= budget, Product.price_inr.is_(None)))
    if exclude_ingredients:
        for ing in exclude_ingredients:
            stmt = stmt.where(
                or_(
                    Product.key_ingredients.is_(None),
                    ~Product.key_ingredients.any(ing.lower()),
                )
            )
    stmt = stmt.order_by(Product.name).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
