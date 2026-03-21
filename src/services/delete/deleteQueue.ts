// 삭제 큐 SQLite CRUD

import type { SQLiteBindValue } from 'expo-sqlite';
import { getDatabase } from '@/services/cache/database';

export interface DeleteQueueItem {
  id: number;
  photoId: string;
  driveFileId: string;
  tripId: string;
  status: 'pending' | 'deleting' | 'deleted' | 'failed';
  retryCount: number;
  errorMessage: string | null;
}

export interface DeleteQueueStats {
  total: number;
  pending: number;
  deleting: number;
  deleted: number;
  failed: number;
}

// DB 행 → DeleteQueueItem 변환
function mapRow(row: Record<string, unknown>): DeleteQueueItem {
  return {
    id: row.id as number,
    photoId: row.photo_id as string,
    driveFileId: row.drive_file_id as string,
    tripId: row.trip_id as string,
    status: row.status as DeleteQueueItem['status'],
    retryCount: row.retry_count as number,
    errorMessage: row.error_message as string | null,
  };
}

/**
 * 사진 배열을 삭제 큐에 일괄 추가
 */
export function enqueueDeletions(
  photos: { id: string; driveFileId: string; tripId: string }[],
): void {
  const db = getDatabase();
  const now = Date.now();

  for (const photo of photos) {
    db.runSync(
      `INSERT INTO delete_queue (photo_id, drive_file_id, trip_id, status, retry_count, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', 0, ?, ?)`,
      [photo.id, photo.driveFileId, photo.tripId, now, now],
    );
  }
}

/**
 * 다음 대기 중인 항목 반환 (가장 오래된 pending)
 */
export function getNextPending(): DeleteQueueItem | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM delete_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`,
  );
  return row ? mapRow(row) : null;
}

/**
 * 큐 항목 상태 업데이트
 */
export function updateStatus(
  id: number,
  status: DeleteQueueItem['status'],
  extras?: Partial<Pick<DeleteQueueItem, 'retryCount' | 'errorMessage'>>,
): void {
  const db = getDatabase();
  const now = Date.now();

  const sets = ['status = ?', 'updated_at = ?'];
  const values: SQLiteBindValue[] = [status, now];

  if (extras?.retryCount !== undefined) {
    sets.push('retry_count = ?');
    values.push(extras.retryCount);
  }
  if (extras?.errorMessage !== undefined) {
    sets.push('error_message = ?');
    values.push(extras.errorMessage);
  }

  values.push(id);
  db.runSync(`UPDATE delete_queue SET ${sets.join(', ')} WHERE id = ?`, values);
}

/**
 * 특정 여행 또는 전체 큐 진행률 조회 (단일 쿼리)
 */
export function getDeleteQueueStats(tripId?: string): DeleteQueueStats {
  const db = getDatabase();
  const whereClause = tripId ? 'WHERE trip_id = ?' : '';
  const params: SQLiteBindValue[] = tripId ? [tripId] : [];

  const row = db.getFirstSync<{
    total: number;
    pending: number;
    deleting: number;
    deleted: number;
    failed: number;
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'deleting' THEN 1 ELSE 0 END) as deleting,
      SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM delete_queue ${whereClause}`,
    params,
  );

  return row ?? { total: 0, pending: 0, deleting: 0, deleted: 0, failed: 0 };
}

/**
 * 완료 항목 정리
 */
export function clearCompleted(tripId?: string): void {
  const db = getDatabase();
  if (tripId) {
    db.runSync(`DELETE FROM delete_queue WHERE status = 'deleted' AND trip_id = ?`, [tripId]);
  } else {
    db.runSync(`DELETE FROM delete_queue WHERE status = 'deleted'`);
  }
}

/**
 * 완료 + 실패 항목 모두 정리
 */
export function clearFinished(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM delete_queue WHERE status IN ('deleted', 'failed')`);
}

/**
 * 앱 시작 시 중단된 'deleting' 상태를 'pending'으로 리셋
 */
export function resetStaleDeleting(): void {
  const db = getDatabase();
  const now = Date.now();
  db.runSync(
    `UPDATE delete_queue SET status = 'pending', updated_at = ? WHERE status = 'deleting'`,
    [now],
  );
}

/**
 * 큐에 처리할 항목이 있는지 확인
 */
export function hasPendingItems(): boolean {
  const db = getDatabase();
  const row = db.getFirstSync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM delete_queue WHERE status IN ('pending', 'deleting')`,
  );
  return (row?.cnt ?? 0) > 0;
}
