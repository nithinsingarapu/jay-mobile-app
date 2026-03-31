import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

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
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      style={[variant === 'primary' ? styles.primary : styles.outline, animatedStyle, style, isDisabled && { opacity: 0.5 }]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      onPressIn={() => { if (!isDisabled) opacity.value = withTiming(0.85, { duration: 100 }); }}
      onPressOut={() => { opacity.value = withTiming(1, { duration: 100 }); }}
      accessible={true}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#000'} style={styles.spinner} />
        ) : null}
        <Text style={variant === 'primary' ? styles.primaryText : styles.outlineText}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: 2,
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  outlineText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
});
