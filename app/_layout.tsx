import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Alert } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/stores/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import { useDriveStatusToast } from '@/hooks/useDriveStatusToast';
import { getDatabase } from '@/services/cache/database';
import { uploadWorker, hasPendingItems } from '@/services/upload';
import { resetStaleUploading } from '@/services/upload/uploadQueue';
import { deleteWorker, hasPendingItems as hasDeletePending } from '@/services/delete';
import { resetStaleDeleting } from '@/services/delete/deleteQueue';
import { GlobalUploadProgressBar } from '@/components/ui/UploadProgressBar';

// 세션 복원 완료 전까지 스플래시 유지
SplashScreen.preventAutoHideAsync();

// 앱 시작 시 SQLite 캐시 DB 초기화
try {
  getDatabase();
} catch (e) {
  console.warn('캐시 DB 초기화 실패:', e);
}

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
  const { isLoading, isLoggedIn } = useAuth();
  const redirectHref = useProtectedRoute();
  useDriveStatusToast();

  // 세션 복원 완료 시 스플래시 숨김
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // 로그인 상태에서 앱 시작 시 미완료 업로드가 있으면 확인 팝업
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      // stale 상태 리셋 후 pending 항목 확인
      resetStaleUploading();
      resetStaleDeleting();

      const pendingUpload = hasPendingItems();
      const pendingDelete = hasDeletePending();

      if (pendingUpload || pendingDelete) {
        const tasks = [
          pendingUpload && '업로드',
          pendingDelete && '삭제',
        ].filter(Boolean).join(' 및 ');

        Alert.alert(
          '미완료 작업',
          `이전에 중단된 사진 ${tasks} 작업이 있습니다.\n이어서 진행하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '이어서 진행',
              onPress: () => {
                if (pendingUpload) uploadWorker.start();
                if (pendingDelete) deleteWorker.start();
              },
            },
          ],
        );
      }
    }
  }, [isLoading, isLoggedIn]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip" options={{ headerShown: false }} />
      </Stack>
      {redirectHref && <Redirect href={redirectHref} />}
      {isLoggedIn && <GlobalUploadProgressBar />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? OuriDarkTheme : OuriLightTheme}>
          <RootNavigator />
          <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
