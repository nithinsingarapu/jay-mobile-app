import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import type { CapSlapVerdict } from '../../types';

interface CapSlapPreviewProps { verdicts: CapSlapVerdict[]; }

export function CapSlapPreview({ verdicts }: CapSlapPreviewProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [first, second] = verdicts;
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.label }]}>Cap or slap</Text>
        <Text style={[s.seeAll, { color: colors.systemBlue }]}>See all →</Text>
      </View>
      <View style={s.row}>
        {[first, second].filter(Boolean).map((v) => (
          <Pressable key={v.id} style={[s.card, { backgroundColor: colors.secondarySystemBackground }]} onPress={() => router.push('/(screens)/cap-or-slap' as any)}>
            <View style={[s.imageArea, { backgroundColor: colors.tertiarySystemFill }]}>
              <Text style={s.emoji}>🧴</Text>
              <View style={[s.badge, { backgroundColor: v.verdict === 'SLAP' ? colors.systemGreen : colors.systemGray }]}>
                <Text style={s.badgeText}>{v.verdict}</Text>
              </View>
            </View>
            <View style={s.info}>
              <Text style={[s.productName, { color: colors.label }]}>{v.product}</Text>
              <Text style={[s.reason, { color: colors.secondaryLabel }]} numberOfLines={2}>{v.reason}</Text>
              <Text style={[s.score, { color: v.verdict === 'CAP' ? colors.tertiaryLabel : colors.label }]}>{v.score}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  seeAll: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  imageArea: { height: 88, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji: { fontSize: 30, opacity: 0.15 },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Outfit-Bold' },
  info: { padding: 12 },
  productName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  reason: { fontSize: 13, marginTop: 4, lineHeight: 18, fontFamily: 'Outfit' },
  score: { fontSize: 22, fontWeight: '700', marginTop: 8, fontFamily: 'Outfit-Bold' },
});
