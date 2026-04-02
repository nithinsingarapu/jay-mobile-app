from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class ProductOut(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    subcategory: str | None = None
    product_type: str | None = None
    texture: str | None = None
    description: str | None = None
    how_to_use: str | None = None
    key_ingredients: list[str] | None = None
    full_ingredients: str | None = None
    concerns: list[str] | None = None
    suitable_for: dict | None = None
    price_inr: Decimal | None = None
    image_url: str | None = None
    product_url: str | None = None
    formulation: dict | None = None
    brand_tier: str | None = None
    normalized_category: str | None = None
    department: str | None = None
    rating: float | None = None
    review_count: int | None = None
    buy_url: str | None = None
    image_urls: list[str] | None = None
    price_source: str | None = None
    price_updated_at: datetime | None = None
    serp_enriched_at: datetime | None = None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductSearchParams(BaseModel):
    q: str | None = None
    brand: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    limit: int = 20
    offset: int = 0
