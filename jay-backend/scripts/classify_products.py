"""Classify all products: brand_tier, normalized_category, department."""
import asyncio
import asyncpg
import sys

DB_URL = "postgresql://postgres.rheofqhoosrhklikqdvp:FXRCMvwZtQuu4Yms@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

BRAND_TIERS = {
    "pharma": ["Cipla", "Glenmark", "Dr. Reddy's"],
    "derm_grade": ["Bioderma", "La Roche-Posay", "CeraVe", "Cetaphil", "Eucerin", "ISDIN", "Sesderma", "Sebamed", "Fixderma", "Ducray"],
    "dtc_science": ["Minimalist", "The Derma Co", "Re'equil", "Dr. Sheth's", "Chemist at Play"],
    "consumer": ["Dot & Key", "L'Oréal Paris"],
    "premium_hair": ["Kérastase", "Bare Anatomy"],
}

CATEGORY_MAP = {
    "cleanser": "cleansers", "face-cleanser": "cleansers", "face-wash": "cleansers", "micellar-water": "cleansers",
    "serum": "serums", "face-serum": "serums",
    "moisturizer": "moisturizers", "face-moisturiser": "moisturizers",
    "sunscreen": "sunscreen",
    "toner": "toners", "face-toner": "toners", "tonic": "toners", "essence": "toners",
    "treatment": "treatments", "face-treatment": "treatments", "leave-in-treatment": "treatments",
    "eye-care": "eye_care", "eye-cream": "eye_care", "eye-serum": "eye_care",
    "mask": "masks_exfoliants", "exfoliant": "masks_exfoliants",
    "lip-balm": "lip_care", "lip-care": "lip_care", "lip-treatment": "lip_care",
    "shampoo": "shampoo",
    "conditioner": "conditioner", "leave-in-conditioner": "conditioner",
    "hair-serum": "hair_serums", "hair-oil": "hair_oils", "hair-mask": "hair_masks",
    "scalp-care": "scalp_care", "styling": "styling", "heat-protectant": "styling",
    "body-wash": "body_wash", "body-cleanser": "body_wash",
    "body-lotion": "body_lotion", "body-cream": "body_lotion",
    "body-scrub": "body_scrubs", "body-exfoliator": "body_scrubs",
    "body-treatment": "body_treatment", "body-care": "body_treatment",
    "foot-care": "body_treatment", "roll-on": "body_treatment",
}

DEPT_MAP = {
    "cleansers": "skincare", "serums": "skincare", "moisturizers": "skincare",
    "sunscreen": "skincare", "toners": "skincare", "treatments": "skincare",
    "eye_care": "skincare", "masks_exfoliants": "skincare", "lip_care": "skincare",
    "shampoo": "haircare", "conditioner": "haircare", "hair_serums": "haircare",
    "hair_oils": "haircare", "hair_masks": "haircare", "scalp_care": "haircare", "styling": "haircare",
    "body_wash": "bodycare", "body_lotion": "bodycare", "body_scrubs": "bodycare", "body_treatment": "bodycare",
}


async def main():
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)

    # Add columns
    await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_tier text")
    await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS normalized_category text")
    await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS department text")
    print("Columns added/verified")

    # Brand tiers
    for tier, brands in BRAND_TIERS.items():
        for brand in brands:
            r = await conn.execute("UPDATE products SET brand_tier = $1 WHERE brand = $2", tier, brand)
            print(f"  {tier:15s} <- {brand}: {r}")

    # Normalize categories + departments
    for raw_cat, norm in CATEGORY_MAP.items():
        dept = DEPT_MAP.get(norm, "skincare")
        r = await conn.execute(
            "UPDATE products SET normalized_category = $1, department = $2 WHERE category = $3",
            norm, dept, raw_cat,
        )
        print(f"  {raw_cat:25s} -> {norm:20s} ({dept}): {r}")

    # Handle any unmapped
    await conn.execute(
        "UPDATE products SET normalized_category = 'other', department = 'skincare' WHERE normalized_category IS NULL"
    )

    # Verify
    print("\n=== BRAND TIERS ===")
    rows = await conn.fetch("SELECT brand_tier, count(*) as c FROM products GROUP BY brand_tier ORDER BY c DESC")
    for r in rows:
        print(f"  {str(r['brand_tier']):20s} {r['c']}")

    print("\n=== NORMALIZED CATEGORIES ===")
    rows = await conn.fetch("SELECT normalized_category, count(*) as c FROM products GROUP BY normalized_category ORDER BY c DESC")
    for r in rows:
        print(f"  {str(r['normalized_category']):20s} {r['c']}")

    print("\n=== DEPARTMENTS ===")
    rows = await conn.fetch("SELECT department, count(*) as c FROM products GROUP BY department ORDER BY c DESC")
    for r in rows:
        print(f"  {str(r['department']):15s} {r['c']}")

    await conn.close()
    print("\nDone!")


asyncio.run(main())
