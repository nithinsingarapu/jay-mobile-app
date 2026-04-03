import { create } from 'zustand';
import { routineService } from '../services/routine';
import type {
  RoutineOut,
  TodayStatus,
  StatsOut,
  CostOut,
  ConflictOut,
  GeneratedRoutineOut,
  AddStepRequest,
  CreateRoutineRequest,
} from '../types/routine';

interface RoutineState {
  // ── Data ──────────────────────────────────────────────────────────
  routines: RoutineOut[];
  todayStatuses: Record<string, TodayStatus>;
  selectedRoutineId: string | null;
  isLoading: boolean;
  stats: StatsOut | null;
  streak: { current_streak: number; longest_streak: number };
  costBreakdown: CostOut | null;
  conflicts: ConflictOut[];
  generatedRoutine: GeneratedRoutineOut | null;
  isGenerating: boolean;
  activeSegment: 'today' | 'routines' | 'stats';
  completingStepId: string | null;
  completingAll: boolean;

  // ── Actions ───────────────────────────────────────────────────────
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  completeStep: (routineId: string, stepId: string) => Promise<void>;
  skipStep: (routineId: string, stepId: string, reason?: string) => Promise<void>;
  completeAllSteps: (routineId: string) => Promise<void>;
  createRoutine: (data: CreateRoutineRequest) => Promise<RoutineOut | null>;
  deleteRoutine: (routineId: string) => Promise<void>;
  addStep: (routineId: string, step: AddStepRequest | Record<string, unknown>) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  reorderSteps: (routineId: string, stepIds: string[]) => Promise<void>;
  generateRoutine: (params?: Record<string, unknown>) => Promise<GeneratedRoutineOut | null>;
  saveGeneratedRoutine: () => Promise<boolean>;
  loadStats: (days?: number) => Promise<void>;
  loadCost: () => Promise<void>;
  loadConflicts: () => Promise<void>;
  setActiveSegment: (s: 'today' | 'routines' | 'stats') => void;
  setSelectedRoutineId: (id: string | null) => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────
  routines: [],
  todayStatuses: {},
  selectedRoutineId: null,
  isLoading: false,
  stats: null,
  streak: { current_streak: 0, longest_streak: 0 },
  costBreakdown: null,
  conflicts: [],
  generatedRoutine: null,
  isGenerating: false,
  activeSegment: 'today',
  completingStepId: null,
  completingAll: false,

  // ── Init: load routines + statuses + streak ───────────────────────
  init: async () => {
    set({ isLoading: true });
    try {
      const [routines, streak] = await Promise.all([
        routineService.getActive(),
        routineService.getStreak(),
      ]);
      set({ routines, streak });

      // Load today status for each routine
      const statusEntries = await Promise.all(
        routines.map(async (r) => {
          try {
            const status = await routineService.getTodayStatus(r.id);
            return [r.id, status] as [string, TodayStatus];
          } catch {
            return null;
          }
        }),
      );
      const todayStatuses: Record<string, TodayStatus> = {};
      for (const entry of statusEntries) {
        if (entry) todayStatuses[entry[0]] = entry[1];
      }
      set({ todayStatuses });
    } catch (e) {
      console.error('[Routine] Init:', e);
    }
    set({ isLoading: false });
  },

  refresh: async () => {
    await get().init();
  },

  // ── Step completion ───────────────────────────────────────────────
  completeStep: async (routineId, stepId) => {
    // OPTIMISTIC: update UI immediately
    const prev = get().todayStatuses[routineId];
    if (prev) {
      set((s) => ({
        completingStepId: stepId,
        todayStatuses: {
          ...s.todayStatuses,
          [routineId]: {
            ...prev,
            completed_steps: prev.completed_steps + 1,
            remaining_steps: Math.max(0, prev.remaining_steps - 1),
            completion_percentage: Math.round(((prev.completed_steps + 1) / prev.total_steps) * 100),
            steps: prev.steps.map((st: any) =>
              st.step_id === stepId ? { ...st, completed: true, completed_at: new Date().toISOString() } : st
            ),
          },
        },
      }));
    }
    // SYNC: API call in background
    try {
      await routineService.completeStep(routineId, stepId);
      // Refresh actual status + streak in background (don't block UI)
      Promise.all([
        routineService.getTodayStatus(routineId).then(status =>
          set((s) => ({ todayStatuses: { ...s.todayStatuses, [routineId]: status } }))
        ),
        routineService.getStreak().then(streak => set({ streak })),
      ]).catch(() => {});
    } catch (e) {
      console.error('[Routine] Complete step:', e);
      // Revert optimistic update
      if (prev) set((s) => ({ todayStatuses: { ...s.todayStatuses, [routineId]: prev } }));
    }
    set({ completingStepId: null });
  },

