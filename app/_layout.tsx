import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/stores/authStore';

// 세션 복원 완료 전까지 스플래시 유지
SplashScreen.preventAutoHideAsync();

// 따뜻한 톤의 커스텀 네비게이션 테마
const OuriLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.primary,
  },
};

const OuriDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.primary,
  },
};

function useProtectedRoute() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();

  // 세션 복원 중에는 리다이렉트하지 않음
  if (isLoading) return null;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isLoggedIn && !inAuthGroup) {
    return '/(auth)/login';
  }
  if (isLoggedIn && inAuthGroup) {
    return '/(tabs)';
  }
  return null;
}

function RootNavigator() {
  const { isLoading } = useAuth();
  const redirectHref = useProtectedRoute();

  // 세션 복원 완료 시 스플래시 숨김
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
      <ThemeProvider value={colorScheme === 'dark' ? OuriDarkTheme : OuriLightTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
