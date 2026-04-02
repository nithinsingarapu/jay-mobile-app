# Flexible Sessions + Custom Routine Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded AM/PM model with flexible user-defined sessions (Morning, Afternoon, Evening, Night, or custom), and build a complete manual routine builder so users can add steps, products, timings, and instructions from scratch.

**Architecture:** Backend changes widen the `period` field from `Literal["am","pm"]` to a free string, replace the `{am, pm}` response with a flat list of all active routines, and add a `description` column. Frontend replaces the AM/PM toggle with a horizontal scrollable session list derived from the user's actual routines, and the "Start empty" flow navigates to the edit screen with the AddStepSheet for manual building.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React Native + Expo + Zustand (frontend), @gorhom/bottom-sheet

---

## File Map

### Backend (jay-backend/)
| File | Action | Responsibility |
|------|--------|----------------|
| `app/features/routine/models.py:23` | Modify | Widen `period` column from `String(5)` to `String(30)` |
| `app/features/routine/models.py:35` | Modify | Update unique index comment |
| `app/features/routine/schemas.py:9-12` | Modify | `CreateRoutineRequest` — period becomes `str`, add `description` field |
| `app/features/routine/schemas.py:47-48` | Modify | `GenerateRoutineRequest` — period becomes `str` |
| `app/features/routine/schemas.py:56-58` | Modify | `ValidateRoutineRequest` — period becomes `str` |
| `app/features/routine/schemas.py:82-98` | Modify | `RoutineOut` — add `description`; replace `RoutineOverview` with list response |
| `app/features/routine/service.py:24-38` | Modify | `get_active_routines` — return flat list, not am/pm dict |
| `app/features/routine/service.py:41-58` | Modify | `create_routine` — accept description, flexible period |
| `app/features/routine/router.py:84-97` | Modify | GET/POST root endpoints — new response shape |

### Frontend (jay-app/)
| File | Action | Responsibility |
|------|--------|----------------|
| `types/routine.ts` | Modify | Replace `RoutineOverview` with list; add `description` to `RoutineOut` |
| `services/routine.ts` | Modify | `getActive()` returns `RoutineOut[]` |
| `stores/routineStore.ts` | Modify | Replace `activeAmRoutine/activePmRoutine` with `routines: RoutineOut[]`, derive by period |
| `app/(screens)/routine.tsx` | Modify | Replace AM/PM toggle with scrollable session tabs from actual routines |
| `app/(screens)/routine.tsx` | Modify | "Start empty" flow → create routine then navigate to edit screen |
| `app/(screens)/routine-detail.tsx` | Modify | Look up routine from flat list |
| `app/(screens)/routine-edit.tsx` | Modify | Look up routine from flat list |
| `app/(tabs)/index.tsx` | Modify | Update home screen references to new store shape |
| `components/routine/sheets/CreateRoutineSheet.tsx` | Modify | Add custom session name input |

### DB Migration
| File | Action | Responsibility |
|------|--------|----------------|
| `alembic/versions/xxx_flexible_period.py` | Create | ALTER COLUMN period from varchar(5) to varchar(30), add description column |

---

## Tasks

### Task 1: Backend — Widen period column + add description

**Files:**
- Modify: `jay-backend/app/features/routine/models.py:23,35`
- Modify: `jay-backend/app/features/routine/schemas.py:9-12,47-48,56-58,82-98`

- [ ] **Step 1: Update the Routine model**

In `models.py`, change line 23:
```python
# FROM:
period: Mapped[str] = mapped_column(String(5), nullable=False)  # 'am' or 'pm'
# TO:
period: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. 'morning', 'afternoon', 'evening', 'night'
```

Add description column after `name` (line 23):
```python
description: Mapped[str | None] = mapped_column(Text, nullable=True)
```

Add `Text` to the SQLAlchemy imports at line 4 if not already there.

- [ ] **Step 2: Update Pydantic schemas**

In `schemas.py`:

