import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompletionCircle } from '../ui/CompletionCircle';
import type { RoutineStep as RoutineStepType } from '../../types';

interface RoutineStepProps {
  step: RoutineStepType;
  isLast: boolean;
  onToggle: (id: string) => void;
}

export function RoutineStep({ step, isLast, onToggle }: RoutineStepProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.left}>
        <View style={[styles.stepCircle, step.completed && styles.stepCircleCompleted]}>
          <Text style={[styles.stepNum, step.completed && styles.stepNumCompleted]}>{step.step}</Text>
        </View>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.category}>{step.category.toUpperCase()}</Text>
            <Text style={styles.product}>{step.product}</Text>
            <Text style={styles.instruction}>{step.instruction}</Text>
          </View>
          <CompletionCircle completed={step.completed} onPress={() => onToggle(step.id)} />
        </View>
        {step.waitTime && (
          <View style={styles.waitChip}>
            <Text style={styles.waitText}>Wait {step.waitTime}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  left: { alignItems: 'center', width: 28 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 1 },
  stepCircleCompleted: { backgroundColor: '#000', borderColor: '#000' },
  stepNum: { fontSize: 12, fontWeight: '600', color: '#999', fontFamily: 'Outfit-SemiBold' },
  stepNumCompleted: { color: '#fff' },
  line: { flex: 1, width: 1, backgroundColor: '#E5E5E5', marginVertical: 4 },
  card: { flex: 1, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: '#fff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 8 },
  category: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  product: { fontSize: 14, fontWeight: '600', marginTop: 6, fontFamily: 'Outfit-SemiBold' },
  instruction: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18, fontFamily: 'Outfit' },
  waitChip: { marginTop: 10, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  waitText: { fontSize: 11, color: '#999', fontFamily: 'Outfit-Medium' },
});
