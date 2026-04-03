/**
 * Routine Screen — 4-segment hub
 *   Today  |  Explore  |  My Routines  |  Learn
 *
 * Uses store.routines (array), store.todayStatuses (record),
 * store.selectedRoutineId (string | null).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';
import { useRoutineStore } from '../../stores/routineStore';
import { useUserStore } from '../../stores/userStore';

// ── Components ──────────────────────────────────────────────────────────
import RoutineHeader from '../../components/routine/RoutineHeader';
import SegmentedControl from '../../components/routine/SegmentedControl';
import ProgressRing from '../../components/routine/ProgressRing';
import StepRow from '../../components/routine/StepRow';
import CompleteAllButton from '../../components/routine/CompleteAllButton';
import { RoutineCard } from '../../components/routine/RoutineCard';
import { StreakAdherenceRow } from '../../components/routine/StreakAdherenceRow';
import { DayDots, type DayDotData } from '../../components/routine/DayDots';
import { ConflictNotice } from '../../components/routine/ConflictNotice';
import { MonthlyCostPill } from '../../components/routine/MonthlyCostPill';
import { StatCards } from '../../components/routine/StatCards';
import { StatsHero } from '../../components/routine/StatsHero';
import { StatsPeriodToggle } from '../../components/routine/StatsPeriodToggle';
import FeaturedRoutineCard from '../../components/routine/FeaturedRoutineCard';
import CategoryRow from '../../components/routine/CategoryRow';
import TipCard from '../../components/routine/TipCard';
import OrderDiagram from '../../components/routine/OrderDiagram';
import ConflictRule from '../../components/routine/ConflictRule';
import IngredientSpotlight from '../../components/routine/IngredientSpotlight';
import SeasonalCard from '../../components/routine/SeasonalCard';
import ArticleCard from '../../components/routine/ArticleCard';

// ── Sheets ──────────────────────────────────────────────────────────────
import { CreateRoutineSheet, type CreateRoutineData } from '../../components/routine/sheets/CreateRoutineSheet';
import { SkipReasonSheet } from '../../components/routine/sheets/SkipReasonSheet';

// ── Data ────────────────────────────────────────────────────────────────
import {
  ROUTINE_CATEGORIES,
  FEATURED_ROUTINE,
} from '../../data/routineLibrary';
import {
  TIPS,
  AM_ORDER,
  PM_ORDER,
  CONFLICTS,
  INGREDIENT_SPOTLIGHTS,
  SEASONAL_GUIDES,
  SCIENCE_ARTICLES,
} from '../../data/learnContent';

// ── Constants ───────────────────────────────────────────────────────────
const SEGMENTS = ['Today', 'Explore', 'My Routines', 'Learn'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SESSION TABS — horizontal pill selector for AM / PM / custom sessions
// ═══════════════════════════════════════════════════════════════════════════
function SessionTabs({
  routines,
  selectedId,
  onSelect,
}: {
  routines: { id: string; name: string | null; period: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (routines.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.sessionRow}
    >
      {routines.map((r) => {
        const active = r.id === selectedId;
        return (
          <Pressable
            key={r.id}
            onPress={() => onSelect(r.id)}
            style={[
              s.sessionPill,
              { backgroundColor: active ? colors.systemBlue : colors.secondarySystemFill },
            ]}
          >
            <Text
              style={[
                s.sessionPillText,
                { color: active ? '#FFFFFF' : colors.label },
              ]}
            >
              {r.name ?? r.period.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const store = useRoutineStore();
  const { user } = useUserStore();

  // ── Local state ─────────────────────────────────────────────────────
  const [activeSegment, setActiveSegment] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [skipStepId, setSkipStepId] = useState<string | null>(null);
  const [statsPeriodDays, setStatsPeriodDays] = useState(30);

  // ── Sheet refs ──────────────────────────────────────────────────────
  const createSheetRef = useRef<BottomSheet>(null);
  const skipSheetRef = useRef<BottomSheet>(null);

  // ── Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    store.init();
  }, []);

  useEffect(() => {
    store.loadStats(statsPeriodDays);
  }, [statsPeriodDays]);

  // ── Derived ─────────────────────────────────────────────────────────
  const currentRoutine = useMemo(
    () => store.routines.find((r) => r.id === store.selectedRoutineId) ?? store.routines[0] ?? null,
    [store.routines, store.selectedRoutineId],
  );
  const todayStatus = currentRoutine
    ? store.todayStatuses[currentRoutine.id] ?? null
    : null;

  // ── Handlers ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await store.refresh();
    setRefreshing(false);
  }, []);

  const handleCreateRoutine = useCallback(
    async (data: CreateRoutineData) => {
      createSheetRef.current?.close();
      if (data.buildMethod === 'jay') {
        router.push({
          pathname: '/(screens)/build-with-jay',
          params: {
            sessionName: data.sessionName,
            routineType: data.routineType,
          },
        });
      } else {
        const routine = await store.createRoutine({
          name: `${data.sessionName} — ${data.routineTypeName}`,
          period: data.sessionName,
          routine_type: data.routineType,
        });
        if (routine) {
          store.setSelectedRoutineId(routine.id);
          if (data.buildMethod === 'scratch') {
            router.push({
              pathname: '/(screens)/routine-edit',
              params: { routineId: routine.id },
            });
          }
        }
      }
    },
    [router, store],
  );

  const handleSkip = useCallback(
    (reason: string) => {
      if (skipStepId && currentRoutine) {
        store.skipStep(currentRoutine.id, skipStepId, reason);
      }
      setSkipStepId(null);
      skipSheetRef.current?.close();
    },
    [skipStepId, currentRoutine, store],
  );

  const openCreateSheet = useCallback(() => {
    createSheetRef.current?.expand();
  }, []);

  const handleTemplatePress = useCallback(
    (templateId: string) => {
      router.push({
        pathname: '/(screens)/routine-template',
        params: { templateId },
      });
    },
    [router],
  );

  // ── Day dots for the week ───────────────────────────────────────────
  const weekDots = useMemo<DayDotData[]>(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay(); // 0=Sun
    const mondayOffset = today === 0 ? 6 : today - 1;
    return days.map((day, i) => {
      let status: DayDotData['status'] = 'none';
      if (i < mondayOffset) status = 'complete';
      if (i === mondayOffset) status = 'today';
      return { day, status };
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // TODAY
  // ═══════════════════════════════════════════════════════════════════════
  const renderToday = () => {
    if (store.routines.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={s.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[s.emptyEmoji]}>🧴</Text>
          <Text style={[s.emptyTitle, { color: colors.label }]}>
            No routines yet
          </Text>
          <Text style={[s.emptyBody, { color: colors.secondaryLabel }]}>
            Build your first skincare routine — JAY can create one for you based
            on your skin profile.
          </Text>
          <Pressable
            style={[s.emptyButton, { backgroundColor: colors.systemBlue }]}
            onPress={openCreateSheet}
          >
            <Text style={s.emptyButtonText}>Create your first routine</Text>
          </Pressable>
        </ScrollView>
      );
    }

    const completed = todayStatus?.completed_steps ?? 0;
    const total = todayStatus?.total_steps ?? 0;
    const allDone = total > 0 && completed >= total;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.label}
          />
        }
        contentContainerStyle={s.todayContent}
      >
        {/* Session tabs */}
        <SessionTabs
          routines={store.routines}
          selectedId={currentRoutine?.id ?? null}
          onSelect={store.setSelectedRoutineId}
        />

        {/* Day dots */}
        <View style={s.sectionPad}>
          <DayDots data={weekDots} />
        </View>

        {/* Streak + Adherence */}
        <View style={s.sectionPad}>
          <StreakAdherenceRow
            streak={store.streak.current_streak}
            bestStreak={store.streak.longest_streak}
            adherence={store.stats?.adherence_percentage ?? 0}
          />
        </View>

        {/* Progress ring */}
        <View style={s.ringContainer}>
          <ProgressRing completed={completed} total={total} />
        </View>

        {/* Steps */}
        {currentRoutine?.steps.map((step, i) => {
          const stepStatus = todayStatus?.steps.find(
            (ss) => ss.step_id === step.id,
          );
          return (
            <StepRow
              key={step.id}
              step={step}
              todayStep={stepStatus}
              onComplete={() =>
                store.completeStep(currentRoutine.id, step.id)
              }
              onLongPress={() => {
                setSkipStepId(step.id);
                skipSheetRef.current?.expand();
              }}
              isLast={i === currentRoutine.steps.length - 1}
            />
          );
        })}

        {/* Complete all */}
        {currentRoutine && total > 0 && (
          <View style={s.sectionPad}>
            <CompleteAllButton
              allDone={allDone}
              loading={store.completingAll}
              onPress={() => store.completeAllSteps(currentRoutine.id)}
            />
          </View>
        )}

        {/* Conflicts */}
        {store.conflicts.length > 0 && (
          <View style={s.sectionPad}>
            <ConflictNotice conflicts={store.conflicts} />
          </View>
        )}

        {/* Monthly cost */}
        {currentRoutine?.total_monthly_cost != null &&
          currentRoutine.total_monthly_cost > 0 && (
            <View style={s.sectionPad}>
              <MonthlyCostPill
                cost={currentRoutine.total_monthly_cost}
                onPress={() => store.loadCost()}
              />
            </View>
          )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // EXPLORE
  // ═══════════════════════════════════════════════════════════════════════
  const renderExplore = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.exploreContent}
    >
      {/* Featured */}
      <FeaturedRoutineCard
        template={FEATURED_ROUTINE}
        onPress={() => handleTemplatePress(FEATURED_ROUTINE.id)}
      />

      <View style={{ height: SPACE.xl }} />

      {/* Category rows */}
      {ROUTINE_CATEGORIES.map((cat) => (
        <CategoryRow
          key={cat.id}
          title={cat.title}
          templates={cat.templates}
          onTemplatePress={handleTemplatePress}
        />
      ))}

      {/* Quick tips */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>Quick Tips</Text>
      <View style={[{ marginHorizontal: SPACE.lg, backgroundColor: colors.secondarySystemBackground, borderRadius: 12, overflow: 'hidden' }]}>
        {TIPS.slice(0, 6).map((tip, i) => (
          <Pressable
            key={tip.id}
            style={[{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
            }, i < 5 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>{tip.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Outfit-SemiBold', color: colors.label }}>{tip.title}</Text>
              <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Outfit', color: colors.secondaryLabel, marginTop: 1 }}>{tip.body}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // MY ROUTINES
  // ═══════════════════════════════════════════════════════════════════════
  const renderRoutines = () => {
    if (store.routines.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={s.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={[s.emptyTitle, { color: colors.label }]}>
            No routines yet
          </Text>
          <Text style={[s.emptyBody, { color: colors.secondaryLabel }]}>
            Create your first routine to start tracking your skincare journey.
          </Text>
          <Pressable
            style={[s.emptyButton, { backgroundColor: colors.systemBlue }]}
            onPress={openCreateSheet}
          >
            <Text style={s.emptyButtonText}>Create a routine</Text>
          </Pressable>
        </ScrollView>
      );
    }

    const activeRoutines = store.routines.filter(r => r.is_active);
    const savedRoutines = store.routines.filter(r => !r.is_active);

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.label}
          />
        }
        contentContainerStyle={s.routinesContent}
      >
        {/* Create new routine button */}
        <Pressable
          onPress={openCreateSheet}
          style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
            backgroundColor: colors.systemBlue + '10', borderRadius: 14, borderWidth: 1,
            borderColor: colors.systemBlue + '30', borderStyle: 'dashed' }]}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.systemBlue,
            alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '300' }}>+</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'Outfit-SemiBold', color: colors.label }}>New Routine</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Outfit', color: colors.secondaryLabel }}>Build with JAY or from scratch</Text>
          </View>
        </Pressable>

        {/* Active Routines */}
        {activeRoutines.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: SPACE.xl, marginBottom: SPACE.sm }]}>
              Active ({activeRoutines.length})
            </Text>
            {activeRoutines.map(routine => (
              <View key={routine.id} style={{ marginBottom: 10 }}>
                <RoutineCard
                  routine={routine}
                  isActive={true}
                  onPress={() => router.push({ pathname: '/(screens)/routine-detail', params: { routineId: routine.id } })}
                />
                {/* Action row below card */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, paddingHorizontal: 4 }}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(screens)/routine-edit', params: { routineId: routine.id } })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10,
                      backgroundColor: colors.tertiarySystemFill, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: colors.secondaryLabel }}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Alert.alert('Deactivate?', 'This routine will be saved but won\'t track daily progress.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Deactivate', style: 'destructive', onPress: () => store.deleteRoutine(routine.id) },
                      ]);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10,
                      backgroundColor: colors.tertiarySystemFill, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: colors.systemOrange }}>Deactivate</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      store.createRoutine({
                        name: `${routine.name} (copy)`,
                        period: routine.period,
                        routine_type: routine.routine_type,
                        description: routine.description || undefined,
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10,
                      backgroundColor: colors.tertiarySystemFill, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: colors.secondaryLabel }}>Duplicate</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Saved / Inactive Routines */}
        <Text style={[s.sectionTitle, { marginTop: SPACE.xl, marginBottom: SPACE.sm, color: colors.label }]}>
          Saved
        </Text>
        {savedRoutines.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.secondarySystemBackground,
            borderRadius: 12 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Outfit', color: colors.tertiaryLabel }}>
              Deactivated routines will appear here
            </Text>
          </View>
        ) : (
          savedRoutines.map(routine => (
            <View key={routine.id} style={{ marginBottom: 10 }}>
              <RoutineCard routine={routine} isActive={false}
                onPress={() => router.push({ pathname: '/(screens)/routine-detail', params: { routineId: routine.id } })} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, paddingHorizontal: 4 }}>
                <Pressable
                  onPress={() => {
                    store.createRoutine({
                      name: routine.name || 'Routine',
                      period: routine.period,
                      routine_type: routine.routine_type,
                    });
                  }}
                  style={{ paddingVertical: 6, paddingHorizontal: 10,
                    backgroundColor: colors.systemBlue + '15', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: colors.systemBlue }}>Activate</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert('Delete?', 'This routine will be permanently removed.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => store.deleteRoutine(routine.id) },
                    ]);
                  }}
                  style={{ paddingVertical: 6, paddingHorizontal: 10,
                    backgroundColor: colors.systemRed + '10', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Medium', color: colors.systemRed }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Stats summary */}
        {store.stats && (
          <>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: SPACE.xl }} />
            <StatsPeriodToggle active={statsPeriodDays} onChange={setStatsPeriodDays} />
            <View style={{ height: SPACE.md }} />
            <StatsHero streak={store.streak.current_streak} />
            <View style={s.sectionPad}>
              <StatCards
                adherence={store.stats.adherence_percentage}
                streak={store.stats.current_streak}
                longest={store.stats.longest_streak}
                skipped={store.stats.skipped_count}
              />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LEARN
  // ═══════════════════════════════════════════════════════════════════════
  const renderLearn = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.learnContent}
    >
      {/* Layering order */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>
        Layering Order
      </Text>
      <OrderDiagram amOrder={AM_ORDER} pmOrder={PM_ORDER} />

      <View style={{ height: SPACE.xl }} />

      {/* Conflict rules */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>
        Ingredient Conflicts
      </Text>
      {CONFLICTS.map((rule, i) => (
        <ConflictRule key={i} rule={rule} />
      ))}

      <View style={{ height: SPACE.xl }} />

      {/* Ingredient spotlights */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>
        Ingredient Spotlights
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalScroll}
      >
        {INGREDIENT_SPOTLIGHTS.map((spotlight) => (
          <IngredientSpotlight key={spotlight.id} spotlight={spotlight} />
        ))}
      </ScrollView>

      <View style={{ height: SPACE.xl }} />

      {/* Seasonal guides */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>
        Seasonal Guides
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalScroll}
      >
        {SEASONAL_GUIDES.map((guide) => (
          <SeasonalCard key={guide.id} guide={guide} />
        ))}
      </ScrollView>

      <View style={{ height: SPACE.xl }} />

      {/* Science articles */}
      <Text style={[s.sectionTitle, { color: colors.label }]}>
        Science & Guides
      </Text>
      {SCIENCE_ARTICLES.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}

      {/* Extra tips */}
      <View style={{ height: SPACE.xl }} />
      <Text style={[s.sectionTitle, { color: colors.label }]}>More Tips</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalScroll}
      >
        {TIPS.slice(6).map((tip) => (
          <TipCard key={tip.id} tip={tip} />
        ))}
      </ScrollView>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <GestureHandlerRootView style={[s.root, { backgroundColor: colors.systemBackground }]}>
      <View style={{ paddingTop: insets.top }}>
        <RoutineHeader onPlusPress={openCreateSheet} />
        <View style={s.segmentWrap}>
          <SegmentedControl
            segments={[...SEGMENTS]}
            active={activeSegment}
            onChange={setActiveSegment}
          />
        </View>
      </View>

      {/* Loading */}
      {store.isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={colors.label} />
          <Text style={[s.loadingText, { color: colors.secondaryLabel }]}>
            Loading...
          </Text>
        </View>
      ) : (
        <>
          {activeSegment === 0 && renderToday()}
          {activeSegment === 1 && renderExplore()}
          {activeSegment === 2 && renderRoutines()}
          {activeSegment === 3 && renderLearn()}
        </>
      )}

      {/* ── Bottom sheets ──────────────────────────────────────────── */}
      <CreateRoutineSheet
        sheetRef={createSheetRef}
        onCreated={handleCreateRoutine}
      />
      <SkipReasonSheet
        sheetRef={skipSheetRef}
        onSkip={handleSkip}
        onCancel={() => {
          setSkipStepId(null);
          skipSheetRef.current?.close();
        }}
      />
    </GestureHandlerRootView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.sm,
  },

  // Session tabs
  sessionRow: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    gap: 8,
  },
  sessionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionPillText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },

  // Shared
  sectionPad: {
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  horizontalScroll: {
    paddingHorizontal: SPACE.lg,
    gap: 10,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },

  // Today
  todayContent: {
    paddingBottom: 20,
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
    marginBottom: SPACE.md,
  },

  // Explore
  exploreContent: {
    paddingTop: SPACE.md,
  },

  // My Routines
  routinesContent: {
    padding: SPACE.lg,
    gap: 12,
  },
  statsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.12)',
    marginVertical: SPACE.lg,
  },

  // Learn
  learnContent: {
    paddingTop: SPACE.lg,
    paddingBottom: 20,
  },
});
