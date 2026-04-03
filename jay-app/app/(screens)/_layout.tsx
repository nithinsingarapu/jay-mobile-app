import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="search" options={{ animation: 'fade' }} />
      <Stack.Screen name="product-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="article" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
