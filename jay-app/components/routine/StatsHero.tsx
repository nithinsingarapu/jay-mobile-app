import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface StatsHeroProps {
  streak: number;
}

export function StatsHero({ streak }: StatsHeroProps) {
  const { colors } = useTheme();

  return (
    <View style={s.container}>
      <Text style={s.flame}>🔥</Text>
      <Text style={[s.number, { color: colors.systemOrange }]}>{streak}</Text>
      <Text style={[s.label, { color: colors.secondaryLabel }]}>day streak</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  flame: {
    fontSize: 40,
    marginBottom: 4,
  },
  number: {
    fontSize: 48,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
});
