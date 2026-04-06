"""
Skin Insights & Scoring Engine — powered by Gemini.

Analyzes user profile, routine adherence, lifestyle, and skin state
to generate personalized insights and a detailed skin score.
"""
import json
import re
import logging
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.ai.context import build_user_context
from app.features.profile.models import UserProfile
from app.features.routine.models import Routine, RoutineStep, RoutineCompletion

logger = logging.getLogger(__name__)


def _parse_json(text: str) -> dict | None:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
    cleaned = re.sub(r"\n?\s*```\s*$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    s, e = cleaned.find('{'), cleaned.rfind('}')
    if s != -1 and e > s:
        try:
            return json.loads(cleaned[s:e + 1])
        except json.JSONDecodeError:
            pass
    logger.error(f"Insights JSON parse failed: {text[:300]}")
    return None


async def _ask_gemini(prompt: str) -> str:
    from google import genai
    from google.genai.types import GenerateContentConfig
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    config = GenerateContentConfig(temperature=0.3, max_output_tokens=4096)
    try:
        resp = await client.aio.models.generate_content(
            model="gemini-2.5-flash", contents=prompt, config=config,
        )
        return resp.text or ""
    except Exception as e:
        logger.error(f"Gemini insights call failed: {e}")
        return ""


async def _get_routine_stats(user_id: str, db: AsyncSession) -> dict:
    """Get routine adherence stats for the last 30 days."""
    start = date.today() - timedelta(days=30)

    # Active routines
    routines_result = await db.execute(
        select(Routine).where(Routine.user_id == user_id, Routine.is_active == True)
    )
    routines = routines_result.scalars().all()
    if not routines:
        return {"has_routines": False, "routine_count": 0}

    # Total steps across all routines
    total_steps = 0
    routine_names = []
    for r in routines:
        count = await db.execute(
            select(func.count(RoutineStep.id)).where(RoutineStep.routine_id == r.id)
        )
        total_steps += count.scalar() or 0
        routine_names.append(r.name or r.period)

    # Completions in last 30 days
    comp_result = await db.execute(
        select(RoutineCompletion).where(
            RoutineCompletion.user_id == user_id,
            RoutineCompletion.completion_date >= start,
        )
    )
    completions = comp_result.scalars().all()
    completed = sum(1 for c in completions if not c.skipped)
    skipped = sum(1 for c in completions if c.skipped)
    total_possible = total_steps * 30

    # Streak
    dates_result = await db.execute(
        select(RoutineCompletion.completion_date)
        .where(RoutineCompletion.user_id == user_id, RoutineCompletion.skipped == False)
        .distinct()
        .order_by(RoutineCompletion.completion_date.desc())
    )
    dates = [r[0] for r in dates_result.all()]
    current_streak = 0
    if dates:
        today = date.today()
        if dates[0] == today or dates[0] == today - timedelta(days=1):
            current_streak = 1
            for i in range(1, len(dates)):
                if dates[i] == dates[i - 1] - timedelta(days=1):
                    current_streak += 1
                else:
                    break

    adherence = round((completed / total_possible) * 100) if total_possible > 0 else 0

    return {
        "has_routines": True,
        "routine_count": len(routines),
        "routine_names": routine_names,
        "total_steps": total_steps,
        "completed_30d": completed,
        "skipped_30d": skipped,
        "total_possible_30d": total_possible,
        "adherence_pct": adherence,
        "current_streak": current_streak,
    }


def _calculate_skin_score(profile: UserProfile, routine_stats: dict) -> dict:
    """Calculate a detailed skin score (0-100) from profile + routine data."""
    scores = {}

    # 1. HYDRATION (0-25) — based on water intake, dryness level, moisturizer usage
    hydration = 15  # base
    ls = profile.lifestyle or {}
    water = ls.get("water_intake_glasses", 0)
    if water >= 8:
        hydration = 25
    elif water >= 6:
        hydration = 20
    elif water >= 4:
        hydration = 15
    else:
        hydration = 10
    skin_state = profile.current_skin_state or {}
    dryness = skin_state.get("dryness_level", 0)
    if dryness >= 4:
        hydration = max(5, hydration - 10)
    elif dryness >= 2:
        hydration = max(5, hydration - 5)
    scores["hydration"] = hydration

    # 2. BARRIER HEALTH (0-20) — irritation, sensitivity, routine consistency
    barrier = 15
    irritation = skin_state.get("irritation_level", 0)
    if irritation >= 4:
        barrier = 5
    elif irritation >= 2:
        barrier = 10
    if profile.sensitivities and len(profile.sensitivities) > 2:
        barrier = max(5, barrier - 5)
    routine = profile.current_routine or {}
    consistency = routine.get("routine_consistency", "rarely")
    if consistency == "daily":
        barrier = min(20, barrier + 5)
    scores["barrier"] = barrier

    # 3. CLARITY (0-25) — acne, breakouts, oiliness
    clarity = 20
    acne = skin_state.get("acne_level", 0)
    if acne >= 4:
        clarity = 5
    elif acne >= 3:
        clarity = 10
    elif acne >= 2:
        clarity = 15
    if skin_state.get("new_breakouts"):
        clarity = max(5, clarity - 5)
    oiliness = skin_state.get("oiliness_level", 0)
    if oiliness >= 4:
        clarity = max(5, clarity - 3)
    scores["clarity"] = clarity

    # 4. PROTECTION (0-15) — sun protection, SPF habit
    protection = 8
    sun_habit = ls.get("sun_protection_habit", "sometimes")
    if sun_habit == "always":
        protection = 15
    elif sun_habit == "mostly":
        protection = 12
    elif sun_habit == "sometimes":
        protection = 8
    elif sun_habit in ("rarely", "never"):
        protection = 3
    scores["protection"] = protection

    # 5. CONSISTENCY (0-15) — routine adherence, streak
    consistency_score = 5
    if routine_stats.get("has_routines"):
        adh = routine_stats.get("adherence_pct", 0)
        if adh >= 80:
            consistency_score = 15
        elif adh >= 60:
            consistency_score = 12
        elif adh >= 40:
            consistency_score = 8
        else:
            consistency_score = 5
        streak = routine_stats.get("current_streak", 0)
        if streak >= 7:
            consistency_score = min(15, consistency_score + 2)
    scores["consistency"] = consistency_score

    overall = sum(scores.values())

    # Grade
    if overall >= 85:
        grade = "A"
    elif overall >= 70:
        grade = "B"
    elif overall >= 55:
        grade = "C"
    elif overall >= 40:
        grade = "D"
    else:
        grade = "F"

    # Top strength and concern
    best = max(scores, key=scores.get)
    worst = min(scores, key=scores.get)

    return {
        "overall_score": overall,
        "category_scores": scores,
        "grade": grade,
        "best_category": best,
        "worst_category": worst,
    }


async def generate_insights(user_id: str, db: AsyncSession) -> dict:
    """Generate personalized skin insights using Gemini + profile + routine data."""

    # Gather all data
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return _empty_response()

    user_context = await build_user_context(user_id, db)
    routine_stats = await _get_routine_stats(user_id, db)
    score_data = _calculate_skin_score(profile, routine_stats)

    # Build the Gemini prompt
    prompt = f"""You are JAY, an expert skincare AI analyst. Generate personalized skin insights for this user.

USER PROFILE:
{user_context}

ROUTINE STATS (last 30 days):
{json.dumps(routine_stats, indent=2)}

SKIN SCORE BREAKDOWN:
- Overall: {score_data['overall_score']}/100 (Grade: {score_data['grade']})
- Hydration: {score_data['category_scores']['hydration']}/25
- Barrier Health: {score_data['category_scores']['barrier']}/20
- Clarity: {score_data['category_scores']['clarity']}/25
- Sun Protection: {score_data['category_scores']['protection']}/15
- Consistency: {score_data['category_scores']['consistency']}/15

Generate a detailed JSON response with these sections:

1. "summary" — A 2-3 sentence personalized skin assessment summary
2. "top_strength" — What's working well (1 sentence, specific to their data)
3. "top_concern" — What needs attention (1 sentence, specific)
4. "recommendations" — Array of 3-5 specific actionable recommendations based on their profile
5. "insights" — Array of 6-8 detailed insights, each with:
   - "id": unique string
   - "title": short catchy title (4-8 words)
   - "description": detailed explanation (2-4 sentences, personalized, reference specific data points)
   - "category": one of "routine", "ingredient", "lifestyle", "concern", "achievement"
   - "severity": one of "positive" (good news), "neutral" (info), "warning" (needs attention), "critical" (urgent)
   - "action": a specific actionable next step (1 sentence)
6. "weekly_summary" — A motivational 1-2 sentence weekly summary

RULES:
- Be SPECIFIC to their actual data — reference their skin type, concerns, routine, lifestyle
- If they have acne concerns and high dairy intake, connect the dots
- If they skip SPF, warn about it specifically
- If their routine is consistent, celebrate it
- If they have no routine data, focus on profile-based insights
- Make insights actionable and encouraging, not scary
- Use Indian context where relevant (humidity, sun intensity, product availability)
- Output ONLY valid JSON, no markdown fences.

JSON SCHEMA:
{{
  "summary": "string",
  "top_strength": "string",
  "top_concern": "string",
  "recommendations": ["string"],
  "insights": [
    {{
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "routine|ingredient|lifestyle|concern|achievement",
      "severity": "positive|neutral|warning|critical",
      "action": "string"
    }}
  ],
  "weekly_summary": "string"
}}"""

    raw = await _ask_gemini(prompt)
    data = _parse_json(raw)

    if not data:
        return _fallback_response(score_data, profile)

    now = datetime.now(timezone.utc).isoformat()

    return {
        "skin_score": {
            "overall_score": score_data["overall_score"],
            "category_scores": score_data["category_scores"],
            "grade": score_data["grade"],
            "summary": data.get("summary", ""),
            "top_strength": data.get("top_strength", ""),
            "top_concern": data.get("top_concern", ""),
            "recommendations": data.get("recommendations", []),
        },
        "insights": data.get("insights", []),
        "weekly_summary": data.get("weekly_summary", ""),
        "generated_at": now,
    }


def _empty_response() -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "skin_score": {
            "overall_score": 0,
            "category_scores": {"hydration": 0, "barrier": 0, "clarity": 0, "protection": 0, "consistency": 0},
            "grade": "F",
            "summary": "Complete your profile to get personalized skin insights.",
            "top_strength": "None yet",
            "top_concern": "Complete your skin profile to start",
            "recommendations": ["Fill out your skin profile in the onboarding section"],
        },
        "insights": [],
        "weekly_summary": "Start by completing your profile to unlock personalized insights.",
        "generated_at": now,
    }


