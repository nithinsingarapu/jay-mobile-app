from pydantic import BaseModel, Field
from typing import Literal
from uuid import UUID
from datetime import datetime


# ── Input schemas ─────────────────────────────────────────────────────────────

class CreateRoutineRequest(BaseModel):
    name: str | None = None
    period: Literal["am", "pm"]
    routine_type: Literal["essential", "complete", "glass_skin", "barrier_repair", "anti_acne", "custom"]


class AddStepRequest(BaseModel):
    category: str
    product_id: int | None = None
    custom_product_name: str | None = None
    instruction: str | None = None
    wait_time_seconds: int | None = None
    frequency: Literal["daily", "every_other_day", "2x_week", "3x_week", "weekly", "as_needed"] = "daily"
    frequency_days: list[str] | None = None
    is_essential: bool = True
    notes: str | None = None


class UpdateStepRequest(BaseModel):
    product_id: int | None = None
    custom_product_name: str | None = None
    instruction: str | None = None
    wait_time_seconds: int | None = None
    frequency: str | None = None
    frequency_days: list[str] | None = None
    notes: str | None = None


class ReorderStepsRequest(BaseModel):
    step_ids: list[str]


class CompleteStepRequest(BaseModel):
    step_id: str
    skipped: bool = False
    skip_reason: str | None = None


class GenerateRoutineRequest(BaseModel):
    period: Literal["am", "pm", "both"] = "both"
    routine_type: Literal["essential", "complete", "glass_skin", "barrier_repair", "anti_acne", "auto"] = "auto"
    goals: list[str] | None = None
    avoid_products: list[int] | None = None
    keep_products: list[int] | None = None
    additional_instructions: str | None = None


class ValidateRoutineRequest(BaseModel):
    steps: list[AddStepRequest]
    period: Literal["am", "pm"]


# ── Output schemas ────────────────────────────────────────────────────────────

class StepOut(BaseModel):
    id: UUID
    step_order: int
    category: str
    product_id: int | None = None
    product_name: str | None = None
    product_brand: str | None = None
    product_price: float | None = None
    instruction: str | None = None
    wait_time_seconds: int | None = None
    frequency: str
    frequency_days: list[str] | None = None
    is_essential: bool
    notes: str | None = None
    why_this_product: str | None = None

    model_config = {"from_attributes": True}


class RoutineOut(BaseModel):
    id: UUID
    name: str | None = None
    period: str
    routine_type: str
    is_active: bool
    total_monthly_cost: float | None = None
    steps: list[StepOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoutineOverview(BaseModel):
    am: RoutineOut | None = None
    pm: RoutineOut | None = None


class CompletionStatusOut(BaseModel):
    step_id: str
    step_category: str
    product_name: str | None = None
    completed: bool
    skipped: bool
    completed_at: datetime | None = None


class TodayStatusOut(BaseModel):
    routine_id: str
    period: str
    total_steps: int
    completed_steps: int
    skipped_steps: int
    remaining_steps: int
    completion_percentage: int
    steps: list[CompletionStatusOut]


class StatsOut(BaseModel):
    period_days: int
    total_routines_possible: int
    completed_count: int
    skipped_count: int
    missed_count: int
    adherence_percentage: int
    current_streak: int
    longest_streak: int


class ConflictOut(BaseModel):
    ingredient_a: str
    ingredient_b: str
    severity: Literal["avoid", "caution"]
    reason: str
    solution: str


class ValidationResultOut(BaseModel):
    valid: bool
    conflicts: list[ConflictOut] = []
    order_issues: list[str] = []
    suggestions: list[str] = []


class GeneratedRoutineOut(BaseModel):
    routine_type: str
    period: str
    name: str
    total_monthly_cost: float
    steps: list[dict]
    reasoning: str
    tips: list[str] = []
    conflicts_checked: list[dict] = []
