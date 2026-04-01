import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface MenuRowProps {
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}

export function MenuRow({ label, onPress, isLast = false }: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth="2.5" strokeLinecap="round">
        <Polyline points="9 18 15 12 9 6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  label: { fontSize: 17, fontFamily: 'Outfit' },
});
