# JAY Phase 3: Routine Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Routine Builder backend — products table with 723 seeded products, 4 routine models (Routine, RoutineStep, RoutineCompletion, RoutineGeneration), full CRUD + daily tracking + AI generation with Gemini + ingredient conflict validation.

**Architecture:** Feature-based modular monolith. Two new feature modules: `products/` (model, schema, service, router) and `routine/` (models, schemas, constants, validator, service, generator, prompts, router). AI generation uses existing GeminiProvider. All data in Supabase PostgreSQL via SQLAlchemy async.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, google-genai (Gemini 2.5 Flash), asyncpg, PostgreSQL

---

## File Structure

### New files to create:

```
app/features/products/
├── __init__.py
├── models.py          # Product model (maps CSV columns)
├── schemas.py         # ProductOut, search params
├── service.py         # search, get_by_id, search_for_routine
└── router.py          # GET /products, /products/{id}, /products/brands, /products/categories

app/features/routine/
├── __init__.py
├── constants.py       # ROUTINE_TYPES, STEP_CATEGORIES, CONFLICT_RULES, SKIN_TYPE_RULES, APPLICATION_ORDER
├── models.py          # Routine, RoutineStep, RoutineCompletion, RoutineGeneration
├── schemas.py         # All request/response Pydantic models
├── validator.py       # Conflict detection + order validation (pure logic, no DB/AI)
├── service.py         # CRUD + completion tracking + stats + cost
├── generator.py       # AI routine generation (calls Gemini)
├── prompts.py         # ROUTINE_GENERATION_PROMPT template
└── router.py          # All 20+ endpoints

scripts/
└── seed_products.py   # Reads product_database.csv, inserts into products table
```

### Files to modify:
- `app/main.py` — add 2 router includes
- `alembic/env.py` — add model imports
- `app/database.py` — import async_session_factory (already exported, just used by seed script)

---

### Task 1: Products model + schema

**Files:**
- Create: `app/features/products/__init__.py`
- Create: `app/features/products/models.py`
- Create: `app/features/products/schemas.py`

- [ ] **Step 1: Create Product model**

Map CSV columns to SQLAlchemy model. CSV has: id, name, brand, category, subcategory, product_type, target_gender, age_group, texture, format, description, how_to_use, inci_list, concerns, suitable_for, claims, claims_analysis, warnings, formulation, product_url.

```python
# app/features/products/models.py
class Product(Base):
    __tablename__ = "products"
    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    name = mapped_column(String(500), nullable=False)
    brand = mapped_column(String(200), nullable=False, index=True)
    category = mapped_column(String(50), nullable=False, index=True)
    subcategory = mapped_column(String(50), nullable=True)
    product_type = mapped_column(String(50), nullable=True)
    texture = mapped_column(String(50), nullable=True)
    description = mapped_column(Text, nullable=True)
    how_to_use = mapped_column(Text, nullable=True)
    key_ingredients = mapped_column(ARRAY(String), nullable=True)  # parsed from inci_list
    full_ingredients = mapped_column(Text, nullable=True)  # raw inci_list
    concerns = mapped_column(ARRAY(String), nullable=True)  # parsed from concerns column
    suitable_for = mapped_column(JSONB, nullable=True)
    price_inr = mapped_column(Numeric(10,2), nullable=True)
    image_url = mapped_column(String(500), nullable=True)
    product_url = mapped_column(String(500), nullable=True)
    formulation = mapped_column(JSONB, nullable=True)
    is_available = mapped_column(Boolean, default=True)
    created_at = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
```

- [ ] **Step 2: Create ProductOut and search schemas**

---

### Task 2: Products service + router

**Files:**
- Create: `app/features/products/service.py`
- Create: `app/features/products/router.py`

- [ ] **Step 1: Implement search_products, get_by_id, get_brands, get_categories**

Use `ILIKE` for text search on name and brand. Filter by category, brand.

- [ ] **Step 2: Implement search_for_routine_step** — specialized search for the routine builder: filter by category, exclude allergen ingredients, price limit.

- [ ] **Step 3: Create router with 4 public endpoints** — GET /products, /products/{id}, /products/brands, /products/categories

---

### Task 3: Seed products script

**Files:**
- Create: `scripts/seed_products.py`