def _fallback_response(score_data: dict, profile: UserProfile) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    insights = []
    if profile.skin_type:
        insights.append({
            "id": "skin-type", "title": f"Your {profile.skin_type.title()} Skin",
            "description": f"You have {profile.skin_type} skin. Understanding this helps choose the right products.",
            "category": "concern", "severity": "neutral", "action": "Explore products for your skin type in Discover",
        })
    if profile.primary_concerns:
        insights.append({
            "id": "concerns", "title": "Your Top Concerns",
            "description": f"You're focused on: {', '.join(profile.primary_concerns)}. We'll track progress on these.",
            "category": "concern", "severity": "neutral", "action": "Check the Discover section for targeted solutions",
        })

    return {
        "skin_score": {
            "overall_score": score_data["overall_score"],
            "category_scores": score_data["category_scores"],
            "grade": score_data["grade"],
            "summary": f"Your skin health score is {score_data['overall_score']}/100.",
            "top_strength": score_data["best_category"].replace("_", " ").title(),
            "top_concern": score_data["worst_category"].replace("_", " ").title(),
            "recommendations": ["Keep your routine consistent", "Stay hydrated", "Always wear SPF"],
        },
        "insights": insights,
        "weekly_summary": "Keep going — consistency is key to great skin.",
        "generated_at": now,
    }
