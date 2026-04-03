import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface BrandScrollProps {
  brands: string[];
  onSelect: (brand: string) => void;
}

function abbreviation(name: string): string {
  const clean = name.replace(/['']/g, '').trim();
  if (!clean) return '??';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
}

export default function BrandScroll({ brands, onSelect }: BrandScrollProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {brands.slice(0, 10).map((brand) => (
        <Pressable key={brand} onPress={() => onSelect(brand)} style={styles.item}>
          <View
            style={[
              styles.circle,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <Text style={[styles.abbr, { color: colors.label }]}>
              {abbreviation(brand)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.brandName, { color: colors.secondaryLabel }]}
          >
            {brand}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingHorizontal: 16,
  },
  item: {
    minWidth: 80,
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  abbr: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.2,
  },
  brandName: {
    fontSize: 11,
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
});
