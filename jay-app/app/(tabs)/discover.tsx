import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import { SPACE, RADIUS } from '../../constants/theme';
import type { ProductOut } from '../../types/product';
import SearchBar from '../../components/discover/SearchBar';
import ProductGrid from '../../components/discover/ProductGrid';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Department = 'skincare' | 'haircare' | 'bodycare';

const DEPARTMENTS: { key: Department; label: string }[] = [
  { key: 'skincare', label: 'Skincare' },
  { key: 'haircare', label: 'Haircare' },
  { key: 'bodycare', label: 'Bodycare' },
];

const SUBCATEGORIES: Record<Department, { key: string; label: string; emoji: string }[]> = {
  skincare: [
    { key: 'cleansers', label: 'Cleansers', emoji: '\uD83E\uDDF4' },
    { key: 'serums', label: 'Serums', emoji: '\uD83E\uDDEA' },
    { key: 'moisturizers', label: 'Moisturizers', emoji: '\uD83D\uDCA7' },
    { key: 'sunscreens', label: 'Sunscreens', emoji: '\u2600\uFE0F' },
    { key: 'toners', label: 'Toners', emoji: '\uD83C\uDF3F' },
    { key: 'exfoliants', label: 'Exfoliants', emoji: '\u2728' },
    { key: 'masks', label: 'Masks', emoji: '\uD83E\uDDD6' },
    { key: 'eye_care', label: 'Eye Care', emoji: '\uD83D\uDC41' },
    { key: 'lip_care', label: 'Lip Care', emoji: '\uD83D\uDC8B' },
  ],
  haircare: [
    { key: 'shampoos', label: 'Shampoos', emoji: '\uD83E\uDDF4' },
    { key: 'conditioners', label: 'Conditioners', emoji: '\uD83E\uDDF4' },
    { key: 'hair_oils', label: 'Hair Oils', emoji: '\uD83C\uDF3B' },
    { key: 'hair_masks', label: 'Hair Masks', emoji: '\uD83E\uDDD6' },
    { key: 'hair_serums', label: 'Hair Serums', emoji: '\uD83E\uDDEA' },
    { key: 'scalp_care', label: 'Scalp Care', emoji: '\uD83E\uDE7A' },
  ],
  bodycare: [
    { key: 'body_lotions', label: 'Body Lotions', emoji: '\uD83E\uDDF4' },
    { key: 'body_wash', label: 'Body Wash', emoji: '\uD83D\uDEBF' },
    { key: 'body_oils', label: 'Body Oils', emoji: '\uD83C\uDF3B' },
    { key: 'hand_care', label: 'Hand Care', emoji: '\u270B' },
    { key: 'foot_care', label: 'Foot Care', emoji: '\uD83E\uDDB6' },
  ],
};

const TIER_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'derm_grade', label: 'Dermatology' },
  { key: 'pharma', label: 'Medical' },
  { key: 'dtc_science', label: 'Science DTC' },
  { key: 'consumer', label: 'Consumer' },
  { key: 'premium_hair', label: 'Premium Hair' },
];

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'a_z', label: 'Name: A-Z' },
];

// ---------------------------------------------------------------------------
// FilterModal
// ---------------------------------------------------------------------------

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  sort: string;
  tier: string;
  brand: string | null;
  brands: string[];
  onApply: (s: string, t: string, b: string | null) => void;
}

