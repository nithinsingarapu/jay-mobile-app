# JAY — Routine Section: React Native Build Prompt

> **Attach these files:**
> 1. `JAY_Routine_v2.html` — Open in browser. This is the EXACT pixel-level reference for every screen, interaction, and layout. Match it precisely.
> 2. `JAY_Routine_Architecture.md` — Backend API endpoints, schemas, data structures, conflict rules, routine types.
> 3. `frontend_structure.md` — Existing app structure, tech stack, design tokens, component patterns.

---

```
I need you to build the complete Routine section for my React Native app. I've attached JAY_Routine_v2.html — open it in a browser and use it as the EXACT visual reference. Every screen, every interaction, every spacing must match.

The backend API is already running. The existing app shell is already built with auth, profile, chat. You're adding the routine section into the existing structure.

READ ALL 3 ATTACHED FILES BEFORE WRITING ANY CODE.

---

## EXISTING CODEBASE (do NOT modify these)

Tech stack (already installed):
- React Native 0.83.4 + Expo 55 + Expo Router (file-based)
- TypeScript 5.9.2
- Zustand 5 (state management)
- NativeWind 4.2.3 + StyleSheet (styling)
- React Native Reanimated 4 (animations)
- react-native-gesture-handler 2.30 (gestures)
- expo-haptics (haptic feedback)
- @gorhom/bottom-sheet (bottom sheets)
- Supabase JS 2.100 (auth)

Existing files you'll interact with:
- app/(tabs)/_layout.tsx — Tab bar (5 tabs, add Routine if not present)
- app/(screens)/routine.tsx — Currently exists, needs full rebuild
- stores/routineStore.ts — Currently exists, needs expansion
- services/routine.ts — Currently exists, needs expansion
- lib/api.ts — apiFetch(path, {method, body}) with auto auth headers
- constants/colors.ts — Apple dark mode color tokens (USE THESE)

Design tokens from colors.ts (already defined):
```typescript
export const Colors = {
  bg: '#000000',
  bg2: '#1C1C1E',
  bg3: '#2C2C2E',
  bg4: '#3A3A3C',
  labelPrimary: '#FFFFFF',
  labelSecondary: 'rgba(235, 235, 245, 0.6)',
  labelTertiary: 'rgba(235, 235, 245, 0.3)',
  labelQuaternary: 'rgba(235, 235, 245, 0.18)',
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemOrange: '#FF9F0A',
  systemRed: '#FF453A',
  systemIndigo: '#5E5CE6',
  systemPurple: '#BF5AF2',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  fillPrimary: 'rgba(120, 120, 128, 0.36)',
  fillTertiary: 'rgba(120, 120, 128, 0.24)',
  fillQuaternary: 'rgba(120, 120, 128, 0.18)',
  separator: 'rgba(84, 84, 88, 0.65)',
};
```

---

## BACKEND API (all running, all tested)

Base URL from env: EXPO_PUBLIC_API_URL
All endpoints require Authorization: Bearer <supabase_jwt> except /routine/types.

```
TYPES:
GET  /api/v1/routine/types                              → { [type_id]: { name, description, template, who_its_for } }

CRUD:
GET  /api/v1/routine                                    → { am: RoutineOut | null, pm: RoutineOut | null }
POST /api/v1/routine                                    → Create { name, description, period, routine_type }
PUT  /api/v1/routine/{id}/steps                         → Replace all steps [AddStepRequest]
POST /api/v1/routine/{id}/steps                         → Add one step
PUT  /api/v1/routine/{id}/steps/{step_id}               → Update step
DELETE /api/v1/routine/{id}/steps/{step_id}             → Remove step
POST /api/v1/routine/{id}/reorder                       → { step_ids: [ordered UUIDs] }
DELETE /api/v1/routine/{id}                             → Deactivate

AI GENERATION:
POST /api/v1/routine/generate                           → Build with JAY
     Body: { period, routine_type, goals?, additional_instructions? }
     Response: { routine_type, period, name, description, total_monthly_cost, steps[], reasoning, tips, conflicts_checked }
POST /api/v1/routine/validate                           → { steps[], period } → { valid, conflicts[], order_issues, suggestions }

