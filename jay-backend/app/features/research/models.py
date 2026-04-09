from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class ProductResearch(Base):
    __tablename__ = "product_research"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    product_name: Mapped[str] = mapped_column(String(300), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Stage 1: Product identification JSON
    product_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Stage 2: Research branch results (markdown text)
    ingredients_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_synthesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    expert_reviews: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_intelligence: Mapped[str | None] = mapped_column(Text, nullable=True)
    claims_alternatives: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Stage 3: Final report
    report_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    tldr: Mapped[str | None] = mapped_column(Text, nullable=True)
    usage_protocol: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_card: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, failed
    current_stage: Mapped[str | None] = mapped_column(String(50), nullable=True)  # identify, ingredients, reviews, experts, brand, claims, overlay, done
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    model_used: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_cost_usd: Mapped[float | None] = mapped_column(nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
