import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, size = 64, strokeWidth = 3.5 }: ScoreRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    strokeDashoffset.value = withTiming(targetOffset, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: strokeDashoffset.value }));
  const fontSize = size >= 80 ? 28 : size >= 64 ? 22 : 16;

  return (
    <View style={{ width: size, height: size, position: 'relative' }} accessibilityLabel={`Score: ${score}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.quaternarySystemFill} strokeWidth={strokeWidth} />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.systemBlue} strokeWidth={strokeWidth} strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold', color: colors.label }}>{score}</Text>
        </View>
      </View>
    </View>
  );
}
