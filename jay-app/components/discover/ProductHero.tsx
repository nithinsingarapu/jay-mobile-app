import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SPACE } from '../../constants/theme';
import { ProductOut } from '../../types/product';

interface Props {
  product: ProductOut;
}

const CATEGORY_COLORS: Record<string, [string, string]> = {
  cleanser: ['#007AFF', '#5AC8FA'],
  serum: ['#AF52DE', '#5856D6'],
  moistur: ['#007AFF', '#64D2FF'],
  sunscreen: ['#FF9500', '#FFCC00'],
  toner: ['#30D158', '#00C7BE'],
  mask: ['#5856D6', '#AF52DE'],
  exfol: ['#FF3B30', '#FF2D55'],
  shampoo: ['#BF5AF2', '#AF52DE'],
  conditioner: ['#BF5AF2', '#AF52DE'],
  oil: ['#FF9500', '#FFD60A'],
  treatment: ['#FF9F0A', '#FF9500'],
};

function getColors(category: string): [string, string] {
  for (const [key, colors] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key)) return colors;
  }
  return ['#8E8E93', '#636366'];
}

export default function ProductHero({ product }: Props) {
  const [startColor, endColor] = getColors(product.category);
  const hasImage = !!product.image_url && product.image_url.startsWith('http');

  if (hasImage) {
    return (
      <View style={s.container}>
        <Image source={{ uri: product.image_url! }} style={s.image} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: startColor }]}>
      <View style={[s.overlay, { backgroundColor: endColor, opacity: 0.5 }]} />
      <View style={s.content}>
        <Text style={s.emoji}>📦</Text>
        <Text style={s.label}>No image available</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%', height: 260,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject },
  content: { zIndex: 1, alignItems: 'center', gap: SPACE.sm },
  emoji: { fontSize: 48 },
  label: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#FFF', letterSpacing: 0.5 },
});
