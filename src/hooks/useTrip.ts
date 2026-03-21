import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Trip } from '@/types/trip';
import type { Photo } from '@/types/photo';
import * as tripService from '@/services/trip';
import { getPhotos, deletePhoto } from '@/services/photo';
import { cachePhotos, getCachedPhotos, getCachedTripById } from '@/services/cache';
import { useNetworkStatus } from './useNetworkStatus';

export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const { isOnline } = useNetworkStatus();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const [tripData, photosData] = await Promise.all([
          tripService.getTrip(id),
          getPhotos(id),
        ]);
        setTrip(tripData);
        setPhotos(photosData);
        setIsOfflineData(false);
        // 캐시 갱신
        try { cachePhotos(id, photosData); } catch {}
      } else {
        // 오프라인: 캐시 폴백
        const cachedTrip = getCachedTripById(id);
        const cachedPhotos = getCachedPhotos(id);
        setTrip(cachedTrip);
        setPhotos(cachedPhotos);
        setIsOfflineData(true);
      }
    } catch {
      // 온라인이지만 네트워크 실패 시 캐시 폴백
      const cachedTrip = getCachedTripById(id);
      const cachedPhotos = getCachedPhotos(id);
      if (cachedTrip) {
        setTrip(cachedTrip);
        setPhotos(cachedPhotos);
        setIsOfflineData(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id, isOnline]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      if (!isOnline) {
        Alert.alert('오프라인', '오프라인 상태에서는 사진을 삭제할 수 없습니다.');
        return;
      }
      await deletePhoto(photoId);
      await load();
    },
    [load, isOnline]
  );

  const updateTrip = useCallback(
    async (data: Parameters<typeof tripService.updateTrip>[1]) => {
      if (!isOnline) {
        Alert.alert('오프라인', '오프라인 상태에서는 여행을 수정할 수 없습니다.');
        return;
      }
      await tripService.updateTrip(id, data);
      await load();
    },
    [id, load, isOnline]
  );

  const deleteTrip = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인 상태에서는 여행을 삭제할 수 없습니다.');
      return;
    }
    await tripService.deleteTrip(id);
  }, [id, isOnline]);

  return {
    trip,
    photos,
    loading,
    isOfflineData,
    refresh: load,
    removePhoto,
    updateTrip,
    deleteTrip,
  };
}
