import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverArticle } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface Guides101Props {
  articles: DiscoverArticle[];
  onArticlePress: (id: string) => void;
}

export default function Guides101({ articles, onArticlePress }: Guides101Props) {
  const { colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: DiscoverArticle }) => (
      <Pressable
        onPress={() => onArticlePress(item.id)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: item.gradient[0] },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.tag}>
            <Text style={[styles.tagText, { color: colors.systemGreen }]}>BEGINNER</Text>
          </View>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <Text style={styles.readTime}>{item.readTime}</Text>
        </View>
      </Pressable>
    ),
    [onArticlePress, colors.systemGreen],
  );

  const keyExtractor = useCallback((item: DiscoverArticle) => item.id, []);

  return (
    <View>
      <SectionHeader title="101 Guides" />
      <FlatList
        data={articles}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 220,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  readTime: {
    fontSize: 11,
    fontFamily: 'Outfit',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
});
