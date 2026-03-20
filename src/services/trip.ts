import type { Trip } from '@/types/trip';
import { supabase } from './supabase';
import { deleteDriveFile } from './drive';

// DB 스네이크케이스 → 앱 카멜케이스 변환
function mapDbTripToTrip(row: {
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
}): Trip {
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

// 앱 카멜케이스 → DB 스네이크케이스 변환 (insert/update용)
function mapTripToDb(
  data: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  if (data.title !== undefined) mapped.title = data.title;
  if (data.startDate !== undefined) mapped.start_date = data.startDate;
  if (data.endDate !== undefined) mapped.end_date = data.endDate;
  if (data.locationName !== undefined) mapped.location_name = data.locationName;
  if (data.locationLat !== undefined) mapped.location_lat = data.locationLat;
  if (data.locationLng !== undefined) mapped.location_lng = data.locationLng;
  if (data.coverPhotoId !== undefined) mapped.cover_photo_id = data.coverPhotoId;
  return mapped;
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw new Error(`여행 목록 조회 실패: ${error.message}`);
  return (data ?? []).map(mapDbTripToTrip);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 결과 없음
    throw new Error(`여행 조회 실패: ${error.message}`);
  }
  return mapDbTripToTrip(data);
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'userId' | 'coverPhotoId' | 'createdAt' | 'updatedAt'>
): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data: created, error } = await supabase
    .from('trips')
    .insert({ ...mapTripToDb(data), user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(`여행 생성 실패: ${error.message}`);
  return mapDbTripToTrip(created);
}

export async function updateTrip(
  id: string,
  data: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): Promise<Trip> {
  const { data: updated, error } = await supabase
    .from('trips')
    .update(mapTripToDb(data))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`여행 수정 실패: ${error.message}`);
  return mapDbTripToTrip(updated);
}

export interface CoverPhotoInfo {
  thumbnailUrl: string;
  driveFileId: string;
}

// 여행 목록의 커버 사진 정보 일괄 조회 (썸네일 URL + Drive 파일 ID)
export async function getCoverPhotos(trips: Trip[]): Promise<Record<string, CoverPhotoInfo>> {
  const coverPhotoIds = trips
    .filter(t => t.coverPhotoId)
    .map(t => t.coverPhotoId!);
  if (coverPhotoIds.length === 0) return {};

  const { data } = await supabase
    .from('photos')
    .select('id, drive_thumbnail_link, drive_file_id')
    .in('id', coverPhotoIds);

  const photoMap = new Map(
    data?.map(p => [p.id, { thumbnailUrl: p.drive_thumbnail_link, driveFileId: p.drive_file_id }]) ?? []
  );
  const result: Record<string, CoverPhotoInfo> = {};
  for (const trip of trips) {
    if (trip.coverPhotoId && photoMap.has(trip.coverPhotoId)) {
      result[trip.id] = photoMap.get(trip.coverPhotoId)!;
    }
  }
  return result;
}

export async function deleteTrip(id: string): Promise<void> {
  // 여행에 포함된 사진의 Drive 파일 ID 조회
  const { data: photos } = await supabase
    .from('photos')
    .select('drive_file_id')
    .eq('trip_id', id);

  // Drive 파일 일괄 삭제 (개별 실패해도 계속 진행)
  if (photos && photos.length > 0) {
    for (const photo of photos) {
      if (photo.drive_file_id) {
        try {
          await deleteDriveFile(photo.drive_file_id);
        } catch (e) {
          console.warn('Drive 파일 삭제 실패:', e);
        }
      }
    }
  }

  // DB 삭제 (CASCADE로 photos, memos 자동 삭제)
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`여행 삭제 실패: ${error.message}`);
}
