/**
 * Routine Template Detail Screen
 * Shows full details for a routine template from the library.
 * Pushed via templateId route param.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { getTemplateById } from '../../data/routineLibrary';
import { useRoutineStore } from '../../stores/routineStore';

export default function RoutineTemplateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  const template = templateId ? getTemplateById(templateId) : undefined;

  // ── Not found ──────────────────────────────────────────────────────
  if (!template) {
    return (
      <View style={[s.root, { backgroundColor: colors.systemBackground, paddingTop: insets.top }]}>
        <View style={s.notFound}>
          <Pressable onPress={() => router.back()} style={s.notFoundBack}>
            <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
              <Path d="M9 1L1 9l8 8" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ color: colors.systemBlue, fontSize: 17, fontFamily: 'Outfit', marginLeft: 6 }}>Back</Text>
          </Pressable>
          <View style={s.notFoundCenter}>
            <Text style={[s.notFoundText, { color: colors.secondaryLabel }]}>
              Template not found
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Tag color helper ───────────────────────────────────────────────
  const tagColor = (tag: string): { bg: string; text: string } => {
    const lower = tag.toLowerCase();
    if (lower.includes('morning') || lower.includes('am'))
      return { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' };
    if (lower.includes('night') || lower.includes('pm'))
      return { bg: 'rgba(191,90,242,0.15)', text: '#BF5AF2' };
    if (lower.includes('acne') || lower.includes('oily'))
      return { bg: 'rgba(255,69,58,0.15)', text: '#FF453A' };
    if (lower.includes('glow') || lower.includes('brightening'))
      return { bg: 'rgba(255,214,10,0.15)', text: '#FFD60A' };
    if (lower.includes('hydrat'))
      return { bg: 'rgba(100,210,255,0.15)', text: '#64D2FF' };
    if (lower.includes('barrier') || lower.includes('sensitive'))
      return { bg: 'rgba(48,209,88,0.15)', text: '#30D158' };
    if (lower.includes('anti-aging') || lower.includes('retinol'))
      return { bg: 'rgba(94,92,230,0.15)', text: '#5E5CE6' };
    return { bg: 'rgba(142,142,147,0.15)', text: '#8E8E93' };
  };

  // ── Difficulty label ───────────────────────────────────────────────
  const difficultyLabel = (d: string) => {
    switch (d) {
      case 'beginner': return { text: 'Beginner', color: '#30D158' };
      case 'intermediate': return { text: 'Intermediate', color: '#FF9F0A' };
      case 'advanced': return { text: 'Advanced', color: '#FF453A' };
      default: return { text: d, color: '#8E8E93' };
    }
  };

  const diff = difficultyLabel(template.difficulty);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out the "${template.name}" skincare routine on JAY!\n\n${template.philosophy}\n\nDownload JAY to try it.`,
      });
    } catch {}
  };

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.systemBackground }]}>
      {/* ── Sticky Nav Bar ─────────────────────────────────────────── */}
      <View style={[s.navBar, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <Pressable onPress={() => router.back()} style={s.navLeft} hitSlop={8}>
          <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
            <Path d="M9 1L1 9l8 8" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[s.navText, { color: colors.systemBlue }]}>Explore</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={handleShare} hitSlop={8}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M8.59 13.51l6.83-3.03M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0zM8.59 14.51l6.83 3.01" stroke={colors.systemBlue} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={() => {
              router.push({ pathname: '/(screens)/build-with-jay', params: { templateId: template.id } });
            }}
            hitSlop={8}
          >
            <Text style={[s.navText, { color: colors.systemBlue }]}>Use Template</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACE.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ───────────────────────────────────────────────── */}
        <View style={s.hero}>
          <Text style={s.heroEmoji}>{template.emoji}</Text>
          <View style={s.heroContent}>
            <Text style={s.heroCategory}>{template.tags?.[0]?.toUpperCase() ?? 'ROUTINE'}</Text>
            <Text style={s.heroName}>{template.name}</Text>
          </View>
        </View>

        {/* ── Tags Row ───────────────────────────────────────────── */}
        <View style={s.tagsRow}>
          {/* Difficulty pill */}
          <View style={[s.tagPill, { backgroundColor: `${diff.color}20` }]}>
            <Text style={[s.tagPillText, { color: diff.color }]}>{diff.text}</Text>
          </View>
          {/* Step count pill */}
          <View style={[s.tagPill, { backgroundColor: colors.tertiarySystemFill }]}>
            <Text style={[s.tagPillText, { color: colors.secondaryLabel }]}>{template.stepCount} steps</Text>
          </View>
          {template.tags?.map((tag, i) => {
            const tc = tagColor(tag);
            return (
              <View key={i} style={[s.tagPill, { backgroundColor: tc.bg }]}>
                <Text style={[s.tagPillText, { color: tc.text }]}>{tag}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Philosophy ─────────────────────────────────────────── */}
        {template.philosophy ? (
          <Text style={[s.philosophy, { color: colors.secondaryLabel }]}>
            {template.philosophy}
          </Text>
        ) : null}

        {/* ── The Protocol ───────────────────────────────────────── */}
        {template.protocol && template.protocol.length > 0 && (
          <>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>THE PROTOCOL</Text>
            <View style={[s.groupedTable, { backgroundColor: colors.secondaryGroupedBackground }]}>
              {template.protocol.map((step, i) => (
                <View key={i}>
                  <View style={s.protocolRow}>
                    <View style={[s.stepCircle, { backgroundColor: step.color || colors.systemBlue }]}>
                      <Text style={s.stepCircleText}>{step.step}</Text>
                    </View>
                    <View style={s.protocolTextWrap}>
                      <Text style={[s.protocolName, { color: colors.label }]}>{step.name}</Text>
                      <Text style={[s.protocolDesc, { color: colors.secondaryLabel }]}>{step.description}</Text>
                    </View>
                  </View>
                  {i < template.protocol.length - 1 && (
                    <View style={[s.separator, { backgroundColor: colors.separator }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Key Ingredients ────────────────────────────────────── */}
        {template.keyIngredients && template.keyIngredients.length > 0 && (
          <>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>KEY INGREDIENTS</Text>
            <View style={s.ingredientsRow}>
              {template.keyIngredients.map((ing, i) => (
                <View key={i} style={[s.ingredientPill, { backgroundColor: colors.tertiarySystemFill }]}>
                  <Text style={[s.ingredientPillText, { color: colors.secondaryLabel }]}>{ing}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Best For ───────────────────────────────────────────── */}
        {template.bestFor && template.bestFor.length > 0 && (
          <>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>BEST FOR</Text>
            <View style={[s.groupedTable, { backgroundColor: colors.secondaryGroupedBackground }]}>
              {template.bestFor.map((item, i) => (
                <View key={i}>
                  <View style={s.bestForRow}>
                    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                      <Path d="M3 9.5l4 4 8-8" stroke="#30D158" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={[s.bestForText, { color: colors.label }]}>{item}</Text>
                  </View>
                  {i < template.bestFor.length - 1 && (
                    <View style={[s.separator, { backgroundColor: colors.separator }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Source ──────────────────────────────────────────────── */}
        {template.source ? (
          <>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>SOURCE</Text>
            <Text style={[s.sourceText, { color: colors.secondaryLabel }]}>
              {template.source}
            </Text>
          </>
        ) : null}

        {/* ── Action Buttons ─────────────────────────────────────── */}
        <View style={s.actions}>
          <Pressable
            style={[s.primaryBtn, { backgroundColor: colors.systemBlue }]}
            onPress={() => {
              // Map template to the correct routine type for the generator
              // The template has categories like 'core', 'concern', 'cultural', 'trending', etc.
              // Map to backend routine types: essential, complete, glass_skin, barrier_repair, anti_acne, custom
              const typeMap: Record<string, string> = {
                essential_3step: 'essential',
                standard_4step: 'complete',
                standard_5_6: 'complete',
                extended_7_9: 'glass_skin',
                kbeauty_10: 'glass_skin',
                acne: 'anti_acne',
                anti_aging: 'complete',
                hyperpigmentation: 'complete',
                rosacea: 'barrier_repair',
                sensitive: 'barrier_repair',
                barrier_repair: 'barrier_repair',
                eczema: 'barrier_repair',
                psoriasis: 'barrier_repair',
              };
              const routineType = typeMap[template.id] || 'auto';

              router.push({
                pathname: '/(screens)/build-with-jay',
                params: {
                  routineType,
                  period: 'both',
                  routineName: template.name,
                  messageToJay: `Build a "${template.name}" routine. Philosophy: ${template.philosophy}. Key ingredients: ${template.keyIngredients.join(', ')}. Best for: ${template.bestFor.join(', ')}.`,
                },
              } as any);
            }}
          >
            <Text style={s.primaryBtnText}>Build This Routine with JAY</Text>
          </Pressable>

          <Pressable
            style={[s.primaryBtn, { backgroundColor: colors.secondarySystemBackground }]}
            onPress={async () => {
              // Create empty routine with this template's type and navigate to edit
              const store = useRoutineStore.getState();
              const typeMap: Record<string, string> = {
                essential_3step: 'essential', standard_4step: 'complete', standard_5_6: 'complete',
                extended_7_9: 'glass_skin', kbeauty_10: 'glass_skin', acne: 'anti_acne',
                barrier_repair: 'barrier_repair', sensitive: 'barrier_repair',
              };
              const routineType = typeMap[template.id] || 'custom';
              try {
                const created = await store.createRoutine({
                  name: template.name,
                  period: 'morning',
                  routine_type: routineType,
                  description: template.philosophy,
                });
                if (created) {
                  // Add template step categories
                  for (const step of template.protocol) {
                    await store.addStep(created.id, {
                      category: step.name.toLowerCase().replace(/\s+/g, '_'),
                      instruction: step.description,
                    });
                  }
                  router.replace({ pathname: '/(screens)/routine-edit', params: { routineId: created.id } } as any);
                }
              } catch (e) {
                Alert.alert('Error', 'Failed to create routine. Try again.');
              }
            }}
          >
            <Text style={[s.primaryBtnText, { color: colors.label }]}>Build Manually from Template</Text>
          </Pressable>

          <Pressable
            style={[s.secondaryBtn, { backgroundColor: colors.tertiarySystemFill }]}
            onPress={() => {
              Share.share({
                message: `Check out the "${template.name}" skincare routine on JAY!\n\n${template.philosophy}\n\nKey ingredients: ${template.keyIngredients.join(', ')}\n\nDownload JAY to try it.`,
              });
            }}
          >
            <Text style={[s.secondaryBtnText, { color: colors.secondaryLabel }]}>Share This Routine</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Nav Bar ────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.sm,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // ── Hero ───────────────────────────────────────────────────────────
  hero: {
    height: 160,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.lg,
    backgroundColor: '#1a2a3a',
    // gradient approximation via layered bg
    position: 'relative',
    overflow: 'hidden',
  },
  heroEmoji: {
    position: 'absolute',
    fontSize: 56,
    opacity: 0.3,
    alignSelf: 'center',
    top: 40,
    left: '50%',
    marginLeft: -28,
  },
  heroContent: {
    zIndex: 1,
  },
  heroCategory: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.6,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.36,
  },

  // ── Tags ───────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    gap: SPACE.sm,
  },
  tagPill: {
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: SPACE.xs + 1,
    borderRadius: RADIUS.xs,
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
  },

  // ── Philosophy ─────────────────────────────────────────────────────
  philosophy: {
    fontSize: 17,
    fontFamily: 'Outfit',
    lineHeight: 24,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
  },

  // ── Section Headers ────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Outfit',
    fontWeight: '400',
    letterSpacing: -0.08,
    textTransform: 'uppercase',
    paddingTop: 28,
    paddingBottom: SPACE.sm,
    paddingLeft: SPACE.xxxl,
  },

  // ── Grouped Table ──────────────────────────────────────────────────
  groupedTable: {
    marginHorizontal: SPACE.lg,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },

  // ── Protocol Rows ──────────────────────────────────────────────────
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACE.md,
    marginTop: 2,
  },
  stepCircleText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  protocolTextWrap: {
    flex: 1,
  },
  protocolName: {
    fontSize: 17,
    fontFamily: 'Outfit',
    fontWeight: '400',
  },
  protocolDesc: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
    lineHeight: 18,
  },

  // ── Separator ──────────────────────────────────────────────────────
  separator: {
    height: 0.33,
    marginLeft: 56,
  },

  // ── Key Ingredients ────────────────────────────────────────────────
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACE.lg,
    gap: SPACE.sm,
  },
  ingredientPill: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADIUS.xs,
  },
  ingredientPillText: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },

  // ── Best For ───────────────────────────────────────────────────────
  bestForRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.sm,
  },
  bestForText: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },

  // ── Source ─────────────────────────────────────────────────────────
  sourceText: {
    fontSize: 13,
    fontFamily: 'Outfit',
    lineHeight: 18,
    paddingHorizontal: SPACE.xl,
  },

  // ── Action Buttons ─────────────────────────────────────────────────
  actions: {
    paddingHorizontal: SPACE.xl,
    paddingTop: 28,
    paddingBottom: SPACE.xxl,
    gap: SPACE.md,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
  },

  // ── Not Found ──────────────────────────────────────────────────────
  notFound: {
    flex: 1,
  },
  notFoundBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.lg,
    gap: 6,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // ── Scroll ─────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
});
