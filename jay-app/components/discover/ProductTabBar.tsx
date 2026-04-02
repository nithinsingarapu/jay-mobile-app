import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface Props {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}

export default function ProductTabBar({ tabs, active, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.separator }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {tabs.map((tab, i) => {
          const isActive = i === active;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(i)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.label : colors.secondaryLabel,
                    fontFamily: isActive ? 'Outfit-SemiBold' : 'Outfit-Medium',
                  },
                ]}
              >
                {tab}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.underline,
                    { backgroundColor: colors.systemBlue },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    borderBottomWidth: 0.33,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
    alignItems: 'stretch',
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 44,
  },
  label: {
    fontSize: 15,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});
