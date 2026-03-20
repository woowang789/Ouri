import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TripForm } from '@/components/trip/TripForm';
import { useTrips } from '@/hooks/useTrips';
import * as photoService from '@/services/photo';
import type { TripFormData } from '@/components/trip/TripForm';

export default function TripCreateScreen() {
  const router = useRouter();
  const { createTrip } = useTrips();

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

      // 선택한 사진들을 순차 업로드 (Drive 레이트 리밋 대응)
      for (const photo of data.photos) {
        await photoService.uploadPhoto({
          tripId: trip.id,
          localUri: photo.localUri,
          takenAt: photo.takenAt ?? new Date().toISOString(),
          takenLat: photo.takenLat,
          takenLng: photo.takenLng,
          takenLocationName: photo.takenLocationName,
        });
      }

      router.replace(`/trip/${trip.id}`);
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '여행 생성에 실패했습니다');
    }
  };

  return <TripForm submitLabel="여행 만들기" onSubmit={handleSubmit} />;
}
