# JAY Routine Section — Complete Rebuild Design Spec

> **Status:** Approved for implementation
> **Goal:** Rebuild the Routine section as a world-class skincare tracking experience inspired by Apple Health (progress/motivation) and Apple Reminders (organization/management).

---

## Architecture Overview

**3 tabs** (reduced from 4):
1. **Today** — Daily ring tracker (Apple Health Activity Ring as hero)
2. **Library** — Merged Explore + Learn (browse routines + education)
3. **My Routines** — Full routine management with per-routine stats

**Design principles:**
- Ring is THE focal point of Today — everything serves "close your ring"
- Steps rendered as Apple Reminders grouped tables (tight, clean, functional)
- Stats are compact pills, not big cards — they support, not dominate
- My Routines is a power user management panel — every action accessible
- Library is browsable and educational — Apple Fitness+ class library feel

---

## Tab 1: TODAY

### Layout (top to bottom)

1. **Header**: "Routine" title (34px bold) + "+" button (right)
2. **Segmented Control**: [Today] [Library] [My Routines]
3. **Session Pills** (if user has >1 routine): horizontal scroll of routine name pills
4. **Hero Ring**: 130px animated SVG ring, centered
   - Track: colors.systemGray5 (7px stroke)
   - Progress: colors.systemBlue (7px stroke, animates with withTiming 600ms)
   - At 100%: stroke transitions to colors.systemGreen
   - Center: "3/4" (28px bold) + "STEPS" (10px uppercase, secondaryLabel)
   - Below ring: completion percentage as text (e.g. "75% complete")
5. **Stat Pills Row**: horizontal, centered, gap 12
   - 🔥 {streak} day streak (pill, orange tint bg)
   - 📊 {adherence}% this week (pill, blue tint bg)
   - Compact: 28px height, 12px horizontal padding, 8px radius
6. **Steps Grouped Table**: Apple Reminders style
   - Table header: routine name + period badge (e.g. "Morning Basics · ☀️ AM")
   - Each row: 48px min height
     - Left: 22px checkbox circle (empty → green check → orange skip)
     - Middle: category name (15px semibold) + product name (13px secondary)
     - Right: completion time (13px green) or wait chip ("⏱ 1-2 min" blue pill) or frequency chip
   - 0.33px separator between rows (inset 50px from left)
   - Long press → skip reason sheet
   - Completed rows: green timestamp right-aligned, category text gets secondary opacity
7. **Complete All Button**: full width, 50px height
   - Default: "Complete All" (secondarySystemBackground bg, label text)
   - All done: "All Done ✓" (systemGreen bg, white text)
   - Haptic: success notification on complete
8. **Conflict Tip** (conditional): orange left-border card
   - "Tonight's note: It's your retinol night. Skip the AHA." style
9. **Monthly Cost** (conditional): "₹1,896/mo" tappable pill → opens cost breakdown

### Empty State (no routines)
- Centered: 🧴 emoji (48px) + "No routines yet" (22px semibold) + "Build your first skincare routine" (15px secondary) + "Create routine" button (systemBlue)

---

## Tab 2: LIBRARY

### Layout (top to bottom)

