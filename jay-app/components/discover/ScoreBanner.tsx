import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

interface Props {
  jayScore: number;
  safety: number;
  matchPercent: number;
}

export default function ScoreBanner({ jayScore, safety, matchPercent }: Props) {
  const { colors } = useTheme();

  const items = [
    { value: jayScore.toFixed(1), label: 'JAY SCORE' },
    { value: `${safety}%`, label: 'SAFETY' },
    { value: `${matchPercent}%`, label: 'MATCH' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <View
              style={[styles.separator, { backgroundColor: colors.separator }]}
            />
          )}
          <View style={styles.column}>
            <Text style={[styles.value, { color: colors.label }]}>
              {item.value}
            </Text>
            <Text style={[styles.label, { color: colors.secondaryLabel }]}>
              {item.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: RADIUS.md + 2,
    paddingVertical: 14,
    marginHorizontal: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  separator: {
    width: 0.33,
    alignSelf: 'stretch',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
