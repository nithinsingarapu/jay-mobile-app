import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';

interface OrderDiagramProps {
  amOrder: string[];
  pmOrder: string[];
}

export default function OrderDiagram({ amOrder, pmOrder }: OrderDiagramProps) {
  const { colors } = useTheme();

  const renderColumn = (
    steps: string[],
    headerLabel: string,
    headerColor: string,
  ) => (
    <View style={[styles.card, { backgroundColor: colors.secondarySystemBackground }]}>
      <Text style={[styles.header, { color: headerColor }]}>{headerLabel}</Text>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <Text
            key={i}
            style={[
              styles.step,
              { color: isLast ? colors.systemBlue : colors.secondaryLabel },
            ]}
          >
            {i + 1}. {step}
          </Text>
        );
      })}
    </View>
  );

  return (
    <View style={styles.row}>
      {renderColumn(amOrder, 'MORNING (AM)', colors.systemBlue)}
      {renderColumn(pmOrder, 'EVENING (PM)', colors.systemIndigo)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACE.lg,
  },
  card: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
  },
  header: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
    marginBottom: SPACE.sm,
  },
  step: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },
});
