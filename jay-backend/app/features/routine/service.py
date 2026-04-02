"""
Routine service — CRUD, daily tracking, stats, cost.
"""
import uuid
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from sqlalchemy import select, func, update, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import CurrentUser
from app.shared.exceptions import NotFoundError
from .models import Routine, RoutineStep, RoutineCompletion
from .constants import STEP_CATEGORIES
from .schemas import (
    CreateRoutineRequest, AddStepRequest, UpdateStepRequest,
    ReorderStepsRequest, CompleteStepRequest, StepOut, RoutineOut,
    TodayStatusOut, CompletionStatusOut, StatsOut,
)


# ── CRUD ──────────────────────────────────────────────────────────────────────

async def get_active_routines(user: CurrentUser, db: AsyncSession) -> list:
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.steps).selectinload(RoutineStep.product))
        .where(Routine.user_id == user.id, Routine.is_active == True)
        .order_by(Routine.created_at)
    )
    routines = result.scalars().all()
    return [_routine_to_out(r) for r in routines]


async def create_routine(user: CurrentUser, data: CreateRoutineRequest, db: AsyncSession) -> Routine:
    # Deactivate existing active routine for the same period
    await db.execute(
        update(Routine)
        .where(Routine.user_id == user.id, Routine.period == data.period, Routine.is_active == True)
        .values(is_active=False)
    )
    await db.flush()

    routine = Routine(
        user_id=user.id,
        name=data.name or f"My {data.period.replace('_', ' ').title()} Routine",
        description=data.description,
        period=data.period,
        routine_type=data.routine_type,
    )
    db.add(routine)
    await db.flush()
    return routine


async def add_step(user: CurrentUser, routine_id: uuid.UUID, data: AddStepRequest, db: AsyncSession) -> RoutineStep:
    routine = await _get_routine_owned_by(routine_id, user.id, db)

    # Auto-fill from constants
    cat_info = STEP_CATEGORIES.get(data.category, {})
    instruction = data.instruction or cat_info.get("default_instruction")
    wait_time = data.wait_time_seconds if data.wait_time_seconds is not None else cat_info.get("wait_time_seconds")
    frequency = data.frequency or cat_info.get("frequency", "daily")

    # Next step_order
    max_order_result = await db.execute(
        select(func.max(RoutineStep.step_order)).where(RoutineStep.routine_id == routine.id)
    )
    max_order = max_order_result.scalar() or 0

    step = RoutineStep(
        routine_id=routine.id,
        step_order=max_order + 1,
        category=data.category,
        product_id=data.product_id,
        custom_product_name=data.custom_product_name,
        instruction=instruction,
        wait_time_seconds=wait_time,
        frequency=frequency,
        frequency_days=data.frequency_days,
        is_essential=data.is_essential,
        notes=data.notes,
    )
    db.add(step)
    await db.flush()

    await _recalculate_cost(routine.id, db)
    return step


async def update_step(
    user: CurrentUser, routine_id: uuid.UUID, step_id: uuid.UUID,
    data: UpdateStepRequest, db: AsyncSession
) -> RoutineStep:
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    result = await db.execute(
        select(RoutineStep).where(RoutineStep.id == step_id, RoutineStep.routine_id == routine.id)
    )
    step = result.scalar_one_or_none()
    if not step:
        raise NotFoundError("Step", str(step_id))

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(step, key, value)

    routine.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await _recalculate_cost(routine.id, db)
    return step


async def remove_step(user: CurrentUser, routine_id: uuid.UUID, step_id: uuid.UUID, db: AsyncSession):
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    result = await db.execute(
        select(RoutineStep).where(RoutineStep.id == step_id, RoutineStep.routine_id == routine.id)
    )
    step = result.scalar_one_or_none()
    if not step:
        raise NotFoundError("Step", str(step_id))

    removed_order = step.step_order
    await db.delete(step)
    await db.flush()

    # Reorder remaining steps
    await db.execute(
        update(RoutineStep)
        .where(RoutineStep.routine_id == routine.id, RoutineStep.step_order > removed_order)
        .values(step_order=RoutineStep.step_order - 1)
    )
    await db.flush()
    await _recalculate_cost(routine.id, db)


async def reorder_steps(
    user: CurrentUser, routine_id: uuid.UUID, data: ReorderStepsRequest, db: AsyncSession
) -> list[RoutineStep]:
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    for idx, sid in enumerate(data.step_ids):
        await db.execute(
            update(RoutineStep)
            .where(RoutineStep.id == uuid.UUID(sid), RoutineStep.routine_id == routine.id)
            .values(step_order=idx + 1)
        )
    await db.flush()
    result = await db.execute(
        select(RoutineStep).where(RoutineStep.routine_id == routine.id).order_by(RoutineStep.step_order)
    )
    return list(result.scalars().all())


