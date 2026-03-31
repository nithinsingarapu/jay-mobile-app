import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface SectionHeaderProps { label: string; style?: TextStyle; }

export function SectionHeader({ label, style }: SectionHeaderProps) {
  return <Text style={[styles.label, style]}>{label.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '600', color: '#999', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
});
