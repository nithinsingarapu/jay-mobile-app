import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import type { Article } from '../../types';

const CARD_STYLES = [
  { bg: '#1A2A3A', dark: true },
  { bg: '#FDF6E3', dark: false },
  { bg: '#1A3A2A', dark: true },
  { bg: '#3A1A2A', dark: true },
];

interface ForYouCarouselProps { articles: Article[]; }

export function ForYouCarousel({ articles }: ForYouCarouselProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>For you</Text>
        <Text style={styles.seeAll}>See all →</Text>
      </View>
      <FlatList
        data={articles}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={248}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const s = CARD_STYLES[index % CARD_STYLES.length];
          return (
            <Pressable style={[styles.card, { backgroundColor: s.bg }, !s.dark && styles.cardLight]}>
              <Text style={[styles.category, s.dark ? styles.categoryDark : styles.categoryLight]}>
                {item.category.toUpperCase()}
              </Text>
              <Text style={[styles.cardTitle, s.dark ? styles.titleDark : styles.titleLight]}>{item.title}</Text>
              <Text style={[styles.readTime, s.dark ? styles.readTimeDark : styles.readTimeLight]}>{item.readTime} read</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  seeAll: { fontSize: 12, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  listContent: { gap: 12, marginHorizontal: -24, paddingHorizontal: 24 },
  card: { width: 236, borderRadius: 16, padding: 24, minHeight: 152, justifyContent: 'flex-end' },
  cardLight: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.04)' },
  category: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Outfit-SemiBold' },
  categoryDark: { color: 'rgba(255,255,255,0.35)' },
  categoryLight: { color: '#888' },
  cardTitle: { fontSize: 17, fontWeight: '600', lineHeight: 22, fontFamily: 'Outfit-SemiBold' },
  titleDark: { color: '#fff' },
  titleLight: { color: '#000' },
  readTime: { fontSize: 12, marginTop: 10, fontFamily: 'Outfit-Medium' },
  readTimeDark: { color: 'rgba(255,255,255,0.3)' },
  readTimeLight: { color: '#999' },
});
