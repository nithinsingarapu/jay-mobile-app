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
        <View style={[s.tint, { backgroundColor: colors.systemOrange + '10' }]} />
        <Text style={[s.bigNumber, { color: colors.systemOrange }]}>{streak}</Text>
        <Text style={[s.label, { color: colors.secondaryLabel }]}>Day streak</Text>
        <Text style={[s.sub, { color: colors.tertiaryLabel }]}>Best: {bestStreak}</Text>
      </View>

      {/* Adherence card */}
      <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[s.tint, { backgroundColor: colors.systemGreen + '10' }]} />
        <Text style={[s.bigNumber, { color: colors.systemGreen }]}>{adherence}%</Text>
        <Text style={[s.label, { color: colors.secondaryLabel }]}>Adherence</Text>
        <Text style={[s.sub, { color: colors.tertiaryLabel }]}>This week</Text>
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
    padding: 16,
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: 'Outfit-Bold',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
});
