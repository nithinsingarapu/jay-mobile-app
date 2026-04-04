import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

/**
 * GitHub-style contribution heatmap for routine completion.
 * Shows last 15 weeks (≈3.5 months) of data.
 * Green intensity = completion percentage for that day.
 */

interface HeatmapProps {
  /** Map of 'YYYY-MM-DD' → completion percentage (0-100) */
  data: Record<string, number>;
  /** Number of weeks to show */
  weeks?: number;
}

const DAYS = ['', 'M', '', 'W', '', 'F', ''];
const CELL_SIZE = 14;
const GAP = 3;

function getIntensityColor(pct: number, green: string, isDark: boolean): string {
  if (pct <= 0) return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  if (pct < 25) return green + '25';
  if (pct < 50) return green + '45';
  if (pct < 75) return green + '70';
  return green + 'CC';
}

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ContributionHeatmap({ data, weeks = 15 }: HeatmapProps) {
  const { colors, isDark } = useTheme();

  // Build grid: columns = weeks, rows = 7 days (Sun-Sat)
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) - todayDay + 1);

  const columns: { key: string; pct: number }[][] = [];
  const current = new Date(startDate);

  // Build week columns
  for (let w = 0; w <= weeks; w++) {
    const col: { key: string; pct: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = getDateKey(current);
      const isFuture = current > today;
      col.push({ key, pct: isFuture ? -1 : (data[key] ?? 0) });
      current.setDate(current.getDate() + 1);
    }
    columns.push(col);
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  columns.forEach((col, ci) => {
    const firstDate = new Date(col[0].key + 'T00:00:00');
    const m = firstDate.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: firstDate.toLocaleString('default', { month: 'short' }),
        col: ci,
      });
      lastMonth = m;
    }
  });

  return (
    <View style={s.container}>
      {/* Month labels */}
      <View style={[s.monthRow, { paddingLeft: 20 }]}>
        {monthLabels.map((ml) => (
          <Text
            key={`${ml.label}-${ml.col}`}
            style={[
              s.monthLabel,
              { color: colors.tertiaryLabel, left: ml.col * (CELL_SIZE + GAP) },
            ]}
          >
            {ml.label}
          </Text>
        ))}
      </View>

      <View style={s.body}>
        {/* Day labels */}
        <View style={s.dayLabels}>
          {DAYS.map((d, i) => (
            <View key={i} style={{ height: CELL_SIZE + GAP, justifyContent: 'center' }}>
              <Text style={[s.dayLabel, { color: colors.tertiaryLabel }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {columns.map((col, ci) => (
            <View key={ci} style={s.column}>
              {col.map((cell) => (
                <View
                  key={cell.key}
                  style={[
                    s.cell,
                    {
                      backgroundColor:
                        cell.pct < 0
                          ? 'transparent'
                          : getIntensityColor(cell.pct, colors.systemGreen, isDark),
                      borderRadius: 3,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <Text style={[s.legendText, { color: colors.tertiaryLabel }]}>Less</Text>
        {[0, 25, 50, 75, 100].map((pct) => (
          <View
            key={pct}
            style={[
              s.legendCell,
              { backgroundColor: getIntensityColor(pct, colors.systemGreen, isDark) },
            ]}
          />
        ))}
        <Text style={[s.legendText, { color: colors.tertiaryLabel }]}>More</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  monthRow: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 4,
    position: 'relative',
  },
  monthLabel: {
    fontSize: 10,
    fontFamily: 'Outfit',
    position: 'absolute',
  },
  body: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 18,
    marginRight: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Outfit',
  },
  grid: {
    flexDirection: 'row',
    gap: GAP,
  },
  column: {
    gap: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 8,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Outfit',
    marginHorizontal: 2,
  },
});
