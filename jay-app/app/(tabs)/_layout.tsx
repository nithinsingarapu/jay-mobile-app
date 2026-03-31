import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';

function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#000" stroke="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
    </Svg>
  ) : (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
    </Svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" fill={active ? '#000' : 'none'} />
    </Svg>
  );
}

function DiaryIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" fill={active ? '#000' : 'none'} stroke="#000" strokeWidth="1.5" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={active ? '#fff' : '#000'} strokeWidth="1.5" />
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active ? '#000' : 'none'} />
      <Circle cx="12" cy="7" r="4" fill={active ? '#000' : 'none'} />
    </Svg>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const tabHeight = 56;
  const totalHeight = tabHeight + insets.bottom;

  // Hide tab bar when JAY chat is active — gives full screen to chat
  if (pathname === '/jay') return null;

  const tabs = [
    { key: 'index', label: 'Home', Icon: HomeIcon },
    { key: 'discover', label: 'Discover', Icon: DiscoverIcon },
    { key: 'jay', label: 'JAY', Icon: null },
    { key: 'diary', label: 'Diary', Icon: DiaryIcon },
    { key: 'profile', label: 'Profile', Icon: ProfileIcon },
  ];

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom, height: totalHeight + 8 }]}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.94)' }]} />
      )}
      <View style={styles.tabBarBorder} />
      <View style={styles.tabBarInner}>
        {tabs.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (tab.key === 'jay') {
            return (
              <Pressable
                key="jay"
                style={styles.jayTab}
                onPress={onPress}
                accessible={true}
                accessibilityLabel="JAY"
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
              >
                <View style={styles.jayCircle}>
                  <Text style={styles.jayLetter}>J</Text>
                </View>
                <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive, { marginTop: 5 }]}>JAY</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={onPress}
              accessible={true}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={{ opacity: isFocused ? 1 : 0.3 }}>
                {tab.Icon && <tab.Icon active={isFocused} />}
              </View>
              <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: '#E5E5E5',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  jayTab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
  },
  jayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  jayLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit-Bold',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#000',
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  tabLabelInactive: {
    color: '#999',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="jay" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
