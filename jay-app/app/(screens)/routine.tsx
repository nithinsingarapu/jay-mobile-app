import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Pressable, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';
import { useRoutineStore } from '../../stores/routineStore';

import RoutineHeader from '../../components/routine/RoutineHeader';
import SegmentedControl from '../../components/routine/SegmentedControl';
import HeroRing from '../../components/routine/HeroRing';
import StatPill from '../../components/routine/StatPill';
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
import { ROUTINE_CATEGORIES, FEATURED_ROUTINE } from '../../data/routineLibrary';
import {
  TIPS, AM_ORDER, PM_ORDER, CONFLICTS,
  INGREDIENT_SPOTLIGHTS, SEASONAL_GUIDES, SCIENCE_ARTICLES,
} from '../../data/learnContent';

const SEGMENTS = ['Today', 'Library', 'My Routines'];

function formatCategory(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Session Tabs ─────────────────────────────────────────────── */

function SessionTabs({
  routines,
  selectedId,
  onSelect,
  colors,
}: {
  routines: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  colors: any;
}) {
  if (routines.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sessionRow}
    >
      {routines.map((r) => {
        const active = r.id === selectedId;
        return (
          <Pressable
            key={r.id}
            onPress={() => onSelect(r.id)}
            style={[
              styles.sessionPill,
              {
                backgroundColor: active
                  ? colors.systemBlue
                  : colors.secondarySystemFill,
              },
            ]}
          >
            <Text
              style={[
                styles.sessionPillText,
                { color: active ? '#fff' : colors.label },
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ── Main Screen ──────────────────────────────────────────────── */

export default function RoutineScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const store = useRoutineStore();
  const {
    routines, todayStatuses, selectedRoutineId, streak, stats,
    conflicts, isLoading, completingAll,
    init, refresh, completeStep, skipStep, completeAllSteps,
    createRoutine, deleteRoutine, loadStats, loadCost, loadConflicts,
    setSelectedRoutineId, setActiveSegment: storeSetSegment,
  } = store;

  const [activeSegment, setActiveSegment] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [skipStepId, setSkipStepId] = useState<string | null>(null);
  const [statsPeriodDays, setStatsPeriodDays] = useState(30);

  const createSheetRef = useRef<BottomSheet>(null);
  const skipSheetRef = useRef<BottomSheet>(null);

  /* ── Effects ──────────────────────────────────────────────── */

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadStats(statsPeriodDays);
  }, [statsPeriodDays]);

  /* ── Derived ──────────────────────────────────────────────── */

  const currentRoutine = useMemo(
    () => routines.find((r) => r.id === selectedRoutineId) ?? routines[0] ?? null,
    [routines, selectedRoutineId],
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
      if (data.buildMethod === 'jay') {
        router.push({
          pathname: '/(screens)/build-with-jay',
          params: { sessionName: data.sessionName, routineType: data.routineType },
        } as any);
        return;
      }
      const created = await createRoutine({
        name: `${data.sessionName} — ${data.routineTypeName}`,
        period: data.sessionName,
        routine_type: data.routineType,
      });
      if (data.buildMethod === 'scratch' && created) {
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
    (id: string) => {
      router.push({ pathname: '/routine-template', params: { id } });
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

    return (
      <ScrollView
        contentContainerStyle={styles.todayContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SessionTabs
          routines={routines}
          selectedId={currentRoutine?.id ?? null}
          onSelect={setSelectedRoutineId}
          colors={colors}
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
          <CompleteAllButton
            loading={completingAll}
            onPress={() => completeAllSteps(currentRoutine.id)}
            allDone={totalSteps > 0 && completedSteps >= totalSteps}
          />
        )}

        {conflicts.length > 0 && <ConflictNotice conflicts={conflicts} />}

        {currentRoutine?.total_monthly_cost != null && currentRoutine.total_monthly_cost > 0 && (
          <Text style={[styles.costText, { color: colors.secondaryLabel }]}>
            ₹{currentRoutine.total_monthly_cost}/mo
          </Text>
        )}
      </ScrollView>
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
              router.push({ pathname: '/routine-detail', params: { id: routine.id } })
            }
            onEdit={() =>
              router.push({ pathname: '/routine-edit', params: { id: routine.id } })
            }
            onMore={() =>
              Alert.alert('Options', undefined, [
                {
                  text: 'Duplicate',
                  onPress: () => createRoutine({ name: `${routine.name} (copy)`, period: routine.period, routine_type: routine.routine_type }),
                },
                {
                  text: 'Deactivate',
                  style: 'destructive',
                  onPress: () => deleteRoutine(routine.id),
                },
                {
                  text: 'Share',
                  onPress: () =>
                    Share.share({ message: `Check out my ${routine.name} routine!` }),
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

  /* ── Segment content ──────────────────────────────────────── */

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

      <CreateRoutineSheet sheetRef={createSheetRef} onCreated={handleCreateRoutine} />
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
  sessionPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sessionPillText: {
    fontSize: 14,
    fontWeight: '600',
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
});
