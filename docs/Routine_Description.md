# JAY — Routine Section: Complete Documentation

> Last updated: 2026-04-03

---

## Overview

The Routine section is JAY's core feature — a complete skincare routine management system that lets users create, track, and optimize their daily skincare routines. It supports flexible sessions (Morning, Afternoon, Evening, Night, or custom), AI-powered routine generation, daily step tracking with optimistic UI, streak analytics, ingredient conflict detection, and monthly cost tracking.

---

## Architecture

```
Frontend (React Native + Expo)          Backend (FastAPI + PostgreSQL)
┌──────────────────────┐                ┌──────────────────────────┐
│  Routine Screen      │───API──────────│  Router (router.py)      │
│  (3 segments)        │                │    ├── CRUD endpoints    │
├──────────────────────┤                │    ├── Tracking          │
│  Detail Screen       │                │    ├── Stats             │
├──────────────────────┤                │    └── AI Generation     │
│  Edit Screen         │                ├──────────────────────────┤
├──────────────────────┤                │  Service (service.py)    │
│  Build-with-JAY      │                │    ├── Business logic    │
├──────────────────────┤                │    ├── Cost calculation  │
│  Bottom Sheets       │                │    └── Streak tracking   │
│  (Create/Add/Skip)   │                ├──────────────────────────┤
├──────────────────────┤                │  Generator (generator.py)│
│  Zustand Store       │                │    └── Gemini AI calls   │
│  (routineStore.ts)   │                ├──────────────────────────┤
└──────────────────────┘                │  Validator (validator.py)│
                                        │    └── Conflict rules    │
                                        ├──────────────────────────┤
                                        │  Models (SQLAlchemy)     │
                                        │    ├── Routine           │
                                        │    ├── RoutineStep       │
                                        │    ├── RoutineCompletion │
                                        │    └── RoutineGeneration │
                                        └──────────────────────────┘
```

---

## Screens

### 1. Main Routine Screen (`routine.tsx`)

The central hub with three segmented tabs:

**Today Tab**
- Session tabs (horizontal pills) — switches between user's routines
- Active routine indicator (green dot + name + period)
- Streak + Adherence row (two side-by-side metric cards)
- Day dots (7-day completion history)
- Progress ring (animated SVG circle showing completed/total steps)
- Step list — each step has:
  - Checkbox (tap to complete, long-press to skip)
  - Category name + product name + instruction
  - Wait time chip + frequency chip (if non-daily)
  - Completion timestamp (when done)
- "Complete All Steps" button
- Conflict notice (orange left-border card if ingredient conflicts detected)
- Monthly cost pill

**My Routines Tab**
- Section header "Your routines"
- RoutineCard for each active routine:
  - Period badge (top-right)
  - Name, description, metadata (steps, type, cost/mo)
  - Green border if active
  - Tap → navigates to Detail screen

**Stats Tab**
- Streak hero (large number + "day streak")
- Period toggle (7 / 30 / 90 days)
- Weekly bar chart (7 bars, animated on mount)
- Stat cards (2x2 grid: adherence %, streak, longest, skipped)
- Monthly cost breakdown (grouped table with product list + total)

### 2. Routine Detail Screen (`routine-detail.tsx`)

Read-only view of a single routine:
- Header: back button, routine name (28px), description, active/saved badge with metadata
- Steps section: numbered list with category, product, "why this product" (italic), instruction
- Details section: type, period, cost, created date
- Actions section: Edit Routine, Delete Routine (with confirmation alert)

### 3. Routine Edit Screen (`routine-edit.tsx`)

Modify routine steps:
- Name and description text inputs
- Steps list with step number, category, product name, delete button (red trash icon with confirmation)
- "Add Step" button → opens AddStepSheet
- "Delete Routine" in danger zone section

### 4. Build-with-JAY Screen (`build-with-jay.tsx`)

AI-powered routine generation:
- **Generating state:** Pulsing orb animation, progress steps ("Reading profile" → "Searching products" → "Checking conflicts")
- **Result state:** Routine name, reasoning card, AM/PM step groups (category badge, product, price, instruction, "why this product"), tips, total cost, Save + Regenerate buttons
- **Error state:** Error icon + retry button

