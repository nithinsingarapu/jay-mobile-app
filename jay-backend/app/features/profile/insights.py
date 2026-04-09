"""
Skin Insights & Scoring — Groq-powered, cached, with routine streak data.
"""
import json
import re
import logging
import httpx
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.ai.context import build_user_context
from app.features.profile.models import UserProfile
from app.features.routine.models import Routine, RoutineStep, RoutineCompletion

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 12  # Re-generate insights every 12 hours


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
    return None


async def _ask_groq(prompt: str) -> str:
    """Fast insight generation via Groq llama-3.3-70b (~2-3s)."""
    settings = get_settings()
    if not settings.groq_api_key:
        return await _ask_gemini_fallback(prompt)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 4096,
                },
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"Groq insights failed: {e}, falling back to Gemini")
        return await _ask_gemini_fallback(prompt)


async def _ask_gemini_fallback(prompt: str) -> str:
    from google import genai
    from google.genai.types import GenerateContentConfig
    try:
        client = genai.Client(api_key=get_settings().gemini_api_key)
        resp = await client.aio.models.generate_content(
            model="gemini-2.5-flash", contents=prompt,
            config=GenerateContentConfig(temperature=0.3, max_output_tokens=4096),
        )
        return resp.text or ""
    except Exception as e:
        logger.error(f"Gemini insights fallback failed: {e}")
        return ""


async def _get_routine_stats(user_id: str, db: AsyncSession) -> dict:
    """Full routine stats including streak, adherence, step names, products."""
    start = date.today() - timedelta(days=30)

    routines_result = await db.execute(
        select(Routine).where(Routine.user_id == user_id, Routine.is_active == True)
    )
    routines = routines_result.scalars().all()
    if not routines:
        return {"has_routines": False, "routine_count": 0}

    total_steps = 0
    routine_info = []
    for r in routines:
        steps_result = await db.execute(
            select(RoutineStep).where(RoutineStep.routine_id == r.id).order_by(RoutineStep.step_order)
        )
        steps = steps_result.scalars().all()
        total_steps += len(steps)
        step_names = [f"{s.category}: {s.custom_product_name or s.category}" for s in steps]
        routine_info.append({
            "name": r.name or r.period,
            "period": r.period,
            "steps": step_names,
            "step_count": len(steps),
        })

    # Completions
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
    adherence = round((completed / total_possible) * 100) if total_possible > 0 else 0

    # Streak
    dates_result = await db.execute(
        select(RoutineCompletion.completion_date)
        .where(RoutineCompletion.user_id == user_id, RoutineCompletion.skipped == False)
        .distinct().order_by(RoutineCompletion.completion_date.desc())
    )
    dates = [r[0] for r in dates_result.all()]
    current_streak = 0
    longest_streak = 0
    if dates:
        today = date.today()
        if dates[0] == today or dates[0] == today - timedelta(days=1):
            current_streak = 1
            for i in range(1, len(dates)):
                if dates[i] == dates[i - 1] - timedelta(days=1):
                    current_streak += 1
                else:
                    break
        # Longest
        streak = 1
        sorted_dates = sorted(set(dates))
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
                streak += 1
                longest_streak = max(longest_streak, streak)
            else:
                streak = 1

    return {
        "has_routines": True,
        "routine_count": len(routines),
        "routines": routine_info,
        "total_steps": total_steps,
        "completed_30d": completed,
        "skipped_30d": skipped,
        "adherence_pct": adherence,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
    }


def _calculate_skin_score(profile: UserProfile, routine_stats: dict) -> dict:
    """5-category skin score (0-100)."""
    scores = {}

    # 1. HYDRATION (0-25)
    ls = profile.lifestyle or {}
    water = ls.get("water_intake_glasses", 0)
    hydration = 25 if water >= 8 else 20 if water >= 6 else 15 if water >= 4 else 10
    skin_state = profile.current_skin_state or {}
    dryness = skin_state.get("dryness_level", 0)
    if dryness >= 4: hydration = max(5, hydration - 10)
    elif dryness >= 2: hydration = max(5, hydration - 5)
    scores["hydration"] = hydration

    # 2. BARRIER (0-20)
    barrier = 15
    irritation = skin_state.get("irritation_level", 0)
    if irritation >= 4: barrier = 5
    elif irritation >= 2: barrier = 10
    if profile.sensitivities and len(profile.sensitivities) > 2:
        barrier = max(5, barrier - 5)
    routine = profile.current_routine or {}
    if routine.get("routine_consistency") == "daily":
        barrier = min(20, barrier + 5)
    scores["barrier"] = barrier

    # 3. CLARITY (0-25)
    clarity = 20
    acne = skin_state.get("acne_level", 0)
    if acne >= 4: clarity = 5
    elif acne >= 3: clarity = 10
    elif acne >= 2: clarity = 15
    if skin_state.get("new_breakouts"): clarity = max(5, clarity - 5)
    if skin_state.get("oiliness_level", 0) >= 4: clarity = max(5, clarity - 3)
    scores["clarity"] = clarity

    # 4. PROTECTION (0-15)
    sun_habit = ls.get("sun_protection_habit", "sometimes")
    protection = {"always": 15, "mostly": 12, "sometimes": 8}.get(sun_habit, 3)
    scores["protection"] = protection

    # 5. CONSISTENCY (0-15)
    consistency_score = 5
    if routine_stats.get("has_routines"):
        adh = routine_stats.get("adherence_pct", 0)
        consistency_score = 15 if adh >= 80 else 12 if adh >= 60 else 8 if adh >= 40 else 5
        if routine_stats.get("current_streak", 0) >= 7:
            consistency_score = min(15, consistency_score + 2)
    scores["consistency"] = consistency_score

    overall = sum(scores.values())
    grade = "A" if overall >= 85 else "B" if overall >= 70 else "C" if overall >= 55 else "D" if overall >= 40 else "F"

    return {
        "overall_score": overall,
        "category_scores": scores,
        "grade": grade,
        "best_category": max(scores, key=scores.get),
        "worst_category": min(scores, key=scores.get),
    }


