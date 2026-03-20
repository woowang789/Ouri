import { getDatabase } from './database';
import { reverseGeocode } from '../location';
import { supabase } from '../supabase';

interface PendingGeocodeRow {
  id: number;
  photo_id: string;
  lat: number;
  lng: number;
  status: string;
}

/** 역지오코딩 실패 항목을 pending_geocode에 등록 */
export function addPendingGeocode(photoId: string, lat: number, lng: number): void {
  try {
    const db = getDatabase();
    db.runSync(
      'INSERT OR IGNORE INTO pending_geocode (photo_id, lat, lng, created_at) VALUES (?, ?, ?, ?)',
      photoId, lat, lng, Date.now(),
    );
  } catch (e) {
    console.warn('펜딩 역지오코딩 등록 실패:', e);
  }
}

/** 미완료 역지오코딩 목록 조회 */
export function getPendingGeocodes(): PendingGeocodeRow[] {
  try {
    const db = getDatabase();
    return db.getAllSync<PendingGeocodeRow>(
      "SELECT * FROM pending_geocode WHERE status = 'pending'",
    );
  } catch (e) {
    console.warn('펜딩 역지오코딩 조회 실패:', e);
    return [];
  }
}

/** 완료된 항목 삭제 */
function removePendingGeocode(photoId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM pending_geocode WHERE photo_id = ?', photoId);
}

/**
 * 미완료 역지오코딩 백필 실행
 * 순차 처리 (기존 reverseGeocode의 500ms 쓰로틀링 활용)
 */
export async function runGeocodeBackfill(): Promise<number> {
  const pendings = getPendingGeocodes();
  if (pendings.length === 0) return 0;

  let successCount = 0;

  for (const pending of pendings) {
    try {
      const locationName = await reverseGeocode(pending.lat, pending.lng);
      if (locationName) {
        // Supabase photos 테이블 업데이트
        const { error } = await supabase
          .from('photos')
          .update({ taken_location_name: locationName })
          .eq('id', pending.photo_id);

        if (!error) {
          removePendingGeocode(pending.photo_id);
          successCount++;
        }
      }
    } catch (e) {
      // 개별 실패는 다른 항목에 영향 없이 계속 진행
      console.warn(`역지오코딩 백필 실패 (photo: ${pending.photo_id}):`, e);
    }
  }

  if (successCount > 0) {
    console.log(`역지오코딩 백필 완료: ${successCount}/${pendings.length}건`);
  }

  return successCount;
}
