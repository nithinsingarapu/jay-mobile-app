import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { ProductDetailMock } from '../../data/mockProductDetail';

interface Props {
  mock: ProductDetailMock;
}

export default function PricesTab({ mock }: Props) {
  const { colors } = useTheme();

  const bestValue = mock.price_sizes.find((p) => p.best_value);
  const allPrices = mock.price_sizes.map((p) => p.price);
  const maxPrice = Math.max(...allPrices);

  // Generate mock price history (6 bars)
  const basePrice = bestValue?.price ?? allPrices[0] ?? 400;
  const priceHistory = [
    basePrice * 1.1,
    basePrice * 1.05,
    basePrice * 0.95,
    basePrice * 1.02,
    basePrice,
    basePrice * 0.98,
  ];
  const historyMax = Math.max(...priceHistory);

  // Group by size
  const sizeGroups: Record<string, typeof mock.price_sizes> = {};
  for (const item of mock.price_sizes) {
    if (!sizeGroups[item.size]) sizeGroups[item.size] = [];
    sizeGroups[item.size].push(item);
  }

  return (
    <View style={styles.container}>
      {/* Best Value Card */}
      {bestValue && (
        <View
          style={[
            styles.bestValueCard,
            { backgroundColor: colors.systemBlue + '15' },
          ]}
        >
          <Text style={[styles.bestValueLabel, { color: colors.systemBlue }]}>
            BEST VALUE
          </Text>
          <Text style={[styles.bestValuePrice, { color: colors.label }]}>
            ₹{bestValue.price}
          </Text>
          <Text style={[styles.bestValueMeta, { color: colors.secondaryLabel }]}>
            {bestValue.size} · {bestValue.platform}
          </Text>
        </View>
      )}

      {/* All Sizes Grouped */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          All Prices
        </Text>
        {Object.entries(sizeGroups).map(([size, items]) => (
          <View key={size} style={styles.sizeGroup}>
            <Text style={[styles.sizeLabel, { color: colors.secondaryLabel }]}>
              {size}
            </Text>
            <View
              style={[
                styles.priceTable,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              {items.map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.priceRow,
                    i < items.length - 1 && {
                      borderBottomWidth: 0.33,
                      borderBottomColor: colors.separator,
                    },
                  ]}
                >
                  <Text style={[styles.platform, { color: colors.label }]}>
                    {item.platform}
                  </Text>
                  <View style={styles.priceRight}>
                    <Text style={[styles.price, { color: colors.label }]}>
                      ₹{item.price}
                    </Text>
                    {item.best_value && (
                      <View
                        style={[
                          styles.bestBadge,
                          { backgroundColor: colors.systemGreen + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.bestBadgeText,
                            { color: colors.systemGreen },
                          ]}
                        >
                          Best
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Price History Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          Price History
        </Text>
        <View style={styles.chartContainer}>
          {priceHistory.map((price, i) => {
            const heightPercent = (price / historyMax) * 100;
            return (
              <View key={i} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: colors.systemBlue,
                        height: `${heightPercent}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.secondaryLabel }]}>
                  {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE.xxl,
    paddingVertical: SPACE.lg,
  },
  bestValueCard: {
    marginHorizontal: 16,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    alignItems: 'center',
    gap: 4,
  },
  bestValueLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bestValuePrice: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
  },
  bestValueMeta: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  section: {
    gap: SPACE.md,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  sizeGroup: {
    gap: SPACE.sm,
  },
  sizeLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceTable: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
  },
  platform: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  bestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    gap: SPACE.sm,
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Outfit',
  },
});
