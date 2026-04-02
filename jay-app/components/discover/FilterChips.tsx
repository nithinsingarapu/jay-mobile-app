import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../lib/theme';

interface FilterChipsProps {
  categories: string[];
  active: string | null;
  onSelect: (cat: string | null) => void;
}

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FilterChips({ categories, active, onSelect }: FilterChipsProps) {
  const { colors } = useTheme();

  const renderChip = (label: string, value: string | null, isActive: boolean) => (
    <Pressable
      key={label}
      onPress={() => onSelect(value)}
      style={[
        styles.chip,
        { backgroundColor: isActive ? colors.systemBlue : colors.tertiarySystemFill },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: isActive ? '#FFFFFF' : colors.label },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {renderChip('All', null, active === null)}
      {categories.map((cat) =>
        renderChip(formatCategory(cat), cat, active === cat)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
});
