import type { Photo } from '@/types/photo';
import { mockPhotos } from '@/mocks/photos';
import { deleteMemosByPhoto } from '@/services/memo';

// 사진 서비스 인터페이스
// Phase 3에서 Google Drive API + Supabase로 교체 예정

let photos = [...mockPhotos];

export async function getPhotos(tripId: string): Promise<Photo[]> {
  return photos
    .filter((p) => p.tripId === tripId)
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
}

export async function uploadPhoto(
  data: Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Photo> {
  const now = new Date().toISOString();
  const newPhoto: Photo = {
    ...data,
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  photos.push(newPhoto);
  return newPhoto;
}

export async function deletePhoto(id: string): Promise<void> {
  await deleteMemosByPhoto(id);
  photos = photos.filter((p) => p.id !== id);
}
