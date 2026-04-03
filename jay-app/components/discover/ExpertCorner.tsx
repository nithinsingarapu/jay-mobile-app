import React, { useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverArticle } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface ExpertCornerProps {
  articles: DiscoverArticle[];
  onArticlePress: (id: string) => void;
}

function ExpertCard({
  article,
  onPress,
  bgColor,
  secondaryLabel,
  tertiaryLabel,
  labelColor,
}: {
  article: DiscoverArticle;
  onPress: () => void;
  bgColor: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  labelColor: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: bgColor }]}
      >
        <Text numberOfLines={1} style={[styles.authorName, { color: labelColor }]}>
          {article.author ?? 'Expert'}
        </Text>
        <Text numberOfLines={1} style={[styles.credentials, { color: secondaryLabel }]}>
          {article.authorCredentials ?? ''}
        </Text>

        <Text numberOfLines={3} style={[styles.quote, { color: secondaryLabel }]}>
          {article.subtitle}
        </Text>

        <Text style={[styles.readTime, { color: tertiaryLabel }]}>
          {article.readTime}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ExpertCorner({ articles, onArticlePress }: ExpertCornerProps) {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: DiscoverArticle }) => (
    <ExpertCard
      article={item}
      onPress={() => onArticlePress(item.id)}
      bgColor={colors.secondarySystemBackground}
      secondaryLabel={colors.secondaryLabel}
      tertiaryLabel={colors.tertiaryLabel}
      labelColor={colors.label}
    />
  );

  return (
    <View>
      <SectionHeader title="Expert Corner" />
      <FlatList
        data={articles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 10,
  },
  card: {
    width: 200,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  credentials: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  quote: {
    fontSize: 13,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 10,
  },
  readTime: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
});
