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
        {/* Back button */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={colors.systemBlue}
                strokeWidth={2}
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
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={colors.systemBlue}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.backLabel, { color: colors.systemBlue }]}>Discover</Text>
          </Pressable>
          <View style={styles.navRight}>
            <Pressable hitSlop={8} style={styles.navIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  stroke={colors.systemBlue}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            <Pressable
              hitSlop={8}
              style={styles.navIcon}
              onPress={() => setBookmarked(!bookmarked)}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill={bookmarked ? colors.systemBlue : 'none'}>
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

        {/* Certification Tags — from real formulation data */}
        <View style={styles.certRow}>
          <CertificationTags certifications={(() => {
            const tags: string[] = [];
            if (product.formulation?.fragrance_free) tags.push('Fragrance-Free');
            if (product.formulation?.paraben_free) tags.push('Paraben-Free');
            if (product.formulation?.alcohol_free) tags.push('Alcohol-Free');
            if (product.formulation?.silicone_free) tags.push('Silicone-Free');
            if (product.suitable_for?.pregnancy_safe) tags.push('Pregnancy-Safe');
            if (product.suitable_for?.fungal_acne_safe) tags.push('Fungal Acne Safe');
            if (tags.length === 0) tags.push(...mock.certifications.slice(0, 3));
            return tags;
          })()} />
        </View>

        {/* Identity section */}
        <View style={styles.identity}>
          <Text style={[styles.brandLabel, { color: colors.secondaryLabel }]}>
            {product.brand.toUpperCase()}
          </Text>

          <Text style={[styles.productName, { color: colors.label }]}>
            {product.name}
          </Text>

          {/* Description */}
          {product.description && (
            <Text numberOfLines={3} style={[styles.description, { color: colors.secondaryLabel }]}>
              {product.description}
            </Text>
          )}

          {/* Meta row: price + rating + reviews + source */}
          <View style={styles.metaRow}>
            {priceDisplay ? (
              <Text style={[styles.price, { color: colors.label }]}>{priceDisplay}</Text>
            ) : null}
            {priceDisplay ? (
              <Text style={[styles.metaDot, { color: colors.tertiaryLabel }]}> · </Text>
            ) : null}
            {ratingScore != null && Number(ratingScore) > 0 && (
              <>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.systemYellow}>
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </Svg>
                <Text style={[styles.rating, { color: colors.label }]}> {ratingScore}</Text>
                <Text style={[styles.reviewCount, { color: colors.secondaryLabel }]}>
                  {' '}({reviewCount})
                </Text>
              </>
            )}
            {product.price_source && (
              <Text style={[styles.sourceLabel, { color: colors.tertiaryLabel }]}>
                {' '}· {product.price_source}
              </Text>
            )}
          </View>

          {/* Skin type targets — from real suitable_for data */}
          <View style={styles.skinBadges}>
            {(product.suitable_for?.skin_types ?? mock.skin_type_targets).map((type) => (
              <View
                key={type}
                style={[styles.skinBadge, { backgroundColor: colors.systemGreen + '18' }]}
              >
                <Text style={[styles.skinBadgeText, { color: colors.systemGreen }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
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
          {isEnriched && product.price_source && (
            <Text style={[styles.enrichSource, { color: colors.tertiaryLabel }]}>
              via {product.price_source}
            </Text>
          )}
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
          {activeTab === 4 && <AlternativesTab mock={mock} />}
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

  // Nav bar
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
    gap: 4,
  },
  backLabel: {
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
  },
  navIcon: {
    padding: 4,
  },

  // Certifications
  certRow: {
    marginTop: SPACE.md,
  },

  // Identity
  identity: {
    paddingHorizontal: SPACE.lg,
    marginTop: SPACE.lg,
    gap: SPACE.xs,
  },
  brandLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    letterSpacing: 0.35,
    marginTop: SPACE.xxs,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 20,
    marginTop: SPACE.xs,
  },
  sourceLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACE.sm,
  },
  price: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 18,
    fontFamily: 'Outfit',
  },
  rating: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Outfit',
  },
  skinBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    marginTop: SPACE.md,
  },
  skinBadge: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.xs,
  },
  skinBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
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
  enrichSource: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 4,
  },

  // Score banner
  scoreBannerWrap: {
    marginTop: SPACE.xl,
    marginBottom: SPACE.lg,
  },

  // Tab content
  tabContent: {
    // Tab components handle their own horizontal padding
  },
});
