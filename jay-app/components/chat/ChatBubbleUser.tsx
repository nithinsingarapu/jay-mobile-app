import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ChatBubbleUserProps { text: string; timestamp: string; }

export function ChatBubbleUser({ text, timestamp }: ChatBubbleUserProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper} accessibilityLabel={`You: ${text}`}>
      <View style={styles.bubbleContainer}>
        <View style={[styles.bubble, { backgroundColor: colors.systemBlue }]}>
          <Text style={styles.text}>{text}</Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.tertiaryLabel }]}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 20 },
  bubbleContainer: { alignItems: 'flex-end' },
  bubble: { borderRadius: 18, borderTopRightRadius: 4, padding: 14, maxWidth: 265 },
  text: { fontSize: 15, lineHeight: 22, color: '#fff', fontFamily: 'Outfit' },
  timestamp: { fontSize: 11, fontWeight: '500', marginTop: 4, fontFamily: 'Outfit-Medium' },
});
