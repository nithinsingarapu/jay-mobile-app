# JAY Backend — Phase 3: Routine Builder

> **Attach these 3 files:**
> 1. `JAY_Routine_Architecture.md` — Full architecture spec (types, schemas, constants, API design, AI prompt)
> 2. `routine_.pdf` — Skincare routine research (AM/PM rules, skin type routines, application order, ingredient categories, glass skin routine)
> 3. `products_data.csv` — Product database CSV
>
> **Read all 3 files FIRST before writing any code.** The architecture doc is the source of truth for everything you build.

---

```
I'm building Phase 3 of JAY's backend: the Routine Builder. Phase 1 (auth + profile) and Phase 2 (AI chat) are already running.

EXISTING CODE (don't break anything):
- app/config.py (Settings: supabase_url, supabase_jwt_secret, database_url, debug, gemini_api_key)
- app/database.py (async SQLAlchemy engine → Supabase PostgreSQL)
- app/auth.py (Supabase JWT verify, CurrentUser, AuthenticatedUser)
- app/shared/exceptions.py (AuthError, NotFoundError, ConflictError)
- app/features/profile/ (UserProfile model, schemas, service, router, questionnaire)
- app/features/chat/ (Conversation, Message models, chat service with streaming, router)
- app/ai/providers/gemini.py (GeminiProvider with stream() and generate())
- app/ai/context.py (build_user_context)
- app/ai/prompts/chat_system.py (JAY personality)
- app/main.py (FastAPI app with /health, profile router, chat router, dev test-token)
- alembic/ (configured, has migrations for user_profiles, conversations, messages)

I've attached 3 files:
1. JAY_Routine_Architecture.md — READ THIS ENTIRELY. It contains the complete architecture: 6 routine types, 15 step categories, ingredient conflict rules, skin type rules, application order rules, database schema (4 tables), all API endpoints, AI generation prompt, and the phased build plan. This is your blueprint.
2. routine_.pdf — Skincare research document. Use this to verify the clinical rules in the architecture doc (AM vs PM ingredients, double cleansing rules, ingredient layering, skin-type-specific approaches).
3. products_data.csv — The product database. You'll need to seed this into the products table first, then the routine builder can reference it.

BUILD ALL 3 PHASES IN ONE GO. The feature is interconnected — the AI generator needs the product DB, the validator needs the conflict rules, the tracker needs the models. Build it complete.

---

## STEP 1: Products table + seed data

The routine builder needs a products table to reference. Create it now.

### app/features/products/__init__.py
Empty.

### app/features/products/models.py

Create the Product model from the architecture doc. Read products_data.csv headers to understand what columns exist. The model should include at minimum:
- id: Serial integer PK
- name: String, not null
- brand: String, not null, indexed
- category: String, indexed (cleanser, serum, moisturizer, sunscreen, toner, eye_cream, mask, treatment, lip_care, face_oil, exfoliant, essence)
- subcategory: String, nullable
- price_inr: Numeric(10,2)
- size_ml: Numeric(8,2), nullable
- key_ingredients: ARRAY(String), with GIN index
- full_ingredients: Text, nullable
- description: Text, nullable
- image_url: String(500), nullable
- source_url: String(500), nullable
- is_available: Boolean, default true
- created_at, updated_at: TIMESTAMPTZ

Add a full-text search index: `idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || brand))`

### app/features/products/schemas.py

- ProductOut: all fields, from_attributes
- ProductListOut: list + pagination (total, limit, offset)
- ProductSearchParams: q, brand, category, min_price, max_price, limit, offset

### app/features/products/service.py

- search_products(q, brand, category, min_price, max_price, limit, offset) — uses full-text search for q parameter
- get_product_by_id(id)
- get_brands() — distinct brands list
- get_categories() — distinct categories list
- search_for_routine_step(category, concern, budget, exclude_allergens, skin_type, limit) — specialized search for the routine builder

### app/features/products/router.py

```
GET /api/v1/products?q=&brand=&category=&min_price=&max_price=&limit=20&offset=0
GET /api/v1/products/{id}
GET /api/v1/products/brands
GET /api/v1/products/categories
```

All public endpoints (no auth needed for browsing).

### Seed script: scripts/seed_products.py

Read products_data.csv and insert all rows into the products table. Map CSV columns to model columns. Handle:
- Missing values gracefully (nullable fields)
- key_ingredients: if the CSV has an ingredients column, parse it into an array (split by comma, strip whitespace, lowercase)
- category mapping: normalize category names to match the model's enum
- Run with: `uv run python scripts/seed_products.py`

The script should:
1. Read the CSV
2. Connect to the database (sync connection for simplicity)
3. Insert all products, skipping duplicates (by name + brand)
4. Print summary: "Inserted X products across Y brands"

---

## STEP 2: Routine constants

### app/features/routine/__init__.py
Empty.

### app/features/routine/constants.py

Copy EVERYTHING from the architecture doc:
- ROUTINE_TYPES dict (all 6 types with templates, descriptions, who_its_for)
- STEP_CATEGORIES dict (all 15 categories with period, order, instructions, wait times, frequency)
- CONFLICT_RULES dict (avoid pairs, caution pairs, synergy pairs)
- SKIN_TYPE_RULES dict (prefer/avoid textures, key/avoid ingredients per skin type)
- APPLICATION_ORDER dict (AM and PM order with rules)

These are config constants — no database, no AI. Pure Python dicts that the service and validator reference.

---

## STEP 3: Routine models

### app/features/routine/models.py

Create all 4 models from the architecture doc:

1. Routine — id (UUID PK), user_id, name, period (am/pm), routine_type, is_active (bool), total_monthly_cost (Numeric), created_at, updated_at. UNIQUE constraint on (user_id, period) WHERE is_active = true.

2. RoutineStep — id (UUID PK), routine_id (FK → routines, CASCADE), step_order, category, product_id (FK → products, nullable), custom_product_name, instruction, wait_time_seconds, frequency (default 'daily'), frequency_days (ARRAY), is_essential (bool), notes, why_this_product. UNIQUE on (routine_id, step_order).

3. RoutineCompletion — id (UUID PK), user_id, routine_id (FK), step_id (FK), completion_date (DATE), completed_at (TIMESTAMPTZ), skipped (bool), skip_reason. UNIQUE on (step_id, completion_date). Index on (user_id, completion_date).

4. RoutineGeneration — id (UUID PK), user_id, routine_type, period, input_profile_snapshot (JSONB), generated_routine (JSONB), was_accepted (bool), modifications (JSONB), created_at.

Use proper FK relationships with SQLAlchemy relationship() for Routine → RoutineStep (cascade delete).

---

## STEP 4: Routine schemas

### app/features/routine/schemas.py

Create ALL these Pydantic models:

**Input schemas:**

```python
class CreateRoutineRequest(BaseModel):
    name: str | None = None
    period: Literal["am", "pm"]
    routine_type: Literal["essential", "complete", "glass_skin", "barrier_repair", "anti_acne", "custom"]

