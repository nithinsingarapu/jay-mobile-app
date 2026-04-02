import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface MonthlyCostPillProps {
  cost: number;
  onPress?: () => void;
}

export function MonthlyCostPill({ cost, onPress }: MonthlyCostPillProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[s.container, { backgroundColor: colors.secondarySystemBackground }]}
    >
      <Text style={[s.cost, { color: colors.label }]}>₹{cost}/mo</Text>
      <Text style={[s.link, { color: colors.systemBlue }]}>View breakdown →</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cost: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  link: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
});
