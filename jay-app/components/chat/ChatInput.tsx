import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ask JAY anything..."
        placeholderTextColor="#CCC"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        accessibilityLabel="Message input"
      />
      <Pressable
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
        accessible
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : '#999'} strokeWidth="2" strokeLinecap="round">
          <Line x1="22" y1="2" x2="11" y2="13" />
          <Path d="M22 2L15 22 11 13 2 9l20-7z" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#E5E5E5', backgroundColor: '#fff', gap: 10 },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, fontFamily: 'Outfit', color: '#000' },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#F5F5F5' },
});
