import { apiFetch } from '../lib/api';
import type {
  RoutineOut,
  StepOut,
  TodayStatus,
  StatsOut,
  CostOut,
  ConflictOut,
  GeneratedRoutineOut,
  GenerateRequest,
  CreateRoutineRequest,
  AddStepRequest,
  SearchProduct,
} from '../types/routine';

export const routineService = {
  // ── Routine Types ───────────────────────────────────────────────────
  getTypes: () =>
    apiFetch<Record<string, unknown>>('/api/v1/routine/types', { noAuth: true }),

  // ── CRUD ────────────────────────────────────────────────────────────
  getActive: () =>
    apiFetch<RoutineOut[]>('/api/v1/routine'),

  getById: (routineId: string) =>
    apiFetch<RoutineOut>(`/api/v1/routine/${routineId}`),

  create: (data: CreateRoutineRequest) =>
    apiFetch<RoutineOut>('/api/v1/routine', { method: 'POST', body: data }),

  update: (routineId: string, data: Partial<CreateRoutineRequest>) =>
    apiFetch<RoutineOut>(`/api/v1/routine/${routineId}`, { method: 'PATCH', body: data }),

  deactivate: (routineId: string) =>
    apiFetch(`/api/v1/routine/${routineId}`, { method: 'DELETE' }),

  // ── Steps ───────────────────────────────────────────────────────────
  addStep: (routineId: string, data: AddStepRequest | Record<string, unknown>) =>
    apiFetch<StepOut>(`/api/v1/routine/${routineId}/steps`, { method: 'POST', body: data }),

  removeStep: (routineId: string, stepId: string) =>
    apiFetch(`/api/v1/routine/${routineId}/steps/${stepId}`, { method: 'DELETE' }),

  reorderSteps: (routineId: string, stepIds: string[]) =>
    apiFetch(`/api/v1/routine/${routineId}/steps/reorder`, { method: 'POST', body: { step_ids: stepIds } }),

  // ── Tracking ────────────────────────────────────────────────────────
  completeStep: (routineId: string, stepId: string, skipped = false, skipReason?: string) =>
    apiFetch(`/api/v1/routine/${routineId}/complete`, {
      method: 'POST',
      body: { step_id: stepId, skipped, skip_reason: skipReason },
    }),

  completeAll: (routineId: string) =>
    apiFetch(`/api/v1/routine/${routineId}/complete-all`, { method: 'POST' }),

  getTodayStatus: (routineId: string) =>
    apiFetch<TodayStatus>(`/api/v1/routine/${routineId}/today`),

  // ── Stats ───────────────────────────────────────────────────────────
  getStats: (days = 7) =>
    apiFetch<StatsOut>(`/api/v1/routine/stats?period=${days}`),

  getStreak: () =>
    apiFetch<{ current_streak: number; longest_streak: number }>('/api/v1/routine/streak'),

  getHistory: (days = 120) =>
    apiFetch<{
      period_days: number;
      start_date: string;
      end_date: string;
      daily: { date: string; total_steps: number; completed_steps: number; skipped_steps: number; missed_steps: number; adherence_percentage: number }[];
    }>(`/api/v1/routine/history?period=${days}`),

  // ── Conflicts ───────────────────────────────────────────────────────
  getConflicts: () =>
    apiFetch<ConflictOut[]>('/api/v1/routine/conflicts'),

  validate: (data: { steps: Record<string, unknown>[]; period: string }) =>
    apiFetch<{ valid: boolean; conflicts: ConflictOut[]; suggestions: string[] }>(
      '/api/v1/routine/validate',
      { method: 'POST', body: data },
    ),

  // ── Cost ────────────────────────────────────────────────────────────
  getCost: () =>
    apiFetch<CostOut>('/api/v1/routine/cost'),

  // ── AI Generation ───────────────────────────────────────────────────
  generate: (data: GenerateRequest | Record<string, unknown>) =>
    apiFetch<GeneratedRoutineOut>('/api/v1/routine/generate', { method: 'POST', body: data }),

  // ── Product Search ──────────────────────────────────────────────────
  searchProducts: (category: string, budget?: number) =>
    apiFetch<SearchProduct[]>(
      `/api/v1/routine/products/search?category=${category}${budget ? `&budget=${budget}` : ''}`,
    ),

  // ── JAY Assist (fast, Groq-powered) ────────────────────────────────
  assistSuggestSteps: (data: { routine_name: string; routine_description: string; session: string }) =>
    apiFetch<{ steps: string[]; reasoning: string }>(
      '/api/v1/routine/assist/suggest-steps', { method: 'POST', body: data },
    ),

  assistPickProduct: (data: { category: string; routine_context: string }) =>
    apiFetch<{ product_id: number | null; product_name: string; product_brand: string | null; reasoning: string }>(
      '/api/v1/routine/assist/pick-product', { method: 'POST', body: data },
    ),

  assistSuggestInstruction: (data: { category: string; product_name: string; session: string }) =>
    apiFetch<{ instruction: string; wait_time_seconds: number | null }>(
      '/api/v1/routine/assist/suggest-instruction', { method: 'POST', body: data },
    ),
};
