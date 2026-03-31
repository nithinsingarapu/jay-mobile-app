import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  accessibilityLabel?: string;
}

export function ScoreRing({ score, size = 64, strokeWidth = 3.5, accessibilityLabel }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    strokeDashoffset.value = withTiming(targetOffset, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  const fontSize = size >= 80 ? 28 : size >= 64 ? 22 : 16;

  return (
    <View
      style={{ width: size, height: size, position: 'relative' }}
      accessible={true}
      accessibilityLabel={accessibilityLabel ?? `Score: ${score} out of 100`}
      accessibilityValue={{ now: score, min: 0, max: 100 }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#000"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Outfit-Bold' }}>{score}</Text>
        </View>
      </View>
    </View>
  );
}
