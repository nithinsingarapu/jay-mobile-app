import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

/**
 * Simple weekly adherence bar chart.
 * 7 bars representing Mon-Sun adherence percentages.
 */

interface WeeklyBarChartProps {
  /** 7 values, Mon→Sun, each 0-100 */
  data: number[];
  labels?: string[];
}

const DEFAULT_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_HEIGHT = 100;

export function WeeklyBarChart({ data, labels = DEFAULT_LABELS }: WeeklyBarChartProps) {
  const { colors, isDark } = useTheme();
  const today = new Date().getDay(); // 0=Sun
  // Convert to Mon=0 index: Mon=0, Tue=1, ..., Sun=6
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <View style={s.container}>
      <View style={s.barsRow}>
        {data.map((pct, i) => {
          const isToday = i === todayIdx;
          const barColor = isToday ? colors.systemBlue : colors.systemGreen;
          const height = Math.max(4, (pct / 100) * BAR_HEIGHT);

          return (
            <View key={i} style={s.barCol}>
              {/* Value label */}
              <Text style={[s.barValue, { color: pct > 0 ? colors.secondaryLabel : colors.tertiaryLabel }]}>
                {pct > 0 ? `${pct}%` : ''}
              </Text>

              {/* Bar track */}
              <View style={[s.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                <View
                  style={[
                    s.barFill,
                    {
                      height,
                      backgroundColor: barColor,
                      opacity: pct > 0 ? (isToday ? 1 : 0.7) : 0.15,
                    },
                  ]}
                />
              </View>

              {/* Day label */}
              <Text style={[
                s.dayLabel,
                {
                  color: isToday ? colors.systemBlue : colors.tertiaryLabel,
                  fontFamily: isToday ? 'Outfit-SemiBold' : 'Outfit',
                },
              ]}>
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 10,
    fontFamily: 'Outfit',
    height: 14,
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 11,
  },
});
