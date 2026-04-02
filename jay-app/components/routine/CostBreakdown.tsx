import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface Product {
  name: string;
  category: string;
  price: number;
  period: string;
}

interface CostBreakdownProps {
  products: Product[];
  total: number;
}

export function CostBreakdown({ products, total }: CostBreakdownProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {products.map((product, index) => (
        <React.Fragment key={`${product.name}-${index}`}>
          {index > 0 && (
            <View
              style={[
                s.separator,
                { backgroundColor: colors.separator, marginLeft: 16 },
              ]}
            />
          )}
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={[s.productName, { color: colors.label }]}>
                {product.name}
              </Text>
              <Text style={[s.productMeta, { color: colors.secondaryLabel }]}>
                {product.category} · {product.period}
              </Text>
            </View>
            <Text style={[s.price, { color: colors.label }]}>
              ₹{product.price}
            </Text>
          </View>
        </React.Fragment>
      ))}

      <View style={[s.totalSeparator, { backgroundColor: colors.separator }]} />

      <View style={s.totalRow}>
        <Text style={[s.totalLabel, { color: colors.label }]}>
          Total monthly
        </Text>
        <Text style={[s.totalValue, { color: colors.label }]}>₹{total}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  productMeta: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  separator: {
    height: 0.33,
  },
  totalSeparator: {
    height: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
});
