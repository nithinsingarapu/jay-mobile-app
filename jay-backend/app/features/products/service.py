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


async def find_dupes(
    db: AsyncSession, product_id: int, limit: int = 10,
) -> dict:
    """Find product dupes based on key_ingredients overlap within the same category."""
    from sqlalchemy import desc

    # Get the original product
    original = await get_product_by_id(db, product_id)
    if not original or not original.key_ingredients:
        return {"original": None, "dupes": [], "total_savings": 0}

    orig_ingredients = set(i.lower() for i in original.key_ingredients)
    orig_category = original.normalized_category or original.category

    # Find all products in the same category (excluding the original)
    stmt = (
        select(Product)
        .where(
            Product.is_available == True,
            Product.id != product_id,
            Product.key_ingredients.isnot(None),
        )
    )
    # Match by normalized_category or category
    if orig_category:
        stmt = stmt.where(
            or_(
                Product.normalized_category == orig_category,
                Product.category == original.category,
            )
        )

    result = await db.execute(stmt)
    candidates = result.scalars().all()

    # Calculate ingredient overlap for each candidate
    scored = []
    for p in candidates:
        if not p.key_ingredients:
            continue
        p_ingredients = set(i.lower() for i in p.key_ingredients)
        overlap = orig_ingredients & p_ingredients
        if not overlap:
            continue
        match_pct = round(len(overlap) / len(orig_ingredients) * 100)
        ingredient_match = round(len(overlap) / max(len(orig_ingredients), len(p_ingredients)) * 100)
        scored.append({
            "product": p,
            "match_percent": match_pct,
            "ingredient_match": ingredient_match,
            "shared_ingredients": list(overlap),
        })

    # Sort by match_percent descending, then by price ascending (cheaper first)
    scored.sort(key=lambda x: (-x["match_percent"], float(x["product"].price_inr or 9999)))

    # Assign ranks
    dupes = []
    for i, item in enumerate(scored[:limit]):
        p = item["product"]
        rank = "BEST MATCH" if i == 0 else ("STRONG" if i < 3 else "GOOD")
        dupes.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": float(p.price_inr) if p.price_inr else 0,
            "image_url": p.image_url,
            "rating": float(p.rating) if p.rating else None,
            "review_count": p.review_count,
            "match_percent": item["match_percent"],
            "ingredient_match": item["ingredient_match"],
            "shared_ingredients": item["shared_ingredients"],
            "rank": rank,
            "key_ingredients": p.key_ingredients,
        })

    orig_price = float(original.price_inr) if original.price_inr else 0
    best_dupe_price = dupes[0]["price"] if dupes else orig_price
    total_savings = max(0, orig_price - best_dupe_price)

    return {
        "original": {
            "id": original.id,
            "name": original.name,
            "brand": original.brand,
            "price": orig_price,
            "image_url": original.image_url,
            "key_ingredients": original.key_ingredients,
            "rating": float(original.rating) if original.rating else None,
            "review_count": original.review_count,
        },
        "dupes": dupes,
        "total_savings": total_savings,
    }


async def search_for_routine_step(
    db: AsyncSession, category: str, budget: float | None = None,
    exclude_ingredients: list[str] | None = None, skin_type: str | None = None,
    limit: int = 10,
) -> list[Product]:
    """Search products for a routine step category.
    Orders by rating (best first), then by name.
    Budget is optional — pass None for no budget constraint.
    """
    from sqlalchemy import desc, nulls_last
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
    # Order by rating (highest first), then review count, then name
    stmt = stmt.order_by(
        desc(Product.rating).nulls_last(),
        desc(Product.review_count).nulls_last(),
        Product.name,
    ).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
