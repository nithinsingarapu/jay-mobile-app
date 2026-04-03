import React, { useRef } from 'react';
import { Pressable, View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { RoutineOut } from '../../types/routine';
import ActionPill from './ActionPill';

interface RoutineManagementCardProps {
  routine: RoutineOut;
  isActive: boolean;
  adherence?: number;
  streak?: number;
  onPress: () => void;
  onEdit: () => void;
  onSchedule?: () => void;
  onMore: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

const RoutineManagementCard: React.FC<RoutineManagementCardProps> = ({
  routine,
  isActive,
  adherence,
  streak,
  onPress,
  onEdit,
  onSchedule,
  onMore,
  onActivate,
  onDelete,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const periodLabel =
    routine.period.charAt(0).toUpperCase() + routine.period.slice(1);

  const showStats =
    isActive && (adherence !== undefined || streak !== undefined);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.secondarySystemBackground,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Active accent bar */}
        {isActive && (
          <View
            style={[
              styles.accentBar,
              { backgroundColor: colors.systemGreen },
            ]}
          />
        )}

        {/* Row 1: Name + Period badge */}
        <View style={styles.row1}>
          <Text style={[styles.name, { color: colors.label }]}>
            {routine.name}
          </Text>
          <View
            style={[
              styles.periodBadge,
              { backgroundColor: colors.tertiarySystemFill },
            ]}
          >
            <Text style={[styles.periodText, { color: colors.secondaryLabel }]}>
              {periodLabel}
            </Text>
          </View>
        </View>

        {/* Row 2: Steps / type / cost */}
        <Text style={[styles.meta, { color: colors.tertiaryLabel }]}>
          {routine.steps.length} steps · {routine.routine_type} · ₹
          {routine.total_monthly_cost ?? 0}/mo
        </Text>

        {/* Row 3: Adherence + Streak (active only) */}
        {showStats && (
          <View style={styles.statsRow}>
            {adherence !== undefined && (
              <Text style={[styles.statText, { color: colors.systemBlue }]}>
                📊 {adherence}%
              </Text>
            )}
            {adherence !== undefined && streak !== undefined && (
              <Text style={[styles.statText, { color: colors.tertiaryLabel }]}>
                {' · '}
              </Text>
            )}
            {streak !== undefined && (
              <Text style={[styles.statText, { color: colors.systemOrange }]}>
                🔥 {streak} days
              </Text>
            )}
          </View>
        )}

        {/* Row 4: Action pills */}
        <View style={styles.actionsRow}>
          {isActive ? (
            <>
              <ActionPill label="Edit" onPress={onEdit} />
              {onSchedule && (
                <ActionPill label="Schedule" onPress={onSchedule} />
              )}
              <ActionPill label="⋯" onPress={onMore} />
            </>
          ) : (
            <>
              {onActivate && (
                <ActionPill
                  label="Activate"
                  color={colors.systemBlue}
                  tintBg={colors.systemBlue + '15'}
                  onPress={onActivate}
                />
              )}
              {onDelete && (
                <ActionPill
                  label="Delete"
                  color={colors.systemRed}
                  tintBg={colors.systemRed + '10'}
                  onPress={onDelete}
                />
              )}
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  periodText: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});

export default RoutineManagementCard;
