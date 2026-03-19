import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Trip } from '@/types/trip';
import type { Photo } from '@/types/photo';
import * as tripService from '@/services/trip';
import * as photoService from '@/services/photo';

export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [tripData, photosData] = await Promise.all([
      tripService.getTrip(id),
      photoService.getPhotos(id),
    ]);
    setTrip(tripData);
    setPhotos(photosData);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addPhoto = useCallback(
    async (data: Parameters<typeof photoService.uploadPhoto>[0]) => {
      await photoService.uploadPhoto(data);
      await load();
    },
    [load]
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      await photoService.deletePhoto(photoId);
      await load();
    },
    [load]
  );

  const updateTrip = useCallback(
    async (data: Parameters<typeof tripService.updateTrip>[1]) => {
      await tripService.updateTrip(id, data);
      await load();
    },
    [id, load]
  );

  const deleteTrip = useCallback(async () => {
    await tripService.deleteTrip(id);
  }, [id]);

  return {
    trip,
    photos,
    loading,
    refresh: load,
    addPhoto,
    removePhoto,
    updateTrip,
    deleteTrip,
  };
}
