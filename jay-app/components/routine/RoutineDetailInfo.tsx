import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { RoutineOut } from '../../types/routine';

interface RoutineDetailInfoProps {
  routine: RoutineOut;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RoutineDetailInfo({ routine }: RoutineDetailInfoProps) {
  const { colors } = useTheme();

  const rows = [
    { label: 'Type', value: routine.routine_type.charAt(0).toUpperCase() + routine.routine_type.slice(1) },
    { label: 'Period', value: routine.period.toUpperCase() },
    {
      label: 'Cost',
      value:
        routine.total_monthly_cost != null
          ? `₹${routine.total_monthly_cost}/mo`
          : '—',
    },
    { label: 'Created', value: formatDate(routine.created_at) },
  ];

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 && (
            <View
              style={[
                s.separator,
                { backgroundColor: colors.separator, marginLeft: 16 },
              ]}
            />
          )}
          <View style={s.row}>
            <Text style={[s.label, { color: colors.label }]}>{row.label}</Text>
            <Text style={[s.value, { color: colors.secondaryLabel }]}>
              {row.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  value: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  separator: {
    height: 0.33,
  },
});
