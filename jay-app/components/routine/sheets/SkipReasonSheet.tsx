/**
 * SkipReasonSheet — bottom sheet for selecting a reason to skip a routine step.
 * Reports the chosen reason back to the parent via onSkip.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../../lib/theme';
import { SPACE, RADIUS } from '../../../constants/theme';

// ── Types ───────────────────────────────────────────────────────────────

interface SkipReasonSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  onSkip: (reason: string) => void;
  onCancel: () => void;
}

const SKIP_REASONS: { reason: string; label: string }[] = [
  { reason: 'ran_out', label: 'Ran out of product' },
  { reason: 'skin_irritated', label: 'Skin felt irritated' },
  { reason: 'no_time', label: 'Running late' },
  { reason: 'not_available', label: 'Product not available' },
  { reason: 'skip_today', label: 'Just skipping today' },
];

// ── Component ───────────────────────────────────────────────────────────

export function SkipReasonSheet({ sheetRef, onSkip, onCancel }: SkipReasonSheetProps) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['45%'], []);

  // Backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[s.handle, { backgroundColor: colors.systemGray4 }]}
      backgroundStyle={{ backgroundColor: colors.secondarySystemBackground }}
    >
      <BottomSheetView style={s.content}>
        {/* Title */}
        <Text style={[s.title, { color: colors.label }]}>Skip this step?</Text>
        <Text style={[s.subtitle, { color: colors.secondaryLabel }]}>
          Let us know why so JAY can adapt
        </Text>

        {/* Reasons */}
        <View style={[s.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
          {SKIP_REASONS.map((item, idx) => (
            <Pressable
              key={item.reason}
              style={[
                s.groupedRow,
                idx < SKIP_REASONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.separator,
                },
              ]}
              onPress={() => onSkip(item.reason)}
            >
              <Text style={[s.rowLabel, { color: colors.label }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Cancel */}
        <Pressable style={s.cancelBtn} onPress={onCancel}>
          <Text style={[s.cancelText, { color: colors.systemRed }]}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
    marginTop: SPACE.sm,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: SPACE.xs,
    marginBottom: SPACE.lg,
  },
  groupedTable: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.lg,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Outfit',
    fontWeight: '400',
  },
});
