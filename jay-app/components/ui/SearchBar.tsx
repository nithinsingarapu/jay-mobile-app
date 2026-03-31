import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  style?: ViewStyle;
}

export function SearchBar({ placeholder = 'Search products, ingredients...', value, onChangeText, style }: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8">
        <Circle cx="11" cy="11" r="8" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
      </Svg>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#CCC"
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#000',
    padding: 0,
  },
});
