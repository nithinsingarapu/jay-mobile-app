import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';

interface SeasonalCardProps {
  guide: { emoji: string; name: string; summary: string };
  onPress?: () => void;
}

export default function SeasonalCard({ guide, onPress }: SeasonalCardProps) {
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
      <Text style={styles.emoji}>{guide.emoji}</Text>
      <Text style={[styles.name, { color: colors.label }]}>{guide.name}</Text>
      <Text style={[styles.summary, { color: colors.secondaryLabel }]}>
        {guide.summary}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
  },
  emoji: {
    fontSize: 22,
    marginBottom: SPACE.sm,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
  },
  summary: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});
