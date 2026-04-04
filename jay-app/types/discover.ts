import type { Department } from '../stores/discoverStore';

// ── Content Tab ─────────────────────────────────────────────────────────
export type DiscoverTab = 'forYou' | 'products' | 'learn';

// ── Article / Editorial Content ─────────────────────────────────────────
export type ArticleContentType =
  | 'editorial'
  | 'expert_tip'
  | 'guide_101'
  | 'expert_article'
  | 'popular_read';

export interface DiscoverArticle {
  id: string;
  type: ArticleContentType;
  title: string;
  subtitle: string;
  body: string;
  author?: string;
  authorCredentials?: string;
  readTime: string;
  departments: Department[];
  tags?: string[];
  gradient: [string, string];
  emoji?: string;
  featured?: boolean;
  image_url?: string;
  source_url?: string;
  source_name?: string;
}

// ── Ingredient Spotlight ────────────────────────────────────────────────
export interface DiscoverIngredientSpotlight {
  id: string;
  ingredientName: string;
  emoji: string;
  tagline: string;
  summary: string;
  departments: Department[];
}

// ── Quick Tip ───────────────────────────────────────────────────────────
export interface DiscoverQuickTip {
  id: string;
  emoji: string;
  title: string;
  body: string;
  bgColor: string;
  departments: Department[];
}

// ── Skin/Hair/Body Concern ──────────────────────────────────────────────
export interface DiscoverConcern {
  id: string;
  name: string;
  emoji: string;
  color: string;
  departments: Department[];
}

// ── Smart Collection (Products tab) ─────────────────────────────────────
export interface SmartCollectionFilter {
  maxPrice?: number;
  minRating?: number;
  brandTiers?: string[];
  formulationFlags?: {
    fragrance_free?: boolean;
    alcohol_free?: boolean;
    silicone_free?: boolean;
    paraben_free?: boolean;
  };
  pregnancySafe?: boolean;
  concerns?: string[];
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'review_count';
}

export interface SmartCollection {
  id: string;
  name: string;
  emoji: string;
  description: string;
  departments: Department[];
  filter: SmartCollectionFilter;
}

// ── Myth Buster ─────────────────────────────────────────────────────────
export interface MythBuster {
  id: string;
  myth: string;
  truth: string;
  emoji: string;
  departments: Department[];
}

// ── Ingredient Dictionary Entry ─────────────────────────────────────────
export interface IngredientDictEntry {
  id: string;
  name: string;
  emoji: string;
  category: string;
  oneLiner: string;
  departments: Department[];
}
