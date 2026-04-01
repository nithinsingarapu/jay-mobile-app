import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface CardProps { children: React.ReactNode; style?: ViewStyle; }

export function Card({ children, style }: CardProps) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.secondarySystemBackground }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
});
