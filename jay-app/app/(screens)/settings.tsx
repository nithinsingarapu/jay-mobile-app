import React from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TopBar } from '../../components/ui/TopBar';
import { MenuRow } from '../../components/ui/MenuRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useUserStore } from '../../stores/userStore';

const SECTIONS = [
  { label: 'ACCOUNT', items: ['Edit Profile', 'Change Email', 'Change Password'] },
  { label: 'PREFERENCES', items: ['Notification Settings', 'Privacy Settings', 'Data & Storage'] },
  { label: 'ABOUT', items: ['Terms of Service', 'Privacy Policy', 'Contact Support', 'Rate the App'] },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useUserStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/onboarding');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || '?')[0]}</Text></View>
          <View>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            <Text style={styles.userLevel}>{user.level}</Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.label} style={styles.section}>
            <SectionHeader label={section.label} style={styles.sectionLabel} />
            <View style={styles.card}>
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
        <Text style={styles.version}>JAY v0.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  userName: { fontSize: 16, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  userLevel: { fontSize: 13, color: '#999', fontFamily: 'Outfit', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionLabel: { marginBottom: 10 },
  card: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, paddingHorizontal: 14 },
  signOutBtn: { alignItems: 'center', paddingVertical: 14, borderWidth: 0.5, borderColor: '#E53935', borderRadius: 12, marginTop: 8 },
  signOutText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: '#E53935' },
  version: { fontSize: 12, color: '#C0C0C0', textAlign: 'center', marginTop: 16, fontFamily: 'Outfit' },
});
