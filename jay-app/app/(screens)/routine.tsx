import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Pressable, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';
import { useRoutineStore } from '../../stores/routineStore';

import RoutineHeader from '../../components/routine/RoutineHeader';
import SegmentedControl from '../../components/routine/SegmentedControl';
import HeroRing from '../../components/routine/HeroRing';
import StatPill from '../../components/routine/StatPill';
import SessionCard from '../../components/routine/SessionCard';
import StepTable from '../../components/routine/StepTable';
import StepTableRow from '../../components/routine/StepTableRow';
import CompleteAllButton from '../../components/routine/CompleteAllButton';
import { ConflictNotice } from '../../components/routine/ConflictNotice';
import RoutineManagementCard from '../../components/routine/RoutineManagementCard';
import { StatsHero } from '../../components/routine/StatsHero';
import { StatCards } from '../../components/routine/StatCards';
import { StatsPeriodToggle } from '../../components/routine/StatsPeriodToggle';
import FeaturedRoutineCard from '../../components/routine/FeaturedRoutineCard';
import CategoryRow from '../../components/routine/CategoryRow';
import OrderDiagram from '../../components/routine/OrderDiagram';
import ConflictRule from '../../components/routine/ConflictRule';
import IngredientSpotlight from '../../components/routine/IngredientSpotlight';
import SeasonalCard from '../../components/routine/SeasonalCard';
import ArticleCard from '../../components/routine/ArticleCard';
import TipCard from '../../components/routine/TipCard';
import { CreateRoutineSheet, type CreateRoutineData } from '../../components/routine/sheets/CreateRoutineSheet';
import { SkipReasonSheet } from '../../components/routine/sheets/SkipReasonSheet';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useDiaryStore } from '../../stores/diaryStore';
import { CalendarGrid } from '../../components/diary/CalendarGrid';
import { DiaryEntryCard } from '../../components/diary/DiaryEntryCard';
import { ContributionHeatmap } from '../../components/diary/ContributionHeatmap';
import { StreakDashboard } from '../../components/diary/StreakDashboard';
import { WeeklyBarChart } from '../../components/diary/WeeklyBarChart';
import { CompletionBreakdown } from '../../components/diary/CompletionBreakdown';
import { AchievementBadge, type Achievement } from '../../components/diary/AchievementBadge';
import { ROUTINE_CATEGORIES, FEATURED_ROUTINE } from '../../data/routineLibrary';
import {
  TIPS, AM_ORDER, PM_ORDER, CONFLICTS,
  INGREDIENT_SPOTLIGHTS, SEASONAL_GUIDES, SCIENCE_ARTICLES,
} from '../../data/learnContent';

/* ── Ambient gradient tokens per period ──────────────────────── */
// Last stop uses same hue at alpha 0 (not 'transparent' which is rgba(0,0,0,0))
// to avoid a muddy band during gradient interpolation.

const AMBIENT_GRADIENTS: Record<string, { light: [string, string, string]; dark: [string, string, string] }> = {
  // Fresh morning — warm golden sunrise peach
  morning:   { light: ['#FFE4B5', '#FFDAB0', '#FFDAB000'], dark: ['#2d1f08', '#1a1408', '#1a140800'] },
  am:        { light: ['#FFE4B5', '#FFDAB0', '#FFDAB000'], dark: ['#2d1f08', '#1a1408', '#1a140800'] },
  // Sunny afternoon — vivid warm amber gold
  afternoon: { light: ['#FFD580', '#FFECB3', '#FFECB300'], dark: ['#2e2400', '#1a1500', '#1a150000'] },
  // Aesthetic evening — pink-lavender sunset glow
  evening:   { light: ['#F8BBD0', '#E1BEE7', '#E1BEE700'], dark: ['#2a0e1e', '#1e0a28', '#1e0a2800'] },
  // Cozy night — deep warm indigo with a hint of plum
  night:     { light: ['#C5CAE9', '#B39DDB', '#B39DDB00'], dark: ['#0d0a20', '#12082a', '#12082a00'] },
  pm:        { light: ['#C5CAE9', '#B39DDB', '#B39DDB00'], dark: ['#0d0a20', '#12082a', '#12082a00'] },
  full_day:  { light: ['#FFE4B5', '#FFDAB0', '#FFDAB000'], dark: ['#2d1f08', '#1a1408', '#1a140800'] },
  both:      { light: ['#FFE4B5', '#FFDAB0', '#FFDAB000'], dark: ['#2d1f08', '#1a1408', '#1a140800'] },
};

