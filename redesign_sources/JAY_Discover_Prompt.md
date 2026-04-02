# JAY — Discover Section: React Native Build Prompt

> **Attach these files:**
> 1. `JAY_Discover.html` — Open in browser. EXACT pixel reference for browse, search, and product detail screens.
> 2. `product_card_structure.md` — Full product detail architecture with all 5 tabs, field sources, and display rules.
> 3. `frontend_structure.md` — Existing app structure, design tokens, component patterns.

---

```
Build the complete Discover section for my React Native app. I've attached JAY_Discover.html — open it in browser and match every screen precisely.

The backend API is running. The existing app has auth, profile, chat, and routine already built. You're adding the Discover tab and product detail views.

READ ALL ATTACHED FILES BEFORE WRITING ANY CODE.

---

## EXISTING CODEBASE

Same stack as documented in frontend_structure.md:
- React Native 0.83.4 + Expo 55 + Expo Router
- TypeScript, Zustand 5, NativeWind + StyleSheet, Reanimated 4
- @gorhom/bottom-sheet, expo-haptics
- lib/api.ts (apiFetch with auto auth)
- constants/colors.ts (Apple dark mode tokens)

---

## BACKEND API

```
PRODUCTS:
GET  /api/v1/products                                   → ProductOut[] with pagination
     ?q=vitamin+c                                       → full-text search
     &brand=Minimalist                                  → filter by brand
     &category=serum                                    → filter by category
     &min_price=200&max_price=1000                      → price range
     &limit=20&offset=0                                 → pagination

GET  /api/v1/products/{id}                              → Full ProductOut

GET  /api/v1/products/brands                            → string[] (distinct brand names)

