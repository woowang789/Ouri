import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { ThemedView } from '@/components/ui/ThemedView';
import { TripForm } from '@/components/trip/TripForm';
import { useTrip } from '@/hooks/useTrip';
import { enqueuePhotos, clearFinished } from '@/services/upload/uploadQueue';
import { uploadWorker } from '@/services/upload/uploadWorker';
import { subscribe as subscribeUpload } from '@/services/upload/uploadEvents';
import { enqueueDeletions, clearFinished as clearDeleteFinished } from '@/services/delete/deleteQueue';
import { deleteWorker } from '@/services/delete/deleteWorker';
import { subscribe as subscribeDelete } from '@/services/delete/deleteEvents';
import type { TripFormData } from '@/components/trip/TripForm';
import type { SelectedPhoto } from '@/types/photo';

export default function TripEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { trip, photos, updateTrip } = useTrip(id!);
  const [busy, setBusy] = useState(false);

  // 작업 중 네비게이션 이탈 차단
  usePreventRemove(busy, () => {});

  // 작업 중 헤더/제스처 차단
  useEffect(() => {
    if (busy) {
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
  }, [busy, navigation]);

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

      // 새로 추가된 사진 / 삭제된 사진 계산
      const newPhotos = data.photos.filter((p) => !p.localUri.startsWith('drive://'));
      const remainingDriveIds = new Set(
        data.photos.filter((p) => p.localUri.startsWith('drive://'))
          .map((p) => p.localUri.replace('drive://', ''))
      );
      const deletedPhotos = photos.filter((p) => !remainingDriveIds.has(p.driveFileId));

      const hasUpload = newPhotos.length > 0;
      const hasDelete = deletedPhotos.length > 0;

      if (hasUpload || hasDelete) setBusy(true);

      // 1. 양쪽 큐에 먼저 모두 영속화 (앱 종료 시 유실 방지)
      if (hasUpload) { clearFinished(); enqueuePhotos(id!, newPhotos); }
      if (hasDelete) {
        clearDeleteFinished();
        enqueueDeletions(
          deletedPhotos.map((p) => ({ id: p.id, driveFileId: p.driveFileId, tripId: id! })),
        );
      }

      // 2. 워커 시작 + 완료 대기 (순차)
      if (hasUpload) {
        await new Promise<void>((resolve) => {
          const unsubscribe = subscribeUpload((event) => {
            if (!('tripId' in event) || event.tripId !== id) return;
            if (event.type === 'complete') {
              unsubscribe();
              resolve();
            }
          });
          uploadWorker.start();
        });
      }

      if (hasDelete) {
        await new Promise<void>((resolve) => {
          const unsubscribe = subscribeDelete((event) => {
            if (!('tripId' in event) || event.tripId !== id) return;
            if (event.type === 'complete') {
              unsubscribe();
              resolve();
            }
          });
          deleteWorker.start();
        });
      }

      if (hasUpload || hasDelete) setBusy(false);
      router.back();
    } catch (e) {
      setBusy(false);
      Alert.alert('오류', e instanceof Error ? e.message : '여행 수정에 실패했습니다');
    }
  };

  return (
    <View style={styles.container}>
      {busy && (
        <View
          style={styles.overlay}
          onStartShouldSetResponder={() => true}
        />
      )}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
});
