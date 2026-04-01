import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompletionCircle } from '../ui/CompletionCircle';
import { useTheme } from '../../lib/theme';
import type { RoutineStep as RoutineStepType } from '../../types';

interface RoutineStepProps { step: RoutineStepType; isLast: boolean; onToggle: (id: string) => void; }

export function RoutineStep({ step, isLast, onToggle }: RoutineStepProps) {
  const { colors } = useTheme();
  return (
    <View style={s.wrapper}>
      <View style={s.left}>
        <View style={[s.stepCircle, { borderColor: colors.separator, backgroundColor: colors.systemBackground }, step.completed && { backgroundColor: colors.systemGreen, borderColor: colors.systemGreen }]}>
          <Text style={[s.stepNum, { color: step.completed ? '#fff' : colors.secondaryLabel }]}>{step.step}</Text>
        </View>
        {!isLast && <View style={[s.line, { backgroundColor: colors.separator }]} />}
      </View>
      <View style={[s.card, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={s.cardHeader}>
          <View style={s.cardInfo}>
            <Text style={[s.category, { color: colors.tertiaryLabel }]}>{step.category.toUpperCase()}</Text>
            <Text style={[s.product, { color: colors.label }]}>{step.product}</Text>
            <Text style={[s.instruction, { color: colors.secondaryLabel }]}>{step.instruction}</Text>
          </View>
          <CompletionCircle completed={step.completed} onPress={() => onToggle(step.id)} />
        </View>
        {step.waitTime && (
          <View style={[s.waitChip, { backgroundColor: colors.quaternarySystemFill }]}>
            <Text style={[s.waitText, { color: colors.secondaryLabel }]}>Wait {step.waitTime}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  left: { alignItems: 'center', width: 28 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepNum: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  line: { flex: 1, width: 1, marginVertical: 4 },
  card: { flex: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 8 },
  category: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, fontFamily: 'Outfit-SemiBold' },
  product: { fontSize: 15, fontWeight: '600', marginTop: 6, fontFamily: 'Outfit-SemiBold' },
  instruction: { fontSize: 13, marginTop: 4, lineHeight: 18, fontFamily: 'Outfit' },
  waitChip: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  waitText: { fontSize: 13, fontFamily: 'Outfit-Medium' },
});
