# JAY — Mobile App Frontend Build Prompt

> **Instructions:** Paste this prompt into your AI coding assistant (Claude Code, Cursor, etc.) along with the two attached files: `JAY_Final.html` (design mockups) and `JAY_Documentation.md` (design system specs). The assistant should read both files first, then execute this prompt.

---

## Context

You are building the complete frontend for **JAY**, an AI-powered personal skincare companion mobile app. Two reference files are attached:

1. **JAY_Final.html** — High-fidelity HTML mockups of all 13 screens rendered as scrollable iPhone frames. Open this in a browser to see the exact pixel-level design you must match. Every color, spacing value, font weight, border radius, and layout decision is already finalized in these mockups.

2. **JAY_Documentation.md** — Complete design system documentation covering color tokens, typography scale, spacing system, component specs, screen inventory with content structure, navigation patterns, micro-interactions, and accessibility requirements.

**Your job is to translate these mockups into a production-ready, cross-platform mobile app frontend** that runs identically on iOS and Android. The backend/API layer does not exist yet — use mock data, placeholder content, and local state for everything. The app must be structurally ready for backend integration later.

---

## Tech Stack (mandatory)

```
Framework:        React Native with Expo SDK 52+ (managed workflow)
Navigation:       Expo Router (file-based routing) — NOT React Navigation directly
Language:         TypeScript (strict mode)
Styling:          NativeWind v4 (Tailwind CSS for React Native) — configure via tailwind.config.ts
State:            Zustand for global state (user profile, routine, diary entries)
Local storage:    expo-secure-store for sensitive data, @react-native-async-storage for preferences
Animations:       react-native-reanimated v3 + react-native-gesture-handler
Icons:            Custom SVG icons via react-native-svg (match the exact icons from mockups)
Fonts:            expo-font for Outfit (Google Fonts) + Theater Bold Condensed (bundled as local asset)
```

### Why this stack

- **Expo Router** gives file-based routing like Next.js — tabs, stacks, and modals map cleanly to JAY's navigation structure.
- **NativeWind** allows using Tailwind utility classes in React Native, making the design token translation trivial.
- **Zustand** is lightweight and perfect for the app's state needs (no Redux boilerplate).
- **Reanimated v3** handles all micro-interactions (card press scale, progress bar fill, score count-up) at 60fps on the native thread.

---

## Project Structure

