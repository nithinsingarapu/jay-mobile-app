import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface StreakAdherenceRowProps {
  streak: number;
  bestStreak: number;
  adherence: number;
}

export function StreakAdherenceRow({ streak, bestStreak, adherence }: StreakAdherenceRowProps) {
  const { colors } = useTheme();

  return (
    <View style={s.row}>
      {/* Streak card */}
      <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[s.tint, { backgroundColor: colors.systemOrange + '08' }]} />
        <View style={s.cardRow}>
          <Text style={s.emoji}>🔥</Text>
          <Text style={[s.bigNumber, { color: colors.systemOrange }]}>{streak}</Text>
          <Text style={[s.label, { color: colors.secondaryLabel }]}>Day streak · Best: {bestStreak}</Text>
        </View>
      </View>

      {/* Adherence card */}
      <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[s.tint, { backgroundColor: colors.systemBlue + '08' }]} />
        <View style={s.cardRow}>
          <Text style={s.emoji}>📊</Text>
          <Text style={[s.bigNumber, { color: colors.systemBlue }]}>{adherence}%</Text>
          <Text style={[s.label, { color: colors.secondaryLabel }]}>Adherence · This week</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 14,
  },
  bigNumber: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit-Bold',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit',
    flex: 1,
  },
});
