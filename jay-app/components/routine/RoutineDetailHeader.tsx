import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import type { RoutineOut } from '../../types/routine';

interface RoutineDetailHeaderProps {
  routine: RoutineOut;
  onBack: () => void;
  onEdit: () => void;
}

export function RoutineDetailHeader({ routine, onBack, onEdit }: RoutineDetailHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isActive = routine.is_active;
  const periodLabel = routine.period === 'am' ? 'Morning' : 'Evening';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navigation bar */}
      <View style={s.navBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.backBtn}>
          <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
            <Path d="M9 1L1 9l8 8" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[s.backText, { color: colors.systemBlue }]}>Routine</Text>
        </Pressable>
        <Pressable onPress={onEdit} hitSlop={12}>
          <Text style={[s.editText, { color: colors.systemBlue }]}>Edit</Text>
        </Pressable>
      </View>

      {/* Routine info */}
      <View style={s.info}>
        <Text style={[s.name, { color: colors.label }]} numberOfLines={2}>
          {routine.name || `${periodLabel} Routine`}
        </Text>

        {routine.description ? (
          <Text style={[s.description, { color: colors.secondaryLabel }]} numberOfLines={3}>
            {routine.description}
          </Text>
        ) : null}

        <View style={s.metaRow}>
          <View style={[s.badge, { backgroundColor: isActive ? colors.systemGreen + '18' : colors.systemGray4 + '40' }]}>
            <View style={[s.badgeDot, { backgroundColor: isActive ? colors.systemGreen : colors.systemGray }]} />
            <Text style={[s.badgeText, { color: isActive ? colors.systemGreen : colors.secondaryLabel }]}>
              {isActive ? 'Active' : 'Saved'}
            </Text>
          </View>

          <Text style={[s.meta, { color: colors.tertiaryLabel }]}>
            {routine.steps.length} steps · {routine.period.toUpperCase()} · {routine.routine_type}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },
  editText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  info: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    letterSpacing: 0.36,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit',
    lineHeight: 20,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});
