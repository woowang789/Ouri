import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/stores/authStore';

function useProtectedRoute() {
  const { isLoggedIn, isDriveConnected } = useAuth();
  const segments = useSegments();

  const inAuthGroup = segments[0] === '(auth)';
  const inDriveGroup = segments[0] === '(drive)';

  if (!isLoggedIn && !inAuthGroup) {
    return '/(auth)/login';
  }
  if (isLoggedIn && !isDriveConnected && !inDriveGroup) {
    return '/(drive)/connect';
  }
  if (isLoggedIn && isDriveConnected && (inAuthGroup || inDriveGroup)) {
    return '/(tabs)';
  }
  return null;
}

function RootNavigator() {
  const redirectHref = useProtectedRoute();

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(drive)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip" options={{ headerShown: false }} />
      </Stack>
      {redirectHref && <Redirect href={redirectHref} />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
