/**
 * Routine Edit Screen — Edit a routine's name, description, and manage steps.
 * Pushed via routineId route param from the detail screen.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme';
import { useRoutineStore } from '../../stores/routineStore';
import { AddStepSheet } from '../../components/routine/sheets/AddStepSheet';
import type { RoutineOut, StepOut } from '../../types/routine';

const fmtCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Component ──────────────────────────────────────────────────────────

export default function RoutineEditScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();

  const { routines, removeStep, deleteRoutine, init } = useRoutineStore();
  const routine = routines.find(r => r.id === routineId);

  // Local editable state
  const [name, setName] = useState(routine?.name ?? '');
  const [description, setDescription] = useState(routine?.description ?? '');

  // Bottom sheet ref
  const addStepRef = useRef<BottomSheet>(null);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleDone = useCallback(() => {
    // No PUT /routine/{id} endpoint for name/description yet — just navigate back
    router.back();
  }, [router]);

  const handleRemoveStep = useCallback(
    (step: StepOut) => {
      Alert.alert(
        'Remove step?',
        `Are you sure you want to remove "${step.category}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (!routineId) return;
              await removeStep(routineId, step.id);
            },
          },
        ],
      );
    },
    [routineId, removeStep],
  );

  const handleAddStep = useCallback(() => {
    addStepRef.current?.snapToIndex(0);
  }, []);

  const handleStepAdded = useCallback(async () => {
    await init();
    addStepRef.current?.close();
  }, [init]);

  const handleDeleteRoutine = useCallback(() => {
    Alert.alert(
      'Delete routine?',
      'This action cannot be undone. All steps and tracking data for this routine will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!routineId) return;
            await deleteRoutine(routineId);
            router.back();
          },
        },
      ],
    );
  }, [routineId, deleteRoutine, router]);

  // ── Not found state ──────────────────────────────────────────────────

  if (!routine) {
    return (
      <GestureHandlerRootView style={s.flex}>
        <SafeAreaView style={[s.flex, { backgroundColor: colors.systemBackground }]}>
          <View style={s.notFound}>
            <Text style={[s.notFoundText, { color: colors.secondaryLabel }]}>
              Routine not found
            </Text>
            <Pressable onPress={() => router.back()} style={s.notFoundBack}>
              <Text style={[s.navAction, { color: colors.systemBlue }]}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const steps = routine.steps;

  // ── Main layout ──────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={s.flex}>
      <SafeAreaView style={[s.flex, { backgroundColor: colors.systemBackground }]}>
        {/* ── Nav bar ──────────────────────────────────────────────── */}
        <View style={s.navBar}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text style={[s.navAction, { color: colors.systemBlue }]}>Cancel</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.label }]}>Edit Routine</Text>
          <Pressable onPress={handleDone} hitSlop={8}>
            <Text style={[s.navAction, s.navDone, { color: colors.systemBlue }]}>
              Done
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Name section ──────────────────────────────────────── */}
          <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>NAME</Text>
          <View
            style={[
              s.inputContainer,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <TextInput
              style={[s.nameInput, { color: colors.label }]}
              value={name}
              onChangeText={setName}
              placeholder="Routine name"
              placeholderTextColor={colors.tertiaryLabel}
              returnKeyType="done"
            />
          </View>

          {/* ── Description section ───────────────────────────────── */}
          <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>
            DESCRIPTION
          </Text>
          <View
            style={[
              s.inputContainer,
              s.descriptionContainer,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <TextInput
              style={[s.descriptionInput, { color: colors.label }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
              placeholderTextColor={colors.tertiaryLabel}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* ── Steps section ─────────────────────────────────────── */}
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>
              STEPS
            </Text>
            <View
              style={[s.countBadge, { backgroundColor: colors.secondarySystemBackground }]}
            >
              <Text style={[s.countBadgeText, { color: colors.secondaryLabel }]}>
                {steps.length}
              </Text>
            </View>
          </View>

          {steps.length > 0 && (
            <View
              style={[
                s.groupedTable,
                { backgroundColor: colors.secondarySystemBackground },
              ]}
            >
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <View style={s.separatorOuter}>
                      <View
                        style={[s.separator, { backgroundColor: colors.separator }]}
                      />
                    </View>
                  )}
                  <View style={s.stepRow}>
                    {/* Step number circle */}
                    <View
                      style={[
                        s.stepNumber,
                        { backgroundColor: colors.systemBackground },
                      ]}
                    >
                      <Text style={[s.stepNumberText, { color: colors.label }]}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Step info */}
                    <View style={s.stepInfo}>
                      <Text style={[s.stepCategory, { color: colors.label }]}>
                        {fmtCategory(step.category)}
                      </Text>
                      <Text
                        style={[s.stepProduct, { color: colors.secondaryLabel }]}
                        numberOfLines={1}
                      >
                        {step.product_name ?? step.custom_product_name ?? 'No product'}
                      </Text>
                    </View>

                    {/* Delete button */}
                    <Pressable
                      onPress={() => handleRemoveStep(step)}
                      hitSlop={8}
                      style={s.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.systemRed} />
                    </Pressable>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Add step button */}
          <Pressable
            onPress={handleAddStep}
            style={[
              s.addStepButton,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.systemBlue} />
            <Text style={[s.addStepText, { color: colors.systemBlue }]}>Add Step</Text>
          </Pressable>

          {/* ── Danger zone ───────────────────────────────────────── */}
          <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>
            DANGER ZONE
          </Text>
          <Pressable
            onPress={handleDeleteRoutine}
            style={[
              s.dangerButton,
              { backgroundColor: colors.secondarySystemBackground },
            ]}
          >
            <Text style={[s.dangerButtonText, { color: colors.systemRed }]}>
              Delete Routine
            </Text>
          </Pressable>
        </ScrollView>

        {/* ── Add Step Sheet ──────────────────────────────────────── */}
        <AddStepSheet
          sheetRef={addStepRef}
          routineId={routineId!}
          onAdded={handleStepAdded}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  navAction: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },
  navDone: {
    fontFamily: 'Outfit-Bold',
  },
  navTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },

  // Scroll
  scroll: {
    paddingHorizontal: 16,
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 24,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    marginTop: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
  },

  // Inputs
  inputContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  nameInput: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  descriptionContainer: {
    minHeight: 80,
  },
  descriptionInput: {
    minHeight: 80,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    fontFamily: 'Outfit',
  },

  // Grouped table
  groupedTable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  stepInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stepCategory: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'capitalize',
  },
  stepProduct: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 1,
  },
  deleteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  separatorOuter: {
    paddingLeft: 52,
  },
  separator: {
    height: 0.33,
  },

  // Add step
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    gap: 6,
  },
  addStepText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },

  // Danger zone
  dangerButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: 'Outfit-Medium',
  },
  notFoundBack: {
    paddingVertical: 8,
  },
});
