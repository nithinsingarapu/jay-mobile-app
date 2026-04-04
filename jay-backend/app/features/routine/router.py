from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import AuthenticatedUser
from . import service
from .generator import generate_routine
from .validator import validate_routine
from .constants import ROUTINE_TYPES
from .schemas import (
    CreateRoutineRequest, AddStepRequest, UpdateStepRequest,
    ReorderStepsRequest, CompleteStepRequest, GenerateRoutineRequest,
    ValidateRoutineRequest, StepOut, RoutineOut, RoutineOverview,
    TodayStatusOut, StatsOut, ValidationResultOut, GeneratedRoutineOut,
    ConflictOut,
)
from app.features.products.service import search_for_routine_step
from app.features.products.schemas import ProductOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


# ══════════════════════════════════════════════════════════════════════════════
# FIXED PATHS FIRST (before any /{routine_id} parameterized routes)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/types")
async def get_routine_types():
    return ROUTINE_TYPES


@router.get("/stats", response_model=StatsOut)
async def get_stats(user: AuthenticatedUser, db: DbSession, period: int = Query(7, ge=1, le=365)):
    return await service.get_stats(user, period, db)


@router.get("/streak")
async def get_streak(user: AuthenticatedUser, db: DbSession):
    from .service import _calculate_streaks
    current, longest = await _calculate_streaks(user.id, db)
    return {"current_streak": current, "longest_streak": longest}


@router.get("/cost")
async def get_monthly_cost(user: AuthenticatedUser, db: DbSession):
    cost = await service.calculate_monthly_cost(user, db)
    return {"total_monthly_cost": cost}


@router.get("/conflicts", response_model=list[ConflictOut])
async def get_conflicts(user: AuthenticatedUser, db: DbSession):
    return await service.check_routine_conflicts(user, db)


@router.get("/products/search", response_model=list[ProductOut])
async def search_products_for_routine(
    user: AuthenticatedUser, db: DbSession,
    category: str = Query(...),
    budget: float | None = Query(None),
    exclude_allergens: str | None = Query(None),
):
    exclude = exclude_allergens.split(",") if exclude_allergens else None
    return await search_for_routine_step(db, category, budget, exclude, limit=10)


@router.post("/generate", response_model=GeneratedRoutineOut)
async def generate_routine_endpoint(data: GenerateRoutineRequest, user: AuthenticatedUser, db: DbSession):
    return await generate_routine(user, data, db)


# ── JAY Assist (fast, Groq-powered) ─────────────────────────────────

@router.post("/assist/suggest-steps")
async def assist_suggest_steps(
    data: dict, user: AuthenticatedUser, db: DbSession,
):
    """JAY suggests step categories based on routine purpose."""
    from .jay_assist import suggest_steps
    return await suggest_steps(
        user,
        routine_name=data.get("routine_name", ""),
        routine_description=data.get("routine_description", ""),
        session=data.get("session", "morning"),
        db=db,
    )


@router.post("/assist/pick-product")
async def assist_pick_product(
    data: dict, user: AuthenticatedUser, db: DbSession,
):
    """JAY picks the best product for a step category."""
    from .jay_assist import pick_product
    return await pick_product(
        user,
        category=data.get("category", ""),
        routine_context=data.get("routine_context", ""),
        db=db,
    )


@router.post("/assist/suggest-instruction")
async def assist_suggest_instruction(data: dict, user: AuthenticatedUser, db: DbSession):
    """JAY writes a personalized application instruction."""
    from .jay_assist import suggest_instruction
    return await suggest_instruction(
        category=data.get("category", ""),
        product_name=data.get("product_name", ""),
        session=data.get("session", "morning"),
    )


@router.post("/validate", response_model=ValidationResultOut)
async def validate_routine_endpoint(data: ValidateRoutineRequest, user: AuthenticatedUser, db: DbSession):
    steps_dicts = [s.model_dump() for s in data.steps]
    return validate_routine(steps_dicts, data.period)


# ══════════════════════════════════════════════════════════════════════════════
# ROOT ROUTES (GET/POST with no path params)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=list[RoutineOut])
async def get_active_routines(user: AuthenticatedUser, db: DbSession):
    return await service.get_active_routines(user, db)


@router.post("", response_model=RoutineOut, status_code=201)
async def create_routine(data: CreateRoutineRequest, user: AuthenticatedUser, db: DbSession):
    routine = await service.create_routine(user, data, db)
    return RoutineOut(
        id=routine.id, name=routine.name, description=routine.description, period=routine.period,
        routine_type=routine.routine_type, is_active=routine.is_active,
        total_monthly_cost=None, steps=[],
        created_at=routine.created_at, updated_at=routine.updated_at,
    )


