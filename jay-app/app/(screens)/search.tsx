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
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import { SPACE, RADIUS } from '../../constants/theme';
import type { ProductOut } from '../../types/product';

// Trending products shown when no query typed
const TRENDING: { name: string; category: string }[] = [
  { name: 'Minimalist SPF 50', category: 'Sunscreen' },
  { name: 'Cetaphil Gentle Cleanser', category: 'Cleanser' },
  { name: 'The Derma Co Retinol', category: 'Treatment' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const searchResults = useDiscoverStore((s) => s.searchResults);
  const isSearching = useDiscoverStore((s) => s.isSearching);
  const recentSearches = useDiscoverStore((s) => s.recentSearches);
  const searchProducts = useDiscoverStore((s) => s.searchProducts);
  const clearSearchResults = useDiscoverStore((s) => s.clearSearchResults);
  const addRecentSearch = useDiscoverStore((s) => s.addRecentSearch);
  const removeRecentSearch = useDiscoverStore((s) => s.removeRecentSearch);
  const initRecentSearches = useDiscoverStore((s) => s.initRecentSearches);

  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initRecentSearches();
    clearSearchResults();
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      clearSearchResults();
      return;
    }

    timerRef.current = setTimeout(() => {
      searchProducts(query.trim());
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleResultPress = useCallback(
    (product: ProductOut) => {
      addRecentSearch(query.trim() || product.name);
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
      searchProducts(term);
    },
    [],
  );

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
      searchProducts(term);
    },
    [],
  );

  const hasQuery = query.trim().length > 0;
  const results = searchResults;
  const noResults = hasQuery && !isSearching && results.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.systemBackground }]}>
      <View style={{ height: insets.top }} />

      {/* Header: search input + cancel */}
      <View style={styles.header}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.tertiarySystemFill },
          ]}
        >
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={11}
              cy={11}
              r={8}
              stroke={colors.tertiaryLabel}
              strokeWidth={1.5}
            />
            <Path
              d="M21 21l-4.35-4.35"
              stroke={colors.tertiaryLabel}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.label }]}
            placeholder="Search..."
            placeholderTextColor={colors.tertiaryLabel}
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
        {hasQuery && isSearching && (
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

        {/* Live search results */}
        {hasQuery && !isSearching && results.length > 0 && (
          <View
            style={[
              styles.groupedTable,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            {results.map((product, i) => (
              <Pressable
                key={product.id}
                onPress={() => handleResultPress(product)}
                style={[
                  styles.resultRow,
                  i < results.length - 1 && {
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

        {/* Idle state — recent searches + trending */}
        {!hasQuery && (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
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
                  {recentSearches.map((term, i) => (
                    <Pressable
                      key={term}
                      onPress={() => handleRecentPress(term)}
                      style={[
                        styles.recentRow,
                        i < recentSearches.length - 1 && {
                          borderBottomWidth: 0.33,
                          borderBottomColor: colors.separator,
                        },
                      ]}
                    >
                      {/* Clock icon */}
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Circle
                          cx={12}
                          cy={12}
                          r={10}
                          stroke={colors.tertiaryLabel}
                          strokeWidth={1.5}
                        />
                        <Polyline
                          points="12 6 12 12 16 14"
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
                      {/* Remove button */}
                      <Pressable
                        onPress={() => removeRecentSearch(term)}
                        hitSlop={8}
                        style={styles.removeBtn}
                      >
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M18 6L6 18M6 6l12 12"
                            stroke={colors.tertiaryLabel}
                            strokeWidth={1.5}
                            strokeLinecap="round"
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
                {TRENDING.map((item, i) => (
                  <Pressable
                    key={item.name}
                    onPress={() => handleTrendingPress(item.name)}
                    style={[
                      styles.trendingRow,
                      i < TRENDING.length - 1 && {
                        borderBottomWidth: 0.33,
                        borderBottomColor: colors.separator,
                      },
                    ]}
                  >
                    {/* Trend icon (orange) */}
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Polyline
                        points="23 6 13.5 15.5 8.5 10.5 1 18"
                        stroke={colors.systemOrange}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Polyline
                        points="17 6 23 6 23 12"
                        stroke={colors.systemOrange}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text
                      style={[styles.trendingName, { color: colors.label }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.trendingCat, { color: colors.tertiaryLabel }]}>
                      {item.category}
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
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    gap: 7,
    height: 36,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
    height: 36,
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
    minHeight: 44,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
  resultMeta: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },

  // Idle sections
  idleSection: {
    marginBottom: SPACE.lg,
  },
  idleSectionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    paddingHorizontal: 32,
    paddingTop: 16,
    marginBottom: SPACE.sm,
  },

  // Recent
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    minHeight: 44,
    gap: SPACE.md,
  },
  recentTerm: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
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
    minHeight: 44,
    gap: SPACE.md,
  },
  trendingName: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
  trendingCat: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
});
