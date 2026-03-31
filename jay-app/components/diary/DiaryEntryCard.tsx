import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { DiaryEntry } from '../../types';

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '😄'];

interface DiaryEntryCardProps { entry: DiaryEntry; }

export function DiaryEntryCard({ entry }: DiaryEntryCardProps) {
  const router = useRouter();
  const date = new Date(entry.date + 'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(screens)/diary/${entry.date}` as any)}
      accessible
      accessibilityLabel={`Diary entry ${entry.date}, ${entry.moodLabel} mood`}
    >
      <View style={styles.datePart}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month.toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.moodRow}>
          <Text style={styles.emoji}>{MOOD_EMOJIS[entry.mood]}</Text>
          <Text style={styles.moodLabel}>{entry.moodLabel}</Text>
        </View>
        <View style={styles.tags}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, gap: 14, marginBottom: 10, backgroundColor: '#fff' },
  datePart: { alignItems: 'center', minWidth: 36 },
  day: { fontSize: 18, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  month: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  content: { flex: 1 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  emoji: { fontSize: 18 },
  moodLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 12, color: '#666', fontFamily: 'Outfit-Medium' },
});
