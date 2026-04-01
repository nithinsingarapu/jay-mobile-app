import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  style?: ViewStyle;
}

export function SearchBar({ placeholder = 'Search products, ingredients...', value, onChangeText, style }: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.tertiarySystemFill }, style]}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.8">
        <Circle cx="11" cy="11" r="8" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
      </Svg>
      <TextInput
        style={[styles.input, { color: colors.label }]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholderText}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 17, fontFamily: 'Outfit', padding: 0 },
});
