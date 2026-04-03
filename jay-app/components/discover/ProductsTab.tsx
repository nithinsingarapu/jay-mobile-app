import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import FilterChips from './FilterChips';
import SmartCollectionScroll from './SmartCollectionScroll';
import BrandTierScroll from './BrandTierScroll';
import BrandScroll from './BrandScroll';
import ProductGrid from './ProductGrid';
import SectionHeader from './SectionHeader';
import { SMART_COLLECTIONS } from '../../data/mockDiscoverContent';
import type { SmartCollectionFilter } from '../../types/discover';
import type { ProductOut } from '../../types/product';

// ── Smart-collection filter logic ──────────────────────────────────────

function applySmartFilter(
  products: ProductOut[],
  filter: SmartCollectionFilter,
): ProductOut[] {
  let result = products;

  if (filter.maxPrice != null)
    result = result.filter(
      (p) => p.price_inr != null && p.price_inr <= filter.maxPrice!,
    );

  if (filter.minRating != null)
    result = result.filter(
      (p) => p.rating != null && p.rating >= filter.minRating!,
    );

  if (filter.brandTiers?.length)
    result = result.filter(
      (p) =>
        p.brand_tier != null && filter.brandTiers!.includes(p.brand_tier),
    );

  if (filter.formulationFlags) {
    const f = filter.formulationFlags;
    result = result.filter((p) => {
      if (!p.formulation) return false;
      if (f.fragrance_free && !p.formulation.fragrance_free) return false;
      if (f.alcohol_free && !p.formulation.alcohol_free) return false;
      if (f.silicone_free && !p.formulation.silicone_free) return false;
      if (f.paraben_free && !p.formulation.paraben_free) return false;
      return true;
    });
  }

  if (filter.pregnancySafe)
    result = result.filter(
      (p) => p.suitable_for?.pregnancy_safe === true,
    );

  if (filter.concerns?.length)
    result = result.filter((p) =>
      p.concerns?.some((c) => filter.concerns!.includes(c)),
    );

  return result;
}

// ── Component ──────────────────────────────────────────────────────────

export default function ProductsTab() {
  const { colors } = useTheme();
  const router = useRouter();

  const allProducts = useDiscoverStore((s) => s.allProducts);
  const department = useDiscoverStore((s) => s.department);
  const activeCategory = useDiscoverStore((s) => s.activeCategory);
  const activeBrand = useDiscoverStore((s) => s.activeBrand);
  const activeTier = useDiscoverStore((s) => s.activeTier);
  const activeSmartCollection = useDiscoverStore((s) => s.activeSmartCollection);
  const activeConcern = useDiscoverStore((s) => s.activeConcern);
  const isLoadingProducts = useDiscoverStore((s) => s.isLoadingProducts);

  const setCategory = useDiscoverStore((s) => s.setCategory);
  const setBrand = useDiscoverStore((s) => s.setBrand);
  const setTier = useDiscoverStore((s) => s.setTier);
  const setSmartCollection = useDiscoverStore((s) => s.setSmartCollection);
  const clearFilters = useDiscoverStore((s) => s.clearFilters);

  // Department-level products
  const deptProducts = useMemo(
    () => allProducts.filter((p) => p.department === department),
    [allProducts, department],
  );

  // Smart collections available for this department
  const deptCollections = useMemo(
    () =>
      SMART_COLLECTIONS.filter((c) => c.departments.includes(department)),
    [department],
  );

  // Brands sorted by frequency in the department
  const deptBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of deptProducts) {
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([brand]) => brand);
  }, [deptProducts]);

  // Full filter pipeline
  const filteredProducts = useMemo(() => {
    let result: ProductOut[];

    // Smart collection filter
    if (activeSmartCollection) {
      const collection = SMART_COLLECTIONS.find(
        (c) => c.id === activeSmartCollection,
      );
      result = collection
        ? applySmartFilter(deptProducts, collection.filter)
        : deptProducts;
    } else {
      result = deptProducts;
    }

    // Category filter
    if (activeCategory)
      result = result.filter((p) => p.normalized_category === activeCategory);

    // Tier filter
    if (activeTier)
      result = result.filter((p) => p.brand_tier === activeTier);

    // Brand filter
    if (activeBrand)
      result = result.filter((p) => p.brand === activeBrand);

    // Concern filter
    if (activeConcern)
      result = result.filter((p) =>
        p.concerns?.includes(activeConcern),
      );

    // Sort: enriched (has rating) first, then by review_count descending
    return [...result].sort((a, b) => {
      const aEnriched = a.rating != null ? 0 : 1;
      const bEnriched = b.rating != null ? 0 : 1;
      if (aEnriched !== bEnriched) return aEnriched - bEnriched;
      return (b.review_count ?? 0) - (a.review_count ?? 0);
    });
  }, [
    deptProducts,
    activeSmartCollection,
    activeCategory,
    activeTier,
    activeBrand,
    activeConcern,
  ]);

  const hasActiveFilters =
    activeCategory != null ||
    activeTier != null ||
    activeBrand != null ||
    activeSmartCollection != null ||
    activeConcern != null;

  const handleProductPress = (id: number) => {
    router.push({
      pathname: '/(screens)/product-detail',
      params: { productId: String(id) },
    });
  };

  const handleBrandSelect = (brand: string) => {
    setBrand(activeBrand === brand ? null : brand);
  };

  return (
    <View>
      {/* Category chips */}
      <FilterChips
        department={department}
        active={activeCategory}
        onSelect={setCategory}
      />

      {/* Smart collections */}
      <SmartCollectionScroll
        collections={deptCollections}
        active={activeSmartCollection}
        onSelect={setSmartCollection}
      />

      {/* Brand tiers */}
      <SectionHeader title="Shop by Type" />
      <BrandTierScroll active={activeTier} onSelect={setTier} />

      {/* Popular brands */}
      <SectionHeader title="Popular Brands" />
      <BrandScroll brands={deptBrands} onSelect={handleBrandSelect} />

      {/* Filter status row */}
      {hasActiveFilters && (
        <View style={styles.filterRow}>
          <Text style={[styles.countText, { color: colors.secondaryLabel }]}>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
          </Text>
          <Pressable hitSlop={8} onPress={clearFilters}>
            <Text style={[styles.clearText, { color: colors.systemBlue }]}>
              Clear filters
            </Text>
          </Pressable>
        </View>
      )}

      {/* Products header */}
      <SectionHeader
        title={
          hasActiveFilters
            ? `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
            : 'All Products'
        }
      />

      {/* Product grid */}
      <ProductGrid
        products={filteredProducts}
        onProductPress={handleProductPress}
        loading={isLoadingProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  clearText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
});
