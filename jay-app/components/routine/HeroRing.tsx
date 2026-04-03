import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~364.4

interface HeroRingProps {
  completed: number;
  total: number;
}

export default function HeroRing({ completed, total }: HeroRingProps) {
  const { colors } = useTheme();
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const isComplete = completed >= total && total > 0;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 600 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  const percent = Math.round(total > 0 ? (completed / total) * 100 : 0);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Svg width={130} height={130} viewBox="0 0 130 130">
          {/* Track */}
          <Circle
            cx={65}
            cy={65}
            r={RADIUS}
            stroke={colors.systemGray5}
            strokeWidth={8}
            fill="none"
          />
          {/* Progress */}
          <AnimatedCircle
            cx={65}
            cy={65}
            r={RADIUS}
            stroke={isComplete ? colors.systemGreen : colors.systemBlue}
            strokeWidth={8}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation={-90}
            origin="65, 65"
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={[styles.countText, { color: colors.label }]}>
            {completed}/{total}
          </Text>
          <Text style={[styles.stepsText, { color: colors.secondaryLabel }]}>
            STEPS
          </Text>
        </View>
      </View>

      <Text style={[styles.percentText, { color: colors.secondaryLabel }]}>
        {percent}% complete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
  },
  stepsText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    marginTop: 8,
  },
});