---

## Bottom Sheets

### CreateRoutineSheet (3-Step Wizard)

| Step | Content | User Action |
|------|---------|-------------|
| 1. Session | 4 presets (Morning/Afternoon/Evening/Night) + custom input | Pick when |
| 2. Type | 6 routine types with emoji, description, max steps, template preview | Pick what kind |
| 3. Build | Build with JAY / Use template / Start empty | Pick how |

Progress dots at top. Next/Back navigation. Final action button changes label based on build method.

### AddStepSheet

| Section | Content |
|---------|---------|
| Category | 11 categories in grouped table (single-select with checkmark) |
| Product | Search input → filtered product results from DB (brand, name, price) + custom name fallback |
| Frequency | 6 options: Daily, Every other day, 2x/week, 3x/week, Weekly, As needed |
| Wait time | Numeric input (seconds, optional) |
| Notes | Multiline text (optional) |
| Action | "Add to Routine" button → calls API |

### SkipReasonSheet

5 predefined reasons:
- Ran out of product
- Skin felt irritated
- Running late
- Product not available
- Just skipping today

Cancel button at bottom. Tapping a reason marks the step as skipped with that reason.

---

## State Management (Zustand Store)

### State Shape

```typescript
{
  routines: RoutineOut[]                        // All active routines
  todayStatuses: Record<string, TodayStatus>    // Daily tracking per routine ID
  isLoading: boolean
  stats: StatsOut | null                        // Period-based analytics
  streak: { current_streak, longest_streak }
  costBreakdown: CostOut | null                 // Monthly cost by product
  conflicts: ConflictOut[]                      // Active ingredient conflicts
  generatedRoutine: GeneratedRoutineOut | null   // AI-generated draft
  isGenerating: boolean
  activeSegment: 'today' | 'routines' | 'stats'
  selectedRoutineId: string | null              // Currently viewed routine
  completingStepId: string | null               // Step being completed (for UI)
  completingAll: boolean                        // "Complete All" in progress
}
```

### Key Actions

| Action | What it does |
|--------|-------------|
| `init()` | Loads routines + streak + today status for all routines (parallel) |
| `completeStep(routineId, stepId)` | Optimistic UI update → API call → revert on error |
| `skipStep(routineId, stepId, reason)` | Marks step as skipped with reason |
| `completeAllSteps(routineId)` | Completes all remaining steps at once |
| `createRoutine(data)` | Creates routine → reloads state |
| `deleteRoutine(routineId)` | Deactivates routine → reloads state |
| `addStep(routineId, step)` | Adds step → reloads state |
| `removeStep(routineId, stepId)` | Removes step → reloads state |
| `generateRoutine(params)` | Calls AI generation → stores draft |
| `saveGeneratedRoutine()` | Creates AM/PM routines from draft + adds steps |
| `loadStats(period)` | Loads adherence analytics for N days |
| `loadCost()` | Loads monthly cost breakdown |
| `loadConflicts()` | Loads ingredient conflict warnings |

### Optimistic Updates

Step completion follows this pattern:
1. Immediately update `todayStatuses[routineId]` with new completed/remaining counts
2. Fire API call in background
3. On success: refresh with server response
4. On error: revert by re-fetching today status

---

## API Endpoints

### CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/routine` | List all active routines (returns `RoutineOut[]`) |
| POST | `/api/v1/routine` | Create routine `{ name, description, period, routine_type }` |
| DELETE | `/api/v1/routine/{id}` | Deactivate routine (soft delete) |

### Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/routine/{id}/steps` | Add single step |
| PUT | `/api/v1/routine/{id}/steps` | Replace all steps |
| PUT | `/api/v1/routine/{id}/steps/{stepId}` | Update step fields |
| DELETE | `/api/v1/routine/{id}/steps/{stepId}` | Remove step (auto-reorders remaining) |
| POST | `/api/v1/routine/{id}/reorder` | Reorder steps `{ step_ids: [] }` |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/routine/{id}/complete` | Complete/skip step `{ step_id, skipped, skip_reason }` |
| POST | `/api/v1/routine/{id}/complete-all` | Complete all remaining steps |
| GET | `/api/v1/routine/{id}/today` | Today's completion status with per-step breakdown |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/routine/stats?period=7` | Adherence %, completed/skipped/missed counts, streaks |
| GET | `/api/v1/routine/streak` | Current and longest streak |
| GET | `/api/v1/routine/cost` | Monthly cost with product-level breakdown |
| GET | `/api/v1/routine/conflicts` | Ingredient conflicts across active routines |

### AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/routine/generate` | AI-generate routine `{ period, routine_type, goals, instructions }` |
| POST | `/api/v1/routine/validate` | Validate step order + conflicts `{ steps, period }` |
| GET | `/api/v1/routine/types` | Available routine templates (no auth required) |
| GET | `/api/v1/routine/products/search` | Search products by category + budget |

---

## Data Models

### Routine

```
id              UUID (PK)
user_id         String(36) — indexed
name            String(100)
description     Text
period          String(30) — flexible: morning, afternoon, evening, night, custom
routine_type    String(30) — essential, complete, glass_skin, barrier_repair, anti_acne, custom
is_active       Boolean (default true)
total_monthly_cost  Numeric(10,2) — auto-calculated from step products
created_at      DateTime (UTC)
updated_at      DateTime (UTC)

Index: UNIQUE(user_id, period) WHERE is_active = true
```

### RoutineStep

```
id                  UUID (PK)
routine_id          UUID (FK → routines, cascade delete)
step_order          Integer — position in routine
category            String(30) — cleanser, serum, moisturizer, etc.
product_id          Integer (FK → products, optional)
custom_product_name String(255) — fallback if no DB product
instruction         Text — e.g. "Massage 60s on damp skin"
wait_time_seconds   Integer — time to wait before next step
frequency           String(30) — daily, every_other_day, 2x_week, etc.
frequency_days      String[] — specific days (optional)
is_essential        Boolean — whether step is required
notes               Text
why_this_product    Text — AI-generated explanation

Constraint: UNIQUE(routine_id, step_order)
```

### RoutineCompletion

```
id              UUID (PK)
user_id         String(36)
routine_id      UUID (FK → routines)
step_id         UUID (FK → routine_steps)
completion_date Date — today's date
completed_at    DateTime (UTC)
skipped         Boolean
skip_reason     String(100) — ran_out, skin_irritated, no_time, etc.

Constraint: UNIQUE(step_id, completion_date)
Index: (user_id, completion_date)
```

---

## Routine Types (Templates)

| Type | Complexity | AM Steps | PM Steps | For Whom |
|------|-----------|----------|----------|----------|
| **Essential** | Minimal | cleanser, moisturizer, sunscreen | cleanser, moisturizer | Beginners, minimalists |
| **Complete** | Moderate | cleanser, toner, serum, moisturizer, sunscreen | cleanser, toner, treatment, moisturizer | Intermediate users |
| **Glass Skin** | Elaborate | oil cleanser → sunscreen (8 steps) | oil cleanser → sleeping mask (10 steps) | K-beauty enthusiasts |
| **Barrier Repair** | Minimal | gentle cleanser, barrier moisturizer, sunscreen | gentle cleanser, barrier serum, barrier moisturizer | Damaged barrier recovery |
| **Anti-Acne** | Moderate | gentle cleanser, niacinamide, oil-free moisturizer, sunscreen | gentle cleanser, BHA, oil-free moisturizer | Active acne |
| **Custom** | Any | User-defined | User-defined | Experienced users |

---

## Conflict Detection Rules

### Avoid (Never combine)
- Retinol + Benzoyl Peroxide
- Retinol + Vitamin C (in same routine)
- Retinol + AHA/BHA
- Vitamin C + Benzoyl Peroxide
- AHA + BHA (at same time)

### Caution
- Niacinamide + Low pH acids (reduced effectiveness)
- Vitamin C + AHA (increased irritation)

### Synergies (Recommended together)
- Vitamin C + Vitamin E (enhanced antioxidant)
- Vitamin C + Ferulic Acid (photoprotection boost)
- Niacinamide + Hyaluronic Acid (hydration)
- Retinol + Niacinamide (tolerability)
- Retinol + Ceramides (barrier support)

---