- [ ] **Step 1: Write seed script** that reads `product_database.csv`, parses each row, and inserts into products table. Handle:
- Parse `inci_list` string like `{Salicylic Acid, ...}` into Python list for `key_ingredients`
- Parse `concerns` string like `{acne, excess sebum, ...}` into Python list
- Parse `suitable_for` and `formulation` as JSON
- Use sync SQLAlchemy connection (psycopg2) for simplicity
- Skip duplicates by name+brand
- Print summary

---

### Task 4: Routine constants

**Files:**
- Create: `app/features/routine/__init__.py`
- Create: `app/features/routine/constants.py`

- [ ] **Step 1: Copy all constants from JAY_Routine_Architecture.md** — ROUTINE_TYPES (6 types), STEP_CATEGORIES (15 categories), CONFLICT_RULES (avoid + caution + synergy), SKIN_TYPE_RULES (5 skin types), APPLICATION_ORDER (AM + PM)

---

### Task 5: Routine models

**Files:**
- Create: `app/features/routine/models.py`

- [ ] **Step 1: Create all 4 models** — Routine (with unique active constraint per user+period), RoutineStep (with FK to routine + product), RoutineCompletion (with unique per step+date), RoutineGeneration (JSONB snapshots)

---

### Task 6: Routine schemas

**Files:**
- Create: `app/features/routine/schemas.py`

- [ ] **Step 1: Create all input schemas** — CreateRoutineRequest, AddStepRequest, UpdateStepRequest, ReorderStepsRequest, CompleteStepRequest, GenerateRoutineRequest, ValidateRoutineRequest

- [ ] **Step 2: Create all output schemas** — StepOut, RoutineOut, RoutineOverview, CompletionStatusOut, TodayStatusOut, StatsOut, ConflictOut, ValidationResultOut, GeneratedRoutineOut

---

### Task 7: Routine validator

**Files:**
- Create: `app/features/routine/validator.py`

- [ ] **Step 1: Implement validate_routine()** — checks ingredient conflicts (AVOID pairs, CAUTION pairs), application order, period rules (no retinol AM, no SPF PM), missing essentials

- [ ] **Step 2: Implement check_product_conflicts()** — pairwise ingredient checking against CONFLICT_RULES

- [ ] **Step 3: Implement get_correct_order() and suggest_missing_steps()**

---

### Task 8: Routine service

**Files:**
- Create: `app/features/routine/service.py`

- [ ] **Step 1: Implement CRUD** — get_active_routines, create_routine (deactivates old), add_step (auto-fill from constants), update_step, remove_step, reorder_steps, replace_all_steps, deactivate_routine

- [ ] **Step 2: Implement daily tracking** — complete_step (upsert), complete_all_steps, get_today_status, get_stats (adherence + streak)

- [ ] **Step 3: Implement utility** — calculate_monthly_cost, check_routine_conflicts

---

### Task 9: AI routine generator

**Files:**
- Create: `app/features/routine/prompts.py`
- Create: `app/features/routine/generator.py`

- [ ] **Step 1: Create ROUTINE_GENERATION_PROMPT** from architecture doc with all placeholders

- [ ] **Step 2: Implement generate_routine()** — loads profile, determines type, queries products per slot, builds prompt, calls Gemini generate() (not stream), parses JSON response, validates, saves to routine_generations

---

### Task 10: Routine router

**Files:**
- Create: `app/features/routine/router.py`

- [ ] **Step 1: Register all endpoints** — types (public), CRUD (auth), tracking (auth), AI generation (auth), validation (auth), product search (auth), utility (auth). Total: 20+ endpoints.

---

### Task 11: Register routers + migrate + seed

**Files:**
- Modify: `app/main.py` — add products_router and routine_router
- Modify: `alembic/env.py` — add Product, Routine, RoutineStep, RoutineCompletion, RoutineGeneration imports

- [ ] **Step 1: Add router includes in main.py**
- [ ] **Step 2: Add model imports in alembic/env.py**
- [ ] **Step 3: Run alembic revision --autogenerate + upgrade head**
- [ ] **Step 4: Run seed_products.py**

---

### Task 12: End-to-end verification

- [ ] **Step 1: Run all 20 test checks from JAY_Phase3_Routine.md** — health, profile, products search, brands, routine types, create AM routine, add steps, get active, today status, complete step, skip step, check status, complete all, validate conflicts, stats, fill profile, generate with JAY, product search for routine, monthly cost, check conflicts

---
