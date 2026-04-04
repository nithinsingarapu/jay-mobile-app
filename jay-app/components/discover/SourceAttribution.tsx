import React from 'react';
import { Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SourceAttributionProps {
  sourceName?: string;
  sourceUrl?: string;
}

export function SourceAttribution({ sourceName, sourceUrl }: SourceAttributionProps) {
  const { colors } = useTheme();
  if (!sourceName && !sourceUrl) return null;

  let label = sourceName || '';
  if (!label && sourceUrl) {
    try {
      label = new URL(sourceUrl).hostname.replace('www.', '');
    } catch {
      label = sourceUrl;
    }
  }

  return (
    <Pressable
      onPress={() => sourceUrl && Linking.openURL(sourceUrl)}
      disabled={!sourceUrl}
      hitSlop={8}
    >
      <Text style={[s.text, { color: colors.tertiaryLabel }]}>
        Source: <Text style={{ color: sourceUrl ? colors.systemBlue : colors.tertiaryLabel }}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: 'Outfit',
    marginTop: 6,
  },
});
