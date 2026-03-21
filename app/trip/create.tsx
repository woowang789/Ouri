import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { TripForm } from '@/components/trip/TripForm';
import { useTrips } from '@/hooks/useTrips';
import { enqueuePhotos, clearFinished } from '@/services/upload/uploadQueue';
import { uploadWorker } from '@/services/upload/uploadWorker';
import { subscribe } from '@/services/upload/uploadEvents';
import type { TripFormData } from '@/components/trip/TripForm';

export default function TripCreateScreen() {
  const router = useRouter();
  const { createTrip } = useTrips();
  const navigation = useNavigation();
  const [uploading, setUploading] = useState(false);

  // 업로드 중 네비게이션 이탈 차단 (native-stack 호환)
  usePreventRemove(uploading, ({ data }) => {
    // 스와이프/뒤로가기 시도 시 아무 동작도 하지 않음
  });

  // 업로드 중 헤더 뒤로가기 숨김 + 스와이프 제스처 차단
  useEffect(() => {
    if (uploading) {
      navigation.setOptions({
        headerLeft: () => null,
        gestureEnabled: false,
        headerBackButtonMenuEnabled: false,
      });
    } else {
      navigation.setOptions({
        headerLeft: undefined,
        gestureEnabled: true,
        headerBackButtonMenuEnabled: true,
      });
    }
  }, [uploading, navigation]);

  const handleSubmit = async (data: TripFormData) => {
    try {
      const trip = await createTrip({
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        locationName: data.locationName,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
      });

      if (!trip) return;

      if (data.photos.length > 0) {
        setUploading(true);
        clearFinished();
        await new Promise<void>((resolve) => {
          const unsubscribe = subscribe((event) => {
            if (!('tripId' in event) || event.tripId !== trip.id) return;
            if (event.type === 'complete') {
              unsubscribe();
              resolve();
            }
          });

          enqueuePhotos(trip.id, data.photos);
          uploadWorker.start();
        });
        setUploading(false);
      }

      router.replace(`/trip/${trip.id}`);
    } catch (e) {
      setUploading(false);
      Alert.alert('오류', e instanceof Error ? e.message : '여행 생성에 실패했습니다');
    }
  };

  return (
    <View style={styles.container}>
      <TripForm submitLabel="여행 만들기" onSubmit={handleSubmit} />
      {uploading && (
        <View
          style={styles.overlay}
          onStartShouldSetResponder={() => true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
});
