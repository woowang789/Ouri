// 업로드 큐 SQLite CRUD

import type { SQLiteBindValue } from 'expo-sqlite';
import { getDatabase } from '@/services/cache/database';
import type { SelectedPhoto } from '@/types/photo';

export interface QueueItem {
  id: number;
  tripId: string;
  localUri: string;
  fileName: string;
  mimeType: string;
  takenAt: string;
  takenLat: number | null;
  takenLng: number | null;
  takenLocationName: string | null;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  resumableUri: string | null;
  bytesUploaded: number;
  totalBytes: number;
  driveFileId: string | null;
  retryCount: number;
  errorMessage: string | null;
}

export interface QueueStats {
  total: number;
  pending: number;
  uploading: number;
  uploaded: number;
  failed: number;
}

// DB 행 → QueueItem 변환
function mapRow(row: Record<string, unknown>): QueueItem {
  return {
    id: row.id as number,
    tripId: row.trip_id as string,
    localUri: row.local_uri as string,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
    takenAt: row.taken_at as string,
    takenLat: row.taken_lat as number | null,
    takenLng: row.taken_lng as number | null,
    takenLocationName: row.taken_location_name as string | null,
    status: row.status as QueueItem['status'],
    resumableUri: row.resumable_uri as string | null,
    bytesUploaded: row.bytes_uploaded as number,
    totalBytes: row.total_bytes as number,
    driveFileId: row.drive_file_id as string | null,
    retryCount: row.retry_count as number,
    errorMessage: row.error_message as string | null,
  };
}

/**
 * 사진 배열을 업로드 큐에 일괄 추가
 */
export function enqueuePhotos(tripId: string, photos: SelectedPhoto[]): void {
  const db = getDatabase();
  const now = Date.now();

  for (const photo of photos) {
    const fileName = `ouri_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
    db.runSync(
      `INSERT INTO upload_queue (trip_id, local_uri, file_name, mime_type, taken_at, taken_lat, taken_lng, taken_location_name, status, bytes_uploaded, total_bytes, retry_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, ?, ?)`,
      [
        tripId,
        photo.localUri,
        fileName,
        'image/jpeg',
        photo.takenAt ?? new Date().toISOString(),
        photo.takenLat,
        photo.takenLng,
        photo.takenLocationName,
        now,
        now,
      ],
    );
  }
}

/**
 * 다음 대기 중인 항목 반환 (가장 오래된 pending)
 */
export function getNextPending(): QueueItem | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM upload_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`,
  );
  return row ? mapRow(row) : null;
}

/**
 * 큐 항목 상태 업데이트
 */
export function updateStatus(
  id: number,
  status: QueueItem['status'],
  extras?: Partial<Pick<QueueItem, 'resumableUri' | 'bytesUploaded' | 'driveFileId' | 'retryCount' | 'errorMessage'>>,
): void {
  const db = getDatabase();
  const now = Date.now();

  const sets = ['status = ?', 'updated_at = ?'];
  const values: SQLiteBindValue[] = [status, now];

  if (extras?.resumableUri !== undefined) {
    sets.push('resumable_uri = ?');
    values.push(extras.resumableUri);
  }
  if (extras?.bytesUploaded !== undefined) {
    sets.push('bytes_uploaded = ?');
    values.push(extras.bytesUploaded);
  }
  if (extras?.driveFileId !== undefined) {
    sets.push('drive_file_id = ?');
    values.push(extras.driveFileId);
  }
  if (extras?.retryCount !== undefined) {
    sets.push('retry_count = ?');
    values.push(extras.retryCount);
  }
  if (extras?.errorMessage !== undefined) {
    sets.push('error_message = ?');
    values.push(extras.errorMessage);
  }

  values.push(id);
  db.runSync(`UPDATE upload_queue SET ${sets.join(', ')} WHERE id = ?`, values);
}

/**
 * 특정 여행 또는 전체 큐 진행률 조회 (단일 쿼리)
 */
export function getQueueStats(tripId?: string): QueueStats {
  const db = getDatabase();
  const whereClause = tripId ? 'WHERE trip_id = ?' : '';
  const params: SQLiteBindValue[] = tripId ? [tripId] : [];

  const row = db.getFirstSync<{
    total: number;
    pending: number;
    uploading: number;
    uploaded: number;
    failed: number;
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'uploading' THEN 1 ELSE 0 END) as uploading,
      SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as uploaded,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM upload_queue ${whereClause}`,
    params,
  );

  return row ?? { total: 0, pending: 0, uploading: 0, uploaded: 0, failed: 0 };
}

/**
 * 실패 항목 재시도 (retry_count < 3인 것만 pending으로 변경)
 */
export function retryFailed(tripId?: string): void {
  const db = getDatabase();
  const now = Date.now();
  if (tripId) {
    db.runSync(
      `UPDATE upload_queue SET status = 'pending', error_message = NULL, updated_at = ? WHERE status = 'failed' AND retry_count < 3 AND trip_id = ?`,
      [now, tripId],
    );
  } else {
    db.runSync(
      `UPDATE upload_queue SET status = 'pending', error_message = NULL, updated_at = ? WHERE status = 'failed' AND retry_count < 3`,
      [now],
    );
  }
}

/**
 * 완료 항목 정리
 */
export function clearCompleted(tripId?: string): void {
  const db = getDatabase();
  if (tripId) {
    db.runSync(`DELETE FROM upload_queue WHERE status = 'uploaded' AND trip_id = ?`, [tripId]);
  } else {
    db.runSync(`DELETE FROM upload_queue WHERE status = 'uploaded'`);
  }
}

/**
 * 완료 + 실패 항목 모두 정리 (새 여행 생성 전 호출)
 */
export function clearFinished(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM upload_queue WHERE status IN ('uploaded', 'failed')`);
}

/**
 * 앱 시작 시 중단된 'uploading' 상태를 'pending'으로 리셋
 */
export function resetStaleUploading(): void {
  const db = getDatabase();
  const now = Date.now();
  db.runSync(
    `UPDATE upload_queue SET status = 'pending', updated_at = ? WHERE status = 'uploading'`,
    [now],
  );
}

/**
 * 큐에 처리할 항목이 있는지 확인
 */
export function hasPendingItems(): boolean {
  const db = getDatabase();
  const row = db.getFirstSync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM upload_queue WHERE status IN ('pending', 'uploading')`,
  );
  return (row?.cnt ?? 0) > 0;
}