class AddStepRequest(BaseModel):
    category: str  # from STEP_CATEGORIES keys
    product_id: int | None = None
    custom_product_name: str | None = None
    instruction: str | None = None  # auto-filled from STEP_CATEGORIES if not provided
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
    step_ids: list[str]  # ordered list of step UUIDs

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
```

**Output schemas:**

```python
class StepOut(BaseModel):
    id: UUID
    step_order: int
    category: str
    product_id: int | None
    product_name: str | None  # resolved from product or custom_product_name
    product_brand: str | None
    product_price: float | None
    instruction: str | None
    wait_time_seconds: int | None
    frequency: str
    frequency_days: list[str] | None
    is_essential: bool
    notes: str | None
    why_this_product: str | None
    model_config = {"from_attributes": True}

class RoutineOut(BaseModel):
    id: UUID
    name: str | None
    period: str
    routine_type: str
    is_active: bool
    total_monthly_cost: float | None
    steps: list[StepOut]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class RoutineOverview(BaseModel):
    am: RoutineOut | None
    pm: RoutineOut | None

class CompletionStatusOut(BaseModel):
    step_id: str
    step_category: str
    product_name: str | None
    completed: bool
    skipped: bool
    completed_at: datetime | None

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
    conflicts: list[ConflictOut]
    order_issues: list[str]
    suggestions: list[str]

