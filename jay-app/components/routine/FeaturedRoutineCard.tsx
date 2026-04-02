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

interface FeaturedRoutineCardProps {
  template: {
    id: string;
    name: string;
    emoji: string;
    description: string;
    tags: string[];
    stepCount: string;
  };
  onPress: () => void;
}

export default function FeaturedRoutineCard({
  template,
  onPress,
}: FeaturedRoutineCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.container}
      >
        {/* Blur circle accent */}
        <View style={styles.blurCircle} />

        {/* Featured label */}
        <Text style={styles.label}>Featured routine</Text>

        {/* Emoji + Name */}
        <Text style={styles.name}>
          {template.emoji} {template.name}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {template.description}
        </Text>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {template.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACE.lg,
  },
  container: {
    minHeight: 180,
    borderRadius: 18,
    backgroundColor: '#1a2a3a',
    padding: SPACE.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  blurCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10, 132, 255, 0.25)',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#0A84FF',
    marginBottom: SPACE.xs,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
    marginBottom: SPACE.xs,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit',
    color: 'rgba(235, 235, 245, 0.6)',
    lineHeight: 20,
    marginBottom: SPACE.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xxs,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: 'rgba(235, 235, 245, 0.8)',
  },
});