function FilterModal({ visible, onClose, sort, tier, brand, brands, onApply }: FilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [localSort, setLocalSort] = useState(sort);
  const [localTier, setLocalTier] = useState(tier);
  const [localBrand, setLocalBrand] = useState(brand);

  // Sync when opening
  useEffect(() => {
    if (visible) {
      setLocalSort(sort);
      setLocalTier(tier);
      setLocalBrand(brand);
    }
  }, [visible, sort, tier, brand]);

  const reset = () => {
    setLocalSort('popular');
    setLocalTier('all');
    setLocalBrand(null);
  };

  const apply = () => {
    onApply(localSort, localTier, localBrand);
    onClose();
  };

  const pill = (active: boolean) => ({
    backgroundColor: active ? colors.systemBlue : colors.tertiarySystemFill,
  });

  const pillText = (active: boolean) => ({
    color: active ? '#FFFFFF' : colors.label,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[fs.root, { backgroundColor: colors.systemBackground, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={fs.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[fs.headerBtn, { color: colors.systemBlue }]}>Cancel</Text>
          </Pressable>
          <Text style={[fs.headerTitle, { color: colors.label }]}>Filters</Text>
          <Pressable onPress={reset} hitSlop={12}>
            <Text style={[fs.headerBtn, { color: colors.systemRed }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={fs.body} showsVerticalScrollIndicator={false}>
          {/* Sort By */}
          <Text style={[fs.sectionTitle, { color: colors.secondaryLabel }]}>Sort By</Text>
          <View style={fs.chips}>
            {SORT_OPTIONS.map((o) => (
              <Pressable
                key={o.key}
                style={[fs.chip, pill(localSort === o.key)]}
                onPress={() => setLocalSort(o.key)}
              >
                <Text style={[fs.chipText, pillText(localSort === o.key)]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Brand Type */}
          <Text style={[fs.sectionTitle, { color: colors.secondaryLabel, marginTop: SPACE.xxl }]}>
            Brand Type
          </Text>
          <View style={fs.chips}>
            {TIER_OPTIONS.map((o) => (
              <Pressable
                key={o.key}
                style={[fs.chip, pill(localTier === o.key)]}
                onPress={() => setLocalTier(o.key)}
              >
                <Text style={[fs.chipText, pillText(localTier === o.key)]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Brand */}
          {brands.length > 0 && (
            <>
              <Text style={[fs.sectionTitle, { color: colors.secondaryLabel, marginTop: SPACE.xxl }]}>
                Brand
              </Text>
              <View style={fs.chips}>
                <Pressable
                  style={[fs.chip, pill(localBrand === null)]}
                  onPress={() => setLocalBrand(null)}
                >
                  <Text style={[fs.chipText, pillText(localBrand === null)]}>All Brands</Text>
                </Pressable>
                {brands.map((b) => (
                  <Pressable
                    key={b}
                    style={[fs.chip, pill(localBrand === b)]}
                    onPress={() => setLocalBrand(b)}
                  >
                    <Text style={[fs.chipText, pillText(localBrand === b)]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Apply button */}
        <View style={[fs.footer, { paddingBottom: insets.bottom + SPACE.lg }]}>
          <Pressable
            style={[fs.applyBtn, { backgroundColor: colors.systemBlue }]}
            onPress={apply}
          >
            <Text style={fs.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const fs = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
  headerBtn: { fontSize: 16, fontFamily: 'Outfit' },
  headerTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  body: { padding: SPACE.xl, paddingBottom: 120 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACE.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  chip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.full,
  },
  chipText: { fontSize: 14, fontFamily: 'Outfit' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120,120,128,0.2)',
  },
  applyBtn: {
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { products, isLoadingProducts, loadProducts, brands, loadBrands } = useDiscoverStore();

  // Local UI state
  const [department, setDepartment] = useState<Department>('skincare');
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [sort, setSort] = useState('popular');
  const [tier, setTier] = useState('all');
  const [brand, setBrand] = useState<string | null>(null);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  // Reset subcategory when department changes
  const handleDepartmentChange = useCallback((d: Department) => {
    setDepartment(d);
    setSubcategory(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Client-side filter pipeline
  // ---------------------------------------------------------------------------

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.department === department);

    if (subcategory) {
      list = list.filter((p) => p.normalized_category === subcategory);
    }

    if (tier !== 'all') {
      list = list.filter((p) => p.brand_tier === tier);
    }

    if (brand) {
      list = list.filter((p) => p.brand === brand);
    }

    // Sort
    switch (sort) {
      case 'rating':
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_low':
        list = [...list].sort((a, b) => (a.price_inr ?? 9999) - (b.price_inr ?? 9999));
        break;
      case 'price_high':
        list = [...list].sort((a, b) => (b.price_inr ?? 0) - (a.price_inr ?? 0));
        break;
      case 'a_z':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // popular — by review_count desc
        list = [...list].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
        break;
    }

    return list;
  }, [products, department, subcategory, sort, tier, brand]);

  // Subcategory counts
  const subcatCounts = useMemo(() => {
    const deptProducts = products.filter((p) => p.department === department);
    const counts: Record<string, number> = {};
    deptProducts.forEach((p) => {
      if (p.normalized_category) {
        counts[p.normalized_category] = (counts[p.normalized_category] || 0) + 1;
      }
    });
    return counts;
  }, [products, department]);

  // Active filter pills
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (tier !== 'all') {
    const t = TIER_OPTIONS.find((o) => o.key === tier);
    activeFilters.push({ label: t?.label ?? tier, clear: () => setTier('all') });
  }
  if (brand) {
    activeFilters.push({ label: brand, clear: () => setBrand(null) });
  }

  const handleApplyFilters = useCallback((s: string, t: string, b: string | null) => {
    setSort(s);
    setTier(t);
    setBrand(b);
  }, []);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sort';

  const subcats = SUBCATEGORIES[department];

  return (
    <View style={[styles.root, { backgroundColor: colors.systemBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + SPACE.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.systemBlue} />
        }
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.label }]}>Discover</Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar onPress={() => router.push('/(screens)/search' as any)} />
        </View>

        {/* Department tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptRow}
        >
          {DEPARTMENTS.map((d) => {
            const active = department === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => handleDepartmentChange(d.key)}
                style={[
                  styles.deptTab,
                  {
                    backgroundColor: active ? colors.label : colors.tertiarySystemFill,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.deptTabText,
                    { color: active ? colors.systemBackground : colors.secondaryLabel },
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Subcategory chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcatRow}
        >
          <Pressable
            onPress={() => setSubcategory(null)}
            style={[
              styles.subcatChip,
              {
                backgroundColor: subcategory === null ? colors.systemBlue : colors.tertiarySystemFill,
              },
            ]}
          >
            <Text
              style={[
                styles.subcatText,
                { color: subcategory === null ? '#FFFFFF' : colors.label },
              ]}
            >
              All
            </Text>
          </Pressable>
          {subcats.map((sc) => {
            const active = subcategory === sc.key;
            const count = subcatCounts[sc.key] ?? 0;
            return (
              <Pressable
                key={sc.key}
                onPress={() => setSubcategory(active ? null : sc.key)}
                style={[
                  styles.subcatChip,
                  { backgroundColor: active ? colors.systemBlue : colors.tertiarySystemFill },
                ]}
              >
                <Text
                  style={[styles.subcatText, { color: active ? '#FFFFFF' : colors.label }]}
                >
                  {sc.emoji} {sc.label}
                  {count > 0 ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Toolbar: count + active filters + filter btn + sort pill */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={[styles.countText, { color: colors.secondaryLabel }]}>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </Text>

            {/* Active filter pills */}
            {activeFilters.map((f, i) => (
              <Pressable
                key={i}
                onPress={f.clear}
                style={[styles.activePill, { backgroundColor: colors.systemBlue + '22' }]}
              >
                <Text style={[styles.activePillText, { color: colors.systemBlue }]}>
                  {f.label}
                </Text>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6l12 12"
                    stroke={colors.systemBlue}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            ))}
          </View>

          <View style={styles.toolbarRight}>
            {/* Filter button */}
            <Pressable
              onPress={() => setFilterModalOpen(true)}
              style={[styles.filterBtn, { backgroundColor: colors.tertiarySystemFill }]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6h18M7 12h10M10 18h4"
                  stroke={colors.label}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={[styles.filterBtnText, { color: colors.label }]}>Filter</Text>
              {activeFilters.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.systemBlue }]}>
                  <Text style={styles.badgeText}>{activeFilters.length}</Text>
                </View>
              )}
            </Pressable>

            {/* Sort pill */}
            <Pressable
              onPress={() => setSortModalOpen(true)}
              style={[styles.sortPill, { backgroundColor: colors.tertiarySystemFill }]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6l5 5 5-5M3 18l5-5 5 5M17 4v16M17 4l-3 3M17 4l3 3"
                  stroke={colors.label}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.sortPillText, { color: colors.label }]}>{sortLabel}</Text>
            </Pressable>
          </View>
        </View>

        {/* Product grid */}
        <ProductGrid
          products={filteredProducts}
          onProductPress={(id) => router.push(`/(screens)/product/${id}` as any)}
          loading={isLoadingProducts}
        />
      </ScrollView>

      {/* Sort bottom sheet modal */}
      <Modal visible={sortModalOpen} transparent animationType="slide">
        <Pressable style={styles.sortOverlay} onPress={() => setSortModalOpen(false)}>
          <View />
        </Pressable>
        <View
          style={[
            styles.sortSheet,
            {
              backgroundColor: colors.secondarySystemBackground,
              paddingBottom: insets.bottom + SPACE.lg,
            },
          ]}
        >
          <View style={styles.sortHandle} />
          <Text style={[styles.sortSheetTitle, { color: colors.label }]}>Sort By</Text>
          {SORT_OPTIONS.map((o) => {
            const active = sort === o.key;
            return (
              <Pressable
                key={o.key}
                style={styles.sortRow}
                onPress={() => {
                  setSort(o.key);
                  setSortModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sortRowText,
                    { color: active ? colors.systemBlue : colors.label },
                  ]}
                >
                  {o.label}
                </Text>
                {active && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12l5 5L20 7"
                      stroke={colors.systemBlue}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </Pressable>
            );
          })}
        </View>
      </Modal>

      {/* Filter full-screen modal */}
      <FilterModal
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        sort={sort}
        tier={tier}
        brand={brand}
        brands={brands}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
    fontFamily: 'Outfit-Bold',
    paddingHorizontal: SPACE.xl,
    marginBottom: SPACE.lg,
  },
  searchWrap: {
    paddingHorizontal: SPACE.xl,
    marginBottom: SPACE.lg,
  },

  // Department tabs
  deptRow: {
    paddingHorizontal: SPACE.xl,
    gap: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  deptTab: {
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADIUS.full,
  },
  deptTabText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },

  // Subcategory chips
  subcatRow: {
    paddingHorizontal: SPACE.xl,
    gap: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  subcatChip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  subcatText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    marginBottom: SPACE.lg,
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  activePillText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },

  // Sort modal
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sortSheet: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
  },
  sortHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginBottom: SPACE.lg,
  },
  sortSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
    marginBottom: SPACE.lg,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE.md + 2,
  },
  sortRowText: {
    fontSize: 16,
    fontFamily: 'Outfit',
  },
});
