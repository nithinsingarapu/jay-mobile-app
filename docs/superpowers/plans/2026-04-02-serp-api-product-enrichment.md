# SerpAPI Product Enrichment — Plan

> **Status:** PLANNED — waiting for user approval to build

## Goal

Enrich the 723 products in the JAY database with real-world data from Google Shopping via SerpAPI:
- **Prices** (₹ INR from Indian retailers)
- **Images** (product photos)
- **Ratings** (star ratings + review counts)
- **Buy links** (Nykaa, Amazon, Flipkart, etc.)

## Architecture

```
┌─────────────────┐     ┌────────────┐     ┌──────────────┐
│  JAY Backend     │────▶│  SerpAPI    │────▶│ Google       │
│  (enrichment     │     │  REST API   │     │ Shopping     │
│   script)        │     └────────────┘     └──────────────┘
│                  │                                │
│  Parse results   │◀───────────────────────────────┘
│  Update DB       │
└─────────────────┘
```

## Phase 1: Database Schema

Add columns to `products` table:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric(2,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_source text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_updated_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serp_enriched_at timestamptz;
```

Update the Product model and ProductOut schema to include new fields.

## Phase 2: SerpAPI Integration

### Script: `jay-backend/scripts/enrich_products.py`

```python
# Pseudocode
import serpapi
import asyncio
from app.database import get_db
from app.features.products.models import Product

SERP_API_KEY = os.environ["SERPAPI_KEY"]

async def enrich_product(product: Product, db):
    query = f"{product.brand} {product.name} buy India"
    
    results = serpapi.search({
        "engine": "google_shopping",
        "q": query,
        "location": "India",
        "gl": "in",
        "hl": "en",
        "api_key": SERP_API_KEY,
    })
    
    shopping_results = results.get("shopping_results", [])
    if not shopping_results:
        return
    
    best = shopping_results[0]
    
    product.price_inr = parse_price(best.get("price", ""))
    product.image_url = best.get("thumbnail")
    product.image_urls = [r.get("thumbnail") for r in shopping_results[:5] if r.get("thumbnail")]
    product.rating = best.get("rating")
    product.review_count = best.get("reviews", 0)
    product.buy_url = best.get("link")
    product.price_source = best.get("source", "Google Shopping")
    product.price_updated_at = datetime.utcnow()
    product.serp_enriched_at = datetime.utcnow()
    
    await db.commit()

async def main():
    async with get_db() as db:
        products = await db.execute(select(Product).where(Product.serp_enriched_at == None))
        for product in products.scalars():
            await enrich_product(product, db)
            await asyncio.sleep(1)  # Rate limit: 1 req/sec
```

### Rate Limiting & Cost

| Plan | Searches/mo | Cost | Coverage |
|------|------------|------|----------|
| Starter | 5,000 | $50/mo | Initial bulk enrichment (723 products) |
| Standard | 15,000 | $75/mo | + monthly refresh |

**Initial bulk:** 723 searches = fits in 1 month of Starter plan
**Monthly refresh:** Only refresh products where `price_updated_at` > 30 days

### Error Handling

- Products with no Google Shopping results → skip, mark as `serp_enriched_at = now()` with null values
- Rate limit hit → exponential backoff
- Parse failures → log and continue
- Batch processing: 50 products at a time, save progress

## Phase 3: Scheduled Refresh

### Backend Endpoint: `POST /api/v1/admin/enrich-products`

Protected admin endpoint that triggers enrichment for stale products:

```python
@router.post("/admin/enrich-products")
async def trigger_enrichment(
    user: AuthenticatedUser, 
    db: DbSession,
    limit: int = Query(50),
    stale_days: int = Query(30),
):
    # Only allow admin users
    # Find products where serp_enriched_at is null or > stale_days ago
    # Enrich up to `limit` products
    # Return count of enriched products
```

### Cron Job (Railway)

Run enrichment daily for 50 stale products:
```
0 3 * * * curl -X POST https://api.jay.app/api/v1/admin/enrich-products?limit=50
```

## Phase 4: Frontend Updates

### Product Card
- Show real `image_url` instead of gradient placeholder (fallback to gradient if null)
- Show `rating` + `review_count` instead of mock
- Show `price_inr` from enriched data

### Product Detail Screen
- Show real product images in hero area
- Show actual price from enriched data
- Show "Buy on {source}" button linking to `buy_url`
- Show rating + review count

### Types Update
```typescript
// Add to ProductOut interface:
rating: number | null;
review_count: number | null;
buy_url: string | null;
image_urls: string[] | null;
price_source: string | null;
price_updated_at: string | null;
```

## Cost Summary

| Item | One-time | Monthly |
|------|----------|---------|
| SerpAPI Starter | — | $50 |
| Initial enrichment (723 products) | 1 month of API usage | — |
| Monthly refresh (50/day) | — | Included in $50 |
| **Total** | **$0** | **$50/mo** |

## Implementation Order

1. Database migration (add columns)
2. Update Product model + schema
3. SerpAPI enrichment script
4. Run initial bulk enrichment
5. Update frontend to display real data
6. Add scheduled refresh endpoint
7. Set up cron job

## Prerequisites

- SerpAPI account + API key
- Environment variable: `SERPAPI_KEY`
- `pip install google-search-results` (SerpAPI Python client)
