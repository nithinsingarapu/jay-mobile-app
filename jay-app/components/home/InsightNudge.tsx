import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';

interface InsightNudgeProps { text: string; }

export function InsightNudge({ text }: InsightNudgeProps) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderColor: colors.separator }]}>
      <View style={[styles.dot, { backgroundColor: colors.systemBlue }]} />
      <Text style={[styles.text, { color: colors.secondaryLabel }]}>
        {text}{' '}
        <Text style={[styles.link, { color: colors.systemBlue }]} onPress={() => router.push('/(screens)/intelligence' as any)}>
          View insight →
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 20, marginBottom: 24, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  text: { flex: 1, fontSize: 15, lineHeight: 22, fontFamily: 'Outfit' },
  link: { fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});
