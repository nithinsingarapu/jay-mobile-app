import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VerdictCardProps {
  type: 'SLAP' | 'CAP';
  product: string;
  score: number;
  reason: string;
}

export function VerdictCard({ type, product, score, reason }: VerdictCardProps) {
  const isSlap = type === 'SLAP';
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.product}>{product}</Text>
        <View style={[styles.badge, isSlap ? styles.slapBadge : styles.capBadge]}>
          <Text style={styles.badgeText}>{type}</Text>
        </View>
      </View>
      <Text style={[styles.score, !isSlap && styles.scoreGrey]}>{score}</Text>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  product: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold', flex: 1, marginRight: 8 },
  badge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  slapBadge: { backgroundColor: '#000' },
  capBadge: { backgroundColor: '#888' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1, fontFamily: 'Outfit-Bold' },
  score: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  scoreGrey: { color: '#CCC' },
  reason: { fontSize: 12, color: '#666', lineHeight: 17, fontFamily: 'Outfit' },
});
