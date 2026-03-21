import type { Photo } from '@/types/photo';
import { supabase } from './supabase';
import { deleteDriveFile } from './drive';
import { deleteMemosByPhoto } from './memo';

// DB 스네이크케이스 → 앱 카멜케이스 변환
function mapDbPhotoToPhoto(row: {
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
}): Photo {
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

// 여행별 사진 조회 (촬영 시간순)
export async function getPhotos(tripId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('taken_at', { ascending: true });

  if (error) throw new Error(`사진 목록 조회 실패: ${error.message}`);
  return (data ?? []).map(mapDbPhotoToPhoto);
}

// 사진 삭제 (메모 → Drive → Supabase 순서)
export async function deletePhoto(id: string): Promise<void> {
  // Drive 파일 ID 및 trip_id 조회
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('drive_file_id, trip_id')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`사진 조회 실패: ${fetchError.message}`);

  // 관련 메모 삭제
  await deleteMemosByPhoto(id);

  // Drive 파일 삭제 (실패해도 DB 삭제 진행)
  if (photo?.drive_file_id) {
    try {
      await deleteDriveFile(photo.drive_file_id);
    } catch (e) {
      console.warn('Drive 파일 삭제 실패:', e);
    }
  }

  // Supabase 레코드 삭제
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`사진 삭제 실패: ${error.message}`);

  // 커버 사진이었다면 다음 사진으로 자동 교체
  if (photo?.trip_id) {
    const { data: tripAfterDelete } = await supabase
      .from('trips')
      .select('cover_photo_id')
      .eq('id', photo.trip_id)
      .single();

    if (tripAfterDelete && !tripAfterDelete.cover_photo_id) {
      const { data: nextPhoto } = await supabase
        .from('photos')
        .select('id')
        .eq('trip_id', photo.trip_id)
        .order('taken_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextPhoto) {
        await supabase
          .from('trips')
          .update({ cover_photo_id: nextPhoto.id, updated_at: new Date().toISOString() })
          .eq('id', photo.trip_id);
      }
    }
  }
}
