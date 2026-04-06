import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { productService } from '../../services/products';
import { useTheme } from '../../lib/theme';

function MatchBar({ percent, color }: { percent: number; color: string }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(percent, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [percent]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

function ProductImage({ uri, name, size = 48 }: { uri?: string | null; name: string; size?: number }) {
  const { colors } = useTheme();
  if (uri && uri.startsWith('http')) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 4 }} resizeMode="cover" />;
  }
  return (
    <View style={[styles.productCircle, { width: size, height: size, borderRadius: size / 4, backgroundColor: colors.tertiarySystemFill }]}>
      <Text style={[styles.productCircleText, { color: colors.secondaryLabel }]}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

export default function DupeFinderScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = Number(params.productId);

  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<any>(null);
  const [dupes, setDupes] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const result = await productService.getDupes(productId);
        setOriginal(result.original);
        setDupes(result.dupes);
        setTotalSavings(result.total_savings);
      } catch (e) {
        console.error('[DupeFinder]', e);
      }
      setLoading(false);
    })();
  }, [productId]);

  const onProductPress = (id: number) => {
    router.push({ pathname: '/(screens)/product-detail', params: { productId: String(id) } } as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="Dupe Finder" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.systemBlue} />
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>Finding dupes...</Text>
        </View>
      </View>
    );
  }

  if (!original) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="Dupe Finder" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>No product found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Dupe Finder" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Original product */}
        <Pressable
          onPress={() => onProductPress(original.id)}
          style={[styles.originalCard, { borderColor: colors.separator, backgroundColor: colors.secondarySystemBackground }]}
        >
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>ORIGINAL PRODUCT</Text>
          <View style={styles.originalRow}>
            <ProductImage uri={original.image_url} name={original.name} size={56} />
            <View style={styles.originalInfo}>
              <Text style={[styles.productName, { color: colors.label }]}>{original.name}</Text>
              <Text style={[styles.brandText, { color: colors.secondaryLabel }]}>{original.brand}</Text>
              {original.key_ingredients?.length > 0 && (
                <Text numberOfLines={2} style={[styles.ingredientText, { color: colors.tertiaryLabel }]}>
                  {original.key_ingredients.slice(0, 5).join(' · ')}
                </Text>
              )}
              <View style={styles.priceRatingRow}>
                <Text style={[styles.price, { color: colors.label }]}>
                  {original.price > 0 ? `₹${original.price.toLocaleString()}` : 'Price N/A'}
                </Text>
                {original.rating && (
                  <Text style={[styles.ratingText, { color: colors.systemOrange }]}>
                    ★ {original.rating.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Pressable>

        {dupes.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel, paddingHorizontal: 0, marginBottom: 12 }]}>
              {dupes.length} DUPE{dupes.length > 1 ? 'S' : ''} FOUND
            </Text>

            {dupes.map((dupe) => {
              const isBest = dupe.rank === 'BEST MATCH';
              const savings = original.price - dupe.price;
              return (
                <Pressable
                  key={dupe.id}
                  onPress={() => onProductPress(dupe.id)}
                  style={[styles.dupeCard, { borderColor: colors.separator, backgroundColor: colors.secondarySystemBackground }]}
                >
                  <View style={styles.dupeHeader}>
                    <View style={[styles.rankBadge, { backgroundColor: isBest ? colors.systemGreen : colors.tertiarySystemFill }]}>
                      <Text style={[styles.rankText, { color: isBest ? '#fff' : colors.secondaryLabel }]}>{dupe.rank}</Text>
                    </View>
                    <View style={[styles.pctBadge, { backgroundColor: isBest ? colors.systemGreen : colors.tertiarySystemFill }]}>
                      <Text style={[styles.pctText, { color: isBest ? '#fff' : colors.secondaryLabel }]}>{dupe.match_percent}%</Text>
                    </View>
                  </View>

                  <View style={styles.dupeProductRow}>
                    <ProductImage uri={dupe.image_url} name={dupe.name} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dupeName, { color: colors.label }]}>{dupe.name}</Text>
                      <Text style={[styles.dupeBrand, { color: colors.secondaryLabel }]}>{dupe.brand}</Text>
                      {dupe.rating && (
                        <Text style={[styles.dupeRating, { color: colors.systemOrange }]}>★ {dupe.rating.toFixed(1)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={[styles.dupePrice, { color: colors.label }]}>
                      {dupe.price > 0 ? `₹${dupe.price.toLocaleString()}` : 'Price N/A'}
                    </Text>
                    {savings > 0 && (
                      <Text style={[styles.savingsText, { color: colors.systemGreen }]}>
                        Save ₹{savings.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  {/* Shared ingredients */}
                  {dupe.shared_ingredients?.length > 0 && (
                    <Text numberOfLines={1} style={[styles.sharedText, { color: colors.tertiaryLabel }]}>
                      Shared: {dupe.shared_ingredients.slice(0, 4).join(', ')}
                    </Text>
                  )}

                  <View style={styles.matchBarRow}>
                    <Text style={[styles.matchLabel, { color: colors.secondaryLabel }]}>Ingredient match</Text>
                    <Text style={[styles.matchPct, { color: colors.label }]}>{dupe.ingredient_match}%</Text>
                  </View>
                  <MatchBar percent={dupe.ingredient_match} color={isBest ? colors.systemGreen : colors.systemBlue} />

                  <View style={styles.dupeActions}>
                    <Button label="View Product" variant="outline" style={styles.dupeBtn} onPress={() => onProductPress(dupe.id)} />
                  </View>
                </Pressable>
              );
            })}

            {/* Savings hero */}
            {totalSavings > 0 && (
              <View style={[styles.savingsHero, { backgroundColor: isDark ? '#0a2010' : '#E8F5E9', borderRadius: 16 }]}>
                <Text style={[styles.savingsLabel, { color: colors.secondaryLabel }]}>POTENTIAL SAVINGS</Text>
                <Text style={[styles.savingsAmount, { color: colors.systemGreen }]}>₹{totalSavings.toLocaleString()}</Text>
                <Text style={[styles.savingsNote, { color: colors.secondaryLabel }]}>vs. buying the original</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.label }]}>No dupes found</Text>
            <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
              This product has a unique ingredient profile. Try another product!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Outfit' },
  sectionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Outfit-SemiBold' },
  originalCard: { borderWidth: 0.5, borderRadius: 14, padding: 14, marginBottom: 24 },
  originalRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  productCircle: { alignItems: 'center', justifyContent: 'center' },
  productCircleText: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  originalInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  brandText: { fontSize: 12, marginTop: 2, fontFamily: 'Outfit' },
  ingredientText: { fontSize: 11, marginTop: 4, lineHeight: 16, fontFamily: 'Outfit' },
  priceRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  price: { fontSize: 16, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  ratingText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  dupeCard: { borderWidth: 0.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  dupeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rankBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  rankText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Outfit-Bold' },
  pctBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  pctText: { fontSize: 12, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  dupeProductRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  dupeName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  dupeBrand: { fontSize: 12, marginTop: 2, fontFamily: 'Outfit' },
  dupeRating: { fontSize: 12, fontWeight: '600', marginTop: 2, fontFamily: 'Outfit-SemiBold' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dupePrice: { fontSize: 16, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  savingsText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  sharedText: { fontSize: 11, marginBottom: 8, fontFamily: 'Outfit' },
  matchBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchLabel: { fontSize: 12, fontFamily: 'Outfit' },
  matchPct: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  barTrack: { height: 4, backgroundColor: 'rgba(120,120,128,0.12)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: 4, borderRadius: 2 },
  dupeActions: { flexDirection: 'row', gap: 8 },
  dupeBtn: { flex: 1 },
  savingsHero: { alignItems: 'center', paddingVertical: 28, marginTop: 12 },
  savingsLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold', marginBottom: 6 },
  savingsAmount: { fontSize: 36, fontWeight: '700', letterSpacing: -1, fontFamily: 'Outfit-Bold' },
  savingsNote: { fontSize: 13, marginTop: 4, fontFamily: 'Outfit' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginBottom: 8 },
  emptyBody: { fontSize: 14, fontFamily: 'Outfit', textAlign: 'center', lineHeight: 20 },
});
