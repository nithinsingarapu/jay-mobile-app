import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VerdictCard } from './VerdictCard';

interface ChatBubbleJayProps {
  text: string;
  timestamp: string;
  verdict?: {
    type: 'SLAP' | 'CAP';
    product: string;
    score: number;
    reason: string;
  };
}

export function ChatBubbleJay({ text, timestamp, verdict }: ChatBubbleJayProps) {
  return (
    <View style={styles.wrapper} accessible={true} accessibilityRole="text" accessibilityLabel={`JAY: ${text}`}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>J</Text>
      </View>
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{text}</Text>
          {verdict && <VerdictCard {...verdict} />}
        </View>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16, paddingHorizontal: 24 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '900', fontFamily: 'Outfit-Bold' },
  bubbleContainer: { flex: 1 },
  bubble: { backgroundColor: '#F5F5F5', borderRadius: 2, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 14, maxWidth: 260 },
  text: { fontSize: 14, lineHeight: 22, color: '#000', fontFamily: 'Outfit' },
  timestamp: { fontSize: 11, color: '#CCC', fontWeight: '500', marginTop: 4, fontFamily: 'Outfit-Medium' },
});
