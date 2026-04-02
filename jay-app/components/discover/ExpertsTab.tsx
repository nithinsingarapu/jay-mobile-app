import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { ProductDetailMock } from '../../data/mockProductDetail';

interface Props {
  mock: ProductDetailMock;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  positive: { bg: '#34C75920', text: '#34C759' },
  mixed: { bg: '#FF950020', text: '#FF9500' },
  negative: { bg: '#FF3B3020', text: '#FF3B30' },
};

const FUNDING_COLORS: Record<string, { bg: string; text: string }> = {
  independent: { bg: '#34C75920', text: '#34C759' },
  'brand-funded': { bg: '#FF950020', text: '#FF9500' },
  'in-progress': { bg: '#007AFF20', text: '#007AFF' },
};

const FUNDING_LABELS: Record<string, string> = {
  independent: 'Independent',
  'brand-funded': 'Brand-Funded',
  'in-progress': 'In Progress',
};

export default function ExpertsTab({ mock }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Derm Opinions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          Expert Opinions
        </Text>
        {mock.expert_opinions.map((expert, i) => {
          const verdict = VERDICT_COLORS[expert.verdict] || VERDICT_COLORS.positive;
          return (
            <View
              key={i}
              style={[
                styles.card,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.expertInfo}>
                  <Text style={[styles.expertName, { color: colors.label }]}>
                    {expert.name}
                  </Text>
                  <Text
                    style={[
                      styles.credentials,
                      { color: colors.secondaryLabel },
                    ]}
                  >
                    {expert.credentials}
                  </Text>
                </View>
                <View style={[styles.verdictBadge, { backgroundColor: verdict.bg }]}>
                  <Text style={[styles.verdictText, { color: verdict.text }]}>
                    {expert.verdict.charAt(0).toUpperCase() + expert.verdict.slice(1)}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.quote,
                  { color: colors.secondaryLabel },
                ]}
              >
                "{expert.quote}"
              </Text>
            </View>
          );
        })}
      </View>

      {/* Clinical Studies */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          Clinical Studies
        </Text>
        {mock.clinical_studies.map((study, i) => {
          const funding = FUNDING_COLORS[study.funding] || FUNDING_COLORS.independent;
          return (
            <View
              key={i}
              style={[
                styles.card,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[styles.studyName, { color: colors.label }]}
                  numberOfLines={2}
                >
                  {study.name}
                </Text>
                <View style={[styles.fundingBadge, { backgroundColor: funding.bg }]}>
                  <Text style={[styles.fundingText, { color: funding.text }]}>
                    {FUNDING_LABELS[study.funding]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.source, { color: colors.secondaryLabel }]}>
                {study.source}
              </Text>
              <Text style={[styles.finding, { color: colors.label }]}>
                {study.finding}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE.xxl,
    paddingVertical: SPACE.lg,
  },
  section: {
    gap: SPACE.md,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  card: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  expertInfo: {
    flex: 1,
    gap: 2,
  },
  expertName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  credentials: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verdictText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
  quote: {
    fontSize: 14,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  studyName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    flex: 1,
  },
  fundingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fundingText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
  source: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  finding: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 21,
  },
});