## Application Order Rules

### AM (Morning)
1. Cleanser
2. Toner
3. Essence
4. Serum (water-based)
5. Eye cream
6. Moisturizer
7. Sunscreen (MUST be last)

### PM (Evening)
1. Oil cleanser (1st cleanse)
2. Water cleanser (2nd cleanse)
3. Toner
4. Essence
5. Serum / Treatment
6. Eye cream
7. Moisturizer
8. Face oil / Sleeping mask (MUST be last)

### Period-Specific Rules
- Sunscreen: AM only
- Retinol: PM only (photosensitizing)
- Exfoliants: PM only, max 2-3x/week
- Oil cleansers: PM only (makeup removal)

---

## AI Generation Pipeline

```
User taps "Build with JAY"
  │
  ├── Load user profile (skin type, allergies, concerns, budget)
  ├── Map routine_type ("auto" → infer from profile)
  │
  ├── For each period (AM/PM):
  │   ├── Get template steps for routine_type
  │   ├── Query 5 products per category (respecting allergies, budget)
  │   ├── Build prompt with:
  │   │   ├── User's skin profile
  │   │   ├── Available products with ingredients
  │   │   ├── Conflict rules
  │   │   ├── Application order rules
  │   │   └── Skin type preferences
  │   ├── Call Gemini API → parse JSON response
  │   └── Return steps with product recommendations + reasoning
  │
  ├── Check conflicts in generated routine
  ├── Calculate total monthly cost
  └── Return GeneratedRoutineOut to frontend
```

---

## Component Library (31 components)

### Interactive Components
| Component | Purpose |
|-----------|---------|
| SegmentedControl | 3-tab switcher (Today/My Routines/Stats) |
| ProgressRing | Animated SVG circle (completed/total) |
| StepCheckbox | 24px circle (empty/green check/orange dash) with spring animation |
| StepRow | Step display with checkbox, category, product, chips |
| CompleteAllButton | Full-width button with haptic feedback |
| RoutineHeader | "Routine" title + plus button |
| ActiveRoutineIndicator | Green dot + routine name badge |

### Data Display
| Component | Purpose |
|-----------|---------|
| StreakAdherenceRow | Two metric cards (streak + adherence %) |
| DayDots | 7-day completion dots |
| ConflictNotice | Orange left-border warning card |
| MonthlyCostPill | Compact cost display |
| RoutineCard | Routine summary card with press animation |

### Detail Screen
| Component | Purpose |
|-----------|---------|
| RoutineDetailHeader | Nav bar + name + description + badge |
| RoutineDetailSteps | Numbered step list with product info |
| RoutineDetailInfo | Metadata table (type, period, cost, date) |
| RoutineDetailActions | Action buttons (edit, delete) |

### Stats
| Component | Purpose |
|-----------|---------|
| StatsHero | Large streak number display |
| StatsPeriodToggle | 7/30/90 day pills |
| WeeklyBarChart | 7-bar animated chart |
| StatCards | 2x2 metric grid |
| CostBreakdown | Product cost table with total |

### Bottom Sheets
| Component | Purpose |
|-----------|---------|
| CreateRoutineSheet | 3-step wizard (session → type → build) |
| AddStepSheet | Category + product + frequency picker |
| SkipReasonSheet | 5 skip reason options |

---

## User Flows

### Flow 1: First-Time User Creates a Routine

```
1. User opens Routine screen → sees empty state "No routine for this session yet"
2. Taps + button → CreateRoutineSheet opens
3. Step 1: Picks "Morning" session → Next
4. Step 2: Picks "Essential" type (sees template preview: cleanser, moisturizer, sunscreen) → Next
5. Step 3: Picks "Build with JAY" → taps "Build with JAY"
6. Sheet closes → Build-with-JAY screen opens
7. Animated progress: "Reading profile..." → "Searching products..." → "Checking conflicts..."
8. Results appear: 3 AM steps with specific product recommendations
9. User reviews steps, reads "Why this product" explanations
10. Taps "Save Routine" → routine created with steps
11. Returns to Routine screen → Today tab shows the new routine
```

### Flow 2: Daily Routine Execution

