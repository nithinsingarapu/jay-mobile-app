import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { ProductOut } from '../../types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ProductOut[];
  onProductPress: (id: number) => void;
  loading?: boolean;
  loadingMore?: boolean;
}

// Deterministic mock match % seeded from product id
function mockMatchPercent(id: number): number {
  return 80 + ((id * 7 + 13) % 15); // Range: 80-94
}

export default function ProductGrid({
  products,
  onProductPress,
  loading,
  loadingMore,
}: ProductGridProps) {
  const { colors } = useTheme();

  // Pair products into rows of 2
  const rows: ProductOut[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  if (loading && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.systemBlue} />
      </View>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
          No products found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <ProductCard
                product={item}
                matchPercent={mockMatchPercent(item.id)}
                onPress={() => onProductPress(item.id)}
              />
            </View>
          ))}
          {row.length === 1 && <View style={styles.cardWrapper} />}
        </View>
      ))}
      {loadingMore && (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.systemBlue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cardWrapper: {
    flex: 1,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
