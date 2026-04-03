# Routine Section Complete Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Routine section as a 3-tab experience (Today/Library/My Routines) with Apple Health-style hero ring, Apple Reminders-style step tables, and full routine management with per-routine stats.

**Architecture:** The main routine.tsx is rewritten from scratch as a clean 3-tab screen. New focused components replace the old bloated ones: HeroRing (130px animated), StepTable/StepTableRow (Reminders-style), StatPill (compact), RoutineManagementCard (full-featured). The Library tab merges current Explore + Learn. Existing data files (routineLibrary.ts, learnContent.ts) and store (routineStore.ts) are reused without changes.

**Tech Stack:** React Native 0.81, Expo SDK 54, Expo Router, Zustand, react-native-reanimated, react-native-svg, @gorhom/bottom-sheet, expo-haptics

---

## File Map

### New Components (create)
| File | Responsibility |
|------|----------------|
| `components/routine/HeroRing.tsx` | 130px animated ring with center text + completion % |
| `components/routine/StatPill.tsx` | Compact 28px pill (emoji + number + label) |
| `components/routine/StepTable.tsx` | Apple Reminders grouped table wrapper |
| `components/routine/StepTableRow.tsx` | Single step row (checkbox + content + right info) |
| `components/routine/RoutineManagementCard.tsx` | Enhanced card for My Routines with stats + actions |
| `components/routine/ActionPill.tsx` | Small reusable action button pill |

### Modified Files
| File | Changes |
|------|---------|
| `app/(screens)/routine.tsx` | Complete rewrite — 3 tabs, new component imports, clean layout |

### Kept As-Is (no changes)
| File | Why |
|------|-----|
| `SegmentedControl.tsx` | Already takes dynamic segments array |
| `RoutineHeader.tsx` | Works fine |
| `CompleteAllButton.tsx` | Just needs render in new layout |
| `ConflictNotice.tsx` | Restyle via props/container only |
| `FeaturedRoutineCard.tsx` | Library tab uses as-is |
| `CategoryRow.tsx` | Library tab uses as-is |
| `RoutineTypeCard.tsx` | Library tab uses as-is |
| `OrderDiagram.tsx` | Library tab uses as-is |
| `ConflictRule.tsx` | Library tab uses as-is |
| `IngredientSpotlight.tsx` | Library tab uses as-is |
| `SeasonalCard.tsx` | Library tab uses as-is |
| `ArticleCard.tsx` | Library tab uses as-is |
| `TipCard.tsx` | Library tab uses as-is |
| `StatsHero.tsx` | My Routines tab uses as-is |
| `StatCards.tsx` | My Routines tab uses as-is |
| `StatsPeriodToggle.tsx` | My Routines tab uses as-is |
| All sheets | CreateRoutineSheet, SkipReasonSheet used as-is |
| Store + Services | routineStore.ts, routine.ts unchanged |
| Data files | routineLibrary.ts, learnContent.ts unchanged |

### No Longer Imported (dead code, don't delete — just stop importing)
| File | Replaced by |
|------|-------------|
| `StreakAdherenceRow.tsx` | StatPill |
| `DayDots.tsx` | Removed from Today |
| `ActiveRoutineIndicator.tsx` | Session tabs |
| `StepRow.tsx` | StepTableRow |
| `StepCheckbox.tsx` | Integrated into StepTableRow |
| `MonthlyCostPill.tsx` | Inline cost text |
| `RoutineCard.tsx` | RoutineManagementCard |
| `ProgressRing.tsx` | HeroRing |

---

## Tasks

### Task 1: Create HeroRing component

**Files:**
- Create: `jay-app/components/routine/HeroRing.tsx`

- [ ] **Step 1: Create the component**

Props: `{ completed: number, total: number }`

Specs:
- 130px SVG ring (Circle elements from react-native-svg)
- 7px stroke width, radius = (130 - 7) / 2 = 61.5, circumference = 2 * PI * 61.5 = 386.4
- Track circle: colors.systemGray5
- Progress circle: colors.systemBlue (transitions to systemGreen at 100%)
- Animated stroke-dashoffset using react-native-reanimated useSharedValue + withTiming(600ms)
- rotation -90 for top-start
- Center text: "{completed}/{total}" (28px, Outfit-Bold, colors.label)
- Below center: "STEPS" (10px, uppercase, letterSpacing 0.5, secondaryLabel)
- Below the ring SVG: "{percentage}% complete" (13px, Outfit-Medium, secondaryLabel)
- Centered container, alignItems center

Use: `useTheme()` from `../../lib/theme`, `Svg, Circle` from `react-native-svg`, `useSharedValue, useAnimatedProps, withTiming` from `react-native-reanimated`, `Animated.createAnimatedComponent(Circle)`

- [ ] **Step 2: Commit**

