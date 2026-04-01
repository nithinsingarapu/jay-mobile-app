import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.systemBlue }
          : { backgroundColor: colors.quaternarySystemFill },
        style,
      ]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.text, { color: active ? '#fff' : colors.label }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 100, paddingVertical: 7, paddingHorizontal: 16 },
  text: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
});