`CreateRoutineRequest` (lines 9-12):
```python
class CreateRoutineRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    period: str = "morning"   # free string: morning, afternoon, evening, night, custom
    routine_type: Literal["essential", "complete", "glass_skin", "barrier_repair", "anti_acne", "custom"]
```

`GenerateRoutineRequest` (line 48):
```python
period: str = "both"   # free string or "both"
```

`ValidateRoutineRequest` (line 58):
```python
period: str
```

`RoutineOut` — add description (after line 84):
```python
class RoutineOut(BaseModel):
    id: UUID
    name: str | None = None
    description: str | None = None
    period: str
    routine_type: str
    is_active: bool
    total_monthly_cost: float | None = None
    steps: list[StepOut] = []
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
```

Replace `RoutineOverview` (lines 96-98) — **keep the class but deprecate, add new list alias**:
```python
class RoutineOverview(BaseModel):
    """Deprecated — use list[RoutineOut] from GET /routine instead."""
    am: RoutineOut | None = None
    pm: RoutineOut | None = None
```

- [ ] **Step 3: Commit backend schema changes**

```bash
git add jay-backend/app/features/routine/models.py jay-backend/app/features/routine/schemas.py
git commit -m "feat(routine): widen period to flexible string, add description field"
```

---

### Task 2: Backend — Update service + router for flat list response

**Files:**
- Modify: `jay-backend/app/features/routine/service.py:24-38,41-58`
- Modify: `jay-backend/app/features/routine/router.py:84-97`

- [ ] **Step 1: Update `get_active_routines` to return flat list**

In `service.py`, replace the function (lines 24-38):
```python
async def get_active_routines(user: CurrentUser, db: AsyncSession) -> list[RoutineOut]:
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.steps).selectinload(RoutineStep.product))
        .where(Routine.user_id == user.id, Routine.is_active == True)
        .order_by(Routine.created_at)
    )
    routines = result.scalars().all()
    return [_routine_to_out(r) for r in routines]
```

Update `_routine_to_out` helper to include `description`:
Find the function and add `description=routine.description,` to the RoutineOut constructor.

- [ ] **Step 2: Update `create_routine` to accept description**

In `service.py`, update `create_routine` (lines 41-58):
```python
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
```

- [ ] **Step 3: Update router endpoints**

In `router.py`, update GET root (lines 84-86):
```python
@router.get("", response_model=list[RoutineOut])
async def get_active_routines(user: AuthenticatedUser, db: DbSession):
    return await service.get_active_routines(user, db)
```

Update POST root to include description in response (lines 89-97):
```python
@router.post("", response_model=RoutineOut, status_code=201)
async def create_routine(data: CreateRoutineRequest, user: AuthenticatedUser, db: DbSession):
    routine = await service.create_routine(user, data, db)
    return RoutineOut(
        id=routine.id, name=routine.name, description=routine.description,
        period=routine.period, routine_type=routine.routine_type,
        is_active=routine.is_active, total_monthly_cost=None, steps=[],
        created_at=routine.created_at, updated_at=routine.updated_at,
    )
```

Also update imports in `schemas.py` import list at the top of router.py — remove `RoutineOverview`.

- [ ] **Step 4: Commit**

```bash
git add jay-backend/app/features/routine/service.py jay-backend/app/features/routine/router.py
git commit -m "feat(routine): return flat list from GET /routine, support flexible periods"
```

---

### Task 3: Database migration

**Files:**
- Create: Alembic migration

- [ ] **Step 1: Generate migration**

```bash
cd jay-backend
alembic revision --autogenerate -m "widen routine period and add description"
```

If alembic is not set up, run the ALTER directly via Supabase SQL editor:
```sql
ALTER TABLE routines ALTER COLUMN period TYPE varchar(30);
ALTER TABLE routines ADD COLUMN IF NOT EXISTS description text;
```

- [ ] **Step 2: Apply migration**

```bash
alembic upgrade head
```

Or apply SQL directly if using Supabase dashboard.

