import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';

interface CalendarGridProps { year: number; month: number; dots: Record<string, 'good' | 'okay' | 'bad'>; }
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarGrid({ year, month, dots }: CalendarGridProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const getDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const DOT_COLORS = { good: colors.systemGreen, okay: colors.systemOrange, bad: colors.systemRed };

  return (
    <View>
      <View style={s.dayRow}>
        {DAYS.map((d) => <View key={d} style={s.dayCell}><Text style={[s.dayLabel, { color: colors.tertiaryLabel }]}>{d}</Text></View>)}
      </View>
      <View style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={s.cell} />;
          const dateStr = getDateStr(d);
          const dot = dots[dateStr];
          const td = isToday(d);
          return (
            <Pressable key={dateStr} style={s.cell} onPress={() => router.push(`/(screens)/diary/${dateStr}` as any)}>
              <View style={[s.dateCircle, td && { backgroundColor: colors.systemBlue }]}>
                <Text style={[s.dateText, { color: td ? '#fff' : colors.label }]}>{d}</Text>
              </View>
              {dot && <View style={[s.dot, { backgroundColor: DOT_COLORS[dot] }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%` as any, alignItems: 'center', paddingVertical: 4, minHeight: 44 },
  dateCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
});
