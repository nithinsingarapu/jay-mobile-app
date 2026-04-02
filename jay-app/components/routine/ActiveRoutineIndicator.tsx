import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ActiveRoutineIndicatorProps {
  name: string | null;
  period: string;
  onPress?: () => void;
}

export function ActiveRoutineIndicator({ name, period, onPress }: ActiveRoutineIndicatorProps) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={s.container}>
      <View style={[s.dot, { backgroundColor: colors.systemGreen }]} />
      <Text style={[s.text, { color: colors.systemGreen }]}>
        Active: {name ?? 'Untitled'} · {period.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
});