- [ ] **Step 3: Verify**

```bash
curl http://localhost:8000/api/v1/routine/types
# Should still return routine types

# Test creating with new period:
curl -X POST http://localhost:8000/api/v1/routine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Afternoon Touch-up","period":"afternoon","routine_type":"custom"}'
# Should return 201 with the new routine
```

---

### Task 4: Frontend — Update types and service layer

**Files:**
- Modify: `jay-app/types/routine.ts`
- Modify: `jay-app/services/routine.ts`

- [ ] **Step 1: Update RoutineOut type**

In `types/routine.ts`, update `RoutineOut`:
```typescript
export interface RoutineOut {
  id: string;
  name: string | null;
  description: string | null;
  period: string;            // was 'am' | 'pm', now free string
  routine_type: string;
  is_active: boolean;
  total_monthly_cost: number | null;
  steps: StepOut[];
  created_at: string;
  updated_at: string;
}
```

Replace `RoutineOverview`:
```typescript
// Deprecated — backend now returns RoutineOut[]
export interface RoutineOverview {
  am: RoutineOut | null;
  pm: RoutineOut | null;
}
```

Update `CreateRoutineRequest`:
```typescript
export interface CreateRoutineRequest {
  name: string;
  description?: string;
  period: string;             // was 'am' | 'pm', now free string
  routine_type: string;
}
```

- [ ] **Step 2: Update service `getActive()` return type**

In `services/routine.ts`:
```typescript
getActive: () =>
  apiFetch<RoutineOut[]>('/api/v1/routine'),
```

- [ ] **Step 3: Commit**

```bash
git add jay-app/types/routine.ts jay-app/services/routine.ts
git commit -m "feat(routine): update types for flexible sessions"
```

---

### Task 5: Frontend — Rebuild store for N routines

**Files:**
- Modify: `jay-app/stores/routineStore.ts`

- [ ] **Step 1: Replace AM/PM fields with routines array**

Replace the store state and `init`:
```typescript
interface RoutineState {
  routines: RoutineOut[];          // all active routines
  todayStatuses: Record<string, TodayStatus>;  // keyed by routine id
  isLoading: boolean;
  
  // Current selection
  selectedRoutineId: string | null;
  activeSegment: 'today' | 'routines' | 'stats';
  
  // Stats + cost + conflicts
  stats: StatsOut | null;
  streak: { current_streak: number; longest_streak: number };
  costBreakdown: CostOut | null;
  conflicts: ConflictOut[];
  
  // AI generation
  generatedRoutine: GeneratedRoutineOut | null;
  isGenerating: boolean;
  
  // Per-operation loading
  completingStepId: string | null;
  completingAll: boolean;
  
  // Actions
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  completeStep: (routineId: string, stepId: string) => Promise<void>;
  skipStep: (routineId: string, stepId: string, reason: string) => Promise<void>;
  completeAllSteps: (routineId: string) => Promise<void>;
  createRoutine: (data: CreateRoutineRequest) => Promise<RoutineOut>;
  deleteRoutine: (routineId: string) => Promise<void>;
  addStep: (routineId: string, step: AddStepRequest) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  reorderSteps: (routineId: string, stepIds: string[]) => Promise<void>;
  generateRoutine: (params: GenerateRequest) => Promise<GeneratedRoutineOut | null>;
  saveGeneratedRoutine: () => Promise<boolean>;
  loadStats: (period?: number) => Promise<void>;
  loadCost: () => Promise<void>;
  loadConflicts: () => Promise<void>;
  setActiveSegment: (seg: 'today' | 'routines' | 'stats') => void;
  setSelectedRoutineId: (id: string | null) => void;
}
```

