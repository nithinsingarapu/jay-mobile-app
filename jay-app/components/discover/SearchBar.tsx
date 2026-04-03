import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface SearchBarProps {
  onPress: () => void;
}

export default function SearchBar({ onPress }: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.tertiarySystemFill }]}
    >
      <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
        <Circle
          cx={11}
          cy={11}
          r={8}
          stroke={colors.tertiaryLabel}
          strokeWidth={1.5}
        />
        <Path
          d="M21 21l-4.35-4.35"
          stroke={colors.tertiaryLabel}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[styles.placeholder, { color: colors.tertiaryLabel }]}>
        Products, ingredients, brands...
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
  },
  placeholder: {
    fontSize: 17,
    fontFamily: 'Outfit',
    letterSpacing: -0.41,
  },
});
