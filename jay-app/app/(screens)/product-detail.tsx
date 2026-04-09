import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import { productService } from '../../services/products';
import { getProductMock } from '../../data/mockProductDetail';
import { SPACE, RADIUS } from '../../constants/theme';

import ProductHero from '../../components/discover/ProductHero';
import CertificationTags from '../../components/discover/CertificationTags';
import ScoreBanner from '../../components/discover/ScoreBanner';
import ProductTabBar from '../../components/discover/ProductTabBar';
import OverviewTab from '../../components/discover/OverviewTab';
import IngredientsTab from '../../components/discover/IngredientsTab';
import PricesTab from '../../components/discover/PricesTab';
import ExpertsTab from '../../components/discover/ExpertsTab';
import AlternativesTab from '../../components/discover/AlternativesTab';

const TABS = ['Overview', 'Ingredients', 'Prices', 'Experts', 'Alternatives'];

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { colors } = useTheme();
  const store = useDiscoverStore();
  const [activeTab, setActiveTab] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (productId) {
      store.loadProduct(Number(productId));
    }
  }, [productId]);

  const product = store.selectedProduct;

  const handleEnrich = useCallback(async () => {
    if (!product || enriching) return;
    setEnriching(true);
    try {
      const result = await productService.enrichProduct(product.id);
      if (result?.status === 'enriched') {
        await store.loadProduct(product.id);
        Alert.alert('Updated', `Prices and ratings refreshed${result.source ? ' from ' + result.source : ''}`);
      } else if (result?.status === 'no_results') {
        Alert.alert('No results', 'Could not find this product on Google Shopping.');
      } else {
        Alert.alert('Error', result?.error || 'Something went wrong');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update product data');
    }
    setEnriching(false);
  }, [product, enriching]);

  const mock = useMemo(() => {
    if (!product) return null;
    return getProductMock(product.id, product.name);
  }, [product]);

  // Loading state
  if (store.isLoadingProduct) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.systemBackground }]}>
        <View style={{ height: insets.top }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.systemBlue} />
        </View>
      </View>
    );
  }

  // Not found
  if (!product || !mock) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.systemBackground }]}>
        <View style={{ height: insets.top }} />
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Svg width={12} height={21} viewBox="0 0 12 21" fill="none">
              <Path
                d="M10.5 1L1.5 10.5 10.5 20"
                stroke={colors.systemBlue}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.backLabel, { color: colors.systemBlue }]}>Discover</Text>
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.notFoundText, { color: colors.secondaryLabel }]}>
            Product not found
          </Text>
        </View>
      </View>
    );
  }

  const priceDisplay = product.price_inr ? `\u20B9${product.price_inr}` : '';
  const ratingScore = product.rating ?? (mock.jay_score * 0.5);
  const reviewCount = product.review_count ?? Math.floor(mock.jay_score * 120);
  const isEnriched = !!product.serp_enriched_at;

  return (
    <View style={[styles.screen, { backgroundColor: colors.systemBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Safe area spacer */}
        <View style={{ height: insets.top }} />

        {/* Nav bar */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Svg width={12} height={21} viewBox="0 0 12 21" fill="none">
              <Path
                d="M10.5 1L1.5 10.5 10.5 20"
                stroke={colors.systemBlue}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.backLabel, { color: colors.systemBlue }]}>Discover</Text>
          </Pressable>
          <View style={styles.navRight}>
            {/* Share */}
            <Pressable hitSlop={8} style={styles.navIcon}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"
                  stroke={colors.systemBlue}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M16 6l-4-4-4 4M12 2v13"
                  stroke={colors.systemBlue}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            {/* Bookmark */}
            <Pressable
              hitSlop={8}
              style={styles.navIcon}
              onPress={() => setBookmarked(!bookmarked)}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill={bookmarked ? colors.systemBlue : 'none'}>
                <Path
                  d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
                  stroke={colors.systemBlue}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* Product Hero */}
        <ProductHero product={product} />

        {/* Certification Tags */}
        <View style={styles.certRow}>
          <CertificationTags certifications={(() => {
            const tags: string[] = [];
            if (product.formulation?.fragrance_free) tags.push('Fragrance-Free');
            if (product.formulation?.paraben_free) tags.push('Paraben-Free');
            if (product.formulation?.alcohol_free) tags.push('Alcohol-Free');
            if (product.formulation?.silicone_free) tags.push('Silicone-Free');
            if (product.suitable_for?.pregnancy_safe) tags.push('Pregnancy-Safe');
            if (product.suitable_for?.fungal_acne_safe) tags.push('Fungal Acne Safe');
            if (tags.length === 0) tags.push(...mock.certifications.slice(0, 4));
            return tags;
          })()} />
        </View>

        {/* Brand + Name + Meta */}
        <View style={styles.identity}>
          <Text style={[styles.brandLabel, { color: colors.secondaryLabel }]}>
            {product.brand.toUpperCase()}
          </Text>

          <Text style={[styles.productName, { color: colors.label }]}>
            {product.name}
          </Text>

          {/* Meta row: price + size + rating + reviews */}
          <View style={styles.metaRow}>
            {priceDisplay ? (
              <Text style={[styles.price, { color: colors.label }]}>{priceDisplay}</Text>
            ) : null}
            {ratingScore != null && Number(ratingScore) > 0 && (
              <>
                <Text style={[styles.ratingStar, { color: colors.label }]}>
                  {'\u2605'} {Number(ratingScore).toFixed(1)}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.tertiaryLabel }]}>
                  {' '}({formatReviewCount(reviewCount)} reviews)
                </Text>
              </>
            )}
          </View>

          {/* Skin type targets */}
          <View style={styles.skinBadges}>
            {(product.suitable_for?.skin_types ?? mock.skin_type_targets).map((type) => (
              <View
                key={type}
                style={[styles.skinBadge, { backgroundColor: colors.systemGreen + '18' }]}
              >
                <Text style={[styles.skinBadgeText, { color: colors.systemGreen }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} skin
                </Text>
              </View>
            ))}
          </View>

          {/* Concerns */}
          {product.concerns && product.concerns.length > 0 && (
            <View style={styles.skinBadges}>
              {product.concerns.slice(0, 5).map((concern) => (
                <View
                  key={concern}
                  style={[styles.skinBadge, { backgroundColor: colors.systemBlue + '15' }]}
                >
                  <Text style={[styles.skinBadgeText, { color: colors.systemBlue }]}>
                    {concern.charAt(0).toUpperCase() + concern.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Update prices button */}
        <View style={styles.enrichRow}>
          <Pressable
            onPress={handleEnrich}
            disabled={enriching}
            style={[styles.enrichBtn, { backgroundColor: colors.tertiarySystemFill }]}
          >
            {enriching ? (
              <ActivityIndicator size="small" color={colors.systemBlue} />
            ) : (
              <>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round">
                  <Path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </Svg>
                <Text style={[styles.enrichBtnText, { color: colors.systemBlue }]}>
                  {isEnriched ? 'Refresh prices & ratings' : 'Get prices & ratings'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Full Research button */}
        <View style={styles.enrichRow}>
          <Pressable
            onPress={() => router.push({
              pathname: '/(screens)/research',
              params: { productId: String(product.id), productName: product.name },
            } as any)}
            style={[styles.enrichBtn, { backgroundColor: colors.systemIndigo + '15' }]}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.systemIndigo} strokeWidth={2} strokeLinecap="round">
              <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </Svg>
            <Text style={[styles.enrichBtnText, { color: colors.systemIndigo }]}>Full Research Report</Text>
          </Pressable>
        </View>

        {/* Score Banner */}
        <View style={styles.scoreBannerWrap}>
          <ScoreBanner
            jayScore={mock.jay_score}
            safety={mock.formula_safety}
            matchPercent={mock.match_percentage}
          />
        </View>

        {/* Tab Bar */}
        <ProductTabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 0 && <OverviewTab product={product} mock={mock} />}
          {activeTab === 1 && <IngredientsTab product={product} mock={mock} />}
          {activeTab === 2 && <PricesTab mock={mock} />}
          {activeTab === 3 && <ExpertsTab mock={mock} />}
          {activeTab === 4 && <AlternativesTab productId={product.id} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // Nav bar (matches HTML exactly)
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    height: 44,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backLabel: {
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navIcon: {
    padding: 4,
  },

  // Certifications
  certRow: {
    marginTop: 14,
  },

  // Identity
  identity: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  brandLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.35,
    marginTop: 4,
    lineHeight: 29,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  ratingStar: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  reviewCount: {
    fontSize: 11,
    fontFamily: 'Outfit',
  },
  skinBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  skinBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skinBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },

  // Enrich button
  enrichRow: {
    paddingHorizontal: SPACE.lg,
    marginTop: SPACE.md,
    alignItems: 'flex-start',
  },
  enrichBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  enrichBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },

  // Score banner
  scoreBannerWrap: {
    marginTop: 12,
    marginBottom: SPACE.lg,
  },

  // Tab content
  tabContent: {},
});