class GeneratedRoutineOut(BaseModel):
    routine_type: str
    period: str
    name: str
    total_monthly_cost: float
    steps: list[dict]  # full step data with why_this_product
    reasoning: str
    tips: list[str]
    conflicts_checked: list[dict]
```

---

## STEP 5: Routine validator

### app/features/routine/validator.py

This is the ingredient conflict engine + order validator. Pure logic, no AI, no database.

```python
def validate_routine(steps: list, period: str) -> ValidationResultOut:
    """
    Validate a routine for:
    1. Ingredient conflicts between products
    2. Correct application order
    3. Period-specific rules (no retinol in AM, no SPF in PM, etc.)
    4. Skin-type compatibility (if user profile provided)
    
    Returns: valid (bool), conflicts list, order issues, suggestions
    """
```

Implement these checks:

**Conflict detection:**
- For each pair of products in the routine, check their key_ingredients against CONFLICT_RULES["avoid"] and CONFLICT_RULES["caution"]
- Return the severity, reason, and solution for each conflict found

**Order validation:**
- Check that steps follow APPLICATION_ORDER for the given period
- Flag if a step is out of order (e.g., moisturizer before serum)
- Flag if sunscreen isn't the last step in AM
- Flag if retinol/AHA/BHA is in an AM routine

**Period rules:**
- AM: no retinol, no oil cleanser (unless user explicitly adds it), sunscreen mandatory
- PM: no sunscreen step, double cleanse encouraged if AM has sunscreen

**Suggestions:**
- If missing essential steps (cleanser, moisturizer, SPF for AM), suggest adding them
- If exfoliant is set to "daily", suggest reducing to 2-3x/week
- If routine has conflicting actives, suggest AM/PM split

Also create:

```python
def check_product_conflicts(product_a_ingredients: list, product_b_ingredients: list) -> list[ConflictOut]:
    """Check two products' ingredients against conflict rules."""

def get_correct_order(steps: list, period: str) -> list:
    """Return the steps sorted in correct application order."""

def suggest_missing_steps(steps: list, period: str, routine_type: str) -> list[str]:
    """Suggest essential steps that are missing from the routine."""
```

---

## STEP 6: Routine service

### app/features/routine/service.py

The main business logic. Implement ALL these functions:

**CRUD:**
```python
async def get_active_routines(user: CurrentUser, db) -> RoutineOverview:
    """Get both active AM and PM routines with all steps and product details."""

async def create_routine(user: CurrentUser, data: CreateRoutineRequest, db) -> Routine:
    """Create a new routine. Deactivates any existing active routine for the same period."""

async def add_step(user: CurrentUser, routine_id: UUID, data: AddStepRequest, db) -> RoutineStep:
    """
    Add a step to a routine.
    - Auto-fill instruction from STEP_CATEGORIES if not provided
    - Auto-fill wait_time from STEP_CATEGORIES if not provided
    - Set step_order to next available position
    - Run validation after adding
    - Recalculate total_monthly_cost
    """

async def update_step(user: CurrentUser, routine_id: UUID, step_id: UUID, data: UpdateStepRequest, db) -> RoutineStep:
    """Update a step. Recalculate cost if product changed."""

async def remove_step(user: CurrentUser, routine_id: UUID, step_id: UUID, db):
    """Remove a step. Reorder remaining steps to fill the gap."""

async def reorder_steps(user: CurrentUser, routine_id: UUID, data: ReorderStepsRequest, db) -> list[RoutineStep]:
    """Reorder steps based on the provided ordered list of step IDs."""

async def replace_all_steps(user: CurrentUser, routine_id: UUID, steps: list[AddStepRequest], db) -> list[RoutineStep]:
    """Delete all existing steps and replace with the provided list. Used by AI generator."""

async def deactivate_routine(user: CurrentUser, routine_id: UUID, db):
    """Set is_active = false. Don't delete — keep history."""
```

**Daily tracking:**
```python
async def complete_step(user: CurrentUser, routine_id: UUID, data: CompleteStepRequest, db) -> RoutineCompletion:
    """Mark a step as complete (or skipped) for today. Upsert — calling again updates."""

async def complete_all_steps(user: CurrentUser, routine_id: UUID, db) -> list[RoutineCompletion]:
    """Mark all steps in a routine as complete for today."""

