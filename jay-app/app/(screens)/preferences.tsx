import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';
import { mergePreferences, profileService } from '../../services/profile';
import type { BackendProfile } from '../../services/profile';

const SKIN_TYPES = ['oily', 'dry', 'combination', 'normal'] as const;
const SKIN_TYPE_LABELS: Record<string, string> = {
  oily: 'Oily',
  dry: 'Dry',
  combination: 'Combination',
  normal: 'Normal',
};

const CONCERNS = [
  'acne',
  'dark_spots',
  'wrinkles',
  'pores',
  'texture',
  'dullness',
  'dark_circles',
  'tan',
  'oiliness',
  'dryness',
  'sensitivity',
  'aging',
] as const;
const CONCERN_LABELS: Record<string, string> = {
  acne: 'Acne',
  dark_spots: 'Dark spots',
  wrinkles: 'Wrinkles',
  pores: 'Large pores',
  texture: 'Texture',
  dullness: 'Dullness',
  dark_circles: 'Dark circles',
  tan: 'Tan',
  oiliness: 'Oiliness',
  dryness: 'Dryness',
  sensitivity: 'Sensitivity',
  aging: 'Aging',
};

const BUDGETS = ['under_500', '500_1000', '1000_2000', '2000_plus', 'no_limit'] as const;
const BUDGET_LABELS: Record<string, string> = {
  under_500: 'Under ₹500',
  '500_1000': '₹500–1,000',
  '1000_2000': '₹1,000–2,000',
  '2000_plus': '₹2,000+',
  no_limit: 'No limit',
};

const FITZPATRICK = [1, 2, 3, 4, 5, 6] as const;

const MIDDAY_OPTIONS = [
  { value: 'oily_all_over', label: 'Oily all over' },
  { value: 'oily_t_zone', label: 'Oily T-zone' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'tight_dry', label: 'Tight / dry' },
  { value: 'varies', label: 'Varies' },
] as const;

const SKIN_HISTORY = [
  'eczema',
  'psoriasis',
  'rosacea',
  'dermatitis',
  'fungal_acne',
  'melasma',
  'vitiligo',
  'cystic_acne',
  'hormonal_acne',
  'none',
] as const;
const SKIN_HISTORY_LABELS: Record<string, string> = {
  eczema: 'Eczema',
  psoriasis: 'Psoriasis',
  rosacea: 'Rosacea',
  dermatitis: 'Dermatitis',
  fungal_acne: 'Fungal acne',
  melasma: 'Melasma',
  vitiligo: 'Vitiligo',
  cystic_acne: 'Cystic acne',
  hormonal_acne: 'Hormonal acne',
  none: 'None',
};

const SENSITIVITY_OPTIONS = [
  'fragrance',
  'alcohol',
  'retinol',
  'aha_bha',
  'vitamin_c',
  'essential_oils',
  'niacinamide',
  'sulfates',
  'silicones',
  'not_sure',
] as const;
const SENSITIVITY_LABELS: Record<string, string> = {
  fragrance: 'Fragrance',
  alcohol: 'Alcohol',
  retinol: 'Retinol',
  aha_bha: 'AHA/BHA',
  vitamin_c: 'Vitamin C',
  essential_oils: 'Ess. oils',
  niacinamide: 'Niacinamide',
  sulfates: 'Sulfates',
  silicones: 'Silicones',
  not_sure: 'Not sure',
};

const TOP_GOALS = [
  'clear_skin',
  'anti_aging',
  'glow',
  'even_tone',
  'hydration',
  'oil_control',
] as const;
const TOP_GOAL_LABELS: Record<string, string> = {
  clear_skin: 'Clear skin',
  anti_aging: 'Anti-aging',
  glow: 'Glow',
  even_tone: 'Even tone',
  hydration: 'Hydration',
  oil_control: 'Oil control',
};

const PRODUCT_PREFS = ['pharmacy', 'luxury', 'natural', 'korean', 'ayurvedic', 'no_preference'] as const;
const PRODUCT_PREF_LABELS: Record<string, string> = {
  pharmacy: 'Pharmacy',
  luxury: 'Luxury',
  natural: 'Natural',
  korean: 'K-beauty',
  ayurvedic: 'Ayurvedic',
  no_preference: 'No preference',
};

