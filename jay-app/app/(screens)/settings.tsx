import React from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TopBar } from '../../components/ui/TopBar';
import { MenuRow } from '../../components/ui/MenuRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';

const SECTIONS = [
  { label: 'ACCOUNT', items: ['Edit Profile', 'Change Email', 'Change Password'] },
  { label: 'PREFERENCES', items: ['Notification Settings', 'Privacy Settings', 'Data & Storage'] },
  { label: 'ABOUT', items: ['Terms of Service', 'Privacy Policy', 'Contact Support', 'Rate the App'] },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useUserStore();
  const { isDark, toggle, colors } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/onboarding');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.groupedBackground }]}>
      <TopBar title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={[styles.userCard, { borderBottomColor: colors.separator }]}>
          <View style={[styles.avatar, { backgroundColor: colors.systemBlue }]}><Text style={styles.avatarText}>{(user.name || '?')[0]}</Text></View>
          <View>
            <Text style={[styles.userName, { color: colors.label }]}>{user.name || 'User'}</Text>
            <Text style={[styles.userLevel, { color: colors.secondaryLabel }]}>{user.level}</Text>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <SectionHeader label="APPEARANCE" style={styles.sectionLabel} />
          <View style={[styles.card, { backgroundColor: colors.secondaryGroupedBackground }]}>
            <View style={styles.themeRow}>
              <Text style={[styles.themeLabel, { color: colors.label }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: colors.systemFill, true: colors.systemGreen }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.label} style={styles.section}>
            <SectionHeader label={section.label} style={styles.sectionLabel} />
            <View style={[styles.card, { backgroundColor: colors.secondaryGroupedBackground }]}>
              {section.items.map((item, i) => (
                <MenuRow
                  key={item}
                  label={item}
                  isLast={i === section.items.length - 1}
                  onPress={
                    section.label === 'ACCOUNT' && item === 'Edit Profile'
                      ? () => router.push('/(screens)/preferences' as any)
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        <Text style={[styles.version, { color: colors.tertiaryLabel }]}>JAY v0.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  userName: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  userLevel: { fontSize: 13, fontFamily: 'Outfit', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionLabel: { marginBottom: 10 },
  card: { borderRadius: 10, overflow: 'hidden' },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  themeLabel: { fontSize: 17, fontFamily: 'Outfit' },
  signOutBtn: { alignItems: 'center', paddingVertical: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FF3B30', borderRadius: 12, marginTop: 8 },
  signOutText: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: '#FF3B30' },
  version: { fontSize: 13, textAlign: 'center', marginTop: 16, fontFamily: 'Outfit' },
});
