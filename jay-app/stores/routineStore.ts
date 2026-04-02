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
    set({ completingStepId: stepId });
    try {
      await routineService.completeStep(routineId, stepId);
      const status = await routineService.getTodayStatus(routineId);
      set((s) => ({
        todayStatuses: { ...s.todayStatuses, [routineId]: status },
        completingStepId: null,
      }));
      const streak = await routineService.getStreak();
      set({ streak });
    } catch (e) {
      console.error('[Routine] Complete step:', e);
      set({ completingStepId: null });
    }
  },

  skipStep: async (routineId, stepId, reason) => {
    set({ completingStepId: stepId });
    try {
      await routineService.completeStep(routineId, stepId, true, reason);
      const status = await routineService.getTodayStatus(routineId);
      set((s) => ({
        todayStatuses: { ...s.todayStatuses, [routineId]: status },
        completingStepId: null,
      }));
      const streak = await routineService.getStreak();
      set({ streak });
    } catch (e) {
      console.error('[Routine] Skip step:', e);
      set({ completingStepId: null });
    }
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
      const amSteps = generatedRoutine.steps.filter((s) => s.period === 'am');
      const pmSteps = generatedRoutine.steps.filter((s) => s.period === 'pm');
      const hasPerField = amSteps.length > 0 || pmSteps.length > 0;

      const saveSteps = async (period: 'am' | 'pm', steps: typeof generatedRoutine.steps) => {
        if (steps.length === 0) return;
        const r = await routineService.create({
          name: generatedRoutine.name,
          period,
          routine_type: generatedRoutine.routine_type,
          description: generatedRoutine.description,
        });
        for (const s of steps) {
          await routineService.addStep(r.id, _toStepReq(s));
        }
      };

      if (hasPerField) {
        await saveSteps('am', amSteps);
        await saveSteps('pm', pmSteps);
      } else {
        await saveSteps('am', generatedRoutine.steps);
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
    frequency: (step.frequency as string) || 'daily',
    frequency_days: step.frequency_days || undefined,
    is_essential: step.is_essential ?? true,
    notes: step.why_this_product || undefined,
  };
}
