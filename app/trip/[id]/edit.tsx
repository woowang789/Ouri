import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ui/ThemedView';
import { TripForm } from '@/components/trip/TripForm';
import { useTrip } from '@/hooks/useTrip';
import { deletePhoto } from '@/services/photo';
import { enqueuePhotos } from '@/services/upload/uploadQueue';
import { uploadWorker } from '@/services/upload/uploadWorker';
import type { TripFormData } from '@/components/trip/TripForm';
import type { SelectedPhoto } from '@/types/photo';

export default function TripEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { trip, photos, updateTrip } = useTrip(id!);

  if (!trip) return <ThemedView style={{ flex: 1 }} />;

  // 기존 업로드된 사진을 SelectedPhoto 형태로 변환 (driveFileId를 마커로 사용)
  const existingPhotos: SelectedPhoto[] = photos.map((p) => ({
    localUri: `drive://${p.driveFileId}`,
    takenAt: p.takenAt,
    takenLat: p.takenLat,
    takenLng: p.takenLng,
    takenLocationName: p.takenLocationName,
  }));

  const handleSubmit = async (data: TripFormData) => {
    try {
      await updateTrip({
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        locationName: data.locationName,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
      });

      // 새로 추가된 사진을 업로드 큐에 추가
      const newPhotos = data.photos.filter((p) => !p.localUri.startsWith('drive://'));
      if (newPhotos.length > 0) {
        enqueuePhotos(id!, newPhotos);
        uploadWorker.start();
      }

      // 삭제된 사진 처리 (폼에서 제거된 기존 사진)
      const remainingDriveIds = new Set(
        data.photos.filter((p) => p.localUri.startsWith('drive://'))
          .map((p) => p.localUri.replace('drive://', ''))
      );
      const deletedPhotos = photos.filter((p) => !remainingDriveIds.has(p.driveFileId));
      for (const p of deletedPhotos) {
        await deletePhoto(p.id);
      }

      router.back();
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '여행 수정에 실패했습니다');
    }
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
