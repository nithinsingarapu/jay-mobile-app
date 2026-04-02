import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { ProductOut } from '../../types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ProductOut[];
  onProductPress: (id: number) => void;
  loading?: boolean;
}

function mockMatchPercent(id: number): number {
  return 80 + ((id * 7 + 13) % 20);
}

export default function ProductGrid({
  products,
  onProductPress,
  loading,
}: ProductGridProps) {
  const { colors } = useTheme();

  // Render as plain View rows (no FlatList) to avoid nesting inside ScrollView
  const rows: ProductOut[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  if (!loading && products.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={[s.emptyText, { color: colors.secondaryLabel }]}>No products found</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.row}>
          {row.map(item => (
            <View key={item.id} style={s.cardWrapper}>
              <ProductCard
                product={item}
                matchPercent={mockMatchPercent(item.id)}
                onPress={() => onProductPress(item.id)}
              />
            </View>
          ))}
          {row.length === 1 && <View style={s.cardWrapper} />}
        </View>
      ))}
      {loading && (
        <View style={s.footer}>
          <ActivityIndicator color={colors.systemBlue} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cardWrapper: { flex: 1 },
  footer: { paddingVertical: 20, alignItems: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, fontFamily: 'Outfit' },
});