TRACKING:
POST /api/v1/routine/{id}/complete                      → { step_id, skipped?, skip_reason? }
POST /api/v1/routine/{id}/complete-all                  → Mark all done
GET  /api/v1/routine/{id}/today                         → { total_steps, completed_steps, skipped_steps, remaining_steps, completion_percentage, steps[] }

STATS:
GET  /api/v1/routine/stats?period=7                     → { period_days, adherence_percentage, current_streak, longest_streak, completed_count, skipped_count, missed_count }
GET  /api/v1/routine/streak                             → { current_streak, longest_streak }
GET  /api/v1/routine/cost                               → { total_monthly_cost, products[] }
GET  /api/v1/routine/conflicts                          → [{ ingredient_a, ingredient_b, severity, reason, solution }]

PRODUCTS:
GET  /api/v1/routine/products/search?category=&budget=  → ProductOut[]
```

RoutineOut shape:
```json
{
  "id": "uuid",
  "name": "My Morning Basics",
  "description": "The essentials to start every day right.",
  "period": "am",
  "routine_type": "essential",
  "is_active": true,
  "total_monthly_cost": 1896.0,
  "steps": [{
    "id": "uuid",
    "step_order": 1,
    "category": "cleanser",
    "product_id": 42,
    "product_name": "CeraVe Foaming Cleanser",
    "product_brand": "CeraVe",
    "product_price": 599.0,
    "instruction": "Massage 60s on damp skin",
    "wait_time_seconds": null,
    "frequency": "daily",
    "frequency_days": null,
    "is_essential": true,
    "notes": null,
    "why_this_product": "Sulfate-free, ceramides for combo skin barrier"
  }],
  "created_at": "2026-03-28T...",
  "updated_at": "2026-03-28T..."
}
```

---

## WHAT TO BUILD

### 1. Zustand Store — stores/routineStore.ts

Expand the existing store to handle multiple routines:

```typescript
interface RoutineState {
  // All routines (active + saved)
  routines: RoutineOut[];
  activeAmRoutine: RoutineOut | null;
  activePmRoutine: RoutineOut | null;
  isLoading: boolean;

  // Today's tracking
  todayStatusAm: TodayStatus | null;
  todayStatusPm: TodayStatus | null;

  // Stats
  stats: StatsOut | null;
  streak: { current_streak: number; longest_streak: number } | null;
  costBreakdown: CostOut | null;

  // AI generation
  generatedRoutine: GeneratedRoutineOut | null;
  isGenerating: boolean;

  // Current view state
  activeSegment: 'today' | 'routines' | 'stats';
  selectedRoutineId: string | null;

  // Actions
  loadAllRoutines: () => Promise<void>;
  loadTodayStatus: (routineId: string) => Promise<void>;
  completeStep: (routineId: string, stepId: string) => Promise<void>;
  skipStep: (routineId: string, stepId: string, reason: string) => Promise<void>;
  completeAllSteps: (routineId: string) => Promise<void>;
  createRoutine: (data: CreateRoutineRequest) => Promise<RoutineOut>;
  updateRoutine: (routineId: string, data: UpdateRoutineRequest) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  setActiveRoutine: (routineId: string) => Promise<void>;
  addStep: (routineId: string, step: AddStepRequest) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  reorderSteps: (routineId: string, stepIds: string[]) => Promise<void>;
  generateRoutine: (params: GenerateRequest) => Promise<void>;
  saveGeneratedRoutine: (generated: GeneratedRoutineOut) => Promise<void>;
  loadStats: (period: number) => Promise<void>;
  loadCost: () => Promise<void>;
  setActiveSegment: (seg: 'today' | 'routines' | 'stats') => void;
}
```

The store must:
- Fetch ALL routines (both active and inactive) on load
- Separate active AM/PM from saved routines
- Optimistic UI on step completion (update local state immediately, then sync)
- Track loading states per-operation (not a single global isLoading)
- Pull-to-refresh support

### 2. Service Layer — services/routine.ts

Expand to cover all endpoints:

```typescript
// CRUD
export const getRoutines = () => apiFetch('/api/v1/routine');
export const getRoutineTypes = () => apiFetch('/api/v1/routine/types');
export const createRoutine = (data: CreateRoutineRequest) => apiFetch('/api/v1/routine', { method: 'POST', body: data });
export const deleteRoutine = (id: string) => apiFetch(`/api/v1/routine/${id}`, { method: 'DELETE' });

