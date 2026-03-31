import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../../components/ui/TopBar';
import { Button } from '../../../components/ui/Button';
import { useDiaryStore } from '../../../stores/diaryStore';

const MOODS = [
  { value: 1, emoji: '😞', label: 'Bad' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const TAGS = ['Hydrated', 'Glowing', 'Oily', 'Dry', 'Breakout', 'Clear', 'Smooth', 'Dull', 'Stressed'];

export default function DiaryEntryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const { getEntryByDate, addEntry } = useDiaryStore();
  const existing = getEntryByDate(date);

  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    addEntry({ id: Date.now().toString(), date, mood, moodLabel: MOODS.find(m => m.value === mood)?.label ?? '', tags, notes });
  };

  const displayDate = date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title={displayDate} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Mood selector */}
        <Text style={styles.label}>HOW WAS YOUR SKIN TODAY?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m.value}
              style={[styles.moodItem, mood === m.value && styles.moodItemActive]}
              onPress={() => setMood(m.value)}
              accessible
              accessibilityLabel={m.label}
              accessibilityState={{ selected: mood === m.value }}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tags */}
        <Text style={[styles.label, { marginTop: 24 }]}>SKIN TAGS</Text>
        <View style={styles.tagsRow}>
          {TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.tag, tags.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={[styles.label, { marginTop: 24 }]}>NOTES</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How did your skin feel today? Any observations..."
          placeholderTextColor="#CCC"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          accessibilityLabel="Diary notes"
        />

        <Button label="Save Entry" onPress={handleSave} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  label: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: { alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, borderWidth: 0.5, borderColor: '#E5E5E5', flex: 1, marginHorizontal: 3 },
  moodItemActive: { backgroundColor: '#000', borderColor: '#000' },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 10, color: '#999', fontFamily: 'Outfit-Medium' },
  moodLabelActive: { color: '#fff' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  tagActive: { backgroundColor: '#000', borderColor: '#000' },
  tagText: { fontSize: 13, fontFamily: 'Outfit-Medium' },
  tagTextActive: { color: '#fff' },
  notesInput: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Outfit', color: '#000', minHeight: 100, textAlignVertical: 'top' },
});
