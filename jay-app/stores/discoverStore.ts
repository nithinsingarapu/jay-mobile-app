import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productService } from '../services/products';
import type { ProductOut } from '../types/product';

const PAGE_SIZE = 20;
const RECENT_SEARCHES_KEY = '@jay_recent_searches';

interface DiscoverState {
  // Product list
  products: ProductOut[];
  isLoadingProducts: boolean;
  hasMore: boolean;
  offset: number;

  // Filters
  activeCategory: string | null;
  activeBrand: string | null;
  searchQuery: string;

  // Reference data
  brands: string[];
  categories: string[];

  // Single product
  selectedProduct: ProductOut | null;
  isLoadingProduct: boolean;

  // Search history
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
  addRecentSearch: (term: string) => Promise<void>;
  removeRecentSearch: (term: string) => Promise<void>;
  clearFilters: () => void;
  initRecentSearches: () => Promise<void>;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  products: [],
  isLoadingProducts: false,
  hasMore: true,
  offset: 0,

  activeCategory: null,
  activeBrand: null,
  searchQuery: '',

  brands: [],
  categories: [],

  selectedProduct: null,
  isLoadingProduct: false,

  recentSearches: [],

  // ── Load ALL products (no filters — filtering is client-side) ────────
  loadProducts: async () => {
    set({ isLoadingProducts: true });
    try {
      const results = await productService.search({ limit: 1000, offset: 0 });
      set({ products: results, offset: 0, hasMore: false });
    } catch (e) {
      console.error('[Discover] loadProducts:', e);
    }
    set({ isLoadingProducts: false });
  },

  // ── No-op (kept for interface compat) ─────────────────────────────────
  loadMoreProducts: async () => {},

  // ── Search ────────────────────────────────────────────────────────────
  searchProducts: async (query: string) => {
    set({ searchQuery: query, offset: 0, products: [], hasMore: true });
    await get().loadProducts(true);
  },

  // ── Single product ────────────────────────────────────────────────────
  loadProduct: async (id: number) => {
    set({ isLoadingProduct: true, selectedProduct: null });
    try {
      const product = await productService.getById(id);
      set({ selectedProduct: product });
    } catch (e) {
      console.error('[Discover] loadProduct:', e);
    }
    set({ isLoadingProduct: false });
  },

  // ── Reference data ────────────────────────────────────────────────────
  loadBrands: async () => {
    try {
      const brands = await productService.getBrands();
      set({ brands });
    } catch (e) {
      console.error('[Discover] loadBrands:', e);
    }
  },

  loadCategories: async () => {
    try {
      const categories = await productService.getCategories();
      set({ categories });
    } catch (e) {
      console.error('[Discover] loadCategories:', e);
    }
  },

  // ── Filter setters ────────────────────────────────────────────────────
  setCategory: (cat: string | null) => {
    set({ activeCategory: cat, offset: 0, products: [], hasMore: true });
    get().loadProducts(true);
  },

  setBrand: (brand: string | null) => {
    set({ activeBrand: brand, offset: 0, products: [], hasMore: true });
    get().loadProducts(true);
  },

  clearFilters: () => {
    set({
      activeCategory: null,
      activeBrand: null,
      searchQuery: '',
      offset: 0,
      products: [],
      hasMore: true,
    });
    get().loadProducts(true);
  },

  // ── Recent searches ───────────────────────────────────────────────────
  addRecentSearch: async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const { recentSearches } = get();
    const filtered = recentSearches.filter(s => s !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 10);

    set({ recentSearches: updated });
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[Discover] persist recent searches:', e);
    }
  },

  removeRecentSearch: async (term: string) => {
    const { recentSearches } = get();
    const updated = recentSearches.filter(s => s !== term);

    set({ recentSearches: updated });
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[Discover] persist recent searches:', e);
    }
  },

  initRecentSearches: async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        set({ recentSearches: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('[Discover] load recent searches:', e);
    }
  },
}));
