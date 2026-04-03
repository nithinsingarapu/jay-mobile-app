import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { Department } from '../../stores/discoverStore';

interface CategoryDef {
  key: string;       // normalized_category value
  name: string;
  emoji: string;
  color: string;     // base RGB for gradient tint
}

// ── Top 6 categories per department ─────────────────────────────────────

const SKINCARE_CATEGORIES: CategoryDef[] = [
  { key: 'cleansers',    name: 'Cleansers',    emoji: '\uD83E\uDDF4', color: '242,112,89' },
  { key: 'serums',       name: 'Serums',       emoji: '\uD83D\uDCA7', color: '10,132,255' },
  { key: 'moisturizers', name: 'Moisturizers', emoji: '\uD83E\uDDCA', color: '48,209,88' },
  { key: 'sunscreen',    name: 'Sunscreen',    emoji: '\u2600\uFE0F', color: '255,214,10' },
  { key: 'treatments',   name: 'Treatments',   emoji: '\uD83E\uDDEA', color: '94,92,230' },
  { key: 'toners',       name: 'Toners',       emoji: '\u2728',       color: '191,90,242' },
];

const HAIRCARE_CATEGORIES: CategoryDef[] = [
  { key: 'shampoo',      name: 'Shampoo',      emoji: '\uD83E\uDDF4', color: '10,132,255' },
  { key: 'conditioner',  name: 'Conditioner',  emoji: '\uD83D\uDCA7', color: '48,209,88' },
  { key: 'hair_masks',   name: 'Hair Masks',   emoji: '\uD83E\uDDD6', color: '191,90,242' },
  { key: 'hair_serums',  name: 'Hair Serums',  emoji: '\uD83E\uDDEA', color: '94,92,230' },
  { key: 'hair_oils',    name: 'Hair Oils',    emoji: '\uD83C\uDF3B', color: '255,159,10' },
  { key: 'scalp_care',   name: 'Scalp Care',   emoji: '\uD83E\uDE7A', color: '242,112,89' },
];

const BODYCARE_CATEGORIES: CategoryDef[] = [
  { key: 'body_wash',      name: 'Body Wash',      emoji: '\uD83D\uDEBF', color: '10,132,255' },
  { key: 'body_lotion',    name: 'Body Lotion',    emoji: '\uD83E\uDDF4', color: '48,209,88' },
  { key: 'body_treatment', name: 'Body Treatment', emoji: '\uD83E\uDDEA', color: '191,90,242' },
  { key: 'body_scrubs',    name: 'Body Scrubs',    emoji: '\u2728',       color: '242,112,89' },
];

const CATEGORIES_BY_DEPT: Record<Department, CategoryDef[]> = {
  skincare: SKINCARE_CATEGORIES,
  haircare: HAIRCARE_CATEGORIES,
  bodycare: BODYCARE_CATEGORIES,
};

// ── Component ───────────────────────────────────────────────────────────

interface CategoryGridProps {
  department: Department;
  counts: Record<string, number>;  // normalized_category → count
  onSelect: (category: string) => void;
}

export default function CategoryGrid({ department, counts, onSelect }: CategoryGridProps) {
  const { colors } = useTheme();
  const categories = CATEGORIES_BY_DEPT[department];

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const count = counts[cat.key] ?? 0;
        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelect(cat.key)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: `rgba(${cat.color}, 0.08)`,
                borderColor: `rgba(${cat.color}, 0.08)`,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.name, { color: colors.label }]}>{cat.name}</Text>
            {count > 0 && (
              <Text style={[styles.count, { color: colors.secondaryLabel }]}>
                {count} product{count !== 1 ? 's' : ''}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  card: {
    width: '31%',
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  count: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 2,
    textAlign: 'center',
  },
});
