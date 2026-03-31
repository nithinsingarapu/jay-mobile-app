"""
Seed products from product_database.csv into the products table.
Run: uv run python scripts/seed_products.py
"""
import csv
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.config import get_settings

# CSV path
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "product_database.csv")

# Category mapping: CSV subcategory → our category
CATEGORY_MAP = {
    "cleanser": "cleanser",
    "serum": "serum",
    "moisturizer": "moisturizer",
    "moisturiser": "moisturizer",
    "sunscreen": "sunscreen",
    "toner": "toner",
    "face oil": "face_oil",
    "face mask": "mask",
    "sheet mask": "mask",
    "eye cream": "eye_cream",
    "eye serum": "eye_cream",
    "lip": "lip_care",
    "lip balm": "lip_care",
    "lip mask": "lip_care",
    "exfoliant": "exfoliant",
    "exfoliator": "exfoliant",
    "peel": "exfoliant",
    "essence": "essence",
    "ampoule": "essence",
    "mist": "toner",
    "treatment": "treatment",
    "spot treatment": "treatment",
    "cream": "moisturizer",
    "gel": "moisturizer",
    "lotion": "moisturizer",
    "body lotion": "moisturizer",
    "night cream": "moisturizer",
    "sleeping mask": "mask",
}


def parse_curly_list(val: str) -> list[str] | None:
    """Parse '{item1, item2, item3}' into ['item1', 'item2', 'item3']"""
    if not val or val.strip() in ('', '{}', '[]'):
        return None
    s = val.strip().strip('{}[]')
    if not s:
        return None
    items = [i.strip().strip('"').strip("'").lower() for i in s.split(',')]
    return [i for i in items if i] or None


def parse_json(val: str) -> dict | None:
    """Try to parse JSON, return None on failure."""
    if not val or val.strip() in ('', '{}', '[]'):
        return None
    # Fix common issues: single quotes → double quotes
    try:
        return json.loads(val)
    except json.JSONDecodeError:
        try:
            fixed = val.replace("'", '"').replace('True', 'true').replace('False', 'false').replace('None', 'null')
            return json.loads(fixed)
        except json.JSONDecodeError:
            return None


def map_category(subcategory: str) -> str:
    """Map CSV subcategory to our product category."""
    if not subcategory:
        return "treatment"
    lower = subcategory.strip().lower()
    return CATEGORY_MAP.get(lower, lower.replace(' ', '_'))


def main():
    settings = get_settings()
    sync_url = settings.database_url.replace("+asyncpg", "")
    engine = create_engine(sync_url)

    # Find CSV
    csv_path = CSV_PATH
    if not os.path.exists(csv_path):
        # Try alternate paths
        for p in [
            "product_database.csv",
            "../product_database.csv",
            "../../product_database.csv",
        ]:
            if os.path.exists(p):
                csv_path = p
                break
        else:
            print("ERROR: product_database.csv not found!")
            sys.exit(1)

    print(f"Reading {csv_path}...")

    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"Found {len(rows)} products in CSV")

    inserted = 0
    skipped = 0
    brands = set()

    with Session(engine) as session:
        for row in rows:
            name = row.get('name', '').strip()
            brand = row.get('brand', '').strip()
            if not name or not brand:
                skipped += 1
                continue

            # Check duplicate
            exists = session.execute(
                text("SELECT 1 FROM products WHERE name = :name AND brand = :brand"),
                {"name": name, "brand": brand}
            ).first()
            if exists:
                skipped += 1
                continue

            category = map_category(row.get('subcategory', ''))
            key_ingredients = parse_curly_list(row.get('inci_list', ''))
            concerns = parse_curly_list(row.get('concerns', ''))
            suitable_for = parse_json(row.get('suitable_for', ''))
            formulation = parse_json(row.get('formulation', ''))

            session.execute(text("""
                INSERT INTO products (name, brand, category, subcategory, product_type, texture,
                    description, how_to_use, key_ingredients, full_ingredients, concerns,
                    suitable_for, formulation, product_url, is_available, created_at, updated_at)
                VALUES (:name, :brand, :category, :subcategory, :product_type, :texture,
                    :description, :how_to_use, :key_ingredients, :full_ingredients, :concerns,
                    :suitable_for, :formulation, :product_url, true, NOW(), NOW())
            """), {
                "name": name,
                "brand": brand,
                "category": category,
                "subcategory": row.get('subcategory', '').strip() or None,
                "product_type": row.get('product_type', '').strip() or None,
                "texture": row.get('texture', '').strip() or None,
                "description": row.get('description', '').strip() or None,
                "how_to_use": row.get('how_to_use', '').strip() or None,
                "key_ingredients": key_ingredients,
                "full_ingredients": row.get('inci_list', '').strip() or None,
                "concerns": concerns,
                "suitable_for": json.dumps(suitable_for) if suitable_for else None,
                "formulation": json.dumps(formulation) if formulation else None,
                "product_url": row.get('product_url', '').strip() or None,
            })

            brands.add(brand)
            inserted += 1

        session.commit()

    print(f"\nDone! Inserted {inserted} products across {len(brands)} brands")
    if skipped:
        print(f"Skipped {skipped} (duplicates or missing data)")


if __name__ == "__main__":
    main()
