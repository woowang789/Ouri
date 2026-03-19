import { useRouter } from 'expo-router';
import { TripForm } from '@/components/trip/TripForm';
import { useTrips } from '@/hooks/useTrips';
import * as photoService from '@/services/photo';
import type { TripFormData } from '@/components/trip/TripForm';

export default function TripCreateScreen() {
  const router = useRouter();
  const { createTrip } = useTrips();

  const handleSubmit = async (data: TripFormData) => {
    const trip = await createTrip({
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      locationName: data.locationName,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
    });

    // 선택한 사진들을 여행에 추가
    await Promise.all(
      data.photos.map((photo) =>
        photoService.uploadPhoto({
          tripId: trip.id,
          driveFileId: '',
          driveThumbnailLink: photo.localUri,
          takenAt: photo.takenAt ?? new Date().toISOString(),
          takenLat: photo.takenLat,
          takenLng: photo.takenLng,
          takenLocationName: photo.takenLocationName,
          uploadedBy: 'user-001',
        })
      )
    );

    router.replace(`/trip/${trip.id}`);
  };

  return <TripForm submitLabel="여행 만들기" onSubmit={handleSubmit} />;
}
