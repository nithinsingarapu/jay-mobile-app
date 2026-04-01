import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { TopBar } from '../../components/ui/TopBar';
import { mockInsights, mockWeeklyData } from '../../constants/mockData';
import { useTheme } from '../../lib/theme';

function SingleBar({ score, max, index, label }: { score: number; max: number; index: number; label: string }) {
  const height = useSharedValue(0);
  useEffect(() => {
    height.value = withTiming((score / max) * 80, { duration: 600 + index * 80, easing: Easing.out(Easing.quad) });
  }, []);
  const barStyle = useAnimatedStyle(() => ({ height: height.value }));
  return (
    <View style={styles.barCol}>
      <Animated.View style={[styles.bar, barStyle]} />
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

function BarChart({ days, scores }: { days: string[]; scores: number[] }) {
  const max = Math.max(...scores);
  return (
    <View style={styles.chart}>
      {days.map((day, i) => (
        <SingleBar key={day} score={scores[i]} max={max} index={i} label={day} />
      ))}
    </View>
  );
}

export default function IntelligenceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { days, adherence, goodDays } = mockWeeklyData;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Intelligence" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.summaryHeadline}>{goodDays} out of 7 good skin days</Text>
          <View style={styles.segmentBar}>
            {days.map((_, i) => (
              <View key={i} style={[styles.segment, i < goodDays ? styles.segmentGood : styles.segmentBad]} />
            ))}
          </View>
          <Text style={styles.trendText}>↑ Up from last week</Text>
        </View>

        {/* Insights */}
        <Text style={styles.sectionTitle}>Insights</Text>
        {mockInsights.map((insight) => (
          <Pressable key={insight.id} style={styles.insightCard}>
            <View style={styles.insightDot} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDesc}>{insight.description}</Text>
            </View>
          </Pressable>
        ))}

        {/* Routine adherence chart */}
        <Text style={styles.sectionTitle}>Routine Adherence</Text>
        <View style={styles.adherenceCard}>
          <BarChart days={days} scores={adherence} />
          <View style={styles.adherenceFooter}>
            <Text style={styles.adherencePct}>{Math.round(adherence.reduce((a, b) => a + b, 0) / adherence.length)}%</Text>
            <Text style={styles.adherenceLabel}>overall this week</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  summaryCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 28 },
  sectionLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Outfit-SemiBold' },
  summaryHeadline: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 12, fontFamily: 'Outfit-SemiBold' },
  segmentBar: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  segmentGood: { backgroundColor: '#000' },
  segmentBad: { backgroundColor: '#E5E5E5' },
  trendText: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit' },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
  insightCard: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333', marginTop: 6, flexShrink: 0 },
  insightContent: {},
  insightTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  insightDesc: { fontSize: 13, color: '#8E8E93', marginTop: 3, lineHeight: 18, fontFamily: 'Outfit' },
  adherenceCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 28 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: 12 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', backgroundColor: '#000', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#8E8E93', fontFamily: 'Outfit-Medium' },
  adherenceFooter: { alignItems: 'center' },
  adherencePct: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  adherenceLabel: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit' },
});
