import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface CalendarGridProps {
  year: number;
  month: number;
  dots: Record<string, 'good' | 'okay' | 'bad'>;
}

const DOT_COLORS = { good: '#333', okay: '#999', bad: '#CCC' };
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarGrid({ year, month, dots }: CalendarGridProps) {
  const router = useRouter();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getDateStr = (d: number) => {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${m}-${dd}`;
  };

  return (
    <View>
      <View style={styles.dayRow}>
        {DAYS.map((d) => (
          <View key={d} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={styles.cell} />;
          const dateStr = getDateStr(d);
          const dot = dots[dateStr];
          const todayDay = isToday(d);
          return (
            <Pressable
              key={dateStr}
              style={styles.cell}
              onPress={() => router.push(`/(screens)/diary/${dateStr}` as any)}
              accessible
              accessibilityLabel={`${dateStr}${dot ? `, ${dot} skin day` : ''}`}
            >
              <View style={[styles.dateCircle, todayDay && styles.todayCircle]}>
                <Text style={[styles.dateText, todayDay && styles.todayText]}>{d}</Text>
              </View>
              {dot && <View style={[styles.dot, { backgroundColor: DOT_COLORS[dot] }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 11, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, minHeight: 44 },
  dateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: '#000' },
  dateText: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit-Medium', color: '#000' },
  todayText: { color: '#fff', fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
