import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface BrandScrollProps {
  brands: string[];
  activeBrand: string | null;
  onSelect: (brand: string | null) => void;  // null = "All"
}

// Unique brand colors for visual distinction
const BRAND_COLORS: Record<string, string> = {
  'Minimalist': '#1A1A2E',
  'The Derma Co': '#E84545',
  'CeraVe': '#0066CC',
  'La Roche-Posay': '#004B87',
  'Bioderma': '#00A79D',
  'Cetaphil': '#0072CE',
  'Dot & Key': '#FF6B6B',
  "Dr. Sheth's": '#2D6A4F',
  'Eucerin': '#003DA5',
  'Sebamed': '#00843D',
  "Re'equil": '#5E3C87',
  'Fixderma': '#1E3A5F',
  'Chemist at Play': '#FF9F1C',
  'ISDN': '#E63946',
  'Ducray': '#2A9D8F',
  "L'Oréal Paris": '#000000',
  'Sesderma': '#C77DFF',
  'Cipla': '#264653',
  "Dr. Reddy's": '#E76F51',
  'Kérastase': '#1D1D1D',
  'Bare Anatomy': '#606C38',
  'Glenmark': '#457B9D',
};

function getBrandColor(brand: string, fallback: string): string {
  return BRAND_COLORS[brand] || fallback;
}

function abbreviation(name: string): string {
  // Clean up brand name
  const clean = name.replace(/['']/g, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function BrandScroll({ brands, activeBrand, onSelect }: BrandScrollProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {/* ALL option */}
      <Pressable onPress={() => onSelect(null)} style={s.item}>
        <View style={[
          s.circle,
          { backgroundColor: !activeBrand ? colors.systemBlue : colors.tertiarySystemFill },
        ]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke={!activeBrand ? '#FFF' : colors.secondaryLabel} strokeWidth={2} strokeLinecap="round">
            <Path d="M4 6h16M4 12h16M4 18h16" />
          </Svg>
        </View>
        <Text style={[s.brandName, { color: !activeBrand ? colors.label : colors.secondaryLabel }]}>
          All
        </Text>
      </Pressable>

      {brands.map((brand) => {
        const isActive = activeBrand === brand;
        const brandColor = getBrandColor(brand, colors.systemGray3);

        return (
          <Pressable key={brand} onPress={() => onSelect(brand)} style={s.item}>
            <View style={[
              s.circle,
              { backgroundColor: isActive ? brandColor : colors.tertiarySystemFill },
              isActive && { borderWidth: 2, borderColor: brandColor },
            ]}>
              <Text style={[
                s.abbr,
                { color: isActive ? '#FFF' : brandColor },
              ]}>
                {abbreviation(brand)}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                s.brandName,
                { color: isActive ? colors.label : colors.secondaryLabel },
                isActive && { fontFamily: 'Outfit-SemiBold' },
              ]}
            >
              {brand}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { gap: 12, paddingHorizontal: 16 },
  item: { alignItems: 'center', width: 68 },
  circle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  abbr: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  brandName: {
    fontSize: 10, fontFamily: 'Outfit', marginTop: 5,
    textAlign: 'center',
  },
});
