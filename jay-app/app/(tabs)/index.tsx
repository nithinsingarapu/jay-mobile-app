import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { SearchBar } from '../../components/ui/SearchBar';
import { QuickActionsGrid } from '../../components/home/QuickActionsGrid';
import { RoutineCarousel } from '../../components/home/RoutineCarousel';
import { ForYouCarousel } from '../../components/home/ForYouCarousel';
import { InsightNudge } from '../../components/home/InsightNudge';
import { CapSlapPreview } from '../../components/home/CapSlapPreview';
import { useUserStore } from '../../stores/userStore';
import { useRoutineStore } from '../../stores/routineStore';
import { mockDiscoverArticles, mockCapSlapVerdicts } from '../../constants/mockData';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, backendProfile, profileLoading } = useUserStore();
  const routineStore = useRoutineStore();
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{user.name || 'there'}.</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/(screens)/notifications' as any)} accessible accessibilityLabel="Notifications">
            <View style={{ position: 'relative' }}>
              <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
              <View style={styles.notifDot} />
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile' as any)} accessible accessibilityLabel="Profile">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.name || '?')[0]}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <SearchBar placeholder="Search products, ingredients..." />
      </View>

      {/* Skin Health Card */}
      {profileLoading ? (
        <View style={[styles.scoreCard, { height: 100, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 13, color: '#999', fontFamily: 'Outfit' }}>Loading your profile...</Text>
        </View>
      ) : (
        <View style={styles.scoreCard}>
          <ScoreRing score={user.profileCompleteness} size={64} />
          <View style={styles.scoreInfo}>
            <Text style={styles.microLabel}>PROFILE HEALTH</Text>
            <Text style={styles.scoreTitle}>{user.profileCompleteness >= 70 ? 'Looking great!' : user.profileCompleteness >= 30 ? 'Getting there' : 'Just getting started'}</Text>
            <Text style={styles.scoreSubtitle}>{user.profileCompleteness}% complete · {user.level}</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <QuickActionsGrid />

      {/* Today's Routine */}
      <RoutineCarousel
        steps={[]}
        period={period}
        onTogglePeriod={() => setPeriod(period === 'AM' ? 'PM' : 'AM')}
      />

      {/* For You */}
      <ForYouCarousel articles={mockDiscoverArticles} />

      {/* Insight Nudge */}
      <InsightNudge text="Your skin responds well to niacinamide — 8 good days since adding it." />

      {/* Cap or Slap */}
      <CapSlapPreview verdicts={mockCapSlapVerdicts} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingBottom: 16 },
  greeting: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, lineHeight: 29, fontFamily: 'Outfit-SemiBold' },
  name: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Outfit-SemiBold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  notifDot: { position: 'absolute', top: 0, right: 0, width: 6, height: 6, backgroundColor: '#888', borderRadius: 3, borderWidth: 1.5, borderColor: '#fff' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  searchWrapper: { paddingHorizontal: 24, marginBottom: 20 },
  scoreCard: { marginHorizontal: 24, marginBottom: 24, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreInfo: { flex: 1 },
  microLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  scoreTitle: { fontSize: 14, fontWeight: '600', marginTop: 5, fontFamily: 'Outfit-SemiBold' },
  scoreSubtitle: { fontSize: 13, color: '#999', marginTop: 3, fontFamily: 'Outfit' },
});
