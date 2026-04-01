/**
 * Drop-in replacement for <Text> that automatically applies theme colors.
 * Import and use instead of RN Text when you want auto-theming.
 */
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
}

export function ThemedText({ variant = 'primary', style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  const colorMap: Record<Variant, string> = {
    primary: colors.label,
    secondary: colors.secondaryLabel,
    tertiary: colors.tertiaryLabel,
    quaternary: colors.quaternaryLabel,
  };
  return <RNText style={[{ color: colorMap[variant] }, style]} {...props} />;
}
