import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {prompts.map((prompt, index) => (
        <Pressable key={index} style={styles.pill} onPress={() => onSelect(prompt)} accessible accessibilityLabel={prompt} accessibilityRole="button">
          <Text style={styles.text}>{prompt}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 8, paddingBottom: 8, paddingTop: 4 },
  pill: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16 },
  text: { fontSize: 13, color: '#000', fontFamily: 'Outfit-Medium', fontWeight: '500' },
});
