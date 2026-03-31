import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CompletionCircle } from '../ui/CompletionCircle';
import type { RoutineStep } from '../../types';

interface RoutineCarouselProps {
  steps: RoutineStep[];
  period: 'AM' | 'PM';
  onTogglePeriod: () => void;
}

export function RoutineCarousel({ steps, period, onTogglePeriod }: RoutineCarouselProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's routine</Text>
        <Pressable onPress={() => router.push('/(screens)/routine' as any)}>
          <Text style={styles.viewAll}>View all →</Text>
        </Pressable>
      </View>
      <View style={styles.toggle}>
        {(['AM', 'PM'] as const).map((p) => (
          <Pressable key={p} style={[styles.toggleBtn, period === p && styles.toggleBtnActive]} onPress={() => period !== p && onTogglePeriod()}>
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={steps}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={138}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.stepLabel}>STEP {item.step}</Text>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.brand}>{item.brand}</Text>
            <CompletionCircle completed={item.completed} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, fontFamily: 'Outfit-SemiBold' },
  viewAll: { fontSize: 12, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  toggle: { flexDirection: 'row', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, padding: 2, alignSelf: 'flex-start', marginBottom: 14 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 18, borderRadius: 100 },
  toggleBtnActive: { backgroundColor: '#000' },
  toggleText: { fontSize: 12, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  toggleTextActive: { color: '#fff', fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  listContent: { gap: 10, marginHorizontal: -24, paddingHorizontal: 24 },
  card: { width: 128, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, backgroundColor: '#fff' },
  stepLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  category: { fontSize: 14, fontWeight: '600', marginTop: 8, fontFamily: 'Outfit-SemiBold' },
  brand: { fontSize: 12, color: '#999', marginTop: 3, marginBottom: 12, fontFamily: 'Outfit' },
});
