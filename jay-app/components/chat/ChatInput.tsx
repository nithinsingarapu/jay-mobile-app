import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface ChatInputProps { onSend: (text: string) => void; }

export function ChatInput({ onSend }: ChatInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const handleSend = () => { if (text.trim()) { onSend(text.trim()); setText(''); } };

  return (
    <View style={[s.container, { borderTopColor: colors.separator, backgroundColor: colors.systemBackground }]}>
      <TextInput
        style={[s.input, { backgroundColor: colors.tertiarySystemFill, color: colors.label }]}
        placeholder="Ask JAY anything..."
        placeholderTextColor={colors.placeholderText}
        value={text} onChangeText={setText} onSubmitEditing={handleSend} returnKeyType="send"
      />
      <Pressable
        style={[s.sendBtn, { backgroundColor: colors.systemBlue }, !text.trim() && { backgroundColor: colors.quaternarySystemFill }]}
        onPress={handleSend} disabled={!text.trim()}
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : colors.tertiaryLabel} strokeWidth="2" strokeLinecap="round">
          <Line x1="22" y1="2" x2="11" y2="13" /><Path d="M22 2L15 22 11 13 2 9l20-7z" />
        </Svg>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  input: { flex: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, fontSize: 17, fontFamily: 'Outfit' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
