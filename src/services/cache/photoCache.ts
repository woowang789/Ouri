import type { Photo } from '@/types/photo';
import { getDatabase } from './database';

interface CachedPhotoRow {
  id: string;
  trip_id: string;
  drive_file_id: string;
  taken_at: string;
  taken_lat: number | null;
  taken_lng: number | null;
  taken_location_name: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

function mapRowToPhoto(row: CachedPhotoRow): Photo {
  return {
    id: row.id,
    tripId: row.trip_id,
    driveFileId: row.drive_file_id,
    takenAt: row.taken_at,
    takenLat: row.taken_lat,
    takenLng: row.taken_lng,
    takenLocationName: row.taken_location_name,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 사진 메타데이터를 SQLite에 캐싱 (여행 단위 전체 교체) */
export function cachePhotos(tripId: string, photos: Photo[]): void {
  try {
    const db = getDatabase();
    const now = Date.now();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM cached_photos WHERE trip_id = ?', tripId);
      for (const photo of photos) {
        db.runSync(
          `INSERT INTO cached_photos (id, trip_id, drive_file_id, taken_at, taken_lat, taken_lng, taken_location_name, uploaded_by, created_at, updated_at, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          photo.id, photo.tripId, photo.driveFileId,
          photo.takenAt, photo.takenLat, photo.takenLng, photo.takenLocationName,
          photo.uploadedBy, photo.createdAt, photo.updatedAt, now,
        );
      }
    });
  } catch (e) {
    console.warn('사진 캐시 저장 실패:', e);
  }
}

/** 캐시된 사진 목록 조회 */
export function getCachedPhotos(tripId: string): Photo[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<CachedPhotoRow>(
      'SELECT id, trip_id, drive_file_id, taken_at, taken_lat, taken_lng, taken_location_name, uploaded_by, created_at, updated_at FROM cached_photos WHERE trip_id = ? ORDER BY taken_at ASC',
      tripId,
    );
    return rows.map(mapRowToPhoto);
  } catch (e) {
    console.warn('사진 캐시 조회 실패:', e);
    return [];
  }
}

/** 여행의 사진 캐시 삭제 */
export function clearPhotoCache(tripId: string): void {
  try {
    const db = getDatabase();
    db.runSync('DELETE FROM cached_photos WHERE trip_id = ?', tripId);
  } catch (e) {
    console.warn('사진 캐시 삭제 실패:', e);
  }
}
