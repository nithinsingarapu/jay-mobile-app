import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

const actions = [
  { id: 'ask-jay', label: 'Ask JAY', route: '/(tabs)/jay', icon: 'chat' },
  { id: 'scan', label: 'Scan', route: '/(screens)/routine', icon: 'scan' },
  { id: 'research', label: 'Research', route: '/(screens)/research/cerave', icon: 'flask' },
  { id: 'dupes', label: 'Dupes', route: '/(screens)/dupe-finder', icon: 'swap' },
  { id: 'routine', label: 'Routine', route: '/(screens)/routine', icon: 'clock' },
  { id: 'insights', label: 'Insights', route: '/(screens)/intelligence', icon: 'chart' },
  { id: 'diet', label: 'Diet', route: '/(screens)/diet-planner', icon: 'leaf' },
  { id: 'community', label: 'Community', route: '/(screens)/community', icon: 'users' },
];

function ActionIcon({ icon }: { icon: string }) {
  const p = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: '#000', strokeWidth: '1.5', strokeLinecap: 'round' as const };
  switch (icon) {
    case 'chat': return <Svg {...p}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
    case 'scan': return <Svg {...p}><Rect x="3" y="3" width="18" height="18" rx="2" /><Path d="M8 3v18M3 8h5M3 16h5" /></Svg>;
    case 'flask': return <Svg {...p}><Path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4l-5.1-10.2a2 2 0 0 1-.2-.9V2" /><Path d="M8.5 2h7" /></Svg>;
    case 'swap': return <Svg {...p}><Path d="M16 3l5 5-5 5" /><Path d="M21 8H9" /><Path d="M8 21l-5-5 5-5" /><Path d="M3 16h12" /></Svg>;
    case 'clock': return <Svg {...p}><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>;
    case 'chart': return <Svg {...p}><Path d="M12 20v-6M6 20V10M18 20V4" /></Svg>;
    case 'leaf': return <Svg {...p}><Path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1 1.5-1 5.5c4-2 6-3.5 6-3.5s.5 2-3 6-4 4-7 6.5" /><Path d="M2 21c0-3 1.5-5.5 4-8" /></Svg>;
    case 'users': return <Svg {...p}><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
    default: return null;
  }
}

export function QuickActionsGrid() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>EXPLORE</Text>
      <FlatList
        data={actions}
        numColumns={4}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.actionItem} onPress={() => router.push(item.route as any)} accessible accessibilityLabel={item.label} accessibilityRole="button">
            <View style={styles.iconCircle}><ActionIcon icon={item.icon} /></View>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 28 },
  label: { fontSize: 10, fontWeight: '600', color: '#999', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Outfit-SemiBold' },
  row: { justifyContent: 'space-between' },
  actionItem: { flex: 1, alignItems: 'center', gap: 9, paddingVertical: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, color: '#666', fontWeight: '500', fontFamily: 'Outfit-Medium' },
});
