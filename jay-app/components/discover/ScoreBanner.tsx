import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface Props {
  jayScore: number;
  safety: number;
  matchPercent: number;
}

export default function ScoreBanner({ jayScore, safety, matchPercent }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {/* JAY Score */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.label }]}>
          {Math.round(jayScore)}
          <Text style={[styles.suffix, { color: colors.tertiaryLabel }]}>/10</Text>
        </Text>
        <Text style={[styles.label, { color: colors.secondaryLabel }]}>JAY SCORE</Text>
      </View>

      <View style={[styles.separator, { backgroundColor: colors.separator }]} />

      {/* Safety */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.label }]}>
          {Math.round(safety / 10)}
          <Text style={[styles.suffix, { color: colors.tertiaryLabel }]}>/10</Text>
        </Text>
        <Text style={[styles.label, { color: colors.secondaryLabel }]}>SAFETY</Text>
      </View>

      <View style={[styles.separator, { backgroundColor: colors.separator }]} />

      {/* Match */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.label }]}>
          {matchPercent}
          <Text style={[styles.suffix, { color: colors.tertiaryLabel }]}>%</Text>
        </Text>
        <Text style={[styles.label, { color: colors.secondaryLabel }]}>MATCH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 0.33,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
  },
  suffix: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Outfit',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
});
