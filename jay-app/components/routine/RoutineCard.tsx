import React, { useRef } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { RoutineOut } from '../../types/routine';

interface RoutineCardProps {
  routine: RoutineOut;
  isActive: boolean;
  onPress: () => void;
}

export function RoutineCard({ routine, isActive, onPress }: RoutineCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          s.card,
          {
            backgroundColor: colors.secondarySystemBackground,
            transform: [{ scale }],
          },
          isActive && { borderWidth: 1.5, borderColor: colors.systemGreen },
        ]}
      >
        {/* Period badge */}
        <View style={[s.badge, { backgroundColor: colors.tertiarySystemFill }]}>
          <Text style={[s.badgeText, { color: colors.secondaryLabel }]}>
            {routine.period.toUpperCase()}
          </Text>
        </View>

        <Text style={[s.name, { color: colors.label }]}>{routine.name}</Text>

        {routine.description ? (
          <Text
            style={[s.description, { color: colors.secondaryLabel }]}
            numberOfLines={2}
          >
            {routine.description}
          </Text>
        ) : null}

        <Text style={[s.meta, { color: colors.tertiaryLabel }]}>
          {routine.steps.length} steps · {routine.routine_type} · ₹{routine.total_monthly_cost ?? 0}/mo
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 18,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
});