const ROUTINE_COMPLEXITY = ['minimal_1_3', 'moderate_4_5', 'elaborate_6_plus', 'whatever_works'] as const;
const ROUTINE_COMPLEXITY_LABELS: Record<string, string> = {
  minimal_1_3: 'Minimal (1–3)',
  moderate_4_5: 'Moderate (4–5)',
  elaborate_6_plus: 'Elaborate (6+)',
  whatever_works: 'Whatever works',
};

const FRAGRANCE_PREFS = ['love', 'neutral', 'prefer_unscented', 'strictly_unscented'] as const;
const FRAGRANCE_PREF_LABELS: Record<string, string> = {
  love: 'Love fragrance',
  neutral: 'Neutral',
  prefer_unscented: 'Prefer unscented',
  strictly_unscented: 'Strictly unscented',
};

const OVERALL_FEELINGS = ['great', 'good', 'okay', 'bad', 'terrible'] as const;
const OVERALL_LABELS: Record<string, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  bad: 'Bad',
  terrible: 'Terrible',
};

const MAX_CONCERNS = 5;

function fmt(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function hydrateEditState(profile: BackendProfile) {
  const prefs = (profile.preferences || {}) as Record<string, unknown>;
  const ss = (profile.current_skin_state || {}) as Record<string, unknown>;

  return {
    skinType: profile.skin_type || '',
    fitzpatrick: profile.fitzpatrick_type ?? null as number | null,
    middayFeel: profile.skin_feel_midday || '',
    concerns: [...(profile.primary_concerns || [])],
    skinHistory: [...(profile.skin_history || [])],
    sensitivities: [...(profile.sensitivities || [])],
    allergiesText: (profile.allergies || []).join(', '),
    budget: (prefs.budget_range as string) || '',
    topGoal: (prefs.top_goal as string) || '',
    productPreference: (prefs.product_preference as string) || '',
    routineComplexity: (prefs.routine_complexity as string) || '',
    fragrancePreference: (prefs.fragrance_preference as string) || '',
    acneLevel: typeof ss.acne_level === 'number' ? ss.acne_level : 0,
    oilinessLevel: typeof ss.oiliness_level === 'number' ? ss.oiliness_level : 0,
    drynessLevel: typeof ss.dryness_level === 'number' ? ss.dryness_level : 0,
    irritationLevel: typeof ss.irritation_level === 'number' ? ss.irritation_level : 0,
    newBreakouts: Boolean(ss.new_breakouts),
    overallFeeling: (ss.overall_feeling as string) || 'okay',
  };
}

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { backendProfile, fetchProfile, user } = useUserStore();
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const prefs = (backendProfile?.preferences || {}) as Record<string, unknown>;
  const lifestyle = (backendProfile?.lifestyle || {}) as Record<string, unknown>;
  const skinState = (backendProfile?.current_skin_state || {}) as Record<string, unknown>;
  const routine = (backendProfile?.current_routine || {}) as Record<string, unknown>;

  const [skinType, setSkinType] = useState('');
  const [fitzpatrick, setFitzpatrick] = useState<number | null>(null);
  const [middayFeel, setMiddayFeel] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [skinHistory, setSkinHistory] = useState<string[]>([]);
  const [sensitivities, setSensitivities] = useState<string[]>([]);
  const [allergiesText, setAllergiesText] = useState('');
  const [budget, setBudget] = useState('');
  const [topGoal, setTopGoal] = useState('');
  const [productPreference, setProductPreference] = useState('');
  const [routineComplexity, setRoutineComplexity] = useState('');
  const [fragrancePreference, setFragrancePreference] = useState('');
  const [acneLevel, setAcneLevel] = useState(0);
  const [oilinessLevel, setOilinessLevel] = useState(0);
  const [drynessLevel, setDrynessLevel] = useState(0);
  const [irritationLevel, setIrritationLevel] = useState(0);
  const [newBreakouts, setNewBreakouts] = useState(false);
  const [overallFeeling, setOverallFeeling] = useState('okay');

  const applyHydration = useCallback(
    (p: BackendProfile) => {
      const h = hydrateEditState(p);
      setSkinType(h.skinType);
      setFitzpatrick(h.fitzpatrick);
      setMiddayFeel(h.middayFeel);
      setConcerns(h.concerns);
      setSkinHistory(h.skinHistory);
      setSensitivities(h.sensitivities);
      setAllergiesText(h.allergiesText);
      setBudget(h.budget);
      setTopGoal(h.topGoal);
      setProductPreference(h.productPreference);
      setRoutineComplexity(h.routineComplexity);
      setFragrancePreference(h.fragrancePreference);
      setAcneLevel(h.acneLevel);
      setOilinessLevel(h.oilinessLevel);
      setDrynessLevel(h.drynessLevel);
      setIrritationLevel(h.irritationLevel);
      setNewBreakouts(h.newBreakouts);
      setOverallFeeling(h.overallFeeling);
    },
    [],
  );

  // When profile loads or refetches, keep form in sync unless user is actively editing
  useEffect(() => {
    if (!backendProfile || editing) return;
    applyHydration(backendProfile);
  }, [backendProfile, editing, applyHydration]);

  const toggleConcern = (c: string) => {
    setConcerns((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= MAX_CONCERNS) {
        Alert.alert('Limit reached', `Choose up to ${MAX_CONCERNS} concerns.`);
        return prev;
      }
      return [...prev, c];
    });
  };

  const toggleSkinHistory = (h: string) => {
    setSkinHistory((prev) => {
      if (h === 'none') return prev.includes('none') ? [] : ['none'];
      const withoutNone = prev.filter((x) => x !== 'none');
      if (withoutNone.includes(h)) return withoutNone.filter((x) => x !== h);
      return [...withoutNone, h];
    });
  };

  const toggleSensitivity = (s: string) => {
    setSensitivities((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const startEditing = () => {
    if (backendProfile) applyHydration(backendProfile);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (backendProfile) applyHydration(backendProfile);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!backendProfile) return;
    setSaving(true);
    try {
      const allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await profileService.updateSkinIdentity({
        skin_type: skinType || null,
        fitzpatrick_type: fitzpatrick ?? undefined,
        primary_concerns: concerns.length ? concerns : null,
        skin_feel_midday: middayFeel || null,
        skin_history: skinHistory.length ? skinHistory : null,
        allergies: allergies.length ? allergies : null,
        sensitivities: sensitivities.length ? sensitivities : null,
      });

      const prevPrefs = (backendProfile.preferences || {}) as Record<string, unknown>;
      await profileService.updatePreferences(
        mergePreferences(prevPrefs, {
          budget_range: budget || prevPrefs.budget_range,
          top_goal: topGoal || prevPrefs.top_goal,
          product_preference: productPreference || prevPrefs.product_preference,
          routine_complexity: routineComplexity || prevPrefs.routine_complexity,
          fragrance_preference: fragrancePreference || prevPrefs.fragrance_preference,
        }),
      );

      await profileService.updateSkinState({
        acne_level: acneLevel,
        oiliness_level: oilinessLevel,
        dryness_level: drynessLevel,
        irritation_level: irritationLevel,
        new_breakouts: newBreakouts,
        overall_feeling: overallFeeling as 'great' | 'good' | 'okay' | 'bad' | 'terrible',
      });

      await fetchProfile();
      setEditing(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save profile';
      Alert.alert('Save failed', msg);
    }
    setSaving(false);
  };

  if (!backendProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.groupedBackground }]}>
        <TopBar title="Skin Profile" />
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40 }}>🪞</Text>
          <Text style={styles.emptyTitle}>No skin profile yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete the onboarding quiz to build your skin profile
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.groupedBackground }]}>
      <TopBar title="Skin Profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.completenessBar}>
          <View style={styles.completenessTrack}>
            <View style={[styles.completenessFill, { width: `${user.profileCompleteness}%` }]} />
          </View>
          <Text style={styles.completenessText}>{user.profileCompleteness}% complete</Text>
        </View>

        <Text style={styles.sectionLabel}>SKIN IDENTITY</Text>
        <View style={styles.card}>
          <InfoRow
            label="Skin type"
            value={backendProfile.skin_type ? fmt(backendProfile.skin_type) : '—'}
          />
          <InfoRow
            label="Sun reaction"
            value={backendProfile.fitzpatrick_type ? `Type ${backendProfile.fitzpatrick_type}` : '—'}
          />
          <InfoRow
            label="Midday feel"
            value={backendProfile.skin_feel_midday ? fmt(backendProfile.skin_feel_midday) : '—'}
          />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Concerns</Text>
            {backendProfile.primary_concerns && backendProfile.primary_concerns.length > 0 ? (
              <View style={styles.chipRow}>
                {backendProfile.primary_concerns.map((c) => (
                  <View key={c} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{CONCERN_LABELS[c] || fmt(c)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>—</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sensitivities</Text>
            {backendProfile.sensitivities && backendProfile.sensitivities.length > 0 ? (
              <View style={styles.chipRow}>
                {backendProfile.sensitivities.map((s) => (
                  <View key={s} style={styles.miniChip}>
                    <Text style={styles.miniChipText}>{SENSITIVITY_LABELS[s] || fmt(s)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>None reported</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Allergies</Text>
            <Text style={styles.infoValue}>
              {backendProfile.allergies && backendProfile.allergies.length > 0
                ? backendProfile.allergies.join(', ')
                : 'None reported'}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>History</Text>
            <Text style={styles.infoValue}>
              {backendProfile.skin_history && backendProfile.skin_history.length > 0
                ? backendProfile.skin_history.map((h) => SKIN_HISTORY_LABELS[h] || fmt(h)).join(', ')
                : 'None'}
            </Text>
          </View>
        </View>

        {skinState && Object.keys(skinState).length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>CURRENT SKIN STATE</Text>
            <View style={styles.card}>
              <LevelRow label="Acne" level={skinState.acne_level as number} max={5} />
              <LevelRow label="Oiliness" level={skinState.oiliness_level as number} max={5} />
              <LevelRow label="Dryness" level={skinState.dryness_level as number} max={5} />
              <LevelRow label="Irritation" level={skinState.irritation_level as number} max={5} />
              <InfoRow label="New breakouts" value={skinState.new_breakouts ? 'Yes' : 'No'} />
              <InfoRow
                label="Overall feeling"
                value={skinState.overall_feeling ? fmt(skinState.overall_feeling as string) : '—'}
                last
              />
            </View>
          </>
        ) : null}

        {routine && Object.keys(routine).length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>CURRENT ROUTINE</Text>
            <View style={styles.card}>
              <InfoRow label="AM steps" value={(routine.am_steps as string[])?.join(' → ') || '—'} />
              <InfoRow label="PM steps" value={(routine.pm_steps as string[])?.join(' → ') || '—'} />
              <InfoRow
                label="Consistency"
                value={routine.routine_consistency ? fmt(routine.routine_consistency as string) : '—'}
              />
              <InfoRow
                label="Duration"
                value={
                  routine.how_long_current_routine ? fmt(routine.how_long_current_routine as string) : '—'
                }
                last
              />
            </View>
          </>
        ) : null}

        {lifestyle && Object.keys(lifestyle).length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>LIFESTYLE</Text>
            <View style={styles.card}>
              {lifestyle.physical_activity ? (
                <InfoRow label="Activity" value={fmt(lifestyle.physical_activity as string)} />
              ) : null}
              {lifestyle.water_intake_glasses !== undefined ? (
                <InfoRow label="Water" value={`${lifestyle.water_intake_glasses} glasses/day`} />
              ) : null}
              {lifestyle.sleep_hours !== undefined ? (
                <InfoRow label="Sleep" value={`${lifestyle.sleep_hours} hours`} />
              ) : null}
              {lifestyle.diet_type ? <InfoRow label="Diet" value={fmt(lifestyle.diet_type as string)} /> : null}
              {lifestyle.stress_level ? (
                <InfoRow label="Stress" value={fmt(lifestyle.stress_level as string)} />
              ) : null}
              {lifestyle.sun_exposure ? (
                <InfoRow label="Sun exposure" value={fmt(lifestyle.sun_exposure as string)} />
              ) : null}
              {lifestyle.sun_protection_habit ? (
                <InfoRow label="Sunscreen" value={fmt(lifestyle.sun_protection_habit as string)} />
              ) : null}
              {lifestyle.smoking ? (
                <InfoRow label="Smoking" value={fmt(lifestyle.smoking as string)} last />
              ) : null}
            </View>
          </>
        ) : null}

        {prefs && Object.keys(prefs).length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <View style={styles.card}>
              {prefs.budget_range ? (
                <InfoRow
                  label="Budget"
                  value={BUDGET_LABELS[prefs.budget_range as string] || fmt(prefs.budget_range as string)}
                />
              ) : null}
              {prefs.product_preference ? (
                <InfoRow label="Products" value={fmt(prefs.product_preference as string)} />
              ) : null}
              {prefs.routine_complexity ? (
                <InfoRow label="Complexity" value={fmt(prefs.routine_complexity as string)} />
              ) : null}
              {prefs.top_goal ? <InfoRow label="Top goal" value={fmt(prefs.top_goal as string)} /> : null}
              {prefs.fragrance_preference ? (
                <InfoRow label="Fragrance" value={fmt(prefs.fragrance_preference as string)} last />
              ) : null}
            </View>
          </>
        ) : null}

        {editing ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionLabel}>EDIT SKIN PROFILE</Text>

            <Text style={styles.editLabel}>Skin type</Text>
            <View style={styles.optionsGrid}>
              {SKIN_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.option, skinType === t && styles.optionActive]}
                  onPress={() => setSkinType(t)}
                >
                  <Text style={[styles.optionText, skinType === t && styles.optionTextActive]}>
                    {SKIN_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Fitzpatrick (sun reaction)</Text>
            <View style={styles.optionsGrid}>
              {FITZPATRICK.map((n) => (
                <Pressable
                  key={n}
                  style={[styles.optionSmall, fitzpatrick === n && styles.optionActive]}
                  onPress={() => setFitzpatrick(fitzpatrick === n ? null : n)}
                >
                  <Text style={[styles.optionText, fitzpatrick === n && styles.optionTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Midday feel</Text>
            <View style={styles.optionsGrid}>
              {MIDDAY_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.option, middayFeel === o.value && styles.optionActive]}
                  onPress={() => setMiddayFeel(middayFeel === o.value ? '' : o.value)}
                >
                  <Text style={[styles.optionText, middayFeel === o.value && styles.optionTextActive]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Concerns (max {MAX_CONCERNS})</Text>
            <View style={styles.optionsGrid}>
              {CONCERNS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.option, concerns.includes(c) && styles.optionActive]}
                  onPress={() => toggleConcern(c)}
                >
                  <Text style={[styles.optionText, concerns.includes(c) && styles.optionTextActive]}>
                    {CONCERN_LABELS[c]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Skin history</Text>
            <View style={styles.optionsGrid}>
              {SKIN_HISTORY.map((h) => (
                <Pressable
                  key={h}
                  style={[styles.option, skinHistory.includes(h) && styles.optionActive]}
                  onPress={() => toggleSkinHistory(h)}
                >
                  <Text style={[styles.optionText, skinHistory.includes(h) && styles.optionTextActive]}>
                    {SKIN_HISTORY_LABELS[h]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Sensitivities</Text>
            <View style={styles.optionsGrid}>
              {SENSITIVITY_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.option, sensitivities.includes(s) && styles.optionActive]}
                  onPress={() => toggleSensitivity(s)}
                >
                  <Text style={[styles.optionText, sensitivities.includes(s) && styles.optionTextActive]}>
                    {SENSITIVITY_LABELS[s]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Allergies (comma-separated)</Text>
            <TextInput
              style={styles.textInput}
              value={allergiesText}
              onChangeText={setAllergiesText}
              placeholder="e.g. fragrance, parabens"
              placeholderTextColor={colors.placeholderText}
              multiline
            />

            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>EDIT PREFERENCES</Text>

            <Text style={styles.editLabel}>Budget</Text>
            <View style={styles.optionsGrid}>
              {BUDGETS.map((b) => (
                <Pressable
                  key={b}
                  style={[styles.option, budget === b && styles.optionActive]}
                  onPress={() => setBudget(budget === b ? '' : b)}
                >
                  <Text style={[styles.optionText, budget === b && styles.optionTextActive]}>
                    {BUDGET_LABELS[b]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Top goal</Text>
            <View style={styles.optionsGrid}>
              {TOP_GOALS.map((g) => (
                <Pressable
                  key={g}
                  style={[styles.option, topGoal === g && styles.optionActive]}
                  onPress={() => setTopGoal(topGoal === g ? '' : g)}
                >
                  <Text style={[styles.optionText, topGoal === g && styles.optionTextActive]}>
                    {TOP_GOAL_LABELS[g]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Product style</Text>
            <View style={styles.optionsGrid}>
              {PRODUCT_PREFS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.option, productPreference === p && styles.optionActive]}
                  onPress={() => setProductPreference(productPreference === p ? '' : p)}
                >
                  <Text style={[styles.optionText, productPreference === p && styles.optionTextActive]}>
                    {PRODUCT_PREF_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Routine complexity</Text>
            <View style={styles.optionsGrid}>
              {ROUTINE_COMPLEXITY.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.option, routineComplexity === r && styles.optionActive]}
                  onPress={() => setRoutineComplexity(routineComplexity === r ? '' : r)}
                >
                  <Text style={[styles.optionText, routineComplexity === r && styles.optionTextActive]}>
                    {ROUTINE_COMPLEXITY_LABELS[r]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Fragrance</Text>
            <View style={styles.optionsGrid}>
              {FRAGRANCE_PREFS.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.option, fragrancePreference === f && styles.optionActive]}
                  onPress={() => setFragrancePreference(fragrancePreference === f ? '' : f)}
                >
                  <Text style={[styles.optionText, fragrancePreference === f && styles.optionTextActive]}>
                    {FRAGRANCE_PREF_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>EDIT CURRENT SKIN STATE</Text>

            <LevelEditor label="Acne" value={acneLevel} onChange={setAcneLevel} />
            <LevelEditor label="Oiliness" value={oilinessLevel} onChange={setOilinessLevel} />
            <LevelEditor label="Dryness" value={drynessLevel} onChange={setDrynessLevel} />
            <LevelEditor label="Irritation" value={irritationLevel} onChange={setIrritationLevel} />

            <View style={styles.switchRow}>
              <Text style={styles.editLabel}>New breakouts</Text>
              <Switch value={newBreakouts} onValueChange={setNewBreakouts} />
            </View>

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Overall feeling</Text>
            <View style={styles.optionsGrid}>
              {OVERALL_FEELINGS.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.option, overallFeeling === f && styles.optionActive]}
                  onPress={() => setOverallFeeling(f)}
                >
                  <Text style={[styles.optionText, overallFeeling === f && styles.optionTextActive]}>
                    {OVERALL_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="outline" onPress={cancelEditing} disabled={saving} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={saving ? 'Saving...' : 'Save'}
                  onPress={handleSave}
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        ) : (
          <Button label="Edit Profile" variant="outline" style={{ marginTop: 24 }} onPress={startEditing} />
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LevelRow({ label, level, max }: { label: string; level: number; max: number }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.levelDots}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <View key={i} style={[styles.levelDot, i <= level && styles.levelDotFilled]} />
        ))}
        <Text style={styles.levelNum}>
          {level}/{max}
        </Text>
      </View>
    </View>
  );
}

function LevelEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.levelEditor}>
      <Text style={styles.editLabel}>{label}</Text>
      <View style={styles.levelRowBtns}>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            style={[styles.levelBtn, value === n && styles.levelBtnActive]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.levelBtnText, value === n && styles.levelBtnTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', fontFamily: 'Outfit', marginTop: 8, textAlign: 'center' },

  completenessBar: { marginBottom: 24 },
  completenessTrack: { height: 4, backgroundColor: '#F2F2F2', borderRadius: 2 },
  completenessFill: { height: 4, backgroundColor: '#000', borderRadius: 2 },
  completenessText: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit-Medium', marginTop: 6 },

  sectionLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 20,
    fontFamily: 'Outfit-SemiBold',
  },
  card: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, overflow: 'hidden' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F2',
  },
  infoLabel: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit', flex: 1 },
  infoValue: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit-Medium', flex: 1.5, textAlign: 'right' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1.5, justifyContent: 'flex-end' },
  miniChip: { backgroundColor: '#F5F5F5', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  miniChipText: { fontSize: 11, fontFamily: 'Outfit-Medium', color: '#8E8E93' },

  levelDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F2F2F2' },
  levelDotFilled: { backgroundColor: '#000' },
  levelNum: { fontSize: 11, color: '#8E8E93', fontFamily: 'Outfit', marginLeft: 6 },

  editLabel: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit-Medium', marginBottom: 8 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionSmall: {
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 44,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: '#000', borderColor: '#000' },
  optionText: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  optionTextActive: { color: '#fff' },

  textInput: {
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#8E8E93',
    minHeight: 44,
    textAlignVertical: 'top',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  levelEditor: { marginTop: 12 },
  levelRowBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelBtn: {
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  levelBtnText: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#8E8E93' },
  levelBtnTextActive: { color: '#fff' },
});
