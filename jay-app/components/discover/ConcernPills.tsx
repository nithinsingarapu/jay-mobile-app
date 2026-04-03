import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverConcern } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface ConcernPillsProps {
  concerns: DiscoverConcern[];
  onSelect: (name: string) => void;
}

export default function ConcernPills({ concerns, onSelect }: ConcernPillsProps) {
  const { colors } = useTheme();

  return (
    <View>
      <SectionHeader title="Top by Concern" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {concerns.map((concern) => (
          <Pressable
            key={concern.id}
            onPress={() => onSelect(concern.name)}
            style={[
              styles.pill,
              { backgroundColor: concern.color + '1F' }, // ~12% opacity hex
            ]}
          >
            <Text style={styles.emoji}>{concern.emoji}</Text>
            <Text style={[styles.pillText, { color: concern.color }]}>
              {concern.name}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
});
