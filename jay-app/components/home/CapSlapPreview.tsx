import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { CapSlapVerdict } from '../../types';

interface CapSlapPreviewProps { verdicts: CapSlapVerdict[]; }

export function CapSlapPreview({ verdicts }: CapSlapPreviewProps) {
  const router = useRouter();
  const [first, second] = verdicts;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cap or slap</Text>
        <Text style={styles.seeAll}>See all →</Text>
      </View>
      <View style={styles.row}>
        {[first, second].filter(Boolean).map((v) => (
          <Pressable key={v.id} style={styles.card} onPress={() => router.push('/(screens)/cap-or-slap' as any)}>
            <View style={styles.imageArea}>
              <Text style={styles.emoji}>🧴</Text>
              <View style={[styles.badge, v.verdict === 'SLAP' ? styles.slapBadge : styles.capBadge]}>
                <Text style={styles.badgeText}>{v.verdict}</Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.productName}>{v.product}</Text>
              <Text style={styles.reason} numberOfLines={2}>{v.reason}</Text>
              <Text style={[styles.score, v.verdict === 'CAP' && styles.scoreGrey]}>{v.score}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  seeAll: { fontSize: 12, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, overflow: 'hidden' },
  imageArea: { height: 88, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji: { fontSize: 30, opacity: 0.1 },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  slapBadge: { backgroundColor: '#000' },
  capBadge: { backgroundColor: '#888' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Outfit-Bold' },
  info: { padding: 12 },
  productName: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  reason: { fontSize: 11, color: '#999', marginTop: 3, lineHeight: 15, fontFamily: 'Outfit' },
  score: { fontSize: 20, fontWeight: '700', marginTop: 8, fontFamily: 'Outfit-Bold' },
  scoreGrey: { color: '#CCC' },
});
