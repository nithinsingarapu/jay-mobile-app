# JAY MOBILE APP — Complete Frontend Redesign Prompt

> **Paste this entire prompt into Claude Opus 4.6. It contains the full design DNA extracted from three reference apps, detailed design expectations, and build instructions.**

---

## YOUR ROLE

You are an Awwwards-winning mobile app designer AND a production frontend engineer. You will redesign and build the complete Jay mobile app frontend as a single, pixel-perfect HTML file (mobile viewport: 390×844px, iPhone 15 Pro). This file will be used for investor pitching, so every screen, every transition, every micro-interaction must be polished to demo quality.

Before you write any code, read EVERY section of this prompt. The design DNA sections contain specific values (colors, fonts, spacing, radius, shadows) that you MUST use — they are not suggestions.

---

## CONTEXT FILES TO READ

You have two pinned files:
1. **`frontend_structure.md`** — Contains all details about the current frontend. **Read this FULLY before designing.** Understand every existing screen, feature, user flow, and data model. Your redesign must cover ALL existing functionality plus the new features specified below.
2. **`product_card_structure.md`** — Contains the product screen data model. **Use this when building the Discover/Products section.**

---

## NEW FEATURES TO ADD (not in current frontend)

### 1. Discover / Products Section
A full product discovery experience:
- **Browse page**: Filterable, searchable grid of all skincare/beauty products in the database
- **Product detail page**: For every product — ingredients, skin type compatibility, ratings, reviews, AI-powered analysis of product suitability for the user's skin profile
- **Product comparison**: Side-by-side comparison of 2–3 products
- **Smart recommendations**: AI-curated product suggestions based on user's skin scan data, concerns, and preferences
- Use the data model from `product_card_structure.md`

### 2. Face Scan Feature
An AI-powered skin analysis experience:
- **Scan flow**: Camera interface to capture face photo (front-facing, guided framing overlay)
- **Analysis screen**: Animated processing state while AI analyzes the photo
- **Results dashboard**: Comprehensive facial analysis including:
  - Skin type classification (oily, dry, combination, normal, sensitive)
  - Detected concerns (acne, hyperpigmentation, fine lines, dark circles, enlarged pores, redness, uneven texture, dehydration)
  - Skin health score (0–100) with breakdown by zone (forehead, cheeks, chin, nose, under-eye)
  - Moisture level, oiliness level, elasticity score
  - UV damage assessment
  - Pore analysis with heatmap overlay
  - Recommended routine based on analysis
- **History**: Past scans with trend tracking (skin improving/declining over time)
- **Before/After**: Visual comparison of scans over time

---

## DESIGN DNA — EXTRACTED FROM REFERENCE APPS

### DNA Source 1: Denim (Playlist Cover Maker) — Primary Design Language

Denim is a 2025 Apple Design Award finalist for "Delight and Fun." Its design language is the PRIMARY aesthetic foundation for Jay.

