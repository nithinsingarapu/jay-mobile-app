import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../stores/userStore';
import {
  profileService,
  getUpdaterForSection,
  type QuestionnaireSection,
  type QuestionnaireQuestion,
} from '../../services/profile';

// ── Section transition messages ──────────────────────────────────────────────
const SECTION_INTROS: Record<string, { emoji: string; quip: string }> = {
  basics: { emoji: '👋', quip: "First things first — let JAY learn your name so we can stop the awkward 'hey you'" },
  skin: { emoji: '🔬', quip: "Time to decode your skin's whole personality. No filter needed." },
  skin_state: { emoji: '📸', quip: "Quick selfie for your skin — but with words, not a camera" },
  routine: { emoji: '🧴', quip: "Show JAY your bathroom shelf. We promise not to judge... much." },
  lifestyle: { emoji: '🍕', quip: "Pizza at midnight? 3 hours of sleep? Your skin already knows. Now tell JAY." },
  preferences: { emoji: '🎯', quip: "Almost there! Tell JAY how you want to glow and we'll make it happen." },
};

// ── Build section payload ────────────────────────────────────────────────────
function buildSectionPayload(
  sectionId: string,
  questions: QuestionnaireQuestion[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const q of questions) {
    let val = answers[q.id];
    if (val === undefined || val === null) continue;

    // Format date from raw parts to YYYY-MM-DD on save
    if (q.type === 'date_picker' && typeof val === 'object' && val !== null) {
      const d = val as { day: string; month: string; year: string };
      if (d.day && d.month && d.year && d.year.length === 4) {
        payload[q.id] = `${d.year}-${d.month.padStart(2, '0')}-${d.day.padStart(2, '0')}`;
      }
      continue;
    }

    if (q.type === 'location_picker' && q.fields) {
      for (const field of q.fields) {
        const fv = (val as Record<string, unknown>)?.[field.id];
        if (fv) payload[field.id] = fv;
      }
    } else {
      payload[q.id] = val;
    }
  }
  return payload;
}

