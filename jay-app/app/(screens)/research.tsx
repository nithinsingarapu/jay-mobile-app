import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable,
  ActivityIndicator, Linking, TextInput, Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { TopBar } from '../../components/ui/TopBar';
import { researchService, type ResearchReport } from '../../services/research';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Stage Progress Tracker ──────────────────────────────────── */

const STAGES = [
  { key: 'identify', label: 'Identifying Product', icon: '1' },
  { key: 'ingredients', label: 'Ingredient Analysis', icon: '2a' },
  { key: 'reviews', label: 'User Reviews', icon: '2b' },
  { key: 'experts', label: 'Expert Reviews', icon: '2c' },
  { key: 'brand', label: 'Brand Intelligence', icon: '2d' },
  { key: 'claims', label: 'Claims & Alternatives', icon: '2e' },
  { key: 'compiling', label: 'Compiling Report', icon: '3' },
];

function StageTracker({ currentStage }: { currentStage: string | null }) {
  const { colors, isDark } = useTheme();

  const stageIndex = STAGES.findIndex(s => s.key === currentStage);
  const isPastIdentify = currentStage === 'identified' || currentStage === 'researching' || stageIndex > 0;

  return (
    <View style={st.tracker}>
      {STAGES.map((stage, i) => {
        const isActive = stage.key === currentStage;
        const isDone = i < stageIndex || (isPastIdentify && i === 0) ||
          (currentStage === 'researching' && i === 0) ||
          (currentStage === 'compiling' && i < 6) ||
          currentStage === 'done';

        return (
          <View key={stage.key} style={st.stageRow}>
            <View style={[
              st.stageDot,
              isDone && { backgroundColor: colors.systemGreen },
              isActive && { backgroundColor: colors.systemBlue },
              !isDone && !isActive && { backgroundColor: colors.quaternarySystemFill },
            ]}>
              {isDone ? (
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M20 6L9 17l-5-5" /></Svg>
              ) : isActive ? (
                <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.5 }] }} />
              ) : (
                <Text style={st.stageDotText}>{stage.icon}</Text>
              )}
            </View>
            <Text style={[
              st.stageLabel,
              { color: isDone ? colors.systemGreen : isActive ? colors.label : colors.tertiaryLabel },
              isActive && { fontFamily: 'Outfit-SemiBold' },
            ]}>
              {stage.label}
              {isActive && '...'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── Skeleton Loader ─────────────────────────────────────────── */

function SkeletonBlock({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: any }) {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <RNAnimated.View style={[{
      width: width as any, height, borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      opacity,
    }, style]} />
  );
}

function SkeletonSection({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={[s.sectionCard, { backgroundColor: colors.secondarySystemBackground }]}>
      <Text style={[s.sectionTitle, { color: colors.tertiaryLabel }]}>{title}</Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        <SkeletonBlock width="90%" />
        <SkeletonBlock width="100%" />
        <SkeletonBlock width="75%" />
        <SkeletonBlock width="85%" />
      </View>
    </View>
  );
}

/* ── Score Bar ───────────────────────────────────────────────── */

function ScoreBar({ label, score }: { label: string; score: number }) {
  const { colors } = useTheme();
  const pct = Math.round((score / 10) * 100);
  const color = score >= 8 ? colors.systemGreen : score >= 6 ? colors.systemBlue : score >= 4 ? colors.systemOrange : colors.systemRed;
  return (
    <View style={s.scoreRow}>
      <Text style={[s.scoreLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <View style={[s.scoreTrack, { backgroundColor: colors.quaternarySystemFill }]}>
        <View style={[s.scoreFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.scoreValue, { color }]}>{score}</Text>
    </View>
  );
}

/* ── Section Card (expandable) ───────────────────────────────── */

function SectionCard({ title, content, defaultOpen = false }: { title: string; content: string | null; defaultOpen?: boolean }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  if (!content || content.startsWith('[RESEARCH FAILED')) return null;

  const cleaned = content.replace(/^#+\s+.+\n?/gm, '').trim();
  const preview = cleaned.slice(0, 180).replace(/[#*_`|]/g, '');

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
        <Text style={[s.sectionBody, { color: colors.secondaryLabel }]}>{cleaned}</Text>
      ) : (
        <Text numberOfLines={2} style={[s.sectionPreview, { color: colors.tertiaryLabel }]}>{preview}...</Text>
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
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const productId = params.productId ? Number(params.productId) : undefined;
  const productName = (params.productName as string) || '';

  useEffect(() => {
    if (productId) {
      (async () => {
        setLoading(true);
        try {
          const existing = await researchService.getByProduct(productId);
          if (existing && existing.status === 'completed') {
            setReport(existing);
            setLoading(false);
            return;
          }
        } catch {}
        setSearchText(productName);
        setLoading(false);
      })();
    } else if (productName) {
      setSearchText(productName);
    }
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startResearch = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    setPolling(true);
    setCurrentStage('identify');
    setReport(null);

    try {
      const status = await researchService.start(name.trim(), productId);

      if (status.status === 'completed') {
        const full = await researchService.getStatus(status.id);
        setReport(full);
        setPolling(false);
        setLoading(false);
        setCurrentStage('done');
        return;
      }

      const researchId = status.id;
      // Poll every 5 seconds for progressive updates
      pollRef.current = setInterval(async () => {
        try {
          const updated = await researchService.getStatus(researchId);
          setCurrentStage(updated.current_stage);

          // Show partial data as it arrives
          if (updated.product_data || updated.ingredients_analysis || updated.review_synthesis) {
            setReport(updated);
          }

          if (updated.status === 'completed') {
            setReport(updated);
            setPolling(false);
            setLoading(false);
            setCurrentStage('done');
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (updated.status === 'failed') {
            setError(updated.error_message || 'Research failed');
            setPolling(false);
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 5000);

    } catch (e: any) {
      setError(e.message || 'Failed to start');
      setPolling(false);
      setLoading(false);
    }
  }, [productId]);

  const downloadPdf = () => {
    if (!report) return;
    Linking.openURL(researchService.getPdfUrl(report.id, API_URL));
  };

  const isComplete = report?.status === 'completed';
  const pd = report?.product_data;
  const rc = report?.report_card;

  // ── Search screen (no research started) ────────────────────
  if (!loading && !report && !polling) {
    return (
      <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="JAY Research" />
        <View style={s.searchContainer}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth={1.5} strokeLinecap="round">
            <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </Svg>
          <Text style={[s.searchTitle, { color: colors.label }]}>Product Research</Text>
          <Text style={[s.searchDesc, { color: colors.secondaryLabel }]}>
            Get a comprehensive AI-powered analysis — ingredients, expert reviews, user sentiment, brand intelligence, and more.
          </Text>
          <TextInput
            style={[s.searchInput, { backgroundColor: colors.secondarySystemBackground, color: colors.label, borderColor: colors.separator }]}
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

  // ── Report (progressive loading) ───────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="JAY Research" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Product header */}
        {pd ? (
          <View style={s.header}>
            <Text style={[s.productName, { color: colors.label }]}>{pd.product_name || report?.product_name}</Text>
            {pd.brand && <Text style={[s.brandName, { color: colors.secondaryLabel }]}>{pd.brand}</Text>}
            {pd.category && pd.price && (
              <Text style={[s.meta, { color: colors.tertiaryLabel }]}>
                {pd.category} · {pd.price.amount} {pd.price.currency}
              </Text>
            )}
          </View>
        ) : (
          <View style={s.header}>
            <Text style={[s.productName, { color: colors.label }]}>{report?.product_name || searchText}</Text>
            <SkeletonBlock width="60%" height={16} style={{ marginTop: 8 }} />
          </View>
        )}

        {/* Stage Progress (while running) */}
        {!isComplete && <StageTracker currentStage={currentStage} />}

        {/* TL;DR */}
        {report?.tldr ? (
          <View style={[s.tldrCard, { backgroundColor: isDark ? '#0a1628' : '#EEF2FF' }]}>
            <Text style={[s.tldrLabel, { color: colors.systemBlue }]}>TL;DR</Text>
            <Text style={[s.tldrText, { color: colors.label }]}>
              {report.tldr.replace(/^## TL;DR.*\n?/i, '').trim()}
            </Text>
          </View>
        ) : isComplete ? null : (
          <View style={[s.tldrCard, { backgroundColor: isDark ? '#0a1628' : '#EEF2FF' }]}>
            <Text style={[s.tldrLabel, { color: colors.systemBlue }]}>TL;DR</Text>
            <SkeletonBlock width="100%" />
            <SkeletonBlock width="90%" style={{ marginTop: 6 }} />
            <SkeletonBlock width="80%" style={{ marginTop: 6 }} />
          </View>
        )}

        {/* Report Card */}
        {rc ? (
          <View style={[s.reportCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.rcTitle, { color: colors.label }]}>Report Card</Text>
            {rc.overall && (
              <View style={s.overallRow}>
                <Text style={[s.overallScore, { color: rc.overall >= 7 ? colors.systemGreen : rc.overall >= 5 ? colors.systemOrange : colors.systemRed }]}>
                  {rc.overall}/10
                </Text>
              </View>
            )}
            {rc.ingredient_quality != null && <ScoreBar label="Ingredients" score={rc.ingredient_quality} />}
            {rc.formula_safety != null && <ScoreBar label="Safety" score={rc.formula_safety} />}
            {rc.value_for_money != null && <ScoreBar label="Value" score={rc.value_for_money} />}
            {rc.brand_transparency != null && <ScoreBar label="Transparency" score={rc.brand_transparency} />}
            {rc.user_satisfaction != null && <ScoreBar label="Reviews" score={rc.user_satisfaction} />}
            {rc.derm_endorsement != null && <ScoreBar label="Derm Rating" score={rc.derm_endorsement} />}
          </View>
        ) : !isComplete ? (
          <View style={[s.reportCard, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.rcTitle, { color: colors.tertiaryLabel }]}>Report Card</Text>
            {[1,2,3,4,5,6].map(i => <SkeletonBlock key={i} height={8} style={{ marginTop: 12 }} />)}
          </View>
        ) : null}

        {/* Research Sections — show as they arrive, skeleton for pending */}
        {report?.ingredients_analysis ? (
          <SectionCard title="Ingredient Analysis" content={report.ingredients_analysis} defaultOpen />
        ) : !isComplete ? <SkeletonSection title="Ingredient Analysis" /> : null}

        {report?.review_synthesis ? (
          <SectionCard title="User Reviews" content={report.review_synthesis} />
        ) : !isComplete ? <SkeletonSection title="User Reviews" /> : null}

        {report?.expert_reviews ? (
          <SectionCard title="Expert & Derm Reviews" content={report.expert_reviews} />
        ) : !isComplete ? <SkeletonSection title="Expert & Derm Reviews" /> : null}

        {report?.brand_intelligence ? (
          <SectionCard title="Brand Intelligence" content={report.brand_intelligence} />
        ) : !isComplete ? <SkeletonSection title="Brand Intelligence" /> : null}

        {report?.claims_alternatives ? (
          <SectionCard title="Claims & Alternatives" content={report.claims_alternatives} />
        ) : !isComplete ? <SkeletonSection title="Claims & Alternatives" /> : null}

        {report?.usage_protocol && (
          <SectionCard title="Usage Protocol" content={report.usage_protocol} defaultOpen />
        )}

        {/* Download PDF (only when complete) */}
        {isComplete && (
          <Pressable onPress={downloadPdf} style={[s.downloadBtn, { backgroundColor: colors.systemBlue }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <Path d="M7 10l5 5 5-5" />
              <Path d="M12 15V3" />
            </Svg>
            <Text style={s.downloadText}>Download PDF Report</Text>
          </Pressable>
        )}

        {/* Duration */}
        {isComplete && report?.duration_seconds && (
          <Text style={[s.disclaimer, { color: colors.tertiaryLabel }]}>
            Researched in {Math.round(report.duration_seconds)}s using {report.model_used || 'Gemini'}
          </Text>
        )}

        <Text style={[s.disclaimer, { color: colors.tertiaryLabel }]}>
          AI-generated for informational purposes. Consult a dermatologist for personalized advice.
        </Text>
      </ScrollView>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */

const st = StyleSheet.create({
  tracker: { marginBottom: 20, gap: 6 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stageDotText: { fontSize: 8, color: '#999', fontFamily: 'Outfit-SemiBold' },
  stageLabel: { fontSize: 13, fontFamily: 'Outfit' },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 16 },
  productName: { fontSize: 22, fontFamily: 'Outfit-Bold', lineHeight: 28 },
  brandName: { fontSize: 15, fontFamily: 'Outfit', marginTop: 2 },
  meta: { fontSize: 12, fontFamily: 'Outfit', marginTop: 2 },
  tldrCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 14 },
  tldrLabel: { fontSize: 10, fontFamily: 'Outfit-Bold', letterSpacing: 1, marginBottom: 8 },
  tldrText: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 21 },
  reportCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 14 },
  rcTitle: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 10 },
  overallRow: { alignItems: 'center', marginBottom: 12 },
  overallScore: { fontSize: 32, fontFamily: 'Outfit-Bold' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreLabel: { width: 85, fontSize: 12, fontFamily: 'Outfit' },
  scoreTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 6, borderRadius: 3 },
  scoreValue: { width: 20, fontSize: 13, fontFamily: 'Outfit-Bold', textAlign: 'right' },
  sectionCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  sectionPreview: { fontSize: 12, fontFamily: 'Outfit', marginTop: 6, lineHeight: 17 },
  sectionBody: { fontSize: 13, fontFamily: 'Outfit', marginTop: 10, lineHeight: 20 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: RADIUS.md, marginTop: 16, marginBottom: 8 },
  downloadText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  disclaimer: { fontSize: 11, fontFamily: 'Outfit', textAlign: 'center', lineHeight: 15, marginTop: 8, marginBottom: 4 },
  searchContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  searchTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', marginTop: 16, marginBottom: 8 },
  searchDesc: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20, textAlign: 'center', marginBottom: 28 },
  searchInput: { width: '100%', fontSize: 16, fontFamily: 'Outfit', paddingHorizontal: 16, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 16 },
  startBtn: { width: '100%', paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  errorText: { fontSize: 13, fontFamily: 'Outfit', marginTop: 12, textAlign: 'center' },
});
