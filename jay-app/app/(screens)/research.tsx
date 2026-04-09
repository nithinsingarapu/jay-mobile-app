import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable,
  ActivityIndicator, Linking, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { TopBar } from '../../components/ui/TopBar';
import { researchService, type ResearchReport, type ReportCard } from '../../services/research';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Report Card Score Bar ───────────────────────────────────── */

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const { colors } = useTheme();
  const pct = Math.round((score / max) * 100);
  const color = score >= 8 ? colors.systemGreen : score >= 6 ? colors.systemBlue : score >= 4 ? colors.systemOrange : colors.systemRed;

  return (
    <View style={s.scoreRow}>
      <Text style={[s.scoreLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <View style={[s.scoreTrack, { backgroundColor: colors.quaternarySystemFill }]}>
        <View style={[s.scoreFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.scoreValue, { color: colors.label }]}>{score}/10</Text>
    </View>
  );
}

/* ── Section Card (expandable) ───────────────────────────────── */

function SectionCard({ title, content, defaultOpen = false }: { title: string; content: string | null; defaultOpen?: boolean }) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  if (!content || content.startsWith('[RESEARCH FAILED')) return null;

  // Trim to reasonable preview
  const preview = content.slice(0, 200).replace(/[#*_`]/g, '') + (content.length > 200 ? '...' : '');

  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={[s.sectionCard, { backgroundColor: colors.secondarySystemBackground }]}
    >
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.label }]}>{title}</Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth={2}>
          <Path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </Svg>
      </View>
      {open ? (
        <Text style={[s.sectionBody, { color: colors.secondaryLabel }]}>{content}</Text>
      ) : (
        <Text numberOfLines={2} style={[s.sectionPreview, { color: colors.tertiaryLabel }]}>{preview}</Text>
      )}
    </Pressable>
  );
}

