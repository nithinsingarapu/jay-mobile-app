import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import { ProductOut } from '../../types/product';
import { ProductDetailMock } from '../../data/mockProductDetail';
import ReportCardGrid from './ReportCardGrid';

interface Props {
  product: ProductOut;
  mock: ProductDetailMock;
}

export default function OverviewTab({ product, mock }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleAddToRoutine = () => {
    router.push('/(screens)/routine' as any);
  };

  const handleFullResearch = () => {
    Alert.alert('Coming Soon', 'Full research reports will be available in a future update.');
  };

  return (
    <View style={styles.container}>
      {/* JAY Says */}
      <View
        style={[
          styles.jaySaysCard,
          {
            backgroundColor: colors.secondarySystemBackground,
            borderLeftColor: colors.systemBlue,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.label }]}>
          JAY Says
        </Text>
        <Text
          style={[
            styles.jaySaysText,
            { color: colors.secondaryLabel },
          ]}
        >
          {mock.jay_says}
        </Text>
      </View>

      {/* Report Card */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label, paddingHorizontal: 16 }]}>
          Report Card
        </Text>
        <ReportCardGrid reportCard={mock.report_card} />
      </View>

      {/* Why JAY Recommends */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label, paddingHorizontal: 16 }]}>
          Why JAY Recommends
        </Text>
        {mock.why_recommends.map((reason, i) => (
          <View key={i} style={styles.checkRow}>
            <Text style={styles.checkIcon}>✅</Text>
            <Text style={[styles.checkText, { color: colors.label }]}>
              {reason}
            </Text>
          </View>
        ))}
      </View>

      {/* Things to Know */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.label, paddingHorizontal: 16 }]}>
          Things to Know
        </Text>
        {mock.positives.map((item, i) => (
          <View key={`pos-${i}`} style={styles.checkRow}>
            <Text style={[styles.plusIcon, { color: colors.systemGreen }]}>+</Text>
            <Text style={[styles.checkText, { color: colors.label }]}>
              {item}
            </Text>
          </View>
        ))}
        {mock.limitations.map((item, i) => (
          <View key={`lim-${i}`} style={styles.checkRow}>
            <Text style={[styles.minusIcon, { color: colors.systemOrange }]}>−</Text>
            <Text style={[styles.checkText, { color: colors.label }]}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.systemBlue }]}
          activeOpacity={0.8}
          onPress={handleAddToRoutine}
        >
          <Text style={styles.primaryButtonText}>Add to Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.outlinedButton,
            { borderColor: colors.systemBlue },
          ]}
          activeOpacity={0.8}
          onPress={handleFullResearch}
        >
          <Text style={[styles.outlinedButtonText, { color: colors.systemBlue }]}>
            Full Research
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE.xxl,
    paddingVertical: SPACE.lg,
  },
  section: {
    gap: SPACE.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
  jaySaysCard: {
    marginHorizontal: 16,
    borderLeftWidth: 3,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    gap: SPACE.sm,
  },
  jaySaysText: {
    fontSize: 15,
    fontFamily: 'Outfit',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: SPACE.sm,
  },
  checkIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  plusIcon: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginTop: -1,
    width: 18,
    textAlign: 'center',
  },
  minusIcon: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginTop: -1,
    width: 18,
    textAlign: 'center',
  },
  checkText: {
    fontSize: 15,
    fontFamily: 'Outfit',
    lineHeight: 22,
    flex: 1,
  },
  buttons: {
    paddingHorizontal: 16,
    gap: SPACE.md,
  },
  primaryButton: {
    height: 50,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    color: '#FFFFFF',
  },
  outlinedButton: {
    height: 50,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlinedButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
});
