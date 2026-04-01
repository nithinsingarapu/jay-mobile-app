import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { CommunityPost } from '../../types';

export function PostCard({ post }: { post: CommunityPost }) {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { borderBottomColor: colors.separator }]}>
      <View style={s.header}>
        <View style={[s.avatar, { backgroundColor: colors.tertiarySystemFill }]}>
          <Text style={[s.avatarText, { color: colors.label }]}>{post.avatar}</Text>
        </View>
        <View>
          <Text style={[s.author, { color: colors.label }]}>{post.author}</Text>
          <Text style={[s.time, { color: colors.tertiaryLabel }]}>{post.timeAgo}</Text>
        </View>
      </View>
      <Text style={[s.body, { color: colors.label }]}>{post.text}</Text>
      <View style={s.tags}>
        {post.tags.map((tag) => (
          <View key={tag} style={[s.tag, { backgroundColor: colors.quaternarySystemFill }]}><Text style={[s.tagText, { color: colors.secondaryLabel }]}>{tag}</Text></View>
        ))}
      </View>
      <View style={s.engagement}>
        <Text style={[s.engageText, { color: colors.secondaryLabel }]}>♡ {post.likes}</Text>
        <Text style={[s.engageText, { color: colors.secondaryLabel }]}>💬 {post.comments}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  author: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  time: { fontSize: 13, fontFamily: 'Outfit' },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 10, fontFamily: 'Outfit' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 13, fontFamily: 'Outfit-Medium' },
  engagement: { flexDirection: 'row', gap: 16 },
  engageText: { fontSize: 13, fontFamily: 'Outfit' },
});
