import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

interface CompletionBreakdownProps {
  completed: number;
  skipped: number;
  missed: number;
}

export function CompletionBreakdown({ completed, skipped, missed }: CompletionBreakdownProps) {
  const { colors, isDark } = useTheme();
  const total = completed + skipped + missed;
  if (total === 0) return null;

  const pctComplete = Math.round((completed / total) * 100);
  const pctSkipped = Math.round((skipped / total) * 100);
  const pctMissed = 100 - pctComplete - pctSkipped;

  const segments = [
    { label: 'Completed', value: completed, pct: pctComplete, color: colors.systemGreen },
    { label: 'Skipped', value: skipped, pct: pctSkipped, color: colors.systemOrange },
    { label: 'Missed', value: missed, pct: Math.max(0, pctMissed), color: colors.systemRed },
  ];

  return (
    <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
      {/* Stacked bar */}
      <View style={s.bar}>
        {segments.map((seg) =>
          seg.pct > 0 ? (
            <View
              key={seg.label}
              style={[s.barSeg, { width: `${seg.pct}%`, backgroundColor: seg.color }]}
            />
          ) : null,
        )}
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: seg.color }]} />
            <Text style={[s.legendLabel, { color: colors.secondaryLabel }]}>
              {seg.label}
            </Text>
            <Text style={[s.legendValue, { color: colors.label }]}>
              {seg.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: 16,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barSeg: {
    height: '100%',
  },
  legend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: 'Outfit',
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
});
