import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Trip } from '@/types/trip';
import * as tripService from '@/services/trip';
import { cacheTrips, getCachedTrips } from '@/services/cache';
import { useNetworkStatus } from './useNetworkStatus';
import { useAuth } from '@/stores/authStore';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      if (isOnline) {
        const data = await tripService.getTrips();
        setTrips(data);
        setIsOfflineData(false);
        // 캐시 갱신 (실패해도 무시)
        if (user?.id) {
          try { cacheTrips(user.id, data); } catch {}
        }
      } else {
        // 오프라인: 캐시 폴백
        if (user?.id) {
          const cached = getCachedTrips(user.id);
          setTrips(cached);
          setIsOfflineData(true);
        }
      }
    } catch {
      // 온라인이지만 네트워크 실패 시 캐시 폴백
      if (user?.id) {
        const cached = getCachedTrips(user.id);
        if (cached.length > 0) {
          setTrips(cached);
          setIsOfflineData(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, user?.id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // 화면이 포커스될 때마다 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const createTrip = useCallback(
    async (data: Parameters<typeof tripService.createTrip>[0]) => {
      if (!isOnline) {
        Alert.alert('오프라인', '오프라인 상태에서는 여행을 생성할 수 없습니다.');
        return null;
      }
      const newTrip = await tripService.createTrip(data);
      await load();
      return newTrip;
    },
    [load, isOnline]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      if (!isOnline) {
        Alert.alert('오프라인', '오프라인 상태에서는 여행을 삭제할 수 없습니다.');
        return;
      }
      await tripService.deleteTrip(id);
      await load();
    },
    [load, isOnline]
  );

  return { trips, loading, refreshing, isOfflineData, refresh, createTrip, deleteTrip };
}
