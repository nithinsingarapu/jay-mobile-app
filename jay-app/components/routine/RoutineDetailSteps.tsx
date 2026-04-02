import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { StepOut } from '../../types/routine';

interface RoutineDetailStepsProps {
  steps: StepOut[];
}

const fmtCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export function RoutineDetailSteps({ steps }: RoutineDetailStepsProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {index > 0 && (
            <View
              style={[
                s.separator,
                { backgroundColor: colors.separator, marginLeft: 16 },
              ]}
            />
          )}
          <View style={s.row}>
            <View
              style={[s.numberCircle, { backgroundColor: colors.systemBlue }]}
            >
              <Text style={s.numberText}>{index + 1}</Text>
            </View>
            <View style={s.content}>
              <Text style={[s.category, { color: colors.label }]}>
                {fmtCategory(step.category)}
              </Text>
              {step.product_name ? (
                <Text
                  style={[s.productName, { color: colors.secondaryLabel }]}
                >
                  {step.product_name}
                </Text>
              ) : step.custom_product_name ? (
                <Text
                  style={[s.productName, { color: colors.secondaryLabel }]}
                >
                  {step.custom_product_name}
                </Text>
              ) : null}
              {step.why_this_product ? (
                <Text style={[s.why, { color: colors.tertiaryLabel }]}>
                  {step.why_this_product}
                </Text>
              ) : null}
              {step.instruction ? (
                <Text
                  style={[s.instruction, { color: colors.secondaryLabel }]}
                >
                  💡 {step.instruction}
                </Text>
              ) : null}
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  numberText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  category: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  why: {
    fontSize: 13,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    marginTop: 4,
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginTop: 4,
  },
  separator: {
    height: 0.33,
  },
});
