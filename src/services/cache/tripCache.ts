import type { Trip } from '@/types/trip';
import { getDatabase } from './database';

interface CachedTripRow {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  cover_photo_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToTrip(row: CachedTripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    locationName: row.location_name,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    coverPhotoId: row.cover_photo_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 여행 목록을 SQLite에 캐싱 (전체 교체 방식) */
export function cacheTrips(userId: string, trips: Trip[]): void {
  try {
    const db = getDatabase();
    const now = Date.now();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM cached_trips WHERE user_id = ?', userId);
      for (const trip of trips) {
        db.runSync(
          `INSERT INTO cached_trips (id, user_id, title, start_date, end_date, location_name, location_lat, location_lng, cover_photo_id, created_at, updated_at, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          trip.id, trip.userId, trip.title, trip.startDate, trip.endDate,
          trip.locationName, trip.locationLat, trip.locationLng,
          trip.coverPhotoId, trip.createdAt, trip.updatedAt, now,
        );
      }
    });
  } catch (e) {
    console.warn('여행 캐시 저장 실패:', e);
  }
}

/** 캐시된 여행 목록 조회 */
export function getCachedTrips(userId: string): Trip[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<CachedTripRow>(
      'SELECT * FROM cached_trips WHERE user_id = ? ORDER BY start_date DESC',
      userId,
    );
    return rows.map(mapRowToTrip);
  } catch (e) {
    console.warn('여행 캐시 조회 실패:', e);
    return [];
  }
}

/** 캐시에서 단일 여행 조회 */
export function getCachedTripById(tripId: string): Trip | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<CachedTripRow>(
      'SELECT * FROM cached_trips WHERE id = ?',
      tripId,
    );
    return row ? mapRowToTrip(row) : null;
  } catch (e) {
    console.warn('여행 캐시 단건 조회 실패:', e);
    return null;
  }
}

/** 사용자의 여행 캐시 삭제 */
export function clearTripCache(userId: string): void {
  try {
    const db = getDatabase();
    db.runSync('DELETE FROM cached_trips WHERE user_id = ?', userId);
  } catch (e) {
    console.warn('여행 캐시 삭제 실패:', e);
  }
}
