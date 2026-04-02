import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { ProductOut } from '../../types/product';
import { ProductDetailMock } from '../../data/mockProductDetail';

interface Props {
  product: ProductOut;
  mock: ProductDetailMock;
}

const EFFICACY_COLORS: Record<string, { bg: string; text: string }> = {
  efficacious: { bg: '#34C75920', text: '#34C759' },
  likely_efficacious: { bg: '#FF950020', text: '#FF9500' },
  functional: { bg: '#007AFF20', text: '#007AFF' },
};

const EFFICACY_LABELS: Record<string, string> = {
  efficacious: 'Efficacious',
  likely_efficacious: 'Likely Efficacious',
  functional: 'Functional',
};

export default function IngredientsTab({ product, mock }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Formula Richness Score */}
      <View style={styles.richnessSection}>
        <Text style={[styles.richnessScore, { color: colors.label }]}>
          {mock.formula_richness}
        </Text>
        <Text style={[styles.richnessLabel, { color: colors.secondaryLabel }]}>
          FORMULA RICHNESS
        </Text>
      </View>

      {/* Full INCI List */}
      {product.full_ingredients && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>
            Full INCI List
          </Text>
          <Text style={[styles.inciText, { color: colors.secondaryLabel }]}>
            {product.full_ingredients}
          </Text>
        </View>
      )}

      {/* Key Ingredients */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          Key Ingredients
        </Text>
        {mock.ingredients_detail.map((ingredient, i) => {
          const efficacy = EFFICACY_COLORS[ingredient.efficacy] || EFFICACY_COLORS.functional;
          return (
            <View
              key={i}
              style={[
                styles.ingredientCard,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              <View style={styles.ingredientHeader}>
                <Text style={[styles.ingredientName, { color: colors.label }]}>
                  {ingredient.name}
                </Text>
                <View style={[styles.efficacyBadge, { backgroundColor: efficacy.bg }]}>
                  <Text style={[styles.efficacyText, { color: efficacy.text }]}>
                    {EFFICACY_LABELS[ingredient.efficacy]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.concentration, { color: colors.secondaryLabel }]}>
                Concentration: {ingredient.concentration}
              </Text>
              <Text style={[styles.description, { color: colors.secondaryLabel }]}>
                {ingredient.description}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Safety Flags — derived from real formulation data */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          Safety & Formulation
        </Text>
        <View
          style={[
            styles.flagsTable,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          {(() => {
            // Build safety flags from real product data
            const flags: { flag: string; status: string; safe: boolean }[] = [];
            const f = product.formulation;
            const s = product.suitable_for;
            if (f) {
              if (f.fragrance_free != null) flags.push({ flag: 'Fragrance', status: f.fragrance_free ? 'Free' : 'Contains', safe: !!f.fragrance_free });
              if (f.paraben_free != null) flags.push({ flag: 'Parabens', status: f.paraben_free ? 'Free' : 'Contains', safe: !!f.paraben_free });
              if (f.alcohol_free != null) flags.push({ flag: 'Alcohol', status: f.alcohol_free ? 'Free' : 'Contains', safe: !!f.alcohol_free });
              if (f.silicone_free != null) flags.push({ flag: 'Silicone', status: f.silicone_free ? 'Free' : 'Contains', safe: !!f.silicone_free });
              if (f.ph != null) flags.push({ flag: 'pH Level', status: String(f.ph), safe: f.ph >= 4.5 && f.ph <= 6.5 });
            }
            if (s) {
              if (s.pregnancy_safe != null) flags.push({ flag: 'Pregnancy Safe', status: s.pregnancy_safe ? 'Yes' : 'No', safe: !!s.pregnancy_safe });
              if (s.fungal_acne_safe != null) flags.push({ flag: 'Fungal Acne Safe', status: s.fungal_acne_safe ? 'Yes' : 'No', safe: !!s.fungal_acne_safe });
            }
            // Fallback to mock if no real data
            const displayFlags = flags.length > 0 ? flags : mock.safety_flags;
            return displayFlags.map((flag, i) => (
            <View
              key={i}
              style={[
                styles.flagRow,
                i < displayFlags.length - 1 && {
                  borderBottomWidth: 0.33,
                  borderBottomColor: colors.separator,
                },
              ]}
            >
              <Text style={[styles.flagName, { color: colors.label }]}>
                {flag.flag}
              </Text>
              <View style={styles.flagStatus}>
                <Text
                  style={[
                    styles.flagStatusText,
                    {
                      color: flag.safe
                        ? colors.systemGreen
                        : colors.systemOrange,
                    },
                  ]}
                >
                  {flag.status}
                </Text>
                <Text style={styles.flagIcon}>
                  {flag.safe ? '✓' : '⚠'}
                </Text>
              </View>
            </View>
          ));
          })()}
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
  richnessSection: {
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
  },
  richnessScore: {
    fontSize: 36,
    fontFamily: 'Outfit-Bold',
  },
  richnessLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    gap: SPACE.md,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  inciText: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },
  ingredientCard: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: 6,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    flex: 1,
  },
  efficacyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  efficacyText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
  concentration: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },
  flagsTable: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
  },
  flagName: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  flagStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagStatusText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  flagIcon: {
    fontSize: 14,
  },
});