---

### Task 2: Create StatPill component

**Files:**
- Create: `jay-app/components/routine/StatPill.tsx`

- [ ] **Step 1: Create the component**

Props: `{ emoji: string, value: string, label: string, tintColor: string }`

Specs:
- Horizontal row: emoji (14px) + value (14px, Outfit-Bold, colors.label) + label (12px, Outfit, secondaryLabel)
- Background: `tintColor + '12'` (subtle tint)
- Height 28px, paddingHorizontal 12, borderRadius 14 (full pill)
- Gap 4 between elements

Tiny component, ~30 lines.

- [ ] **Step 2: Commit**

---

### Task 3: Create StepTable + StepTableRow components

**Files:**
- Create: `jay-app/components/routine/StepTable.tsx`
- Create: `jay-app/components/routine/StepTableRow.tsx`

- [ ] **Step 1: Create StepTable**

Props: `{ title: string, badge?: string, children: React.ReactNode }`

Apple Reminders grouped table wrapper:
- Container: colors.secondarySystemBackground, 14px borderRadius, overflow hidden
- Header row (if title): paddingHorizontal 16, paddingVertical 10
  - Title: 15px, Outfit-SemiBold, colors.label
  - Badge (optional): pill on right (11px, secondaryLabel, tertiarySystemFill bg)
