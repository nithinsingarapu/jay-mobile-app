import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { ProductOut } from '../../types/product';

interface ProductCardProps {
  product: ProductOut;
  matchPercent?: number;
  onPress: () => void;
}

// Gradient-style dark background tints per category (matches HTML mockup)
const GRADIENT_COLORS: Record<string, [string, string]> = {
  cleanser:    ['#162a3a', '#0a1520'],
  serum:       ['#2a1a20', '#1a0a10'],
  moisturizer: ['#1a2a20', '#0a1a10'],
  sunscreen:   ['#202a2a', '#101a1a'],
  toner:       ['#2a2a1a', '#1a1a0a'],
  treatment:   ['#1a1a2a', '#0a0a1a'],
};

function getGradientBg(category: string): string {
  const pair = GRADIENT_COLORS[category?.toLowerCase()] ?? ['#1a1a2a', '#0a0a1a'];
  return pair[0]; // RN doesn't support CSS gradients natively, use darker tint
}

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

export default function ProductCard({ product, matchPercent, onPress }: ProductCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const hasImage = !!product.image_url && product.image_url.startsWith('http');
  const bgColor = getGradientBg(product.category);

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: colors.secondarySystemBackground }]}
      >
        {/* Thumbnail area */}
        <View style={[styles.thumb, { backgroundColor: bgColor }]}>
          {hasImage ? (
            <Image
              source={{ uri: product.image_url! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}

          {/* Match badge */}
          {matchPercent != null && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{matchPercent}% match</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text numberOfLines={2} style={[styles.name, { color: colors.label }]}>
            {product.name}
          </Text>
          <Text style={[styles.brand, { color: colors.secondaryLabel }]}>
            {product.brand}
          </Text>

          {/* Price + rating row */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.label }]}>
              {product.price_inr != null ? `\u20B9${product.price_inr}` : '\u2014'}
            </Text>
            {product.rating != null && product.rating > 0 && (
              <View style={styles.ratingWrap}>
                <Text style={styles.star}>{'\u2605'}</Text>
                <Text style={[styles.ratingScore, { color: colors.secondaryLabel }]}>
                  {product.rating}
                </Text>
                {product.review_count != null && product.review_count > 0 && (
                  <Text style={[styles.reviewCount, { color: colors.tertiaryLabel }]}>
                    ({formatReviewCount(product.review_count)})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumb: {
    height: 150,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(10,132,255,0.85)',
  },
  matchText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    letterSpacing: -0.08,
    lineHeight: 19,
  },
  brand: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    fontSize: 11,
    color: '#FFD60A',
  },
  ratingScore: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});