Key changes in `init`:
```typescript
init: async () => {
  set({ isLoading: true });
  try {
    const [routines, streak] = await Promise.all([
      routineService.getActive(),
      routineService.getStreak(),
    ]);
    
    // Auto-select first routine if none selected
    const currentSelected = get().selectedRoutineId;
    const validSelection = routines.find(r => r.id === currentSelected);
    const selectedId = validSelection ? currentSelected : routines[0]?.id || null;
    
    set({ routines, streak, selectedRoutineId: selectedId });
    
    // Load today status for all routines
    const statuses: Record<string, TodayStatus> = {};
    await Promise.all(
      routines.map(async r => {
        const s = await routineService.getTodayStatus(r.id);
        statuses[r.id] = s;
      })
    );
    set({ todayStatuses: statuses });
  } catch (e) {
    console.error('[Routine] Init:', e);
  }
  set({ isLoading: false });
},
```

Optimistic `completeStep` changes to use `todayStatuses[routineId]` instead of am/pm.

- [ ] **Step 2: Add derived selectors**

The store should expose a way to get the "current routine" from selectedRoutineId:
```typescript
// In the component, derive:
const currentRoutine = store.routines.find(r => r.id === store.selectedRoutineId) ?? null;
const todayStatus = store.selectedRoutineId ? store.todayStatuses[store.selectedRoutineId] : null;
```

- [ ] **Step 3: Commit**

```bash
git add jay-app/stores/routineStore.ts
git commit -m "feat(routine): store supports N routines instead of am/pm"
```

---

### Task 6: Frontend — Rebuild main routine screen with session tabs

**Files:**
- Modify: `jay-app/app/(screens)/routine.tsx`

- [ ] **Step 1: Replace AM/PM toggle with horizontal session scroll**

Replace the PeriodToggle component with a scrollable session list:
```typescript
// Sessions derived from routines
const sessions = store.routines;

// Horizontal scroll of session pills
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionScroll}>
  {sessions.map(routine => {
    const isActive = routine.id === store.selectedRoutineId;
    return (
      <Pressable
        key={routine.id}
        onPress={() => store.setSelectedRoutineId(routine.id)}
        style={[styles.sessionPill, isActive && { backgroundColor: colors.systemBlue }]}
      >
        <Text style={[styles.sessionPillText, isActive && { color: '#FFF' }]}>
          {routine.name || routine.period}
        </Text>
      </Pressable>
    );
  })}
</ScrollView>
```

- [ ] **Step 2: Update Today segment to use selectedRoutineId**

Replace all `selectedPeriod` / `activeAmRoutine` / `activePmRoutine` references:
```typescript
const currentRoutine = store.routines.find(r => r.id === store.selectedRoutineId);
const todayStatus = store.selectedRoutineId ? store.todayStatuses[store.selectedRoutineId] : null;
```

- [ ] **Step 3: Update "Start empty" flow**

When `onRoutineCreated` receives `buildMethod === 'scratch'`:
```typescript
// Create the routine, then navigate to edit screen to add steps
const routine = await store.createRoutine({
  name: data.routineTypeName,
  description: `${data.routineTypeName} routine`,
  period: data.sessionName || 'morning',
  routine_type: data.routineType,
});
router.push({
  pathname: '/(screens)/routine-edit',
  params: { routineId: routine.id },
});
```

- [ ] **Step 4: Commit**

```bash
git add jay-app/app/(screens)/routine.tsx
git commit -m "feat(routine): replace AM/PM toggle with dynamic session tabs"
```

---

### Task 7: Frontend — Update CreateRoutineSheet with session name

**Files:**
- Modify: `jay-app/components/routine/sheets/CreateRoutineSheet.tsx`

- [ ] **Step 1: Add session name selection**

Replace the period AM/PM selection with session presets + custom input:

```typescript
// Preset sessions
const SESSION_PRESETS = [
  { value: 'morning', label: 'Morning', emoji: '🌅', desc: 'Wake-up routine' },
  { value: 'afternoon', label: 'Afternoon', emoji: '☀️', desc: 'Midday touch-up (sunscreen reapply, etc.)' },
  { value: 'evening', label: 'Evening', emoji: '🌆', desc: 'After-work wind-down' },
  { value: 'night', label: 'Night', emoji: '🌙', desc: 'Before-bed routine' },
];

// State
const [sessionName, setSessionName] = useState('morning');
const [customSession, setCustomSession] = useState('');
```

