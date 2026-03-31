import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useUserStore } from '../../stores/userStore';

const BADGES = [
  { id: '1', emoji: '🌱', name: 'First Step', desc: 'Completed first diary entry', earned: true },
  { id: '2', emoji: '🔥', name: '7-Day Streak', desc: '7 days of routine consistency', earned: true },
  { id: '3', emoji: '🧪', name: 'Ingredient Expert', desc: 'Researched 5 products', earned: true },
  { id: '4', emoji: '💎', name: 'Budget Saver', desc: 'Saved ₹1,000+ with dupes', earned: false },
  { id: '5', emoji: '⭐', name: 'Skin Guru', desc: 'Achieve 90+ skin score', earned: false },
  { id: '6', emoji: '🏆', name: 'Community Star', desc: 'Get 50 likes on a post', earned: false },
];

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title="Achievements" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Glow Points */}
        <View style={styles.glowCard}>
          <Text style={styles.glowLabel}>GLOW POINTS</Text>
          <Text style={styles.glowNum}>{user.glowPoints || 0}</Text>
          <Text style={styles.glowSub}>{user.level || 'Newcomer'}</Text>
          <View style={styles.progressWrapper}>
            <ProgressBar progress={user.levelProgress || 0} />
          </View>
          <Text style={styles.progressNote}>{user.levelProgress || 0}% to next level</Text>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakNum}>{user.streak || 0} days</Text>
            <Text style={styles.streakLabel}>Current streak</Text>
          </View>
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => (
            <View key={badge.id} style={[styles.badge, !badge.earned && styles.badgeUnearned]}>
              <Text style={[styles.badgeEmoji, !badge.earned && styles.badgeEmojiUnearned]}>{badge.emoji}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  glowCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginBottom: 14 },
  glowLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  glowNum: { fontSize: 36, fontWeight: '700', letterSpacing: -1, marginTop: 4, fontFamily: 'Outfit-Bold' },
  glowSub: { fontSize: 13, color: '#666', marginBottom: 12, fontFamily: 'Outfit' },
  progressWrapper: { marginBottom: 6 },
  progressNote: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginBottom: 28 },
  streakEmoji: { fontSize: 32 },
  streakNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  streakLabel: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47%', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  badgeUnearned: { opacity: 0.4 },
  badgeEmoji: { fontSize: 28 },
  badgeEmojiUnearned: { opacity: 0.5 },
  badgeName: { fontSize: 13, fontWeight: '600', textAlign: 'center', fontFamily: 'Outfit-SemiBold' },
  badgeDesc: { fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 15, fontFamily: 'Outfit' },
});
