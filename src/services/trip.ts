import type { Trip } from '@/types/trip';
import { mockTrips } from '@/mocks/trips';

// 여행 서비스 인터페이스
// Phase 3에서 Supabase로 교체 예정

let trips = [...mockTrips];

export async function getTrips(): Promise<Trip[]> {
  return [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

export async function getTrip(id: string): Promise<Trip | null> {
  return trips.find((t) => t.id === id) ?? null;
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'userId' | 'coverPhotoId' | 'createdAt' | 'updatedAt'>
): Promise<Trip> {
  const now = new Date().toISOString();
  const newTrip: Trip = {
    ...data,
    id: `trip-${Date.now()}`,
    userId: 'user-001',
    coverPhotoId: null,
    createdAt: now,
    updatedAt: now,
  };
  trips.unshift(newTrip);
  return newTrip;
}

export async function updateTrip(
  id: string,
  data: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): Promise<Trip> {
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Trip ${id} not found`);
  trips[index] = { ...trips[index], ...data, updatedAt: new Date().toISOString() };
  return trips[index];
}

export async function deleteTrip(id: string): Promise<void> {
  trips = trips.filter((t) => t.id !== id);
}
