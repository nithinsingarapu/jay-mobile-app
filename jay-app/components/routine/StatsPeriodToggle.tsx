import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface StatsPeriodToggleProps {
  active: number;
  onChange: (days: number) => void;
}

const OPTIONS = [7, 30, 90] as const;

export function StatsPeriodToggle({ active, onChange }: StatsPeriodToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={s.row}>
      {OPTIONS.map((days) => {
        const isActive = active === days;
        return (
          <Pressable
            key={days}
            onPress={() => onChange(days)}
            style={[
              s.pill,
              {
                backgroundColor: isActive
                  ? colors.systemBlue
                  : colors.secondarySystemFill,
              },
            ]}
          >
            <Text
              style={[
                s.pillText,
                { color: isActive ? '#FFFFFF' : colors.label },
              ]}
            >
              {days} days
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    height: 28,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
});
