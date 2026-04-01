import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../lib/theme';
import { mockDiscoverArticles } from '../../constants/mockData';

const FILTERS = ['All', 'Trending', 'Ingredients', 'Routines', 'Myths'];

const BG_COLORS = ['#1A2A3A', '#2A1A3A', '#1A3A2A', '#3A2A1A', '#1A2A3A'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All');
  const featured = mockDiscoverArticles[0];
  const rest = mockDiscoverArticles.slice(1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.systemBackground }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 100 }}
    >
      <Text style={styles.title}>Discover</Text>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
        ))}
      </ScrollView>

      {/* Featured card */}
      <Pressable style={[styles.featuredCard, { backgroundColor: '#1A2A3A' }]}>
        <Text style={styles.featuredCategory}>{featured.category.toUpperCase()}</Text>
        <Text style={styles.featuredTitle}>{featured.title}</Text>
        <Text style={styles.featuredMeta}>{featured.readTime} read</Text>
      </Pressable>

      {/* Article list */}
      <View style={styles.list}>
        {rest.map((article, i) => (
          <Pressable key={article.id} style={styles.articleRow}>
            <View style={[styles.articleThumb, { backgroundColor: BG_COLORS[i % BG_COLORS.length] }]} />
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleMeta}>{article.readTime} read · {article.category}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, paddingHorizontal: 24, marginBottom: 16, fontFamily: 'Outfit-SemiBold' },
  filters: { paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  featuredCard: { marginHorizontal: 24, borderRadius: 16, padding: 24, minHeight: 180, justifyContent: 'flex-end', marginBottom: 24 },
  featuredCategory: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Outfit-SemiBold' },
  featuredTitle: { fontSize: 20, color: '#fff', fontWeight: '600', lineHeight: 26, fontFamily: 'Outfit-SemiBold' },
  featuredMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10, fontFamily: 'Outfit' },
  list: { paddingHorizontal: 24 },
  articleRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  articleThumb: { width: 72, height: 72, borderRadius: 10 },
  articleInfo: { flex: 1, justifyContent: 'center' },
  articleTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, fontFamily: 'Outfit-SemiBold' },
  articleMeta: { fontSize: 12, color: '#8E8E93', marginTop: 4, fontFamily: 'Outfit' },
});
