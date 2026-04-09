import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable,
  ActivityIndicator, Linking, TextInput, Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import Svg, { Path } from 'react-native-svg';
import { TopBar } from '../../components/ui/TopBar';
import { researchService, type ResearchReport } from '../../services/research';
import { useTheme } from '../../lib/theme';
import { RADIUS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/* ── Stage Progress ──────────────────────────────────────────── */

const STAGES = [
  { key: 'identify', label: 'Identifying Product' },
  { key: 'researching', label: 'Starting Research' },
  { key: 'ingredients', label: 'Ingredients', field: 'ingredients_analysis' },
  { key: 'reviews', label: 'User Reviews', field: 'review_synthesis' },
  { key: 'experts', label: 'Expert Reviews', field: 'expert_reviews' },
  { key: 'brand', label: 'Brand Intel', field: 'brand_intelligence' },
  { key: 'claims', label: 'Claims & Alts', field: 'claims_alternatives' },
  { key: 'compiling', label: 'Compiling Report' },
];

function StageTracker({ report }: { report: ResearchReport | null }) {
  const { colors } = useTheme();
  const stage = report?.current_stage;

  return (
    <View style={st.tracker}>
      {STAGES.map((s) => {
        // A stage is done if: its field has data, or we're past it
        const fieldData = s.field ? (report as any)?.[s.field] : null;
        const isDone = fieldData || stage === 'compiling' || stage === 'done' ||
          (s.key === 'identify' && report?.product_data) ||
          (s.key === 'researching' && (report?.ingredients_analysis || report?.review_synthesis));
        const isActive = s.key === stage;

        return (
          <View key={s.key} style={st.stageRow}>
            <View style={[
              st.dot,
              isDone && { backgroundColor: colors.systemGreen },
              isActive && { backgroundColor: colors.systemBlue },
              !isDone && !isActive && { backgroundColor: colors.quaternarySystemFill },
            ]}>
              {isDone ? (
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M20 6L9 17l-5-5" /></Svg>
              ) : isActive ? (
                <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.5 }] }} />
              ) : null}
            </View>
            <Text style={[st.label, {
              color: isDone ? colors.systemGreen : isActive ? colors.label : colors.tertiaryLabel,
              fontFamily: isActive ? 'Outfit-SemiBold' : 'Outfit',
            }]}>
              {s.label}{isActive ? '...' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */

function Skeleton({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  const { isDark } = useTheme();
  const op = useRef(new RNAnimated.Value(0.3)).current;
  useEffect(() => {
    const a = RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(op, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      RNAnimated.timing(op, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);
  return <RNAnimated.View style={{ width: width as any, height, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', opacity: op }} />;
}

function SkeletonSection({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
      <Text style={[s.cardTitle, { color: colors.tertiaryLabel }]}>{title}</Text>
      <View style={{ gap: 8, marginTop: 8 }}><Skeleton width="90%" /><Skeleton /><Skeleton width="75%" /></View>
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

/* ── Markdown Section Card ───────────────────────────────────── */

function MarkdownSection({ title, content, defaultOpen = false }: { title: string; content: string | null; defaultOpen?: boolean }) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  if (!content || content.startsWith('[RESEARCH FAILED')) return null;

  const mdStyles = {
    body: { color: colors.secondaryLabel, fontSize: 13, fontFamily: 'Outfit', lineHeight: 20 },
    heading1: { color: colors.label, fontSize: 18, fontFamily: 'Outfit-Bold', marginTop: 12, marginBottom: 6 },
    heading2: { color: colors.label, fontSize: 16, fontFamily: 'Outfit-SemiBold', marginTop: 10, marginBottom: 4 },
    heading3: { color: colors.label, fontSize: 14, fontFamily: 'Outfit-SemiBold', marginTop: 8, marginBottom: 4 },
    strong: { color: colors.label, fontFamily: 'Outfit-SemiBold' },
    em: { fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    table: { borderColor: colors.separator, marginVertical: 8 },
    thead: { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
    th: { color: colors.label, fontSize: 12, fontFamily: 'Outfit-SemiBold', padding: 6 },
    td: { color: colors.secondaryLabel, fontSize: 12, fontFamily: 'Outfit', padding: 6, borderColor: colors.separator },
    tr: { borderColor: colors.separator },
    link: { color: colors.systemBlue },
    blockquote: { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderLeftColor: colors.systemBlue, borderLeftWidth: 3, paddingLeft: 12, marginVertical: 8 },
    code_inline: { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontSize: 12, fontFamily: 'Courier', paddingHorizontal: 4, borderRadius: 3 },
    fence: { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 8, marginVertical: 8 },
    code_block: { fontSize: 11, fontFamily: 'Courier', color: colors.secondaryLabel },
  };

  // Preview: first ~150 chars of cleaned text
  const preview = content.replace(/[#*_`|>\[\]()]/g, '').replace(/\n+/g, ' ').trim().slice(0, 150);

  return (
    <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
      <Pressable onPress={() => setOpen(!open)} style={s.cardHeader}>
        <Text style={[s.cardTitle, { color: colors.label }]}>{title}</Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth={2}>
          <Path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </Svg>
      </Pressable>
      {open ? (
        <Markdown style={mdStyles} onLinkPress={(url: string) => { Linking.openURL(url); return false; }}>
          {content}
        </Markdown>
      ) : (
        <Text numberOfLines={2} style={[s.preview, { color: colors.tertiaryLabel }]}>{preview}...</Text>
      )}
    </View>
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
    setReport(null);

    try {
      const status = await researchService.start(name.trim(), productId);
      if (status.status === 'completed') {
        const full = await researchService.getStatus(status.id);
        setReport(full);
        setPolling(false);
        setLoading(false);
        return;
      }

      const rid = status.id;
      pollRef.current = setInterval(async () => {
        try {
          const updated = await researchService.getStatus(rid);
          setReport(updated); // Always update — shows partial data

          if (updated.status === 'completed') {
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

  // ── Search screen ──────────────────────────────────────────
  if (!loading && !report && !polling) {
    return (
      <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <TopBar title="JAY Research" />
        <View style={s.searchContainer}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth={1.5} strokeLinecap="round">
            <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </Svg>
          <Text style={[s.searchTitle, { color: colors.label }]}>Product Research</Text>
          <Text style={[s.searchDesc, { color: colors.secondaryLabel }]}>
            AI-powered deep analysis — ingredients, reviews, expert opinions, brand intelligence, and a scored report card.
          </Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.secondarySystemBackground, color: colors.label, borderColor: colors.separator }]}
            placeholder="e.g. Minimalist Vitamin C Serum"
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

  // ── Report (progressive) ───────────────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <TopBar title="JAY Research" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Header */}
        {pd ? (
          <View style={s.header}>
            <Text style={[s.productName, { color: colors.label }]}>{pd.product_name || report?.product_name}</Text>
            {pd.brand && <Text style={[s.brandName, { color: colors.secondaryLabel }]}>{pd.brand} · {pd.category}</Text>}
            {pd.price && (
              <Text style={[s.meta, { color: colors.tertiaryLabel }]}>
                {pd.price.amount} {pd.price.currency} / {pd.price.size}
              </Text>
            )}
          </View>
        ) : (
          <View style={s.header}>
            <Text style={[s.productName, { color: colors.label }]}>{report?.product_name || searchText}</Text>
            <Skeleton width="50%" height={14} />
          </View>
        )}

        {/* Stage Progress (while running) */}
        {!isComplete && <StageTracker report={report} />}

        {/* TL;DR */}
        {report?.tldr ? (
          <View style={[s.tldrCard, { backgroundColor: isDark ? '#0a1628' : '#EEF2FF' }]}>
            <Text style={[s.tldrLabel, { color: colors.systemBlue }]}>TL;DR</Text>
            <Text style={[s.tldrText, { color: colors.label }]}>
              {report.tldr.replace(/^##\s*TL;DR[^\n]*\n?/i, '').trim()}
            </Text>
          </View>
        ) : !isComplete ? (
          <View style={[s.tldrCard, { backgroundColor: isDark ? '#0a1628' : '#EEF2FF' }]}>
            <Text style={[s.tldrLabel, { color: colors.systemBlue }]}>TL;DR</Text>
            <Skeleton /><Skeleton width="90%" /><Skeleton width="80%" />
          </View>
        ) : null}

        {/* Report Card */}
        {rc ? (
          <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.cardTitle, { color: colors.label }]}>Report Card</Text>
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
          <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[s.cardTitle, { color: colors.tertiaryLabel }]}>Report Card</Text>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={8} />)}
          </View>
        ) : null}

        {/* Research Sections — rendered with Markdown */}
        {report?.ingredients_analysis ? (
          <MarkdownSection title="Ingredient Analysis" content={report.ingredients_analysis} defaultOpen />
        ) : !isComplete ? <SkeletonSection title="Ingredient Analysis" /> : null}

        {report?.review_synthesis ? (
          <MarkdownSection title="User Reviews" content={report.review_synthesis} />
        ) : !isComplete ? <SkeletonSection title="User Reviews" /> : null}

        {report?.expert_reviews ? (
          <MarkdownSection title="Expert & Derm Reviews" content={report.expert_reviews} />
        ) : !isComplete ? <SkeletonSection title="Expert & Derm Reviews" /> : null}

        {report?.brand_intelligence ? (
          <MarkdownSection title="Brand Intelligence" content={report.brand_intelligence} />
        ) : !isComplete ? <SkeletonSection title="Brand Intelligence" /> : null}

        {report?.claims_alternatives ? (
          <MarkdownSection title="Claims & Alternatives" content={report.claims_alternatives} />
        ) : !isComplete ? <SkeletonSection title="Claims & Alternatives" /> : null}

        {report?.usage_protocol && (
          <MarkdownSection title="Usage Protocol" content={report.usage_protocol} defaultOpen />
        )}

        {/* Download PDF */}
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

        {isComplete && report?.duration_seconds && (
          <Text style={[s.disclaimer, { color: colors.tertiaryLabel }]}>
            Researched in {Math.round(report.duration_seconds)}s · {report.model_used || 'Gemini + Groq'}
          </Text>
        )}
        <Text style={[s.disclaimer, { color: colors.tertiaryLabel }]}>
          AI-generated. Consult a dermatologist for personalized advice.
        </Text>
      </ScrollView>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */

const st = StyleSheet.create({
  tracker: { marginBottom: 16, gap: 5 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13 },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 14 },
  productName: { fontSize: 22, fontFamily: 'Outfit-Bold', lineHeight: 28 },
  brandName: { fontSize: 14, fontFamily: 'Outfit', marginTop: 2 },
  meta: { fontSize: 12, fontFamily: 'Outfit', marginTop: 2 },
  tldrCard: { borderRadius: RADIUS.md, padding: 16, marginBottom: 12, gap: 6 },
  tldrLabel: { fontSize: 10, fontFamily: 'Outfit-Bold', letterSpacing: 1 },
  tldrText: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 21 },
  card: { borderRadius: RADIUS.md, padding: 16, marginBottom: 10, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  preview: { fontSize: 12, fontFamily: 'Outfit', lineHeight: 17, marginTop: 4 },
  overallRow: { alignItems: 'center', marginBottom: 8 },
  overallScore: { fontSize: 32, fontFamily: 'Outfit-Bold' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { width: 85, fontSize: 12, fontFamily: 'Outfit' },
  scoreTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 6, borderRadius: 3 },
  scoreValue: { width: 20, fontSize: 13, fontFamily: 'Outfit-Bold', textAlign: 'right' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: RADIUS.md, marginTop: 14 },
  downloadText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  disclaimer: { fontSize: 11, fontFamily: 'Outfit', textAlign: 'center', lineHeight: 15, marginTop: 8 },
  searchContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  searchTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', marginTop: 16, marginBottom: 8 },
  searchDesc: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20, textAlign: 'center', marginBottom: 28 },
  input: { width: '100%', fontSize: 16, fontFamily: 'Outfit', paddingHorizontal: 16, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 16 },
  startBtn: { width: '100%', paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  errorText: { fontSize: 13, fontFamily: 'Outfit', marginTop: 12, textAlign: 'center' },
});