```
jay-app/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (font loading, providers, splash)
│   ├── (tabs)/                   # Bottom tab navigator group
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home screen (Tab 1)
│   │   ├── discover.tsx          # Discover feed (Tab 2)
│   │   ├── jay.tsx               # Ask JAY chat (Tab 3 — center)
│   │   ├── diary.tsx             # Skin diary calendar (Tab 4)
│   │   └── profile.tsx           # Profile (Tab 5)
│   ├── (screens)/                # Stack screens (pushed on top of tabs)
│   │   ├── _layout.tsx           # Stack navigator config (headerShown: false)
│   │   ├── routine.tsx           # Routine overview
│   │   ├── routine-builder.tsx   # Routine builder
│   │   ├── routine-generate.tsx  # AI routine generation
│   │   ├── research/
│   │   │   ├── [id].tsx          # Jay Research overview (dynamic route)
│   │   │   └── module/[id].tsx   # Research module detail
│   │   ├── dupe-finder.tsx       # Dupe finder
│   │   ├── cap-or-slap.tsx       # Cap or Slap feed
│   │   ├── diet-planner.tsx      # Diet planner
│   │   ├── dermatologist.tsx     # Dermatologist guide
│   │   ├── intelligence.tsx      # Intelligence dashboard
│   │   ├── intelligence/[id].tsx # Insight detail
│   │   ├── community.tsx         # Community feed
│   │   ├── diary/[date].tsx      # Diary date entry
│   │   ├── notifications.tsx     # Notifications
│   │   ├── settings.tsx          # Settings
│   │   ├── achievements.tsx      # Badges & streaks
│   │   └── preferences.tsx       # Skin profile preferences
│   ├── onboarding/               # Onboarding flow (separate stack)
│   │   ├── _layout.tsx           # Stack with no header, no tabs
│   │   ├── welcome.tsx           # Welcome screen
│   │   ├── quiz.tsx              # Skin quiz (multi-step within single screen)
│   │   ├── profile-setup.tsx     # Name, avatar, age
│   │   └── ready.tsx             # Completion screen
│   └── (auth)/                   # Auth screens (future)
│       ├── login.tsx
│       └── signup.tsx
├── components/
│   ├── ui/                       # Atomic design components
│   │   ├── Button.tsx            # Primary + outline variants
│   │   ├── Card.tsx              # Standard bordered card
│   │   ├── Chip.tsx              # Tag/chip with active state
│   │   ├── SearchBar.tsx         # Search input
│   │   ├── ProgressBar.tsx       # Thin animated progress bar
│   │   ├── ScoreRing.tsx         # Circular SVG score indicator
│   │   ├── CompletionCircle.tsx  # Checkmark circle (done/pending)
│   │   ├── MenuRow.tsx           # Settings-style list row with chevron
│   │   ├── SectionHeader.tsx     # "EXPLORE" style micro-label
│   │   ├── MicroLabel.tsx        # Uppercase tracked label
│   │   ├── Divider.tsx           # 0.5px hairline
│   │   └── TopBar.tsx            # Back arrow + title for inner screens
│   ├── chat/
│   │   ├── ChatBubbleJay.tsx     # JAY message bubble (left)
│   │   ├── ChatBubbleUser.tsx    # User message bubble (right)
│   │   ├── VerdictCard.tsx       # Inline SLAP/CAP card inside chat
│   │   ├── RecommendationBlock.tsx # Left-border callout block
│   │   ├── SuggestedPrompts.tsx  # Horizontal pill chips
│   │   └── ChatInput.tsx         # Fixed bottom input bar
│   ├── home/
│   │   ├── SkinHealthCard.tsx    # Score ring + stats
│   │   ├── QuickActionsGrid.tsx  # 4x2 icon grid
│   │   ├── RoutineCarousel.tsx   # Horizontal step cards
│   │   ├── ForYouCarousel.tsx    # Editorial cards
│   │   ├── InsightNudge.tsx      # Inline insight banner
│   │   └── CapSlapPreview.tsx    # Two side-by-side verdict cards
│   ├── diary/
│   │   ├── CalendarGrid.tsx      # Month calendar with dots
│   │   ├── DiaryEntryCard.tsx    # Date + mood + tags row
│   │   └── MoodSelector.tsx      # 5 emoji mood picker
│   ├── routine/
│   │   ├── RoutineStep.tsx       # Single step card with timeline
│   │   └── AmPmToggle.tsx        # Segmented control
│   ├── research/
│   │   ├── ProductHero.tsx       # Product image + score + tags
│   │   └── ModuleRow.tsx         # Research module list item
│   ├── dupe/
│   │   ├── OriginalProduct.tsx   # Original product card
│   │   ├── DupeCard.tsx          # Dupe result with match bar
│   │   └── SavingsHero.tsx       # Large savings number
│   └── community/
│       └── PostCard.tsx          # Community post with engagement
├── constants/
│   ├── colors.ts                 # Color tokens
│   ├── typography.ts             # Font size/weight/spacing presets
│   ├── spacing.ts                # Layout spacing tokens
│   └── mockData.ts               # All mock data for screens
├── hooks/
│   ├── useAnimatedValue.ts       # Reanimated helpers
│   └── useOnboarding.ts          # Onboarding completion state
├── stores/
│   ├── userStore.ts              # User profile, skin type, preferences
│   ├── routineStore.ts           # Routine steps, completion state
│   ├── diaryStore.ts             # Diary entries by date
│   └── chatStore.ts              # Chat message history
├── types/
│   └── index.ts                  # All TypeScript interfaces
├── assets/
│   └── fonts/
│       ├── Outfit-Regular.ttf
│       ├── Outfit-Medium.ttf
│       ├── Outfit-SemiBold.ttf
│       ├── Outfit-Bold.ttf
│       └── Theater-BoldCondensed.otf
├── tailwind.config.ts            # NativeWind Tailwind config
├── app.json                      # Expo config
├── tsconfig.json                 # TypeScript config
└── package.json
```

