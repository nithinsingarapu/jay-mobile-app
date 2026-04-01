import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MenuRow } from '../../components/ui/MenuRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';
import { TYPE, SPACE, RADIUS } from '../../constants/theme';

const MENU_SECTIONS = [
  { label: 'SKINCARE', items: [
    { label: 'My Routine', route: '/(screens)/routine' },
    { label: 'Skin Profile', route: '/(screens)/preferences' },
  ]},
  { label: 'ACHIEVEMENTS', items: [
    { label: 'Badges & Streaks', route: '/(screens)/achievements' },
    { label: 'Glow Points', route: '/(screens)/achievements' },
  ]},
  { label: 'SETTINGS', items: [
    { label: 'Notifications', route: '/(screens)/notifications' },
    { label: 'Settings', route: '/(screens)/settings' },
  ]},
];

function formatGoal(goal: string): string {
  const map: Record<string, string> = { clear_skin: 'Clear skin', anti_aging: 'Anti-aging', glow: 'Glow', even_tone: 'Even tone', hydration: 'Hydration', oil_control: 'Oil control' };
  return map[goal] || goal;
}

function formatConcern(c: string): string {
  return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUserStore();
  const { colors, isDark } = useTheme();

  const displayName = user.name || 'User';
  const initial = displayName[0]?.toUpperCase() || '?';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.groupedBackground }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 100 }}
    >
      {/* Hero */}
      <View style={[$.hero, { borderBottomColor: colors.separator }]}>
        <View style={[$.bigAvatar, { backgroundColor: colors.systemBlue }]}>
          <Text style={$.bigAvatarText}>{initial}</Text>
        </View>
        <Text style={[$.name, { color: colors.label }]}>{displayName}</Text>
        {user.username ? <Text style={[$.username, { color: colors.secondaryLabel }]}>@{user.username}</Text> : null}
        <View style={$.chips}>
          {user.skinType ? <View style={[$.chip, { backgroundColor: colors.quaternarySystemFill }]}><Text style={[$.chipText, { color: colors.label }]}>{user.skinType}</Text></View> : null}
          {user.topGoal ? <View style={[$.chip, { backgroundColor: colors.systemBlue }]}><Text style={[$.chipText, { color: '#fff' }]}>{formatGoal(user.topGoal)}</Text></View> : null}
        </View>
        {user.memberSince ? <Text style={[$.since, { color: colors.tertiaryLabel }]}>Member since {user.memberSince}</Text> : null}
      </View>

      {/* Stats */}
      <View style={$.statsRow}>
        <View style={$.statItem}>
          <Text style={[$.statNum, { color: colors.label }]}>{user.profileCompleteness}%</Text>
          <Text style={[$.statLabel, { color: colors.secondaryLabel }]}>Profile</Text>
        </View>
        <View style={[$.statItem, { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }]}>
          <Text style={[$.statNum, { color: colors.label }]}>{user.glowPoints}</Text>
          <Text style={[$.statLabel, { color: colors.secondaryLabel }]}>Glow pts</Text>
        </View>
        <View style={$.statItem}>
          <Text style={[$.statNum, { color: colors.label }]}>{user.primaryConcerns.length}</Text>
          <Text style={[$.statLabel, { color: colors.secondaryLabel }]}>Concerns</Text>
        </View>
      </View>

      {/* Level */}
      <View style={[$.levelCard, { backgroundColor: colors.secondaryGroupedBackground }]}>
        <View style={$.levelHeader}>
          <Text style={[$.levelTitle, { color: colors.label }]}>{user.level}</Text>
          <Text style={[$.levelPts, { color: colors.systemBlue }]}>{user.glowPoints} pts</Text>
        </View>
        <View style={{ marginTop: 10, marginBottom: 6 }}><ProgressBar progress={user.levelProgress} /></View>
        <Text style={[$.levelPct, { color: colors.tertiaryLabel }]}>{user.levelProgress}%</Text>
      </View>

      {/* Concerns */}
      {user.primaryConcerns.length > 0 ? (
        <View style={[$.concernsCard, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <Text style={[$.concernsTitle, { color: colors.label }]}>Focus areas</Text>
          <View style={$.concernsRow}>
            {user.primaryConcerns.map((c) => (
              <View key={c} style={[$.concernChip, { backgroundColor: colors.quaternarySystemFill }]}>
                <Text style={[$.concernChipText, { color: colors.label }]}>{formatConcern(c)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Menu */}
      <View style={{ paddingHorizontal: SPACE.xl, marginTop: SPACE.xl }}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.label} style={{ marginBottom: 24 }}>
            <SectionHeader label={section.label} style={{ marginBottom: 10 }} />
            <View style={[$.menuCard, { backgroundColor: colors.secondaryGroupedBackground }]}>
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

const $ = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: SPACE.xl, paddingBottom: 28, borderBottomWidth: StyleSheet.hairlineWidth },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bigAvatarText: { color: '#fff', fontSize: 32, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  name: { ...TYPE.title2 },
  username: { ...TYPE.subheadline, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  chip: { borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: 14 },
  chipText: { ...TYPE.caption1, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  since: { ...TYPE.caption1, marginTop: 8 },
  statsRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statNum: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold' },
  statLabel: { ...TYPE.caption1, marginTop: 4 },
  levelCard: { marginHorizontal: SPACE.xl, marginTop: SPACE.xl, borderRadius: RADIUS.md, padding: SPACE.lg },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTitle: { ...TYPE.headline },
  levelPts: { ...TYPE.headline },
  levelPct: { ...TYPE.caption1, marginTop: 2 },
  concernsCard: { marginHorizontal: SPACE.xl, marginTop: SPACE.lg, borderRadius: RADIUS.md, padding: SPACE.lg },
  concernsTitle: { ...TYPE.headline, marginBottom: 10 },
  concernsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  concernChip: { borderRadius: RADIUS.full, paddingVertical: 6, paddingHorizontal: 14 },
  concernChipText: { ...TYPE.caption1, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  menuCard: { borderRadius: 10, overflow: 'hidden' },
});
