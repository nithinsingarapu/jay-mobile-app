import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme';

interface TierDef {
  key: string;
  label: string;
  icon: string; // emoji
  color: string;
}

const TIERS: TierDef[] = [
  { key: 'derm_grade',   label: 'Dermatology',  icon: '\uD83E\uDE7A', color: '#0A84FF' },
  { key: 'dtc_science',  label: 'Science DTC',  icon: '\uD83E\uDDEA', color: '#30D158' },
  { key: 'consumer',     label: 'Consumer',      icon: '\uD83D\uDED2', color: '#FF9F0A' },
  { key: 'premium_hair', label: 'Premium Hair',  icon: '\u2728',       color: '#BF5AF2' },
  { key: 'pharma',       label: 'Medical',       icon: '\uD83C\uDFE5', color: '#FF453A' },
];

interface BrandTierScrollProps {
  active: string | null;
  onSelect: (tier: string | null) => void;
}

export default function BrandTierScroll({ active, onSelect }: BrandTierScrollProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {TIERS.map((tier) => {
        const isActive = active === tier.key;
        return (
          <Pressable
            key={tier.key}
            onPress={() => onSelect(isActive ? null : tier.key)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive
                  ? tier.color + '20'
                  : colors.secondarySystemBackground,
                borderColor: isActive ? tier.color + '40' : 'transparent',
              },
            ]}
          >
            <Text style={styles.icon}>{tier.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? tier.color : colors.label },
              ]}
            >
              {tier.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    letterSpacing: -0.08,
  },
});
