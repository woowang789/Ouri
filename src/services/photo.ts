import type { Photo } from '@/types/photo';
import { supabase } from './supabase';
import { uploadFileToDrive, deleteDriveFile } from './drive';
import { deleteMemosByPhoto } from './memo';

// DB 스네이크케이스 → 앱 카멜케이스 변환
function mapDbPhotoToPhoto(row: {
  id: string;
  trip_id: string;
  drive_file_id: string;
  drive_thumbnail_link: string;
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
    driveThumbnailLink: row.drive_thumbnail_link,
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

// 사진 업로드 (Drive 업로드 → Supabase INSERT)
// user_id와 Drive folderId는 내부에서 자동 획득
export async function uploadPhoto(data: {
  tripId: string;
  localUri: string;
  takenAt: string;
  takenLat: number | null;
  takenLng: number | null;
  takenLocationName: string | null;
}): Promise<Photo> {
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // 사용자의 Drive 폴더 ID 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('google_drive_folder_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.google_drive_folder_id) {
    throw new Error('Google Drive 연동이 필요합니다. 다시 로그인해주세요.');
  }

  // Google Drive에 업로드
  const fileName = `ouri_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
  const { fileId, thumbnailLink } = await uploadFileToDrive(
    data.localUri,
    fileName,
    'image/jpeg',
    userData.google_drive_folder_id,
  );

  // Supabase photos 테이블에 메타데이터 저장
  const { data: created, error } = await supabase
    .from('photos')
    .insert({
      trip_id: data.tripId,
      drive_file_id: fileId,
      drive_thumbnail_link: thumbnailLink || data.localUri,
      taken_at: data.takenAt,
      taken_lat: data.takenLat,
      taken_lng: data.takenLng,
      taken_location_name: data.takenLocationName,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`사진 메타데이터 저장 실패: ${error.message}`);
  return mapDbPhotoToPhoto(created);
}

// 사진 삭제 (메모 → Drive → Supabase 순서)
export async function deletePhoto(id: string): Promise<void> {
  // Drive 파일 ID 조회
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('drive_file_id')
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
}