UI: show 4 preset session cards + a "Custom session" text input below.

Update `onCreated` data shape to include `sessionName`:
```typescript
export interface CreateRoutineData {
  routineType: string;
  routineTypeName: string;
  buildMethod: BuildMethod;
  sessionName: string;         // NEW
}
```

- [ ] **Step 2: Commit**

```bash
git add jay-app/components/routine/sheets/CreateRoutineSheet.tsx
git commit -m "feat(routine): session name picker with presets + custom"
```

---

### Task 8: Frontend — Fix detail + edit screens for flat list

**Files:**
- Modify: `jay-app/app/(screens)/routine-detail.tsx`
- Modify: `jay-app/app/(screens)/routine-edit.tsx`

- [ ] **Step 1: Update routine lookup in detail screen**

```typescript
const { routines, deleteRoutine } = useRoutineStore();
const routine = routines.find(r => r.id === routineId);
```

- [ ] **Step 2: Update routine lookup in edit screen**

Same pattern — replace `activeAmRoutine/activePmRoutine` lookup with `routines.find()`.

- [ ] **Step 3: Commit**

```bash
git add jay-app/app/(screens)/routine-detail.tsx jay-app/app/(screens)/routine-edit.tsx
git commit -m "fix(routine): detail and edit screens use flat routines list"
```

---

### Task 9: Frontend — Fix home screen references

**Files:**
- Modify: `jay-app/app/(tabs)/index.tsx`

- [ ] **Step 1: Update home screen to use new store shape**

```typescript
const routineStore = useRoutineStore();

const routineSteps = useMemo(() => {
  // Find the routine matching the selected period (AM → morning, PM → evening for compat)
  const periodMap: Record<string, string[]> = { 'AM': ['morning', 'am'], 'PM': ['evening', 'pm', 'night'] };
  const routine = routineStore.routines.find(r => periodMap[period]?.includes(r.period));
  const todayStatus = routine ? routineStore.todayStatuses[routine.id] : null;
  if (!routine?.steps?.length) return [];
  return routine.steps.map((step, i) => {
    const ss = todayStatus?.steps?.find(s => s.step_id === step.id);
    return {
      id: step.id,
      step: step.step_order ?? i + 1,
      category: step.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      product: step.product_name || step.custom_product_name || '',
      brand: step.product_brand || step.custom_product_name || step.product_name || '',
      instruction: step.instruction || '',
      completed: ss?.completed ?? false,
    };
  });
}, [period, routineStore.routines, routineStore.todayStatuses]);
```

- [ ] **Step 2: Commit**

```bash
git add jay-app/app/(tabs)/index.tsx
git commit -m "fix(home): update routine carousel for flexible sessions"
```

---

### Task 10: End-to-end verification

- [ ] **Step 1: Restart backend**

```bash
cd jay-backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- [ ] **Step 2: Test new period values via curl**

```bash
# Create a "night" routine
curl -X POST http://localhost:8000/api/v1/routine \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Night Recovery","description":"Before bed skin repair","period":"night","routine_type":"barrier_repair"}'

# GET all active routines — should return array with morning + night
curl http://localhost:8000/api/v1/routine -H "Authorization: Bearer <token>"
```

- [ ] **Step 3: Test frontend**

```bash
cd jay-app && npx expo start -c
```

Verify:
1. Session tabs show all user's routines (not just AM/PM)
2. Tapping + → Create sheet shows session presets (Morning/Afternoon/Evening/Night/Custom)
3. "Start empty" → creates routine → navigates to edit screen → AddStepSheet works
4. "Build with JAY" → generates routine for chosen type
5. My Routines shows all routines
6. Completing steps works for any session

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(routine): flexible sessions + custom routine builder — complete"
```