GET  /api/v1/products/categories                        → string[] (distinct categories)
```

ProductOut shape:
```json
{
  "id": 42,
  "name": "CeraVe Foaming Facial Cleanser",
  "brand": "CeraVe",
  "category": "cleanser",
  "subcategory": null,
  "price_inr": 599.0,
  "size_ml": 236.0,
  "key_ingredients": ["glycerin", "niacinamide", "panthenol", "sodium cocoyl isethionate"],
  "full_ingredients": "Aqua, Glycerin, Cetearyl Alcohol...",
  "description": "A gentle, foaming cleanser that removes excess oil...",
  "image_url": null,
  "source_url": "https://...",
  "is_available": true,
  "created_at": "2026-03-28T...",
  "updated_at": "2026-03-28T..."
}
```

Note: The backend returns product data from the database. Match scores, JAY scores, report cards, expert opinions, and alternatives are NOT in the API yet — use mock data for these. Structure the code so real data can replace mocks later.

---

## SCREENS TO BUILD (3 total + bottom sheets)

### SCREEN 1: Browse (app/(tabs)/discover.tsx)

This is a main tab screen. Scroll structure:

```
ScrollView (pull to refresh)
├── Large Title "Discover" (34px, 700)
├── Search bar (tappable → pushes to Search screen)
│   - magnifying glass icon + "Products, ingredients, brands..."
│   - ft background, 10px radius
│   - Tapping opens search screen, NOT inline keyboard
├── Filter chips (horizontal scroll)
│   - "All" (active by default), "Cleansers", "Serums", "Moisturizers",
│     "Sunscreen", "Toners", "Treatments", "Eye Care"
│   - Active chip: systemBlue bg, white text
│   - Inactive: ft background, white text
│   - Selecting a chip filters the product grid below
├── Section: "Categories" (with "See All" link)
│   - 3x2 grid of category cards
│   - Each card: subtle colored gradient bg + border, emoji icon, name, count
│   - Colors: coral/blue/green/yellow/indigo/purple per category
│   - Tapping a category → sets the filter chip + scrolls to product grid
├── Section: "Popular brands" (with "See All" link)
│   - Horizontal scroll of brand circles
│   - Each: 60px circle with abbreviation, brand name below
│   - Tapping a brand → filters products by that brand
├── Section: "Best for your skin"
│   - 2-column product grid (FlatList with numColumns=2)
│   - Each ProductCard shows: gradient placeholder, match badge (top right),
│     name (14px, 500, 2-line clamp), brand (12px, secondary),
│     price (16px, 700), rating (star + score + count)
│   - Match badge: "94% match" — use mock match percentages for now
│   - Tapping → pushes to ProductDetailScreen
│   - Pagination: load 20 at a time, onEndReached loads more
```

Data loading:
- On mount: GET /products?limit=20 (all products)
- On filter chip: GET /products?category={chip}&limit=20
- On brand tap: GET /products?brand={brand}&limit=20
- GET /products/brands for brand list
- GET /products/categories for category list + counts

### SCREEN 2: Search (pushed view)

Pushing to this screen focuses the search input immediately.

```
View
├── Search header row
│   - TextInput (autofocus, ft bg, magnifying glass icon)
│   - "Cancel" text button → router.back()
├── [if no query typed yet]
│   ├── Section: "Recent searches"
│   │   - Grouped table: clock icon + search term + X to remove
│   │   - Store recent searches in AsyncStorage (max 10)
│   ├── Section: "Trending"
│       - Grouped table: trend icon (orange) + product name + category
│       - Tapping → pushes to product detail
├── [if query typed]
│   - Live search results (debounced 300ms)
│   - GET /products?q={query}&limit=15
│   - Results as grouped table rows: name + brand + category + price
│   - Tapping → pushes to product detail
```

### SCREEN 3: Product Detail (pushed view, tab bar hides)

This is the richest screen. It has 5 content tabs.

```
ScrollView
├── Nav bar: back "Discover" + share + bookmark icons
├── Product hero (220px gradient placeholder)
├── Certification tags (horizontal wrap: Fragrance-Free, Non-Comedogenic, etc.)
├── Brand (12px, uppercase, letter-spacing 1.2)
├── Product name (24px, 700)
├── Meta row: price (22px, 700) + size + ★ rating + review count
├── Skin type targets (green badges: Oily, Normal, Combination)
├── Score banner (3 columns: JAY Score, Safety, Match %)
│   - Vertical separators between columns
│   - Score values 24px/700, labels 10px uppercase
├── Tab navigation bar (horizontal scroll, sticky)
│   - Overview | Ingredients | Prices | Experts | Alternatives
│   - Active tab: white text + 2px blue underline
│   - Inactive: secondary text, no underline
│   - Tapping switches content below
│
├── [Overview tab]
│   ├── "JAY Says" quote card (blue left border, italic text)
│   ├── Report Card: 2x3 grid (Ingredient Quality, Formula Safety,
│   │   Value for Money, Brand Transparency, User Satisfaction, Derm Endorsed)
│   │   Each cell: score/10, label, 3px progress bar
│   ├── "Why JAY Recommends": grouped table with green checkmarks (max 4)
│   ├── "Things to Know": green + for positives, orange – for limitations
│   └── Action buttons: "Add to Routine" (blue) + "Full Research" (secondary)
│
├── [Ingredients tab]
│   ├── Formula richness score (36px centered) + description
│   ├── Full INCI list (highlighted: green for beneficial, blue for functional)
│   ├── Key ingredient cards: name, efficacy badge, concentration, description
│   └── Safety flags: grouped table with green checkmarks (pH, comedogenicity, pregnancy)
│
├── [Prices tab]
│   ├── Best value pick card (dark bg, price + size + platform + shop button)
│   ├── All sizes: grouped table (size + platform + price, best value highlighted)
│   └── Price history: 6-month bar chart with current month highlighted blue
│
├── [Experts tab]
│   ├── Dermatologist opinion cards: name, credentials, platform, verdict badge, quote
│   │   Verdict: green "Positive" or orange "Mixed"
│   └── Clinical evidence cards: study name, source, finding, funding badge
│
├── [Alternatives tab]
│   ├── Context text (why alternatives exist)
│   └── Alternative cards: use-case label, product name, price comparison,
│       + benefits list, best-for text, trade-off in italic
```

Data:
- On mount: GET /products/{id} for the product data
- Match %, JAY score, report card, expert opinions, alternatives = MOCK DATA
- Structure all mock data in a separate mockProductDetail.ts file
- The mock structure should match the product_card_structure.md architecture exactly

---

## ZUSTAND STORE — stores/discoverStore.ts

```typescript
interface DiscoverState {
  // Products
  products: ProductOut[];
  isLoadingProducts: boolean;
  hasMore: boolean;
  offset: number;

  // Filters
  activeCategory: string | null;  // null = "All"
  activeBrand: string | null;
  searchQuery: string;

  // Reference data
  brands: string[];
  categories: string[];

  // Selected product
  selectedProduct: ProductOut | null;
  isLoadingProduct: boolean;

  // Recent searches
  recentSearches: string[];

