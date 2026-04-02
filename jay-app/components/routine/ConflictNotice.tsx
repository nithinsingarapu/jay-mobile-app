import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { ConflictOut } from '../../types/routine';

interface ConflictNoticeProps {
  conflicts: ConflictOut[];
}

export function ConflictNotice({ conflicts }: ConflictNoticeProps) {
  const { colors } = useTheme();

  if (conflicts.length === 0) return null;

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: colors.secondarySystemBackground,
          borderLeftColor: colors.systemOrange,
        },
      ]}
    >
      <Text style={[s.title, { color: colors.systemOrange }]}>INGREDIENT CONFLICT</Text>
      {conflicts.map((conflict, index) => (
        <View key={index} style={s.conflictItem}>
          <Text style={[s.pair, { color: colors.label }]}>
            {conflict.ingredient_a} + {conflict.ingredient_b}
          </Text>
          <Text style={[s.reason, { color: colors.secondaryLabel }]}>{conflict.reason}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderLeftWidth: 2.5,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    padding: 12,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  conflictItem: {
    marginBottom: 8,
  },
  pair: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  reason: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
});
