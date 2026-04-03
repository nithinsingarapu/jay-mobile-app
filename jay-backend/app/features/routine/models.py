import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import (
    String, Text, Integer, Boolean, Date, DateTime, Numeric,
    ForeignKey, UniqueConstraint, Index, text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    period: Mapped[str] = mapped_column(String(30), nullable=False)
    routine_type: Mapped[str] = mapped_column(String(30), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    total_monthly_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    steps: Mapped[list["RoutineStep"]] = relationship(
        back_populates="routine", cascade="all, delete-orphan", order_by="RoutineStep.step_order"
    )

    __table_args__ = (
        Index("ix_routines_user_active", "user_id", "period", unique=True, postgresql_where=text("is_active = true")),
    )


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("routines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"), nullable=True)
    custom_product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    instruction: Mapped[str | None] = mapped_column(Text, nullable=True)
    wait_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequency: Mapped[str] = mapped_column(String(30), default="daily")
    frequency_days: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    is_essential: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_this_product: Mapped[str | None] = mapped_column(Text, nullable=True)

    routine: Mapped["Routine"] = relationship(back_populates="steps")
    product = relationship("Product")

    __table_args__ = (
        UniqueConstraint("routine_id", "step_order", name="uq_routine_step_order"),
    )


class RoutineCompletion(Base):
    __tablename__ = "routine_completions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    routine_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routines.id"), nullable=False)
    step_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routine_steps.id"), nullable=False)
    completion_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False)
    skip_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        UniqueConstraint("step_id", "completion_date", name="uq_completion_step_date"),
        Index("ix_completions_user_date", "user_id", "completion_date"),
    )


class RoutineGeneration(Base):
    __tablename__ = "routine_generations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    routine_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    period: Mapped[str | None] = mapped_column(String(30), nullable=True)
    input_profile_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    generated_routine: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    was_accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    modifications: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
