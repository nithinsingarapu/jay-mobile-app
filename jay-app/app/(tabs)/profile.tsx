import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MenuRow } from '../../components/ui/MenuRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useUserStore } from '../../stores/userStore';

const MENU_SECTIONS = [
  {
    label: 'SKINCARE',
    items: [
      { label: 'My Routine', route: '/(screens)/routine' },
      { label: 'Skin Profile', route: '/(screens)/preferences' },
      { label: 'Tracked Products', route: '/(screens)/routine' },
    ],
  },
  {
    label: 'ACHIEVEMENTS',
    items: [
      { label: 'Badges & Streaks', route: '/(screens)/achievements' },
      { label: 'Glow Points', route: '/(screens)/achievements' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Notifications', route: '/(screens)/notifications' },
      { label: 'Settings', route: '/(screens)/settings' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, backendProfile } = useUserStore();

  const displayName = user.name || 'User';
  const initial = displayName[0]?.toUpperCase() || '?';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 100 }}
    >
      {/* Profile hero */}
      <View style={styles.hero}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}
        <View style={styles.chips}>
          {user.skinType ? <View style={styles.skinChip}><Text style={styles.skinChipText}>{user.skinType}</Text></View> : null}
          {user.sensitivity ? <View style={styles.skinChip}><Text style={styles.skinChipText}>{user.sensitivity}</Text></View> : null}
          {user.topGoal ? <View style={[styles.skinChip, styles.goalChip]}><Text style={styles.goalChipText}>{formatGoal(user.topGoal)}</Text></View> : null}
        </View>
        {user.memberSince ? <Text style={styles.since}>Member since {user.memberSince}</Text> : null}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{user.profileCompleteness}%</Text>
          <Text style={styles.statLabel}>PROFILE</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statNum}>{user.glowPoints}</Text>
          <Text style={styles.statLabel}>GLOW PTS</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{user.primaryConcerns.length}</Text>
          <Text style={styles.statLabel}>CONCERNS</Text>
        </View>
      </View>

      {/* Level card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>{user.level}</Text>
          <Text style={styles.levelPoints}>{user.glowPoints} pts</Text>
        </View>
        <Text style={styles.levelSub}>
          {user.level === 'Newcomer' ? 'Complete your profile to level up!' :
           user.level === 'Skincare Explorer' ? 'Next: Skincare Enthusiast' :
           user.level === 'Skincare Enthusiast' ? 'Next: Skincare Expert' :
           'You\'ve reached the top!'}
        </Text>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={user.levelProgress} />
        </View>
        <Text style={styles.levelPct}>{user.levelProgress}%</Text>
      </View>

      {/* Concerns */}
      {user.primaryConcerns.length > 0 ? (
        <View style={styles.concernsCard}>
          <Text style={styles.concernsTitle}>Your focus areas</Text>
          <View style={styles.concernsRow}>
            {user.primaryConcerns.map((c) => (
              <View key={c} style={styles.concernChip}>
                <Text style={styles.concernChipText}>{formatConcern(c)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Menu sections */}
      <View style={styles.menuWrapper}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.label} style={styles.section}>
            <SectionHeader label={section.label} style={styles.sectionLabel} />
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <MenuRow
                  key={item.label}
                  label={item.label}
                  onPress={() => router.push(item.route as any)}
                  isLast={i === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function formatGoal(goal: string): string {
  const map: Record<string, string> = {
    clear_skin: 'Clear skin',
    anti_aging: 'Anti-aging',
    glow: 'Glow',
    even_tone: 'Even tone',
    hydration: 'Hydration',
    oil_control: 'Oil control',
  };
  return map[goal] || goal;
}

function formatConcern(concern: string): string {
  return concern.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bigAvatarText: { color: '#fff', fontSize: 28, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  name: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Outfit-SemiBold' },
  username: { fontSize: 14, color: '#999', fontFamily: 'Outfit', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  skinChip: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  skinChipText: { fontSize: 12, fontFamily: 'Outfit-Medium', fontWeight: '500' },
  goalChip: { backgroundColor: '#000', borderColor: '#000' },
  goalChipText: { fontSize: 12, fontFamily: 'Outfit-Medium', fontWeight: '500', color: '#fff' },
  since: { fontSize: 12, color: '#999', marginTop: 8, fontFamily: 'Outfit' },
  statsRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#E5E5E5' },
  statNum: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold' },
  statLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4, fontFamily: 'Outfit-SemiBold' },
  levelCard: { marginHorizontal: 24, marginTop: 24, marginBottom: 8, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  levelTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  levelPoints: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  levelSub: { fontSize: 12, color: '#999', marginBottom: 10, fontFamily: 'Outfit' },
  progressWrapper: { marginBottom: 6 },
  levelPct: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },
  concernsCard: { marginHorizontal: 24, marginTop: 16, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14 },
  concernsTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginBottom: 10 },
  concernsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  concernChip: { backgroundColor: '#F5F5F5', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  concernChipText: { fontSize: 12, fontFamily: 'Outfit-Medium' },
  menuWrapper: { paddingHorizontal: 24, marginTop: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { marginBottom: 10 },
  menuCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, paddingHorizontal: 14 },
});
