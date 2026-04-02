# JAY — Product Database & Discover Section: Complete Documentation

> Last updated: 2026-04-03

---

## Overview

The Product Database is JAY's comprehensive skincare/haircare/bodycare product catalog with 687 products across 23 brands. It powers the Discover tab where users browse, search, filter, and view detailed product analysis. Products are enriched with real-world pricing, ratings, and images via the Serper.dev Google Shopping API.

---

## Architecture

```
┌─ Frontend (React Native) ──────────┐       ┌─ Backend (FastAPI) ──────────────┐
│                                     │       │                                  │
│  Discover Tab                       │       │  Router (router.py)              │
│  ├── Dept tabs (Skin/Hair/Body)     │──────▶│  ├── GET /products (search)      │
│  ├── Subcategory chips              │       │  ├── GET /products/{id}          │
│  ├── Filter modal (tier/brand/sort) │       │  ├── GET /products/brands        │
│  ├── Product grid                   │       │  ├── GET /products/categories    │
│  └── Sort modal                     │       │  └── POST /products/{id}/enrich  │
│                                     │       │                                  │
│  Search Screen                      │       │  Service (service.py)            │
│  ├── Debounced search               │       │  ├── search_products()           │
│  ├── Recent searches (AsyncStorage) │       │  ├── get_product_by_id()         │
│  └── Live results                   │       │  └── search_for_routine_step()   │
│                                     │       │                                  │
│  Product Detail Screen              │       │  Enrichment (enrichment.py)      │
│  ├── Real data (name/price/rating)  │       │  ├── Serper.dev Shopping API     │
│  ├── Mock data (scores/experts)     │       │  ├── Serper.dev Images API       │
│  └── 5 content tabs                 │       │  └── Multi-query fallback        │
│                                     │       │                                  │
│  Store (discoverStore.ts)           │       │  Models (SQLAlchemy)             │
│  └── All filtering is client-side   │       │  └── Product (27 columns)        │
└─────────────────────────────────────┘       └──────────────────────────────────┘
```

---

## Database Schema

### Product Table (27 columns)

#### Core Identity
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | Integer (PK) | No | Auto-increment |
| `name` | String(500) | No | Full product name |
| `brand` | String(200) | No | Brand name (indexed) |
| `category` | String(50) | No | Raw backend category (indexed) |
| `subcategory` | String(100) | Yes | Original source subcategory |
| `product_type` | String(50) | Yes | Form: cream, gel, liquid, serum, etc. |
| `texture` | String(50) | Yes | Feel: cream, gel, lotion, foam, oil, etc. |

#### Description & Usage
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `description` | Text | Yes | Full product description (100% populated) |
| `how_to_use` | Text | Yes | Usage instructions (100% populated) |

#### Ingredients
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `key_ingredients` | String[] | Yes | Parsed array of active ingredients (100% populated) |
| `full_ingredients` | Text | Yes | Raw INCI list string (100% populated) |

#### Concerns & Suitability
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `concerns` | String[] | Yes | Skin concerns addressed: acne, dullness, pigmentation, etc. (100%) |
| `suitable_for` | JSONB | Yes | `{ skin_types[], conditions[], pregnancy_safe, fungal_acne_safe }` (99%) |

#### Pricing & Media
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `price_inr` | Numeric(10,2) | Yes | Price in INR (64% populated via Serper) |
| `image_url` | Text | Yes | Product image URL (64% populated via Serper) |
| `product_url` | Text | Yes | Source product page link (100%) |

#### Formulation
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `formulation` | JSONB | Yes | `{ ph, fragrance_free, alcohol_free, silicone_free, paraben_free }` (99%) |

#### Classification (Added for filtering)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `brand_tier` | String(30) | Yes | pharma, derm_grade, dtc_science, consumer, premium_hair (indexed) |
| `normalized_category` | String(30) | Yes | Consolidated: cleansers, serums, moisturizers, etc. (indexed) |
| `department` | String(20) | Yes | skincare, haircare, bodycare (indexed) |

