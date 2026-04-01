import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { Article } from '../../types';

const CARD_STYLES = [
  { bg: '#1A2A3A', dark: true },
  { bg: '#FDF6E3', dark: false },
  { bg: '#1A3A2A', dark: true },
  { bg: '#3A1A2A', dark: true },
];

interface ForYouCarouselProps { articles: Article[]; }

export function ForYouCarousel({ articles }: ForYouCarouselProps) {
  const { colors } = useTheme();
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.label }]}>For you</Text>
        <Text style={[s.seeAll, { color: colors.systemBlue }]}>See all →</Text>
      </View>
      <FlatList
        data={articles} horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={248} decelerationRate="fast"
        contentContainerStyle={s.listContent} keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const cs = CARD_STYLES[index % CARD_STYLES.length];
          return (
            <Pressable style={[s.card, { backgroundColor: cs.bg }]}>
              <Text style={[s.category, { color: cs.dark ? 'rgba(255,255,255,0.4)' : colors.secondaryLabel }]}>{item.category.toUpperCase()}</Text>
              <Text style={[s.cardTitle, { color: cs.dark ? '#fff' : colors.label }]}>{item.title}</Text>
              <Text style={[s.readTime, { color: cs.dark ? 'rgba(255,255,255,0.35)' : colors.tertiaryLabel }]}>{item.readTime} read</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  seeAll: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  listContent: { gap: 12, marginHorizontal: -20, paddingHorizontal: 20 },
  card: { width: 236, borderRadius: 12, padding: 20, minHeight: 152, justifyContent: 'flex-end' },
  category: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Outfit-SemiBold' },
  cardTitle: { fontSize: 17, fontWeight: '600', lineHeight: 22, fontFamily: 'Outfit-SemiBold' },
  readTime: { fontSize: 13, marginTop: 8, fontFamily: 'Outfit' },
});
