import React, { useMemo } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscoverStore, type Department } from '../../stores/discoverStore';
import { useContentStore } from '../../stores/contentStore';
import {
  GUIDE_ARTICLES,
  INGREDIENT_DICTIONARY,
  CONCERNS as MOCK_CONCERNS,
  MYTH_BUSTERS,
  EXPERT_ARTICLES,
} from '../../data/mockDiscoverContent';
import type { DiscoverArticle, DiscoverConcern, MythBuster, IngredientDictEntry } from '../../types/discover';
import Guides101 from './Guides101';
import IngredientDictionary from './IngredientDictionary';
import ByConcernGrid from './ByConcernGrid';
import MythBustersScroll from './MythBustersScroll';
import FromTheExperts from './FromTheExperts';

const CONCERN_COLORS: Record<string, string> = {
  acne: '#FF3B30', pigmentation: '#FF9500', aging: '#AF52DE', dryness: '#5AC8FA',
  sensitivity: '#FF2D55', dullness: '#FFCC00', oiliness: '#34C759', redness: '#FF6B6B',
  'hair fall': '#8E8E93', dandruff: '#A2845E', frizz: '#5856D6', default: '#007AFF',
};
const CONCERN_EMOJIS: Record<string, string> = {
  acne: '🔴', pigmentation: '🌑', aging: '⏳', dryness: '🏜️',
  sensitivity: '⚡', dullness: '😶', oiliness: '💧', redness: '🔥',
  'hair fall': '💇', dandruff: '❄️', frizz: '〰️', default: '🎯',
};
const INGREDIENT_EMOJIS: Record<string, string> = {
  vitamin: '💊', acid: '🧪', peptide: '🔬', antioxidant: '🛡️',
  humectant: '💧', emollient: '🧴', botanical: '🌿', retinoid: '✨',
  exfoliant: '🫧', default: '⚗️',
};

// Map article/ingredient slug → source_url for redirect
const _sourceUrls: Record<string, string> = {};

export default function LearnTab() {
  const router = useRouter();
  const department = useDiscoverStore((s) => s.department);
  const allProducts = useDiscoverStore((s) => s.allProducts);
  const setActiveConcern = useDiscoverStore((s) => s.setActiveConcern);
  const setActiveTab = useDiscoverStore((s) => s.setActiveTab);

  const contentArticles = useContentStore((s) => s.articles);
  const contentIngredients = useContentStore((s) => s.ingredients);
  const contentConcerns = useContentStore((s) => s.concerns);
  const contentMyths = useContentStore((s) => s.myths);

  // Adapt API data with mock fallback
  const guides = useMemo<DiscoverArticle[]>(() => {
    const real = contentArticles
      .filter((a) => a.type === 'guide_101')
      .map((a) => {
        if (a.source_url) _sourceUrls[a.slug] = a.source_url;
        return {
          id: a.slug, type: 'guide_101' as const, title: a.title,
          subtitle: a.summary || '', body: '',
          author: a.source_name || a.author_name,
          readTime: `${a.read_time_minutes ?? 5} min`,
          departments: (a.departments || ['skincare']) as Department[],
          tags: a.tags, gradient: ['#1a2a3a', '#0a1520'] as [string, string],
          image_url: a.image_url || undefined,
          source_url: a.source_url || undefined,
          source_name: a.source_name || undefined,
        };
      });
    return real.length > 0 ? real : GUIDE_ARTICLES.filter((i) => i.departments.includes(department));
  }, [contentArticles, department]);

  const ingredients = useMemo<IngredientDictEntry[]>(() => {
    if (contentIngredients.length > 0) {
      return contentIngredients.map((ing) => {
        // Store the first source URL for ingredient redirect
        const src = ing.sources?.[0];
        if (src?.url) _sourceUrls[ing.slug] = src.url;
        return {
          id: ing.slug, name: ing.name,
          emoji: INGREDIENT_EMOJIS[ing.category || 'default'] || INGREDIENT_EMOJIS.default,
          category: ing.category || 'other',
          oneLiner: ing.what_it_does || '',
          departments: (ing.departments || ['skincare']) as Department[],
        };
      });
    }
    return INGREDIENT_DICTIONARY.filter((i) => i.departments.includes(department));
  }, [contentIngredients, department]);

  const concerns = useMemo<DiscoverConcern[]>(() => {
    if (contentConcerns.length > 0) {
      return contentConcerns.map((c) => ({
        id: c.slug, name: c.name,
        emoji: CONCERN_EMOJIS[c.name.toLowerCase()] || CONCERN_EMOJIS.default,
        color: CONCERN_COLORS[c.name.toLowerCase()] || CONCERN_COLORS.default,
        departments: (c.departments || ['skincare']) as Department[],
      }));
    }
    return MOCK_CONCERNS.filter((i) => i.departments.includes(department));
  }, [contentConcerns, department]);

  const myths = useMemo<MythBuster[]>(() => {
    if (contentMyths.length > 0) {
      return contentMyths.map((m) => ({
        id: String(m.id), myth: m.myth, truth: m.truth, emoji: '🤔',
        departments: (m.departments || ['skincare']) as Department[],
      }));
    }
    return MYTH_BUSTERS.filter((i) => i.departments.includes(department));
  }, [contentMyths, department]);

  const expertArticles = useMemo<DiscoverArticle[]>(() => {
    const real = contentArticles
      .filter((a) => a.type === 'expert_tip')
      .map((a) => {
        if (a.source_url) _sourceUrls[a.slug] = a.source_url;
        return {
          id: a.slug, type: 'expert_tip' as const, title: a.title,
          subtitle: a.summary || '', body: '',
          author: a.source_name || a.author_name,
          authorCredentials: a.author_credential,
          readTime: `${a.read_time_minutes ?? 3} min`,
          departments: (a.departments || ['skincare']) as Department[],
          tags: a.tags, gradient: ['#1a2a3a', '#0a1520'] as [string, string],
          image_url: a.image_url || undefined,
          source_url: a.source_url || undefined,
          source_name: a.source_name || undefined,
        };
      });
    return real.length > 0 ? real : EXPERT_ARTICLES.filter((i) => i.departments.includes(department));
  }, [contentArticles, department]);

  // Compute real product counts per concern
  const productCounts = useMemo(() => {
    const deptProducts = allProducts.filter((p) => p.department === department);
    const counts: Record<string, number> = {};
    deptProducts.forEach((p) =>
      p.concerns?.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      }),
    );
    return counts;
  }, [allProducts, department]);

  const handleConcernPress = (name: string) => {
    setActiveConcern(name);
    setActiveTab('products');
  };

  const handleArticlePress = (id: string) => {
    // Real articles redirect to source URL in browser
    const sourceUrl = _sourceUrls[id];
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
      return;
    }
    router.push({
      pathname: '/(screens)/article',
      params: { articleId: id, articleType: 'discover' },
    } as any);
  };

  const handleIngredientPress = (id: string) => {
    // Open ingredient source (e.g. Incidecoder page) in browser
    const sourceUrl = _sourceUrls[id];
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
      return;
    }
    router.push({
      pathname: '/(screens)/article',
      params: { articleId: id, articleType: 'discover' },
    } as any);
  };

  return (
    <View style={styles.container}>
      <Guides101 articles={guides} onArticlePress={handleArticlePress} />
      <IngredientDictionary entries={ingredients} onEntryPress={handleIngredientPress} />
      <ByConcernGrid
        concerns={concerns}
        productCounts={productCounts}
        onConcernPress={handleConcernPress}
      />
      <MythBustersScroll myths={myths} />
      <FromTheExperts articles={expertArticles} onArticlePress={handleArticlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
});