**Core Visual Identity:**
- **Dark-mode-first**: Deep, rich dark backgrounds as the default canvas — NOT pure black (#000), but warm dark tones (#0A0A0F, #111118, #16161F)
- **Mesh gradients**: Multi-point color blends that create organic, flowing color transitions. Used as backgrounds, card fills, and accent areas. Think 3–4 color mesh with soft interpolation — NOT harsh linear gradients
- **Color refraction**: The dominant content color (e.g., product image, scan result) bleeds into the surrounding UI elements (navigation, cards, backgrounds) at low opacity (5–15%). This creates visual cohesion and a "the interface responds to your content" feeling
- **Liquid Glass effects**: Translucent, frosted-glass surfaces with backdrop-blur (12–20px) and subtle border (1px rgba(255,255,255,0.08)). Glass panels float above the dark background with a sense of depth
- **Smooth scroll transitions**: Content transforms as you scroll — elements fade, scale, and parallax. Cards don't just appear; they slide in with spring-physics easing

**Color System:**
```
Background Layer 0 (deepest):   #07070C
Background Layer 1 (surfaces):  #0F0F17
Background Layer 2 (cards):     #16161F  
Background Layer 3 (elevated):  #1E1E2A
Accent Gradient Start:          varies by context (see refraction)
Glass Border:                   rgba(255, 255, 255, 0.06)
Glass Fill:                     rgba(255, 255, 255, 0.04)
Text Primary:                   #F5F5F7
Text Secondary:                 rgba(245, 245, 247, 0.6)
Text Tertiary:                  rgba(245, 245, 247, 0.35)
```

**Typography:**
- System font: SF Pro Display (headings), SF Pro Text (body) — use `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
- Display titles: 34px, weight 700, letter-spacing -0.4px, line-height 1.1
- Section headers: 22px, weight 600, letter-spacing -0.2px
- Body: 15px, weight 400, line-height 1.47
- Caption: 13px, weight 400, line-height 1.38, color: Text Secondary
- Overline labels: 11px, weight 600, letter-spacing 0.8px, uppercase, color: Text Tertiary

**Spacing & Layout:**
- Screen horizontal padding: 20px
- Card padding: 16px
- Section gap: 32px
- Card gap: 12px
- Border radius (cards): 16px
- Border radius (buttons): 14px
- Border radius (pills/tags): 100px (fully rounded)
- Border radius (small elements): 10px

**Shadows:**
```css
/* Elevated cards on dark backgrounds don't use traditional shadows.
   Instead, use subtle glow + border: */
box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4);
/* For accent elements, add a colored glow: */
box-shadow: 0 4px 24px rgba(accent-color, 0.15), 0 0 0 1px rgba(255,255,255,0.06);
```

**Motion:**
- Default transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1.0)
- Spring-like bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1.0)
- Fade in: 0.2s ease-out
- Use `transform: scale()` on press states (0.97 scale-down on press)
- Loading states: pulse animation with opacity oscillation (0.4 → 1.0 → 0.4)

**Key Denim Patterns to Replicate:**
1. When the user views a product, extract the dominant color from the product image and let it subtly tint the background and glass surfaces around it
2. Full-bleed imagery with text overlays using scrim gradients (linear-gradient from transparent to #07070C)
3. Bottom sheet modals with glass-morphism backgrounds and drag handles
4. Haptic-style visual feedback: buttons scale down on press, cards lift on hover/focus
5. Custom illustrations and icons with consistent 2px stroke weight, rounded caps

---

### DNA Source 2: Headspace — Emotional Design Language

Headspace is the reference for creating a FEELING — calm, safe, trustworthy. For a skincare app, this translates to: the user should feel that the app genuinely cares about their skin health, not that it's selling them products.

**Emotional Design Principles to Apply:**
- **Generous whitespace (adapted to dark mode)**: Don't pack content. Let elements breathe. Each card, each section should have room around it. In dark mode, "whitespace" = background breathing room between cards
- **Warm, friendly tone**: All UI copy should be conversational, encouraging, never clinical. "Your skin is looking great this week" not "Skin health score: 78"
- **Soothing animations**: Nothing fast or jarring. All motion should feel like a calm exhale — slow fade-ins (0.4s), gentle slides (0.5s), breathing pulse for loading states
- **Illustration over photography for abstract concepts**: Use simple, friendly illustrations (flat, minimal, rounded shapes) for concepts like "skin health," "routine," "progress"
- **Onboarding as a conversation**: The face scan flow should feel like a gentle conversation, not a medical procedure. Progressive disclosure — don't show all results at once

**Headspace Color Sensibility (adapted to dark mode):**
```
Calm Blue (trust, safety):        #4B9CD3
Warm Coral (encouragement):       #F27059
Soft Lavender (self-care):        #B8A9C9
Mint Green (health, freshness):   #7ECEC1
Warm Yellow (positivity):         #F5C542
```
Use these as accent colors within the Denim dark-mode framework. Each major section of the app can have its own accent:
- Home/Dashboard: Calm Blue
- Face Scan: Soft Lavender → transitioning to results-specific colors
- Discover/Products: Warm Coral
- Routine: Mint Green
- Profile/Progress: Warm Yellow

**Headspace Interaction Patterns:**
- Welcome-back greeting personalized with time of day and user's name
- Progress celebrations with confetti-like particle animations (subtle, not garish)
- "Breathing" UI elements: ring that expands and contracts slowly behind the scan button
- Gentle haptic-style visual feedback on interactions (scale + slight rotation)

---

### DNA Source 3: Duolingo — Gamification & Engagement

Duolingo is the reference for making the user RETURN every day. Skincare is a daily routine — perfect for habit loops.

**Gamification Elements to Implement:**

1. **Streak System**
   - Daily skincare streak counter (🔥 icon + day count)
   - Streak visible on home screen, profile, and in the tab bar
   - Streak freeze option (miss one day without breaking)
   - Milestone celebrations: 7-day, 30-day, 100-day, 365-day with special badges
   - Visual urgency: flame icon animates faster as the day progresses without a routine logged

2. **XP & Levels**
   - XP earned for: completing routine (50 XP), logging a scan (100 XP), adding a product review (25 XP), daily login (10 XP)
   - Levels with names: Beginner → Enthusiast → Expert → Guru → Skin Sage
   - Level progress bar visible on profile

3. **Skin Score (0–100)**
   - Like Duolingo's language proficiency — a single number that represents overall skin health
   - Broken into sub-scores by zone
   - Weekly trend chart (is it improving?)
   - Celebratory animation when score improves

4. **Achievement Badges**
   - "First Scan 📸" "7-Day Streak 🔥" "Product Reviewer ⭐" "Hydration Hero 💧" "Sunscreen Champion ☀️" "Night Owl 🌙" (completed PM routine 30 days)
   - Badge gallery on profile page
   - Locked badges shown as silhouettes with unlock requirements

5. **Daily Check-In**
   - Quick daily questionnaire: "How does your skin feel today?" with emoji options (😊 Great, 😐 Okay, 😟 Not great)
   - Feeds into skin tracking trends
   - Completing it earns XP and maintains streak

**Duolingo Visual Patterns (adapted to dark mode):**
- **Saturated, meaningful colors**: Green = success/positive, Red = concern/alert, Orange = streak/fire, Blue = info/neutral, Purple = premium/special
- **Rounded, friendly shapes**: All UI elements use generous border-radius. Buttons are pill-shaped. Cards have 16px+ radius.
- **Progress indicators everywhere**: Circular progress rings, linear progress bars, step indicators — the user should always know where they are and how far they've come
- **Celebration animations**: Confetti burst, star particles, scale-up bounce on achievements
- **Mascot/character presence**: Consider a small friendly character (like Duo the owl) that appears during scans, gives tips, and celebrates achievements. Even a simple animated blob/droplet character works.

**Duolingo Typography Pattern:**
- Custom rounded font for display headings (use `'DM Sans', 'Nunito', system-ui, sans-serif` as approximation of Duolingo's DIN Rounded)
- Bold weight (700–800) for anything gamification-related (XP, streaks, levels, scores)
- Numbers displayed large and proud — skin score should be display-sized (48–64px)

---

## APP STRUCTURE — SCREENS TO BUILD

Build ALL of the following screens in the HTML file. Use a tab-based navigation with smooth transitions between sections.

### Tab Bar (Bottom Navigation)
5 tabs with icons:
1. **Home** (house icon) — Dashboard
2. **Scan** (camera/face icon) — Face Scan
3. **Discover** (search/compass icon) — Products
4. **Routine** (clock/calendar icon) — Daily Routine
5. **Profile** (person icon) — Profile & Progress

### 1. HOME (Dashboard)
- Personalized greeting: "Good morning, [Name] ✨" with time-aware messaging
- Skin Score card: Large circular score (0–100) with trend indicator (↑↓) and weekly spark chart
- Streak card: 🔥 fire icon + day count + "Keep it going!" message
- Daily check-in prompt (if not done): "How's your skin feeling?" with emoji buttons
- Today's routine progress: AM ☀️ / PM 🌙 checklist with completion percentage
- Recent scan summary: Thumbnail of last scan + key metrics
- Product recommendations carousel: 3–4 products from AI matching
- Quick actions grid: "New Scan", "Log Routine", "Find Products", "View Progress"

### 2. FACE SCAN
- **Pre-scan**: Camera viewfinder with face outline overlay, positioning guide ("Center your face"), lighting indicator
- **Scanning**: Animated scan line sweeping across face, progress ring, calming copy ("Analyzing your skin...")
- **Results**: 
  - Hero skin score with animated count-up (0 → actual score)
  - Zone-by-zone breakdown (forehead, L cheek, R cheek, nose, chin) with individual scores
  - Detected concerns list with severity indicators (mild/moderate/significant)
  - Skin type badge
  - Moisture / Oiliness / Elasticity meters (circular gauge or horizontal bar)
  - "Compared to last scan" delta indicators
  - Recommended products based on analysis
  - "Save Scan" CTA

### 3. DISCOVER (Products)
- Search bar with recent searches and trending queries
- Filter chips: Skin Type, Concern, Product Type, Price Range, Rating
- Category cards: Cleansers, Moisturizers, Serums, Sunscreen, Masks, Treatments
- Product grid: Cards with image, name, brand, rating stars, price, "Match %" (compatibility with user's skin)
- **Product Detail Page**:
  - Hero image with color-refraction background tint
  - Name, brand, price, rating
  - "Match Score" — how well it matches user's skin profile (with explanation)
  - Ingredients list with highlighting (green = good for your skin, yellow = neutral, red = potential irritant)
  - User reviews with star breakdown
  - "Similar Products" carousel
  - "Add to Routine" CTA

### 4. ROUTINE
- Toggle: AM ☀️ / PM 🌙
- Step list: Numbered routine steps (Cleanse → Tone → Serum → Moisturize → SPF)
- Each step: Product image, name, completion checkbox, timer option
- Overall completion progress ring
- Edit routine: Add/remove/reorder steps
- Routine streak integration: "Complete your routine to keep your streak!"

### 5. PROFILE
- Avatar/photo + Name + Level badge + Streak counter
- Skin Score trend chart (last 30 days line graph)
- Achievement badges gallery (earned + locked)
- XP progress bar to next level
- Scan history timeline
- Settings gear icon
- Stats grid: Total scans, Streak record, Products tried, Routines completed

---

## BUILD SPECIFICATIONS

### Technical Requirements
- Single self-contained HTML file
- Mobile viewport: 390×844px (iPhone 15 Pro) — use `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
- All CSS inline in `<style>` tags (no external files)
- All JS inline in `<script>` tags (no external files)
- Use CSS custom properties for the entire design token system
- Navigation between screens via JS — show/hide sections, no page reloads
- All icons as inline SVG (Lucide icon set aesthetic: 24px, 1.5–2px stroke, round linecap, round linejoin)
- Smooth transitions between screens (fade + slide, 0.3s)
- Interactive elements: tabs work, cards are tappable, filters toggle, routines can be checked off

