import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverArticle } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface PopularReadsProps {
  articles: DiscoverArticle[];
  onArticlePress: (id: string) => void;
}

function ReadRow({
  article,
  onPress,
  bgColor,
  labelColor,
  secondaryLabel,
  tertiaryLabel,
}: {
  article: DiscoverArticle;
  onPress: () => void;
  bgColor: string;
  labelColor: string;
  secondaryLabel: string;
  tertiaryLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={[styles.rowWrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.row, { backgroundColor: bgColor }]}
      >
        {/* Thumbnail or accent strip */}
        {article.image_url ? (
          <Image source={{ uri: article.image_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.strip, { backgroundColor: article.gradient[0] }]} />
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={[styles.title, { color: labelColor }]}>
            {article.title}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: secondaryLabel }]}>
            {article.subtitle}
          </Text>
          {article.source_name && (
            <Text numberOfLines={1} style={[styles.source, { color: tertiaryLabel }]}>
              {article.source_name}
            </Text>
          )}
        </View>

        {/* Read time */}
        <Text style={[styles.readTime, { color: tertiaryLabel }]}>
          {article.readTime}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PopularReads({ articles, onArticlePress }: PopularReadsProps) {
  const { colors } = useTheme();

  return (
    <View>
      <SectionHeader title="Popular Reads" />
      {articles.map((article) => (
        <ReadRow
          key={article.id}
          article={article}
          onPress={() => onArticlePress(article.id)}
          bgColor={colors.secondarySystemBackground}
          labelColor={colors.label}
          secondaryLabel={colors.secondaryLabel}
          tertiaryLabel={colors.tertiaryLabel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    minHeight: 64,
  },
  strip: {
    width: 4,
    borderRadius: 4,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  source: {
    fontSize: 10,
    fontFamily: 'Outfit',
    marginTop: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  readTime: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginLeft: 10,
  },
});
