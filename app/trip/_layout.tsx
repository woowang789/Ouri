import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ title: '여행 만들기' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