#### Enrichment (from Serper.dev)
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `rating` | Numeric(2,1) | Yes | Star rating 0.0-5.0 (64% populated) |
| `review_count` | Integer | Yes | Number of reviews (64% populated) |
| `buy_url` | Text | Yes | Direct purchase link |
| `image_urls` | JSONB | Yes | Array of up to 10 image URLs |
| `price_source` | String(100) | Yes | Retailer name (Amazon.in, Nykaa, etc.) |
| `price_updated_at` | DateTime | Yes | When price was last fetched |
| `serp_enriched_at` | DateTime | Yes | When enrichment ran (null = not enriched) |

#### Status
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `is_available` | Boolean | No | Default true |
| `created_at` | DateTime | No | UTC timestamp |
| `updated_at` | DateTime | No | UTC timestamp |

### Data Completeness

| Field | Products | Coverage |
|-------|----------|----------|
| name, brand, category | 687 | 100% |
| description | 687 | 100% |
| how_to_use | 687 | 100% |
| key_ingredients | 687 | 100% |
| full_ingredients | 687 | 100% |
| concerns | 687 | 100% |
| suitable_for | 686 | 99% |
| formulation | 686 | 99% |
| product_url | 687 | 100% |
| **price_inr** | **444** | **64%** |
| **image_url** | **446** | **64%** |
| **rating** | **443** | **64%** |
| **review_count** | **443** | **64%** |
| brand_tier | 686 | 99% |
| normalized_category | 686 | 99% |
| department | 687 | 100% |

**Average price:** ₹1,210 | **Average rating:** 4.6 stars

---

## Category Taxonomy

### Three-Level Hierarchy

```
Department (3)
  └── Normalized Category (20)
        └── Raw Backend Category (44)
```

### Department Breakdown

| Department | Products | Normalized Categories |
|------------|----------|----------------------|
| **Skincare** | 518 | cleansers, serums, moisturizers, sunscreen, toners, treatments, eye_care, masks_exfoliants, lip_care |
| **Haircare** | 114 | shampoo, conditioner, hair_serums, hair_oils, hair_masks, scalp_care, styling |
| **Bodycare** | 55 | body_wash, body_lotion, body_scrubs, body_treatment |

### Skincare Categories (518 products)

| Normalized Category | Count | Raw Categories Included |
|---------------------|-------|------------------------|
| Moisturizers | 116 | moisturizer, face-moisturiser |
| Serums | 99 | serum, face-serum |
| Sunscreen | 94 | sunscreen |
| Cleansers | 92 | cleanser, face-cleanser, face-wash, micellar-water |
| Treatments | 64 | treatment, face-treatment, leave-in-treatment |
| Toners | 18 | toner, face-toner, tonic, essence |
| Eye Care | 18 | eye-care, eye-cream, eye-serum |
| Lip Care | 11 | lip-balm, lip-care, lip-treatment |
| Masks & Exfoliants | 5 | mask, exfoliant |

### Haircare Categories (114 products)

| Normalized Category | Count | Raw Categories Included |
|---------------------|-------|------------------------|
| Shampoo | 72 | shampoo |
| Conditioner | 16 | conditioner, leave-in-conditioner |
| Hair Masks | 9 | hair-mask |
| Hair Serums | 6 | hair-serum |
| Styling | 5 | styling, heat-protectant |
| Hair Oils | 4 | hair-oil |
| Scalp Care | 2 | scalp-care |

### Bodycare Categories (55 products)

| Normalized Category | Count | Raw Categories Included |
|---------------------|-------|------------------------|
| Body Treatment | 21 | body-treatment, body-care, foot-care, roll-on |
| Body Wash | 16 | body-wash, body-cleanser |
| Body Lotion | 15 | body-lotion, body-cream |
| Body Scrubs | 3 | body-scrub, body-exfoliator |

