import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { profileService, type Insight } from '../../services/profile';

export function InsightNudge() {
  const router = useRouter();
  const { colors } = useTheme();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await profileService.getInsights();
        if (data.insights.length > 0) setInsight(data.insights[0]);
        setScore(data.skin_score.overall_score);
      } catch {
        // Silently fail
      }
    })();
  }, []);

  if (!insight) return null;

  const sevColor = insight.severity === 'positive' ? colors.systemGreen
    : insight.severity === 'warning' ? colors.systemOrange
    : insight.severity === 'critical' ? colors.systemRed
    : colors.systemBlue;

  return (
    <Pressable
      onPress={() => router.push('/(screens)/intelligence' as any)}
      style={[styles.container, { borderColor: colors.separator }]}
    >
      <View style={[styles.dot, { backgroundColor: sevColor }]} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.label }]}>{insight.title}</Text>
        <Text numberOfLines={2} style={[styles.desc, { color: colors.secondaryLabel }]}>{insight.description}</Text>
      </View>
      <Text style={[styles.link, { color: colors.systemBlue }]}>View</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20, marginBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Outfit-SemiBold', marginBottom: 2 },
  desc: { fontSize: 13, lineHeight: 18, fontFamily: 'Outfit' },
  link: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});
