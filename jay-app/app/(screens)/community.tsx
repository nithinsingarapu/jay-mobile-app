import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { Chip } from '../../components/ui/Chip';
import { PostCard } from '../../components/community/PostCard';
import { mockCommunityPosts } from '../../constants/mockData';

const FILTERS = ['Latest', 'Popular', 'Questions', 'Progress'];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Latest');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TopBar title="Community" />
        <Pressable style={styles.newPostBtn} accessible accessibilityLabel="New post">
          <Text style={styles.newPostText}>+ New post</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
        ))}
      </View>
      <FlatList
        data={mockCommunityPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 },
  newPostBtn: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  newPostText: { fontSize: 12, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 8 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
});
