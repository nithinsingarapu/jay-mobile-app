import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

interface ProgressBarProps {
  progress: number;
  height?: number;
  animate?: boolean;
}

export function ProgressBar({ progress, height = 4, animate = true }: ProgressBarProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = animate ? withTiming(progress, { duration: 500, easing: Easing.out(Easing.quad) }) : progress;
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

  return (
    <View style={[styles.track, { height, backgroundColor: colors.quaternarySystemFill }]}>
      <Animated.View style={[styles.fill, animatedStyle, { height, backgroundColor: colors.systemBlue }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 2, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: 2 },
});
