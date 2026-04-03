import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverArticle } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface FromTheExpertsProps {
  articles: DiscoverArticle[];
  onArticlePress: (id: string) => void;
}

export default function FromTheExperts({ articles, onArticlePress }: FromTheExpertsProps) {
  const { colors } = useTheme();

  return (
    <View>
      <SectionHeader title="From the Experts" />
      {articles.map((article) => (
        <Pressable
          key={article.id}
          onPress={() => onArticlePress(article.id)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.secondarySystemBackground },
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[styles.author, { color: colors.label }]}>
              {article.author}
            </Text>
            {article.authorCredentials ? (
              <Text style={[styles.credentials, { color: colors.secondaryLabel }]}>
                {article.authorCredentials}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.title, { color: colors.label }]}>{article.title}</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.secondaryLabel }]}>
            {article.subtitle}
          </Text>
          <Text style={[styles.readTime, { color: colors.tertiaryLabel }]}>
            {article.readTime}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  credentials: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  readTime: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 6,
  },
});
