import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../lib/theme';

// ── Icons (iOS SF Symbol style: 24px, 1.5-2px stroke, round cap/join) ────────

function HomeIcon({ color, active }: { color: string; active: boolean }) {
  return active ? (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color} stroke="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
    </Svg>
  ) : (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
    </Svg>
  );
}

function DiscoverIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" fill={active ? color : 'none'} />
    </Svg>
  );
}

function JayIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={active ? color : 'none'} />
    </Svg>
  );
}

function DiaryIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" fill={active ? color : 'none'} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={active ? '#fff' : color} strokeWidth="1.5" />
    </Svg>
  );
}

function ProfileIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill={active ? color : 'none'} />
      <Circle cx="12" cy="7" r="4" fill={active ? color : 'none'} />
    </Svg>
  );
}

// ── Tab Bar ──────────────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();

  // Hide tab bar on JAY chat
  if (pathname === '/jay') return null;

  const tint = isDark ? '#0A84FF' : '#007AFF'; // iOS systemBlue
  const inactive = colors.systemGray;
  const tabHeight = 49; // iOS standard tab bar height
  const totalHeight = tabHeight + insets.bottom;

  const tabs = [
    { key: 'index', label: 'Home', Icon: HomeIcon },
    { key: 'discover', label: 'Discover', Icon: DiscoverIcon },
    { key: 'jay', label: 'JAY', Icon: JayIcon },
    { key: 'diary', label: 'Diary', Icon: DiaryIcon },
    { key: 'profile', label: 'Profile', Icon: ProfileIcon },
  ];

  return (
    <View style={[$.tabOuter, { height: totalHeight, paddingBottom: insets.bottom }]}>
      {/* Frosted glass background */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: isDark ? 'rgba(22,22,24,0.92)' : 'rgba(249,249,249,0.94)',
        }]} />
      )}
      {/* Top border */}
      <View style={[$.tabBorder, { backgroundColor: colors.separator }]} />

      <View style={$.tabInner}>
        {tabs.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;
          const isFocused = state.index === index;
          const color = isFocused ? tint : inactive;

          return (
            <Pressable
              key={tab.key}
              style={$.tabItem}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <tab.Icon color={color} active={isFocused} />
              <Text style={[$.tabLabel, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const $ = StyleSheet.create({
  tabOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  tabBorder: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 49,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
});

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="jay" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
