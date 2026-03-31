import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface DividerProps { style?: ViewStyle; }

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: { height: 0.5, backgroundColor: '#E5E5E5' },
});
