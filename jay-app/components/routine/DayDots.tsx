import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface DayDotData {
  day: string;
  status: 'complete' | 'partial' | 'today' | 'none';
}

interface DayDotsProps {
  data: DayDotData[];
}

export function DayDots({ data }: DayDotsProps) {
  const { colors } = useTheme();

  const getDotStyle = (status: DayDotData['status']) => {
    switch (status) {
      case 'complete':
        return { backgroundColor: colors.systemGreen };
      case 'partial':
        return { backgroundColor: colors.systemGray };
      case 'today':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.systemBlue,
        };
      case 'none':
      default:
        return { backgroundColor: colors.systemGray4 };
    }
  };

  return (
    <View style={s.row}>
      {data.map((item, index) => (
        <View key={index} style={s.column}>
          <View style={[s.dot, getDotStyle(item.status)]} />
          <Text style={[s.dayLabel, { color: colors.tertiaryLabel }]}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
  },
});