---

## Brand Classification

### Brand Tiers (5 tiers)

| Tier | Label | Products | Brands |
|------|-------|----------|--------|
| `derm_grade` | Dermatology Brands | 258 | Bioderma, La Roche-Posay, CeraVe, Cetaphil, Eucerin, ISDIN, Sesderma, Sebamed, Fixderma, Ducray |
| `dtc_science` | Science-Backed DTC | 221 | Minimalist, The Derma Co, Re'equil, Dr. Sheth's, Chemist at Play |
| `consumer` | Consumer Brands | 74 | Dot & Key, L'Oréal Paris |
| `premium_hair` | Premium Haircare | 72 | Kérastase, Bare Anatomy |
| `pharma` | Medical / Pharma | 61 | Cipla, Glenmark, Dr. Reddy's |

### All 23 Brands

| Brand | Products | Tier | Departments |
|-------|----------|------|-------------|
| Minimalist | 63 | dtc_science | Skincare, Haircare, Bodycare |
| Bioderma | 56 | derm_grade | Skincare, Haircare, Bodycare |
| The Derma Co | 49 | dtc_science | Skincare, Haircare |
| Dot & Key | 42 | consumer | Skincare, Haircare, Bodycare |
| Chemist at Play | 40 | dtc_science | Skincare, Bodycare |
| Dr. Sheth's | 39 | dtc_science | Skincare |
| Bare Anatomy | 36 | premium_hair | Haircare |
| Kérastase | 36 | premium_hair | Haircare |
| Cetaphil | 34 | derm_grade | Skincare, Bodycare |
| L'Oréal Paris | 32 | consumer | Skincare, Haircare |
| ISDIN | 31 | derm_grade | Skincare |
| Re'equil | 30 | dtc_science | Skincare, Haircare |
| Glenmark | 30 | pharma | Skincare, Haircare |
| Sebamed | 26 | derm_grade | Skincare, Haircare, Bodycare |
| Fixderma | 25 | derm_grade | Skincare, Haircare, Bodycare |
| Sesderma | 25 | derm_grade | Skincare, Haircare |
| Ducray | 23 | derm_grade | Skincare, Haircare, Bodycare |
| Cipla | 20 | pharma | Skincare, Haircare |
| Eucerin | 15 | derm_grade | Skincare |
| CeraVe | 13 | derm_grade | Skincare, Bodycare |
| Dr. Reddy's | 11 | pharma | Skincare, Haircare |
| La Roche-Posay | 10 | derm_grade | Skincare |

---

## Enrichment Pipeline (Serper.dev)

### How It Works

```
Product in DB
  │
  ├── Query 1: "{brand} {name} price India"
  │   └── Parse: price, image, rating, reviews, link, source
  │
  ├── Query 2 (if missing fields): "{brand} {name} buy online India"
  │   └── Fill remaining fields from additional results
  │
  ├── Query 3 (if still missing): "{name} skincare India"
  │   └── Broader search as last resort
  │
  ├── Image Fallback: Google Images "{brand} {name} product"
  │   └── Only if no image found in shopping results
  │
  └── Save to DB: price_inr, image_url, rating, review_count, buy_url, price_source
```

### Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/v1/products/{id}/enrich` | Enrich single product (user-triggered "Refresh" button) | Required |
| `POST /api/v1/products/admin/enrich-bulk` | Bulk enrich un-enriched products | Required |

### Bulk Script

```bash
cd jay-backend
.venv\Scripts\Activate.ps1
$env:SERPER_API_KEY="your_key"
python scripts/enrich_all_products.py --batch-size 50 --delay 0.5
```

- Processes products with `serp_enriched_at IS NULL`
- Safe to stop and restart (skips already-enriched)
- Each product gets its own DB session (failure isolation)
- Rate limited: 0.5s between requests

### Cost

