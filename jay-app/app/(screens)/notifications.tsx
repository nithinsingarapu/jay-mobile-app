import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { useTheme } from '../../lib/theme';

const NOTIFICATIONS = [
  { id: '1', title: 'Time for your AM routine', body: "Don't forget your Vitamin C serum!", time: '9:00 AM', unread: true },
  { id: '2', title: 'New insight ready', body: 'Your skin is responding well to niacinamide.', time: 'Yesterday', unread: true },
  { id: '3', title: 'Streak milestone!', body: "You're on a 12-day streak. Keep it up!", time: '2 days ago', unread: false },
  { id: '4', title: 'New Cap or Slap verdict', body: 'We analyzed Tatcha The Dewy Skin Cream.', time: '3 days ago', unread: false },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Notifications" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {NOTIFICATIONS.map((n) => (
          <View key={n.id} style={[styles.notifRow, !n.unread && styles.notifRead]}>
            {n.unread && <View style={styles.unreadDot} />}
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  notifRow: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5', alignItems: 'flex-start' },
  notifRead: { opacity: 0.5 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#000', marginTop: 6, flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  notifBody: { fontSize: 13, color: '#8E8E93', marginTop: 3, fontFamily: 'Outfit' },
  notifTime: { fontSize: 11, color: '#8E8E93', marginTop: 4, fontFamily: 'Outfit' },
});
