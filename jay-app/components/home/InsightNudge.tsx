import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface InsightNudgeProps { text: string; }

export function InsightNudge({ text }: InsightNudgeProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {text}{' '}
        <Text style={styles.link} onPress={() => router.push('/(screens)/intelligence' as any)}>
          View insight →
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 24, marginBottom: 24, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E5E5', paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 6, height: 6, backgroundColor: '#333', borderRadius: 3, flexShrink: 0 },
  text: { flex: 1, fontSize: 13, color: '#666', lineHeight: 20, fontFamily: 'Outfit' },
  link: { color: '#000', fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
});
