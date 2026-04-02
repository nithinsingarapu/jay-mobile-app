export interface ProductOut {
  id: number;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  product_type: string | null;
  texture: string | null;
  description: string | null;
  how_to_use: string | null;
  key_ingredients: string[] | null;
  full_ingredients: string | null;
  concerns: string[] | null;
  suitable_for: {
    skin_types?: string[];
    conditions?: string[];
    pregnancy_safe?: boolean;
    fungal_acne_safe?: boolean;
  } | null;
  price_inr: number | null;
  image_url: string | null;
  product_url: string | null;
  formulation: {
    ph?: number;
    fragrance_free?: boolean;
    alcohol_free?: boolean;
    silicone_free?: boolean;
    paraben_free?: boolean;
  } | null;
  // Classification
  brand_tier: string | null;           // pharma, derm_grade, dtc_science, consumer, premium_hair
  normalized_category: string | null;  // cleansers, serums, moisturizers, etc.
  department: string | null;           // skincare, haircare, bodycare

  // Enrichment (from SerpAPI)
  rating: number | null;
  review_count: number | null;
  buy_url: string | null;
  image_urls: string[] | null;
  price_source: string | null;
  price_updated_at: string | null;
  serp_enriched_at: string | null;

  is_available: boolean;
  created_at: string;
  updated_at: string;
}