async def generate_insights(user_id: str, db: AsyncSession) -> dict:
    """Generate insights with caching. Uses Groq for speed."""

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return _empty_response()

    # Check cache
    cached = profile.cached_insights if hasattr(profile, 'cached_insights') else None
    if cached and isinstance(cached, dict):
        generated_at = cached.get("generated_at", "")
        if generated_at:
            try:
                gen_time = datetime.fromisoformat(generated_at)
                if datetime.now(timezone.utc) - gen_time < timedelta(hours=CACHE_TTL_HOURS):
                    logger.info(f"[Insights] Returning cached insights for {user_id}")
                    return cached
            except (ValueError, TypeError):
                pass

    # Generate fresh
    user_context = await build_user_context(user_id, db)
    routine_stats = await _get_routine_stats(user_id, db)
    score_data = _calculate_skin_score(profile, routine_stats)

    prompt = f"""You are JAY, an expert skincare AI analyst. Generate personalized skin insights.

USER PROFILE:
{user_context}

ROUTINE DATA:
{json.dumps(routine_stats, indent=2)}

SKIN SCORE: {score_data['overall_score']}/100 (Grade {score_data['grade']})
- Hydration: {score_data['category_scores']['hydration']}/25
- Barrier: {score_data['category_scores']['barrier']}/20
- Clarity: {score_data['category_scores']['clarity']}/25
- Protection: {score_data['category_scores']['protection']}/15
- Consistency: {score_data['category_scores']['consistency']}/15
Streak: {routine_stats.get('current_streak', 0)} days | Longest: {routine_stats.get('longest_streak', 0)} days
Adherence: {routine_stats.get('adherence_pct', 0)}%

Generate JSON with:
1. "summary" — 2-3 sentence personalized assessment
2. "top_strength" — what's working (1 sentence)
3. "top_concern" — needs attention (1 sentence)
4. "recommendations" — 3-5 specific actionable items
5. "insights" — 6-8 insights, each: id, title (4-8 words), description (2-3 sentences, reference their data), category (routine/ingredient/lifestyle/concern/achievement), severity (positive/neutral/warning/critical), action (next step)
6. "weekly_summary" — motivational 1-2 sentences

Be SPECIFIC — reference their actual skin type, concerns, streak, adherence, products.
If streak > 0, celebrate it. If adherence < 50%, flag it. Connect lifestyle to skin issues.
Output ONLY valid JSON, no markdown."""

    raw = await _ask_groq(prompt)
    data = _parse_json(raw)

    if not data:
        result = _fallback_response(score_data, profile, routine_stats)
    else:
        now = datetime.now(timezone.utc).isoformat()
        result = {
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

    # Cache in profile
    try:
        await db.execute(
            update(UserProfile).where(UserProfile.user_id == user_id).values(
                cached_insights=result,
            )
        )
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to cache insights: {e}")

    return result


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


def _fallback_response(score_data: dict, profile: UserProfile, routine_stats: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    insights = []
    if profile.skin_type:
        insights.append({
            "id": "skin-type", "title": f"Your {profile.skin_type.title()} Skin",
            "description": f"You have {profile.skin_type} skin type. This helps us recommend the right products and routines.",
            "category": "concern", "severity": "neutral", "action": "Explore products for your skin type",
        })
    streak = routine_stats.get("current_streak", 0)
    if streak > 0:
        insights.append({
            "id": "streak", "title": f"{streak} Day Streak!",
            "description": f"You've been consistent for {streak} days. Keep it going!",
            "category": "achievement", "severity": "positive", "action": "Complete today's routine",
        })
    if routine_stats.get("adherence_pct", 0) < 50 and routine_stats.get("has_routines"):
        insights.append({
            "id": "adherence", "title": "Routine Needs Attention",
            "description": f"Your 30-day adherence is {routine_stats['adherence_pct']}%. Try to be more consistent.",
            "category": "routine", "severity": "warning", "action": "Set a daily reminder for your routine",
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
