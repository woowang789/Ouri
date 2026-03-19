import type { User } from '@/types/user';
import { mockUser } from '@/mocks/user';

// 인증 서비스 인터페이스
// Phase 3에서 Supabase Auth로 교체 예정

export async function login(): Promise<User> {
  // Mock: 즉시 사용자 반환
  return { ...mockUser, googleDriveConnected: false };
}

export async function logout(): Promise<void> {
  // Mock: 아무 동작 없음
}

export async function getCurrentUser(): Promise<User | null> {
  // Mock: 저장된 사용자 반환
  return { ...mockUser };
}