### CSS Custom Properties to Define
```css
:root {
    /* Background layers */
    --bg-0: #07070C;
    --bg-1: #0F0F17;
    --bg-2: #16161F;
    --bg-3: #1E1E2A;
    
    /* Text */
    --text-primary: #F5F5F7;
    --text-secondary: rgba(245, 245, 247, 0.6);
    --text-tertiary: rgba(245, 245, 247, 0.35);
    
    /* Section accents */
    --accent-home: #4B9CD3;
    --accent-scan: #B8A9C9;
    --accent-discover: #F27059;
    --accent-routine: #7ECEC1;
    --accent-profile: #F5C542;
    
    /* Gamification */
    --color-success: #34D399;
    --color-warning: #FBBF24;
    --color-danger: #F87171;
    --color-streak: #FF6B35;
    --color-xp: #A78BFA;
    
    /* Glass */
    --glass-bg: rgba(255, 255, 255, 0.04);
    --glass-border: rgba(255, 255, 255, 0.06);
    --glass-blur: 16px;
    
    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    
    /* Radius */
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-full: 100px;
    
    /* Typography */
    --font-display: 'DM Sans', -apple-system, system-ui, sans-serif;
    --font-body: -apple-system, 'SF Pro Text', system-ui, sans-serif;
    
    /* Motion */
    --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1.0);
    --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1.0);
    --duration-fast: 0.15s;
    --duration-default: 0.3s;
    --duration-slow: 0.5s;
}
```

