import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RichTextProps {
  text: string;
  color: string;
  accentColor: string;
  fontSize?: number;
}

/** Parse inline markdown: **bold**, *italic*, `code` */
function parseInline(text: string, color: string, accentColor: string, baseFontSize: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<Text key={`b${key++}`} style={styles.bold}>{match[2]}</Text>);
    } else if (match[3]) {
      parts.push(<Text key={`i${key++}`} style={styles.italic}>{match[3]}</Text>);
    } else if (match[4]) {
      parts.push(<Text key={`c${key++}`} style={[styles.code, { color: accentColor, fontSize: baseFontSize - 1 }]}>{match[4]}</Text>);
    } else if (match[5]) {
      parts.push(<Text key={`s${key++}`} style={styles.strike}>{match[5]}</Text>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function RichText({ text, color, accentColor, fontSize = 15 }: RichTextProps) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  const lineHeight = fontSize + 7;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') {
      elements.push(<View key={`sp-${i}`} style={{ height: 6 }} />);
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const hSize = level === 1 ? fontSize + 3 : level === 2 ? fontSize + 1 : fontSize;
      elements.push(
        <Text key={`h-${i}`} style={[styles.heading, { color, fontSize: hSize, lineHeight: hSize + 7 }]}>
          {parseInline(headingMatch[2], color, accentColor, hSize)}
        </Text>
      );
      continue;
    }

    // Bullet
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={`b-${i}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: accentColor, fontSize, lineHeight }]}>•</Text>
          <Text style={[styles.text, { color, fontSize, lineHeight, flex: 1 }]}>
            {parseInline(bulletMatch[1], color, accentColor, fontSize)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(
        <View key={`n-${i}`} style={styles.bulletRow}>
          <Text style={[styles.numLabel, { color: accentColor, fontSize, lineHeight }]}>{numMatch[1]}.</Text>
          <Text style={[styles.text, { color, fontSize, lineHeight, flex: 1 }]}>
            {parseInline(numMatch[2], color, accentColor, fontSize)}
          </Text>
        </View>
      );
      continue;
    }

    // Regular line
    elements.push(
      <Text key={`p-${i}`} style={[styles.text, { color, fontSize, lineHeight }]}>
        {parseInline(line, color, accentColor, fontSize)}
      </Text>
    );
  }

  return <>{elements}</>;
}

const styles = StyleSheet.create({
  text: { fontFamily: 'Outfit' },
  heading: { fontFamily: 'Outfit-SemiBold', fontWeight: '600', marginBottom: 2, marginTop: 4 },
  bold: { fontFamily: 'Outfit-SemiBold', fontWeight: '600' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'Outfit-Medium', fontWeight: '500' },
  strike: { textDecorationLine: 'line-through' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 1 },
  bulletDot: { fontWeight: '700' },
  numLabel: { fontFamily: 'Outfit-SemiBold', fontWeight: '600', minWidth: 18 },
});