async def replace_all_steps(
    user: CurrentUser, routine_id: uuid.UUID, steps: list[AddStepRequest], db: AsyncSession
) -> list[RoutineStep]:
    routine = await _get_routine_owned_by(routine_id, user.id, db)

    # Delete all existing steps
    await db.execute(delete(RoutineStep).where(RoutineStep.routine_id == routine.id))
    await db.flush()

    # Add new steps
    new_steps = []
    for idx, data in enumerate(steps):
        cat_info = STEP_CATEGORIES.get(data.category, {})
        step = RoutineStep(
            routine_id=routine.id,
            step_order=idx + 1,
            category=data.category,
            product_id=data.product_id,
            custom_product_name=data.custom_product_name,
            instruction=data.instruction or cat_info.get("default_instruction"),
            wait_time_seconds=data.wait_time_seconds if data.wait_time_seconds is not None else cat_info.get("wait_time_seconds"),
            frequency=data.frequency or cat_info.get("frequency", "daily"),
            frequency_days=data.frequency_days,
            is_essential=data.is_essential,
            notes=data.notes,
        )
        db.add(step)
        new_steps.append(step)
    await db.flush()
    await _recalculate_cost(routine.id, db)
    return new_steps


async def deactivate_routine(user: CurrentUser, routine_id: uuid.UUID, db: AsyncSession):
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    routine.is_active = False
    routine.updated_at = datetime.now(timezone.utc)


# ── Daily tracking ────────────────────────────────────────────────────────────

async def complete_step(
    user: CurrentUser, routine_id: uuid.UUID, data: CompleteStepRequest, db: AsyncSession
) -> RoutineCompletion:
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    today = date.today()

    # Upsert
    result = await db.execute(
        select(RoutineCompletion).where(
            RoutineCompletion.step_id == uuid.UUID(data.step_id),
            RoutineCompletion.completion_date == today,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.skipped = data.skipped
        existing.skip_reason = data.skip_reason
        existing.completed_at = datetime.now(timezone.utc)
        return existing

    completion = RoutineCompletion(
        user_id=user.id,
        routine_id=routine.id,
        step_id=uuid.UUID(data.step_id),
        completion_date=today,
        skipped=data.skipped,
        skip_reason=data.skip_reason,
    )
    db.add(completion)
    await db.flush()
    return completion


async def complete_all_steps(user: CurrentUser, routine_id: uuid.UUID, db: AsyncSession) -> list[RoutineCompletion]:
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    result = await db.execute(
        select(RoutineStep).where(RoutineStep.routine_id == routine.id)
    )
    steps = result.scalars().all()

    completions = []
    for step in steps:
        c = await complete_step(user, routine_id, CompleteStepRequest(step_id=str(step.id)), db)
        completions.append(c)
    return completions


async def get_today_status(user: CurrentUser, routine_id: uuid.UUID, db: AsyncSession) -> TodayStatusOut:
    routine = await _get_routine_owned_by(routine_id, user.id, db)
    today = date.today()

    # Get steps
    steps_result = await db.execute(
        select(RoutineStep)
        .options(selectinload(RoutineStep.product))
        .where(RoutineStep.routine_id == routine.id)
        .order_by(RoutineStep.step_order)
    )
    steps = steps_result.scalars().all()

    # Get completions for today
    comp_result = await db.execute(
        select(RoutineCompletion).where(
            RoutineCompletion.routine_id == routine.id,
            RoutineCompletion.completion_date == today,
        )
    )
    completions = {c.step_id: c for c in comp_result.scalars().all()}

    status_steps = []
    completed = skipped = 0
    for step in steps:
        comp = completions.get(step.id)
        is_done = comp is not None and not comp.skipped
        is_skipped = comp is not None and comp.skipped
        if is_done:
            completed += 1
        if is_skipped:
            skipped += 1

        product_name = step.custom_product_name
        if step.product:
            product_name = step.product.name

        status_steps.append(CompletionStatusOut(
            step_id=str(step.id),
            step_category=step.category,
            product_name=product_name,
            completed=is_done,
            skipped=is_skipped,
            completed_at=comp.completed_at if comp else None,
        ))

    total = len(steps)
    remaining = total - completed - skipped
    pct = round((completed / total) * 100) if total > 0 else 0

    return TodayStatusOut(
        routine_id=str(routine.id),
        period=routine.period,
        total_steps=total,
        completed_steps=completed,
        skipped_steps=skipped,
        remaining_steps=remaining,
        completion_percentage=pct,
        steps=status_steps,
    )


async def get_stats(user: CurrentUser, period_days: int, db: AsyncSession) -> StatsOut:
    start_date = date.today() - timedelta(days=period_days)

    # Total active steps across all active routines
    routines_result = await db.execute(
        select(Routine).where(Routine.user_id == user.id, Routine.is_active == True)
    )
    routines = routines_result.scalars().all()

    total_steps = 0
    for r in routines:
        count_result = await db.execute(
            select(func.count(RoutineStep.id)).where(RoutineStep.routine_id == r.id)
        )
        total_steps += count_result.scalar() or 0

    total_possible = total_steps * period_days

    # Completions in period
    comp_result = await db.execute(
        select(RoutineCompletion).where(
            RoutineCompletion.user_id == user.id,
            RoutineCompletion.completion_date >= start_date,
        )
    )
    completions = comp_result.scalars().all()

    completed = sum(1 for c in completions if not c.skipped)
    skipped_count = sum(1 for c in completions if c.skipped)
    missed = max(0, total_possible - completed - skipped_count)
    adherence = round((completed / total_possible) * 100) if total_possible > 0 else 0

    # Streak calculation
    current_streak, longest_streak = await _calculate_streaks(user.id, db)

    return StatsOut(
        period_days=period_days,
        total_routines_possible=total_possible,
        completed_count=completed,
        skipped_count=skipped_count,
        missed_count=missed,
        adherence_percentage=adherence,
        current_streak=current_streak,
        longest_streak=longest_streak,
    )


# ── Utility ───────────────────────────────────────────────────────────────────

async def calculate_monthly_cost(user: CurrentUser, db: AsyncSession) -> float:
    routines_result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.steps).selectinload(RoutineStep.product))
        .where(Routine.user_id == user.id, Routine.is_active == True)
    )
    total = Decimal("0")
    for routine in routines_result.scalars().all():
        for step in routine.steps:
            if step.product and step.product.price_inr:
                total += step.product.price_inr
    return float(total)


