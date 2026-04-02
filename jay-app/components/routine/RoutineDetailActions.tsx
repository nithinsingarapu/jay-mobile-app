import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface RoutineDetailActionsProps {
  isActive: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoutineDetailActions({
  isActive,
  onSetActive,
  onEdit,
  onDelete,
}: RoutineDetailActionsProps) {
  const { colors } = useTheme();

  const actions = [
    ...(!isActive
      ? [{ label: 'Set as Active', color: colors.systemBlue, onPress: onSetActive }]
      : []),
    { label: 'Edit Routine', color: colors.systemBlue, onPress: onEdit },
    { label: 'Delete Routine', color: colors.systemRed, onPress: onDelete },
  ];

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      {actions.map((action, index) => (
        <React.Fragment key={action.label}>
          {index > 0 && (
            <View
              style={[
                s.separator,
                { backgroundColor: colors.separator, marginLeft: 16 },
              ]}
            />
          )}
          <Pressable
            onPress={action.onPress}
            style={({ pressed }) => [
              s.row,
              pressed && { opacity: 0.5 },
            ]}
          >
            <Text style={[s.actionText, { color: action.color }]}>
              {action.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },
  separator: {
    height: 0.33,
  },
});
