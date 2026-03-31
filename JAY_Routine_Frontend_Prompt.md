# JAY Routine — React Native Frontend Build Prompt

> **Attach these files:**
> 1. `JAY_Routine_Design.html` — Open in browser for pixel-level visual reference (6 screens)
> 2. `JAY_Routine_Architecture.md` — Backend API endpoints, schemas, data structures
> 3. `JAY_Documentation.md` — Design system tokens (if available)

---

```
I need you to build the complete Routine section for my React Native app. I've attached JAY_Routine_Design.html — open it in a browser to see the exact design for all 6 screens. Match it pixel by pixel.

The backend API is already built and running. You're building the frontend screens and connecting them to the API.

---

## DESIGN SYSTEM (match exactly — same as rest of the app)

Colors — strictly monochrome:
- Black: #000000
- Dark: #333333
- Mid: #666666
- Grey: #999999
- Light: #CCCCCC
- Border: #E5E5E5 (always 0.5px / StyleSheet.hairlineWidth)
- Surface: #F5F5F5
- White: #FFFFFF

Typography — Outfit font (already loaded):
- Body: 13px, weight 400
- Bold: weight 600
- Title: 22px, weight 600, letter-spacing -0.3
- Section label: 10px, weight 600, uppercase, letter-spacing 2px, color #999
- Micro: 9px, weight 600, uppercase, letter-spacing 1px

Borders: ALWAYS StyleSheet.hairlineWidth, color #E5E5E5. NO shadows.

---

## BACKEND API (already running)

All endpoints require Authorization: Bearer <supabase_jwt> except /routine/types.

```
ROUTINE TYPES:
GET  /api/v1/routine/types                              → { type_id: { name, description, template, max_steps, who_its_for } }

CRUD:
GET  /api/v1/routine                                    → { am: RoutineOut | null, pm: RoutineOut | null }
POST /api/v1/routine                                    → Create routine { period, routine_type, name? }
PUT  /api/v1/routine/{id}/steps                         → Replace all steps [AddStepRequest]
POST /api/v1/routine/{id}/steps                         → Add one step { category, product_id?, custom_product_name?, ... }
PUT  /api/v1/routine/{id}/steps/{step_id}               → Update step
DELETE /api/v1/routine/{id}/steps/{step_id}             → Remove step
POST /api/v1/routine/{id}/reorder                       → Reorder { step_ids: [ordered UUIDs] }
DELETE /api/v1/routine/{id}                             → Deactivate routine

AI GENERATION:
POST /api/v1/routine/generate                           → Build with JAY
     Body: { period: "am"|"pm"|"both", routine_type: "auto"|"essential"|..., goals?, additional_instructions? }
     Response: { routine_type, period, name, total_monthly_cost, steps: [{step_order, category, product_id, product_name, product_brand, product_price, instruction, wait_time_seconds, frequency, frequency_days, is_essential, why_this_product}], reasoning, tips, conflicts_checked }

POST /api/v1/routine/validate                           → Check conflicts
     Body: { steps: [...], period }
     Response: { valid, conflicts: [{ingredient_a, ingredient_b, severity, reason, solution}], order_issues, suggestions }

DAILY TRACKING:
POST /api/v1/routine/{id}/complete                      → Mark step done { step_id, skipped?, skip_reason? }
POST /api/v1/routine/{id}/complete-all                  → Mark all done
GET  /api/v1/routine/{id}/today                         → { total_steps, completed_steps, skipped_steps, remaining_steps, completion_percentage, steps: [{step_id, step_category, product_name, completed, skipped, completed_at}] }

STATS:
GET  /api/v1/routine/stats?period=7                     → { period_days, adherence_percentage, current_streak, longest_streak, completed_count, skipped_count, missed_count }
GET  /api/v1/routine/streak                             → { current_streak, longest_streak }

PRODUCT SEARCH:
GET  /api/v1/routine/products/search?category=serum&budget=1000  → [ProductOut]

