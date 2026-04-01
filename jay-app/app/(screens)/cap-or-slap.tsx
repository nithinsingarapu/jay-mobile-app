import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { Chip } from '../../components/ui/Chip';
import { mockCapSlapVerdicts } from '../../constants/mockData';
import { useTheme } from '../../lib/theme';

const FILTERS = ['All', 'Products', 'Trends', 'Remedies'];

export default function CapOrSlapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Cap or Slap" />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
        ))}
      </View>
      <FlatList
        data={mockCapSlapVerdicts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.verdictCard}>
            <View style={styles.imageArea}>
              <Text style={styles.emoji}>🧴</Text>
              <View style={[styles.badge, item.verdict === 'SLAP' ? styles.slapBadge : styles.capBadge]}>
                <Text style={styles.badgeText}>{item.verdict}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.productName}>{item.product}</Text>
              <Text style={styles.brandText}>{item.brand}</Text>
              <Text style={[styles.score, item.verdict === 'CAP' && styles.scoreGrey]}>{item.score}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.readMore}>Read full verdict →</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  verdictCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  imageArea: { height: 120, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji: { fontSize: 40, opacity: 0.1 },
  badge: { position: 'absolute', top: 12, right: 12, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  slapBadge: { backgroundColor: '#000' },
  capBadge: { backgroundColor: '#888' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: 'Outfit-Bold' },
  cardBody: { padding: 14 },
  productName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  brandText: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontFamily: 'Outfit' },
  score: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginTop: 8, fontFamily: 'Outfit-Bold' },
  scoreGrey: { color: '#636366' },
  reason: { fontSize: 13, color: '#8E8E93', marginTop: 4, lineHeight: 19, fontFamily: 'Outfit' },
  readMore: { fontSize: 12, fontWeight: '600', marginTop: 10, fontFamily: 'Outfit-SemiBold' },
});
