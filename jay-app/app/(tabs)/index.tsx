import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { QuickActionsGrid } from '../../components/home/QuickActionsGrid';
import { RoutineCarousel } from '../../components/home/RoutineCarousel';
import { ForYouCarousel } from '../../components/home/ForYouCarousel';
import { InsightNudge } from '../../components/home/InsightNudge';
import { CapSlapPreview } from '../../components/home/CapSlapPreview';
import { EnvironmentBar } from '../../components/home/EnvironmentBar';
import { useUserStore } from '../../stores/userStore';
import { useRoutineStore } from '../../stores/routineStore';
import { useTheme } from '../../lib/theme';
import { mockDiscoverArticles, mockCapSlapVerdicts } from '../../constants/mockData';
import { TYPE, SPACE, RADIUS } from '../../constants/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profileLoading } = useUserStore();
  const routineStore = useRoutineStore();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name ? user.name.split(' ')[0] : 'there';

  useEffect(() => { routineStore.init(); }, []);

  const routineSteps = useMemo(() => {
    const routine = period === 'AM' ? routineStore.amRoutine : routineStore.pmRoutine;
    const todayStatus = period === 'AM' ? routineStore.amTodayStatus : routineStore.pmTodayStatus;
    if (!routine?.steps?.length) return [];
    return routine.steps.map((step, i) => {
      const ss = todayStatus?.steps?.find((s) => s.step_id === step.id);
      return {
        id: step.id,
        step: step.step_order ?? i + 1,
        category: step.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        product: step.product_name || step.custom_product_name || '',
        brand: step.product_brand || step.custom_product_name || step.product_name || '',
        instruction: step.instruction || '',
        completed: ss?.completed ?? false,
      };
    });
  }, [period, routineStore.amRoutine, routineStore.pmRoutine, routineStore.amTodayStatus, routineStore.pmTodayStatus]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.systemBackground }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={$.header}>
        <View style={{ flex: 1 }}>
          <Text style={[$.greeting, { color: colors.secondaryLabel }]}>{greeting},</Text>
          <Text style={[$.name, { color: colors.label }]}>{firstName}</Text>
        </View>
        <View style={$.headerRight}>
          <Pressable onPress={() => router.push('/(screens)/notifications' as any)} style={[$.iconBtn, { backgroundColor: colors.quaternarySystemFill }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.5" strokeLinecap="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </Svg>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile' as any)}>
            <View style={[$.avatar, { backgroundColor: colors.systemBlue }]}>
              <Text style={$.avatarText}>{(user.name || '?')[0]}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* ── Environment Bar ──────────────────────────────────── */}
      <EnvironmentBar />

      {/* ── Profile Health Card ─────────────────────────────── */}
      <View style={[$.card, { backgroundColor: colors.secondarySystemBackground }]}>
        {profileLoading ? (
          <Text style={[$.cardHint, { color: colors.tertiaryLabel }]}>Loading your profile...</Text>
        ) : (
          <View style={$.cardInner}>
            <ScoreRing score={user.profileCompleteness} size={60} />
            <View style={{ flex: 1 }}>
              <Text style={[$.cardOverline, { color: colors.secondaryLabel }]}>PROFILE HEALTH</Text>
              <Text style={[$.cardTitle, { color: colors.label }]}>
                {user.profileCompleteness >= 70 ? 'Looking great!' : user.profileCompleteness >= 30 ? 'Getting there' : 'Just getting started'}
              </Text>
              <Text style={[$.cardSub, { color: colors.tertiaryLabel }]}>{user.profileCompleteness}% complete · {user.level}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Streak Card (if streak > 0) ─────────────────────── */}
      {routineStore.streak.current_streak > 0 ? (
        <View style={[$.streakCard, { backgroundColor: isDark ? '#1A1500' : '#FFF8E1' }]}>
          <Text style={$.streakEmoji}>🔥</Text>
          <View>
            <Text style={[$.streakNum, { color: colors.label }]}>{routineStore.streak.current_streak} day streak</Text>
            <Text style={[$.streakSub, { color: colors.secondaryLabel }]}>Keep it going!</Text>
          </View>
        </View>
      ) : null}

      {/* ── Quick Actions ──────────────────────────────────── */}
      <QuickActionsGrid />

      {/* ── Today's Routine ────────────────────────────────── */}
      <RoutineCarousel
        steps={routineSteps}
        period={period}
        onTogglePeriod={() => setPeriod(period === 'AM' ? 'PM' : 'AM')}
      />

      {/* ── For You ────────────────────────────────────────── */}
      <ForYouCarousel articles={mockDiscoverArticles} />

      {/* ── Insight ────────────────────────────────────────── */}
      <InsightNudge text="Your skin responds well to niacinamide — 8 good days since adding it." />

      {/* ── Cap or Slap ────────────────────────────────────── */}
      <CapSlapPreview verdicts={mockCapSlapVerdicts} />
    </ScrollView>
  );
}

const $ = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.lg,
  },
  greeting: {
    ...TYPE.subheadline,
  },
  name: {
    ...TYPE.largeTitle,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },

  // Card
  card: {
    marginHorizontal: SPACE.xl,
    marginBottom: SPACE.xl,
    borderRadius: RADIUS.md, // iOS standard 12pt
    padding: SPACE.lg,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardOverline: {
    ...TYPE.caption2,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Outfit-SemiBold',
  },
  cardTitle: {
    ...TYPE.headline,
    marginTop: 4,
  },
  cardSub: {
    ...TYPE.caption1,
    marginTop: 2,
  },
  cardHint: {
    ...TYPE.footnote,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SPACE.xl,
    marginBottom: SPACE.xl,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
  },
  streakEmoji: { fontSize: 28 },
  streakNum: {
    ...TYPE.headline,
  },
  streakSub: {
    ...TYPE.caption1,
    marginTop: 2,
  },
});