  // Actions
  loadProducts: (reset?: boolean) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  loadProduct: (id: number) => Promise<void>;
  loadBrands: () => Promise<void>;
  loadCategories: () => Promise<void>;
  setCategory: (cat: string | null) => void;
  setBrand: (brand: string | null) => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearFilters: () => void;
}
```

---

## FILE STRUCTURE

```
components/discover/
├── DiscoverHeader.tsx              # Large title "Discover"
├── SearchBar.tsx                   # Tappable search bar (not input — navigates to search)
├── FilterChips.tsx                 # Horizontal scroll filter chips
├── CategoryGrid.tsx                # 3x2 grid of category cards
├── CategoryCard.tsx                # Single category (gradient bg, emoji, name, count)
├── BrandScroll.tsx                 # Horizontal brand circle scroll
├── BrandCircle.tsx                 # Single brand (circle + abbreviation + name)
├── ProductGrid.tsx                 # 2-column FlatList of ProductCards
├── ProductCard.tsx                 # Card: gradient, match badge, name, brand, price, rating
├── ProductHero.tsx                 # Detail: hero image area
├── CertificationTags.tsx           # Horizontal badge list
├── ProductIdentity.tsx             # Brand + name + meta row + skin type targets
├── ScoreBanner.tsx                 # 3-column score: JAY Score, Safety, Match
├── ProductTabBar.tsx               # Sticky tab nav: Overview/Ingredients/Prices/Experts/Alternatives
├── OverviewTab.tsx                 # JAY Says + Report Card + Recommends + Things to Know
├── JaySaysCard.tsx                 # Blue left border quote card
├── ReportCardGrid.tsx              # 2x3 grid of score cells with progress bars
├── IngredientsTab.tsx              # Formula score + INCI + ingredient cards + safety
├── IngredientCard.tsx              # Name, badge, concentration, description
├── PricesTab.tsx                   # Best value + sizes + price history
├── ExpertsTab.tsx                  # Derm cards + clinical studies
├── DermOpinionCard.tsx             # Expert name, credentials, verdict, quote
├── AlternativesTab.tsx             # Context + alternative cards
├── AlternativeCard.tsx             # Use-case, name, price, benefits, trade-off
├── SearchHeader.tsx                # Input + Cancel button
├── RecentSearches.tsx              # Grouped table with clock icons
├── SearchResults.tsx               # Live results grouped table
├── TrendingSearches.tsx            # Trending products grouped table

screens/
├── DiscoverScreen.tsx              # Main tab: browse page
├── SearchScreen.tsx                # Pushed: search with live results
├── ProductDetailScreen.tsx         # Pushed: full product with 5 tabs

stores/
└── discoverStore.ts

services/
└── products.ts                     # API service functions

types/
└── product.ts                      # TypeScript interfaces

data/
└── mockProductDetail.ts            # Mock: scores, experts, alternatives, claims
```

---

## MOCK DATA STRUCTURE (data/mockProductDetail.ts)

```typescript
// This file provides mock data for fields not yet in the API.
// Structure matches product_card_structure.md exactly.
// Replace with real API data when the research pipeline is built.

export interface ProductDetailMock {
  match_percentage: number;
  jay_score: number;
  formula_safety: number;
  derm_endorsed: number;
  report_card: {
    ingredient_quality: number;
    formula_safety: number;
    value_for_money: number;
    brand_transparency: number;
    user_satisfaction: number;
    derm_endorsement: number;
  };
  jay_says: string;
  why_recommends: string[];
  positives: string[];
  limitations: string[];
  certifications: string[];
  skin_type_targets: string[];
  ingredients_detail: {
    name: string;
    concentration: string;
    efficacy: 'efficacious' | 'likely_efficacious' | 'functional';
    description: string;
  }[];
  safety_flags: { flag: string; status: string; safe: boolean }[];
  formula_richness: number;
  price_sizes: { size: string; platform: string; price: number; best_value: boolean }[];
  expert_opinions: {
    name: string;
    credentials: string;
    platform: string;
    verdict: 'positive' | 'mixed' | 'negative';
    quote: string;
  }[];
  clinical_studies: {
    name: string;
    source: string;
    finding: string;
    funding: 'independent' | 'brand-funded' | 'in-progress';
  }[];
  alternatives: {
    use_case: string;
    name: string;
    brand: string;
    price: string;
    benefits: string[];
    best_for: string;
    trade_off: string;
  }[];
}

