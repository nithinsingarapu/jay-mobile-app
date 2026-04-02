import { apiFetch } from '../lib/api';
import type { ProductOut } from '../types/product';

export const productService = {
  search: (params: {
    q?: string;
    brand?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.brand) qs.set('brand', params.brand);
    if (params.category) qs.set('category', params.category);
    if (params.min_price) qs.set('min_price', String(params.min_price));
    if (params.max_price) qs.set('max_price', String(params.max_price));
    qs.set('limit', String(params.limit ?? 20));
    qs.set('offset', String(params.offset ?? 0));
    return apiFetch<ProductOut[]>(`/api/v1/products?${qs.toString()}`, { noAuth: true });
  },

  getById: (id: number) =>
    apiFetch<ProductOut>(`/api/v1/products/${id}`, { noAuth: true }),

  getBrands: () =>
    apiFetch<string[]>('/api/v1/products/brands', { noAuth: true }),

  getCategories: () =>
    apiFetch<string[]>('/api/v1/products/categories', { noAuth: true }),

  enrichProduct: (id: number) =>
    apiFetch<{ status: string; error?: string; price?: number; rating?: number; review_count?: number; image?: string; source?: string }>(
      `/api/v1/products/${id}/enrich`, { method: 'POST' },
    ),
};