```
1. User opens Routine screen → Today tab shows their Morning routine
2. Sees progress ring (0/3 STEPS), three uncompleted steps
3. Taps checkbox on "Cleanser" step → spring animation + haptic feedback
4. Step shows green check + completion timestamp
5. Progress ring animates to 1/3
6. Long-presses "Serum" step → SkipReasonSheet appears
7. Selects "Skin felt irritated" → step shows orange dash (skipped)
8. Taps "Complete All Steps" → remaining step marked done
9. Progress ring fills to 3/3, turns green
10. Button changes to "All Steps Complete ✓" (disabled)
11. Streak counter increments
```

### Flow 3: Manually Building a Custom Routine

```
1. User taps + → CreateRoutineSheet
2. Picks "Night" session → "Custom" type → "Start empty"
3. Empty routine created → Edit screen opens
4. Taps "Add Step" → AddStepSheet opens
5. Selects "Cleanser" category → product search shows results
6. Picks "CeraVe Foaming Cleanser" → frequency "Daily" → taps "Add to Routine"
7. Step appears in edit screen
8. Adds more steps: Toner, Serum, Moisturizer
9. Can delete steps with trash icon (confirmation alert)
10. Taps "Done" → returns to routine screen
```

### Flow 4: Viewing Routine Detail

```
1. User goes to "My Routines" tab → sees routine cards
2. Taps a card → Detail screen slides in (tab bar hides)
3. Sees full step list with products and "why this product" explanations
4. Sees metadata: type, period, cost, creation date
5. Can tap "Edit" → navigates to Edit screen
6. Can tap "Delete" → confirmation alert → routine deactivated
7. Back button returns to routine screen (tab bar reappears)
```

---

## File Structure

```
jay-app/
├── app/(screens)/
│   ├── routine.tsx                 # Main screen (3 segments)
│   ├── routine-detail.tsx          # Detail view
│   ├── routine-edit.tsx            # Edit view
│   └── build-with-jay.tsx          # AI generation
├── stores/
│   └── routineStore.ts             # Zustand state management
├── services/
│   └── routine.ts                  # API service layer
├── types/
│   └── routine.ts                  # TypeScript interfaces
└── components/routine/
    ├── SegmentedControl.tsx
    ├── ProgressRing.tsx
    ├── StepCheckbox.tsx
    ├── StepRow.tsx
    ├── CompleteAllButton.tsx
    ├── RoutineHeader.tsx
    ├── ActiveRoutineIndicator.tsx
    ├── StreakAdherenceRow.tsx
    ├── DayDots.tsx
    ├── ConflictNotice.tsx
    ├── MonthlyCostPill.tsx
    ├── RoutineCard.tsx
    ├── RoutineDetailHeader.tsx
    ├── RoutineDetailSteps.tsx
    ├── RoutineDetailInfo.tsx
    ├── RoutineDetailActions.tsx
    ├── StatsHero.tsx
    ├── StatsPeriodToggle.tsx
    ├── WeeklyBarChart.tsx
    ├── StatCards.tsx
    ├── CostBreakdown.tsx
    └── sheets/
        ├── CreateRoutineSheet.tsx
        ├── AddStepSheet.tsx
        └── SkipReasonSheet.tsx

jay-backend/app/features/routine/
├── models.py                       # SQLAlchemy models
├── schemas.py                      # Pydantic schemas
├── service.py                      # Business logic
├── router.py                       # FastAPI endpoints
├── constants.py                    # Templates, conflict rules, categories
├── generator.py                    # Gemini AI generation pipeline
└── validator.py                    # Conflict + order validation
```

---

## Known Limitations

1. **Name/Description editing** — UI exists but no PUT endpoint to save changes
2. **Step reordering** — Backend supports it, no drag-to-reorder UI
3. **Day dots** — Currently shows placeholder data, not real historical completions
4. **Weekly bar chart** — Uses static placeholder data
5. **Cost calculation** — Treats all steps as 1x monthly, doesn't factor frequency
6. **Streak logic** — Resets on ANY missed day, no grace period
7. **No offline support** — All operations require network
8. **Set as Active** — Button exists in detail screen but action not implemented
9. **MonthlyCostPill** — "View breakdown" not wired to navigation
