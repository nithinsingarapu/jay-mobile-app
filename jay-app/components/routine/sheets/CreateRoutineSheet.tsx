/**
 * CreateRoutineSheet — 3-step wizard bottom sheet.
 *   Step 1: Session (when?)
 *   Step 2: Routine type (what kind?)
 *   Step 3: Build method (how?)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../lib/theme';
import { SPACE, RADIUS } from '../../../constants/theme';
import { routineService } from '../../../services/routine';
import type { RoutineTypeInfo } from '../../../types/routine';

// ── Types ───────────────────────────────────────────────────────────────

type BuildMethod = 'jay' | 'template' | 'scratch';

export interface CreateRoutineData {
  routineType: string;
  routineTypeName: string;
  buildMethod: BuildMethod;
  sessionName: string;
}

interface CreateRoutineSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (data: CreateRoutineData) => void;
}

// ── Constants ───────────────────────────────────────────────────────────

const SESSION_PRESETS = [
  { value: 'morning', label: 'Morning', emoji: '🌅', desc: 'Wake-up skincare', time: '6 – 9 AM' },
  { value: 'afternoon', label: 'Afternoon', emoji: '☀️', desc: 'Midday sunscreen reapply & touch-up', time: '12 – 3 PM' },
  { value: 'evening', label: 'Evening', emoji: '🌆', desc: 'Post-work wind-down', time: '5 – 7 PM' },
  { value: 'night', label: 'Night', emoji: '🌙', desc: 'Before-bed repair routine', time: '9 – 11 PM' },
];

const TYPE_EMOJI: Record<string, string> = {
  essential: '🌿', complete: '⭐', glass_skin: '✨',
  barrier_repair: '🛡️', anti_acne: '🎯', custom: '➕',
};

const TYPE_TINT_KEY: Record<string, string> = {
  essential: 'systemGreen', complete: 'systemBlue', glass_skin: 'systemTeal',
  barrier_repair: 'systemOrange', anti_acne: 'systemRed', custom: 'systemGray',
};

const fmtCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Checkmark SVG ───────────────────────────────────────────────────────

const Check = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M4 10.5L8 14.5L16 5.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

// ── Component ───────────────────────────────────────────────────────────

export function CreateRoutineSheet({ sheetRef, onCreated }: CreateRoutineSheetProps) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['75%'], []);

  // Wizard state
  const [step, setStep] = useState(0); // 0=session, 1=type, 2=build
  const [sessionName, setSessionName] = useState('morning');
  const [customSession, setCustomSession] = useState('');
  const [selectedType, setSelectedType] = useState('essential');
  const [buildMethod, setBuildMethod] = useState<BuildMethod>('jay');
  const [submitting, setSubmitting] = useState(false);

  // Routine types from API
  const [types, setTypes] = useState<Record<string, RoutineTypeInfo>>({});
  useEffect(() => { routineService.getTypes().then(d => setTypes(d as any)).catch(() => {}); }, []);
  const typeEntries = useMemo(() => Object.entries(types), [types]);
  const selectedInfo = types[selectedType];

  // Step progress dots
  const STEPS = ['Session', 'Type', 'Build'];

  const reset = useCallback(() => {
    setStep(0);
    setSessionName('morning');
    setCustomSession('');
    setSelectedType('essential');
    setBuildMethod('jay');
    setSubmitting(false);
  }, []);

  const handleNext = useCallback(() => {
    if (step < 2) setStep(step + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleCreate = useCallback(() => {
    if (submitting) return;
    setSubmitting(true);
    const finalSession = customSession.trim() || sessionName;
    onCreated({
      routineType: selectedType,
      routineTypeName: selectedInfo?.name || selectedType,
      buildMethod,
      sessionName: finalSession,
    });
    setTimeout(reset, 400);
  }, [selectedType, selectedInfo, buildMethod, sessionName, customSession, submitting, onCreated, reset]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} pressBehavior="close" />
    ), [],
  );

  // ── Step indicator ──────────────────────────────────────────────────
  const StepIndicator = () => (
    <View style={$.indicator}>
      {STEPS.map((label, i) => (
        <View key={label} style={$.indicatorItem}>
          <View style={[$.dot, {
            backgroundColor: i <= step ? colors.systemBlue : colors.systemGray4,
            width: i === step ? 24 : 8,
          }]} />
          {i === step && (
            <Text style={[$.dotLabel, { color: colors.systemBlue }]}>{label}</Text>
          )}
        </View>
      ))}
    </View>
  );

  // ── Step 0: Session ─────────────────────────────────────────────────
  const renderSessionStep = () => (
    <View>
      <Text style={[$.stepTitle, { color: colors.label }]}>When is this routine?</Text>
      <Text style={[$.stepSubtitle, { color: colors.secondaryLabel }]}>
        Pick a time of day, or create a custom session
      </Text>

      <View style={[$.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
        {SESSION_PRESETS.map((preset, idx) => {
          const isSelected = !customSession.trim() && sessionName === preset.value;
          return (
            <Pressable
              key={preset.value}
              style={[
                $.sessionRow,
                idx < SESSION_PRESETS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                isSelected && { backgroundColor: colors.systemBlue + '0D' },
              ]}
              onPress={() => { setSessionName(preset.value); setCustomSession(''); }}
            >
              <Text style={$.sessionEmoji}>{preset.emoji}</Text>
              <View style={$.sessionText}>
                <Text style={[$.sessionLabel, { color: colors.label }]}>{preset.label}</Text>
                <Text style={[$.sessionDesc, { color: colors.tertiaryLabel }]}>{preset.time}</Text>
              </View>
              {isSelected && <Check color={colors.systemBlue} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[$.customWrap, {
        backgroundColor: colors.tertiarySystemBackground,
        borderColor: customSession.trim() ? colors.systemBlue : 'transparent',
        borderWidth: customSession.trim() ? 1.5 : 0,
      }]}>
        <Text style={[$.customLabel, { color: colors.tertiaryLabel }]}>Or custom:</Text>
        <TextInput
          style={[$.customInput, { color: colors.label }]}
          placeholder="e.g. Sunscreen reapply, Post-gym"
          placeholderTextColor={colors.quaternaryLabel}
          value={customSession}
          onChangeText={setCustomSession}
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  // ── Step 1: Routine Type ────────────────────────────────────────────
  const renderTypeStep = () => (
    <View>
      <Text style={[$.stepTitle, { color: colors.label }]}>What kind of routine?</Text>
      <Text style={[$.stepSubtitle, { color: colors.secondaryLabel }]}>
        Choose a template that fits your needs
      </Text>

      {typeEntries.map(([id, info]) => {
        const isSelected = selectedType === id;
        const tintKey = TYPE_TINT_KEY[id] || 'systemBlue';
        const tint = (colors as any)[tintKey] || colors.systemBlue;

        return (
          <Pressable
            key={id}
            onPress={() => setSelectedType(id)}
            style={[
              $.typeCard,
              { backgroundColor: colors.tertiarySystemBackground },
              isSelected && { borderWidth: 1.5, borderColor: tint },
            ]}
          >
            <View style={$.typeRow}>
              <View style={[$.typeIcon, { backgroundColor: tint + '15' }]}>
                <Text style={{ fontSize: 18 }}>{TYPE_EMOJI[id] || '📋'}</Text>
              </View>
              <View style={$.typeInfo}>
                <Text style={[$.typeName, { color: colors.label }]}>{info.name}</Text>
                <Text style={[$.typeMeta, { color: colors.tertiaryLabel }]}>
                  {info.max_steps} steps max · {info.complexity}
                </Text>
              </View>
              {isSelected && <Check color={tint} />}
            </View>
            {isSelected && (
              <View style={$.typeExpanded}>
                <Text style={[$.typeDesc, { color: colors.secondaryLabel }]}>{info.description}</Text>
                {id !== 'custom' && info.am_template.length > 0 && (
                  <View style={$.chipRow}>
                    {[...info.am_template.slice(0, 5)].map(cat => (
                      <View key={cat} style={[$.chip, { backgroundColor: tint + '12' }]}>
                        <Text style={[$.chipText, { color: tint }]}>{fmtCategory(cat)}</Text>
                      </View>
                    ))}
                    {info.am_template.length > 5 && (
                      <Text style={[$.chipMore, { color: colors.tertiaryLabel }]}>+{info.am_template.length - 5} more</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  // ── Step 2: Build Method ────────────────────────────────────────────
  const renderBuildStep = () => {
    const finalSession = customSession.trim() || sessionName;
    const sessionDisplay = fmtCategory(finalSession);

    return (
      <View>
        <Text style={[$.stepTitle, { color: colors.label }]}>How do you want to build it?</Text>
        <Text style={[$.stepSubtitle, { color: colors.secondaryLabel }]}>
          {sessionDisplay} · {selectedInfo?.name || selectedType}
        </Text>

        <View style={[$.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
          {([
            {
              value: 'jay' as BuildMethod, emoji: '🤖', label: 'Build with JAY',
              desc: 'AI analyzes your skin profile, picks the best products, checks for conflicts',
              tint: colors.systemBlue,
            },
            {
              value: 'template' as BuildMethod, emoji: '📋', label: 'Use template',
              desc: 'Pre-filled step categories from the template — add your own products',
              tint: colors.systemIndigo,
            },
            {
              value: 'scratch' as BuildMethod, emoji: '✏️', label: 'Start empty',
              desc: 'Blank routine — manually add each step, product, and timing',
              tint: colors.systemGray,
            },
          ]).map((opt, idx) => {
            const isSelected = buildMethod === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  $.buildRow,
                  idx < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                  isSelected && { backgroundColor: opt.tint + '0D' },
                ]}
                onPress={() => setBuildMethod(opt.value)}
              >
                <View style={[$.buildIcon, { backgroundColor: opt.tint + '15' }]}>
                  <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                </View>
                <View style={$.buildText}>
                  <Text style={[$.buildLabel, { color: colors.label }]}>{opt.label}</Text>
                  <Text style={[$.buildDesc, { color: colors.secondaryLabel }]} numberOfLines={2}>{opt.desc}</Text>
                </View>
                {isSelected && <Check color={opt.tint} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────
  const canProceed = step === 0 ? (customSession.trim() || sessionName) : true;

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
      <View style={$.wrapper}>
        <StepIndicator />

        <BottomSheetScrollView
          contentContainerStyle={$.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && renderSessionStep()}
          {step === 1 && renderTypeStep()}
          {step === 2 && renderBuildStep()}
        </BottomSheetScrollView>

        {/* Bottom nav */}
        <View style={[$.bottomBar, { borderTopColor: colors.separator }]}>
          {step > 0 ? (
            <Pressable onPress={handleBack} style={$.backBtn}>
              <Text style={[$.backBtnText, { color: colors.systemBlue }]}>Back</Text>
            </Pressable>
          ) : (
            <View style={$.backBtn} />
          )}

          {step < 2 ? (
            <Pressable
              onPress={handleNext}
              disabled={!canProceed}
              style={[$.nextBtn, { backgroundColor: colors.systemBlue }, !canProceed && { opacity: 0.4 }]}
            >
              <Text style={$.nextBtnText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCreate}
              disabled={submitting}
              style={[$.nextBtn, { backgroundColor: colors.systemGreen }, submitting && { opacity: 0.5 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={$.nextBtnText}>
                  {buildMethod === 'jay' ? 'Build with JAY ✨' : buildMethod === 'template' ? 'Create Routine' : 'Create & Add Steps'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const $ = StyleSheet.create({
  handle: { width: 36, height: 5, borderRadius: 2.5 },
  wrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACE.xl, paddingBottom: 100 },

  // Step indicator
  indicator: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl,
  },
  indicatorItem: { alignItems: 'center', gap: 4 },
  dot: { height: 8, borderRadius: 4 },
  dotLabel: { fontSize: 10, fontFamily: 'Outfit-SemiBold', letterSpacing: 0.3 },

  // Step header
  stepTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', fontWeight: '700', marginTop: SPACE.md },
  stepSubtitle: { fontSize: 14, fontFamily: 'Outfit', lineHeight: 20, marginTop: 4, marginBottom: SPACE.lg },

  // Session
  groupedTable: { borderRadius: RADIUS.sm, overflow: 'hidden' },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.lg, paddingVertical: 14,
  },
  sessionEmoji: { fontSize: 24, marginRight: SPACE.md },
  sessionText: { flex: 1 },
  sessionLabel: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  sessionDesc: { fontSize: 12, fontFamily: 'Outfit', marginTop: 1 },
  customWrap: {
    borderRadius: RADIUS.sm, marginTop: SPACE.md, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg,
  },
  customLabel: { fontSize: 13, fontFamily: 'Outfit-Medium', marginRight: SPACE.sm },
  customInput: { flex: 1, fontFamily: 'Outfit', fontSize: 15, paddingVertical: 14 },

  // Type cards
  typeCard: { borderRadius: RADIUS.md, padding: SPACE.lg, marginBottom: SPACE.sm },
  typeRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACE.md,
  },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  typeMeta: { fontSize: 12, fontFamily: 'Outfit', marginTop: 1 },
  typeExpanded: { marginTop: SPACE.sm, paddingLeft: 52 },
  typeDesc: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: SPACE.sm },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  chipText: { fontSize: 11, fontFamily: 'Outfit-Medium' },
  chipMore: { fontSize: 11, fontFamily: 'Outfit', alignSelf: 'center', marginLeft: 4 },

  // Build method
  buildRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.lg, paddingVertical: 16,
  },
  buildIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACE.md,
  },
  buildText: { flex: 1, marginRight: SPACE.sm },
  buildLabel: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  buildDesc: { fontSize: 12, fontFamily: 'Outfit', lineHeight: 17, marginTop: 2 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'transparent',
  },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  nextBtn: {
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: RADIUS.md, minWidth: 120, alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Outfit-SemiBold' },
});
