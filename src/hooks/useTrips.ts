import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Trip } from '@/types/trip';
import * as tripService from '@/services/trip';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await tripService.getTrips();
    setTrips(data);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const data = await tripService.getTrips();
    setTrips(data);
    setRefreshing(false);
  }, []);

  // 화면이 포커스될 때마다 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const createTrip = useCallback(
    async (data: Parameters<typeof tripService.createTrip>[0]) => {
      const newTrip = await tripService.createTrip(data);
      await load();
      return newTrip;
    },
    [load]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      await tripService.deleteTrip(id);
      await load();
    },
    [load]
  );

  return { trips, loading, refreshing, refresh, createTrip, deleteTrip };
}
