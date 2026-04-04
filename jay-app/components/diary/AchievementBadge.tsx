import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'streak7' | 'streak30' | 'streak100' | 'firstRoutine' | 'allComplete' | 'consistency' | 'explorer' | 'dedicated';
  unlocked: boolean;
  progress?: number; // 0-1
  unlockedAt?: string;
}

function AchievementIcon({ icon, color, size = 22 }: { icon: string; color: string; size?: number }) {
  switch (icon) {
    case 'streak7':
    case 'streak30':
    case 'streak100':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
          <Path d="M12 23c-4.97 0-8-3.03-8-7 0-2.45 1.35-4.7 2.08-5.58.36-.44 1.02-.27 1.14.28.2.93.6 1.8 1.18 2.5.08.1.22.02.18-.1C8.13 11.22 8 8.5 9.5 6c.77-1.29 1.77-2.38 2.5-3 .28-.24.72-.03.72.35 0 1.61.9 3.53 2 4.65.58.6 1.28 1.22 1.78 2 .5.78.83 1.73 1 2.5.07.3.43.37.55.08.38-.92.55-1.71.6-2.4.02-.28.35-.42.55-.22C20.73 11.5 22 14 22 16c0 3.97-5.03 7-10 7z" />
        </Svg>
      );
    case 'firstRoutine':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill={color} />
        </Svg>
      );
    case 'allComplete':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={9} fill={color} opacity={0.2} />
          <Path d="M9 12l2 2 4-4" stroke={color} />
        </Svg>
      );
    case 'consistency':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={3} y={4} width={18} height={18} rx={2} fill={color} opacity={0.15} />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} />
          <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke={color} strokeWidth={2.5} />
        </Svg>
      );
    case 'explorer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={10} />
          <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" fill={color} />
        </Svg>
      );
    default: // dedicated
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <Path d="M4 22h16" />
          <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill={color} opacity={0.15} />
        </Svg>
      );
  }
}

const BADGE_COLORS: Record<string, { light: string; dark: string }> = {
  streak7:      { light: '#FF9500', dark: '#FF9F0A' },
  streak30:     { light: '#FF2D55', dark: '#FF375F' },
  streak100:    { light: '#AF52DE', dark: '#BF5AF2' },
  firstRoutine: { light: '#FFCC00', dark: '#FFD60A' },
  allComplete:  { light: '#34C759', dark: '#30D158' },
  consistency:  { light: '#007AFF', dark: '#0A84FF' },
  explorer:     { light: '#5AC8FA', dark: '#64D2FF' },
  dedicated:    { light: '#5856D6', dark: '#5E5CE6' },
};

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const { colors, isDark } = useTheme();
  const badgeColor = BADGE_COLORS[achievement.icon] ?? BADGE_COLORS.dedicated;
  const color = isDark ? badgeColor.dark : badgeColor.light;

  return (
    <View style={[s.badge, { opacity: achievement.unlocked ? 1 : 0.4 }]}>
      <View style={[s.iconCircle, { backgroundColor: color + '15' }]}>
        <AchievementIcon icon={achievement.icon} color={color} />
      </View>
      <Text numberOfLines={1} style={[s.title, { color: colors.label }]}>{achievement.title}</Text>
      <Text numberOfLines={2} style={[s.desc, { color: colors.tertiaryLabel }]}>{achievement.description}</Text>
      {!achievement.unlocked && achievement.progress != null && (
        <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[s.progressFill, { width: `${Math.round(achievement.progress * 100)}%`, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    width: 100,
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
  },
  desc: {
    fontSize: 10,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 13,
  },
  progressTrack: {
    width: 44,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
