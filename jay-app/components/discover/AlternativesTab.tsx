import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { ProductDetailMock } from '../../data/mockProductDetail';

interface Props {
  mock: ProductDetailMock;
}

export default function AlternativesTab({ mock }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.contextText, { color: colors.secondaryLabel }]}>
        Based on your skin profile and this product's category, here are
        alternatives JAY thinks you should consider.
      </Text>

      {mock.alternatives.map((alt, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <Text style={[styles.useCase, { color: colors.secondaryLabel }]}>
            {alt.use_case.toUpperCase()}
          </Text>
          <Text style={[styles.name, { color: colors.label }]}>
            {alt.name}
          </Text>
          <Text style={[styles.brand, { color: colors.secondaryLabel }]}>
            {alt.brand} · {alt.price}
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {alt.benefits.map((benefit, j) => (
              <View key={j} style={styles.benefitRow}>
                <Text style={[styles.plusIcon, { color: colors.systemGreen }]}>
                  +
                </Text>
                <Text style={[styles.benefitText, { color: colors.label }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Trade-off */}
          <Text
            style={[
              styles.tradeOff,
              { color: colors.secondaryLabel },
            ]}
          >
            {alt.trade_off}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE.lg,
    paddingVertical: SPACE.lg,
    paddingHorizontal: 16,
  },
  contextText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 21,
  },
  card: {
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    gap: SPACE.sm,
  },
  useCase: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  brand: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  benefits: {
    gap: 4,
    marginTop: SPACE.xs,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  plusIcon: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    width: 16,
    textAlign: 'center',
    marginTop: -1,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 20,
    flex: 1,
  },
  tradeOff: {
    fontSize: 13,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: SPACE.xs,
  },
});
