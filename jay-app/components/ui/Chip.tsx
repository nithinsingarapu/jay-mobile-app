import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive, style]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: '#000',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
  textActive: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  textInactive: {
    color: '#000',
    fontWeight: '500',
  },
});