  skipStep: async (routineId, stepId, reason) => {
    // OPTIMISTIC: update UI immediately
    const prev = get().todayStatuses[routineId];
    if (prev) {
      set((s) => ({
        completingStepId: stepId,
        todayStatuses: {
          ...s.todayStatuses,
          [routineId]: {
            ...prev,
            skipped_steps: prev.skipped_steps + 1,
            remaining_steps: Math.max(0, prev.remaining_steps - 1),
            steps: prev.steps.map((st: any) =>
              st.step_id === stepId ? { ...st, skipped: true, completed_at: new Date().toISOString() } : st
            ),
          },
        },
      }));
    }
    // SYNC
    try {
      await routineService.completeStep(routineId, stepId, true, reason);
      Promise.all([
        routineService.getTodayStatus(routineId).then(status =>
          set((s) => ({ todayStatuses: { ...s.todayStatuses, [routineId]: status } }))
        ),
        routineService.getStreak().then(streak => set({ streak })),
      ]).catch(() => {});
    } catch (e) {
      console.error('[Routine] Skip step:', e);
      if (prev) set((s) => ({ todayStatuses: { ...s.todayStatuses, [routineId]: prev } }));
    }
    set({ completingStepId: null });
  },

  completeAllSteps: async (routineId) => {
    set({ completingAll: true });
    try {
      await routineService.completeAll(routineId);
      const status = await routineService.getTodayStatus(routineId);
      set((s) => ({
        todayStatuses: { ...s.todayStatuses, [routineId]: status },
        completingAll: false,
      }));
      const streak = await routineService.getStreak();
      set({ streak });
    } catch (e) {
      console.error('[Routine] Complete all:', e);
      set({ completingAll: false });
    }
  },

  // ── CRUD ──────────────────────────────────────────────────────────
  createRoutine: async (data) => {
    try {
      const routine = await routineService.create(data);
      await get().init();
      return routine;
    } catch (e) {
      console.error('[Routine] Create:', e);
      return null;
    }
  },

  deleteRoutine: async (routineId) => {
    try {
      await routineService.deactivate(routineId);
      await get().init();
    } catch (e) {
      console.error('[Routine] Delete:', e);
    }
  },

  addStep: async (routineId, step) => {
    try {
      await routineService.addStep(routineId, step);
      await get().init();
    } catch (e) {
      console.error('[Routine] Add step:', e);
    }
  },

  removeStep: async (routineId, stepId) => {
    try {
      await routineService.removeStep(routineId, stepId);
      await get().init();
    } catch (e) {
      console.error('[Routine] Remove step:', e);
    }
  },

  reorderSteps: async (routineId, stepIds) => {
    try {
      await routineService.reorderSteps(routineId, stepIds);
      await get().init();
    } catch (e) {
      console.error('[Routine] Reorder steps:', e);
    }
  },

  // ── AI Generation ─────────────────────────────────────────────────
  generateRoutine: async (params) => {
    set({ isGenerating: true, generatedRoutine: null });
    try {
      const result = await routineService.generate({
        period: params?.period || 'both',
        routine_type: params?.routine_type || 'auto',
        additional_instructions: params?.additional_instructions,
      });
      set({ generatedRoutine: result, isGenerating: false });
      return result;
    } catch (e) {
      console.error('[Routine] Generate:', e);
      set({ isGenerating: false });
      return null;
    }
  },