const DEFAULT_GRADIENT = {
  light: ['#E8EAF6', '#E0E0E0', '#E0E0E000'] as [string, string, string],
  dark: ['#0d0d18', '#0a0a12', '#0a0a1200'] as [string, string, string],
};

const SEGMENTS = ['Today', 'Library', 'My Routines', 'Diary'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── Diary data derivation helpers ───────────────────────────── */

function historyToHeatmap(daily: { date: string; adherence_percentage: number }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const d of daily) map[d.date] = d.adherence_percentage;
  return map;
}

function historyToWeeklyAdherence(daily: { date: string; adherence_percentage: number }[]): number[] {
  const today = new Date();
  const dow = today.getDay();
  const mondayOff = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - mondayOff);
  const result: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push(daily.find((e) => e.date === key)?.adherence_percentage ?? 0);
  }
  return result;
}

function historyToCalendarDots(daily: { date: string; adherence_percentage: number }[]): Record<string, 'good' | 'okay' | 'bad'> {
  const dots: Record<string, 'good' | 'okay' | 'bad'> = {};
  for (const d of daily) {
    if (d.adherence_percentage >= 70) dots[d.date] = 'good';
    else if (d.adherence_percentage >= 30) dots[d.date] = 'okay';
    else if (d.adherence_percentage > 0) dots[d.date] = 'bad';
  }
  return dots;
}

function deriveAchievements(currentStreak: number, longestStreak: number, stats: any): Achievement[] {
  const total = stats?.completed_count ?? 0;
  return [
    { id: 'first', title: 'First Routine', description: 'Complete your first routine', icon: 'firstRoutine' as const, unlocked: total > 0 },
    { id: 'streak7', title: '7 Day Streak', description: '7 days in a row', icon: 'streak7' as const, unlocked: longestStreak >= 7, progress: longestStreak < 7 ? longestStreak / 7 : undefined },
    { id: 'streak30', title: '30 Day Streak', description: 'A full month', icon: 'streak30' as const, unlocked: longestStreak >= 30, progress: longestStreak < 30 ? longestStreak / 30 : undefined },
    { id: 'streak100', title: 'Century', description: '100 day streak', icon: 'streak100' as const, unlocked: longestStreak >= 100, progress: longestStreak < 100 ? longestStreak / 100 : undefined },
    { id: 'allcomplete', title: 'Perfect Day', description: 'Every step in a day', icon: 'allComplete' as const, unlocked: total > 0 },
    { id: 'consistency', title: 'Consistent', description: '90%+ for 30 days', icon: 'consistency' as const, unlocked: (stats?.adherence_percentage ?? 0) >= 90, progress: (stats?.adherence_percentage ?? 0) < 90 ? (stats?.adherence_percentage ?? 0) / 100 : undefined },
  ];
}

function formatCategory(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Session Cards ────────────────────────────────────────────── */

function SessionCards({
  routines,
  selectedId,
  onSelect,
  todayStatuses,
}: {
  routines: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  todayStatuses: Record<string, any>;
}) {
  if (routines.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sessionRow}
    >
      {routines.map((r) => (
        <SessionCard
          key={r.id}
          routine={r}
          status={todayStatuses[r.id] ?? null}
          active={r.id === selectedId}
          onPress={() => onSelect(r.id)}
        />
      ))}
    </ScrollView>
  );
}

/* ── Main Screen ──────────────────────────────────────────────── */

