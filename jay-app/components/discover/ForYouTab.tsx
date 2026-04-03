import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscoverStore, type Department } from '../../stores/discoverStore';
import {
  FEATURED_ARTICLES,
  INGREDIENT_SPOTLIGHTS,
  CONCERNS,
  EXPERT_ARTICLES,
  QUICK_TIPS,
  POPULAR_READS,
} from '../../data/mockDiscoverContent';
import { TIPS } from '../../data/learnContent';
import HeroCard from './HeroCard';
import TrendingScroll from './TrendingScroll';
import IngredientSpotlightCard from './IngredientSpotlightCard';
import ConcernPills from './ConcernPills';
import ExpertCorner from './ExpertCorner';
import QuickTipsScroll from './QuickTipsScroll';
import PopularReads from './PopularReads';

export default function ForYouTab() {
  const router = useRouter();
  const department = useDiscoverStore((s) => s.department);
  const allProducts = useDiscoverStore((s) => s.allProducts);
  const setActiveConcern = useDiscoverStore((s) => s.setActiveConcern);
  const setActiveTab = useDiscoverStore((s) => s.setActiveTab);

  // ── Filtered data ──────────────────────────────────────────────────────
  const deptArticles = useMemo(
    () => FEATURED_ARTICLES.filter((a) => a.departments.includes(department)),
    [department],
  );

  const deptProducts = useMemo(
    () => allProducts.filter((p) => p.department === department),
    [allProducts, department],
  );

  const trending = useMemo(
    () =>
      [...deptProducts]
        .sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
        .slice(0, 10),
    [deptProducts],
  );

  const newProducts = useMemo(
    () =>
      [...deptProducts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    [deptProducts],
  );

  const spotlight = useMemo(
    () => INGREDIENT_SPOTLIGHTS.filter((s) => s.departments.includes(department))[0] ?? null,
    [department],
  );

  const spotlightProductCount = useMemo(() => {
    if (!spotlight) return 0;
    return deptProducts.filter((p) =>
      p.key_ingredients?.some((ing) =>
        ing.toLowerCase().includes(spotlight.ingredientName.toLowerCase()),
      ),
    ).length;
  }, [spotlight, deptProducts]);

  const concerns = useMemo(
    () => CONCERNS.filter((c) => c.departments.includes(department)),
    [department],
  );

  const expertArticles = useMemo(
    () => EXPERT_ARTICLES.filter((a) => a.departments.includes(department)),
    [department],
  );

  const quickTips = useMemo(() => {
    const deptTips = QUICK_TIPS.filter((t) => t.departments.includes(department));
    if (deptTips.length > 0) return deptTips;
    // Fallback: convert learn-content TIPS to DiscoverQuickTip shape
    return TIPS.slice(0, 6).map((t) => ({
      ...t,
      departments: [department] as Department[],
    }));
  }, [department]);

  const popularReads = useMemo(
    () => POPULAR_READS.filter((a) => a.departments.includes(department)),
    [department],
  );

  // ── Navigation handlers ────────────────────────────────────────────────
  const onProductPress = (id: number) => {
    router.push({ pathname: '/(screens)/product-detail', params: { productId: String(id) } } as any);
  };

  const onArticlePress = (id: string) => {
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