### Quality Bar
This HTML file will be shown to investors. Every detail matters:
- No placeholder rectangles — use realistic mock data (product names, skin scores, routine steps)
- No "Lorem ipsum" — all copy should be natural, feature-appropriate text
- Icons must be actual SVGs, not emoji or Unicode characters (emoji are fine for expressive elements like mood check-in and streak fire)
- Images can use gradient placeholders (mesh gradient fills sized to image aspect ratios) since we can't load external images
- Charts and progress indicators should show realistic data points
- The tab bar must actually switch between screens with smooth transitions
- Scroll behavior should feel native (momentum scroll, no janky overscroll)
- Touch targets: minimum 44×44px
- Status bar area: 54px safe area at top (iPhone notch)
- Home indicator area: 34px safe area at bottom

### What "Pixel Perfect" Means Here
- Consistent spacing — if cards have 12px gap, ALL cards have 12px gap. No eyeballing.
- Consistent radius — if cards are 16px, ALL cards are 16px. Check every element.
- Consistent typography — use the exact sizes and weights defined above. No ad-hoc font sizes.
- Alignment — all left edges align. All section headers have the same left padding. Grid items are equal width.
- Visual hierarchy — the most important element on each screen is immediately obvious through size, color, and position.
- Color consistency — glass surfaces all use the same `--glass-bg` and `--glass-border`. No custom one-off opacities.

---

## FINAL INSTRUCTION

Build the complete app as a single HTML file. Make it extraordinary. Make it the kind of app design that makes investors say "when can I download this?"
