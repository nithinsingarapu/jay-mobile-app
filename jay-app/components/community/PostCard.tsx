import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CommunityPost } from '../../types';

interface PostCardProps { post: CommunityPost; }

export function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.avatar}</Text>
        </View>
        <View>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.time}>{post.timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.body}>{post.text}</Text>
      <View style={styles.tags}>
        {post.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.engagement}>
        <Text style={styles.engageText}>♡ {post.likes}</Text>
        <Text style={styles.engageText}>💬 {post.comments}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: '#333' },
  author: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  time: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },
  body: { fontSize: 14, lineHeight: 22, color: '#333', marginBottom: 10, fontFamily: 'Outfit' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: '#666', fontFamily: 'Outfit-Medium' },
  engagement: { flexDirection: 'row', gap: 16 },
  engageText: { fontSize: 13, color: '#999', fontFamily: 'Outfit' },
});
