import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DiscoverQuickTip } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface QuickTipsScrollProps {
  tips: DiscoverQuickTip[];
}

export default function QuickTipsScroll({ tips }: QuickTipsScrollProps) {
  return (
    <View>
      <SectionHeader title="Quick Tips" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tips.map((tip) => (
          <View key={tip.id} style={[styles.card, { backgroundColor: tip.bgColor }]}>
            <Text style={styles.emoji}>{tip.emoji}</Text>
            <Text numberOfLines={2} style={styles.title}>
              {tip.title}
            </Text>
            <Text numberOfLines={3} style={styles.body}>
              {tip.body}
            </Text>
          </View>
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
  card: {
    width: 150,
    borderRadius: 12,
    padding: 14,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: '#FFF',
    lineHeight: 17,
  },
  body: {
    fontSize: 11,
    fontFamily: 'Outfit',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 15,
    marginTop: 6,
  },
});
