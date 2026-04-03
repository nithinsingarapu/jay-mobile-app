import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productService } from '../services/products';
import type { ProductOut } from '../types/product';
import type { DiscoverTab } from '../types/discover';

const RECENT_SEARCHES_KEY = '@jay_recent_searches';

export type Department = 'skincare' | 'haircare' | 'bodycare';

interface DiscoverState {
  // All products (loaded once, filtered client-side)
  allProducts: ProductOut[];
  isLoadingProducts: boolean;

  // Tab navigation
  activeTab: DiscoverTab;

  // Filters
  department: Department;
  activeCategory: string | null;
  activeBrand: string | null;
  activeTier: string | null;
  activeSmartCollection: string | null;
  activeConcern: string | null;

  // Search (separate from browse)
  searchResults: ProductOut[];
  isSearching: boolean;

  // Reference data
  brands: string[];
  categories: string[];

  // Single product detail
  selectedProduct: ProductOut | null;
  isLoadingProduct: boolean;

  // Search history
  recentSearches: string[];

  // Actions
  loadProducts: () => Promise<void>;
  setActiveTab: (tab: DiscoverTab) => void;
  setDepartment: (dept: Department) => void;
  setCategory: (cat: string | null) => void;
  setBrand: (brand: string | null) => void;
  setTier: (tier: string | null) => void;
  setSmartCollection: (id: string | null) => void;
  setActiveConcern: (concern: string | null) => void;
  clearFilters: () => void;
  searchProducts: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  loadProduct: (id: number) => Promise<void>;
  loadBrands: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addRecentSearch: (term: string) => Promise<void>;
  removeRecentSearch: (term: string) => Promise<void>;
  initRecentSearches: () => Promise<void>;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  allProducts: [],
  isLoadingProducts: false,

  activeTab: 'forYou' as DiscoverTab,

  department: 'skincare',
  activeCategory: null,
  activeBrand: null,
  activeTier: null,
  activeSmartCollection: null,
  activeConcern: null,

  searchResults: [],
  isSearching: false,

  brands: [],
  categories: [],

  selectedProduct: null,
  isLoadingProduct: false,

  recentSearches: [],

  // ── Load ALL products (one-time, client-side filtering) ─────────────
  loadProducts: async () => {
    if (get().isLoadingProducts) return;
    set({ isLoadingProducts: true });
    try {
      const results = await productService.search({ limit: 1000, offset: 0 });
      set({ allProducts: results });
    } catch (e) {
      console.error('[Discover] loadProducts:', e);
    }
    set({ isLoadingProducts: false });
  },

  // ── Tab navigation ───────────────────────────────────────────────────
  setActiveTab: (tab: DiscoverTab) => {
    set({ activeTab: tab });
  },

  // ── Filter setters ──────────────────────────────────────────────────
  setDepartment: (dept: Department) => {
    set({
      department: dept,
      activeCategory: null,
      activeBrand: null,
      activeTier: null,
      activeSmartCollection: null,
      activeConcern: null,
    });
  },

  setCategory: (cat: string | null) => {
    set({ activeCategory: cat, activeSmartCollection: null });
  },

  setBrand: (brand: string | null) => {
    set({ activeBrand: brand });
  },

  setTier: (tier: string | null) => {
    set({ activeTier: tier });
  },

  setSmartCollection: (id: string | null) => {
    set({ activeSmartCollection: id, activeCategory: null, activeBrand: null, activeTier: null });
  },

  setActiveConcern: (concern: string | null) => {
    set({ activeConcern: concern });
  },

  clearFilters: () => {
    set({
      activeCategory: null,
      activeBrand: null,
      activeTier: null,
      activeSmartCollection: null,
      activeConcern: null,
    });
  },

  // ── Search (writes to searchResults, not allProducts) ───────────────
  searchProducts: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const results = await productService.search({ q: query.trim(), limit: 20 });
      set({ searchResults: results });
    } catch (e) {
      console.error('[Discover] searchProducts:', e);
    }
    set({ isSearching: false });
  },

  clearSearchResults: () => {
    set({ searchResults: [], isSearching: false });
  },

  // ── Single product ──────────────────────────────────────────────────
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

  // ── Reference data ──────────────────────────────────────────────────
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

  // ── Recent searches ─────────────────────────────────────────────────
  addRecentSearch: async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const { recentSearches } = get();
    const filtered = recentSearches.filter((s) => s !== trimmed);
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
    const updated = recentSearches.filter((s) => s !== term);

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