async def get_today_status(user: CurrentUser, routine_id: UUID, db) -> TodayStatusOut:
    """Get completion status for today — which steps done, which remaining."""

async def get_stats(user: CurrentUser, period_days: int, db) -> StatsOut:
    """
    Calculate adherence stats over a period.
    - Count total possible routine completions (days × steps)
    - Count actual completions, skips, misses
    - Calculate current streak (consecutive days with ALL steps completed)
    - Calculate longest streak
    """

async def get_streak(user: CurrentUser, db) -> dict:
    """Current diary-style streak — consecutive days with at least one completion."""
```

**Utility:**
```python
async def calculate_monthly_cost(routine_id: UUID, db) -> float:
    """Sum prices of all products in the routine. Store in routine.total_monthly_cost."""

async def check_routine_conflicts(routine_id: UUID, db) -> list[ConflictOut]:
    """Load all products in a routine and check every pair for conflicts."""
```

---

## STEP 7: Routine generator (AI)

### app/features/routine/generator.py

The "Build with JAY" feature.

```python
async def generate_routine(user: CurrentUser, data: GenerateRoutineRequest, db) -> GeneratedRoutineOut:
    """
    AI generates a personalized routine.
    
    Flow:
    1. Load user profile (skin type, concerns, budget, allergies, preferences)
    2. Determine routine type:
       - If "auto": pick based on user's routine_complexity preference
         - minimal_1_3 → essential
         - moderate_4_5 → complete
         - elaborate_6_plus → glass_skin
         - whatever_works → complete
       - If specific type chosen: use that
    3. Query products database:
       - For each step slot in the routine template, search products WHERE:
         - category matches the step
         - price fits within budget (divided across products)
         - key_ingredients don't include user's allergens
         - is_available = true
       - Return top 5 candidates per slot (for AI to choose from)
    4. Build the AI prompt with:
       - User context (from build_user_context)
       - Routine type template
       - Available products per slot (names, prices, ingredients)
       - Conflict rules
       - Skin type rules
       - Budget constraint
       - Any keep_products from current routine
       - additional_instructions from user
    5. Call Gemini to generate the routine (use generate(), not stream — this returns structured JSON)
    6. Parse the response, validate it (run validator)
    7. Save to routine_generations table
    8. Return the generated routine for user review
    """
```

### app/features/routine/prompts.py

The AI prompt for routine generation. Copy the ROUTINE_GENERATION_PROMPT from the architecture doc. Make sure the {placeholders} are filled dynamically.

---

## STEP 8: Routine router

### app/features/routine/router.py

Register ALL endpoints from the architecture doc:

```python
# Types
GET    /api/v1/routine/types                         → list routine type definitions

# CRUD  
GET    /api/v1/routine                               → get active AM + PM routines
POST   /api/v1/routine                               → create routine
PUT    /api/v1/routine/{id}/steps                    → replace all steps
POST   /api/v1/routine/{id}/steps                   → add a step
PUT    /api/v1/routine/{id}/steps/{step_id}          → update a step
DELETE /api/v1/routine/{id}/steps/{step_id}          → remove a step
POST   /api/v1/routine/{id}/reorder                  → reorder steps
DELETE /api/v1/routine/{id}                          → deactivate routine

# AI generation
POST   /api/v1/routine/generate                      → build with JAY
POST   /api/v1/routine/validate                      → validate routine for conflicts

# Daily tracking
POST   /api/v1/routine/{id}/complete                 → mark step complete
POST   /api/v1/routine/{id}/complete-all             → mark all steps complete
GET    /api/v1/routine/{id}/today                    → today's completion status
GET    /api/v1/routine/stats?period=7                → adherence stats
GET    /api/v1/routine/streak                        → current streak

# Products for routine builder
GET    /api/v1/routine/products/search               → search products for a step
       ?category=serum&concern=dark_spots&budget=1000&exclude_allergens=fragrance
GET    /api/v1/routine/products/recommend             → JAY's top pick for a category
       ?category=sunscreen&skin_type=oily&budget=500

# Utility
GET    /api/v1/routine/cost                          → monthly cost of active routine
GET    /api/v1/routine/conflicts                     → check all conflicts in active routine
```

All endpoints except /types require auth (AuthenticatedUser).

---

## STEP 9: Register routers + migrate

### Update app/main.py

Add these lines inside create_app(), after existing routers:

```python
from app.features.products.router import router as products_router
from app.features.routine.router import router as routine_router