// Steps
export const addStep = (routineId: string, data: AddStepRequest) => apiFetch(`/api/v1/routine/${routineId}/steps`, { method: 'POST', body: data });
export const updateStep = (routineId: string, stepId: string, data: any) => apiFetch(`/api/v1/routine/${routineId}/steps/${stepId}`, { method: 'PUT', body: data });
export const removeStep = (routineId: string, stepId: string) => apiFetch(`/api/v1/routine/${routineId}/steps/${stepId}`, { method: 'DELETE' });
export const reorderSteps = (routineId: string, stepIds: string[]) => apiFetch(`/api/v1/routine/${routineId}/reorder`, { method: 'POST', body: { step_ids: stepIds } });
export const replaceAllSteps = (routineId: string, steps: any[]) => apiFetch(`/api/v1/routine/${routineId}/steps`, { method: 'PUT', body: steps });

// Tracking
export const completeStep = (routineId: string, stepId: string, skipped = false, skipReason?: string) => apiFetch(`/api/v1/routine/${routineId}/complete`, { method: 'POST', body: { step_id: stepId, skipped, skip_reason: skipReason } });
export const completeAllSteps = (routineId: string) => apiFetch(`/api/v1/routine/${routineId}/complete-all`, { method: 'POST' });
export const getTodayStatus = (routineId: string) => apiFetch(`/api/v1/routine/${routineId}/today`);

// Stats
export const getStats = (period: number) => apiFetch(`/api/v1/routine/stats?period=${period}`);
export const getStreak = () => apiFetch('/api/v1/routine/streak');
export const getCost = () => apiFetch('/api/v1/routine/cost');
export const getConflicts = () => apiFetch('/api/v1/routine/conflicts');

// AI
export const generateRoutine = (data: GenerateRequest) => apiFetch('/api/v1/routine/generate', { method: 'POST', body: data });
export const validateRoutine = (data: any) => apiFetch('/api/v1/routine/validate', { method: 'POST', body: data });

// Product search
export const searchProducts = (category: string, budget?: number) => apiFetch(`/api/v1/routine/products/search?category=${category}${budget ? `&budget=${budget}` : ''}`);
```

### 3. TypeScript Types — types/routine.ts

```typescript
interface RoutineOut {
  id: string;
  name: string | null;
  description: string | null;
  period: 'am' | 'pm';
  routine_type: string;
  is_active: boolean;
  total_monthly_cost: number | null;
  steps: StepOut[];
  created_at: string;
  updated_at: string;
}

interface StepOut {
  id: string;
  step_order: number;
  category: string;
  product_id: number | null;
  product_name: string | null;
  product_brand: string | null;
  product_price: number | null;
  instruction: string | null;
  wait_time_seconds: number | null;
  frequency: string;
  frequency_days: string[] | null;
  is_essential: boolean;
  notes: string | null;
  why_this_product: string | null;
}

interface TodayStatus {
  routine_id: string;
  period: string;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  remaining_steps: number;
  completion_percentage: number;
  steps: TodayStepStatus[];
}

interface TodayStepStatus {
  step_id: string;
  step_category: string;
  product_name: string | null;
  completed: boolean;
  skipped: boolean;
  completed_at: string | null;
}

interface CreateRoutineRequest {
  name: string;
  description?: string;
  period: 'am' | 'pm';
  routine_type: string;
}

interface AddStepRequest {
  category: string;
  product_id?: number;
  custom_product_name?: string;
  instruction?: string;
  wait_time_seconds?: number;
  frequency?: string;
  frequency_days?: string[];
  is_essential?: boolean;
  notes?: string;
}

interface GenerateRequest {
  period: 'am' | 'pm' | 'both';
  routine_type: string;
  goals?: string[];
  additional_instructions?: string;
}

interface StatsOut {
  period_days: number;
  total_routines_possible: number;
  completed_count: number;
  skipped_count: number;
  missed_count: number;
  adherence_percentage: number;
  current_streak: number;
  longest_streak: number;
}

interface CostOut {
  total_monthly_cost: number;
  products: { name: string; category: string; price: number; period: string }[];
}

