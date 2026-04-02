import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';

interface TipCardProps {
  tip: { emoji: string; title: string; body: string; bgColor: string };
  onPress?: () => void;
}

export default function TipCard({ tip, onPress }: TipCardProps) {
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
      <View style={[styles.iconCircle, { backgroundColor: tip.bgColor + '22' }]}>
        <Text style={styles.emoji}>{tip.emoji}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.label }]}>{tip.title}</Text>
        <Text style={[styles.body, { color: colors.secondaryLabel }]} numberOfLines={2}>
          {tip.body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
    borderRadius: 14,
    padding: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  body: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});
