import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { IngredientDictEntry } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface IngredientDictionaryProps {
  entries: IngredientDictEntry[];
  onEntryPress: (id: string) => void;
}

export default function IngredientDictionary({
  entries,
  onEntryPress,
}: IngredientDictionaryProps) {
  const { colors } = useTheme();
  const visible = entries.slice(0, 12);

  return (
    <View>
      <SectionHeader title="Ingredient Dictionary" action="A-Z" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visible.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => onEntryPress(entry.id)}
            style={[styles.pill, { backgroundColor: colors.secondarySystemBackground }]}
          >
            <Text style={styles.emoji}>{entry.emoji}</Text>
            <Text style={[styles.name, { color: colors.label }]}>{entry.name}</Text>
            <Text style={[styles.category, { color: colors.systemBlue }]}>
              {entry.category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  category: {
    fontSize: 11,
    fontFamily: 'Outfit',
  },
});
