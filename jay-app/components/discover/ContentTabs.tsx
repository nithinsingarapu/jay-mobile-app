import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import type { DiscoverTab } from '../../types/discover';

const TABS: { key: DiscoverTab; label: string }[] = [
  { key: 'forYou', label: 'For You' },
  { key: 'products', label: 'Products' },
  { key: 'learn', label: 'Learn' },
];

const TAB_WIDTH = 100;

export default function ContentTabs() {
  const { colors } = useTheme();
  const activeTab = useDiscoverStore((s) => s.activeTab);
  const setActiveTab = useDiscoverStore((s) => s.setActiveTab);
  const underlineX = useRef(new Animated.Value(0)).current;

  const activeIndex = TABS.findIndex((t) => t.key === activeTab);

  useEffect(() => {
    Animated.timing(underlineX, {
      toValue: activeIndex * TAB_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  return (
    <View style={[styles.container, { borderBottomColor: colors.separator }]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.label : colors.secondaryLabel,
                    fontFamily: isActive ? 'Outfit-SemiBold' : 'Outfit',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* Animated underline */}
      <Animated.View
        style={[
          styles.underline,
          {
            backgroundColor: colors.systemBlue,
            transform: [{ translateX: underlineX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.33,
    marginBottom: 4,
    position: 'relative',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    width: TAB_WIDTH,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    letterSpacing: -0.24,
  },
  underline: {
    position: 'absolute',
    bottom: -0.33,
    left: 16,
    width: TAB_WIDTH,
    height: 2,
    borderRadius: 1,
  },
});
