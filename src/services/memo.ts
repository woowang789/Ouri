import type { Memo } from '@/types/memo';
import { mockMemos } from '@/mocks/memos';

// 메모 서비스 인터페이스
// Phase 3에서 Supabase로 교체 예정

let memos = [...mockMemos];

export async function getMemosByPhoto(photoId: string): Promise<Memo[]> {
  return memos
    .filter((m) => m.photoId === photoId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createMemo(
  data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Memo> {
  const now = new Date().toISOString();
  const newMemo: Memo = {
    ...data,
    id: `memo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  memos.push(newMemo);
  return newMemo;
}

export async function deleteMemo(id: string): Promise<void> {
  memos = memos.filter((m) => m.id !== id);
}

export async function deleteMemosByPhoto(photoId: string): Promise<void> {
  memos = memos.filter((m) => m.photoId !== photoId);
}

export async function getPhotoIdsWithMemo(photoIds: string[]): Promise<Set<string>> {
  const idSet = new Set(photoIds);
  const result = new Set<string>();
  for (const m of memos) {
    if (idSet.has(m.photoId)) result.add(m.photoId);
  }
  return result;
}
