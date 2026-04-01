import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { CompletionCircle } from '../ui/CompletionCircle';
import type { RoutineStep } from '../../types';

interface RoutineCarouselProps { steps: RoutineStep[]; period: 'AM' | 'PM'; onTogglePeriod: () => void; }

export function RoutineCarousel({ steps, period, onTogglePeriod }: RoutineCarouselProps) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.label }]}>Today's routine</Text>
        <Pressable onPress={() => router.push('/(screens)/routine' as any)}>
          <Text style={[s.viewAll, { color: colors.systemBlue }]}>View all →</Text>
        </Pressable>
      </View>
      <View style={[s.toggle, { backgroundColor: colors.tertiarySystemFill }]}>
        {(['AM', 'PM'] as const).map((p) => (
          <Pressable key={p} style={[s.toggleBtn, period === p && { backgroundColor: colors.systemBlue }]} onPress={() => period !== p && onTogglePeriod()}>
            <Text style={[s.toggleText, { color: period === p ? '#fff' : colors.secondaryLabel }]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      {steps.length > 0 ? (
        <FlatList
          data={steps} horizontal showsHorizontalScrollIndicator={false}
          snapToInterval={138} decelerationRate="fast"
          contentContainerStyle={s.listContent} keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
              <Text style={[s.stepLabel, { color: colors.tertiaryLabel }]}>STEP {item.step}</Text>
              <Text style={[s.category, { color: colors.label }]}>{item.category}</Text>
              <Text style={[s.brand, { color: colors.secondaryLabel }]}>{item.brand}</Text>
              <CompletionCircle completed={item.completed} />
            </View>
          )}
        />
      ) : (
        <View style={[s.emptyCard, { backgroundColor: colors.secondarySystemBackground }]}>
          <Text style={[s.emptyText, { color: colors.secondaryLabel }]}>No routine set up yet</Text>
          <Pressable onPress={() => router.push('/(screens)/routine' as any)}>
            <Text style={[s.emptyLink, { color: colors.systemBlue }]}>Create your routine →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  viewAll: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  toggle: { flexDirection: 'row', borderRadius: 8, padding: 2, alignSelf: 'flex-start', marginBottom: 14 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 18, borderRadius: 7 },
  toggleText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  listContent: { gap: 10, marginHorizontal: -20, paddingHorizontal: 20 },
  card: { width: 128, borderRadius: 12, padding: 14 },
  stepLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  category: { fontSize: 15, fontWeight: '600', marginTop: 8, fontFamily: 'Outfit-SemiBold' },
  brand: { fontSize: 13, marginTop: 3, marginBottom: 12, fontFamily: 'Outfit' },
  emptyCard: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Outfit' },
  emptyLink: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});
