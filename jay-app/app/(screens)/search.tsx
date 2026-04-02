import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import { SPACE, RADIUS } from '../../constants/theme';
import type { ProductOut } from '../../types/product';

const TRENDING = [
  'Niacinamide serum',
  'Sunscreen SPF 50',
  'CeraVe moisturizer',
  'Vitamin C serum',
  'Salicylic acid cleanser',
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const store = useDiscoverStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.initRecentSearches();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) return;

    timerRef.current = setTimeout(() => {
      store.searchProducts(query.trim());
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleResultPress = useCallback(
    (product: ProductOut) => {
      store.addRecentSearch(query.trim() || product.name);
      router.push({
        pathname: '/(screens)/product-detail',
        params: { productId: String(product.id) },
      } as any);
    },
    [query, router],
  );

  const handleTrendingPress = useCallback(
    (term: string) => {
      setQuery(term);
      store.searchProducts(term);
    },
    [],
  );

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
      store.searchProducts(term);
    },
    [],
  );

  const hasQuery = query.trim().length > 0;
  const noResults =
    hasQuery && !store.isLoadingProducts && store.products.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.systemBackground }]}>
      {/* Safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.tertiarySystemFill },
          ]}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke={colors.tertiaryLabel}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.label }]}
            placeholder="Products, ingredients, brands..."
            placeholderTextColor={colors.placeholderText}
            autoFocus
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.cancel, { color: colors.systemBlue }]}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Loading */}
        {hasQuery && store.isLoadingProducts && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.systemBlue} />
          </View>
        )}

        {/* No results */}
        {noResults && (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
              No products found
            </Text>
          </View>
        )}

        {/* Live results */}
        {hasQuery && !store.isLoadingProducts && store.products.length > 0 && (
          <View
            style={[
              styles.groupedTable,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            {store.products.map((product, i) => (
              <Pressable
                key={product.id}
                onPress={() => handleResultPress(product)}
                style={[
                  styles.resultRow,
                  i < store.products.length - 1 && {
                    borderBottomWidth: 0.33,
                    borderBottomColor: colors.separator,
                  },
                ]}
              >
                <View style={styles.resultInfo}>
                  <Text
                    style={[styles.resultName, { color: colors.label }]}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[styles.resultMeta, { color: colors.secondaryLabel }]}
                    numberOfLines={1}
                  >
                    {product.brand} · {product.category}
                    {product.price_inr ? ` · \u20B9${product.price_inr}` : ''}
                  </Text>
                </View>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke={colors.tertiaryLabel}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            ))}
          </View>
        )}

        {/* Idle state — recent + trending */}
        {!hasQuery && (
          <>
            {/* Recent Searches */}
            {store.recentSearches.length > 0 && (
              <View style={styles.idleSection}>
                <Text style={[styles.idleSectionTitle, { color: colors.secondaryLabel }]}>
                  Recent searches
                </Text>
                <View
                  style={[
                    styles.groupedTable,
                    { backgroundColor: colors.secondarySystemBackground },
                  ]}
                >
                  {store.recentSearches.map((term, i) => (
                    <Pressable
                      key={term}
                      onPress={() => handleRecentPress(term)}
                      style={[
                        styles.recentRow,
                        i < store.recentSearches.length - 1 && {
                          borderBottomWidth: 0.33,
                          borderBottomColor: colors.separator,
                        },
                      ]}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke={colors.tertiaryLabel}
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text
                        style={[styles.recentTerm, { color: colors.label }]}
                        numberOfLines={1}
                      >
                        {term}
                      </Text>
                      <Pressable
                        onPress={() => store.removeRecentSearch(term)}
                        hitSlop={8}
                        style={styles.removeBtn}
                      >
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M18 6L6 18M6 6l12 12"
                            stroke={colors.tertiaryLabel}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Trending */}
            <View style={styles.idleSection}>
              <Text style={[styles.idleSectionTitle, { color: colors.secondaryLabel }]}>
                Trending
              </Text>
              <View
                style={[
                  styles.groupedTable,
                  { backgroundColor: colors.secondarySystemBackground },
                ]}
              >
                {TRENDING.map((term, i) => (
                  <Pressable
                    key={term}
                    onPress={() => handleTrendingPress(term)}
                    style={[
                      styles.trendingRow,
                      i < TRENDING.length - 1 && {
                        borderBottomWidth: 0.33,
                        borderBottomColor: colors.separator,
                      },
                    ]}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        stroke={colors.systemOrange}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text
                      style={[styles.trendingTerm, { color: colors.label }]}
                      numberOfLines={1}
                    >
                      {term}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    gap: SPACE.md,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md,
    gap: SPACE.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit',
    height: 40,
    padding: 0,
  },
  cancel: {
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
  body: {
    flex: 1,
  },
  center: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },

  // Grouped table
  groupedTable: {
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACE.lg,
    overflow: 'hidden',
  },

  // Results
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  resultMeta: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },

  // Idle sections
  idleSection: {
    marginBottom: SPACE.xxl,
  },
  idleSectionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACE.lg + SPACE.lg,
    marginBottom: SPACE.sm,
  },

  // Recent
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.md,
  },
  recentTerm: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  removeBtn: {
    padding: 4,
  },

  // Trending
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.md,
  },
  trendingTerm: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit',
  },
});
