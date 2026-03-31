import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface CompletionCircleProps {
  completed: boolean;
  onPress?: () => void;
  size?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function CompletionCircle({ completed, onPress, size = 20 }: CompletionCircleProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(1.2, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={handlePress} accessible={true} accessibilityLabel={completed ? 'Completed' : 'Mark complete'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
      <AnimatedView style={[completed ? styles.completed : styles.incomplete, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]}>
        {completed && (
          <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12">
            <Path d="M2 6l3 3 5-5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </Svg>
        )}
      </AnimatedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  completed: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomplete: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
});