app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(routine_router, prefix="/api/v1/routine", tags=["Routine"])
```

### Update alembic/env.py

Add model imports:
```python
from app.features.products.models import Product  # noqa: F401
from app.features.routine.models import Routine, RoutineStep, RoutineCompletion, RoutineGeneration  # noqa: F401
```

### Run migration + seed

```bash
uv run alembic revision --autogenerate -m "add products, routines, routine_steps, routine_completions, routine_generations tables"
uv run alembic upgrade head
uv run python scripts/seed_products.py
```

Check Supabase dashboard: all 5 new tables should exist, products table should have data.

---

## STEP 10: Verify everything

```bash
uv run uvicorn app.main:app --reload
```

```bash
# Token
TOKEN=$(curl -s -X POST "http://localhost:8000/dev/test-token?email=priya@test.com&name=Priya+Sharma" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# ---- PHASE 1 STILL WORKS ----
# 1.
curl -s http://localhost:8000/health
curl -s http://localhost:8000/api/v1/profile -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Profile OK: {d[\"email\"]}')"

# ---- PRODUCTS ----
# 2. Search products
curl -s "http://localhost:8000/api/v1/products?q=vitamin+c&limit=5" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for p in d: print(f'  {p[\"brand\"]} — {p[\"name\"]} — Rs.{p.get(\"price_inr\",\"?\")}')"

# 3. Get brands
curl -s http://localhost:8000/api/v1/products/brands | python3 -c "import sys,json; brands=json.load(sys.stdin); print(f'Brands: {len(brands)}')"

# 4. Filter by category
curl -s "http://localhost:8000/api/v1/products?category=sunscreen&limit=3" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for p in d: print(f'  {p[\"name\"]} Rs.{p.get(\"price_inr\",\"?\")}')"

# ---- ROUTINE TYPES ----
# 5. Get types
curl -s http://localhost:8000/api/v1/routine/types | python3 -c "
import sys,json; types=json.load(sys.stdin)
for t in types: print(f'  {t}: {types[t][\"name\"]} — {types[t][\"description\"][:50]}...')"

# ---- MANUAL ROUTINE CRUD ----
# 6. Create AM routine
AM_ID=$(curl -s -X POST http://localhost:8000/api/v1/routine \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"am","routine_type":"essential","name":"My morning basics"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "AM routine: $AM_ID"

# 7. Add steps
curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/steps" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"cleanser","custom_product_name":"CeraVe Foaming Cleanser"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Step 1: {d[\"category\"]}')"

curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/steps" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"moisturizer","custom_product_name":"Neutrogena Hydro Boost"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Step 2: {d[\"category\"]}')"

curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/steps" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"sunscreen","custom_product_name":"La Shield SPF 50"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Step 3: {d[\"category\"]}')"

# 8. Get active routines
curl -s http://localhost:8000/api/v1/routine \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
am = d.get('am')
if am: print(f'AM: {am[\"routine_type\"]} — {len(am[\"steps\"])} steps')
else: print('AM: none')
pm = d.get('pm')
if pm: print(f'PM: {pm[\"routine_type\"]} — {len(pm[\"steps\"])} steps')
else: print('PM: none')"

# ---- DAILY TRACKING ----
# 9. Get today's status
curl -s "http://localhost:8000/api/v1/routine/$AM_ID/today" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Today: {d[\"completed_steps\"]}/{d[\"total_steps\"]} ({d[\"completion_percentage\"]}%)')"

# 10. Complete first step
STEP1_ID=$(curl -s http://localhost:8000/api/v1/routine \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['am']['steps'][0]['id'])")
curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/complete" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"step_id\":\"$STEP1_ID\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completed: {d[\"completion_date\"]}')"

# 11. Skip second step
STEP2_ID=$(curl -s http://localhost:8000/api/v1/routine \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['am']['steps'][1]['id'])")
curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/complete" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"step_id\":\"$STEP2_ID\",\"skipped\":true,\"skip_reason\":\"ran out of product\"}"

# 12. Check status again
curl -s "http://localhost:8000/api/v1/routine/$AM_ID/today" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Today: {d[\"completed_steps\"]} done, {d[\"skipped_steps\"]} skipped, {d[\"remaining_steps\"]} remaining')"

# 13. Complete all remaining
curl -s -X POST "http://localhost:8000/api/v1/routine/$AM_ID/complete-all" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Completed all: {len(d)} steps')"

# ---- VALIDATION ----
# 14. Validate a routine with conflicts
curl -s -X POST http://localhost:8000/api/v1/routine/validate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"pm","steps":[{"category":"serum","custom_product_name":"Retinol 0.5%"},{"category":"treatment","custom_product_name":"Glycolic acid 10%"}]}' \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Valid: {d[\"valid\"]}')
for c in d.get('conflicts',[]): print(f'  CONFLICT: {c[\"ingredient_a\"]} + {c[\"ingredient_b\"]}: {c[\"reason\"]}')"
# → Should flag retinol + AHA conflict

# ---- STATS ----
# 15. Get adherence stats
curl -s "http://localhost:8000/api/v1/routine/stats?period=7" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Adherence: {d[\"adherence_percentage\"]}% over {d[\"period_days\"]} days, streak: {d[\"current_streak\"]}')"

# ---- AI GENERATION ----
# 16. Make sure profile is filled (skip if already done)
curl -s -X PUT http://localhost:8000/api/v1/profile/skin-identity \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"skin_type":"combination","fitzpatrick_type":4,"primary_concerns":["acne","dark_spots","pores"],"sensitivities":["fragrance"]}' > /dev/null

curl -s -X PUT http://localhost:8000/api/v1/profile/preferences \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"budget_range":"500_1000","routine_complexity":"moderate_4_5","top_goal":"clear_skin","fragrance_preference":"prefer_unscented"}' > /dev/null

# 17. Build with JAY
curl -s -X POST http://localhost:8000/api/v1/routine/generate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"both","routine_type":"auto"}' \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Type: {d[\"routine_type\"]}')
print(f'Cost: Rs.{d[\"total_monthly_cost\"]}')
print(f'Reasoning: {d[\"reasoning\"][:100]}...')
print('Steps:')
for s in d['steps']:
    print(f'  {s[\"step_order\"]}. [{s[\"category\"]}] {s.get(\"product_name\",\"?\")} — Rs.{s.get(\"product_price\",\"?\")}')
    print(f'     Why: {s.get(\"why_this_product\",\"\")[:80]}...')"

# ---- PRODUCT SEARCH FOR ROUTINE ----
# 18. Search products for a routine step
curl -s "http://localhost:8000/api/v1/routine/products/search?category=serum&budget=1000" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; products=json.load(sys.stdin)
for p in products[:5]: print(f'  {p[\"brand\"]} — {p[\"name\"]} Rs.{p.get(\"price_inr\",\"?\")}')"

# ---- MONTHLY COST ----
# 19. Get routine cost
curl -s http://localhost:8000/api/v1/routine/cost \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Monthly cost: Rs.{d.get(\"total_monthly_cost\",0)}')"

# ---- CONFLICTS CHECK ----
# 20. Check conflicts in active routine
curl -s http://localhost:8000/api/v1/routine/conflicts \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
if d: 
    for c in d: print(f'  {c[\"severity\"]}: {c[\"ingredient_a\"]} + {c[\"ingredient_b\"]}')
else: print('No conflicts found')"
```

Run ALL 20 checks. Fix any failures before finishing.

---

## RULES
- No git commands
- Create all files via tool use
- READ the 3 attached files completely before writing any code
- The architecture doc is the source of truth — follow the schemas, constants, and API design exactly
- Products seed script must handle the actual CSV format (read headers, map columns)
- Validation is deterministic (no AI) — just ingredient matching against CONFLICT_RULES
- AI generation uses Gemini generate() not stream() — returns structured JSON
- Routine ownership must be verified on every endpoint (user can only access their own routines)
- Step order auto-increments when adding steps
- Completing a step is idempotent — calling again for the same step+date updates rather than creating a duplicate
- total_monthly_cost recalculates whenever steps change
- The validator should work even with custom_product_name steps (no product_id) — just skip ingredient conflict checks for those
- UNIQUE constraint on (user_id, period) WHERE is_active = true means creating a new routine deactivates the old one for that period
```
