import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';

interface RoutineTypeCardProps {
  template: {
    id: string;
    name: string;
    emoji: string;
    description: string;
    difficulty: string;
    stepCount: string;
    tintColor?: string;
  };
  onPress: () => void;
}

export default function RoutineTypeCard({
  template,
  onPress,
}: RoutineTypeCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  const tint = template.tintColor ?? colors.systemBlue;

  return (
    <Animated.View style={{ transform: [{ scale }], flexShrink: 0 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.container,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        {/* Emoji */}
        <Text style={styles.emoji}>{template.emoji}</Text>

        {/* Name */}
        <Text style={[styles.name, { color: colors.label }]} numberOfLines={1}>
          {template.name}
        </Text>

        {/* Description */}
        <Text
          style={[styles.description, { color: colors.secondaryLabel }]}
          numberOfLines={2}
        >
          {template.description}
        </Text>

        {/* Meta badges */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: tint + '1A' },
            ]}
          >
            <Text style={[styles.badgeText, { color: tint }]}>
              {template.stepCount} steps
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.tertiarySystemFill },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.secondaryLabel }]}>
              {template.difficulty}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 160,
    borderRadius: RADIUS.md + 2, // 14
    padding: SPACE.lg,
  },
  emoji: {
    fontSize: 28,
    marginBottom: SPACE.sm,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: SPACE.xxs,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Outfit',
    lineHeight: 16,
    marginBottom: SPACE.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    marginTop: 'auto' as any,
  },
  badge: {
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xxs,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
});
