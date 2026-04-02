import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';

interface ConflictRuleProps {
  rule: { type: string; label: string; ingredients: string; color: string };
}

export default function ConflictRule({ rule }: ConflictRuleProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondarySystemBackground,
          borderLeftColor: rule.color,
        },
      ]}
    >
      <Text style={[styles.label, { color: rule.color }]}>{rule.label}</Text>
      <Text style={[styles.ingredients, { color: colors.secondaryLabel }]}>
        {rule.ingredients}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 2.5,
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: SPACE.md,
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ingredients: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
});
