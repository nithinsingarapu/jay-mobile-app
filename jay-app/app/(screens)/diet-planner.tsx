import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../../components/ui/TopBar';
import { Chip } from '../../components/ui/Chip';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { Button } from '../../components/ui/Button';
import { mockDietPlan } from '../../constants/mockData';

export default function DietPlannerScreen() {
  const insets = useSafeAreaInsets();
  const [optimizeFor, setOptimizeFor] = useState<string[]>(mockDietPlan.optimizeFor);

  const waterPct = Math.round((mockDietPlan.waterIntake.current / mockDietPlan.waterIntake.goal) * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar title="Diet Planner" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Optimize for */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OPTIMIZING FOR</Text>
          <View style={styles.chips}>
            {mockDietPlan.optimizeFor.map((item) => (
              <Chip key={item} label={item} active={optimizeFor.includes(item)} onPress={() => {}} />
            ))}
          </View>
        </View>

        {/* Meal cards */}
        {mockDietPlan.meals.map((meal) => (
          <View key={meal.type} style={styles.mealCard}>
            <Text style={styles.mealType}>{meal.type.toUpperCase()}</Text>
            <Text style={styles.mealDish}>{meal.dish}</Text>
            <Text style={styles.mealDesc}>{meal.description}</Text>
            <View style={styles.nutrients}>
              {meal.nutrients.map((n) => (
                <View key={n} style={styles.nutrientChip}>
                  <Text style={styles.nutrientText}>{n}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Water intake */}
        <View style={styles.waterCard}>
          <View style={styles.waterLeft}>
            <Text style={styles.sectionLabel}>WATER INTAKE</Text>
            <Text style={styles.waterNum}>{mockDietPlan.waterIntake.current}/{mockDietPlan.waterIntake.goal} glasses</Text>
            <Text style={styles.waterSub}>2 more glasses to go</Text>
          </View>
          <ScoreRing score={waterPct} size={72} />
        </View>

        <Button label="Generate New Plan" variant="outline" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Outfit-SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, marginBottom: 12 },
  mealType: { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
  mealDish: { fontSize: 15, fontWeight: '600', marginTop: 6, fontFamily: 'Outfit-SemiBold' },
  mealDesc: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18, fontFamily: 'Outfit' },
  nutrients: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  nutrientChip: { backgroundColor: '#F5F5F5', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  nutrientText: { fontSize: 11, color: '#666', fontFamily: 'Outfit-Medium' },
  waterCard: { borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  waterLeft: {},
  waterNum: { fontSize: 18, fontWeight: '600', marginTop: 6, fontFamily: 'Outfit-SemiBold' },
  waterSub: { fontSize: 12, color: '#999', marginTop: 3, fontFamily: 'Outfit' },
});
