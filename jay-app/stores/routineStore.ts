import { create } from 'zustand';
import { routineService, type Routine, type TodayStatus, type RoutineStats, type GeneratedRoutine } from '../services/routine';

interface RoutineState {
  amRoutine: Routine | null;
  pmRoutine: Routine | null;
  isLoading: boolean;
  amTodayStatus: TodayStatus | null;
  pmTodayStatus: TodayStatus | null;
  activePeriod: 'am' | 'pm';
  activeTab: 'today' | 'routine' | 'stats';
  stats: RoutineStats | null;
  streak: { current_streak: number; longest_streak: number };
  generatedRoutine: GeneratedRoutine | null;
  isGenerating: boolean;
  costData: { total_monthly_cost: number } | null;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  completeStep: (stepId: string, skipped?: boolean, skipReason?: string) => Promise<void>;
  completeAllSteps: () => Promise<void>;
  loadStats: (days?: number) => Promise<void>;
  generateRoutine: (params?: { period?: string; routine_type?: string; additional_instructions?: string }) => Promise<GeneratedRoutine | null>;
  saveGeneratedRoutine: () => Promise<boolean>;
  addStep: (routineId: string, step: Record<string, unknown>) => Promise<void>;
  removeStep: (routineId: string, stepId: string) => Promise<void>;
  loadCost: () => Promise<void>;
  setActivePeriod: (p: 'am' | 'pm') => void;
  setActiveTab: (t: 'today' | 'routine' | 'stats') => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  amRoutine: null,
  pmRoutine: null,
  isLoading: false,
  amTodayStatus: null,
  pmTodayStatus: null,
  activePeriod: new Date().getHours() < 16 ? 'am' : 'pm',
  activeTab: 'today',
  stats: null,
  streak: { current_streak: 0, longest_streak: 0 },
  generatedRoutine: null,
  isGenerating: false,
  costData: null,

  // Load everything in one call
  init: async () => {
    set({ isLoading: true });
    try {
      const [overview, streak] = await Promise.all([
        routineService.getActive(),
        routineService.getStreak(),
      ]);
      set({ amRoutine: overview.am, pmRoutine: overview.pm, streak });

      // Now load today status for whichever routines exist
      const [amStatus, pmStatus] = await Promise.all([
        overview.am ? routineService.getTodayStatus(overview.am.id) : null,
        overview.pm ? routineService.getTodayStatus(overview.pm.id) : null,
      ]);
      set({ amTodayStatus: amStatus, pmTodayStatus: pmStatus });
    } catch (e) { console.error('[Routine] Init:', e); }
    set({ isLoading: false });
  },

  refresh: async () => {
    await get().init();
  },

  completeStep: async (stepId, skipped = false, skipReason) => {
    const { activePeriod, amRoutine, pmRoutine } = get();
    const routine = activePeriod === 'am' ? amRoutine : pmRoutine;
    if (!routine) return;
    try {
      await routineService.completeStep(routine.id, stepId, skipped, skipReason);
      // Reload just today status
      const status = await routineService.getTodayStatus(routine.id);
      if (activePeriod === 'am') set({ amTodayStatus: status });
      else set({ pmTodayStatus: status });
      // Refresh streak
      const streak = await routineService.getStreak();
      set({ streak });
    } catch (e) { console.error('[Routine] Complete:', e); }
  },

  completeAllSteps: async () => {
    const { activePeriod, amRoutine, pmRoutine } = get();
    const routine = activePeriod === 'am' ? amRoutine : pmRoutine;
    if (!routine) return;
    try {
      await routineService.completeAll(routine.id);
      const status = await routineService.getTodayStatus(routine.id);
      if (activePeriod === 'am') set({ amTodayStatus: status });
      else set({ pmTodayStatus: status });
      const streak = await routineService.getStreak();
      set({ streak });
    } catch (e) { console.error('[Routine] Complete all:', e); }
  },

  loadStats: async (days = 30) => {
    try { set({ stats: await routineService.getStats(days) }); } catch {}
  },

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
      const amSteps = generatedRoutine.steps.filter((s: any) => s.period === 'am');
      const pmSteps = generatedRoutine.steps.filter((s: any) => s.period === 'pm');
      const hasPerField = amSteps.length > 0 || pmSteps.length > 0;

      console.log(`[Routine] Saving: AM=${amSteps.length} PM=${pmSteps.length} hasPerField=${hasPerField} total=${generatedRoutine.steps.length}`);

      const saveSteps = async (period: 'am' | 'pm', steps: any[]) => {
        if (steps.length === 0) return;
        console.log(`[Routine] Creating ${period} routine with ${steps.length} steps`);
        const r = await routineService.create({ period, routine_type: generatedRoutine.routine_type, name: generatedRoutine.name });
        console.log(`[Routine] Created routine ${r.id}`);
        for (const s of steps) {
          const req = _toStepReq(s);
          console.log(`[Routine] Adding step: ${req.category} product_id=${req.product_id}`);
          await routineService.addStep(r.id, req);
        }
      };

      if (hasPerField) {
        await saveSteps('am', amSteps);
        await saveSteps('pm', pmSteps);
      } else {
        // No period field — save all as both AM and PM
        await saveSteps('am', generatedRoutine.steps);
      }

      set({ generatedRoutine: null });
      await get().init();
      return true;
    } catch (e) {
      console.error('[Routine] Save FAILED:', e);
      return false;
    }
  },

  addStep: async (routineId, step) => {
    try {
      await routineService.addStep(routineId, step);
      await get().init();
    } catch (e) { console.error('[Routine] Add step:', e); }
  },

  removeStep: async (routineId, stepId) => {
    try {
      await routineService.removeStep(routineId, stepId);
      await get().init();
    } catch (e) { console.error('[Routine] Remove step:', e); }
  },

  loadCost: async () => {
    try { set({ costData: await routineService.getCost() }); } catch {}
  },

  setActivePeriod: (p) => set({ activePeriod: p }),
  setActiveTab: (t) => set({ activeTab: t }),
}));

function _toStepReq(step: any): Record<string, unknown> {
  // Build display name with brand
  const displayName = step.product_brand && step.product_name
    ? `${step.product_brand} — ${step.product_name}`
    : step.product_name || undefined;

  return {
    category: step.category,
    // product_id: only set if it's a real positive integer (from DB)
    product_id: typeof step.product_id === 'number' && step.product_id > 0 ? step.product_id : undefined,
    custom_product_name: displayName,
    instruction: step.instruction || undefined,
    wait_time_seconds: typeof step.wait_time_seconds === 'number' ? step.wait_time_seconds : undefined,
    frequency: step.frequency || 'daily',
    frequency_days: step.frequency_days || undefined,
    is_essential: step.is_essential ?? true,
    notes: step.why_this_product || undefined,
  };
}
