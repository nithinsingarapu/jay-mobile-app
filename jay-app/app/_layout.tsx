import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../stores/userStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit: require('../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('../assets/fonts/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('../assets/fonts/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit-Bold.ttf'),
  });

  const router = useRouter();
  const segments = useSegments();
  const { initAuth, isAuthLoading, isAuthenticated } = useUserStore();

  useEffect(() => { initAuth(); }, []);

  useEffect(() => {
    if (!loaded || isAuthLoading) return;
    SplashScreen.hideAsync();

    const inTabsGroup = segments[0] === '(tabs)';

    // ONLY guard: kick unauthenticated users out of protected tabs
    // Everything else is handled by each screen's own navigation logic
    if (!isAuthenticated && inTabsGroup) {
      router.replace('/onboarding');
    }
  }, [loaded, isAuthLoading, isAuthenticated, segments]);

  if (!loaded || isAuthLoading) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}