---

## Design Token Configuration

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'jay-black': '#000000',
        'jay-dark': '#333333',
        'jay-mid': '#666666',
        'jay-grey': '#999999',
        'jay-light': '#CCCCCC',
        'jay-border': '#E5E5E5',
        'jay-surface': '#F5F5F5',
        'jay-bg': '#FFFFFF',
      },
      fontFamily: {
        'outfit': ['Outfit'],
        'outfit-medium': ['Outfit-Medium'],
        'outfit-semibold': ['Outfit-SemiBold'],
        'outfit-bold': ['Outfit-Bold'],
        'theater': ['Theater-BoldCondensed'],
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '29px', letterSpacing: '-0.3px', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '22px', letterSpacing: '-0.2px', fontWeight: '600' }],
        'card-title': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'secondary': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'micro': ['10px', { lineHeight: '12px', letterSpacing: '2.5px', fontWeight: '600' }],
        'score-lg': ['24px', { lineHeight: '28px', letterSpacing: '-0.5px', fontWeight: '700' }],
        'score-xl': ['40px', { lineHeight: '44px', letterSpacing: '-1.5px', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '14px',
        'button': '12px',
        'pill': '100px',
        'phone': '48px',
      },
      spacing: {
        'screen': '24px',
        'section': '28px',
        'card-pad': '14px',
      },
      borderWidth: {
        'hairline': '0.5px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### constants/colors.ts

```typescript
export const Colors = {
  black: '#000000',
  dark: '#333333',
  mid: '#666666',
  grey: '#999999',
  light: '#CCCCCC',
  border: '#E5E5E5',
  surface: '#F5F5F5',
  bg: '#FFFFFF',
  
  // Calendar dots
  dotGood: '#333333',
  dotOkay: '#999999',
  dotBad: '#CCCCCC',
  
  // Badges
  slapBg: '#000000',
  capBg: '#888888',
  
  // Transparent
  tabBarBg: 'rgba(255, 255, 255, 0.94)',
} as const;
```

---

## Tab Bar Implementation

### app/(tabs)/_layout.tsx

The tab bar is the most critical UI element. Match the mockup exactly:

```
- 5 tabs: Home, Discover, JAY (center), Diary, Profile
- Tab bar height: 84px (including safe area via useSafeAreaInsets)
- Background: rgba(255,255,255,0.94) with BlurView (expo-blur)
- Border top: 0.5px solid #E5E5E5
- Active icon: filled variant, opacity 1, label #000 weight 600
- Inactive icon: outlined variant, opacity 0.3, label #999 weight 500
- Center JAY tab: 42px black circle elevated -8px above bar, white "J" in Theater font inside
- Use Expo Router's Tabs component with custom tabBar prop for full control
```

Build a fully custom `CustomTabBar` component — do NOT use the default tab bar. The center floating pill and the frosted blur effect require a custom implementation.

---

## Screen-by-Screen Build Instructions

For each screen, refer to the HTML mockup for the exact visual and the documentation for the structural spec. Here are implementation-specific notes:

### Home (index.tsx)

- Use `ScrollView` with `showsVerticalScrollIndicator={false}`
- `QuickActionsGrid`: Use `FlatList` with `numColumns={4}` and `scrollEnabled={false}`
- `RoutineCarousel`: Use `FlatList` with `horizontal={true}`, `showsHorizontalScrollIndicator={false}`, `snapToInterval={138}` (card width + gap)
- `ForYouCarousel`: Same horizontal `FlatList`, `snapToInterval={248}`
- `SkinHealthCard`: Use `react-native-svg` for the circular progress ring. Animate the `strokeDashoffset` with `react-native-reanimated` on mount
- All "View all →" and "See all →" links should use `router.push()` to the relevant screen
- Each quick action icon navigates: `router.push('/(screens)/routine')` etc.

### Ask JAY (jay.tsx)

- Use `FlatList` with `inverted={false}` for the chat history (NOT inverted — messages read top to bottom like the mockup)
- `ChatInput` is positioned with `KeyboardAvoidingView` (behavior="padding" on iOS, "height" on Android) + absolute positioning at bottom
- JAY avatar: 28px black circle with white "J" in Theater font — render as a reusable `JayAvatar` component
- Suggested prompts scroll horizontally below the last message
- Verdict cards inside JAY bubbles are nested components — `VerdictCard` inside `ChatBubbleJay`
- Recommendation blocks use a 2.5px left border
- For now, chat is local state. User sends a message → simulate a 1-second typing delay → show a hardcoded JAY response from mock data
- Wire up `onSubmitEditing` and the send button to the same handler

### Diary (diary.tsx)

- Build `CalendarGrid` as a custom component (do NOT use react-native-calendars — it can't match the minimal design)
- Calendar is a simple `View` with 7-column grid via `flexWrap: 'wrap'`
- Each day cell: 44px touch target, number centered, optional dot below (4px circle)
- Today: black filled circle background with white number
- Tapping a date navigates: `router.push('/(screens)/diary/${date}')`
- Recent entries below the calendar use `DiaryEntryCard` components

### Profile (profile.tsx)

- Stats row: 3-column flex with 0.5px vertical borders between
- Level progress bar: animated fill width on mount using `useAnimatedStyle` + `withTiming`
- Menu sections: map over config arrays to render `MenuRow` components grouped under `SectionHeader` labels
- Each menu row navigates to its respective screen

### Routine (routine.tsx)

- The vertical timeline connecting line: `position: 'absolute'` View with 1px width, #E5E5E5 background, calculated height
- Step number circles sit on top of this line via `zIndex: 1`
- `AmPmToggle` uses `Pressable` with animated background position (sliding pill)
- "Wait time" chip between steps: rendered as a child of the step card

### Dupe Finder (dupe-finder.tsx)

- Match percentage badge: black pill for best match, #F5F5F5 for others
- Progress bars animate on mount: `width: withTiming(targetPercent + '%', { duration: 800 })`
- Savings hero number at bottom: 40px font weight 700 — center-aligned, no card wrapper
- "Save ₹X" text: #000 font-weight 600 (NOT colored — monochrome system)

### Research (research/[id].tsx)

- Score ring: same `ScoreRing` component as Home but larger (use `size` prop)
- Module status indicators: filled circle (done), rotated square/diamond (in progress), outlined circle (pending) — use SVG for each
- Module rows are `Pressable` — navigate to `research/module/${moduleId}`

### Intelligence (intelligence.tsx)

- Weekly bar chart: 7 vertical `View` elements with animated height inside a fixed-height container
- Summary card uses a 7-segment horizontal bar (7 small rectangles in a row)
- Insight cards are `Pressable` → navigate to detail

### Community (community.tsx)

- Standard `FlatList` with `PostCard` items
- Avatar circles: initials on #F0F0F0 background, 32px
- Engagement row: plain text (♡ 24, 💬 8) — no icon components needed, use unicode

### Cap or Slap (cap-or-slap.tsx)

- Verdict cards in a `FlatList`
- Image area: 120px height with #F5F5F5 background (placeholder for future product images)
- Badge overlay: absolute positioned top-right
- Score: large number, black for SLAP, #CCC for CAP

### Diet Planner (diet-planner.tsx)

- Three meal cards in a `ScrollView`
- Water intake: `ScoreRing` component reused at 48px size
- Nutrient tags: `Chip` components with #F5F5F5 background

### Dermatologist (dermatologist.tsx)

- Conditions grid: 2-column `FlatList` with `numColumns={2}`
- FAQ: `Pressable` rows that toggle expanded text below — use `LayoutAnimation` or Reanimated for smooth expand/collapse

### Onboarding (onboarding/)

- Horizontal pager for welcome screen (optional — can also be single screen with pagination dots)
- Skin quiz: single screen with internal step state (1 of 5). Animate transitions between questions using `react-native-reanimated` shared element transitions or simple fade
- Selected answer: black background + white text. Unselected: 0.5px border
- Progress bar at top fills incrementally (20% → 40% → 60% → 80% → 100%)
- On completion, write to `userStore` and navigate to `(tabs)` replacing the stack

---

## Mock Data Structure

### constants/mockData.ts

Create comprehensive mock data matching the content shown in the HTML mockups:

```typescript
export const mockUser = {
  name: 'Priya',
  skinType: 'Combination',
  sensitivity: 'Sensitive',
  skinScore: 78,
  streak: 12,
  diaryEntries: 42,
  trackedProducts: 8,
  glowPoints: 320,
  level: 'Skincare Enthusiast',
  levelProgress: 64, // percent
  memberSince: 'March 2026',
};

export const mockRoutine = {
  am: [
    { id: '1', step: 1, category: 'Cleanser', product: 'CeraVe Foaming Cleanser', instruction: 'Massage onto damp skin 60s', completed: true },
    { id: '2', step: 2, category: 'Serum', product: 'Minimalist 10% Vitamin C', instruction: '2-3 drops on damp skin', completed: true, waitTime: '1 min' },
    { id: '3', step: 3, category: 'Moisturizer', product: 'Neutrogena Hydro Boost', instruction: 'Apply evenly to face', completed: false },
    { id: '4', step: 4, category: 'Sunscreen', product: 'La Shield Mineral SPF 50', instruction: '2 finger lengths', completed: false },
  ],
  pm: [ /* similar structure */ ],
};

// ... diary entries, chat messages, dupe results, articles, verdicts, etc.
// Match ALL content from the HTML mockups exactly
```

---

## Animation Specs

Implement these using `react-native-reanimated`:

| Animation | Trigger | Duration | Easing | Implementation |
|-----------|---------|----------|--------|----------------|
| Score ring fill | Screen mount | 800ms | ease-out | Animate `strokeDashoffset` from full circumference to target |
| Progress bar fill | Screen mount | 500ms | ease-out | Animate `width` from 0 to target% |
| Card press | onPressIn/Out | 150ms | ease | `useAnimatedStyle` with `transform: [{ scale: withTiming(0.98) }]` |
| Button press | onPressIn/Out | 100ms | ease | Opacity to 0.85 |
| Score count up | Screen mount | 800ms | ease-out | Interpolate number from 0 to value, display `Math.round()` |
| Checkbox fill | onPress | 300ms | spring | Scale from 0 to 1 with slight overshoot |
| Tab bar icon | onPress | 150ms | ease | Scale pop (1 → 1.1 → 1) on active icon |
| Screen transition | navigation | 300ms | ease | Default Expo Router stack animation (iOS push) |
| Bottom sheet | onOpen | 300ms | spring | `useAnimatedStyle` translateY with spring config |

---

## Accessibility Requirements

- Set `accessible={true}` and `accessibilityLabel` on all Pressable/TouchableOpacity
- All icons must have `accessibilityLabel` describing their function
- Minimum touch target: 44×44px on all interactive elements (wrap small elements in larger `Pressable` if needed)
- Support `useReducedMotion()` from reanimated — disable all animations when true
- Score rings must have `accessibilityValue={{ now: 78, min: 0, max: 100 }}`
- Calendar days: `accessibilityLabel="March 25, good skin day"` including the dot state
- Chat bubbles: `accessibilityRole="text"` with full message as label
- Tab bar: `accessibilityRole="tab"` on each tab, `accessibilityState={{ selected: isActive }}`

---

## Platform-Specific Notes

### iOS

- Status bar: `StatusBar` component with `barStyle="dark-content"` (black text on white bg)
- Safe areas: use `useSafeAreaInsets()` from `react-native-safe-area-context` for tab bar bottom padding and status bar top padding
- Keyboard: `KeyboardAvoidingView` with `behavior="padding"` on chat screen
- Haptics: use `expo-haptics` for `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on button press, `Medium` on routine step completion

### Android

- Status bar: translucent with white background via `expo-status-bar`
- Navigation bar: hide with `expo-navigation-bar` or set to white
- Keyboard: `KeyboardAvoidingView` with `behavior="height"`
- Back button: handled automatically by Expo Router stack
- Ripple effect: disabled — use opacity/scale animations instead for consistent look

---

## Build & Run

```bash
# Initialize
npx create-expo-app jay-app --template expo-template-blank-typescript
cd jay-app

# Install dependencies
npx expo install expo-router expo-font expo-blur expo-haptics expo-status-bar
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg
npx expo install react-native-safe-area-context react-native-screens
npx expo install @react-native-async-storage/async-storage expo-secure-store
npm install nativewind tailwindcss zustand
npm install -D @types/react

# Configure NativeWind
npx tailwindcss init

# Add fonts to assets/fonts/
# Download Outfit from Google Fonts (Regular, Medium, SemiBold, Bold)
# Download Theater Bold Condensed from 1001fonts.com

# Run
npx expo start
```

---

## Quality Checklist

Before considering a screen "done," verify:

- [ ] Visual pixel-match against the HTML mockup (open both side by side)
- [ ] All text sizes, weights, colors, and letter-spacing match the design tokens
- [ ] Card border radius is 14px, button radius is 12px, chips are 100px (pill)
- [ ] All borders are exactly 0.5px solid #E5E5E5
- [ ] Surface backgrounds are #F5F5F5 (not #F0F0F0, not #EEEEEE)
- [ ] Tab bar blur effect works on both platforms
- [ ] Center JAY tab floats correctly with -8px elevation
- [ ] All animations respect reduced motion preference
- [ ] Touch targets are minimum 44×44px
- [ ] Screen padding is consistently 24px left/right
- [ ] Section spacing is consistently 28px
- [ ] No accent colors anywhere — strictly monochrome
- [ ] ALL-CAPS labels have correct 2.5px letter-spacing
- [ ] Horizontal scroll areas do not show scroll indicators
- [ ] Navigation transitions use iOS push (slide from right)

---

## Priority Order

Build screens in this order (each builds on components from the previous):

1. **Root layout + font loading + splash** — Get the app rendering with correct fonts
2. **Custom tab bar** — The foundation everything sits on
3. **Home screen** — Forces you to build most reusable components
4. **Profile** — Tests menu rows, stats, progress bar
5. **Diary** — Calendar is a standalone challenge
6. **Ask JAY** — Chat UI is complex but self-contained
7. **Routine** — Timeline layout, toggle, step cards
8. **Dupe Finder** — Match bars, savings display
9. **Jay Research** — Module list, score ring reuse
10. **Discover** — Article list, filter chips
11. **Cap or Slap** — Verdict cards
12. **Intelligence** — Charts, adherence bars
13. **Community** — Post cards
14. **Diet Planner** — Meal cards, hydration ring
15. **Dermatologist** — Conditions grid, FAQ accordion
16. **Onboarding flow** — Quiz stepper, welcome, completion

---

*End of build prompt. Read both attached files before starting.*