UTILITY:
GET  /api/v1/routine/cost                               → { total_monthly_cost, products: [{name, category, price}] }
GET  /api/v1/routine/conflicts                          → [ConflictOut]
```

RoutineOut shape:
```json
{
  "id": "uuid",
  "name": "My morning basics",
  "period": "am",
  "routine_type": "complete",
  "is_active": true,
  "total_monthly_cost": 847.0,
  "steps": [
    {
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
      "why_this_product": "Sulfate-free, ceramides for barrier"
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

---

## SCREENS TO BUILD (6 total, match the HTML mockup exactly)

### SCREEN 1: Routine home — Today's tracker

This is the main routine screen. It has 3 tabs: Today, My Routine, Stats.

**Today tab (default view):**

Header:
- "My Routine" title (22px, weight 600)
- Edit button (pencil icon, 34px circle) — toggles edit mode
- Stats button (bar chart icon) — switches to Stats tab
- 3 tabs below: Today (active, black text, 1.5px black underline), My Routine, Stats

Period toggle:
- Pill-shaped toggle: "Morning" | "Night"
- Active pill: black background, white text
- Inactive: #F5F5F5 background, #999 text
- Switching loads that period's routine and today's completion status

Streak bar (only show if streak > 0):
- #F5F5F5 background, 12px border-radius
- Large streak number (22px, weight 700) on left
- "X day streak" title + encouraging subtitle
- Show this above the progress ring

7-day dots:
- Row of 7 dots, one per day (Mon-Sun)
- Filled black = all steps completed that day
- Half grey (#999) = some steps completed
- Hollow with 1.5px black border = today
- Day label below each dot (9px, uppercase, #CCC)
- Data: call GET /routine/stats?period=7 and map to dots

Progress ring:
- Centered, 100px SVG
- Background circle: #F5F5F5, 5px stroke
- Progress circle: #000, 5px stroke, stroke-dasharray animation
- Center text: "2/4" (28px, weight 700) + "Steps" (10px, #999, uppercase)
- Animate the progress circle when steps complete

Step list:
- FlatList of steps from GET /routine/{id}/today
- Each step row:
  - Circular checkbox (22px): empty border when pending, black filled with white checkmark when done, grey filled when skipped
  - Tap checkbox to mark complete (POST /routine/{id}/complete)
  - Long-press checkbox to show skip options (bottom sheet with skip reasons: "Ran out of product", "Running late", "Skin is irritated", "Custom reason")
  - Step category title (13px, weight 600): "Cleanser", "Serum — Vitamin C"
  - Product name (12px, #666): "CeraVe Foaming Cleanser"
  - Instruction (11px, #999): "Massage 60s on damp skin"
  - Wait time pill (if wait_time_seconds > 0): clock icon + "Wait 1-2 min", #F5F5F5 bg, pill shape
  - Frequency badge (top right, 9px, uppercase, #CCC): "Daily", "Mon Wed Fri", "2x week", "As needed"
  - Completed time (top right, replacing frequency): "7:32" in #000 when done

Conflict notice (conditional):
- Show if validator returns conflicts for today's steps based on frequency_days
- Left border 2.5px #999, #FAFAFA background
- Title: "Tonight's note" (11px, weight 600, uppercase, #999)
- Message: context-aware conflict advice

Bottom navigation:
- 5 tabs: Home, Discover, Routine (active), Ask JAY, Profile
- Active tab: black icon (opacity 1) + black label
- Inactive: opacity 0.2 + #CCC label

**My Routine tab:**
- Shows both AM and PM routines in full
- Each routine has all steps listed (not just today's schedule)
- Edit mode: drag to reorder (react-native-draggable-flatlist), swipe to delete
- "Add step" button at bottom of each routine (dashed border, + icon, "Add a step")
- Tapping a step opens the step detail / product swap bottom sheet

**Stats tab:**
- Built as a separate sub-screen within the same tab navigation
- Content described in Screen 6 below

### SCREEN 2: Night routine tracker

Same as Screen 1 but with "Night" period selected. Key differences:
- Steps include oil_cleanser, retinol (with frequency_days), face_oil
- Retinol step has highlighted background (#FAFAFA) on its scheduled days
- Frequency badges show specific days: "Mon Wed Fri"
- Conflict notice at bottom when relevant

This is NOT a separate screen — it's the same Today tab with the Night period toggle selected.

### SCREEN 3: Empty state — no routine

Shown when GET /routine returns { am: null, pm: null }.

Centered layout:
- 72px circle icon (#F5F5F5 bg, clock SVG in #999)
- "No routine yet" (20px, weight 600)
- Description (13px, #999, max-width 260px centered)
- Three option cards stacked vertically, 10px gap:

Card 1 — "Build with JAY" (most prominent):
- 42px icon circle: BLACK background, white lightning bolt SVG
- Title: "Build with JAY" (14px, weight 600)
- Subtitle: "AI creates a personalized routine from your profile, concerns, and budget" (11px, #999)
- Chevron right on the far right (#CCC)
- Tapping navigates to the "Build with JAY" flow

Card 2 — "Add current routine":
- 42px icon circle: #F5F5F5 bg, pencil icon #666
- Title + subtitle
- Tapping navigates to manual routine builder (create routine + add steps one by one)

Card 3 — "Choose a template":
- 42px icon circle: #F5F5F5 bg, grid icon #666
- Tapping navigates to the routine type selector (Screen 5)

### SCREEN 4: Build with JAY — AI result

After the user taps "Build with JAY" and the API returns:

Header:
- Back button (chevron left)
- "JAY's recommendation" title (17px, weight 600)

JAY message:
- 36px black circular JAY avatar with white "J"
- "Built for your {skin_type} skin" (14px, weight 600)
- "Targets {concerns} within {budget} budget" (12px, #999)

Three metric cards in a row:
- Each: #F5F5F5 bg, 10px border-radius, centered
- Values: ₹{total_monthly_cost} / {total_steps} steps / {conflicts_checked.length} conflicts
- Labels: "Monthly cost" / "Total steps" / "Conflicts" (9px, uppercase, #999)

AM section:
- Black dot + "Morning — X steps" label (12px, weight 600, uppercase, letter-spacing 2px)
- Steps numbered 1-N with black circles containing white numbers
- Each step: category title, product name + price, "why this product" in italic 10px #999
- Wait time pills where applicable
- Frequency badges for non-daily steps

PM section:
- Same layout, separated by a 0.5px border-top

Action buttons:
- "Save this routine" (black bg, white text, 12px border-radius, 14px padding)
  - Tapping: creates AM routine via POST /routine, replaces all steps via PUT /routine/{id}/steps, then creates PM routine, replaces its steps. Navigate to Today tab.
- "Regenerate" (0.5px border, no fill)
  - Tapping: calls POST /routine/generate again with same params
- Hint text: "Tap any step to swap the product" (11px, #CCC, centered)

Tapping a step:
- Opens a bottom sheet with product search
- Search bar: "Search {category} products..."
- Results from GET /routine/products/search?category={step.category}&budget={user_budget}
- Each result: product thumb, name, brand, price, key ingredients preview
- Tapping a result swaps the product in the generated routine (local state update, not saved yet)

### SCREEN 5: Routine type selector

Navigated to from "Choose a template" or as part of "Build with JAY" flow.

Header:
- Back button + "Choose a type" title

Description text:
- "Pick a routine structure. JAY will recommend the best type for your profile, or choose your own." (13px, #999)

Type cards stacked vertically:
- Each card: 0.5px border #E5E5E5, 14px border-radius, 16px padding
- Selected card: 1.5px black border
- Top row: type name (15px, weight 600) + badge
  - Badge: pill shape, 9px, weight 700, uppercase
  - "Recommended" badge: black bg, white text (on the type JAY recommends based on user's routine_complexity preference)
  - Step count badge: #F5F5F5 bg, #999 text (e.g., "3-4 steps", "7-10 steps")
- Description: 12px, #999, line-height 1.4
- Template chips: pill-shaped chips showing the step categories in the template (10px, #F5F5F5 bg, #666 text)

Determining the recommended type:
- Load user profile, check preferences.routine_complexity:
  - minimal_1_3 → Essential
  - moderate_4_5 → Complete
  - elaborate_6_plus → Glass Skin
  - whatever_works → Complete
- If user has high acne_level (>=3) → Anti-Acne gets recommended instead
- If user has high irritation_level (>=3) → Barrier Repair gets recommended

Continue button at bottom:
- "Continue with {selected_type}" (black bg, 14px padding, 12px border-radius)
- If coming from "Build with JAY": navigates to loading state, then AI result (Screen 4)
- If coming from "Choose a template": creates empty routine with that type, navigates to manual builder

### SCREEN 6: Stats + cost breakdown

Third tab in the routine home screen.

Streak hero:
- Giant number (52px, weight 700, centered) — current streak
- "Day streak" label below (10px, uppercase, #999)

Weekly bar chart:
- "This week" label
- 7 vertical bars (Mon-Sun)
- Bar height proportional to completion % that day
- Black bar: 100% complete, Grey (#999): partial, #E5E5E5: 0%
- Day labels below (9px, uppercase, #CCC)

Stat cards (2x2 grid, 8px gap):
- #F5F5F5 background, 12px border-radius, 14px padding
- Value: 28px, weight 700
- Label: 10px, uppercase, #999
- Cards: Adherence %, Current streak, Longest streak, Skipped days
- Data from GET /routine/stats?period=30

Cost breakdown:
- "Monthly cost breakdown" label
- List of products: name (13px, weight 500) + category role (11px, #999) on left, price (14px, weight 700) on right
- Each row separated by 0.5px #F5F5F5 border
- Total row at bottom: 1.5px black top border, "Total monthly" + total price (18px, weight 700)
- Data from GET /routine/cost

Dupe savings tip:
- #F5F5F5 background, 10px border-radius, lightning bolt icon
- "JAY found ₹X in savings with dupes. **View dupes**"
- Tapping navigates to dupe finder (future feature — just show the card for now)

---

## STATE MANAGEMENT

Zustand store for routine state:

```typescript
interface RoutineState {
  // Active routines
  amRoutine: RoutineOut | null;
  pmRoutine: RoutineOut | null;
  isLoadingRoutines: boolean;

  // Today's tracking
  amTodayStatus: TodayStatus | null;
  pmTodayStatus: TodayStatus | null;

  // Selected period
  activePeriod: 'am' | 'pm';

  // Stats
  stats: StatsOut | null;
  streak: { current_streak: number; longest_streak: number } | null;

  // AI generation
  generatedRoutine: GeneratedRoutineOut | null;
  isGenerating: boolean;

  // Cost
  costBreakdown: CostOut | null;

  // Active tab
  activeTab: 'today' | 'routine' | 'stats';

  // Edit mode
  isEditing: boolean;

  // Actions
  loadRoutines: () => Promise<void>;
  loadTodayStatus: (routineId: string) => Promise<void>;
  completeStep: (routineId: string, stepId: string, skipped?: boolean, skipReason?: string) => Promise<void>;
  completeAllSteps: (routineId: string) => Promise<void>;
  loadStats: (periodDays: number) => Promise<void>;
  generateRoutine: (params: GenerateRequest) => Promise<void>;
  saveGeneratedRoutine: () => Promise<void>;
  addStep: (routineId: string, step: AddStepRequest) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  reorderSteps: (routineId: string, stepIds: string[]) => Promise<void>;
  loadCost: () => Promise<void>;
  setActivePeriod: (period: 'am' | 'pm') => void;
  setActiveTab: (tab: 'today' | 'routine' | 'stats') => void;
}
```

---

## FILE STRUCTURE

```
components/routine/
├── RoutineHeader.tsx                # Title + edit/stats buttons + tab bar
├── PeriodToggle.tsx                 # AM/PM pill toggle
├── StreakBar.tsx                    # Streak count + message
├── DayDots.tsx                     # 7-day completion dots
├── ProgressRing.tsx                # SVG circular progress
├── StepRow.tsx                     # Single step with checkbox + product + instruction
├── StepCheckbox.tsx                # Circular checkbox (empty/done/skipped states)
├── WaitTimePill.tsx                # Clock icon + "Wait 1-2 min"
├── FrequencyBadge.tsx              # "Daily" / "Mon Wed Fri" / "2x week"
├── ConflictNotice.tsx              # Tonight's conflict warning
├── AddStepButton.tsx               # Dashed border "+ Add a step"
├── EmptyState.tsx                  # No routine — 3 option cards
├── OptionCard.tsx                  # Icon + title + subtitle + chevron
├── TypeSelector.tsx                # Routine type cards with selection
├── TypeCard.tsx                    # Single type card with badge + chips
├── GeneratingState.tsx             # Spinner + progress steps while AI works
├── GeneratedResult.tsx             # JAY's recommendation with metrics + steps
├── GeneratedStepRow.tsx            # Numbered step with "why this product"
├── MetricCard.tsx                  # Cost / steps / conflicts summary
├── StatsView.tsx                   # Streak hero + bar chart + stat cards + cost
├── WeeklyBarChart.tsx              # 7-bar weekly completion chart
├── StatCard.tsx                    # Single stat (value + label)
├── CostBreakdown.tsx               # Product-by-product cost list
├── DupeSavingsTip.tsx              # JAY found savings card
├── ProductSearchSheet.tsx          # Bottom sheet for swapping products
├── ProductSearchItem.tsx           # Single product in search results
├── SkipReasonSheet.tsx             # Bottom sheet with skip reason options

screens/
├── RoutineScreen.tsx               # Main screen with 3 tabs (Today/MyRoutine/Stats)
├── RoutineTypeScreen.tsx           # Type selector (navigated to separately)
├── BuildWithJayScreen.tsx          # Loading state → AI result → save/regenerate

stores/
└── routineStore.ts                 # Zustand store
```

---

## ANIMATIONS

Use react-native-reanimated:

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Checkbox fill (pending → done) | Scale 0→1 + bg color transition | 200ms | spring(damping:15) |
| Checkbox skip | Fade to grey | 150ms | ease |
| Progress ring stroke | stroke-dashoffset animates | 500ms | ease-out |
| Step row complete | Subtle opacity 1→0.6 | 200ms | ease |
| Period toggle switch | translateX + bg color | 200ms | ease |
| Streak bar appear | Fade in + slide down 8px | 300ms | ease-out |
| Generated routine appear | Staggered fade in per step (50ms delay each) | 200ms per | ease-out |
| Generating spinner | Rotate 360deg | 900ms | linear, infinite |
| Step reorder drag | Scale 1.02 + elevation shadow | immediate | spring |
| Conflict notice | Slide in from left | 250ms | ease-out |
| Tab underline | translateX to active tab | 200ms | ease |
| Bar chart bars | Height 0→final | 400ms | ease-out, staggered 50ms |
| Metric cards | Scale 0.95→1 + fade | 200ms | spring, staggered |

---

## CRITICAL IMPLEMENTATION DETAILS

1. **Checkbox tap = complete, long press = skip.** The tap handler calls POST /complete with skipped=false. Long press opens a bottom sheet with skip reasons. This is the core interaction — make it snappy (<100ms visual feedback).

2. **Progress ring must animate.** When a step is completed, the ring stroke-dashoffset should smoothly transition to the new percentage. Use Reanimated's useSharedValue + withTiming.

3. **Conflict notice is context-aware.** It's not always shown — only when today's scheduled steps have a known conflict. Check the step frequencies: if retinol is scheduled for today AND an AHA exfoliant is also in the routine, show the notice. This is local logic using the conflict rules, not a separate API call.

4. **"Build with JAY" has a loading state.** Between tapping "Build with JAY" and getting the result, show: a spinner (56px, 2.5px border, black top), "JAY is building your routine..." heading, and a progress checklist:
   - "Reading your profile" (done after 1s)
   - "Analyzing skin concerns" (done after 2s)
   - "Searching products" (done after 3s)
   - "Checking conflicts" (done after 4s)
   - "Finalizing routine" (active until API responds)
   These are fake progress indicators — the actual API call happens in parallel. When the response arrives, immediately transition to the result screen.

5. **Saving the generated routine creates real database entries.** "Save this routine" must:
   a. POST /routine { period: "am", routine_type } → get AM routine ID
   b. PUT /routine/{am_id}/steps → send all AM steps
   c. POST /routine { period: "pm", routine_type } → get PM routine ID
   d. PUT /routine/{pm_id}/steps → send all PM steps
   e. Navigate to Today tab

6. **Product swap bottom sheet.** When user taps a step in the generated result, open a bottom sheet:
   - Search bar at top: "Search {category}..."
   - Calls GET /routine/products/search?category={step.category}&budget={user_budget}
   - Results: product thumbnail placeholder, name (13px bold), brand (11px #999), price (14px bold), key ingredients (10px #CCC, truncated)
   - Tapping a product swaps it in local state (update the step's product_id, product_name, product_price, product_brand)
   - Cost recalculates locally
   - Nothing saved to DB yet — only on "Save this routine"

7. **Edit mode in My Routine tab.** Pencil icon toggles edit mode:
   - Steps become draggable (react-native-draggable-flatlist)
   - Red minus circle appears on left of each step (tap to delete)
   - "Add a step" button appears at the bottom
   - "Done" replaces "Edit" in header
   - On Done: save new order via POST /routine/{id}/reorder

8. **Stats period selector.** Default 30 days. Add a small toggle: 7d / 30d / 90d. Each change calls GET /routine/stats?period=X.

9. **Cost breakdown** shows the actual products with their roles. If a product is used in both AM and PM (same cleanser), show it once with "AM + PM" in the role. Data comes from GET /routine/cost.

10. **The type selector recommends one type.** Load user profile, check routine_complexity and skin state to determine which type gets the "Recommended" badge. Only one type can be recommended at a time.

---

## RULES

1. Match JAY_Routine_Design.html EXACTLY — open in browser and compare
2. All borders 0.5px (StyleSheet.hairlineWidth), color #E5E5E5
3. NO shadows — borders only
4. NO accent colors — black, white, grey only
5. Outfit font everywhere, Theater Bold Condensed for "J" avatar only
6. Period toggle uses animated pill (black slides left/right)
7. Steps are NOT inverted — they render in step_order, top to bottom
8. Checkbox interaction: tap=complete, long-press=skip (with bottom sheet)
9. Progress ring animates with Reanimated
10. Streak and day dots update immediately after completing a step (optimistic UI)
11. Generated routine is local state until "Save" is tapped
12. Edit mode uses react-native-draggable-flatlist for reorder
13. Bottom sheets use @gorhom/bottom-sheet (already in project)
14. KeyboardAvoidingView for the product search sheet
15. Pull-to-refresh on the Today tab reloads routine + today status

---

## TESTING

After building, verify all of these:

1. Empty state shows when no routine exists, with 3 option cards
2. "Build with JAY" shows loading state with progress checklist, then result
3. Generated result shows AM + PM steps with prices and "why this product"
4. Metric cards show correct cost, step count, and conflicts
5. "Save this routine" creates both AM and PM routines via API
6. Today tab shows with Morning selected by default
7. Tapping checkbox completes the step (black fill + checkmark + time shown)
8. Long-pressing checkbox opens skip reason bottom sheet
9. Progress ring updates after completing/skipping a step
10. Period toggle switches between AM and PM with animation
11. Streak bar shows current streak count
12. Day dots reflect the last 7 days of completion data
13. Conflict notice appears on nights when retinol + exfoliant both scheduled
14. Stats tab shows streak hero, weekly bar chart, stat cards, cost breakdown
15. Cost breakdown lists all products with prices and total
16. "Regenerate" calls the API again and replaces the generated routine
17. Tapping a generated step opens product search bottom sheet
18. Swapping a product updates the step locally and recalculates cost
19. Type selector highlights the recommended type based on profile
20. Edit mode enables drag-to-reorder and delete buttons
```
