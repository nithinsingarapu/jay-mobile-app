import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

interface StreakDashboardProps {
  currentStreak: number;
  longestStreak: number;
}

function FlameIcon({ size = 28, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <Path d="M12 23c-4.97 0-8-3.03-8-7 0-2.45 1.35-4.7 2.08-5.58.36-.44 1.02-.27 1.14.28.2.93.6 1.8 1.18 2.5.08.1.22.02.18-.1C8.13 11.22 8 8.5 9.5 6c.77-1.29 1.77-2.38 2.5-3 .28-.24.72-.03.72.35 0 1.61.9 3.53 2 4.65.58.6 1.28 1.22 1.78 2 .5.78.83 1.73 1 2.5.07.3.43.37.55.08.38-.92.55-1.71.6-2.4.02-.28.35-.42.55-.22C20.73 11.5 22 14 22 16c0 3.97-5.03 7-10 7z" />
    </Svg>
  );
}

function TrophyIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <Path d="M4 22h16" />
      <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  );
}

export function StreakDashboard({ currentStreak, longestStreak }: StreakDashboardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={s.row}>
      {/* Current Streak */}
      <View style={[s.card, { backgroundColor: isDark ? '#1a1500' : '#FFF8E1' }]}>
        <FlameIcon size={32} color={colors.systemOrange} />
        <Text style={[s.value, { color: colors.systemOrange }]}>{currentStreak}</Text>
        <Text style={[s.label, { color: colors.secondaryLabel }]}>Current{'\n'}streak</Text>
      </View>

      {/* Longest Streak */}
      <View style={[s.card, { backgroundColor: isDark ? '#0a1020' : '#EEF2FF' }]}>
        <TrophyIcon size={28} color={colors.systemBlue} />
        <Text style={[s.value, { color: colors.systemBlue }]}>{longestStreak}</Text>
        <Text style={[s.label, { color: colors.secondaryLabel }]}>Longest{'\n'}streak</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  value: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 15,
  },
});
