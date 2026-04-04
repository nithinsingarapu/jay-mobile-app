import React, { useMemo } from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscoverStore, type Department } from '../../stores/discoverStore';
import { useContentStore } from '../../stores/contentStore';
import {
  FEATURED_ARTICLES,
  INGREDIENT_SPOTLIGHTS,
  CONCERNS as MOCK_CONCERNS,
  EXPERT_ARTICLES,
  QUICK_TIPS,
  POPULAR_READS,
} from '../../data/mockDiscoverContent';
import { TIPS } from '../../data/learnContent';
import type { DiscoverArticle, DiscoverConcern, DiscoverQuickTip, DiscoverIngredientSpotlight } from '../../types/discover';
import HeroCard from './HeroCard';
import TrendingScroll from './TrendingScroll';
import IngredientSpotlightCard from './IngredientSpotlightCard';
import ConcernPills from './ConcernPills';
import ExpertCorner from './ExpertCorner';
import QuickTipsScroll from './QuickTipsScroll';
import PopularReads from './PopularReads';

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

// Map article slug → source_url for redirect
const _sourceUrls: Record<string, string> = {};

export default function ForYouTab() {
  const router = useRouter();
  const department = useDiscoverStore((s) => s.department);
  const allProducts = useDiscoverStore((s) => s.allProducts);
  const setActiveConcern = useDiscoverStore((s) => s.setActiveConcern);
  const setActiveTab = useDiscoverStore((s) => s.setActiveTab);

  const contentArticles = useContentStore((s) => s.articles);
  const contentIngredients = useContentStore((s) => s.ingredients);
  const contentConcerns = useContentStore((s) => s.concerns);
  const contentTips = useContentStore((s) => s.tips);

  // ── Adapt API data to component types ─────────────────────────────
  const deptArticles = useMemo<DiscoverArticle[]>(() => {
    const real = contentArticles
      .filter((a) => a.type === 'editorial' || a.type === 'guide_101')
      .map((a) => {
        if (a.source_url) _sourceUrls[a.slug] = a.source_url;
        return {
          id: a.slug, type: (a.type || 'editorial') as any, title: a.title,
          subtitle: a.summary || '', body: '',
          author: a.source_name || a.author_name,
          readTime: `${a.read_time_minutes ?? 5} min`,
          departments: (a.departments || ['skincare']) as Department[],
          tags: a.tags, gradient: ['#1a2a3a', '#0a1520'] as [string, string],
          image_url: a.image_url || undefined,
          source_url: a.source_url || undefined,
          source_name: a.source_name || undefined,
          featured: true,
        };
      });
    return real.length > 0 ? real : FEATURED_ARTICLES.filter((a) => a.departments.includes(department));
  }, [contentArticles, department]);

  const deptProducts = useMemo(
    () => allProducts.filter((p) => p.department === department),
    [allProducts, department],
  );

  const trending = useMemo(
    () => [...deptProducts].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0)).slice(0, 10),
    [deptProducts],
  );

  const newProducts = useMemo(
    () => [...deptProducts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10),
    [deptProducts],
  );

  const spotlight = useMemo<DiscoverIngredientSpotlight | null>(() => {
    const real = contentIngredients[0];
    if (real) return {
      id: real.slug, ingredientName: real.name, emoji: '🧪',
      tagline: real.what_it_does || '', summary: real.how_it_works || '',
      departments: (real.departments || ['skincare']) as Department[],
    };
    return INGREDIENT_SPOTLIGHTS.filter((s) => s.departments.includes(department))[0] ?? null;
  }, [contentIngredients, department]);

  const spotlightProductCount = useMemo(() => {
    if (!spotlight) return 0;
    return deptProducts.filter((p) =>
      p.key_ingredients?.some((ing) => ing.toLowerCase().includes(spotlight.ingredientName.toLowerCase())),
    ).length;
  }, [spotlight, deptProducts]);

  const concerns = useMemo<DiscoverConcern[]>(() => {
    if (contentConcerns.length > 0) {
      return contentConcerns.map((c) => ({
        id: c.slug, name: c.name,
        emoji: CONCERN_EMOJIS[c.name.toLowerCase()] || CONCERN_EMOJIS.default,
        color: CONCERN_COLORS[c.name.toLowerCase()] || CONCERN_COLORS.default,
        departments: (c.departments || ['skincare']) as Department[],
      }));
    }
    return MOCK_CONCERNS.filter((c) => c.departments.includes(department));
  }, [contentConcerns, department]);

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
    return real.length > 0 ? real : EXPERT_ARTICLES.filter((a) => a.departments.includes(department));
  }, [contentArticles, department]);

  const quickTips = useMemo<DiscoverQuickTip[]>(() => {
    if (contentTips.length > 0) {
      return contentTips.slice(0, 6).map((t, i) => ({
        id: String(t.id), emoji: '💡', title: t.title, body: t.body,
        bgColor: ['#E3F2FD', '#FFF3E0', '#E8F5E9', '#FCE4EC', '#F3E5F5', '#FFFDE7'][i % 6],
        departments: (t.departments || ['skincare']) as Department[],
      }));
    }
    const deptTips = QUICK_TIPS.filter((t) => t.departments.includes(department));
    if (deptTips.length > 0) return deptTips;
    return TIPS.slice(0, 6).map((t) => ({ ...t, departments: [department] as Department[] }));
  }, [contentTips, department]);

  const popularReads = useMemo<DiscoverArticle[]>(() => {
    const real = contentArticles
      .filter((a) => a.type === 'popular_read')
      .map((a) => {
        if (a.source_url) _sourceUrls[a.slug] = a.source_url;
        return {
          id: a.slug, type: 'popular_read' as const, title: a.title,
          subtitle: a.summary || '', body: '',
          author: a.source_name || a.author_name,
          readTime: `${a.read_time_minutes ?? 4} min`,
          departments: (a.departments || ['skincare']) as Department[],
          tags: a.tags, gradient: ['#1a2a3a', '#0a1520'] as [string, string],
          image_url: a.image_url || undefined,
          source_url: a.source_url || undefined,
          source_name: a.source_name || undefined,
        };
      });
    return real.length > 0 ? real : POPULAR_READS.filter((a) => a.departments.includes(department));
  }, [contentArticles, department]);

  // ── Navigation handlers ────────────────────────────────────────────────
  const onProductPress = (id: number) => {
    router.push({ pathname: '/(screens)/product-detail', params: { productId: String(id) } } as any);
  };

  const onArticlePress = (id: string) => {
    // Real articles redirect to source URL in browser
    const sourceUrl = _sourceUrls[id];
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
      return;
    }
    // Mock articles open internal article screen
    router.push({
      pathname: '/(screens)/article',
      params: { articleId: id, articleType: 'discover' },
    } as any);
  };

  const onConcernSelect = (name: string) => {
    setActiveConcern(name);
    setActiveTab('products');
  };

  const onSpotlightPress = () => {
    if (spotlight) {
      onArticlePress(spotlight.id);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const heroArticle = deptArticles[0];

  return (
    <View style={styles.container}>
      {heroArticle && (
        <View style={styles.section}>
          <HeroCard article={heroArticle} onPress={() => onArticlePress(heroArticle.id)} />
        </View>
      )}

      {trending.length > 0 && (
        <View style={styles.section}>
          <TrendingScroll products={trending} onProductPress={onProductPress} />
        </View>
      )}

      {spotlight && (
        <View style={styles.section}>
          <IngredientSpotlightCard
            spotlight={spotlight}
            productCount={spotlightProductCount}
            onPress={onSpotlightPress}
          />
        </View>
      )}

      {concerns.length > 0 && (
        <View style={styles.section}>
          <ConcernPills concerns={concerns} onSelect={onConcernSelect} />
        </View>
      )}

      {newProducts.length > 0 && (
        <View style={styles.section}>
          <TrendingScroll
            products={newProducts}
            onProductPress={onProductPress}
            title="New on JAY"
          />
        </View>
      )}

      {expertArticles.length > 0 && (
        <View style={styles.section}>
          <ExpertCorner articles={expertArticles} onArticlePress={onArticlePress} />
        </View>
      )}

      {quickTips.length > 0 && (
        <View style={styles.section}>
          <QuickTipsScroll tips={quickTips} />
        </View>
      )}

      {popularReads.length > 0 && (
        <View style={styles.section}>
          <PopularReads articles={popularReads} onArticlePress={onArticlePress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 8,
  },
});