export default function RoutineScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = require('expo-router').useLocalSearchParams();
  const initialTab = segments.tab ? Number(segments.tab) : undefined;

  const store = useRoutineStore();
  const {
    routines, todayStatuses, selectedRoutineId, streak, stats,
    conflicts, isLoading, completingAll, dailyHistory,
    init, refresh, completeStep, skipStep, completeAllSteps,
    createRoutine, deleteRoutine, loadStats, loadCost, loadConflicts, loadHistory,
    setSelectedRoutineId, setActiveSegment: storeSetSegment,
  } = store;

  const { entries: diaryEntries } = useDiaryStore();

  const [activeSegment, setActiveSegment] = useState(initialTab ?? 0);
  const [refreshing, setRefreshing] = useState(false);
  const [skipStepId, setSkipStepId] = useState<string | null>(null);
  const [statsPeriodDays, setStatsPeriodDays] = useState(30);
  const [diaryYear, setDiaryYear] = useState(new Date().getFullYear());
  const [diaryMonth, setDiaryMonth] = useState(new Date().getMonth());
  const [diaryPeriodDays, setDiaryPeriodDays] = useState(30);

  const createSheetRef = useRef<BottomSheet>(null);
  const skipSheetRef = useRef<BottomSheet>(null);

  /* ── Effects ──────────────────────────────────────────────── */

  useEffect(() => {
    init();
    loadConflicts();
    loadHistory(120);
  }, []);

  useEffect(() => {
    loadStats(statsPeriodDays);
  }, [statsPeriodDays]);

  useEffect(() => {
    if (activeSegment === 3) loadStats(diaryPeriodDays);
  }, [diaryPeriodDays]);


  /* ── Derived ──────────────────────────────────────────────── */

  // Sort routines: incomplete first, completed last (queue behavior)
  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => {
      const aStatus = todayStatuses[a.id];
      const bStatus = todayStatuses[b.id];
      const aDone = aStatus && aStatus.total_steps > 0 && aStatus.completed_steps >= aStatus.total_steps;
      const bDone = bStatus && bStatus.total_steps > 0 && bStatus.completed_steps >= bStatus.total_steps;
      if (aDone && !bDone) return 1;  // a is done → goes to back
      if (!aDone && bDone) return -1; // b is done → goes to back
      return 0; // keep original order
    });
  }, [routines, todayStatuses]);

  // Auto-select first INCOMPLETE routine (or first routine if all done)
  useEffect(() => {
    if (sortedRoutines.length === 0) return;
    const currentStillValid = sortedRoutines.some(r => r.id === selectedRoutineId);
    if (currentStillValid) {
      // Check if current routine just completed → auto-advance
      const currentStatus = todayStatuses[selectedRoutineId || ''];
      const isDone = currentStatus && currentStatus.total_steps > 0 && currentStatus.completed_steps >= currentStatus.total_steps;
      if (isDone) {
        // Find next incomplete routine
        const nextIncomplete = sortedRoutines.find(r => {
          const s = todayStatuses[r.id];
          return !s || s.total_steps === 0 || s.completed_steps < s.total_steps;
        });
        if (nextIncomplete && nextIncomplete.id !== selectedRoutineId) {
          // Small delay so user sees the completion animation
          setTimeout(() => setSelectedRoutineId(nextIncomplete.id), 1500);
        }
      }
    } else {
      setSelectedRoutineId(sortedRoutines[0].id);
    }
  }, [sortedRoutines, todayStatuses, selectedRoutineId]);

  const currentRoutine = useMemo(
    () => sortedRoutines.find((r) => r.id === selectedRoutineId) ?? sortedRoutines[0] ?? null,
    [sortedRoutines, selectedRoutineId],
  );

  const todayStatus = useMemo(
    () => (currentRoutine ? todayStatuses[currentRoutine.id] ?? null : null),
    [currentRoutine, todayStatuses],
  );

  const activeRoutines = useMemo(
    () => routines.filter((r) => r.is_active),
    [routines],
  );

  const savedRoutines = useMemo(
    () => routines.filter((r) => !r.is_active),
    [routines],
  );

  /* ── Handlers ─────────────────────────────────────────────── */

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleCreateRoutine = useCallback(
    async (data: CreateRoutineData) => {
      createSheetRef.current?.close();
      const name = data.routineName || `${data.sessionName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${data.routineTypeName}`;

      if (data.buildMethod === 'jay') {
        router.push({
          pathname: '/(screens)/build-with-jay',
          params: {
            sessionName: data.sessionName,
            routineType: data.routineType,
            routineName: name,
            messageToJay: data.messageToJay || '',
          },
        } as any);
        return;
      }

      // scratch — create routine and navigate to edit screen
      const created = await createRoutine({
        name,
        period: data.sessionName,
        routine_type: data.routineType,
      });
      if (created) {
        setSelectedRoutineId(created.id);
        router.push({ pathname: '/(screens)/routine-edit', params: { routineId: created.id } } as any);
      }
    },
    [createRoutine, router],
  );

  const handleSkip = useCallback(
    (reason: string) => {
      if (currentRoutine && skipStepId) {
        skipStep(currentRoutine.id, skipStepId, reason);
      }
      skipSheetRef.current?.close();
      setSkipStepId(null);
    },
    [currentRoutine, skipStepId, skipStep],
  );

  const openCreateSheet = useCallback(() => {
    createSheetRef.current?.expand();
  }, []);

  const handleTemplatePress = useCallback(
    (templateId: string) => {
      router.push({ pathname: '/(screens)/routine-template', params: { templateId } } as any);
    },
    [router],
  );

  /* ── Today Tab ────────────────────────────────────────────── */

  const renderToday = () => {
    if (!routines.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🧴</Text>
          <Text style={[styles.emptyTitle, { color: colors.label }]}>
            No routines yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
            Create your first skincare routine to start tracking your progress.
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.systemBlue }]}
            onPress={openCreateSheet}
          >
            <Text style={styles.emptyButtonText}>Create Routine</Text>
          </Pressable>
        </View>
      );
    }

    const completedSteps = todayStatus?.completed_steps ?? 0;
    const totalSteps = todayStatus?.total_steps ?? 0;

    const period = currentRoutine?.period?.toLowerCase() ?? '';
    const gradient = AMBIENT_GRADIENTS[period] ?? DEFAULT_GRADIENT;
    const gradientColors = isDark ? gradient.dark : gradient.light;

    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={gradientColors}
          style={styles.ambientGradient}
          locations={[0, 0.55, 1]}
        />
        <ScrollView
          contentContainerStyle={styles.todayContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        <SessionCards
          routines={sortedRoutines}
          selectedId={currentRoutine?.id ?? null}
          onSelect={setSelectedRoutineId}
          todayStatuses={todayStatuses}
        />

        <HeroRing completed={completedSteps} total={totalSteps} />

        <View style={styles.statPillsRow}>
          <StatPill
            emoji="🔥"
            value={String(streak.current_streak)}
            label="day streak"
            tintColor={colors.systemOrange}
          />
          <StatPill
            emoji="📊"
            value={`${stats?.adherence_percentage ?? 0}%`}
            label="this week"
            tintColor={colors.systemBlue}
          />
        </View>

        {currentRoutine && (
          <StepTable
            title={currentRoutine.name ?? 'Routine'}
            badge={currentRoutine.period?.toUpperCase()}
          >
            {currentRoutine.steps.map((step: any, idx: number) => {
              const todayStep = todayStatus?.steps?.find(
                (s: any) => s.step_id === step.id,
              );
              return (
                <StepTableRow
                  key={step.id}
                  category={formatCategory(step.category)}
                  productName={step.product_name || step.custom_product_name}
                  completed={todayStep?.completed ?? false}
                  skipped={todayStep?.skipped ?? false}
                  completedAt={todayStep?.completed_at}
                  waitTimeSeconds={step.wait_time_seconds}
                  frequency={step.frequency}
                  isLast={idx === currentRoutine.steps.length - 1}
                  onPress={() => completeStep(currentRoutine.id, step.id)}
                  onLongPress={() => {
                    setSkipStepId(step.id);
                    skipSheetRef.current?.expand();
                  }}
                />
              );
            })}
          </StepTable>
        )}

        {currentRoutine && totalSteps > 0 && (
          <View style={{ marginTop: 16, marginHorizontal: 16 }}>
            <CompleteAllButton
              loading={completingAll}
              onPress={() => completeAllSteps(currentRoutine.id)}
              allDone={totalSteps > 0 && completedSteps >= totalSteps}
            />
          </View>
        )}

        {conflicts.length > 0 && (
          <View style={{ marginTop: 12, marginHorizontal: 16 }}>
            <ConflictNotice conflicts={conflicts} />
          </View>
        )}

        {currentRoutine?.total_monthly_cost != null && currentRoutine.total_monthly_cost > 0 && (
          <Text style={[styles.costText, { color: colors.secondaryLabel, marginTop: 12 }]}>
            ₹{currentRoutine.total_monthly_cost}/mo
          </Text>
        )}
      </ScrollView>
      </View>
    );
  };

  /* ── Library Tab ──────────────────────────────────────────── */

  const renderLibrary = () => (
    <ScrollView contentContainerStyle={styles.libraryContent}>
      <FeaturedRoutineCard
        template={FEATURED_ROUTINE}
        onPress={() => handleTemplatePress(FEATURED_ROUTINE.id)}
      />

      <View style={{ height: SPACE.md }} />

      {ROUTINE_CATEGORIES.map((cat) => (
        <CategoryRow
          key={cat.id}
          title={cat.title}
          templates={cat.templates}
          onTemplatePress={handleTemplatePress}
        />
      ))}

      <View style={[styles.sectionDivider, { borderColor: colors.separator }]} />

      <Text style={[styles.sectionTitle, { color: colors.label }]}>Learn</Text>

      <View style={styles.sectionPad}>
        <OrderDiagram amOrder={AM_ORDER} pmOrder={PM_ORDER} />
      </View>

      <View style={{ height: SPACE.md }} />

      <Text style={[styles.sectionTitle, { color: colors.label }]}>
        Ingredient Rules
      </Text>
      <View style={styles.sectionPad}>
        {CONFLICTS.map((c, i) => (
          <ConflictRule key={i} rule={c} />
        ))}
      </View>

      <View style={{ height: SPACE.md }} />

      <Text style={[styles.sectionTitle, { color: colors.label }]}>
        Ingredient Spotlights
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {INGREDIENT_SPOTLIGHTS.map((item, i) => (
          <IngredientSpotlight key={i} spotlight={item} />
        ))}
      </ScrollView>

      <View style={{ height: SPACE.md }} />

      <Text style={[styles.sectionTitle, { color: colors.label }]}>
        Seasonal Guides
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {SEASONAL_GUIDES.map((item, i) => (
          <SeasonalCard key={i} guide={item} />
        ))}
      </ScrollView>

      <View style={{ height: SPACE.md }} />

      <Text style={[styles.sectionTitle, { color: colors.label }]}>
        Science & Guides
      </Text>
      <View style={styles.sectionPad}>
        {SCIENCE_ARTICLES.map((article, i) => (
          <ArticleCard key={i} article={article} />
        ))}
      </View>
    </ScrollView>
  );

  /* ── My Routines Tab ──────────────────────────────────────── */

  const renderRoutines = () => {
    if (!routines.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.label }]}>
            No routines yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
            Create a routine to get started with your skincare journey.
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.systemBlue }]}
            onPress={openCreateSheet}
          >
            <Text style={styles.emptyButtonText}>Create Routine</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.routinesContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* New routine button */}
        <Pressable
          style={[styles.newRoutineBtn, { borderColor: colors.systemBlue }]}
          onPress={openCreateSheet}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.systemBlue + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: colors.systemBlue }}>+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.label }}>
              New Routine
            </Text>
            <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>
              Build with JAY or from scratch
            </Text>
          </View>
        </Pressable>

        {/* Active section */}
        <Text style={[styles.sectionTitle, { color: colors.label, marginTop: 24 }]}>
          Active ({activeRoutines.length})
        </Text>
        {activeRoutines.map((routine) => (
          <RoutineManagementCard
            key={routine.id}
            routine={routine}
            isActive={true}
            adherence={stats?.adherence_percentage}
            streak={streak.current_streak}
            onPress={() =>
              router.push({ pathname: '/(screens)/routine-detail', params: { routineId: routine.id } } as any)
            }
            onEdit={() =>
              router.push({ pathname: '/(screens)/routine-edit', params: { routineId: routine.id } } as any)
            }
            onMore={() =>
              Alert.alert('Routine Options', routine.name || 'Routine', [
                {
                  text: 'Duplicate',
                  onPress: () => createRoutine({ name: `${routine.name} (copy)`, period: routine.period, routine_type: routine.routine_type }),
                },
                {
                  text: 'Share',
                  onPress: () =>
                    Share.share({ message: `Check out my "${routine.name}" skincare routine on JAY!\n\n${routine.steps.length} steps · ${routine.routine_type}` }),
                },
                {
                  text: 'Deactivate',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert(
                      'Deactivate routine?',
                      'This routine will be saved but won\'t track daily progress anymore.',
                      [
                        { text: 'Keep Active', style: 'cancel' },
                        { text: 'Deactivate', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
                      ]
                    ),
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        ))}

        {/* Saved section */}
        <Text style={[styles.sectionTitle, { color: colors.label, marginTop: 24 }]}>
          Saved
        </Text>
        {savedRoutines.length > 0 ? (
          savedRoutines.map((routine) => (
            <RoutineManagementCard
              key={routine.id}
              routine={routine}
              isActive={false}
              onPress={() =>
                router.push({ pathname: '/(screens)/routine-detail', params: { routineId: routine.id } } as any)
              }
              onEdit={() =>
                router.push({ pathname: '/(screens)/routine-edit', params: { routineId: routine.id } } as any)
              }
              onMore={() => {}}
              onActivate={() => createRoutine({ name: routine.name || 'Routine', period: routine.period, routine_type: routine.routine_type })}
              onDelete={() => Alert.alert('Delete?', 'Permanently remove this routine?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
              ])}
            />
          ))
        ) : (
          <Text style={{ fontSize: 14, color: colors.tertiaryLabel, paddingHorizontal: 16 }}>
            Deactivated routines will appear here.
          </Text>
        )}

        {/* Stats section */}
        {stats && (
          <>
            <View style={[styles.sectionDivider, { borderColor: colors.separator }]} />
            <StatsPeriodToggle
              active={statsPeriodDays}
              onChange={setStatsPeriodDays}
            />
            <StatsHero streak={streak.current_streak} />
            <View style={styles.sectionPad}>
              <StatCards
                adherence={stats.adherence_percentage}
                streak={stats.current_streak}
                longest={stats.longest_streak}
                skipped={stats.skipped_count}
              />
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  /* ── Diary Tab ────────────────────────────────────────────── */

  const heatmapData = useMemo(() => historyToHeatmap(dailyHistory), [dailyHistory]);
  const weeklyAdherence = useMemo(() => historyToWeeklyAdherence(dailyHistory), [dailyHistory]);
  const calendarDots = useMemo(() => historyToCalendarDots(dailyHistory), [dailyHistory]);
  const achievements = useMemo(
    () => deriveAchievements(streak.current_streak, streak.longest_streak, stats),
    [streak, stats],
  );

  const renderDiary = () => (
    <ScrollView
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await Promise.all([loadStats(diaryPeriodDays), loadHistory(120)]);
          setRefreshing(false);
        }} />
      }
    >
      {/* Streak */}
      <View style={styles.sectionPad}>
        <StreakDashboard currentStreak={streak.current_streak} longestStreak={streak.longest_streak} />
      </View>

      {/* Heatmap */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Activity</Text>
        <View style={[styles.diaryCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <ContributionHeatmap data={heatmapData} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Statistics</Text>
        <StatsPeriodToggle active={diaryPeriodDays} onChange={setDiaryPeriodDays} />
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.diaryStatCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[styles.diaryStatValue, { color: colors.systemGreen }]}>{stats?.adherence_percentage ?? 0}%</Text>
            <Text style={[styles.diaryStatLabel, { color: colors.secondaryLabel }]}>Adherence</Text>
          </View>
          <View style={[styles.diaryStatCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[styles.diaryStatValue, { color: colors.systemBlue }]}>{stats?.total_routines_possible ?? 0}</Text>
            <Text style={[styles.diaryStatLabel, { color: colors.secondaryLabel }]}>Total Sessions</Text>
          </View>
        </View>
      </View>

      {/* Weekly */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>This Week</Text>
        <View style={[styles.diaryCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <WeeklyBarChart data={weeklyAdherence} />
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Breakdown</Text>
        <CompletionBreakdown
          completed={stats?.completed_count ?? 0}
          skipped={stats?.skipped_count ?? 0}
          missed={stats?.missed_count ?? 0}
        />
      </View>

      {/* Achievements */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {achievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
        </ScrollView>
      </View>

      {/* Calendar */}
      <View style={styles.sectionPad}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Skin Journal</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Pressable onPress={() => { if (diaryMonth === 0) { setDiaryMonth(11); setDiaryYear(y => y - 1); } else setDiaryMonth(m => m - 1); }} style={{ padding: 8 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
          </Pressable>
          <Text style={{ fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: colors.label }}>{MONTH_NAMES[diaryMonth]} {diaryYear}</Text>
          <Pressable onPress={() => { if (diaryMonth === 11) { setDiaryMonth(0); setDiaryYear(y => y + 1); } else setDiaryMonth(m => m + 1); }} style={{ padding: 8 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Polyline points="9 18 15 12 9 6" /></Svg>
          </Pressable>
        </View>
        <CalendarGrid year={diaryYear} month={diaryMonth} dots={calendarDots} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 }}>
          {[{ label: 'Good', color: colors.systemGreen }, { label: 'Okay', color: colors.systemOrange }, { label: 'Bad', color: colors.systemRed }].map(item => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
              <Text style={{ fontSize: 12, fontFamily: 'Outfit', color: colors.secondaryLabel }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Entries */}
      {diaryEntries.length > 0 && (
        <View style={styles.sectionPad}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>Recent Entries</Text>
          {diaryEntries.slice(0, 5).map(entry => <DiaryEntryCard key={entry.id} entry={entry} />)}
        </View>
      )}
    </ScrollView>
  );

  /* ── Segment content ────────────��─────────────────────────── */

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.systemBlue} />
        </View>
      );
    }
    switch (activeSegment) {
      case 0:
        return renderToday();
      case 1:
        return renderLibrary();
      case 2:
        return renderRoutines();
      case 3:
        return renderDiary();
      default:
        return null;
    }
  };

  /* ── Main render ──────────────────────────────────────────── */

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.systemBackground }]}>
      <View style={{ paddingTop: insets.top }}>
        <RoutineHeader onPlusPress={openCreateSheet} />
        <View style={styles.segmentWrap}>
          <SegmentedControl
            segments={SEGMENTS}
            active={activeSegment}
            onChange={setActiveSegment}
          />
        </View>
      </View>

      {renderContent()}

      <CreateRoutineSheet
        sheetRef={createSheetRef}
        onCreated={handleCreateRoutine}
        onBrowseLibrary={() => setActiveSegment(1)}
      />
      <SkipReasonSheet
        sheetRef={skipSheetRef}
        onSkip={handleSkip}
        onCancel={() => {
          skipSheetRef.current?.close();
          setSkipStepId(null);
        }}
      />
    </GestureHandlerRootView>
  );
}

/* ── Styles ────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  sectionPad: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 20,
    marginHorizontal: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ambientGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    pointerEvents: 'none',
  },
  todayContent: {
    paddingBottom: 20,
  },
  libraryContent: {
    paddingTop: 12,
  },
  routinesContent: {
    padding: 16,
  },
  newRoutineBtn: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 12,
  },
  diaryCard: {
    borderRadius: 12,
    padding: 16,
  },
  diaryStatCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  diaryStatValue: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
  },
  diaryStatLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
});
