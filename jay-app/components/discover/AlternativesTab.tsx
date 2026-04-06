import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { productService } from '../../services/products';

interface Props {
  productId: number;
}

function MatchBar({ percent, color }: { percent: number; color: string }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(percent, { duration: 700, easing: Easing.out(Easing.quad) }); }, [percent]);
  const s = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, s]} />
    </View>
  );
}

export default function AlternativesTab({ productId }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dupes, setDupes] = useState<any[]>([]);
  const [originalPrice, setOriginalPrice] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const result = await productService.getDupes(productId, 5);
        setDupes(result.dupes);
        setOriginalPrice(result.original?.price ?? 0);
      } catch (e) {
        console.error('[Alternatives]', e);
      }
      setLoading(false);
    })();
  }, [productId]);

  const onPress = (id: number) => {
    router.push({ pathname: '/(screens)/product-detail', params: { productId: String(id) } } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.systemBlue} />
        <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>Finding alternatives...</Text>
      </View>
    );
  }

  if (dupes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.label }]}>No alternatives found</Text>
        <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
          This product has a unique ingredient profile.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.contextText, { color: colors.secondaryLabel }]}>
        Products with similar ingredients, ranked by match percentage.
      </Text>

      {dupes.map((dupe) => {
        const isBest = dupe.rank === 'BEST MATCH';
        const savings = originalPrice - dupe.price;
        return (
          <Pressable
            key={dupe.id}
            onPress={() => onPress(dupe.id)}
            style={[styles.card, { backgroundColor: colors.secondarySystemBackground }]}
          >
            <View style={styles.headerRow}>
              <View style={[styles.badge, { backgroundColor: isBest ? colors.systemGreen : colors.tertiarySystemFill }]}>
                <Text style={[styles.badgeText, { color: isBest ? '#fff' : colors.secondaryLabel }]}>{dupe.rank}</Text>
              </View>
              <Text style={[styles.pctText, { color: isBest ? colors.systemGreen : colors.secondaryLabel }]}>{dupe.match_percent}%</Text>
            </View>

            <View style={styles.productRow}>
              {dupe.image_url ? (
                <Image source={{ uri: dupe.image_url }} style={styles.thumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbnail, { backgroundColor: colors.tertiarySystemFill, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Bold', color: colors.secondaryLabel }}>{dupe.name.slice(0, 2).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={[styles.name, { color: colors.label }]}>{dupe.name}</Text>
                <Text style={[styles.brand, { color: colors.secondaryLabel }]}>{dupe.brand}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.label }]}>
                {dupe.price > 0 ? `₹${dupe.price.toLocaleString()}` : 'Price N/A'}
              </Text>
              {savings > 0 && (
                <Text style={[styles.savings, { color: colors.systemGreen }]}>Save ₹{savings.toLocaleString()}</Text>
              )}
              {dupe.rating && (
                <Text style={[styles.rating, { color: colors.systemOrange }]}>★ {dupe.rating.toFixed(1)}</Text>
              )}
            </View>

            {dupe.shared_ingredients?.length > 0 && (
              <Text numberOfLines={1} style={[styles.shared, { color: colors.tertiaryLabel }]}>
                Shared: {dupe.shared_ingredients.slice(0, 4).join(', ')}
              </Text>
            )}

            <View style={styles.matchRow}>
              <Text style={[styles.matchLabel, { color: colors.secondaryLabel }]}>Ingredient match</Text>
              <Text style={[styles.matchPct, { color: colors.label }]}>{dupe.ingredient_match}%</Text>
            </View>
            <MatchBar percent={dupe.ingredient_match} color={isBest ? colors.systemGreen : colors.systemBlue} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACE.md, paddingVertical: SPACE.lg, paddingHorizontal: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  loadingText: { fontSize: 13, fontFamily: 'Outfit' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 6 },
  emptyBody: { fontSize: 13, fontFamily: 'Outfit', textAlign: 'center' },
  contextText: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 19 },
  card: { borderRadius: RADIUS.md, padding: 14, gap: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 100, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText: { fontSize: 9, fontFamily: 'Outfit-Bold', letterSpacing: 0.6, textTransform: 'uppercase' },
  pctText: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  productRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  thumbnail: { width: 44, height: 44, borderRadius: 10 },
  name: { fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  brand: { fontSize: 12, fontFamily: 'Outfit', marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  savings: { fontSize: 12, fontFamily: 'Outfit-SemiBold' },
  rating: { fontSize: 12, fontFamily: 'Outfit-SemiBold' },
  shared: { fontSize: 10, fontFamily: 'Outfit' },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between' },
  matchLabel: { fontSize: 11, fontFamily: 'Outfit' },
  matchPct: { fontSize: 11, fontFamily: 'Outfit-SemiBold' },
  barTrack: { height: 3, backgroundColor: 'rgba(120,120,128,0.12)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
});