| Plan | Searches | Cost | Coverage |
|------|----------|------|----------|
| Free tier | 2,500 | $0 | ~400 products (1-3 queries each) |
| Paid | 50,000 | $50/mo | All 687 + monthly refresh |

---

## Discover Screen — Filter System

### Filter Architecture

All 687 products load in one API call on mount. All filtering is **100% client-side** via `useMemo`:

```
store.products (687)
  │
  ├── Filter: department === activeDept
  │   └── e.g. "skincare" → 518 products
  │
  ├── Filter: normalized_category === activeSub (if selected)
  │   └── e.g. "serums" → 99 products
  │
  ├── Filter: brand_tier === activeTier (if not "all")
  │   └── e.g. "derm_grade" → filtered to derm brands only
  │
  ├── Filter: brand === activeBrand (if selected)
  │   └── e.g. "CeraVe" → only CeraVe products
  │
  └── Sort: by sortBy option
      └── e.g. "rating" → highest rated first
```

### Filter Controls

| Control | Location | Type |
|---------|----------|------|
| Department | Tab bar (3 tabs) | Single select |
| Subcategory | Chip scroll (with counts) | Single select + "All" |
| Brand Tier | Filter modal | Single select |
| Brand | Filter modal | Single select + "All" |
| Sort | Sort pill + modal | Single select |

### Filter Modal (Buffered)

The filter modal uses **local buffered state** — selections don't affect the product grid until "Apply Filters" is tapped. This prevents lag from re-rendering 687 products on every tap.

Sections:
1. **Sort By** — Popular, Highest Rated, Price Low→High, Price High→Low, A→Z
2. **Brand Type** — All, Dermatology, Medical/Pharma, Science-Backed DTC, Consumer, Premium Hair
3. **Brand** — All + department-specific brand list

### Active Filter Indicators

Active filters show as removable pills in the toolbar:
- Brand tier pill (indigo) — e.g. "Dermatology ✕"
- Brand pill (orange) — e.g. "CeraVe ✕"
- Sort pill shows current sort order
- Tapping ✕ removes that filter instantly

---

## Product Detail Screen — 5 Tabs

### Data Sources

| Section | Source | Coverage |
|---------|--------|----------|
| Hero image | `product.image_url` (real) or gradient (fallback) | 64% real |
| Brand, name | `product.brand`, `product.name` (real) | 100% |
| Description | `product.description` (real) | 100% |
| Price | `product.price_inr` (real, enriched) | 64% |
| Rating + reviews | `product.rating`, `product.review_count` (real, enriched) | 64% |
| Price source | `product.price_source` (real) | 64% |
| Certification tags | `product.formulation` flags (real) | 99% |
| Skin type badges | `product.suitable_for.skin_types` (real) | 99% |
| Concern badges | `product.concerns` (real) | 100% |
| JAY Score, Match % | Mock data (pattern-matched) | 100% mock |
| Report Card | Mock data | 100% mock |
| JAY Says | Mock data | 100% mock |
| Expert Opinions | Mock data | 100% mock |
| Clinical Studies | Mock data | 100% mock |
| Alternatives | Mock data | 100% mock |
| Price comparisons | Mock data | 100% mock |

### Tab 1: Overview

- **JAY Says** — Blue left-border card with AI recommendation (mock)
- **Report Card** — 2x3 grid: ingredient quality, formula safety, value for money, brand transparency, user satisfaction, derm endorsement (mock, /10 scores with progress bars)
- **Why JAY Recommends** — Green checkmark bullet list (mock)
- **Things to Know** — Green "+" positives, orange "−" limitations (mock)
- **Action Buttons** — "Add to Routine" (navigates to routine screen) + "Full Research" (coming soon alert)

### Tab 2: Ingredients

- **Formula Richness** — Large centered score (mock)
- **Full INCI List** — Raw ingredient text (real: `product.full_ingredients`)
- **Key Ingredients** — Cards with name, efficacy badge (Efficacious/Functional), concentration, description (mock detail, real ingredient names)
- **Safety Flags** — Grouped table built from real `product.formulation` data (fragrance-free, paraben-free, pH, pregnancy-safe, etc.), falls back to mock if no real data

