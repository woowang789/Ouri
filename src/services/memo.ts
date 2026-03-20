import type { Memo } from '@/types/memo';
import { supabase } from './supabase';

// DB 스네이크케이스 → 앱 카멜케이스 변환
function mapDbMemoToMemo(row: {
  id: string;
  photo_id: string;
  created_by: string;
  content: string;
  created_at: string;
  updated_at: string;
}): Memo {
  return {
    id: row.id,
    photoId: row.photo_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 특정 사진의 메모 조회
export async function getMemosByPhoto(photoId: string): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`메모 조회 실패: ${error.message}`);
  return (data ?? []).map(mapDbMemoToMemo);
}

// 메모 생성 (user_id는 내부에서 자동 획득)
export async function createMemo(
  data: { photoId: string; content: string }
): Promise<Memo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data: created, error } = await supabase
    .from('memos')
    .insert({
      photo_id: data.photoId,
      created_by: user.id,
      content: data.content,
    })
    .select()
    .single();

  if (error) throw new Error(`메모 생성 실패: ${error.message}`);
  return mapDbMemoToMemo(created);
}

// 메모 삭제
export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`메모 삭제 실패: ${error.message}`);
}

// 사진 삭제 시 관련 메모 일괄 삭제
export async function deleteMemosByPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('photo_id', photoId);

  if (error) throw new Error(`사진 메모 삭제 실패: ${error.message}`);
}

// 메모가 있는 사진 ID 집합 반환 (뱃지 표시용)
export async function getPhotoIdsWithMemo(photoIds: string[]): Promise<Set<string>> {
  if (photoIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('memos')
    .select('photo_id')
    .in('photo_id', photoIds);

  if (error) throw new Error(`메모 존재 여부 조회 실패: ${error.message}`);
  return new Set((data ?? []).map((r: { photo_id: string }) => r.photo_id));
}