async def check_routine_conflicts(user: CurrentUser, db: AsyncSession) -> list:
    from .validator import check_product_conflicts
    routines_result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.steps).selectinload(RoutineStep.product))
        .where(Routine.user_id == user.id, Routine.is_active == True)
    )
    all_conflicts = []
    for routine in routines_result.scalars().all():
        steps = routine.steps
        for i, step_a in enumerate(steps):
            ings_a = _step_ingredients(step_a)
            for step_b in steps[i + 1:]:
                ings_b = _step_ingredients(step_b)
                all_conflicts.extend(check_product_conflicts(ings_a, ings_b))
    return all_conflicts


# ── Private helpers ───────────────────────────────────────────────────────────

async def _get_routine_owned_by(routine_id: uuid.UUID, user_id: str, db: AsyncSession) -> Routine:
    result = await db.execute(select(Routine).where(Routine.id == routine_id))
    routine = result.scalar_one_or_none()
    if not routine or routine.user_id != user_id:
        raise NotFoundError("Routine", str(routine_id))
    return routine


async def _recalculate_cost(routine_id: uuid.UUID, db: AsyncSession):
    result = await db.execute(
        select(RoutineStep)
        .options(selectinload(RoutineStep.product))
        .where(RoutineStep.routine_id == routine_id)
    )
    total = Decimal("0")
    for step in result.scalars().all():
        if step.product and step.product.price_inr:
            total += step.product.price_inr

    await db.execute(
        update(Routine).where(Routine.id == routine_id).values(total_monthly_cost=total)
    )


def _step_ingredients(step: RoutineStep) -> list[str]:
    ings = []
    if step.product and step.product.key_ingredients:
        ings.extend(step.product.key_ingredients)
    if step.custom_product_name:
        name = step.custom_product_name.lower()
        for kw in ["retinol", "vitamin c", "niacinamide", "salicylic", "glycolic", "aha", "bha", "benzoyl peroxide"]:
            if kw in name:
                ings.append(kw.replace(" ", "_"))
    return ings


async def _calculate_streaks(user_id: str, db: AsyncSession) -> tuple[int, int]:
    """Calculate current and longest streaks of consecutive days with completions."""
    result = await db.execute(
        select(RoutineCompletion.completion_date)
        .where(RoutineCompletion.user_id == user_id, RoutineCompletion.skipped == False)
        .distinct()
        .order_by(RoutineCompletion.completion_date.desc())
    )
    dates = [r[0] for r in result.all()]

    if not dates:
        return 0, 0

    # Current streak
    current = 1
    today = date.today()
    if dates[0] != today and dates[0] != today - timedelta(days=1):
        current = 0
    else:
        for i in range(1, len(dates)):
            if dates[i] == dates[i - 1] - timedelta(days=1):
                current += 1
            else:
                break

    # Longest streak
    longest = 1
    streak = 1
    sorted_dates = sorted(set(dates))
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 1

    return current, longest


def _routine_to_out(routine: Routine) -> RoutineOut:
    steps = []
    for s in routine.steps:
        product_name = s.custom_product_name
        product_brand = None
        product_price = None
        if s.product:
            product_name = s.product.name
            product_brand = s.product.brand
            product_price = float(s.product.price_inr) if s.product.price_inr else None

        steps.append(StepOut(
            id=s.id, step_order=s.step_order, category=s.category,
            product_id=s.product_id, product_name=product_name,
            product_brand=product_brand, product_price=product_price,
            instruction=s.instruction, wait_time_seconds=s.wait_time_seconds,
            frequency=s.frequency, frequency_days=s.frequency_days,
            is_essential=s.is_essential, notes=s.notes, why_this_product=s.why_this_product,
        ))

    return RoutineOut(
        id=routine.id, name=routine.name, description=routine.description, period=routine.period,
        routine_type=routine.routine_type, is_active=routine.is_active,
        total_monthly_cost=float(routine.total_monthly_cost) if routine.total_monthly_cost else None,
        steps=steps, created_at=routine.created_at, updated_at=routine.updated_at,
    )
