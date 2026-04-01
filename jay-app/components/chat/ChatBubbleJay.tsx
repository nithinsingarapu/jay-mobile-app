import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VerdictCard } from './VerdictCard';
import { useTheme } from '../../lib/theme';

interface ChatBubbleJayProps {
  text: string;
  timestamp: string;
  verdict?: { type: 'SLAP' | 'CAP'; product: string; score: number; reason: string; };
}

/** Parse markdown-ish text into styled <Text> elements */
function RichText({ text, color, linkColor }: { text: string; color: string; linkColor: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line → spacer
    if (line.trim() === '') {
      elements.push(<View key={`sp-${i}`} style={{ height: 8 }} />);
      continue;
    }

    // Headings: ### or ##
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <Text key={`h-${i}`} style={[styles.heading, { color, fontSize: level === 1 ? 18 : level === 2 ? 16 : 15 }]}>
          {parseInline(headingMatch[2], color, linkColor)}
        </Text>
      );
      continue;
    }

    // Bullet points: - or * or •
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={`b-${i}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: linkColor }]}>•</Text>
          <Text style={[styles.text, { color, flex: 1 }]}>
            {parseInline(bulletMatch[1], color, linkColor)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered list: 1. or 1)
    const numMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(
        <View key={`n-${i}`} style={styles.bulletRow}>
          <Text style={[styles.numLabel, { color: linkColor }]}>{numMatch[1]}.</Text>
          <Text style={[styles.text, { color, flex: 1 }]}>
            {parseInline(numMatch[2], color, linkColor)}
          </Text>
        </View>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={`p-${i}`} style={[styles.text, { color }]}>
        {parseInline(line, color, linkColor)}
      </Text>
    );
  }

  return <>{elements}</>;
}

/** Parse inline markdown: **bold**, *italic*, `code`, ~~strike~~ */
function parseInline(text: string, color: string, accentColor: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`, ~~strike~~
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<Text key={`b${key++}`} style={styles.bold}>{match[2]}</Text>);
    } else if (match[3]) {
      // *italic*
      parts.push(<Text key={`i${key++}`} style={styles.italic}>{match[3]}</Text>);
    } else if (match[4]) {
      // `code`
      parts.push(<Text key={`c${key++}`} style={[styles.code, { color: accentColor }]}>{match[4]}</Text>);
    } else if (match[5]) {
      // ~~strikethrough~~
      parts.push(<Text key={`s${key++}`} style={styles.strike}>{match[5]}</Text>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function ChatBubbleJay({ text, timestamp, verdict }: ChatBubbleJayProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper} accessibilityLabel={`JAY: ${text}`}>
      <View style={[styles.avatar, { backgroundColor: colors.systemIndigo }]}>
        <Text style={styles.avatarText}>J</Text>
      </View>
      <View style={styles.bubbleContainer}>
        <View style={[styles.bubble, { backgroundColor: colors.secondarySystemBackground }]}>
          <RichText text={text} color={colors.label} linkColor={colors.systemIndigo} />
          {verdict && <VerdictCard {...verdict} />}
        </View>
        <Text style={[styles.timestamp, { color: colors.tertiaryLabel }]}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '900', fontFamily: 'Outfit-Bold' },
  bubbleContainer: { flex: 1 },
  bubble: { borderRadius: 4, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: 14, maxWidth: 280 },
  text: { fontSize: 15, lineHeight: 22, fontFamily: 'Outfit' },
  heading: { fontFamily: 'Outfit-SemiBold', fontWeight: '600', lineHeight: 24, marginBottom: 4, marginTop: 4 },
  bold: { fontFamily: 'Outfit-SemiBold', fontWeight: '600' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'Outfit-Medium', fontWeight: '500', fontSize: 14 },
  strike: { textDecorationLine: 'line-through' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 2 },
  bulletDot: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  numLabel: { fontSize: 14, lineHeight: 22, fontFamily: 'Outfit-SemiBold', fontWeight: '600', minWidth: 18 },
  timestamp: { fontSize: 11, fontWeight: '500', marginTop: 4, fontFamily: 'Outfit-Medium' },
});
