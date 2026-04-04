import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

/* ── Period icons (SVG, no emoji) ──────────────────────────────── */

function SunriseIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={14} r={4} fill={color} opacity={0.3} />
      <Circle cx={12} cy={14} r={4} stroke={color} strokeWidth={1.5} />
      <Path d="M12 4v3M4.93 7.93l2.12 2.12M2 16h3M19 16h3M17.07 7.93l-2.12 2.12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M3 20h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SunIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4.5} fill={color} opacity={0.3} />
      <Circle cx={12} cy={12} r={4.5} stroke={color} strokeWidth={1.5} />
      <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SunsetIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 18a5 5 0 1 0-10 0" fill={color} opacity={0.2} />
      <Path d="M17 18a5 5 0 1 0-10 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 9v-3M4.22 13.22l1.42 1.42M18.36 14.64l1.42-1.42M2 18h2M20 18h2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M3 21h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function MoonIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} opacity={0.2} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} fill={color} opacity={0.2} stroke={color} strokeWidth={1.5} />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ── Period visual config ──────────────────────────────────────── */

interface PeriodTheme {
  icon: typeof SunIcon;
  label: string;
  gradient: { light: [string, string]; dark: [string, string] };
  accent: { light: string; dark: string };
  textColor: { light: string; dark: string };
}

const PERIOD_THEMES: Record<string, PeriodTheme> = {
  morning: {
    icon: SunriseIcon,
    label: 'Morning',
    gradient: { light: ['#FFF3E0', '#FFE0B2'], dark: ['#2d1f08', '#1a1206'] },
    accent: { light: '#E65100', dark: '#FFB74D' },
    textColor: { light: '#4E342E', dark: '#FFE0B2' },
  },
  am: {
    icon: SunriseIcon,
    label: 'Morning',
    gradient: { light: ['#FFF3E0', '#FFE0B2'], dark: ['#2d1f08', '#1a1206'] },
    accent: { light: '#E65100', dark: '#FFB74D' },
    textColor: { light: '#4E342E', dark: '#FFE0B2' },
  },
  afternoon: {
    icon: SunIcon,
    label: 'Afternoon',
    gradient: { light: ['#FFFDE7', '#FFF9C4'], dark: ['#2e2400', '#1a1500'] },
    accent: { light: '#F57F17', dark: '#FFD54F' },
    textColor: { light: '#5D4037', dark: '#FFF9C4' },
  },
  evening: {
    icon: SunsetIcon,
    label: 'Evening',
    gradient: { light: ['#FCE4EC', '#F3E5F5'], dark: ['#2a0e1e', '#1e0a28'] },
    accent: { light: '#AD1457', dark: '#F48FB1' },
    textColor: { light: '#4A148C', dark: '#F3E5F5' },
  },
  night: {
    icon: MoonIcon,
    label: 'Night',
    gradient: { light: ['#E8EAF6', '#EDE7F6'], dark: ['#0d0a20', '#12082a'] },
    accent: { light: '#283593', dark: '#B39DDB' },
    textColor: { light: '#1A237E', dark: '#E8EAF6' },
  },
  pm: {
    icon: MoonIcon,
    label: 'Night',
    gradient: { light: ['#E8EAF6', '#EDE7F6'], dark: ['#0d0a20', '#12082a'] },
    accent: { light: '#283593', dark: '#B39DDB' },
    textColor: { light: '#1A237E', dark: '#E8EAF6' },
  },
  full_day: {
    icon: SunIcon,
    label: 'Full Day',
    gradient: { light: ['#FFF3E0', '#FFE0B2'], dark: ['#2d1f08', '#1a1206'] },
    accent: { light: '#E65100', dark: '#FFB74D' },
    textColor: { light: '#4E342E', dark: '#FFE0B2' },
  },
  both: {
    icon: SunIcon,
    label: 'Full Day',
    gradient: { light: ['#FFF3E0', '#FFE0B2'], dark: ['#2d1f08', '#1a1206'] },
    accent: { light: '#E65100', dark: '#FFB74D' },
    textColor: { light: '#4E342E', dark: '#FFE0B2' },
  },
};

const DEFAULT_THEME: PeriodTheme = {
  icon: SunIcon,
  label: 'Routine',
  gradient: { light: ['#E3F2FD', '#BBDEFB'], dark: ['#0a1628', '#0d1a2e'] },
  accent: { light: '#1565C0', dark: '#64B5F6' },
  textColor: { light: '#0D47A1', dark: '#E3F2FD' },
};

function getTheme(period?: string): PeriodTheme {
  if (!period) return DEFAULT_THEME;
  return PERIOD_THEMES[period.toLowerCase()] ?? DEFAULT_THEME;
}

/* ── Component ─────────────────────────────────────────────────── */

interface SessionCardProps {
  routine: { id: string; name?: string; period?: string; steps?: any[] };
  status: { total_steps: number; completed_steps: number } | null;
  active: boolean;
  onPress: () => void;
}

export default function SessionCard({ routine, status, active, onPress }: SessionCardProps) {
  const { colors, isDark } = useTheme();
  const theme = getTheme(routine.period);
  const accent = isDark ? theme.accent.dark : theme.accent.light;
  const textColor = isDark ? theme.textColor.dark : theme.textColor.light;
  const gradientColors = isDark ? theme.gradient.dark : theme.gradient.light;

  const total = status?.total_steps ?? routine.steps?.length ?? 0;
  const completed = status?.completed_steps ?? 0;
  const isDone = total > 0 && completed >= total;
  const progress = total > 0 ? completed / total : 0;

  const PeriodIcon = isDone ? CheckCircleIcon : theme.icon;
  const doneGreen = isDark ? '#30D158' : '#34C759';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        !active && styles.cardInactive,
      ]}
    >
      <LinearGradient
        colors={active
          ? isDone
            ? (isDark ? ['#0a2010', '#0d2818'] : ['#E8F5E9', '#C8E6C9'])
            : gradientColors
          : [isDark ? '#1C1C1E' : '#F2F2F7', isDark ? '#1C1C1E' : '#F2F2F7']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />

      {/* Decorative glow circle (active only) */}
      {active && (
        <View style={[
          styles.glowCircle,
          { backgroundColor: isDone ? doneGreen + '12' : accent + '10' },
        ]} />
      )}

      {/* Icon */}
      <View style={[
        styles.iconWrap,
        {
          backgroundColor: active
            ? isDone ? doneGreen + '20' : accent + '18'
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
        },
      ]}>
        <PeriodIcon
          size={18}
          color={active ? (isDone ? doneGreen : accent) : colors.tertiaryLabel}
        />
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            { color: active ? (isDone ? doneGreen : textColor) : colors.secondaryLabel },
          ]}
        >
          {routine.name || theme.label}
        </Text>

        {/* Progress bar */}
        <View style={[
          styles.progressTrack,
          { backgroundColor: active
            ? (isDone ? doneGreen + '18' : accent + '15')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
          },
        ]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: isDone ? doneGreen : active ? accent : colors.systemGray3,
              },
            ]}
          />
        </View>

        <Text style={[
          styles.stepCount,
          { color: isDone ? doneGreen : active ? accent + 'BB' : colors.tertiaryLabel },
        ]}>
          {isDone ? 'Complete' : `${completed}/${total} steps`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    minWidth: 170,
    overflow: 'hidden',
  },
  cardInactive: {
    opacity: 0.65,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
  },
  glowCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 80,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
    marginBottom: 5,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepCount: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    fontWeight: '500',
  },
});
