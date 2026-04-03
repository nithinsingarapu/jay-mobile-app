import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscoverStore } from '../../stores/discoverStore';
import {
  GUIDE_ARTICLES,
  INGREDIENT_DICTIONARY,
  CONCERNS,
  MYTH_BUSTERS,
  EXPERT_ARTICLES,
} from '../../data/mockDiscoverContent';
import Guides101 from './Guides101';
import IngredientDictionary from './IngredientDictionary';
import ByConcernGrid from './ByConcernGrid';
import MythBustersScroll from './MythBustersScroll';
import FromTheExperts from './FromTheExperts';

export default function LearnTab() {
  const router = useRouter();
  const department = useDiscoverStore((s) => s.department);
  const allProducts = useDiscoverStore((s) => s.allProducts);
  const setActiveConcern = useDiscoverStore((s) => s.setActiveConcern);
  const setActiveTab = useDiscoverStore((s) => s.setActiveTab);

  // Filter content by current department
  const guides = useMemo(
    () => GUIDE_ARTICLES.filter((i) => i.departments.includes(department)),
    [department],
  );
  const ingredients = useMemo(
    () => INGREDIENT_DICTIONARY.filter((i) => i.departments.includes(department)),
    [department],
  );
  const concerns = useMemo(
    () => CONCERNS.filter((i) => i.departments.includes(department)),
    [department],
  );
  const myths = useMemo(
    () => MYTH_BUSTERS.filter((i) => i.departments.includes(department)),
    [department],
  );
  const expertArticles = useMemo(
    () => EXPERT_ARTICLES.filter((i) => i.departments.includes(department)),
    [department],
  );

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
    router.push({
      pathname: '/(screens)/article',
      params: { articleId: id, articleType: 'discover' },
    } as any);
  };

  const handleIngredientPress = (id: string) => {
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
