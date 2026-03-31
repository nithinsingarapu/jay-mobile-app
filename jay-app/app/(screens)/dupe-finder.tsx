import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { mockDupeResults } from '../../constants/mockData';

function MatchBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(percent, { duration: 800, easing: Easing.out(Easing.quad) });
  }, []);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, style]} />
    </View>
  );
}

export default function DupeFinderScreen() {
  const insets = useSafeAreaInsets();
  const { original, dupes, totalSavings } = mockDupeResults;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title="Dupe Finder" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Original product */}
        <View style={styles.originalCard}>
          <Text style={styles.sectionLabel}>ORIGINAL PRODUCT</Text>
          <View style={styles.originalRow}>
            <View style={styles.productCircle}><Text style={styles.productCircleText}>SK</Text></View>
            <View style={styles.originalInfo}>
              <Text style={styles.productName}>{original.name}</Text>
              <Text style={styles.brandText}>{original.brand}</Text>
              <Text style={styles.ingredientText}>{original.keyIngredients.join(', ')}</Text>
              <Text style={styles.price}>₹{original.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { paddingHorizontal: 0, marginBottom: 12 }]}>BEST MATCHES</Text>

        {dupes.map((dupe) => (
          <View key={dupe.id} style={styles.dupeCard}>
            <View style={styles.dupeHeader}>
              <View style={[styles.rankBadge, dupe.rank === 'BEST MATCH' ? styles.rankBest : styles.rankOther]}>
                <Text style={[styles.rankText, dupe.rank !== 'BEST MATCH' && styles.rankTextDark]}>{dupe.rank}</Text>
              </View>
              <View style={[styles.pctBadge, dupe.rank === 'BEST MATCH' ? styles.pctBest : styles.pctOther]}>
                <Text style={[styles.pctText, dupe.rank !== 'BEST MATCH' && styles.pctTextDark]}>{dupe.matchPercent}%</Text>
              </View>
            </View>
            <Text style={styles.dupeName}>{dupe.name}</Text>
            <Text style={styles.dupeBrand}>{dupe.brand}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.dupePrice}>₹{dupe.price.toLocaleString()}</Text>
              <Text style={styles.savingsText}>Save ₹{(original.price - dupe.price).toLocaleString()}</Text>
            </View>
            <View style={styles.matchBarRow}>
              <Text style={styles.matchLabel}>Ingredient match</Text>
              <Text style={styles.matchPct}>{dupe.ingredientMatch}%</Text>
            </View>
            <MatchBar percent={dupe.ingredientMatch} />
            <View style={styles.dupeActions}>
              <Button label="Full Research" variant="outline" style={styles.dupeBtn} />
              <Button label="Add to Routine" variant="primary" style={styles.dupeBtn} />
            </View>
          </View>
        ))}

        {/* Savings hero */}
        <View style={styles.savingsHero}>
          <Text style={styles.savingsLabel}>TOTAL SAVINGS</Text>
          <Text style={styles.savingsAmount}>₹{totalSavings.toLocaleString()}</Text>
          <Text style={styles.savingsNote}>vs. buying the original</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Outfit-SemiBold' },
  originalCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 24 },
  originalRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  productCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  productCircleText: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  originalInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  brandText: { fontSize: 12, color: '#999', marginTop: 2, fontFamily: 'Outfit' },
  ingredientText: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 18, fontFamily: 'Outfit' },
  price: { fontSize: 16, fontWeight: '700', marginTop: 6, fontFamily: 'Outfit-Bold' },
  dupeCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 12 },
  dupeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rankBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  rankBest: { backgroundColor: '#000' },
  rankOther: { backgroundColor: '#F5F5F5' },
  rankText: { fontSize: 10, color: '#fff', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Outfit-Bold' },
  rankTextDark: { color: '#333' },
  pctBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  pctBest: { backgroundColor: '#000' },
  pctOther: { backgroundColor: '#F5F5F5' },
  pctText: { fontSize: 12, color: '#fff', fontWeight: '700', fontFamily: 'Outfit-Bold' },
  pctTextDark: { color: '#333' },
  dupeName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  dupeBrand: { fontSize: 12, color: '#999', marginTop: 2, fontFamily: 'Outfit' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 },
  dupePrice: { fontSize: 16, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  savingsText: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  matchBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchLabel: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },
  matchPct: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  barTrack: { height: 4, backgroundColor: '#F2F2F2', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: 4, backgroundColor: '#000', borderRadius: 2 },
  dupeActions: { flexDirection: 'row', gap: 8 },
  dupeBtn: { flex: 1 },
  savingsHero: { alignItems: 'center', paddingVertical: 32 },
  savingsLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold', marginBottom: 8 },
  savingsAmount: { fontSize: 40, fontWeight: '700', letterSpacing: -1.5, fontFamily: 'Outfit-Bold' },
  savingsNote: { fontSize: 13, color: '#999', marginTop: 6, fontFamily: 'Outfit' },
});
