import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

export function useAnimatedProgress(targetPercent: number, duration = 500) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(targetPercent, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [targetPercent]);
  return progress;
}

export function useAnimatedScore(targetScore: number, duration = 800) {
  const score = useSharedValue(0);
  useEffect(() => {
    score.value = withTiming(targetScore, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [targetScore]);
  return score;
}

export function useCardScale() {
  const scale = useSharedValue(1);
  const onPressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };
  return { scale, onPressIn, onPressOut };
}
