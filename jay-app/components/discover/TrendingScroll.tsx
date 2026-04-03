import React, { useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { ProductOut } from '../../types/product';
import SectionHeader from './SectionHeader';

interface TrendingScrollProps {
  products: ProductOut[];
  onProductPress: (id: number) => void;
  title?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  cleanser: '#162a3a',
  serum: '#2a1a20',
  moisturizer: '#1a2a20',
  sunscreen: '#202a2a',
  toner: '#2a2a1a',
  treatment: '#1a1a2a',
  shampoo: '#1a2a2a',
  conditioner: '#2a1a2a',
  oil: '#2a2a1a',
  mask: '#1a1a2a',
};

function getCategoryBg(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] ?? '#1a1a2a';
}

function CompactCard({
  product,
  onPress,
  bgColor,
}: {
  product: ProductOut;
  onPress: () => void;
  bgColor: string;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: bgColor }]}
      >
        <View style={[styles.thumbArea, { backgroundColor: getCategoryBg(product.category) }]} />
        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={[styles.productName, { color: colors.label }]}>
            {product.name}
          </Text>
          <Text numberOfLines={1} style={[styles.brandText, { color: colors.secondaryLabel }]}>
            {product.brand}
          </Text>
          <Text style={[styles.priceText, { color: colors.label }]}>
            {product.price_inr != null ? `\u20B9${product.price_inr}` : '\u2014'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TrendingScroll({
  products,
  onProductPress,
  title = 'Trending Now',
}: TrendingScrollProps) {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: ProductOut }) => (
    <CompactCard
      product={item}
      onPress={() => onProductPress(item.id)}
      bgColor={colors.secondarySystemBackground}
    />
  );

  return (
    <View>
      <SectionHeader title={title} />
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 10,
  },
  card: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbArea: {
    height: 100,
  },
  cardBody: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    lineHeight: 17,
  },
  brandText: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 3,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    marginTop: 6,
  },
});
