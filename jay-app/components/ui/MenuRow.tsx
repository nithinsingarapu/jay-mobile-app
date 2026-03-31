import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

interface MenuRowProps {
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}

export function MenuRow({ label, onPress, isLast = false }: MenuRowProps) {
  return (
    <Pressable
      style={[styles.row, !isLast && styles.border]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round">
        <Polyline points="9 18 15 12 9 6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  border: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    color: '#000',
  },
});