/* ── Main Screen ─────────────────────────────────────────────── */

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();

  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const productId = params.productId ? Number(params.productId) : undefined;
  const productName = (params.productName as string) || '';

  // Check for existing report on mount
  useEffect(() => {
    if (productId) {
      (async () => {
        setLoading(true);
        try {
          const existing = await researchService.getByProduct(productId);
          if (existing && existing.status === 'completed') {
            setReport(existing);
          } else {
            setSearchText(productName);
          }
        } catch { /* no cached report */ }
        setLoading(false);
      })();
    } else if (productName) {
      setSearchText(productName);
    }
  }, []);

  // Polling for background research
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startResearch = async (name: string) => {
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    setPolling(true);

    try {
      const status = await researchService.start(name.trim(), productId);

      if (status.status === 'completed') {
        // Already cached
        const full = await researchService.getStatus(status.id);
        setReport(full);
        setPolling(false);
        setLoading(false);
        return;
      }

      // Poll every 10 seconds
      const researchId = status.id;
      pollRef.current = setInterval(async () => {
        try {
          const updated = await researchService.getStatus(researchId);
          if (updated.status === 'completed') {
            setReport(updated);
            setPolling(false);
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (updated.status === 'failed') {
            setError(updated.error_message || 'Research failed');
            setPolling(false);
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 10000);

    } catch (e: any) {
      setError(e.message || 'Failed to start research');
      setPolling(false);
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!report) return;
    const url = researchService.getPdfUrl(report.id, API_URL);
    Linking.openURL(url);
  };

  // ── Loading / Polling state ────────────────────────────────
  if (loading && !report) {
    return (
      <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="JAY Research" />
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.systemBlue} />
          <Text style={[s.loadingTitle, { color: colors.label }]}>
            {polling ? 'Researching...' : 'Loading...'}
          </Text>
          {polling && (
            <>
              <Text style={[s.loadingDesc, { color: colors.secondaryLabel }]}>
                JAY is analyzing this product from multiple sources.{'\n'}
                This takes 2-5 minutes.
              </Text>
              <View style={s.stageList}>
                <Text style={[s.stageItem, { color: colors.tertiaryLabel }]}>Stage 1: Identifying product...</Text>
                <Text style={[s.stageItem, { color: colors.tertiaryLabel }]}>Stage 2: 5 parallel research branches</Text>
                <Text style={[s.stageItem, { color: colors.tertiaryLabel }]}>Stage 3: Compiling report</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── No report yet — show search ────────────────────────────
  if (!report) {
    return (
      <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="JAY Research" />
        <View style={s.searchContainer}>
          <Text style={[s.searchTitle, { color: colors.label }]}>Product Research</Text>
          <Text style={[s.searchDesc, { color: colors.secondaryLabel }]}>
            Enter a product name for a comprehensive AI-powered analysis — ingredients, reviews, expert opinions, and more.
          </Text>
          <TextInput
            style={[s.searchInput, {
              backgroundColor: colors.secondarySystemBackground,
              color: colors.label,
              borderColor: colors.separator,
            }]}
            placeholder="e.g. CeraVe Moisturizing Cream"
            placeholderTextColor={colors.tertiaryLabel}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => startResearch(searchText)}
          />
          <Pressable
            onPress={() => startResearch(searchText)}
            style={[s.startBtn, { backgroundColor: colors.systemBlue, opacity: searchText.trim() ? 1 : 0.5 }]}
            disabled={!searchText.trim()}
          >
            <Text style={s.startBtnText}>Start Research</Text>
          </Pressable>
          {error ? <Text style={[s.errorText, { color: colors.systemRed }]}>{error}</Text> : null}
        </View>
      </View>
    );
  }

  // ── Report display ─────────────────────────────────────────
  const rc = report.report_card;
  const pd = report.product_data;

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="JAY Research" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Product header */}
        <View style={s.header}>
          <Text style={[s.productName, { color: colors.label }]}>{report.product_name}</Text>
          {report.brand && <Text style={[s.brandName, { color: colors.secondaryLabel }]}>{report.brand}</Text>}
          {report.duration_seconds && (
            <Text style={[s.meta, { color: colors.tertiaryLabel }]}>
              Researched in {Math.round(report.duration_seconds)}s | {report.model_used}
            </Text>
          )}
        </View>

        {/* TL;DR */}
        {report.tldr && (
          <View style={[s.tldrCard, { backgroundColor: isDark ? '#0a1628' : '#EEF2FF' }]}>
            <Text style={[s.tldrLabel, { color: colors.systemBlue }]}>TL;DR</Text>
            <Text style={[s.tldrText, { color: colors.label }]}>{report.tldr.replace(/^## TL;DR.*\n?/i, '').trim()}</Text>
          </View>
        )}

        {/* Report Card */}
        {rc && (
          <View style={[s.reportCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.reportCardTitle, { color: colors.label }]}>Report Card</Text>
            {rc.overall && (
              <View style={s.overallRow}>
                <Text style={[s.overallScore, { color: rc.overall >= 7 ? colors.systemGreen : rc.overall >= 5 ? colors.systemOrange : colors.systemRed }]}>
                  {rc.overall}/10
                </Text>
                <Text style={[s.overallLabel, { color: colors.secondaryLabel }]}>Overall Score</Text>
              </View>
            )}
            {rc.ingredient_quality != null && <ScoreBar label="Ingredients" score={rc.ingredient_quality} />}
            {rc.formula_safety != null && <ScoreBar label="Safety" score={rc.formula_safety} />}
            {rc.value_for_money != null && <ScoreBar label="Value" score={rc.value_for_money} />}
            {rc.brand_transparency != null && <ScoreBar label="Transparency" score={rc.brand_transparency} />}
            {rc.user_satisfaction != null && <ScoreBar label="User Reviews" score={rc.user_satisfaction} />}
            {rc.derm_endorsement != null && <ScoreBar label="Derm Rating" score={rc.derm_endorsement} />}
          </View>
        )}

        {/* Product Details */}
        {pd && (
          <View style={[s.detailsCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.detailsTitle, { color: colors.label }]}>Product Details</Text>
            {pd.category && <Text style={[s.detailRow, { color: colors.secondaryLabel }]}>Category: {pd.category}</Text>}
            {pd.price && <Text style={[s.detailRow, { color: colors.secondaryLabel }]}>Price: {pd.price.amount} {pd.price.currency} / {pd.price.size}</Text>}
            {pd.target_skin_type && <Text style={[s.detailRow, { color: colors.secondaryLabel }]}>For: {pd.target_skin_type}</Text>}
            {pd.primary_market && <Text style={[s.detailRow, { color: colors.secondaryLabel }]}>Market: {pd.primary_market}</Text>}
            {pd.key_claims?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[s.detailRow, { color: colors.label, fontFamily: 'Outfit-SemiBold' }]}>Claims:</Text>
                {pd.key_claims.map((c: string, i: number) => (
                  <Text key={i} style={[s.detailRow, { color: colors.secondaryLabel }]}>  • {c}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Research Sections */}
        <SectionCard title="Ingredient Analysis" content={report.ingredients_analysis} defaultOpen />
        <SectionCard title="User Reviews" content={report.review_synthesis} />
        <SectionCard title="Expert & Derm Reviews" content={report.expert_reviews} />
        <SectionCard title="Brand Intelligence" content={report.brand_intelligence} />
        <SectionCard title="Claims & Alternatives" content={report.claims_alternatives} />

        {/* Usage Protocol */}
        {report.usage_protocol && (
          <SectionCard title="Usage Protocol" content={report.usage_protocol} defaultOpen />
        )}

        {/* Download PDF */}
        <Pressable onPress={downloadPdf} style={[s.downloadBtn, { backgroundColor: colors.systemBlue }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <Path d="M7 10l5 5 5-5" />
            <Path d="M12 15V3" />
          </Svg>
          <Text style={s.downloadText}>Download PDF Report</Text>
        </Pressable>

        {/* Disclaimer */}
        <Text style={[s.disclaimer, { color: colors.tertiaryLabel }]}>
          This report is AI-generated for informational purposes only. Consult a licensed dermatologist for personalized advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  loadingTitle: { fontSize: 18, fontFamily: 'Outfit-SemiBold', marginTop: 16 },
  loadingDesc: { fontSize: 14, fontFamily: 'Outfit', textAlign: 'center', lineHeight: 20 },
  stageList: { marginTop: 16, gap: 8 },
  stageItem: { fontSize: 13, fontFamily: 'Outfit' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  productName: { fontSize: 24, fontFamily: 'Outfit-Bold', lineHeight: 30 },
  brandName: { fontSize: 15, fontFamily: 'Outfit', marginTop: 4 },
  meta: { fontSize: 12, fontFamily: 'Outfit', marginTop: 4 },
  tldrCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 16 },
  tldrLabel: { fontSize: 11, fontFamily: 'Outfit-Bold', letterSpacing: 1, marginBottom: 6 },
  tldrText: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 21 },
  reportCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 16 },
  reportCardTitle: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 12 },
  overallRow: { alignItems: 'center', marginBottom: 16 },
  overallScore: { fontSize: 36, fontFamily: 'Outfit-Bold' },
  overallLabel: { fontSize: 12, fontFamily: 'Outfit', marginTop: 2 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreLabel: { width: 85, fontSize: 12, fontFamily: 'Outfit' },
  scoreTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 6, borderRadius: 3 },
  scoreValue: { width: 35, fontSize: 12, fontFamily: 'Outfit-SemiBold', textAlign: 'right' },
  detailsCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 16 },
  detailsTitle: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 8 },
  detailRow: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 20 },
  sectionCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  sectionPreview: { fontSize: 12, fontFamily: 'Outfit', marginTop: 6, lineHeight: 17 },
  sectionBody: { fontSize: 13, fontFamily: 'Outfit', marginTop: 10, lineHeight: 20 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: RADIUS.md, marginTop: 16, marginBottom: 8 },
  downloadText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  disclaimer: { fontSize: 11, fontFamily: 'Outfit', textAlign: 'center', lineHeight: 15, marginTop: 12 },
  searchContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  searchTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', marginBottom: 8 },
  searchDesc: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20, marginBottom: 24 },
  searchInput: { fontSize: 16, fontFamily: 'Outfit', paddingHorizontal: 16, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 16 },
  startBtn: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  errorText: { fontSize: 13, fontFamily: 'Outfit', marginTop: 12, textAlign: 'center' },
});
