import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { RADIUS, SPACE } from '../../constants/theme';

interface ReportCard {
  ingredient_quality: number;
  formula_safety: number;
  value_for_money: number;
  brand_transparency: number;
  user_satisfaction: number;
  derm_endorsement: number;
}

interface Props {
  reportCard: ReportCard;
}

const LABELS: Record<keyof ReportCard, string> = {
  ingredient_quality: 'INGREDIENTS',
  formula_safety: 'SAFETY',
  value_for_money: 'VALUE',
  brand_transparency: 'TRANSPARENCY',
  user_satisfaction: 'SATISFACTION',
  derm_endorsement: 'DERM ENDORSED',
};

function getBarColor(score: number): string {
  if (score >= 7) return '#34C759';
  if (score >= 5) return '#FF9500';
  return '#FF3B30';
}

export default function ReportCardGrid({ reportCard }: Props) {
  const { colors } = useTheme();

  const entries = Object.entries(reportCard) as [keyof ReportCard, number][];

  return (
    <View style={styles.grid}>
      {entries.map(([key, score]) => (
        <View
          key={key}
          style={[
            styles.cell,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: colors.label }]}>
              {score.toFixed(1)}
            </Text>
            <Text style={[styles.outOf, { color: colors.secondaryLabel }]}>
              /10
            </Text>
          </View>
          <Text style={[styles.label, { color: colors.secondaryLabel }]}>
            {LABELS[key]}
          </Text>
          <View
            style={[
              styles.barTrack,
              { backgroundColor: colors.tertiarySystemFill },
            ]}
          >
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: getBarColor(score),
                  width: `${(score / 10) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    paddingHorizontal: 16,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  outOf: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginLeft: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barTrack: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  barFill: {
    height: 3,
    borderRadius: 1.5,
  },
});
