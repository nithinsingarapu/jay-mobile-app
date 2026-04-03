import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface StepTableProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export default function StepTable({ title, badge, children }: StepTableProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
        {badge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.tertiarySystemFill },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.secondaryLabel }]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
});
