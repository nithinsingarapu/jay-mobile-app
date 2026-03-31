import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatBubbleUserProps {
  text: string;
  timestamp: string;
}

export function ChatBubbleUser({ text, timestamp }: ChatBubbleUserProps) {
  return (
    <View style={styles.wrapper} accessible={true} accessibilityRole="text" accessibilityLabel={`You: ${text}`}>
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{text}</Text>
        </View>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 24 },
  bubbleContainer: { alignItems: 'flex-end' },
  bubble: { backgroundColor: '#000', borderRadius: 16, borderTopRightRadius: 2, padding: 14, maxWidth: 252 },
  text: { fontSize: 14, lineHeight: 22, color: '#fff', fontFamily: 'Outfit' },
  timestamp: { fontSize: 11, color: '#CCC', fontWeight: '500', marginTop: 4, fontFamily: 'Outfit-Medium' },
});