  saveGeneratedRoutine: async () => {
    const { generatedRoutine } = get();
    if (!generatedRoutine) return false;
    try {
      const steps = generatedRoutine.steps || [];
      const amSteps = steps.filter((s: any) => s.period === 'am');
      const pmSteps = steps.filter((s: any) => s.period === 'pm');
      const hasPerField = amSteps.length > 0 || pmSteps.length > 0;

      // Use reasoning as description if available
      const desc = (generatedRoutine as any).reasoning
        ? String((generatedRoutine as any).reasoning).slice(0, 500)
        : undefined;

      const savePeriod = async (period: string, periodSteps: any[]) => {
        if (periodSteps.length === 0) return;
        const r = await routineService.create({
          name: generatedRoutine.name || `${period} Routine`,
          period,
          routine_type: generatedRoutine.routine_type || 'custom',
          description: desc,
        });
        for (const s of periodSteps) {
          try {
            await routineService.addStep(r.id, _toStepReq(s));
          } catch (stepErr) {
            console.warn('[Routine] Failed to add step:', s.category, stepErr);
          }
        }
      };

      if (hasPerField) {
        if (amSteps.length > 0) await savePeriod('morning', amSteps);
        if (pmSteps.length > 0) await savePeriod('night', pmSteps);
      } else {
        // No period field on steps — use the generated routine's period to decide
        const genPeriod = generatedRoutine.period || 'both';
        if (genPeriod === 'am' || genPeriod === 'morning') {
          await savePeriod('morning', steps);
        } else if (genPeriod === 'pm' || genPeriod === 'night' || genPeriod === 'evening') {
          await savePeriod('night', steps);
        } else {
          // 'both' or unknown — save as morning by default
          await savePeriod('morning', steps);
        }
      }

      set({ generatedRoutine: null });
      await get().init();
      return true;
    } catch (e) {
      console.error('[Routine] Save generated:', e);
      return false;
    }
  },

  // ── Stats / Cost / Conflicts ──────────────────────────────────────
  loadStats: async (days = 30) => {
    try {
      set({ stats: await routineService.getStats(days) });
    } catch (e) {
      console.error('[Routine] Load stats:', e);
    }
  },

  loadCost: async () => {
    try {
      set({ costBreakdown: await routineService.getCost() });
    } catch (e) {
      console.error('[Routine] Load cost:', e);
    }
  },

  loadConflicts: async () => {
    try {
      set({ conflicts: await routineService.getConflicts() });
    } catch (e) {
      console.error('[Routine] Load conflicts:', e);
    }
  },

  // ── UI state ──────────────────────────────────────────────────────
  setActiveSegment: (s) => set({ activeSegment: s }),
  setSelectedRoutineId: (id) => set({ selectedRoutineId: id }),
}));

// ── Helper ────────────────────────────────────────────────────────────

const VALID_FREQUENCIES = ['daily', 'every_other_day', '2x_week', '3x_week', 'weekly', 'as_needed'];

function _normalizeFrequency(freq: unknown): string {
  const s = String(freq || 'daily').toLowerCase().trim();
  if (VALID_FREQUENCIES.includes(s)) return s;
  // Map common AI variations
  if (s.includes('every other') || s.includes('alternate')) return 'every_other_day';
  if (s.includes('twice') || s.includes('2x') || s.includes('2 times')) return '2x_week';
  if (s.includes('thrice') || s.includes('3x') || s.includes('3 times')) return '3x_week';
  if (s.includes('week')) return 'weekly';
  if (s.includes('need') || s.includes('occasion')) return 'as_needed';
  return 'daily';
}

function _toStepReq(step: any): Record<string, unknown> {
  const displayName =
    step.product_brand && step.product_name
      ? `${step.product_brand} — ${step.product_name}`
      : (step.product_name as string | undefined) || undefined;

  return {
    category: step.category,
    product_id:
      typeof step.product_id === 'number' && step.product_id > 0
        ? step.product_id
        : undefined,
    custom_product_name: displayName,
    instruction: step.instruction || undefined,
    wait_time_seconds:
      typeof step.wait_time_seconds === 'number'
        ? step.wait_time_seconds
        : undefined,
    frequency: _normalizeFrequency(step.frequency),
    frequency_days: step.frequency_days || undefined,
    is_essential: step.is_essential ?? true,
    notes: step.why_this_product || undefined,
  };
}
