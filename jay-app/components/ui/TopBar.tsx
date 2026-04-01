import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface TopBarProps { title: string; }

export function TopBar({ title }: TopBarProps) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderBottomColor: colors.separator }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth="2" strokeLinecap="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
      </Pressable>
      <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});
