import type { Memo } from '@/types/memo';
import { getDatabase } from './database';

interface CachedMemoRow {
  id: string;
  photo_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapRowToMemo(row: CachedMemoRow): Memo {
  return {
    id: row.id,
    photoId: row.photo_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 사진별 메모를 SQLite에 캐싱 */
export function cacheMemos(photoId: string, memos: Memo[]): void {
  try {
    const db = getDatabase();
    const now = Date.now();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM cached_memos WHERE photo_id = ?', photoId);
      for (const memo of memos) {
        db.runSync(
          `INSERT INTO cached_memos (id, photo_id, content, created_by, created_at, updated_at, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          memo.id, memo.photoId, memo.content, memo.createdBy,
          memo.createdAt, memo.updatedAt, now,
        );
      }
    });
  } catch (e) {
    console.warn('메모 캐시 저장 실패:', e);
  }
}

/** 캐시된 메모 조회 */
export function getCachedMemos(photoId: string): Memo[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<CachedMemoRow>(
      'SELECT * FROM cached_memos WHERE photo_id = ? ORDER BY created_at ASC',
      photoId,
    );
    return rows.map(mapRowToMemo);
  } catch (e) {
    console.warn('메모 캐시 조회 실패:', e);
    return [];
  }
}

/** 메모가 있는 사진 ID 집합 반환 (캐시 기반) */
export function getCachedPhotoIdsWithMemo(photoIds: string[]): Set<string> {
  if (photoIds.length === 0) return new Set();
  try {
    const db = getDatabase();
    const placeholders = photoIds.map(() => '?').join(',');
    const rows = db.getAllSync<{ photo_id: string }>(
      `SELECT DISTINCT photo_id FROM cached_memos WHERE photo_id IN (${placeholders})`,
      ...photoIds,
    );
    return new Set(rows.map((r) => r.photo_id));
  } catch (e) {
    console.warn('메모 캐시 사진 ID 조회 실패:', e);
    return new Set();
  }
}
