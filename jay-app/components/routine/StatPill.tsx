import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface StatPillProps {
  emoji: string;
  value: string;
  label: string;
  tintColor: string;
}

export default function StatPill({ emoji, value, label, tintColor }: StatPillProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: tintColor + '12' }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.value, { color: colors.label }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  emoji: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit',
  },
});
