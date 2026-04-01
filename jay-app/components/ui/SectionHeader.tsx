import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SectionHeaderProps { label: string; style?: TextStyle; }

export function SectionHeader({ label, style }: SectionHeaderProps) {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.secondaryLabel }, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '400', fontFamily: 'Outfit' },
});
