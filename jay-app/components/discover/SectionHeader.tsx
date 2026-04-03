import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.secondaryLabel }]}>{title}</Text>
      {action && (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={[styles.action, { color: colors.systemBlue }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  action: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
});
