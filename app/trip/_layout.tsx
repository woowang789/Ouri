import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TripLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '600', fontSize: 17 },
      }}
    >
      <Stack.Screen name="create" options={{ title: '여행 만들기' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false, headerBackVisible: false }} />
    </Stack>
  );
}
