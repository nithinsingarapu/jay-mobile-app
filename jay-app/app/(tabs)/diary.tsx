import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { CalendarGrid } from '../../components/diary/CalendarGrid';
import { DiaryEntryCard } from '../../components/diary/DiaryEntryCard';
import { useDiaryStore } from '../../stores/diaryStore';
import { mockCalendarDots } from '../../constants/mockData';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useDiaryStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Skin Diary</Text>
        <Pressable style={styles.addBtn} accessible accessibilityLabel="Add diary entry">
          <Text style={styles.addBtnText}>+ Add entry</Text>
        </Pressable>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth} style={styles.navBtn} accessible accessibilityLabel="Previous month">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.navBtn} accessible accessibilityLabel="Next month">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
            <Polyline points="9 18 15 12 9 6" />
          </Svg>
        </Pressable>
      </View>

      {/* Calendar */}
      <View style={styles.calendarWrapper}>
        <CalendarGrid year={year} month={month} dots={mockCalendarDots} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[{ label: 'Good', color: '#333' }, { label: 'Okay', color: '#999' }, { label: 'Bad', color: '#CCC' }].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent entries */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {entries.slice(0, 5).map(entry => (
          <DiaryEntryCard key={entry.id} entry={entry} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Outfit-SemiBold' },
  addBtn: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  addBtnText: { fontSize: 12, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  calendarWrapper: { paddingHorizontal: 24, marginBottom: 16 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 28 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 12, color: '#666', fontFamily: 'Outfit' },
  recentSection: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
});
