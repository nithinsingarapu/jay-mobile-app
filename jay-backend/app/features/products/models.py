from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Text, Boolean, Integer, DateTime, Numeric
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Core identity
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    brand: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    texture: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Description & usage
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    how_to_use: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Ingredients (parsed from inci_list)
    key_ingredients: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    full_ingredients: Mapped[str | None] = mapped_column(Text, nullable=True)  # raw inci_list string

    # Concerns & suitability
    concerns: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    suitable_for: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Pricing & media
    price_inr: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    product_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Formulation metadata
    formulation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Status
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
