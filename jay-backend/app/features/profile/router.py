from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import AuthenticatedUser
from . import service
from .schemas import (
    BasicsUpdate, SkinIdentityUpdate, SkinStateUpdate,
    RoutineStateUpdate, LifestyleUpdate, PreferencesUpdate,
    UserProfileOut, ProfileCompletenessOut,
)

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/questionnaire")
async def get_questionnaire():
    """Full onboarding questionnaire definition. Public — no auth required."""
    from .questionnaire import QUESTIONNAIRE
    return QUESTIONNAIRE


@router.get("", response_model=UserProfileOut)
async def get_profile(user: AuthenticatedUser, db: DbSession):
    """Get user profile. Auto-creates on first access."""
    return await service.get_or_create_profile(user, db)


@router.get("/completeness", response_model=ProfileCompletenessOut)
async def get_completeness(user: AuthenticatedUser, db: DbSession):
    """Profile completeness percentage and per-section breakdown."""
    profile = await service.get_or_create_profile(user, db)
    return ProfileCompletenessOut(
        completeness=profile.profile_completeness,
        sections=profile.onboarding_progress,
        onboarding_completed=profile.onboarding_completed,
    )


@router.put("/basics", response_model=UserProfileOut)
async def update_basics(data: BasicsUpdate, user: AuthenticatedUser, db: DbSession):
    """Save basics section (username, DOB, gender, location)."""
    return await service.update_basics(user, data, db)


@router.put("/skin-identity", response_model=UserProfileOut)
async def update_skin_identity(data: SkinIdentityUpdate, user: AuthenticatedUser, db: DbSession):
    """Save skin identity section."""
    return await service.update_skin_identity(user, data, db)


@router.put("/skin-state", response_model=UserProfileOut)
async def update_skin_state(data: SkinStateUpdate, user: AuthenticatedUser, db: DbSession):
    """Save current skin state. Reusable — call anytime, not just onboarding."""
    return await service.update_skin_state(user, data, db)


@router.put("/routine", response_model=UserProfileOut)
async def update_routine(data: RoutineStateUpdate, user: AuthenticatedUser, db: DbSession):
    """Save current routine info."""
    return await service.update_routine_state(user, data, db)


@router.put("/lifestyle", response_model=UserProfileOut)
async def update_lifestyle(data: LifestyleUpdate, user: AuthenticatedUser, db: DbSession):
    """Save lifestyle section."""
    return await service.update_lifestyle(user, data, db)


@router.put("/preferences", response_model=UserProfileOut)
async def update_preferences(data: PreferencesUpdate, user: AuthenticatedUser, db: DbSession):
    """Save preferences section."""
    return await service.update_preferences(user, data, db)


@router.post("/complete-onboarding", response_model=UserProfileOut)
async def complete_onboarding(user: AuthenticatedUser, db: DbSession):
    """Mark onboarding as complete. User can do this even before 100%."""
    return await service.complete_onboarding(user, db)
