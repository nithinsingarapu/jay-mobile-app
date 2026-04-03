import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverIngredientSpotlight } from '../../types/discover';

interface IngredientSpotlightCardProps {
  spotlight: DiscoverIngredientSpotlight;
  productCount: number;
  onPress: () => void;
}

export default function IngredientSpotlightCard({
  spotlight,
  productCount,
  onPress,
}: IngredientSpotlightCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: colors.secondarySystemBackground }]}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{spotlight.emoji}</Text>
          <View style={styles.headerContent}>
            <Text style={[styles.ingredientName, { color: colors.label }]}>
              {spotlight.ingredientName}
            </Text>
            <Text numberOfLines={1} style={[styles.tagline, { color: colors.secondaryLabel }]}>
              {spotlight.tagline}
            </Text>
          </View>
        </View>

        {/* Product count pill */}
        <View style={styles.pillRow}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              Found in {productCount} products
            </Text>
          </View>
        </View>

        {/* Summary */}
        <Text numberOfLines={2} style={[styles.summary, { color: colors.secondaryLabel }]}>
          {spotlight.summary}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 14,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    lineHeight: 26,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  pillRow: {
    marginTop: 12,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(48,209,88,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#30D158',
  },
  summary: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 18,
    marginTop: 10,
  },
});
