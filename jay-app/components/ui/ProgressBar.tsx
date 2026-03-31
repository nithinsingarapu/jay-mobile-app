import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  animate?: boolean;
}

export function ProgressBar({ progress, height = 4, animate = true }: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = animate
      ? withTiming(progress, { duration: 500, easing: Easing.out(Easing.quad) })
      : progress;
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, animatedStyle, { height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#F2F2F2',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    backgroundColor: '#000',
    borderRadius: 2,
  },
});
