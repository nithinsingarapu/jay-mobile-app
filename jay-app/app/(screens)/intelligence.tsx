import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { TopBar } from '../../components/ui/TopBar';
import { profileService, type InsightsResponse, type Insight } from '../../services/profile';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

/* ── Score Ring (larger, with grade) ─────────────────────────── */

function ScoreRingLarge({ score, grade }: { score: number; grade: string }) {
  const { colors } = useTheme();
  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const gradeColor = score >= 85 ? colors.systemGreen : score >= 70 ? colors.systemBlue : score >= 55 ? colors.systemOrange : colors.systemRed;

  return (
    <View style={{ alignItems: 'center', marginVertical: 16 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.quaternarySystemFill} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={gradeColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[styles.scoreNum, { color: colors.label }]}>{score}</Text>
        <Text style={[styles.gradeText, { color: gradeColor }]}>Grade {grade}</Text>
      </View>
    </View>
  );
}

/* ── Category Bar ────────────────────────────────────────────── */

function CategoryBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const { colors, isDark } = useTheme();
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming((value / max) * 100, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

  return (
    <View style={styles.catRow}>
      <Text style={[styles.catLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <View style={[styles.catTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <Animated.View style={[styles.catFill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={[styles.catValue, { color: colors.label }]}>{value}/{max}</Text>
    </View>
  );
}

/* ── Insight Card ────────────────────────────────────────────── */

const SEVERITY_COLORS: Record<string, { bg: string; dot: string }> = {
  positive: { bg: '#E8F5E9', dot: '#4CAF50' },
  neutral: { bg: '#E3F2FD', dot: '#2196F3' },
  warning: { bg: '#FFF3E0', dot: '#FF9800' },
  critical: { bg: '#FFEBEE', dot: '#F44336' },
};

const SEVERITY_COLORS_DARK: Record<string, { bg: string; dot: string }> = {
  positive: { bg: '#0a2010', dot: '#30D158' },
  neutral: { bg: '#0a1628', dot: '#0A84FF' },
  warning: { bg: '#1a1500', dot: '#FF9F0A' },
  critical: { bg: '#1a0a0a', dot: '#FF453A' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const { colors, isDark } = useTheme();
  const sev = (isDark ? SEVERITY_COLORS_DARK : SEVERITY_COLORS)[insight.severity] || SEVERITY_COLORS.neutral;

  return (
    <View style={[styles.insightCard, { backgroundColor: sev.bg }]}>
      <View style={[styles.insightDot, { backgroundColor: sev.dot }]} />
      <View style={styles.insightBody}>
        <Text style={[styles.insightTitle, { color: colors.label }]}>{insight.title}</Text>
        <Text style={[styles.insightDesc, { color: colors.secondaryLabel }]}>{insight.description}</Text>
        {insight.action && (
          <Text style={[styles.insightAction, { color: sev.dot }]}>{insight.action}</Text>
        )}
      </View>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────────────────── */

export default function IntelligenceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const result = await profileService.getInsights();
      setData(result);
    } catch (e) {
      console.error('[Insights]', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="Skin Intelligence" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.systemBlue} />
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>Analyzing your skin...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="Skin Intelligence" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>Complete your profile to get insights</Text>
        </View>
      </View>
    );
  }

  const { skin_score, insights, weekly_summary } = data;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Skin Intelligence" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Score Ring */}
        <ScoreRingLarge score={skin_score.overall_score} grade={skin_score.grade} />

        {/* Summary */}
        <Text style={[styles.summary, { color: colors.label }]}>{skin_score.summary}</Text>

        {/* Category Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>SCORE BREAKDOWN</Text>
          <CategoryBar label="Hydration" value={skin_score.category_scores.hydration} max={25} color={colors.systemBlue} />
          <CategoryBar label="Barrier" value={skin_score.category_scores.barrier} max={20} color={colors.systemGreen} />
          <CategoryBar label="Clarity" value={skin_score.category_scores.clarity} max={25} color={colors.systemPurple} />
          <CategoryBar label="Protection" value={skin_score.category_scores.protection} max={15} color={colors.systemOrange} />
          <CategoryBar label="Consistency" value={skin_score.category_scores.consistency} max={15} color={colors.systemTeal} />
        </View>

        {/* Strengths & Concerns */}
        <View style={styles.strengthConcernRow}>
          <View style={[styles.scCard, { backgroundColor: colors.systemGreen + '15' }]}>
            <Text style={[styles.scLabel, { color: colors.systemGreen }]}>STRENGTH</Text>
            <Text style={[styles.scText, { color: colors.label }]}>{skin_score.top_strength}</Text>
          </View>
          <View style={[styles.scCard, { backgroundColor: colors.systemOrange + '15' }]}>
            <Text style={[styles.scLabel, { color: colors.systemOrange }]}>FOCUS AREA</Text>
            <Text style={[styles.scText, { color: colors.label }]}>{skin_score.top_concern}</Text>
          </View>
        </View>

        {/* Weekly Summary */}
        {weekly_summary && (
          <View style={[styles.weeklyCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>THIS WEEK</Text>
            <Text style={[styles.weeklyText, { color: colors.label }]}>{weekly_summary}</Text>
          </View>
        )}

        {/* Recommendations */}
        {skin_score.recommendations.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.label }]}>Recommendations</Text>
            {skin_score.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <Text style={[styles.recNum, { color: colors.systemBlue }]}>{i + 1}</Text>
                <Text style={[styles.recText, { color: colors.secondaryLabel }]}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.label }]}>Insights</Text>
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Outfit' },
  scoreNum: { fontSize: 40, fontFamily: 'Outfit-Bold' },
  gradeText: { fontSize: 14, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  summary: { fontSize: 15, fontFamily: 'Outfit', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  breakdownCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 20, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold', marginBottom: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLabel: { width: 80, fontSize: 12, fontFamily: 'Outfit' },
  catTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: 6, borderRadius: 3 },
  catValue: { width: 36, fontSize: 12, fontFamily: 'Outfit-SemiBold', textAlign: 'right' },
  strengthConcernRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  scCard: { flex: 1, borderRadius: RADIUS.md, padding: 14 },
  scLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, fontFamily: 'Outfit-SemiBold', marginBottom: 6 },
  scText: { fontSize: 13, fontFamily: 'Outfit-Medium', lineHeight: 18 },
  weeklyCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 24 },
  weeklyText: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Outfit-SemiBold', marginBottom: 12 },
  recRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  recNum: { fontSize: 14, fontFamily: 'Outfit-Bold', width: 20 },
  recText: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 19, flex: 1 },
  insightCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: RADIUS.md, marginBottom: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  insightBody: { flex: 1 },
  insightTitle: { fontSize: 14, fontFamily: 'Outfit-SemiBold', marginBottom: 3 },
  insightDesc: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 19 },
  insightAction: { fontSize: 12, fontFamily: 'Outfit-SemiBold', marginTop: 6 },
});
