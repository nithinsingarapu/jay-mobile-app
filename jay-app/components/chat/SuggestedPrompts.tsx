import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SuggestedPromptsProps { prompts: string[]; onSelect: (prompt: string) => void; }

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {prompts.map((prompt, index) => (
        <Pressable key={index} style={[styles.pill, { backgroundColor: colors.quaternarySystemFill }]} onPress={() => onSelect(prompt)} accessibilityLabel={prompt}>
          <Text style={[styles.text, { color: colors.label }]}>{prompt}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 8, paddingBottom: 8, paddingTop: 4 },
  pill: { borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16 },
  text: { fontSize: 13, fontFamily: 'Outfit-Medium', fontWeight: '500' },
});
