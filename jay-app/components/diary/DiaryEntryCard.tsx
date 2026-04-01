import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import type { DiaryEntry } from '../../types';

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '😄'];

export function DiaryEntryCard({ entry }: { entry: DiaryEntry }) {
  const router = useRouter();
  const { colors } = useTheme();
  const date = new Date(entry.date + 'T00:00:00');

  return (
    <Pressable style={[s.card, { backgroundColor: colors.secondarySystemBackground }]} onPress={() => router.push(`/(screens)/diary/${entry.date}` as any)}>
      <View style={s.datePart}>
        <Text style={[s.day, { color: colors.label }]}>{date.getDate()}</Text>
        <Text style={[s.month, { color: colors.tertiaryLabel }]}>{date.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
      </View>
      <View style={s.content}>
        <View style={s.moodRow}>
          <Text style={s.emoji}>{MOOD_EMOJIS[entry.mood]}</Text>
          <Text style={[s.moodLabel, { color: colors.label }]}>{entry.moodLabel}</Text>
        </View>
        <View style={s.tags}>
          {entry.tags.map((tag) => (
            <View key={tag} style={[s.tag, { backgroundColor: colors.quaternarySystemFill }]}><Text style={[s.tagText, { color: colors.secondaryLabel }]}>{tag}</Text></View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 12, padding: 14, gap: 14, marginBottom: 10 },
  datePart: { alignItems: 'center', minWidth: 36 },
  day: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  month: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, fontFamily: 'Outfit-SemiBold' },
  content: { flex: 1 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  emoji: { fontSize: 20 },
  moodLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 13, fontFamily: 'Outfit-Medium' },
});
