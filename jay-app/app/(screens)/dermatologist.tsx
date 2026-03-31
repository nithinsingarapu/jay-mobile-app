import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Platform, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { TopBar } from '../../components/ui/TopBar';
import { SearchBar } from '../../components/ui/SearchBar';
import { Chip } from '../../components/ui/Chip';
import { mockDermatConditions, mockFAQs } from '../../constants/mockData';

const FILTERS = ['Acne Specialist', 'Cosmetic', 'Teleconsult'];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      style={styles.faqItem}
      onPress={() => {
        if (Platform.OS !== 'web') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setOpen(!open);
      }}
      accessible
      accessibilityLabel={question}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round">
          <Polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
        </Svg>
      </View>
      {open && <Text style={styles.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

export default function DermatologistScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title="Dermatologist Guide" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>When should you see a dermatologist?</Text>
          <Text style={styles.heroDesc}>Some skin conditions need professional attention. JAY helps you recognize when OTC products aren't enough.</Text>
        </View>

        {/* Conditions grid */}
        <Text style={styles.sectionTitle}>Common Conditions</Text>
        <View style={styles.conditionsGrid}>
          {mockDermatConditions.map((c) => (
            <Pressable key={c.id} style={styles.conditionCell}>
              <Text style={styles.conditionEmoji}>{c.emoji}</Text>
              <Text style={styles.conditionName}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Find a dermatologist */}
        <Text style={styles.sectionTitle}>Find a Dermatologist</Text>
        <View style={styles.searchWrapper}>
          <SearchBar placeholder="Search by location..." />
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f === activeFilter ? '' : f)} />
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>FAQ</Text>
        <View style={styles.faqList}>
          {mockFAQs.map((faq) => (
            <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  heroCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginBottom: 28 },
  heroTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22, fontFamily: 'Outfit-SemiBold' },
  heroDesc: { fontSize: 13, color: '#666', marginTop: 8, lineHeight: 19, fontFamily: 'Outfit' },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, marginBottom: 14, fontFamily: 'Outfit-SemiBold' },
  conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  conditionCell: { width: '47%', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8 },
  conditionEmoji: { fontSize: 28 },
  conditionName: { fontSize: 13, fontWeight: '600', textAlign: 'center', fontFamily: 'Outfit-SemiBold' },
  searchWrapper: { marginBottom: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  faqList: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, overflow: 'hidden' },
  faqItem: { paddingHorizontal: 14, paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '500', fontFamily: 'Outfit-Medium', marginRight: 8 },
  faqAnswer: { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 10, fontFamily: 'Outfit' },
});
