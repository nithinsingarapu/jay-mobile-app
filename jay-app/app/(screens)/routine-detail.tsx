/**
 * Routine Detail Screen — Full details for a single routine.
 * Pushed via routineId route param.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { useRoutineStore } from '../../stores/routineStore';
import { RoutineDetailHeader } from '../../components/routine/RoutineDetailHeader';
import { RoutineDetailSteps } from '../../components/routine/RoutineDetailSteps';
import { RoutineDetailInfo } from '../../components/routine/RoutineDetailInfo';
import { RoutineDetailActions } from '../../components/routine/RoutineDetailActions';
import type { RoutineOut } from '../../types/routine';

export default function RoutineDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { routines, deleteRoutine } = useRoutineStore();
  const routine = routines.find(r => r.id === routineId);

  const handleEdit = useCallback(() => {
    router.push({ pathname: '/(screens)/routine-edit', params: { routineId } });
  }, [router, routineId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete routine?',
      'This will permanently remove this routine and all its tracking data.',
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

  // ── Not found ────────────────────────────────────────────────────────
  if (!routine) {
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
              Routine not found
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.systemBackground }]}>
      <RoutineDetailHeader routine={routine} onBack={() => router.back()} onEdit={handleEdit} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Steps */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>STEPS</Text>
        <View style={s.sectionContent}>
          <RoutineDetailSteps steps={routine.steps} />
        </View>

        {/* Details */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>DETAILS</Text>
        <View style={s.sectionContent}>
          <RoutineDetailInfo routine={routine} />
        </View>

        {/* Actions */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>ACTIONS</Text>
        <View style={s.sectionContent}>
          <RoutineDetailActions
            isActive={routine.is_active}
            onSetActive={() => {}}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  notFound: {
    flex: 1,
  },
  notFoundBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: 'Outfit-Medium',
  },
});