### Tab 3: Prices

- **Best Value** — Highlighted card with price + platform + "Shop" button (mock)
- **All Sizes** — Price comparison table across retailers (mock)
- **Price History** — 6-month bar chart (mock)

### Tab 4: Experts

- **Dermatologist Opinions** — Cards with name, credentials, platform, verdict badge (Positive/Mixed), italic quote (mock)
- **Clinical Studies** — Study name, source, finding, funding badge (independent/brand-funded) (mock)

### Tab 5: Alternatives

- **Context Text** — Why alternatives exist
- **Alternative Cards** — Use-case label, product name, price comparison, green "+" benefits, italic trade-off text (mock)

### Enrichment Button

"Get prices & ratings" / "Refresh prices & ratings" button on detail screen:
- Calls `POST /products/{id}/enrich`
- Shows loading spinner while fetching
- On success: reloads product data, shows alert with source
- On error: shows error alert
- Uses fresh DB session (no transaction conflicts)

---

## Search Screen

### Flow

```
User taps search bar → Search screen (autofocus)
  │
  ├── [No query typed]
  │   ├── Recent Searches (from AsyncStorage, max 10)
  │   │   └── Clock icon + term + X to remove
  │   └── Trending (hardcoded 5 items)
  │       └── Orange trend icon + product name + category
  │
  └── [Query typed (300ms debounce)]
      ├── Loading: ActivityIndicator
      ├── Results: grouped table rows (name, brand, category, price)
      │   └── Tap → addRecentSearch() + navigate to product detail
      └── Empty: "No products found"
```

### Recent Searches

- Persisted to `AsyncStorage` under key `@jay_recent_searches`
- Maximum 10 items, newest first
- Adding duplicate moves it to front
- User can remove individual items with X button

---

## Product Card Display

```
┌──────────────────────┐
│  [Image or Emoji]    │  ← 140px, real image if available
│  ┌─────┐      ┌───┐ │
│  │ CAT │      │92%│ │  ← Category badge (bottom-left), Match % (top-right)
│  └─────┘      └───┘ │
├──────────────────────┤
│ Product Name         │  ← 14px, 2-line clamp
│ Brand Name           │  ← 11px, secondary
│ ₹599    ⭐ 4.3 (120)│  ← Price + rating OR formulation badge
└──────────────────────┘
```

- **Image**: Real `image_url` if starts with "http", else category emoji on colored bg
- **Category badge**: Color-coded by product category
- **Match badge**: Deterministic mock formula `80 + ((id * 7 + 13) % 20)`
- **Rating**: Real if enriched, else formulation badge (e.g. "Fragrance-Free")
- **Press animation**: Spring scale to 0.97

---

## Top Skin Concerns in Database

| Concern | Products |
|---------|----------|
| Dullness | 126 |
| Hyperpigmentation | 89 |
| Dark spots | 88 |
| Dehydration | 79 |
| Acne | 75 |
| Photoaging | 71 |
| Uneven skin tone | 64 |
| UV protection | 63 |
| Oiliness | 58 |
| Fine lines | 57 |
| Impaired skin barrier | 56 |
| Melasma | 51 |
| Dryness | 51 |
| Sensitivity | 46 |
| Blackheads | 42 |
| Enlarged pores | 42 |

---

## Product Types & Textures

### Product Types (top 15)

| Type | Count |
|------|-------|
| Liquid | 284 |
| Cream | 140 |
| Serum | 43 |
| Sunscreen | 31 |
| Gel | 26 |
| Moisturiser | 26 |
| Cleanser | 19 |
| Lotion | 13 |
| Shampoo | 11 |
| Roll-on | 8 |
| Hair-mask | 8 |
| Oil | 7 |

### Textures (top 10)