# ══════════════════════════════════════════════════════════════════════════════
# PARAMETERIZED ROUTES (/{routine_id}/...) — MUST come LAST
# ══════════════════════════════════════════════════════════════════════════════

@router.put("/{routine_id}/steps", response_model=list[StepOut])
async def replace_steps(routine_id: UUID, steps: list[AddStepRequest], user: AuthenticatedUser, db: DbSession):
    new_steps = await service.replace_all_steps(user, routine_id, steps, db)
    return [StepOut(
        id=s.id, step_order=s.step_order, category=s.category,
        product_id=s.product_id, product_name=s.custom_product_name,
        instruction=s.instruction, wait_time_seconds=s.wait_time_seconds,
        frequency=s.frequency, frequency_days=s.frequency_days,
        is_essential=s.is_essential, notes=s.notes, why_this_product=s.why_this_product,
    ) for s in new_steps]


@router.post("/{routine_id}/steps", response_model=StepOut, status_code=201)
async def add_step(routine_id: UUID, data: AddStepRequest, user: AuthenticatedUser, db: DbSession):
    step = await service.add_step(user, routine_id, data, db)
    return StepOut(
        id=step.id, step_order=step.step_order, category=step.category,
        product_id=step.product_id, product_name=step.custom_product_name,
        instruction=step.instruction, wait_time_seconds=step.wait_time_seconds,
        frequency=step.frequency, frequency_days=step.frequency_days,
        is_essential=step.is_essential, notes=step.notes, why_this_product=step.why_this_product,
    )


@router.put("/{routine_id}/steps/{step_id}", response_model=StepOut)
async def update_step(routine_id: UUID, step_id: UUID, data: UpdateStepRequest, user: AuthenticatedUser, db: DbSession):
    step = await service.update_step(user, routine_id, step_id, data, db)
    return StepOut(
        id=step.id, step_order=step.step_order, category=step.category,
        product_id=step.product_id, product_name=step.custom_product_name,
        instruction=step.instruction, wait_time_seconds=step.wait_time_seconds,
        frequency=step.frequency, frequency_days=step.frequency_days,
        is_essential=step.is_essential, notes=step.notes, why_this_product=step.why_this_product,
    )


@router.delete("/{routine_id}/steps/{step_id}", status_code=204)
async def remove_step(routine_id: UUID, step_id: UUID, user: AuthenticatedUser, db: DbSession):
    await service.remove_step(user, routine_id, step_id, db)


@router.post("/{routine_id}/reorder", response_model=list[StepOut])
async def reorder_steps(routine_id: UUID, data: ReorderStepsRequest, user: AuthenticatedUser, db: DbSession):
    steps = await service.reorder_steps(user, routine_id, data, db)
    return [StepOut(
        id=s.id, step_order=s.step_order, category=s.category,
        product_id=s.product_id, product_name=s.custom_product_name,
        instruction=s.instruction, wait_time_seconds=s.wait_time_seconds,
        frequency=s.frequency, frequency_days=s.frequency_days,
        is_essential=s.is_essential, notes=s.notes, why_this_product=s.why_this_product,
    ) for s in steps]


@router.post("/{routine_id}/complete")
async def complete_step(routine_id: UUID, data: CompleteStepRequest, user: AuthenticatedUser, db: DbSession):
    comp = await service.complete_step(user, routine_id, data, db)
    return {
        "id": str(comp.id), "step_id": str(comp.step_id),
        "completion_date": str(comp.completion_date), "skipped": comp.skipped,
        "completed_at": comp.completed_at.isoformat() if comp.completed_at else None,
    }


@router.post("/{routine_id}/complete-all")
async def complete_all_steps(routine_id: UUID, user: AuthenticatedUser, db: DbSession):
    completions = await service.complete_all_steps(user, routine_id, db)
    return [{"id": str(c.id), "step_id": str(c.step_id), "completion_date": str(c.completion_date)} for c in completions]


@router.get("/{routine_id}/today", response_model=TodayStatusOut)
async def get_today_status(routine_id: UUID, user: AuthenticatedUser, db: DbSession):
    return await service.get_today_status(user, routine_id, db)


@router.delete("/{routine_id}", status_code=204)
async def deactivate_routine(routine_id: UUID, user: AuthenticatedUser, db: DbSession):
    await service.deactivate_routine(user, routine_id, db)