// Map product IDs to mock detail data
export const mockDetails: Record<number, ProductDetailMock> = {
  // Populate with 4-6 products matching your database
};
```

Create mock data for at least these products:
- CeraVe Foaming Cleanser (match the data in the HTML mockup exactly)
- Minimalist 10% Vitamin C
- Minimalist 10% Niacinamide
- La Shield Mineral SPF 50
- Dot & Key Barrier Repair
- Plum Green Tea Toner

---

## COMPONENT SPECS (match HTML mockup)

### ProductCard
- bg2 background, 14px radius
- Gradient placeholder for image (150px height)
- Match badge: absolute top-right, blue bg with white text, backdrop blur
- Name: 14px/500, 2-line clamp
- Brand: 12px, secondary
- Price: 16px/700
- Rating: yellow star + score + count in tertiary
- Press animation: scale(0.97) with Reanimated spring

### ScoreBanner
- bg2 background, 14px radius, horizontal flex
- Three items: JAY Score X/10, Safety X/10, Match X%
- Vertical .33px separators between items
- Values: 24px/700, "/10" or "%" suffix in 14px tertiary
- Labels: 10px, uppercase, .8px letter-spacing, secondary

### ProductTabBar
- Horizontal scroll, 0.33px bottom border
- Active: white text + 2px blue bottom border
- Inactive: secondary text, no border
- Tab switching changes content below (use state, not navigation)

### ReportCardGrid
- 2x3 grid, 8px gap
- Each cell: bg2, 12px radius, 14px padding
- Score: 24px/700 + "/10" in tertiary
- Label: 11px, uppercase, .5px spacing, secondary
- Progress bar: 3px height, bg4 track, white fill proportional to score

### IngredientCard
- bg2, 12px radius, 14px padding
- Top row: name (15px/600) + efficacy badge (green "Efficacious" or teal "Functional")
- Concentration: 12px, tertiary
- Description: 13px, secondary, 1.4 line height

### DermOpinionCard
- bg2, 12px radius, 14px padding
- Top: name (15px/600) + credentials (12px secondary)
- Verdict badge: green bg for positive, orange bg for mixed
- Quote: 13px, secondary, italic

### AlternativeCard
- bg2, 12px radius, 16px padding
- Use-case label: 10px, uppercase, .8px spacing, secondary
- Product name: 17px/600
- Price comparison: 13px secondary
- Benefits: green "+" prefix, 13px white
- Trade-off: 12px tertiary italic

---

## NAVIGATION

In app/(screens)/_layout.tsx add:
```typescript
<Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
<Stack.Screen name="product-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
```

- Search: `router.push({ pathname: 'search' })`
- Product detail: `router.push({ pathname: 'product-detail', params: { productId: id } })`
- Tab bar hides on pushed views, returns on pop

---

## RULES

1. Match JAY_Discover.html EXACTLY
2. Use Colors from constants/colors.ts
3. All Apple dark mode tokens: bg #000/#1C1C1E, separators 0.33px
4. Product data from API, enrichment data from mocks
5. Mock data structured to match product_card_structure.md
6. Search debounced 300ms
7. Recent searches stored in AsyncStorage
8. Filter chips control the product grid
9. Category cards set the active filter chip
10. Brand circles filter by brand
11. Product grid paginates (20 per page, onEndReached)
12. Tab bar hides on pushed views
13. Product detail tabs switch content in-place (no navigation)
14. "Add to Routine" button on product detail should be functional (calls existing routine store)
15. Pull-to-refresh on browse page
16. No git commands, all files via tool use

---

## TESTING

1. Discover tab shows large title, search bar, filters, categories, brands, product grid
2. Tapping search bar pushes to search screen with autofocus
3. Typing in search triggers debounced API call after 300ms
4. Search results show as grouped table rows
5. Tapping a result pushes to product detail
6. "Cancel" pops back to browse
7. Recent searches persist across app restarts (AsyncStorage)
8. Filter chips filter the product grid
9. Tapping a category card sets the filter and refreshes grid
10. Tapping a brand circle filters by that brand
11. Product grid loads 20 products, scrolling loads more
12. Product cards show name, brand, price, rating, match badge
13. Tapping product card pushes to detail (tab bar hides)
14. Detail shows hero, tags, brand, name, price, rating, skin types
15. Score banner shows 3 columns with separators
16. 5 tabs switch content without navigation
17. Overview tab: JAY Says, report card grid, recommends, things to know
18. Ingredients tab: formula score, INCI with highlights, ingredient cards, safety flags
19. Prices tab: best value, all sizes, price history chart
20. Experts tab: derm opinion cards with verdict badges, clinical studies
21. Alternatives tab: context text + alternative cards with benefits/trade-offs
22. "Add to Routine" opens routine store's add step flow
23. Back button shows "Discover" and tab bar reappears
24. Pull-to-refresh reloads products
25. All animations: card press scale, tab switch, stagger load
```