1. **Featured Routine Hero Card**: 180px min-height
   - Dark gradient bg (#1a2a3a → #0a1520)
   - "FEATURED ROUTINE" label (11px uppercase systemBlue)
   - Routine name (24px bold white)
   - Description (15px secondary, 2-line)
   - Tag pills (Trending, step count, skin types)
   - Tap → push to routine template detail screen
2. **Routine Category Sections** (6 sections):
   - Section header: title (20px bold) + "See All" (15px systemBlue)
   - Horizontal scroll of RoutineTypeCards (160px wide each):
     - Emoji (28px) + name (15px semibold) + description (12px, 2-line clamp)
     - Step count badge + difficulty badge
     - Tap → push to routine template detail screen
   - Categories: Core Routines, By Concern, Cultural, Trending, Life Stage, Body Zone
3. **Divider**: thin separator + "Learn" section label
4. **Application Order**: two side-by-side cards (AM blue header, PM indigo header)
5. **Ingredient Rules**: compact left-bordered cards (red never, orange caution, green synergy)
6. **Ingredient Spotlights**: horizontal scroll of centered cards (emoji + name + subtitle)
7. **Seasonal Guides**: horizontal scroll of cards
8. **Science Articles**: vertical list of article cards (gradient bg + title + subtitle)

---

## Tab 3: MY ROUTINES

### Layout (top to bottom)

1. **Create Button**: full-width, dashed blue border
   - Blue circle "+" icon (40px) + "New Routine" title + "Build with JAY or from scratch" subtitle
   - Tap → opens CreateRoutineSheet
2. **Active Routines Section**:
   - Section header: "Active ({count})" (20px bold)
   - Per routine: **Enhanced RoutineCard**:
     - Green left accent bar (3px)
     - Row 1: name (17px semibold) + period badge (pill, e.g. "☀️ AM")
     - Row 2: "{steps} steps · {type} · ₹{cost}/mo" (13px tertiaryLabel)
     - Row 3: per-routine stats — "📊 92% · 🔥 7 days" (13px, colored)
     - Row 4: action pills — [Edit] [Schedule] [⋯ More]
   - **Schedule button** → opens day picker (Mon-Sun toggle checkboxes)
   - **⋯ More menu** → Duplicate, Deactivate, Share, Delete (with confirm alerts)
   - Tap card body → push to routine detail screen
3. **Saved Routines Section**:
   - Section header: "Saved" (20px bold)
   - Per routine: compact card (no accent bar, gray)
     - Name + step count + type
     - Actions: [Activate] [Delete]
   - Empty state: "Deactivated routines appear here" (centered tertiary text)
4. **Stats Section**:
   - Thin separator
   - "Your Stats" header
   - Period toggle: [7 days] [30 days] [90 days] (pill selector)
   - StatsHero: large streak number (48px bold orange)
   - StatCards: 2x2 grid (adherence%, current streak, longest streak, skipped)

---

## Components to Create/Modify

### New Components
| Component | Purpose |
|-----------|---------|
| `HeroRing.tsx` | 130px animated ring with center text + completion % below |
| `StatPill.tsx` | Compact 28px pill (emoji + number + label) |
| `StepTable.tsx` | Apple Reminders grouped table for steps |
| `StepTableRow.tsx` | Single step row within table (checkbox + content + right) |
| `RoutineManagementCard.tsx` | Enhanced card for My Routines with stats + actions |
| `ActionPill.tsx` | Small action button pill (Edit, Schedule, Duplicate, etc.) |
| `SchedulePicker.tsx` | Day-of-week toggle picker (Mon-Sun) |
| `MoreMenu.tsx` | ⋯ dropdown with Duplicate/Deactivate/Share/Delete |
| `CostBreakdownSheet.tsx` | Bottom sheet showing product costs when tapping cost pill |

### Components to Keep (with modifications)
| Component | Changes |
|-----------|---------|
| `SegmentedControl.tsx` | Update to 3 segments |
| `ProgressRing.tsx` | → rename to HeroRing, size 130px, add % text below |
| `CompleteAllButton.tsx` | Restyle: secondary bg default, green when done |
| `ConflictNotice.tsx` | Restyle as subtle tip card |
| `FeaturedRoutineCard.tsx` | Keep as-is |
| `CategoryRow.tsx` | Keep as-is |
| `RoutineTypeCard.tsx` | Keep as-is |

### Components to Remove
| Component | Reason |
|-----------|--------|
| `StreakAdherenceRow.tsx` | Replaced by StatPills |
| `DayDots.tsx` | Low value without real data |
| `ActiveRoutineIndicator.tsx` | Redundant with session tabs |
| `StepRow.tsx` | Replaced by StepTableRow |
| `StepCheckbox.tsx` | Integrated into StepTableRow |
| `MonthlyCostPill.tsx` | Replaced by inline cost text + CostBreakdownSheet |
| `RoutineCard.tsx` | Replaced by RoutineManagementCard |

---

## Data Flow

### Store Changes (routineStore.ts)
No store interface changes needed — current store already has:
- `routines: RoutineOut[]`
- `todayStatuses: Record<string, TodayStatus>`
- `selectedRoutineId: string | null`
- All CRUD + tracking + stats actions

### New Store Actions Needed
- `setRoutineSchedule(routineId: string, days: string[])` — save which days routine runs
  - For now, store client-side only (no backend endpoint yet)
  - Future: add `schedule_days` column to Routine model

---

## Animations

| Element | Animation | Duration |
|---------|-----------|----------|
| Hero ring fill | stroke-dashoffset with withTiming | 600ms ease-out |
| Ring color (blue → green at 100%) | interpolateColor | 300ms |
| Step checkbox | withSpring scale 1→1.15→1 | 250ms spring(damping:12) |
| Step completion time appear | FadeInRight | 200ms |
| Complete All text change | crossfade | 200ms |
| Card press | scale(0.98) | 150ms spring |
| Tab switch content | opacity 0→1 | 150ms |
| Stat pill count up | withTiming from 0 | 400ms |

---

## Color Palette for Routine Section

| Element | Color | Note |
|---------|-------|------|
| Ring progress | systemBlue | Primary action |
| Ring complete | systemGreen | Success |
| Streak number/pill | systemOrange | Energy/fire |
| Adherence pill | systemBlue | Information |
| Completed step time | systemGreen | Success |
| Skipped step indicator | systemOrange | Warning |
| Conflict tip border | systemOrange | Attention |
| Active routine accent | systemGreen | Active state |
| Step checkbox done | systemGreen | Completion |
| Delete actions | systemRed | Destructive |

---

## Screen Navigation

```
Routine Screen (3 tabs)
├── Today
│   ├── Session pill tap → switches selectedRoutineId
│   ├── Step checkbox tap → optimistic complete
│   ├── Step long press → SkipReasonSheet
│   ├── Complete All → complete all remaining
│   ├── Cost tap → CostBreakdownSheet
│   └── Conflict tap → (no action, info only)
├── Library
│   ├── Featured card → RoutineTemplateDetail screen
│   ├── RoutineTypeCard → RoutineTemplateDetail screen
│   ├── Article card → Article screen
│   └── Ingredient spotlight → Article screen
├── My Routines
│   ├── + New Routine → CreateRoutineSheet
│   ├── Card tap → RoutineDetail screen
│   ├── Edit pill → RoutineEdit screen
│   ├── Schedule pill → SchedulePicker (inline or sheet)
│   ├── ⋯ More → MoreMenu → Duplicate/Deactivate/Share/Delete
│   ├── Activate (saved) → re-activate routine
│   └── Delete (saved) → confirm + delete
└── + Header button → CreateRoutineSheet
```