| Texture | Count |
|---------|-------|
| Liquid | 304 |
| Cream | 164 |
| Gel | 82 |
| Lotion | 41 |
| Serum | 35 |
| Balm | 15 |
| Foam | 14 |
| Oil | 11 |
| Solid | 5 |
| Gel-cream | 4 |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/products` | No | Search/filter products (q, brand, category, price range, limit, offset) |
| GET | `/api/v1/products/{id}` | No | Single product detail |
| GET | `/api/v1/products/brands` | No | Distinct brand names |
| GET | `/api/v1/products/categories` | No | Distinct categories |
| POST | `/api/v1/products/{id}/enrich` | Yes | Trigger Serper enrichment for one product |
| POST | `/api/v1/products/admin/enrich-bulk` | Yes | Bulk enrich un-enriched products |

---

## File Structure

```
jay-app/
├── app/(tabs)/discover.tsx              # Main browse screen (dept/subcat/filter/sort/grid)
├── app/(screens)/search.tsx             # Search with debounce + recent + trending
├── app/(screens)/product-detail.tsx     # 5-tab product detail view
├── stores/discoverStore.ts              # Zustand store (all products + client-side filters)
├── services/products.ts                 # API service (search, getById, enrichProduct)
├── types/product.ts                     # ProductOut interface (27 fields)
├── data/mockProductDetail.ts            # Mock scores, experts, alternatives for 6 products
└── components/discover/
    ├── SearchBar.tsx                    # Tappable search pill (navigates to search screen)
    ├── ProductCard.tsx                  # 2-column card (image, name, brand, price, rating)
    ├── ProductGrid.tsx                  # 2-column grid layout (View-based, not FlatList)
    ├── ProductHero.tsx                  # Detail: hero image or gradient placeholder
    ├── BrandScroll.tsx                  # Horizontal brand circles with "All" option
    ├── CertificationTags.tsx           # Horizontal pills (fragrance-free, etc.)
    ├── ScoreBanner.tsx                  # 3-column score bar (JAY Score, Safety, Match)
    ├── ProductTabBar.tsx               # 5-tab horizontal nav with underline
    ├── ReportCardGrid.tsx              # 2x3 metric grid with progress bars
    ├── OverviewTab.tsx                 # JAY Says + Report Card + Recommends + Actions
    ├── IngredientsTab.tsx              # Formula score + INCI + ingredient cards + safety
    ├── PricesTab.tsx                   # Best value + sizes + price history
    ├── ExpertsTab.tsx                  # Derm opinions + clinical studies
    └── AlternativesTab.tsx            # Alternative product cards

jay-backend/app/features/products/
├── models.py                           # SQLAlchemy Product model (27 columns)
├── schemas.py                          # Pydantic ProductOut schema
├── service.py                          # Search, filter, routine step search
├── router.py                           # 6 API endpoints
└── enrichment.py                       # Serper.dev integration (shopping + images)

jay-backend/scripts/
├── seed_products.py                    # Import products from CSV (723 → 687 after dedup)
├── enrich_all_products.py              # Bulk enrichment script
└── classify_products.py                # Set brand_tier + normalized_category + department
```

---

## Known Limitations

1. **241 products have no price/image/rating** — Serper free tier exhausted; brands not indexed on Google Shopping India
2. **Match percentage is simulated** — deterministic formula from product ID, not a real matching algorithm
3. **Expert opinions and clinical studies are mock data** — realistic but authored, not sourced from publications
4. **Price comparisons (Prices tab) are entirely mock** — only one real price per product from Serper
5. **No price history tracking** — Serper only returns current prices
6. **No real-time inventory** — `is_available` flag is static
7. **All filtering is client-side** — loads 687 products at once; would need optimization for 10K+ products
8. **Recent searches are device-local** — not synced to backend or across devices
9. **No product reviews from users** — only aggregated Google Shopping ratings
10. **Category mapping is hardcoded** — new categories from product imports require manual mapping updates
