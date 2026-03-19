import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ui/ThemedView';
import { TripForm } from '@/components/trip/TripForm';
import { useTrip } from '@/hooks/useTrip';
import * as photoService from '@/services/photo';
import type { TripFormData } from '@/components/trip/TripForm';
import type { SelectedPhoto } from '@/types/photo';

export default function TripEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { trip, photos, updateTrip } = useTrip(id!);

  if (!trip) return <ThemedView style={{ flex: 1 }} />;

  // 기존 업로드된 사진의 URI 목록 (새 사진 식별용)
  const existingUris = new Set(photos.map((p) => p.driveThumbnailLink));

  // 기존 업로드된 사진을 SelectedPhoto 형태로 변환
  const existingPhotos: SelectedPhoto[] = photos.map((p) => ({
    localUri: p.driveThumbnailLink,
    takenAt: p.takenAt,
    takenLat: p.takenLat,
    takenLng: p.takenLng,
    takenLocationName: p.takenLocationName,
  }));

  const handleSubmit = async (data: TripFormData) => {
    await updateTrip({
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      locationName: data.locationName,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
    });

    // 새로 추가된 사진만 업로드
    const newPhotos = data.photos.filter((p) => !existingUris.has(p.localUri));
    await Promise.all(
      newPhotos.map((photo) =>
        photoService.uploadPhoto({
          tripId: id!,
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

    // 삭제된 사진 처리 (폼에서 제거된 기존 사진)
    const remainingUris = new Set(data.photos.map((p) => p.localUri));
    const deletedPhotos = photos.filter((p) => !remainingUris.has(p.driveThumbnailLink));
    await Promise.all(deletedPhotos.map((p) => photoService.deletePhoto(p.id)));

    router.back();
  };

  return (
    <TripForm
      initialPhotos={existingPhotos}
      initialTitle={trip.title}
      initialStartDate={trip.startDate}
      initialEndDate={trip.endDate}
      initialPlace={{
        id: '',
        placeName: trip.locationName,
        addressName: trip.locationName,
        roadAddressName: '',
        x: String(trip.locationLng),
        y: String(trip.locationLat),
        categoryName: '',
        phone: '',
      }}
      submitLabel="저장"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
