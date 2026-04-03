import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { Department } from '../../stores/discoverStore';

// ── Category definitions per department ─────────────────────────────────

interface ChipDef {
  label: string;
  value: string; // normalized_category value
}

const SKINCARE_CHIPS: ChipDef[] = [
  { label: 'Cleansers', value: 'cleansers' },
  { label: 'Serums', value: 'serums' },
  { label: 'Moisturizers', value: 'moisturizers' },
  { label: 'Sunscreen', value: 'sunscreen' },
  { label: 'Treatments', value: 'treatments' },
  { label: 'Toners', value: 'toners' },
  { label: 'Eye Care', value: 'eye_care' },
  { label: 'Lip Care', value: 'lip_care' },
  { label: 'Masks', value: 'masks_exfoliants' },
];

const HAIRCARE_CHIPS: ChipDef[] = [
  { label: 'Shampoo', value: 'shampoo' },
  { label: 'Conditioner', value: 'conditioner' },
  { label: 'Hair Masks', value: 'hair_masks' },
  { label: 'Hair Serums', value: 'hair_serums' },
  { label: 'Hair Oils', value: 'hair_oils' },
  { label: 'Styling', value: 'styling' },
  { label: 'Scalp Care', value: 'scalp_care' },
];

const BODYCARE_CHIPS: ChipDef[] = [
  { label: 'Body Wash', value: 'body_wash' },
  { label: 'Body Lotion', value: 'body_lotion' },
  { label: 'Body Scrubs', value: 'body_scrubs' },
  { label: 'Body Treatment', value: 'body_treatment' },
];

const CHIPS_BY_DEPT: Record<Department, ChipDef[]> = {
  skincare: SKINCARE_CHIPS,
  haircare: HAIRCARE_CHIPS,
  bodycare: BODYCARE_CHIPS,
};

// ── Component ───────────────────────────────────────────────────────────

interface FilterChipsProps {
  department: Department;
  active: string | null; // null = "All"
  onSelect: (category: string | null) => void;
}

export default function FilterChips({ department, active, onSelect }: FilterChipsProps) {
  const { colors } = useTheme();
  const chips = CHIPS_BY_DEPT[department];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All" chip */}
      <Pressable
        onPress={() => onSelect(null)}
        style={[
          styles.chip,
          {
            backgroundColor: active === null
              ? colors.systemBlue
              : colors.tertiarySystemFill,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: active === null ? '#FFFFFF' : colors.label },
          ]}
        >
          All
        </Text>
      </Pressable>

      {chips.map((chip) => {
        const isActive = active === chip.value;
        return (
          <Pressable
            key={chip.value}
            onPress={() => onSelect(isActive ? null : chip.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? colors.systemBlue
                  : colors.tertiarySystemFill,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isActive ? '#FFFFFF' : colors.label },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Exports for cross-component use ─────────────────────────────────────

export { CHIPS_BY_DEPT };

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    letterSpacing: -0.24,
  },
});
