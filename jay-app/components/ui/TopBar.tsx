import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

interface TopBarProps { title: string; }

export function TopBar({ title }: TopBarProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backBtn}
        accessible={true}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
      </Pressable>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 10, fontWeight: '600', color: '#999', letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: 'Outfit-SemiBold' },
});
