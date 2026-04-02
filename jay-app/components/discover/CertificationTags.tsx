import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface Props {
  certifications: string[];
}

export default function CertificationTags({ certifications }: Props) {
  const { colors } = useTheme();

  if (!certifications.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {certifications.map((cert, i) => (
        <View
          key={i}
          style={[styles.pill, { backgroundColor: colors.tertiarySystemFill }]}
        >
          <Text style={[styles.label, { color: colors.secondaryLabel }]}>
            {cert}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
  },
});
