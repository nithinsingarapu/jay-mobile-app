import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { ProductOut } from '../../types/product';

interface ProductCardProps {
  product: ProductOut;
  matchPercent?: number;
  onPress: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  cleanser: '#0A84FF', serum: '#5E5CE6', moisturizer: '#64D2FF',
  sunscreen: '#FFD60A', toner: '#30D158', treatment: '#FF9F0A',
  shampoo: '#BF5AF2', conditioner: '#BF5AF2', mask: '#FF375F',
  exfoliant: '#FF375F', essence: '#30D158',
};

const CATEGORY_EMOJI: Record<string, string> = {
  cleanser: '🧴', serum: '💧', moisturizer: '🧊', sunscreen: '☀️',
  toner: '💦', treatment: '⚗️', shampoo: '💇', conditioner: '💇',
  mask: '🎭', exfoliant: '✨', essence: '🌸', oil: '🫧',
};

const fmtCategory = (cat: string) =>
  cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function getCatEmoji(category: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.includes(key)) return emoji;
  }
  return '📦';
}

function getCatColor(category: string, fallback: string): string {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key)) return color;
  }
  return fallback;
}

export default function ProductCard({ product, matchPercent, onPress }: ProductCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const catColor = getCatColor(product.category, colors.systemBlue);
  const hasImage = !!product.image_url && product.image_url.startsWith('http');

  const formTags: string[] = [];
  if (product.formulation?.fragrance_free) formTags.push('Fragrance-Free');
  if (product.formulation?.paraben_free) formTags.push('Paraben-Free');
  if (product.formulation?.alcohol_free) formTags.push('Alcohol-Free');

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        style={[$.card, { backgroundColor: colors.secondarySystemBackground }]}
      >
        {/* Image area */}
        <View style={[$.heroArea, !hasImage && { backgroundColor: catColor + '15' }]}>
          {hasImage ? (
            <Image source={{ uri: product.image_url! }} style={$.heroImage} resizeMode="cover" />
          ) : (
            <Text style={$.heroEmoji}>{getCatEmoji(product.category)}</Text>
          )}

          {/* Category pill */}
          <View style={[$.catBadge, { backgroundColor: catColor + '20' }]}>
            <Text style={[$.catBadgeText, { color: catColor }]}>{fmtCategory(product.category)}</Text>
          </View>

          {/* Match badge */}
          {matchPercent != null && (
            <View style={[$.matchBadge, { backgroundColor: colors.systemBlue }]}>
              <Text style={$.matchText}>{matchPercent}%</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={$.content}>
          <Text numberOfLines={2} style={[$.name, { color: colors.label }]}>
            {product.name}
          </Text>
          <Text style={[$.brand, { color: colors.secondaryLabel }]}>
            {product.brand}
          </Text>

          {/* Price + rating row */}
          <View style={$.bottomRow}>
            <Text style={[$.price, { color: colors.label }]}>
              {product.price_inr != null ? `₹${product.price_inr}` : '—'}
            </Text>
            {product.rating != null && product.rating > 0 ? (
              <Text style={[$.ratingText, { color: colors.tertiaryLabel }]}>
                ⭐ {product.rating}{product.review_count ? ` (${product.review_count})` : ''}
              </Text>
            ) : formTags.length > 0 ? (
              <View style={[$.formBadge, { backgroundColor: colors.systemGreen + '15' }]}>
                <Text style={[$.formBadgeText, { color: colors.systemGreen }]}>{formTags[0]}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const $ = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden' },
  heroArea: {
    height: 140, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmoji: { fontSize: 36, opacity: 0.6 },
  catBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  catBadgeText: { fontSize: 9, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  matchBadge: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  matchText: { fontSize: 10, fontFamily: 'Outfit-Bold', color: '#FFF' },
  content: { padding: 10 },
  name: { fontSize: 14, fontFamily: 'Outfit-Medium', lineHeight: 18 },
  brand: { fontSize: 11, fontFamily: 'Outfit', marginTop: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  ratingText: { fontSize: 11, fontFamily: 'Outfit' },
  formBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  formBadgeText: { fontSize: 8, fontFamily: 'Outfit-Medium' },
});
