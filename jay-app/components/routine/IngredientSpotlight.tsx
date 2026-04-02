import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';

interface IngredientSpotlightProps {
  spotlight: { emoji: string; name: string; subtitle: string };
  onPress?: () => void;
}

export default function IngredientSpotlight({ spotlight, onPress }: IngredientSpotlightProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.secondarySystemBackground,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={styles.emoji}>{spotlight.emoji}</Text>
      <Text style={[styles.name, { color: colors.label }]}>{spotlight.name}</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
        {spotlight.subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 140,
    borderRadius: 14,
    padding: SPACE.lg,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: SPACE.sm,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginTop: 2,
  },
});
