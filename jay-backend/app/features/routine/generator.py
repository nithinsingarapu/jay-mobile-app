"""
AI routine generation — "Build with JAY".
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.ai.context import build_user_context
from app.features.profile.models import UserProfile
from app.features.products.service import search_for_routine_step
from .constants import ROUTINE_TYPES, STEP_CATEGORIES, SKIN_TYPE_RULES, APPLICATION_ORDER
from .models import RoutineGeneration
from .prompts import ROUTINE_GENERATION_PROMPT
from .schemas import GenerateRoutineRequest, GeneratedRoutineOut
from sqlalchemy import select


async def generate_routine(
    user: CurrentUser, data: GenerateRoutineRequest, db: AsyncSession
) -> GeneratedRoutineOut:
    # 1. Load user profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()

    # 2. Determine routine type
    routine_type = data.routine_type
    if routine_type == "auto":
        complexity = "moderate"
        if profile and profile.preferences:
            pref_complexity = profile.preferences.get("routine_complexity", "")
            complexity_map = {
                "minimal_1_3": "essential",
                "moderate_4_5": "complete",
                "elaborate_6_plus": "glass_skin",
                "whatever_works": "complete",
            }
            routine_type = complexity_map.get(pref_complexity, "complete")
        else:
            routine_type = "complete"

    type_info = ROUTINE_TYPES.get(routine_type, ROUTINE_TYPES["complete"])
    periods = ["am", "pm"] if data.period == "both" else [data.period]

    # 3. Build user context
    user_context = await build_user_context(user.id, db)

    # Extract profile data for prompt
    allergies = profile.allergies if profile and profile.allergies else []
    skin_type = profile.skin_type if profile else "combination"
    budget = "no limit"
    product_preference = "no preference"
    if profile and profile.preferences:
        budget_map = {"under_500": "under Rs.500", "500_1000": "Rs.500-1000", "1000_2000": "Rs.1000-2000", "2000_plus": "Rs.2000+", "no_limit": "no limit"}
        budget = budget_map.get(profile.preferences.get("budget_range", ""), "no limit")
        product_preference = profile.preferences.get("product_preference", "no preference")

    skin_rules = SKIN_TYPE_RULES.get(skin_type, {})

    # Generate for each period
    all_steps = []
    all_reasoning = []
    all_tips = []
    all_conflicts = []
    total_cost = 0

    for period in periods:
        template = type_info.get(f"{period}_template", [])

        # 4. Query products for each template slot
        available_products_text = ""
        for cat in template:
            # search_for_routine_step handles category mapping internally
            products = await search_for_routine_step(
                db, category=cat,
                budget=2000,
                exclude_ingredients=allergies,
                limit=5,
            )
            if products:
                product_lines = []
                for p in products:
                    price_str = f"Rs.{p.price_inr}" if p.price_inr else "price unknown"
                    ings = ", ".join(p.key_ingredients[:5]) if p.key_ingredients else "ingredients not listed"
                    product_lines.append(f"  - ID:{p.id} | {p.brand} — {p.name} | {price_str} | Key: {ings}")
                available_products_text += f"\n[{cat.upper()}]:\n" + "\n".join(product_lines)
            else:
                available_products_text += f"\n[{cat.upper()}]: No products found — suggest user add custom product name"

        # 5. Build prompt
        app_order = APPLICATION_ORDER.get(period, {})
        # Use replace() not .format() — skin_type_rules contains JSON braces
        prompt = ROUTINE_GENERATION_PROMPT
        for k, v in {
            "{period}": period,
            "{user_context}": user_context,
            "{routine_type}": routine_type,
            "{template_steps}": ", ".join(template),
            "{additional_instructions}": data.additional_instructions or "None",
            "{keep_products}": "None specified" if not data.keep_products else str(data.keep_products),
            "{available_products}": available_products_text or "No products in database yet",
            "{application_order_rules}": "\n".join(app_order.get("rules", [])),
            "{skin_type_rules}": json.dumps(skin_rules, indent=2),
            "{budget_range}": budget,
            "{allergies}": ", ".join(allergies) if allergies else "None",
            "{max_steps}": str(type_info.get("max_steps", 7)),
            "{product_preference}": product_preference,
        }.items():
            prompt = prompt.replace(k, str(v))

        # 6. Call Gemini
        try:
            from app.ai.providers.gemini import GeminiProvider
            provider = GeminiProvider()
            response_text = await provider.generate(
                system_prompt="You are JAY, a skincare expert. Respond ONLY with valid JSON. Use null for unknown prices, never strings like 'price unknown'.",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=8000,
            )

            # Parse JSON from response — handle markdown wrapping + common Gemini quirks
            response_text = response_text.strip()
            # Strip markdown code fences
            if "```" in response_text:
                # Extract content between first ``` and last ```
                parts = response_text.split("```")
                # The JSON is usually in parts[1] (between first pair of ```)
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("{"):
                        response_text = cleaned
                        break
            # Try parsing as-is first
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # Fix common issues: single quotes, trailing commas, unquoted keys
                import re
                fixed = response_text
                # Replace single quotes around keys/values with double quotes
                fixed = re.sub(r"'([^']*)'", r'"\1"', fixed)
                # Remove trailing commas before } or ]
                fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
                # Try again
                try:
                    result = json.loads(fixed)
                except json.JSONDecodeError:
                    # Last resort: find the first { and last } and try that
                    start = fixed.find('{')
                    end = fixed.rfind('}')
                    if start != -1 and end != -1:
                        result = json.loads(fixed[start:end + 1])
                    else:
                        raise

            steps = result.get("steps", [])
            for s in steps:
                s["period"] = period
                # Fix price — Gemini sometimes returns "price unknown" instead of null
                if isinstance(s.get("product_price"), str):
                    s["product_price"] = None
                if isinstance(s.get("wait_time_seconds"), str):
                    try: s["wait_time_seconds"] = int(s["wait_time_seconds"])
                    except: s["wait_time_seconds"] = None
            all_steps.extend(steps)
            all_reasoning.append(result.get("reasoning", ""))
            all_tips.extend(result.get("tips", []))
            all_conflicts.extend(result.get("conflicts_checked", []))
            # Fix cost — might be string or null
            cost_val = result.get("total_monthly_cost", 0)
            if isinstance(cost_val, (int, float)):
                total_cost += cost_val

        except Exception as e:
            print(f"[Routine Generator] Error for {period}: {e}")
            print(f"[Routine Generator] Raw response: {response_text[:500] if 'response_text' in dir() else 'no response'}")
            # Fallback — return template without specific products
            for idx, cat in enumerate(template):
                cat_info = STEP_CATEGORIES.get(cat, {})
                all_steps.append({
                    "step_order": idx + 1,
                    "category": cat,
                    "product_id": None,
                    "product_name": None,
                    "product_brand": None,
                    "product_price": None,
                    "instruction": cat_info.get("default_instruction", ""),
                    "wait_time_seconds": cat_info.get("wait_time_seconds"),
                    "frequency": cat_info.get("frequency", "daily"),
                    "is_essential": cat_info.get("is_essential", True),
                    "why_this_product": f"AI unavailable ({str(e)[:50]}). Fill in your preferred product.",
                    "period": period,
                })
            all_reasoning.append(f"AI generation failed: {str(e)[:100]}. Template provided for manual filling.")

    # 7. Save generation record
    gen_record = RoutineGeneration(
        user_id=user.id,
        routine_type=routine_type,
        period=data.period,
        input_profile_snapshot={
            "skin_type": skin_type,
            "concerns": profile.primary_concerns if profile else [],
            "budget": budget,
            "allergies": allergies,
        },
        generated_routine={"steps": all_steps, "reasoning": " ".join(all_reasoning)},
    )
    db.add(gen_record)
    await db.flush()

    return GeneratedRoutineOut(
        routine_type=routine_type,
        period=data.period,
        name=f"JAY's {type_info['name']} routine",
        total_monthly_cost=total_cost,
        steps=all_steps,
        reasoning=" ".join(all_reasoning),
        tips=list(set(all_tips)),
        conflicts_checked=all_conflicts,
    )
