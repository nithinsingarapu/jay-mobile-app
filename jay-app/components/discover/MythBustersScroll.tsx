import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { MythBuster } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface MythBustersScrollProps {
  myths: MythBuster[];
  onMythPress?: (id: string) => void;
}

export default function MythBustersScroll({ myths, onMythPress }: MythBustersScrollProps) {
  const { colors } = useTheme();

  return (
    <View>
      <SectionHeader title="Myth Busters" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {myths.map((myth) => (
          <Pressable
            key={myth.id}
            onPress={() => onMythPress?.(myth.id)}
            style={[styles.card, { backgroundColor: colors.secondarySystemBackground }]}
          >
            <Text style={styles.emoji}>{myth.emoji}</Text>
            <Text style={[styles.mythLabel, { color: colors.systemRed }]}>MYTH</Text>
            <Text numberOfLines={3} style={[styles.mythText, { color: colors.label }]}>
              {myth.myth}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <Text style={[styles.truthLabel, { color: colors.systemGreen }]}>TRUTH</Text>
            <Text numberOfLines={3} style={[styles.truthText, { color: colors.secondaryLabel }]}>
              {myth.truth}
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
    gap: 10,
  },
  card: {
    width: 200,
    borderRadius: 14,
    padding: 16,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  mythLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  mythText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    lineHeight: 19,
  },
  divider: {
    height: 0.33,
    marginVertical: 10,
  },
  truthLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  truthText: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 18,
  },
});
