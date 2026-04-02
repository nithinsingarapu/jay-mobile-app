import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

interface StatCardsProps {
  adherence: number;
  streak: number;
  longest: number;
  skipped: number;
}

interface CardDef {
  key: string;
  label: string;
  format: (v: number) => string;
  colorKey: 'systemGreen' | 'systemOrange' | 'systemBlue' | 'systemRed';
}

const CARDS: CardDef[] = [
  { key: 'adherence', label: 'Adherence', format: (v) => `${v}%`, colorKey: 'systemGreen' },
  { key: 'streak', label: 'Streak', format: (v) => `${v}`, colorKey: 'systemOrange' },
  { key: 'longest', label: 'Longest', format: (v) => `${v}`, colorKey: 'systemBlue' },
  { key: 'skipped', label: 'Skipped', format: (v) => `${v}`, colorKey: 'systemRed' },
];

export function StatCards({ adherence, streak, longest, skipped }: StatCardsProps) {
  const { colors } = useTheme();
  const values: Record<string, number> = { adherence, streak, longest, skipped };

  return (
    <View style={s.grid}>
      {CARDS.map((card, index) => (
        <Animated.View
          key={card.key}
          entering={FadeInUp.delay(index * 40).duration(350)}
          style={[
            s.card,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <Text style={[s.number, { color: colors[card.colorKey] }]}>
            {card.format(values[card.key])}
          </Text>
          <Text style={[s.label, { color: colors.secondaryLabel }]}>
            {card.label}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 12,
    padding: 14,
  },
  number: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
});
