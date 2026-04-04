import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';

interface RoutineHeaderProps {
  onPlusPress: () => void;
}

export default function RoutineHeader({ onPlusPress }: RoutineHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.label }]}>Routine</Text>
      </View>
      <TouchableOpacity
        onPress={onPlusPress}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Svg width={28} height={28} viewBox="0 0 28 28">
          <Circle
            cx={14}
            cy={14}
            r={13}
            fill={colors.tertiarySystemFill}
            stroke="none"
          />
          <Line
            x1={14}
            y1={8}
            x2={14}
            y2={20}
            stroke={colors.systemBlue}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Line
            x1={8}
            y1={14}
            x2={20}
            y2={14}
            stroke={colors.systemBlue}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.37,
  },
});
