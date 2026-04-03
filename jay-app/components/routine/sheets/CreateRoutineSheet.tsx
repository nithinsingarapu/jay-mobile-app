/**
 * CreateRoutineSheet — Smart 2-step creation flow.
 *
 * Step 1: When (session) + What (routine type)
 * Step 2: How to build (only shown if type needs it)
 *
 * Smart shortcuts:
 * - "Let JAY decide" → skips step 2, goes directly to AI build
 * - "Choose from Library" → closes sheet, callback to switch to Library tab
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  TextInput, ScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView, BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../lib/theme';
import { SPACE, RADIUS } from '../../../constants/theme';
import { routineService } from '../../../services/routine';
import type { RoutineTypeInfo } from '../../../types/routine';

// ── Types ───────────────────────────────────────────────────────────────

export interface CreateRoutineData {
  routineType: string;
  routineTypeName: string;
  buildMethod: 'jay' | 'scratch';
  sessionName: string;
  routineName?: string;
  messageToJay?: string;
}

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (data: CreateRoutineData) => void;
  onBrowseLibrary?: () => void;
}

// ── Session presets ─────────────────────────────────────────────────────

const SESSIONS = [
  { value: 'full_day', label: 'Full Day', emoji: '🌤️', desc: 'Complete AM + PM routine' },
  { value: 'morning', label: 'Morning', emoji: '🌅', desc: 'Wake-up skincare' },
  { value: 'afternoon', label: 'Afternoon', emoji: '☀️', desc: 'Midday touch-up' },
  { value: 'evening', label: 'Evening', emoji: '🌆', desc: 'Post-work wind-down' },
  { value: 'night', label: 'Night', emoji: '🌙', desc: 'Before-bed repair' },
];

// ── Routine type options ────────────────────────────────────────────────

interface TypeOption {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  tint: string; // color key from theme
  isSpecial?: boolean;
}

const SMART_TYPES: TypeOption[] = [
  { id: 'jay_decide', emoji: '🤖', name: 'Let JAY decide', desc: 'AI analyzes your skin and builds the perfect routine', tint: 'systemBlue', isSpecial: true },
  { id: 'library', emoji: '📚', name: 'Choose from Library', desc: 'Browse 40+ routines — K-beauty, acne, anti-aging...', tint: 'systemIndigo', isSpecial: true },
];

const CORE_TYPES: TypeOption[] = [
  { id: 'essential', emoji: '🌿', name: 'Essential', desc: '3 steps · Cleanser + moisturizer + SPF', tint: 'systemGreen' },
  { id: 'complete', emoji: '⭐', name: 'Complete', desc: '5-6 steps · Serums + actives included', tint: 'systemBlue' },
  { id: 'glass_skin', emoji: '✨', name: 'Glass Skin', desc: '8-10 steps · K-beauty layered hydration', tint: 'systemTeal' },
  { id: 'barrier_repair', emoji: '🛡️', name: 'Barrier Repair', desc: '3 steps · Gentle, ceramide-focused recovery', tint: 'systemOrange' },
  { id: 'anti_acne', emoji: '🎯', name: 'Anti-Acne', desc: '4-5 steps · BHA + niacinamide protocol', tint: 'systemRed' },
  { id: 'custom', emoji: '✏️', name: 'Custom', desc: 'Start empty — add your own steps', tint: 'systemGray' },
];

// ── Check SVG ───────────────────────────────────────────────────────────

const Check = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 20 20">
    <Path d="M4 10.5L8 14.5L16 5.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export function CreateRoutineSheet({ sheetRef, onCreated, onBrowseLibrary }: Props) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['82%'], []);

  const [step, setStep] = useState(0); // 0 = when+what, 1 = how (only for specific types)
  const [session, setSession] = useState('morning');
  const [customSession, setCustomSession] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [messageToJay, setMessageToJay] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setSession('morning');
    setCustomSession('');
    setSelectedType(null);
    setRoutineName('');
    setMessageToJay('');
    setSubmitting(false);
  }, []);

  const finalSession = customSession.trim() || session;
  const sessionLabel = finalSession.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  // ── Type selection handler (smart routing) ──────────────────────────

  const handleTypeSelect = useCallback((typeId: string) => {
    if (typeId === 'jay_decide') {
      // Skip step 2 — go directly to AI build
      setSubmitting(true);
      onCreated({
        routineType: 'auto',
        routineTypeName: 'JAY\'s Pick',
        buildMethod: 'jay',
        sessionName: finalSession,
        routineName: routineName.trim() || `${sessionLabel} Routine`,
        messageToJay: messageToJay.trim() || undefined,
      });
      setTimeout(reset, 400);
      return;
    }

    if (typeId === 'library') {
      // Close sheet and switch to Library tab
      sheetRef.current?.close();
      setTimeout(() => {
        onBrowseLibrary?.();
        reset();
      }, 300);
      return;
    }

    if (typeId === 'custom') {
      // Custom = start empty, skip step 2
      setSubmitting(true);
      onCreated({
        routineType: 'custom',
        routineTypeName: 'Custom',
        buildMethod: 'scratch',
        sessionName: finalSession,
        routineName: routineName.trim() || `${sessionLabel} Routine`,
        messageToJay: undefined,
      });
      setTimeout(reset, 400);
      return;
    }

    // Specific type selected → go to step 2 (choose build method)
    setSelectedType(typeId);
    setStep(1);
  }, [finalSession, sessionLabel, routineName, onCreated, onBrowseLibrary, sheetRef, reset]);

  // ── Build method handler ────────────────────────────────────────────

  const handleBuild = useCallback((method: 'jay' | 'scratch') => {
    if (submitting || !selectedType) return;
    setSubmitting(true);
    const typeInfo = CORE_TYPES.find(t => t.id === selectedType);
    onCreated({
      routineType: selectedType,
      routineTypeName: typeInfo?.name || selectedType,
      buildMethod: method,
      sessionName: finalSession,
      routineName: routineName.trim() || `${sessionLabel} — ${typeInfo?.name || 'Routine'}`,
      messageToJay: method === 'jay' ? (messageToJay.trim() || undefined) : undefined,
    });
    setTimeout(reset, 400);
  }, [submitting, selectedType, finalSession, sessionLabel, routineName, onCreated, reset]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} pressBehavior="close" />
    ), [],
  );

  // ═══════════════════════════════════════════════════════════════════
  // STEP 0: When + What
  // ═══════════════════════════════════════════════════════════════════

  const renderStep0 = () => (
    <View>
      {/* Routine name (optional) */}
      <Text style={[$.label, { color: colors.secondaryLabel }]}>NAME (OPTIONAL)</Text>
      <View style={[$.inputWrap, { backgroundColor: colors.tertiarySystemFill }]}>
        <TextInput
          style={[$.input, { color: colors.label }]}
          placeholder="e.g. Summer Glow, Barrier Fix..."
          placeholderTextColor={colors.quaternaryLabel}
          value={routineName}
          onChangeText={setRoutineName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Message to JAY (optional) */}
      <Text style={[$.label, { color: colors.secondaryLabel }]}>TELL JAY ANYTHING (OPTIONAL)</Text>
      <View style={[$.inputWrap, { backgroundColor: colors.tertiarySystemFill }]}>
        <TextInput
          style={[$.input, $.messageInput, { color: colors.label }]}
          placeholder="e.g. Budget under ₹1000, focus on acne scars, no fragrance, I have sensitive skin around eyes..."
          placeholderTextColor={colors.quaternaryLabel}
          value={messageToJay}
          onChangeText={setMessageToJay}
          multiline
          textAlignVertical="top"
          numberOfLines={3}
        />
      </View>

      {/* When */}
      <Text style={[$.sectionHeader, { color: colors.label }]}>When?</Text>
      <View style={[$.groupedTable, { backgroundColor: colors.tertiarySystemFill }]}>
        {SESSIONS.map((s, i) => {
          const active = !customSession.trim() && session === s.value;
          return (
            <Pressable
              key={s.value}
              onPress={() => { setSession(s.value); setCustomSession(''); }}
              style={[
                $.row,
                i < SESSIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                active && { backgroundColor: colors.systemBlue + '08' },
              ]}
            >
              <Text style={$.rowEmoji}>{s.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[$.rowTitle, { color: colors.label }]}>{s.label}</Text>
                <Text style={[$.rowSub, { color: colors.tertiaryLabel }]}>{s.desc}</Text>
              </View>
              {active && <Check color={colors.systemBlue} />}
            </Pressable>
          );
        })}
      </View>

      {/* Custom session */}
      <View style={[$.customRow, {
        backgroundColor: colors.tertiarySystemFill,
        borderColor: customSession.trim() ? colors.systemBlue : 'transparent',
        borderWidth: customSession.trim() ? 1.5 : 0,
      }]}>
        <Text style={{ fontSize: 14, color: colors.tertiaryLabel }}>Or:</Text>
        <TextInput
          style={[$.customInput, { color: colors.label }]}
          placeholder="Custom session name..."
          placeholderTextColor={colors.quaternaryLabel}
          value={customSession}
          onChangeText={setCustomSession}
          autoCapitalize="words"
        />
      </View>

      {/* What kind */}
      <Text style={[$.sectionHeader, { color: colors.label, marginTop: SPACE.xxl }]}>What kind?</Text>

      {/* Smart options */}
      {SMART_TYPES.map((t, i) => {
        const tint = (colors as any)[t.tint] || colors.systemBlue;
        return (
          <Pressable
            key={t.id}
            onPress={() => handleTypeSelect(t.id)}
            style={[$.smartCard, { backgroundColor: tint + '08', borderColor: tint + '20' }]}
          >
            <View style={[$.smartIcon, { backgroundColor: tint + '18' }]}>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[$.smartName, { color: tint }]}>{t.name}</Text>
              <Text style={[$.smartDesc, { color: colors.secondaryLabel }]}>{t.desc}</Text>
            </View>
            <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
              <Path d="M1 1l6 6-6 6" stroke={tint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        );
      })}

      {/* Core types */}
      <Text style={[$.label, { color: colors.secondaryLabel, marginTop: SPACE.lg }]}>OR CHOOSE A TYPE</Text>
      <View style={[$.groupedTable, { backgroundColor: colors.tertiarySystemFill }]}>
        {CORE_TYPES.map((t, i) => {
          const tint = (colors as any)[t.tint] || colors.systemBlue;
          return (
            <Pressable
              key={t.id}
              onPress={() => handleTypeSelect(t.id)}
              style={[
                $.row,
                i < CORE_TYPES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
              ]}
            >
              <View style={[$.typeCircle, { backgroundColor: tint + '15' }]}>
                <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[$.rowTitle, { color: colors.label }]}>{t.name}</Text>
                <Text style={[$.rowSub, { color: colors.tertiaryLabel }]}>{t.desc}</Text>
              </View>
              <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
                <Path d="M1 1l6 6-6 6" stroke={colors.systemGray3} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: How to build (only for specific types, not custom/jay/library)
  // ═══════════════════════════════════════════════════════════════════

  const renderStep1 = () => {
    const typeInfo = CORE_TYPES.find(t => t.id === selectedType);
    return (
      <View>
        <Text style={[$.stepTitle, { color: colors.label }]}>
          How should we build your {typeInfo?.name} routine?
        </Text>
        <Text style={[$.stepSub, { color: colors.secondaryLabel }]}>
          {sessionLabel} · {typeInfo?.desc}
        </Text>

        {/* Build with JAY */}
        <Pressable
          onPress={() => handleBuild('jay')}
          disabled={submitting}
          style={[$.buildCard, { backgroundColor: colors.systemBlue + '08', borderColor: colors.systemBlue + '25' }]}
        >
          <View style={[$.buildCardIcon, { backgroundColor: colors.systemBlue + '18' }]}>
            <Text style={{ fontSize: 28 }}>🤖</Text>
          </View>
          <Text style={[$.buildCardTitle, { color: colors.systemBlue }]}>Build with JAY</Text>
          <Text style={[$.buildCardDesc, { color: colors.secondaryLabel }]}>
            AI picks the best products for your skin type, checks for ingredient conflicts, and calculates cost.
          </Text>
          <View style={[$.buildCardBtn, { backgroundColor: colors.systemBlue }]}>
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={$.buildCardBtnText}>Build with JAY ✨</Text>
            )}
          </View>
        </Pressable>

        {/* Start empty */}
        <Pressable
          onPress={() => handleBuild('scratch')}
          disabled={submitting}
          style={[$.buildCard, { backgroundColor: colors.tertiarySystemFill, borderColor: colors.separator }]}
        >
          <View style={[$.buildCardIcon, { backgroundColor: colors.systemGray + '15' }]}>
            <Text style={{ fontSize: 28 }}>✏️</Text>
          </View>
          <Text style={[$.buildCardTitle, { color: colors.label }]}>I'll build it myself</Text>
          <Text style={[$.buildCardDesc, { color: colors.secondaryLabel }]}>
            {typeInfo?.name} template with {typeInfo?.desc?.match(/\d+/)?.[0] || 'empty'} step categories. Add your own products and timings.
          </Text>
          <View style={[$.buildCardBtn, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[$.buildCardBtnText, { color: colors.label }]}>Start building →</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[$.handle, { backgroundColor: colors.systemGray4 }]}
      backgroundStyle={{ backgroundColor: colors.secondarySystemBackground }}
      onChange={(idx) => { if (idx === -1) reset(); }}
    >
      <BottomSheetScrollView
        contentContainerStyle={$.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={$.header}>
          {step > 0 && (
            <Pressable onPress={() => setStep(0)} hitSlop={12}>
              <Text style={[$.backText, { color: colors.systemBlue }]}>← Back</Text>
            </Pressable>
          )}
          <Text style={[$.title, { color: colors.label }]}>
            {step === 0 ? 'New Routine' : 'Build Method'}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {step === 0 ? renderStep0() : renderStep1()}

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const $ = StyleSheet.create({
  handle: { width: 36, height: 5, borderRadius: 2.5 },
  scrollContent: { paddingHorizontal: SPACE.xl, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACE.lg,
  },
  title: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  backText: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },

  // Labels
  label: {
    fontSize: 11, fontFamily: 'Outfit-SemiBold', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: SPACE.sm,
  },
  sectionHeader: {
    fontSize: 18, fontFamily: 'Outfit-Bold', marginBottom: SPACE.md,
  },

  // Name input
  inputWrap: { borderRadius: RADIUS.sm, marginBottom: SPACE.xl, overflow: 'hidden' },
  input: { fontSize: 16, fontFamily: 'Outfit', paddingHorizontal: SPACE.lg, paddingVertical: 14 },
  messageInput: { minHeight: 60, fontSize: 14, lineHeight: 20, paddingTop: 12 },

  // Grouped table
  groupedTable: { borderRadius: RADIUS.sm, overflow: 'hidden', marginBottom: SPACE.sm },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.lg, paddingVertical: 13, gap: 12,
  },
  rowEmoji: { fontSize: 22 },
  rowTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  rowSub: { fontSize: 12, fontFamily: 'Outfit', marginTop: 1 },

  // Custom session
  customRow: {
    borderRadius: RADIUS.sm, marginTop: SPACE.sm, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, gap: 8,
  },
  customInput: { flex: 1, fontFamily: 'Outfit', fontSize: 15, paddingVertical: 13 },

  // Type circle
  typeCircle: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Smart options (highlighted cards)
  smartCard: {
    borderRadius: RADIUS.md, padding: SPACE.lg, marginBottom: SPACE.sm,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1,
  },
  smartIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  smartName: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  smartDesc: { fontSize: 12, fontFamily: 'Outfit', lineHeight: 16, marginTop: 2 },

  // Step 1: Build method
  stepTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  stepSub: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20, marginBottom: SPACE.xxl },

  buildCard: {
    borderRadius: 16, padding: SPACE.xl, marginBottom: SPACE.lg,
    alignItems: 'center', borderWidth: 1,
  },
  buildCardIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.md,
  },
  buildCardTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  buildCardDesc: {
    fontSize: 13, fontFamily: 'Outfit', lineHeight: 18,
    textAlign: 'center', marginBottom: SPACE.lg,
  },
  buildCardBtn: {
    paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: RADIUS.md, alignItems: 'center', minWidth: 180,
  },
  buildCardBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});
