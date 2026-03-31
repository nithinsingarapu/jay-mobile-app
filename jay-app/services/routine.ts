import { apiFetch } from '../lib/api';

export interface RoutineStep {
  id: string;
  step_order: number;
  category: string;
  product_id: number | null;
  product_name: string | null;
  product_brand: string | null;
  custom_product_name: string | null;
  product_price: number | null;
  instruction: string | null;
  wait_time_seconds: number | null;
  frequency: string;
  frequency_days: string[] | null;
  is_essential: boolean;
  notes: string | null;
  why_this_product: string | null;
}

export interface Routine {
  id: string;
  name: string | null;
  period: string;
  routine_type: string;
  is_active: boolean;
  total_monthly_cost: number | null;
  steps: RoutineStep[];
  created_at: string;
  updated_at: string;
}

export interface RoutineOverview {
  am: Routine | null;
  pm: Routine | null;
}

export interface TodayStatus {
  routine_id: string;
  period: string;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  remaining_steps: number;
  completion_percentage: number;
  steps: {
    step_id: string;
    step_category: string;
    product_name: string | null;
    completed: boolean;
    skipped: boolean;
    completed_at: string | null;
  }[];
}

export interface RoutineStats {
  period_days: number;
  total_routines_possible: number;
  completed_count: number;
  skipped_count: number;
  missed_count: number;
  adherence_percentage: number;
  current_streak: number;
  longest_streak: number;
}

export interface GeneratedRoutine {
  routine_type: string;
  period: string;
  name: string;
  total_monthly_cost: number;
  steps: Record<string, unknown>[];
  reasoning: string;
  tips: string[];
  conflicts_checked: Record<string, unknown>[];
}

export const routineService = {
  // Types
  getTypes: () => apiFetch<Record<string, unknown>>('/api/v1/routine/types', { noAuth: true }),

  // CRUD
  getActive: () => apiFetch<RoutineOverview>('/api/v1/routine'),
  create: (data: { period: string; routine_type: string; name?: string }) =>
    apiFetch<Routine>('/api/v1/routine', { method: 'POST', body: data }),
  addStep: (routineId: string, data: Record<string, unknown>) =>
    apiFetch<RoutineStep>(`/api/v1/routine/${routineId}/steps`, { method: 'POST', body: data }),
  deactivate: (routineId: string) =>
    apiFetch(`/api/v1/routine/${routineId}`, { method: 'DELETE' }),

  // Tracking
  completeStep: (routineId: string, stepId: string, skipped = false, skipReason?: string) =>
    apiFetch(`/api/v1/routine/${routineId}/complete`, {
      method: 'POST', body: { step_id: stepId, skipped, skip_reason: skipReason },
    }),
  completeAll: (routineId: string) =>
    apiFetch(`/api/v1/routine/${routineId}/complete-all`, { method: 'POST' }),
  getTodayStatus: (routineId: string) =>
    apiFetch<TodayStatus>(`/api/v1/routine/${routineId}/today`),

  // Stats
  getStats: (days = 7) => apiFetch<RoutineStats>(`/api/v1/routine/stats?period=${days}`),
  getStreak: () => apiFetch<{ current_streak: number; longest_streak: number }>('/api/v1/routine/streak'),

  // AI generation
  generate: (data: { period?: string; routine_type?: string; additional_instructions?: string }) =>
    apiFetch<GeneratedRoutine>('/api/v1/routine/generate', { method: 'POST', body: data }),

  // Cost
  getCost: () => apiFetch<{ total_monthly_cost: number }>('/api/v1/routine/cost'),
};