// ── Section transition card ──────────────────────────────────────────────────
function SectionTransition({ section, onContinue }: { section: QuestionnaireSection; onContinue: () => void }) {
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;
  const intro = SECTION_INTROS[section.id];

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      RNAnimated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <RNAnimated.View style={[styles.transitionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.transitionEmoji}>{intro?.emoji || '✨'}</Text>
      <Text style={styles.transitionTitle}>{section.title}</Text>
      <Text style={styles.transitionSubtitle}>{section.subtitle}</Text>
      {intro?.quip && <Text style={styles.transitionQuip}>"{intro.quip}"</Text>}
      <View style={{ marginTop: 32, width: '100%' }}>
        <Button label="Let's do it" onPress={onContinue} />
      </View>
    </RNAnimated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN QUIZ SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboardingComplete, fetchProfile } = useUserStore();
  const scrollRef = useRef<ScrollView>(null);

  const [sections, setSections] = useState<QuestionnaireSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  useEffect(() => {
    profileService
      .getQuestionnaire()
      .then((data) => { setSections(data.sections); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [sectionIdx, questionIdx, showSectionIntro]);

  // NOT useCallback — needs fresh `answers` ref on every call
  const submitSection = async (secIdx: number) => {
    const sec = sections[secIdx];
    if (!sec) return;
    const updater = getUpdaterForSection(sec.id);
    if (!updater) return;
    const payload = buildSectionPayload(sec.id, sec.questions, answers);
    console.log(`[JAY Quiz] Submitting section "${sec.id}":`, JSON.stringify(payload));
    if (Object.keys(payload).length === 0) {
      console.log(`[JAY Quiz] Section "${sec.id}" has no answers, skipping`);
      return;
    }
    try {
      await updater(payload);
      console.log(`[JAY Quiz] Section "${sec.id}" saved successfully`);
      setSaveError('');
    } catch (e) {
      console.error(`[JAY Quiz] Failed to save section "${sec.id}":`, e);
      setSaveError('Some answers may not have saved — you can update them later.');
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    for (let i = 0; i <= sectionIdx; i++) await submitSection(i);
    try { await profileService.completeOnboarding(); } catch { /* ok */ }
    await fetchProfile();
    setOnboardingComplete(true);
    setSubmitting(false);
    router.replace('/(tabs)');
  };

  // ── Loading / Error ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={[styles.hint, { marginTop: 16 }]}>Getting your questionnaire ready...</Text>
        <Text style={[styles.hint, { marginTop: 4, fontSize: 12 }]}>JAY is warming up its curiosity</Text>
      </View>
    );
  }

  if (error || sections.length === 0) {
    return (
      <View style={[styles.container, styles.center, { paddingHorizontal: 32 }]}>
        <Text style={{ fontSize: 40 }}>😅</Text>
        <Text style={[styles.question, { textAlign: 'center', marginTop: 12 }]}>Well, that's embarrassing</Text>
        <Text style={[styles.hint, { textAlign: 'center', marginTop: 8 }]}>{error || 'Failed to load questionnaire'}</Text>
        <View style={{ marginTop: 32, width: '100%' }}>
          <Button label="Skip for now" onPress={() => { setOnboardingComplete(true); router.replace('/(tabs)'); }} />
        </View>
      </View>
    );
  }

  const section = sections[sectionIdx];

  // ── Section intro ──────────────────────────────────────────────────────
  if (showSectionIntro) {
    const totalQ = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const doneQ = sections.slice(0, sectionIdx).reduce((sum, s) => sum + s.questions.length, 0);
    const progress = totalQ > 0 ? (doneQ / totalQ) * 100 : 0;

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => sectionIdx > 0 ? setSectionIdx(i => i - 1) : router.back()} style={styles.backBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
          </Pressable>
          <View style={styles.progressWrapper}><ProgressBar progress={progress} animate /></View>
          <Pressable onPress={handleSkip} disabled={submitting}>
            <Text style={styles.skipText}>{submitting ? 'Saving...' : 'Skip all'}</Text>
          </Pressable>
        </View>
        <View style={[styles.center, { flex: 1, paddingHorizontal: 32 }]}>
          <Text style={styles.sectionCounter}>SECTION {sectionIdx + 1} OF {sections.length}</Text>
          <SectionTransition section={section} onContinue={() => setShowSectionIntro(false)} />
        </View>
      </View>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────
  const question = section.questions[questionIdx];
  const totalQ = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const doneQ = sections.slice(0, sectionIdx).reduce((sum, s) => sum + s.questions.length, 0) + questionIdx + 1;
  const progress = (doneQ / totalQ) * 100;
  const currentAnswer = answers[question.id];

  const setAnswer = (val: unknown) => setAnswers((prev) => ({ ...prev, [question.id]: val }));

  const toggleMulti = (value: string) => {
    const arr = (currentAnswer as string[]) || [];
    const maxSelect = (question.validation?.max_select as number) || 999;
    if (arr.includes(value)) setAnswer(arr.filter((v: string) => v !== value));
    else if (arr.length < maxSelect) setAnswer([...arr, value]);
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    const isLastQ = questionIdx === section.questions.length - 1;
    const isLastS = sectionIdx === sections.length - 1;

    if (!isLastQ) {
      setQuestionIdx((i) => i + 1);
    } else if (!isLastS) {
      setSubmitting(true);
      await submitSection(sectionIdx);
      setSectionIdx((i) => i + 1);
      setQuestionIdx(0);
      setShowSectionIntro(true);
      setSubmitting(false);
    } else {
      setSubmitting(true);
      await submitSection(sectionIdx);
      try { await profileService.completeOnboarding(); } catch { /* ok */ }
      await fetchProfile();
      setOnboardingComplete(true);
      setSubmitting(false);
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (questionIdx > 0) setQuestionIdx((i) => i - 1);
    else if (sectionIdx > 0) {
      const prev = sections[sectionIdx - 1];
      setSectionIdx((i) => i - 1);
      setQuestionIdx(prev.questions.length - 1);
      setShowSectionIntro(false);
    } else router.back();
  };

  const isLastQ = questionIdx === section.questions.length - 1;
  const isLastS = sectionIdx === sections.length - 1;
  const buttonLabel = isLastS && isLastQ ? "Finish — let's glow ✨" : isLastQ ? 'Next section  →' : 'Continue';

  // Check if answer exists (handles arrays, objects, booleans, numbers properly)
  const hasAnswer = (() => {
    if (currentAnswer === undefined || currentAnswer === null) return false;
    if (currentAnswer === '') return false;
    if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return false;
    return true;
  })();
  const isRequiredAndEmpty = question.required && !hasAnswer;
  const continueDisabled = submitting || isRequiredAndEmpty;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
          </Pressable>
          <View style={styles.progressWrapper}><ProgressBar progress={progress} animate /></View>
          <Pressable onPress={handleSkip} disabled={submitting}>
            <Text style={styles.skipText}>{submitting ? 'Saving...' : 'Skip'}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{section.title}</Text>
          </View>

          <Text style={styles.stepNum}>{questionIdx + 1} of {section.questions.length}</Text>
          <Text style={styles.question}>{question.question}</Text>
          {question.subtitle ? <Text style={styles.hint}>{question.subtitle}</Text> : null}

          <View style={styles.options}>
            <QuestionInput question={question} answer={currentAnswer} setAnswer={setAnswer} toggleMulti={toggleMulti} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
          {isRequiredAndEmpty ? (
            <Text style={styles.requiredHint}>This one's required — pick an option to continue</Text>
          ) : null}
          <Button label={buttonLabel} onPress={handleContinue} disabled={continueDisabled} />
          {!question.required && (
            <Pressable onPress={handleContinue} style={styles.skipQuestionBtn}>
              <Text style={styles.skipQuestionText}>Skip this one</Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QUESTION INPUT RENDERER
// ══════════════════════════════════════════════════════════════════════════════
function QuestionInput({
  question: q, answer, setAnswer, toggleMulti,
}: {
  question: QuestionnaireQuestion; answer: unknown;
  setAnswer: (val: unknown) => void; toggleMulti: (val: string) => void;
}) {
  switch (q.type) {

    // ── Text Input ─────────────────────────────────────────────────────────
    case 'text_input':
      return (
        <View style={{ width: '100%' }}>
          <TextInput
            style={styles.textInput}
            placeholder={q.placeholder || 'Type here...'}
            placeholderTextColor="#C0C0C0"
            value={(answer as string) || ''}
            onChangeText={(text) => setAnswer(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={(q.validation?.max_length as number) || 50}
          />
          <Text style={styles.inputHint}>Letters, numbers, and underscores only. Choose wisely — this is your legacy.</Text>
        </View>
      );

    // ── Date Picker ────────────────────────────────────────────────────────
    case 'date_picker': {
      const raw = (answer as { day: string; month: string; year: string }) || { day: '', month: '', year: '' };

      // Validate ranges
      const dayNum = parseInt(raw.day, 10);
      const monthNum = parseInt(raw.month, 10);
      const yearNum = parseInt(raw.year, 10);
      const currentYear = new Date().getFullYear();
      const dayValid = !raw.day || (dayNum >= 1 && dayNum <= 31);
      const monthValid = !raw.month || (monthNum >= 1 && monthNum <= 12);
      const yearValid = !raw.year || raw.year.length < 4 || (yearNum >= 1920 && yearNum <= currentYear - 13);
      const hasDateError = (raw.day && !dayValid) || (raw.month && !monthValid) || (raw.year && raw.year.length === 4 && !yearValid);

      return (
        <View style={{ width: '100%', gap: 14 }}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Day</Text>
              <TextInput
                style={[styles.textInput, styles.dateInput, raw.day && !dayValid && { borderColor: '#E53935' }]}
                placeholder="15"
                placeholderTextColor="#C0C0C0"
                value={raw.day}
                onChangeText={(d) => setAnswer({ ...raw, day: d.replace(/[^0-9]/g, '').slice(0, 2) })}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                style={[styles.textInput, styles.dateInput, raw.month && !monthValid && { borderColor: '#E53935' }]}
                placeholder="05"
                placeholderTextColor="#C0C0C0"
                value={raw.month}
                onChangeText={(m) => setAnswer({ ...raw, month: m.replace(/[^0-9]/g, '').slice(0, 2) })}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
            <View style={[styles.dateField, { flex: 1.5 }]}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={[styles.textInput, styles.dateInput, raw.year && raw.year.length === 4 && !yearValid && { borderColor: '#E53935' }]}
                placeholder="1998"
                placeholderTextColor="#C0C0C0"
                value={raw.year}
                onChangeText={(y) => setAnswer({ ...raw, year: y.replace(/[^0-9]/g, '').slice(0, 4) })}
                keyboardType="number-pad"
                maxLength={4}
                textAlign="center"
              />
            </View>
          </View>
          {hasDateError ? (
            <Text style={[styles.inputHint, { color: '#E53935' }]}>
              {!dayValid ? 'Day must be 1–31' : !monthValid ? 'Month must be 1–12' : `Year must be ${1920}–${currentYear - 13}`}
            </Text>
          ) : (
            <Text style={styles.inputHint}>We won't send you a birthday cake. But JAY might send you age-appropriate skincare tips. Fair trade?</Text>
          )}
        </View>
      );
    }

    // ── Location Picker ────────────────────────────────────────────────────
    case 'location_picker': {
      const locVal = (answer as Record<string, string>) || {};
      const fields = q.fields || [];
      const [locating, setLocating] = useState(false);
      const [locError, setLocError] = useState('');

      const useMyLocation = async () => {
        setLocating(true);
        setLocError('');
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocError("Location permission denied — that's cool, type it manually!");
            setLocating(false);
            return;
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (place) {
            setAnswer({
              ...locVal,
              location_city: place.city || place.subregion || '',
              location_state: place.region || '',
              location_country: place.country || 'India',
            });
          }
        } catch {
          setLocError("Couldn't get location — type it in instead!");
        }
        setLocating(false);
      };

      const placeholders: Record<string, string> = {
        City: 'e.g. Mumbai, Bangalore, Delhi...',
        State: 'e.g. Maharashtra, Karnataka...',
        Country: 'e.g. India',
      };

      return (
        <View style={{ width: '100%', gap: 14 }}>
          {/* Use my location button */}
          <Pressable style={styles.locationBtn} onPress={useMyLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
                <Circle cx="12" cy="12" r="3" />
                <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </Svg>
            )}
            <Text style={styles.locationBtnText}>{locating ? 'Finding you...' : 'Use my location'}</Text>
          </Pressable>
          {locError ? <Text style={styles.inputHint}>{locError}</Text> : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or type it</Text>
            <View style={styles.dividerLine} />
          </View>

          {fields.map((field) => (
            <View key={field.id}>
              <Text style={styles.inputLabel}>{field.placeholder}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={placeholders[field.placeholder] || field.placeholder}
                placeholderTextColor="#C0C0C0"
                value={locVal[field.id] || ''}
                onChangeText={(text) => setAnswer({ ...locVal, [field.id]: text })}
                autoCapitalize="words"
              />
            </View>
          ))}
          <Text style={styles.inputHint}>Mumbai humidity vs. Bangalore weather? Your skin cares more about your ZIP code than you think.</Text>
        </View>
      );
    }

    // ── Single Select / Card ───────────────────────────────────────────────
    case 'single_select':
    case 'single_select_card':
      return (
        <>
          {(q.options || []).map((opt) => {
            const selected = answer === opt.value;
            const isCard = q.type === 'single_select_card' && opt.description;
            return (
              <Pressable
                key={String(opt.value)}
                style={[isCard ? styles.cardOption : styles.option, selected && styles.optionActive]}
                onPress={() => setAnswer(opt.value)}
              >
                <View style={isCard ? styles.cardOptionInner : undefined}>
                  {opt.emoji ? <Text style={[styles.optionEmoji, selected && { opacity: 1 }]}>{opt.emoji}</Text> : null}
                  <View style={isCard ? { flex: 1 } : undefined}>
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>{opt.label}</Text>
                    {opt.description ? (
                      <Text style={[styles.optionDesc, selected && styles.optionDescActive]}>{opt.description}</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </>
      );

    // ── Multi Select Chips ─────────────────────────────────────────────────
    case 'multi_select_chip':
    case 'multi_select_ordered': {
      const selected = (answer as string[]) || [];
      const maxSelect = (q.validation?.max_select as number) || 999;
      return (
        <>
          {maxSelect < 999 ? (
            <View style={styles.selectCounter}>
              <Text style={styles.selectCounterText}>
                {selected.length === 0 ? `Pick up to ${maxSelect}` : `${selected.length} of ${maxSelect} selected`}
              </Text>
              {selected.length >= maxSelect ? <Text style={styles.selectCounterFull}>Max reached!</Text> : null}
            </View>
          ) : null}
          {(q.options || []).map((opt) => {
            const isSelected = selected.includes(String(opt.value));
            const isDisabled = !isSelected && selected.length >= maxSelect;
            return (
              <Pressable
                key={String(opt.value)}
                style={[styles.chip, isSelected && styles.chipActive, isDisabled && { opacity: 0.35 }]}
                onPress={() => !isDisabled && toggleMulti(String(opt.value))}
                disabled={isDisabled}
              >
                {opt.emoji ? <Text style={styles.chipEmoji}>{opt.emoji}</Text> : null}
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{opt.label}</Text>
                {isSelected ? <Text style={styles.chipCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </>
      );
    }

    // ── Emoji Select ───────────────────────────────────────────────────────
    case 'emoji_select':
      return (
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
          {(q.options || []).map((opt) => {
            const selected = answer === opt.value;
            return (
              <Pressable
                key={String(opt.value)}
                style={[styles.emojiOption, selected && styles.emojiOptionActive]}
                onPress={() => setAnswer(opt.value)}
              >
                <Text style={styles.emojiIcon}>{opt.emoji}</Text>
                <Text style={[styles.emojiLabel, selected && styles.emojiLabelActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );

    // ── Yes / No ───────────────────────────────────────────────────────────
    case 'yes_no':
      return (
        <>
          {[
            { val: true, label: 'Yes', emoji: '👍' },
            { val: false, label: 'Nope', emoji: '🙅' },
          ].map(({ val, label, emoji }) => {
            const selected = answer === val;
            return (
              <Pressable
                key={label}
                style={[styles.option, selected && styles.optionActive, { width: '47%', alignItems: 'center' }]}
                onPress={() => setAnswer(val)}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</Text>
                <Text style={[styles.optionText, selected && styles.optionTextActive, { textAlign: 'center' }]}>{label}</Text>
              </Pressable>
            );
          })}
        </>
      );

    // ── Slider ─────────────────────────────────────────────────────────────
    case 'slider': {
      const min = q.min ?? 0;
      const max = q.max ?? 5;
      const step = q.step ?? 1;
      const labels = q.labels || {};
      const totalSteps = Math.round((max - min) / step) + 1;

      // Small ranges: circle grid
      if (totalSteps <= 7) {
        const steps: number[] = [];
        for (let i = min; i <= max; i += step) steps.push(i);
        return (
          <View style={{ width: '100%' }}>
            <View style={styles.sliderRow}>
              {steps.map((val) => {
                const selected = answer === val;
                return (
                  <Pressable key={val} style={[styles.sliderStep, selected && styles.sliderStepActive]} onPress={() => setAnswer(val)}>
                    <Text style={[styles.sliderStepText, selected && styles.sliderStepTextActive]}>{val}</Text>
                  </Pressable>
                );
              })}
            </View>
            {answer !== undefined && answer !== null && labels[String(answer)] ? (
              <View style={styles.sliderLabelBubble}>
                <Text style={styles.sliderLabelBubbleText}>{labels[String(answer)]}</Text>
              </View>
            ) : null}
            {(answer === undefined || answer === null) ? (
              <View style={styles.sliderLabelRow}>
                {labels[String(min)] ? <Text style={styles.sliderLabelHint}>{labels[String(min)]}</Text> : null}
                <View style={{ flex: 1 }} />
                {labels[String(max)] ? <Text style={[styles.sliderLabelHint, { textAlign: 'right' }]}>{labels[String(max)]}</Text> : null}
              </View>
            ) : null}
          </View>
        );
      }

      // Large ranges: stepper
      const currentVal = (answer as number) ?? undefined;
      const displayVal = currentVal !== undefined ? currentVal : undefined;

      return (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={styles.stepperContainer}>
            <Pressable
              style={[styles.stepperBtn, (displayVal === undefined || displayVal <= min) && { opacity: 0.25 }]}
              onPress={() => displayVal !== undefined && displayVal > min && setAnswer(Math.round((displayVal - step) * 10) / 10)}
              disabled={displayVal === undefined || displayVal <= min}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Pressable style={styles.stepperValueBox} onPress={() => displayVal === undefined && setAnswer(min)}>
              <Text style={styles.stepperValue}>{displayVal !== undefined ? displayVal : '?'}</Text>
              {displayVal !== undefined && labels[String(displayVal)] ? (
                <Text style={styles.stepperLabel}>{labels[String(displayVal)]}</Text>
              ) : null}
            </Pressable>
            <Pressable
              style={[styles.stepperBtn, (displayVal !== undefined && displayVal >= max) && { opacity: 0.25 }]}
              onPress={() => {
                if (displayVal === undefined) setAnswer(min);
                else if (displayVal < max) setAnswer(Math.round((displayVal + step) * 10) / 10);
              }}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
          <View style={[styles.sliderLabelRow, { marginTop: 16, width: '85%' }]}>
            {labels[String(min)] ? <Text style={styles.sliderLabelHint}>{labels[String(min)]}</Text> : null}
            <View style={{ flex: 1 }} />
            {labels[String(max)] ? <Text style={[styles.sliderLabelHint, { textAlign: 'right' }]}>{labels[String(max)]}</Text> : null}
          </View>
          {displayVal === undefined ? (
            <Text style={[styles.inputHint, { marginTop: 12 }]}>Tap the number or press + to start</Text>
          ) : null}
        </View>
      );
    }

    // ── Tag Input ──────────────────────────────────────────────────────────
    case 'tag_input': {
      const selected = (answer as string[]) || [];
      const [inputVal, setInputVal] = useState('');
      const suggestions = q.suggestions || [];

      const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !selected.includes(trimmed)) setAnswer([...selected, trimmed]);
        setInputVal('');
      };

      const removeTag = (tag: string) => setAnswer(selected.filter((t: string) => t !== tag));

      return (
        <View style={{ width: '100%', gap: 14 }}>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder={q.placeholder || 'Type and add...'}
              placeholderTextColor="#C0C0C0"
              value={inputVal}
              onChangeText={setInputVal}
              onSubmitEditing={() => addTag(inputVal)}
              returnKeyType="done"
            />
            <Pressable style={[styles.tagAddBtn, !inputVal.trim() && { opacity: 0.3 }]} onPress={() => addTag(inputVal)} disabled={!inputVal.trim()}>
              <Text style={styles.tagAddBtnText}>Add</Text>
            </Pressable>
          </View>

          {selected.length > 0 ? (
            <View style={styles.tagList}>
              {selected.map((tag) => (
                <Pressable key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {suggestions.filter((s) => !selected.includes(s)).length > 0 ? (
            <View>
              <Text style={[styles.inputHint, { marginBottom: 8 }]}>Quick picks — tap to add:</Text>
              <View style={styles.tagList}>
                {suggestions.filter((s) => !selected.includes(s)).map((tag) => (
                  <Pressable key={tag} style={styles.suggestionChip} onPress={() => addTag(tag)}>
                    <Text style={styles.chipText}>{tag}</Text>
                    <Text style={{ fontSize: 15, color: '#999' }}>+</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      );
    }

    default:
      return <Text style={styles.hint}>Unsupported question type</Text>;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { padding: 4 },
  progressWrapper: { flex: 1 },
  skipText: { fontSize: 13, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },

  sectionCounter: { fontSize: 11, color: '#999', fontWeight: '600', letterSpacing: 2, fontFamily: 'Outfit-SemiBold', marginBottom: 8 },
  transitionCard: { alignItems: 'center', width: '100%' },
  transitionEmoji: { fontSize: 52, marginBottom: 20 },
  transitionTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  transitionSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 8, fontFamily: 'Outfit', lineHeight: 22 },
  transitionQuip: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 16, fontFamily: 'Outfit', fontStyle: 'italic', lineHeight: 19, paddingHorizontal: 8 },

  sectionBadge: { backgroundColor: '#F5F5F5', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  sectionBadgeText: { fontSize: 11, color: '#666', fontWeight: '600', letterSpacing: 0.5, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase' },

  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  stepNum: { fontSize: 11, color: '#999', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, fontFamily: 'Outfit-SemiBold' },
  question: { fontSize: 24, fontWeight: '600', marginTop: 10, letterSpacing: -0.3, lineHeight: 30, fontFamily: 'Outfit-SemiBold' },
  hint: { fontSize: 14, color: '#999', marginTop: 8, fontFamily: 'Outfit', lineHeight: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 },

  footer: { paddingHorizontal: 24, gap: 8, paddingTop: 8 },
  saveErrorText: { fontSize: 12, color: '#E53935', fontFamily: 'Outfit', textAlign: 'center', marginBottom: 4 },
  requiredHint: { fontSize: 12, color: '#999', fontFamily: 'Outfit-Medium', textAlign: 'center', marginBottom: 4 },
  skipQuestionBtn: { alignItems: 'center', paddingVertical: 8 },
  skipQuestionText: { fontSize: 13, color: '#999', fontFamily: 'Outfit-Medium' },

  option: { width: '47%', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 12, padding: 16 },
  cardOption: { width: '100%', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginBottom: 2 },
  cardOptionInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionActive: { backgroundColor: '#000', borderColor: '#000' },
  optionText: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  optionTextActive: { color: '#fff' },
  optionEmoji: { fontSize: 24, opacity: 0.8 },
  optionDesc: { fontSize: 12, color: '#999', marginTop: 3, fontFamily: 'Outfit', lineHeight: 17 },
  optionDescActive: { color: 'rgba(255,255,255,0.65)' },

  chip: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: '#000', borderColor: '#000' },
  chipText: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  chipTextActive: { color: '#fff' },
  chipEmoji: { fontSize: 14 },
  chipCheck: { fontSize: 12, color: '#fff', marginLeft: 2 },

  selectCounter: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  selectCounterText: { fontSize: 12, color: '#999', fontFamily: 'Outfit-Medium' },
  selectCounterFull: { fontSize: 11, color: '#000', fontFamily: 'Outfit-SemiBold', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },

  emojiOption: { alignItems: 'center', padding: 10, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, flex: 1, marginHorizontal: 3 },
  emojiOptionActive: { backgroundColor: '#000', borderColor: '#000' },
  emojiIcon: { fontSize: 28 },
  emojiLabel: { fontSize: 10, color: '#666', marginTop: 6, fontFamily: 'Outfit', textAlign: 'center' },
  emojiLabelActive: { color: '#fff' },

  sliderRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  sliderStep: { width: 50, height: 50, borderRadius: 25, borderWidth: 0.5, borderColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center' },
  sliderStepActive: { backgroundColor: '#000', borderColor: '#000' },
  sliderStepText: { fontSize: 16, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  sliderStepTextActive: { color: '#fff' },
  sliderLabelBubble: { backgroundColor: '#F5F5F5', alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 100, marginTop: 16 },
  sliderLabelBubbleText: { fontSize: 13, color: '#333', fontFamily: 'Outfit-Medium', textAlign: 'center' },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, width: '100%' },
  sliderLabelHint: { fontSize: 11, color: '#999', fontFamily: 'Outfit' },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepperBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 26, fontWeight: '600', color: '#000', fontFamily: 'Outfit-SemiBold' },
  stepperValueBox: { alignItems: 'center', minWidth: 90 },
  stepperValue: { fontSize: 44, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -1, color: '#000' },
  stepperLabel: { fontSize: 12, color: '#666', fontFamily: 'Outfit-Medium', marginTop: 4, textAlign: 'center' },

  textInput: { borderWidth: 0.5, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Outfit', color: '#000' },
  inputLabel: { fontSize: 13, color: '#555', fontFamily: 'Outfit-Medium', marginBottom: 6 },
  inputHint: { fontSize: 12, color: '#999', fontFamily: 'Outfit', marginTop: 8, lineHeight: 17 },

  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  dateInput: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold', paddingVertical: 14 },

  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 0.5, borderColor: '#000', borderRadius: 12, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  locationBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: '#000' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E5E5E5' },
  dividerText: { fontSize: 12, color: '#999', fontFamily: 'Outfit' },

  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagAddBtn: { backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13 },
  tagAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 100, paddingLeft: 14, paddingRight: 10, paddingVertical: 8, gap: 6 },
  tagChipText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit-Medium' },
  tagRemove: { color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: '600' },
  suggestionChip: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