- Children rendered below header
- marginHorizontal 16 (so parent doesn't need padding)

- [ ] **Step 2: Create StepTableRow**

Props:
```typescript
{
  category: string;
  productName?: string;
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
  waitTime?: number;
  frequency?: string;
  isLast: boolean;
  onPress: () => void;
  onLongPress: () => void;
}
```

Apple Reminders style row:
- 48px min height, paddingHorizontal 16, paddingVertical 10
- Left: 22px circle checkbox
  - Empty: 2px border colors.systemGray4
  - Completed: filled systemGreen + white checkmark SVG (12px)
  - Skipped: filled systemOrange + white dash line SVG
  - Tap: spring animation scale 1→1.12→1, haptic Light
- Middle (flex 1, marginLeft 12):
  - Category: 15px Outfit-SemiBold, colors.label (dimmed to secondaryLabel if completed)
  - Product name: 13px Outfit, secondaryLabel (tertiaryLabel if completed)
- Right:
  - If completed: time string (13px, Outfit-Medium, systemGreen)
  - If waitTime: pill "⏱ {time}" (11px, Outfit-Medium, systemBlue bg+text)
  - If frequency !== 'daily': pill with frequency label
- Separator: 0.33px, colors.separator, marginLeft 50 (under content, not checkbox)
  - Only if !isLast

Pressable: onPress completes step, onLongPress (500ms) opens skip sheet.
Don't allow press if already completed or skipped.

- [ ] **Step 3: Commit**

---

### Task 4: Create RoutineManagementCard component

**Files:**
- Create: `jay-app/components/routine/RoutineManagementCard.tsx`

- [ ] **Step 1: Create the component**

Props:
```typescript
{
  routine: RoutineOut;
  isActive: boolean;
  adherence?: number;
  streak?: number;
  onPress: () => void;
  onEdit: () => void;
  onMore: () => void;
}
```

Import RoutineOut from `../../types/routine`.

Layout:
- Container: secondarySystemBackground, 14px radius, padding 16, marginBottom 10
- If isActive: green left accent bar (3px wide, absolute left, full height, systemGreen, borderRadius 14 0 0 14)
- Row 1: name (17px Outfit-SemiBold) + period badge (pill: 11px uppercase, tertiarySystemFill bg)
- Row 2: "{steps.length} steps · {routine_type} · ₹{cost}/mo" (13px, tertiaryLabel)
- Row 3 (only if isActive and adherence/streak provided): "📊 {adherence}% · 🔥 {streak} days" (13px, colored inline)
- Row 4: action pills row
  - If isActive: [Edit (secondaryLabel)] [Schedule (secondaryLabel)] [⋯ (secondaryLabel)]
  - If saved: [Activate (systemBlue)] [Delete (systemRed)]
- Action pills use ActionPill component (see below)
- Pressable card body → onPress
- Press animation: scale 0.98

- [ ] **Step 2: Create ActionPill component**

File: `jay-app/components/routine/ActionPill.tsx`

Props: `{ label: string, color?: string, tintBg?: string, onPress: () => void }`

- paddingVertical 6, paddingHorizontal 10, borderRadius 8
- Background: tintBg || colors.tertiarySystemFill
- Text: 12px, Outfit-Medium, color || colors.secondaryLabel
- Pressable with opacity feedback

- [ ] **Step 3: Commit**

---

### Task 5: Rewrite routine.tsx — Complete rebuild

**Files:**
- Modify: `jay-app/app/(screens)/routine.tsx` (full rewrite)

- [ ] **Step 1: Write the complete new routine screen**

This is the main task. The file should be ~500 lines (down from 843). Complete rewrite.

**Imports needed:**
```typescript
// React
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';

// Theme + Store
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';
import { useRoutineStore } from '../../stores/routineStore';

// New components
import RoutineHeader from '../../components/routine/RoutineHeader';
import SegmentedControl from '../../components/routine/SegmentedControl';
import HeroRing from '../../components/routine/HeroRing';
import StatPill from '../../components/routine/StatPill';
import StepTable from '../../components/routine/StepTable';
import StepTableRow from '../../components/routine/StepTableRow';
import CompleteAllButton from '../../components/routine/CompleteAllButton';
import { ConflictNotice } from '../../components/routine/ConflictNotice';
import RoutineManagementCard from '../../components/routine/RoutineManagementCard';
import ActionPill from '../../components/routine/ActionPill';
import { StatsHero } from '../../components/routine/StatsHero';
import { StatCards } from '../../components/routine/StatCards';
import { StatsPeriodToggle } from '../../components/routine/StatsPeriodToggle';

// Library components (kept from before)
import FeaturedRoutineCard from '../../components/routine/FeaturedRoutineCard';
import CategoryRow from '../../components/routine/CategoryRow';
import OrderDiagram from '../../components/routine/OrderDiagram';
import ConflictRule from '../../components/routine/ConflictRule';
import IngredientSpotlight from '../../components/routine/IngredientSpotlight';
import SeasonalCard from '../../components/routine/SeasonalCard';
import ArticleCard from '../../components/routine/ArticleCard';
import TipCard from '../../components/routine/TipCard';

// Sheets
import { CreateRoutineSheet } from '../../components/routine/sheets/CreateRoutineSheet';
import { SkipReasonSheet } from '../../components/routine/sheets/SkipReasonSheet';

// Data
import { ROUTINE_CATEGORIES, FEATURED_ROUTINE } from '../../data/routineLibrary';
import { TIPS, AM_ORDER, PM_ORDER, CONFLICTS, INGREDIENT_SPOTLIGHTS, SEASONAL_GUIDES, SCIENCE_ARTICLES } from '../../data/learnContent';
```

**Segments:** `['Today', 'Library', 'My Routines']` (3 tabs, was 4)

**SessionTabs:** Keep as extracted function component (shown if routines.length > 1).

**renderToday():**
1. Empty state if no routines
2. SessionTabs
3. HeroRing (completed, total from todayStatus)
4. StatPills row: streak pill (orange) + adherence pill (blue), centered, gap 12
5. StepTable with StepTableRows for each step
6. CompleteAllButton
7. ConflictNotice (conditional)
8. Cost text (conditional): "₹{cost}/mo" as small centered text

**renderLibrary():** (merge of old Explore + Learn)
1. FeaturedRoutineCard
2. CategoryRows (6 categories)
3. Divider + "Learn" label
4. OrderDiagram
5. ConflictRules
6. IngredientSpotlights (horizontal)
7. SeasonalCards (horizontal)
8. ScienceArticles (vertical)

**renderRoutines():**
1. Empty state if no routines
2. Create new routine button (dashed blue border)
3. "Active ({n})" section with RoutineManagementCard per active routine
4. "Saved" section with RoutineManagementCard per saved routine
5. Stats section (separator + period toggle + StatsHero + StatCards)

**Main render:**
```
GestureHandlerRootView
  View (paddingTop: insets.top)
    RoutineHeader
    SegmentedControl (3 segments)
  
  {loading ? ActivityIndicator : segment content}
  
  CreateRoutineSheet
  SkipReasonSheet
```

**Styles:** Clean StyleSheet.create at bottom. Named constants, no inline styles in render.

- [ ] **Step 2: Verify TypeScript compiles**
```bash
cd jay-app && npx tsc --noEmit
```

- [ ] **Step 3: Verify Metro bundles**
```bash
npx expo export --platform ios
```

- [ ] **Step 4: Commit**

---

### Task 6: Final verification + commit

- [ ] **Step 1: Run full type check**
```bash
cd jay-app && npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 2: Run Metro bundle**
```bash
npx expo export --platform ios
```
Expected: Clean export

- [ ] **Step 3: Git add + commit all changes**
```bash
git add -A
git commit -m "feat: complete routine rebuild — 3-tab Apple Health/Reminders inspired

- Today: hero ring (130px animated), stat pills, step table
- Library: merged Explore + Learn
- My Routines: management cards with per-routine stats + actions
- New components: HeroRing, StatPill, StepTable, StepTableRow, RoutineManagementCard, ActionPill"
```

- [ ] **Step 4: Push**
```bash
git push origin main
```
