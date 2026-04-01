import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { TopBar } from '../../../components/ui/TopBar';
import { ScoreRing } from '../../../components/ui/ScoreRing';
import { Button } from '../../../components/ui/Button';
import { mockResearchProduct } from '../../../constants/mockData';
import { useTheme } from '../../../lib/theme';

function ModuleStatusIcon({ status }: { status: 'done' | 'in-progress' | 'pending' }) {
  if (status === 'done') {
    return (
      <View style={[styles.statusIcon, styles.statusDone]}>
        <Svg width={10} height={10} viewBox="0 0 12 12">
          <Path d="M2 6l3 3 5-5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }
  if (status === 'in-progress') {
    return (
      <View style={[styles.statusIcon, styles.statusInProgress]}>
        <View style={styles.diamond} />
      </View>
    );
  }
  return <View style={[styles.statusIcon, styles.statusPending]} />;
}

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { name, brand, price, jayScore, recommendation, modules } = mockResearchProduct;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="Jay Research" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Product hero */}
        <View style={styles.heroCard}>
          <View style={styles.productCircle}>
            <Text style={styles.productInitial}>{name[0]}</Text>
          </View>
          <Text style={styles.productName}>{name}</Text>
          <Text style={styles.brandText}>{brand} · ₹{price}</Text>
          <View style={styles.scoreRow}>
            <ScoreRing score={jayScore} size={72} />
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>JAY SCORE</Text>
              <Text style={styles.recommendation}>{recommendation}</Text>
            </View>
          </View>
        </View>

        {/* Research modules */}
        <Text style={styles.sectionTitle}>Research Modules</Text>
        <View style={styles.moduleList}>
          {modules.map((module, i) => (
            <Pressable
              key={module.id}
              style={[styles.moduleRow, i < modules.length - 1 && styles.moduleBorder]}
              accessible
              accessibilityLabel={module.name}
            >
              <ModuleStatusIcon status={module.status} />
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleName}>{module.name}</Text>
                <Text style={styles.moduleDesc}>{module.description}</Text>
              </View>
              <Text style={styles.moduleTime}>{module.time}</Text>
            </Pressable>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Add to Routine" variant="primary" />
          <View style={styles.twoButtons}>
            <Button label="Find Dupes" variant="outline" style={{ flex: 1 }} />
            <Button label="Cap or Slap" variant="outline" style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  heroCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginBottom: 24, alignItems: 'center' },
  productCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  productInitial: { fontSize: 24, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  productName: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2, textAlign: 'center', fontFamily: 'Outfit-SemiBold' },
  brandText: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontFamily: 'Outfit' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, width: '100%' },
  scoreInfo: { flex: 1 },
  scoreLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  recommendation: { fontSize: 13, lineHeight: 19, marginTop: 4, fontFamily: 'Outfit' },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
  moduleList: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  moduleBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  statusIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusDone: { backgroundColor: '#000' },
  statusInProgress: { backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#000' },
  statusPending: { borderWidth: 1.5, borderColor: '#E5E5E5' },
  diamond: { width: 8, height: 8, backgroundColor: '#000', transform: [{ rotate: '45deg' }] },
  moduleInfo: { flex: 1 },
  moduleName: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  moduleDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontFamily: 'Outfit' },
  moduleTime: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit' },
  actions: { gap: 10 },
  twoButtons: { flexDirection: 'row', gap: 10 },
});
