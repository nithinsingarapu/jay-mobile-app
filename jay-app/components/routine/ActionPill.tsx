import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ActionPillProps {
  label: string;
  color?: string;
  tintBg?: string;
  onPress: () => void;
}

const ActionPill: React.FC<ActionPillProps> = ({ label, color, tintBg, onPress }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: tintBg || colors.tertiarySystemFill },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.label, { color: color || colors.secondaryLabel }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
});

export default ActionPill;
