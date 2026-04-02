import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StepCheckbox from './StepCheckbox';
import { useTheme } from '../../lib/theme';
import type { StepOut, TodayStepStatus } from '../../types/routine';

interface StepRowProps {
  step: StepOut;
  todayStep?: TodayStepStatus;
  onComplete: () => void;
  onLongPress: () => void;
  isLast: boolean;
}

function formatWaitTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.round(seconds / 60);
    return `${mins}m wait`;
  }
  return `${seconds}s wait`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const fmtCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', every_other_day: 'Every other day',
  '2x_week': '2x/week', '3x_week': '3x/week',
  weekly: 'Weekly', as_needed: 'As needed',
};

export default function StepRow({
  step,
  todayStep,
  onComplete,
  onLongPress,
  isLast,
}: StepRowProps) {
  const { colors } = useTheme();

  const isCompleted = todayStep?.completed ?? false;
  const isSkipped = todayStep?.skipped ?? false;
  const displayName = step.custom_product_name || step.product_name;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <StepCheckbox
            completed={isCompleted}
            skipped={isSkipped}
            onPress={onComplete}
            onLongPress={onLongPress}
          />
        </View>

        {/* Middle content */}
        <View style={styles.content}>
          <Text
            style={[styles.category, { color: colors.label }]}
            numberOfLines={1}
          >
            {fmtCategory(step.category)}
          </Text>
          {displayName && (
            <Text
              style={[styles.productName, { color: colors.secondaryLabel }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          )}
          {step.instruction && (
            <Text
              style={[styles.instruction, { color: colors.tertiaryLabel }]}
              numberOfLines={2}
            >
              {step.instruction}
            </Text>
          )}
          {isCompleted && todayStep?.completed_at && (
            <Text style={[styles.timestamp, { color: colors.systemGreen }]}>
              {formatTimestamp(todayStep.completed_at)}
            </Text>
          )}
        </View>

        {/* Right chips */}
        <View style={styles.rightColumn}>
          {step.wait_time_seconds != null && step.wait_time_seconds > 0 && (
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.tertiarySystemFill },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.secondaryLabel }]}>
                {formatWaitTime(step.wait_time_seconds)}
              </Text>
            </View>
          )}
          {step.frequency !== 'daily' && (
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.tertiarySystemFill },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.secondaryLabel }]}>
                {FREQ_LABELS[step.frequency] || fmtCategory(step.frequency)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Separator */}
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 44,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    width: 24,
    marginRight: 16,
    paddingTop: 2,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: -0.24,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit',
    letterSpacing: -0.08,
    marginTop: 2,
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'Outfit',
    lineHeight: 16,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    letterSpacing: 0.07,
  },
  separator: {
    height: 0.33,
    marginLeft: 56,
  },
});
