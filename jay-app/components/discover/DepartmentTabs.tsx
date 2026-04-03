import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore, type Department } from '../../stores/discoverStore';

const DEPARTMENTS: { key: Department; label: string }[] = [
  { key: 'skincare', label: 'Skincare' },
  { key: 'haircare', label: 'Haircare' },
  { key: 'bodycare', label: 'Bodycare' },
];

export default function DepartmentTabs() {
  const { colors } = useTheme();
  const department = useDiscoverStore((s) => s.department);
  const setDepartment = useDiscoverStore((s) => s.setDepartment);

  return (
    <View style={styles.row}>
      {DEPARTMENTS.map((d) => {
        const isActive = department === d.key;
        return (
          <Pressable
            key={d.key}
            onPress={() => setDepartment(d.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? colors.label
                  : colors.tertiarySystemFill,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive
                    ? colors.systemBackground
                    : colors.secondaryLabel,
                },
              ]}
            >
              {d.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 6,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
});
