import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface VerdictCardProps { type: 'SLAP' | 'CAP'; product: string; score: number; reason: string; }

export function VerdictCard({ type, product, score, reason }: VerdictCardProps) {
  const { colors } = useTheme();
  const isSlap = type === 'SLAP';
  return (
    <View style={[s.container, { backgroundColor: colors.tertiarySystemFill }]}>
      <View style={s.header}>
        <Text style={[s.product, { color: colors.label }]}>{product}</Text>
        <View style={[s.badge, { backgroundColor: isSlap ? colors.systemGreen : colors.systemGray }]}><Text style={s.badgeText}>{type}</Text></View>
      </View>
      <Text style={[s.score, { color: isSlap ? colors.label : colors.tertiaryLabel }]}>{score}</Text>
      <Text style={[s.reason, { color: colors.secondaryLabel }]}>{reason}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginTop: 10, borderRadius: 10, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  product: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, fontFamily: 'Outfit-Bold' },
  score: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  reason: { fontSize: 13, lineHeight: 18, fontFamily: 'Outfit' },
});
