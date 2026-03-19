import { Stack } from 'expo-router';

export default function TripDetailLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '여행 상세' }} />
      <Stack.Screen name="edit" options={{ title: '여행 수정' }} />
      <Stack.Screen
        name="photo-viewer"
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
