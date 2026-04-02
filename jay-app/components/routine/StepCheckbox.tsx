import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

interface StepCheckboxProps {
  completed: boolean;
  skipped: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const SIZE = 24;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function StepCheckbox({
  completed,
  skipped,
  onPress,
  onLongPress,
}: StepCheckboxProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDone = completed || skipped;

  const handlePress = () => {
    if (isDone) return;
    scale.value = withSpring(1.15, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = () => {
    if (isDone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLongPress();
  };

  const getBgColor = () => {
    if (completed) return colors.systemGreen;
    if (skipped) return colors.systemOrange;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (completed) return colors.systemGreen;
    if (skipped) return colors.systemOrange;
    return colors.systemGray4;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      {completed && (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path
            d="M2.5 7.5L5.5 10.5L11.5 3.5"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
      {skipped && (
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Line
            x1="3.5"
            y1="7"
            x2="10.5"
            y2="7"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
