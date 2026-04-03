import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverConcern } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface ByConcernGridProps {
  concerns: DiscoverConcern[];
  productCounts: Record<string, number>;
  onConcernPress: (name: string) => void;
}

export default function ByConcernGrid({
  concerns,
  productCounts,
  onConcernPress,
}: ByConcernGridProps) {
  const { colors } = useTheme();

  return (
    <View>
      <SectionHeader title="By Concern" />
      <View style={styles.grid}>
        {concerns.map((concern) => {
          const count = productCounts[concern.name] || 0;
          return (
            <Pressable
              key={concern.id}
              onPress={() => onConcernPress(concern.name)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: concern.color + '14', // ~8% opacity
                  borderColor: concern.color + '14',
                },
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.emoji}>{concern.emoji}</Text>
              <Text style={[styles.name, { color: colors.label }]}>{concern.name}</Text>
              <Text style={[styles.count, { color: colors.secondaryLabel }]}>
                {count} {count === 1 ? 'product' : 'products'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  emoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  count: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
});