interface ConflictOut {
  ingredient_a: string;
  ingredient_b: string;
  severity: 'avoid' | 'caution';
  reason: string;
  solution: string;
}
```

### 4. File Structure — create all of these

```
components/routine/
├── RoutineHeader.tsx               # Large title "Routine" + plus button
├── SegmentedControl.tsx            # Today / My Routines / Stats (reusable)
├── ActiveRoutineIndicator.tsx      # Green dot + "Active: Name · AM"
├── StreakAdherenceRow.tsx          # Two metric widgets side by side (streak + adherence %)
├── DayDots.tsx                     # 7-day completion dots with labels
├── ProgressRing.tsx                # Animated SVG ring with count label
├── StepRow.tsx                     # Step with checkbox, name, product, price, wait time, frequency
├── StepCheckbox.tsx                # Animated circular checkbox (empty/done/skipped)
├── CompleteAllButton.tsx           # "Complete All Steps" → "All Steps Complete ✓"
├── ConflictNotice.tsx              # Orange left-border warning card
├── MonthlyCostPill.tsx             # Cost + "View breakdown →"
├── RoutineCard.tsx                 # Card in My Routines list (name, desc, badge, meta, tint)
├── RoutineDetailHeader.tsx         # Pushed view: status badge + description
├── RoutineDetailSteps.tsx          # Numbered steps in grouped table with "why this product"
├── RoutineDetailInfo.tsx           # Grouped table: type, period, cost, conflicts, created
├── RoutineDetailActions.tsx        # Set Active / Edit / Duplicate / Share / Delete buttons
├── EditRoutineForm.tsx             # Name + description inputs + settings
├── EditStepRow.tsx                 # Drag handle + name/product + delete button
├── StatsHero.tsx                   # Giant streak number
├── StatsPeriodToggle.tsx           # 7d / 30d / 90d pills
├── WeeklyBarChart.tsx              # 7-bar weekly completion chart
├── StatCards.tsx                   # 2x2 grid: adherence, streak, longest, skipped
├── CostBreakdown.tsx               # Product list + total
├── DupeSavingsTip.tsx              # Lightning bolt + savings message
├── ProductSearchRow.tsx            # Product in search results within Add Step
│
├── sheets/
│   ├── CreateRoutineSheet.tsx      # Bottom sheet: name, description, period, build method
│   ├── AddStepSheet.tsx            # Bottom sheet: category, product, frequency, wait time, notes
│   └── SkipReasonSheet.tsx         # Bottom sheet: 5 skip reasons + cancel

screens/
├── RoutineScreen.tsx               # Main screen with 3 segments (Today/My Routines/Stats)
├── RoutineDetailScreen.tsx         # Pushed: full routine view
├── EditRoutineScreen.tsx           # Pushed: edit name, desc, settings, steps
├── BuildWithJayScreen.tsx          # Pushed: AI generation loading → result → save

stores/
└── routineStore.ts                 # (expand existing)

services/
└── routine.ts                      # (expand existing)

types/
└── routine.ts                      # All routine types
```

### 5. Screen: RoutineScreen.tsx (main)

This is app/(screens)/routine.tsx — replace what's there.

Structure:
```
ScrollView (pull to refresh)
├── RoutineHeader (large title + plus button)
├── SegmentedControl (Today / My Routines / Stats)
│
├── [if Today selected]
│   ├── ActiveRoutineIndicator → tapping navigates to My Routines
│   ├── StreakAdherenceRow (two metric widgets)
│   ├── DayDots (7 dots)
│   ├── ProgressRing (animated, centered)
│   ├── Steps card (Widget background)
│   │   └── FlatList of StepRow (each with StepCheckbox)
│   ├── CompleteAllButton
│   ├── ConflictNotice (conditional)
│   └── MonthlyCostPill
│
├── [if My Routines selected]
│   ├── SectionHeader "Active routines"
│   ├── RoutineCard (AM active) → tap pushes to RoutineDetailScreen
│   ├── RoutineCard (PM active) → tap pushes to RoutineDetailScreen
│   ├── SectionHeader "Saved routines"
│   ├── RoutineCard (saved 1)
│   ├── RoutineCard (saved 2)
│   └── RoutineCard (saved N)
│
├── [if Stats selected]
│   ├── StatsHero (giant streak number)
│   ├── StatsPeriodToggle (7d/30d/90d)
│   ├── WeeklyBarChart
│   ├── StatCards (2x2 grid)
│   ├── SectionHeader "Monthly cost breakdown"
│   ├── CostBreakdown (grouped table)
│   ├── Cost total row
│   └── DupeSavingsTip
│
└── Sheets (rendered at bottom, controlled by store)
    ├── CreateRoutineSheet
    ├── AddStepSheet
    └── SkipReasonSheet
