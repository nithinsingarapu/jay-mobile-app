import React from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { useTheme } from '../../lib/theme';

interface CategoryItem {
  name: string;
  emoji: string;
  count: number;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  onSelect: (cat: string) => void;
}

const COLOR_KEYS = [
  'systemBlue', 'systemGreen', 'systemOrange', 'systemIndigo',
  'systemPurple', 'systemTeal',
] as const;

const CARD_WIDTH = (Dimensions.get('window').width - 32 - 10) / 2;

export default function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const { colors } = useTheme();

  return (
    <View style={s.grid}>
      {categories.map((cat, i) => {
        const colorKey = COLOR_KEYS[i % COLOR_KEYS.length];
        const tint = (colors as any)[colorKey] || colors.systemBlue;

        return (
          <Pressable
            key={cat.name}
            onPress={() => onSelect(cat.name)}
            style={[s.card, { backgroundColor: tint + '12', width: CARD_WIDTH }]}
          >
            <Text style={s.emoji}>{cat.emoji}</Text>
            <Text style={[s.name, { color: colors.label }]}>{cat.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  card: { borderRadius: 14, padding: 16 },
  emoji: { fontSize: 26, marginBottom: 6 },
  name: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
});
