import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeInUp,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useRoutineStore } from '../../stores/routineStore';
import type { GeneratedStep } from '../../types/routine';

// ─── Progress Step Row ───────────────────────────────────────────────────────

interface ProgressStepProps {
  label: string;
  done: boolean;
  active: boolean;
  index: number;
  colors: any;
}

function ProgressStep({ label, done, active, index, colors }: ProgressStepProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [active]);

  const animatedDot = useAnimatedStyle(() => ({
    opacity: active ? pulseOpacity.value : 1,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 2000 + 1000).duration(500)}
      style={styles.progressRow}
    >
      <Animated.View
        style={[
          styles.progressDot,
          {
            backgroundColor: done
              ? colors.systemGreen
              : active
              ? colors.systemBlue
              : colors.systemGray4,
          },
          animatedDot,
        ]}
      >
        {done && <Ionicons name="checkmark" size={12} color="#fff" />}
        {active && !done && (
          <View style={[styles.innerDot, { backgroundColor: '#fff' }]} />
        )}
      </Animated.View>
      <Text
        style={[
          styles.progressLabel,
          {
            color: done || active ? colors.label : colors.tertiaryLabel,
            fontFamily: active ? 'Outfit-SemiBold' : 'Outfit',
          },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  colors,
}: {
  step: GeneratedStep;
  index: number;
  colors: any;
}) {
  const productDisplay =
    step.product_brand && step.product_name
      ? `${step.product_brand} — ${step.product_name}`
      : step.product_name || step.category;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400)}
      style={[styles.stepCard, { backgroundColor: colors.secondarySystemBackground }]}
    >
      <View style={styles.stepCardHeader}>
        <View style={[styles.stepNumber, { backgroundColor: colors.systemBlue }]}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.stepCardHeaderText}>
          <Text style={[styles.stepCategory, { color: colors.secondaryLabel }]}>
            {step.category}
          </Text>
          <Text style={[styles.stepProductName, { color: colors.label }]} numberOfLines={2}>
            {productDisplay}
          </Text>
        </View>
        {step.product_price != null && step.product_price > 0 && (
          <Text style={[styles.stepPrice, { color: colors.systemGreen }]}>
            ₹{step.product_price}
          </Text>
        )}
      </View>

      {!!step.instruction && (
        <Text style={[styles.stepInstruction, { color: colors.secondaryLabel }]}>
          {step.instruction}
        </Text>
      )}

      {!!step.why_this_product && (
        <Text style={[styles.stepWhy, { color: colors.tertiaryLabel }]}>
          {step.why_this_product}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function BuildWithJayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    description: string;
    period: string;
    routineType: string;
    sessionName: string;
    routineName: string;
    messageToJay: string;
  }>();

  const {
    isGenerating,
    generatedRoutine,
    generateRoutine,
    saveGeneratedRoutine,
  } = useRoutineStore();

  const [isSaving, setIsSaving] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Animated pulse for the center orb
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.15);

  useEffect(() => {
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    orbOpacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  // Trigger generation on mount — send raw session name, let backend handle mapping
  useEffect(() => {
    const session = params.sessionName || params.period || 'both';
    const routineType = (params.routineType as string) || 'auto';
    const message = params.messageToJay?.trim() || undefined;
    generateRoutine({ period: session, routine_type: routineType, additional_instructions: message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionName, params.period, params.routineType]);

  // Progress step simulation while generating
  useEffect(() => {
    if (!isGenerating) return;
    setGenerationStep(0);
    const t1 = setTimeout(() => setGenerationStep(1), 1000);
    const t2 = setTimeout(() => setGenerationStep(2), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isGenerating]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const ok = await saveGeneratedRoutine();
    setIsSaving(false);
    if (ok) {
      router.back();
    }
  }, [saveGeneratedRoutine, router]);

  const handleRegenerate = useCallback(() => {
    const session = params.sessionName || params.period || 'both';
    const routineType = (params.routineType as string) || 'auto';
    const message = params.messageToJay?.trim() || undefined;
    generateRoutine({ period: session, routine_type: routineType, additional_instructions: message });
  }, [params.sessionName, params.period, params.routineType, params.messageToJay, generateRoutine]);

  const progressSteps = [
    { label: 'Reading your skin profile', done: generationStep >= 1 },
    { label: 'Searching product database', done: generationStep >= 2 },
    { label: 'Checking ingredient conflicts', done: false },
  ];

  // ── State 1: Generating ──────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.systemBackground }]}>
        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.cancelText, { color: colors.systemBlue }]}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.generatingCenter}>
          {/* Pulsing orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.orbOuter,
                { backgroundColor: colors.systemBlue },
                orbStyle,
              ]}
            />
            <View style={[styles.orbInner, { backgroundColor: colors.systemBlue + '22' }]}>
              <Ionicons name="sparkles" size={32} color={colors.systemBlue} />
            </View>
          </View>

          <Animated.Text
            entering={FadeIn.delay(200).duration(500)}
            style={[styles.generatingTitle, { color: colors.label }]}
          >
            JAY is building your routine...
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.delay(400).duration(500)}
            style={[styles.generatingSubtitle, { color: colors.secondaryLabel }]}
          >
            Analyzing your skin profile, finding{'\n'}products, checking conflicts
          </Animated.Text>

          {/* Progress steps */}
          <View style={styles.progressContainer}>
            {progressSteps.map((step, i) => (
              <ProgressStep
                key={step.label}
                label={step.label}
                done={step.done}
                active={
                  (i === 0 && generationStep === 0) ||
                  (i === 1 && generationStep === 1) ||
                  (i === 2 && generationStep === 2)
                }
                index={i}
                colors={colors}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── State 2: Result ──────────────────────────────────────────────────────

  if (generatedRoutine) {
    const amSteps = generatedRoutine.steps.filter((s) => s.period === 'am');
    const pmSteps = generatedRoutine.steps.filter((s) => s.period === 'pm');
    const ungroupedSteps =
      amSteps.length === 0 && pmSteps.length === 0
        ? generatedRoutine.steps
        : [];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.systemBackground }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={[styles.resultTitle, { color: colors.label }]}>
              Your Routine
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.secondaryLabel }]}>
              {generatedRoutine.name}
            </Text>
          </Animated.View>

          {/* Reasoning card */}
          {!!generatedRoutine.reasoning && (
            <Animated.View
              entering={FadeInUp.delay(100).duration(500)}
              style={[
                styles.reasoningCard,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              <View style={styles.reasoningHeader}>
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={colors.systemOrange}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.reasoningTitle, { color: colors.label }]}>
                  Why this routine
                </Text>
              </View>
              <Text style={[styles.reasoningBody, { color: colors.secondaryLabel }]}>
                {generatedRoutine.reasoning}
              </Text>
            </Animated.View>
          )}

          {/* AM Steps */}
          {amSteps.length > 0 && (
            <View style={styles.sectionBlock}>
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={styles.sectionHeaderRow}
              >
                <Ionicons name="sunny-outline" size={18} color={colors.systemOrange} />
                <Text style={[styles.sectionHeader, { color: colors.label }]}>
                  Morning
                </Text>
              </Animated.View>
              {amSteps.map((step, i) => (
                <StepCard key={`am-${i}`} step={step} index={i} colors={colors} />
              ))}
            </View>
          )}

          {/* PM Steps */}
          {pmSteps.length > 0 && (
            <View style={styles.sectionBlock}>
              <Animated.View
                entering={FadeInUp.delay(300).duration(400)}
                style={styles.sectionHeaderRow}
              >
                <Ionicons name="moon-outline" size={18} color={colors.systemIndigo} />
                <Text style={[styles.sectionHeader, { color: colors.label }]}>
                  Evening
                </Text>
              </Animated.View>
              {pmSteps.map((step, i) => (
                <StepCard key={`pm-${i}`} step={step} index={i} colors={colors} />
              ))}
            </View>
          )}

          {/* Ungrouped steps (no period field) */}
          {ungroupedSteps.length > 0 && (
            <View style={styles.sectionBlock}>
              {ungroupedSteps.map((step, i) => (
                <StepCard key={`step-${i}`} step={step} index={i} colors={colors} />
              ))}
            </View>
          )}

          {/* Tips */}
          {generatedRoutine.tips && generatedRoutine.tips.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(400).duration(500)}
              style={styles.sectionBlock}
            >
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sparkles-outline" size={18} color={colors.systemPurple} />
                <Text style={[styles.sectionHeader, { color: colors.label }]}>
                  Tips from JAY
                </Text>
              </View>
              {generatedRoutine.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons
                    name="bulb"
                    size={16}
                    color={colors.systemYellow}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={[styles.tipText, { color: colors.secondaryLabel }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Cost */}
          {generatedRoutine.total_monthly_cost > 0 && (
            <Animated.View
              entering={FadeInUp.delay(500).duration(500)}
              style={[
                styles.costCard,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              <Ionicons name="wallet-outline" size={20} color={colors.systemGreen} />
              <Text style={[styles.costText, { color: colors.label }]}>
                Total monthly cost: ₹{generatedRoutine.total_monthly_cost}
              </Text>
            </Animated.View>
          )}

          {/* Action buttons */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(500)}
            style={styles.actionsContainer}
          >
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.systemGreen }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Save Routine</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.regenerateButton,
                { borderColor: colors.systemBlue },
              ]}
              onPress={handleRegenerate}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={colors.systemBlue}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.regenerateButtonText, { color: colors.systemBlue }]}>
                Regenerate
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── State 3: Error / Empty ───────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemBackground }]}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.cancelText, { color: colors.systemBlue }]}>Back</Text>
      </TouchableOpacity>

      <View style={styles.errorCenter}>
        <View
          style={[
            styles.errorIconCircle,
            { backgroundColor: colors.systemRed + '18' },
          ]}
        >
          <Ionicons name="alert-circle" size={40} color={colors.systemRed} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.label }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.secondaryLabel }]}>
          We couldn't generate your routine. Please try again.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.systemBlue }]}
          onPress={handleRegenerate}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Cancel / Back
  cancelButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // ── Generating State ──────────────────────────────────────────────────────
  generatingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  orbContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  orbOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  orbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },

  // Progress steps
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 15,
    flex: 1,
  },

  // ── Result State ──────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  resultTitle: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit',
    marginBottom: 20,
  },

  // Reasoning card
  reasoningCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasoningTitle: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  reasoningBody: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 20,
  },

  // Section
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },

  // Step card
  stepCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  stepCardHeaderText: {
    flex: 1,
  },
  stepCategory: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepProductName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 20,
  },
  stepPrice: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginLeft: 8,
  },
  stepInstruction: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 18,
    marginTop: 8,
    marginLeft: 40,
  },
  stepWhy: {
    fontSize: 12,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 6,
    marginLeft: 40,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    paddingRight: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    lineHeight: 20,
    flex: 1,
  },

  // Cost
  costCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  costText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },

  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  regenerateButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },

  // ── Error State ───────────────────────────────────────────────────────────
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
});
