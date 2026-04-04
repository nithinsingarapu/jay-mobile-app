import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../stores/userStore';
import { ThemeProvider, useTheme } from '../lib/theme';
import { initNotifications } from '../services/notifications';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const [loaded, fontError] = useFonts({
    Outfit: require('../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('../assets/fonts/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('../assets/fonts/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit-Bold.ttf'),
  });

  const router = useRouter();
  const segments = useSegments();
  const { initAuth, isAuthLoading, isAuthenticated } = useUserStore();
  const { isDark } = useTheme();

  const fontsReady = loaded || !!fontError;

  useEffect(() => {
    initAuth();
    initNotifications().catch(() => {});

    // Handle notification tap → navigate to routine screen
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'routine') {
        router.push('/(screens)/routine' as any);
      }
    });

    const timeout = setTimeout(() => {
      if (useUserStore.getState().isAuthLoading) {
        useUserStore.setState({ isAuthLoading: false });
      }
    }, 5000);
    return () => { clearTimeout(timeout); sub.remove(); };
  }, []);

  useEffect(() => {
    if (!fontsReady || isAuthLoading) return;
    SplashScreen.hideAsync().catch(() => {});

    const inTabsGroup = segments[0] === '(tabs)';
    if (!isAuthenticated && inTabsGroup) {
      router.replace('/onboarding');
    }
  }, [fontsReady, isAuthLoading, isAuthenticated, segments]);

  if (!fontsReady || isAuthLoading) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