```

### 6. Navigation

Register these in app/(screens)/_layout.tsx:

```typescript
<Stack.Screen name="routine" options={{ headerShown: false }} />
<Stack.Screen name="routine-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
<Stack.Screen name="routine-edit" options={{ headerShown: false, presentation: 'card' }} />
<Stack.Screen name="build-with-jay" options={{ headerShown: false, presentation: 'card' }} />
```

Push navigation pattern:
- Tapping a RoutineCard → router.push('routine-detail', { routineId })
- Tapping Edit → router.push('routine-edit', { routineId })
- Tapping "Build with JAY" in create sheet → router.push('build-with-jay', { name, description, period })
- Back button on pushed views → router.back()

Tab bar visibility:
- Pushed views: tab bar hides (set tabBarStyle display:none via layout context)
- Root routine screen + sheets: tab bar visible

---

## COMPONENT SPECIFICATIONS (match HTML mockup exactly)

### StepCheckbox
- 24px circle, 2px border in Colors.bg4
- Tap: spring animation (scale 1 → 1.15 → 1), background → Colors.systemGreen, border → Colors.systemGreen, white checkmark SVG appears
- Haptic: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) on complete
- Long press (500ms): opens SkipReasonSheet instead of completing

### ProgressRing
- 110px SVG, 7px stroke, circumference = 289
- Track: Colors.bg3, Progress: Colors.systemBlue
- Animate stroke-dashoffset with Reanimated useSharedValue + withTiming(500ms, easeOut)
- When 100%: stroke color transitions to Colors.systemGreen
- Center: count (32px, weight 700) + "STEPS" label (11px, uppercase)

### RoutineCard
- Background: Colors.bg2, border-radius 14
- Active routines: 1.5px border Colors.systemGreen
- Colored blur tint: absolute positioned View, 120px, borderRadius 60, filter blur (use opacity 0.08 + large border-radius as fallback since RN blur on views is limited)
- Content: name (17px, weight 600), description (13px, secondary, 2 lines max), meta row (steps · type · cost)
- Press: Animated.spring scale 0.98

### CreateRoutineSheet (@gorhom/bottom-sheet)
- snapPoints: ['88%']
- Fields: name (TextInput), description (TextInput multiline), period (grouped selection), build method (3 options)
- Period selection: grouped table rows, tapping one highlights blue + checkmark, deselects others
- Build methods: "Build with JAY" (blue icon), "Use a template" (indigo icon), "Build from scratch" (grey icon)
- "Create Routine" button at bottom

### AddStepSheet
- snapPoints: ['90%']
- Category selection: 11 categories in grouped table (Serum, Cleanser, Toner, Moisturizer, Sunscreen, Treatment, Eye cream, Face oil, Exfoliant, Mask, Essence)
- Product: TextInput with search (calls GET /routine/products/search?category={selected})
- Frequency: 6 options in grouped table (Daily, Every other day, 2x/week, 3x/week, Weekly, As needed)
- Wait time: TextInput, optional
- Notes: TextInput multiline, optional
- "Add to Routine" button

### SkipReasonSheet
- snapPoints: ['45%']
- 5 reasons as grouped table rows
- Tapping a reason: calls completeStep with skipped=true and skip_reason, closes sheet
- Cancel button (red destructive style)

### ConflictNotice
- Only shown when today's scheduled steps have known conflicts
- Left border 2.5px Colors.systemOrange
- Background Colors.bg2, border-radius 0 10 10 0
- Title: 11px, uppercase, orange
- Message: 13px, secondary color

### StreakAdherenceRow
- Two widgets side by side (grid 1fr 1fr, gap 10)
- Streak widget: subtle orange gradient tint, number (36px, 800 weight, orange), "Day streak" label, "Best: N"
- Adherence widget: subtle green gradient tint, percentage (36px, 800 weight, green), "Adherence" label, "This week"

### DayDots
- 7 items in a row, space-between
- Each: dot (7px circle) + day label (10px, 500 weight, tertiary)
- Dot states: filled green (complete), grey (partial), hollow with blue border (today), dark grey (no data)

### WeeklyBarChart
- 7 bars in a row, 80px height
- Bar states: blue (100%), grey (partial), dark (empty)
- Day labels below each bar

### CostBreakdown
- Grouped table: product name (15px), role + period (12px, secondary), price (15px, 700 weight) on right
- Total row: bold separator (1px), "Total monthly" + large price (20px, 700 weight)

---

## ANIMATIONS (Reanimated)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Checkbox complete | Scale spring 1→1.15→1 + bg color | 250ms | spring(damping:12) |
| Progress ring fill | stroke-dashoffset | 500ms | Easing.out(Easing.cubic) |
| Ring color (blue→green) | stroke interpolation | 300ms | ease |
| Step complete time appear | fadeIn + translateY(4→0) | 200ms | ease-out |
| Complete All button text | crossfade text + color | 200ms | ease |
| Segment switch content | opacity 0→1 | 200ms | ease |
| Card press | scale(0.98) | 150ms | spring |
| Sheet open | @gorhom default spring | — | — |
| Stat cards stagger | fadeIn + translateY(12→0) per card | 300ms, 40ms stagger | ease-out |
| Bar chart grow | height 0→final per bar | 400ms, 50ms stagger | ease-out |

---

## CRITICAL RULES

1. Match JAY_Routine_v2.html EXACTLY — open in browser side by side
2. Use Colors from constants/colors.ts — no hardcoded color values
3. Apple dark mode: backgrounds #000/#1C1C1E/#2C2C2E, separators 0.33px rgba(84,84,88,0.65)
4. SF Pro font via system font stack (already inherited from app root)
5. Apple text styles: 34px/700 large title, 17px/600 headline, 17px/400 body, 15px/400 subheadline, 13px/400 footnote, 11px/400 caption
6. Grouped table views: bg2 background, 10px radius, 44px min row height, 0.33px separator inset 16px from left
7. All touch targets minimum 44px
8. Haptic feedback on checkbox tap (Light), on complete all (Success)
9. Pull-to-refresh on main screen reloads routines + today status + stats
10. Step completion is optimistic — update UI immediately, sync in background
11. The "description" field is included in both CreateRoutineRequest and the edit form
12. Routine names and descriptions show on RoutineCard in the My Routines list
13. "Why this product" italic text shows on steps in RoutineDetailScreen
14. Back buttons show parent screen name ("Routine", "Cancel", etc.)
15. Tab bar hides when pushed views are active (slide down animation)
16. @gorhom/bottom-sheet for all three sheets (create, add step, skip reason)
17. Sheet handle: 36×5px, rounded, centered, Colors.bg4
18. No git commands
19. Create all files via tool use

---

## TESTING

After building, verify all of these:

1. Routine screen loads with Today segment showing active routine steps
2. Tapping checkbox completes step (green fill + checkmark + timestamp + ring updates)
3. Long-pressing checkbox opens Skip Reason sheet
4. Selecting a skip reason calls API and marks step as skipped
5. "Complete All Steps" button marks all pending steps, updates ring to full, turns green, changes button text
6. Switching to "My Routines" shows active + saved routines with descriptions
7. Tapping a routine card pushes to detail screen (tab bar hides)
8. Detail screen shows numbered steps with "why this product" italic text
9. Detail screen "Edit" pushes to edit screen with name + description + steps
10. Edit screen description field is pre-filled and editable
11. "Add Step" in edit opens the Add Step sheet with all 11 categories
12. Selecting category + frequency in Add Step sheet works (blue highlight + checkmark)
13. Tapping plus button on main screen opens Create Routine sheet
14. Create sheet has name, description, period selection, and 3 build methods
15. "Build with JAY" navigates to generation screen
16. Stats segment shows streak hero, weekly chart, stat cards, cost breakdown
17. Period toggle (7d/30d/90d) reloads stats
18. Cost breakdown lists all products with total
19. Pull-to-refresh works on main screen
20. Back navigation works on all pushed views (back to routine, tab bar reappears)
21. Progress ring animates smoothly with Reanimated
22. Day dots reflect last 7 days of data
23. Conflict notice appears conditionally
24. Streak and adherence widgets show correct data with colored tints
25. Routine card active state has green border, saved state has no border
```
