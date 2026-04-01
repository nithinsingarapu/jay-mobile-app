import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ label, onPress, variant = 'primary', style, accessibilityLabel, disabled, loading }: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      style={[
        styles.base,
        isPrimary
          ? [styles.primary, { backgroundColor: colors.systemBlue }]
          : [styles.outline, { borderColor: colors.separator }],
        animStyle,
        style,
        isDisabled && { opacity: 0.5 },
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      onPressIn={() => { if (!isDisabled) scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      accessible={true}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={isPrimary ? '#fff' : colors.systemBlue} style={styles.spinner} />
        ) : null}
        <Text style={[styles.text, isPrimary ? { color: '#fff' } : { color: colors.systemBlue }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {},
  outline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: { marginRight: 2 },
  text: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
});
