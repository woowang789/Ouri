import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { getOrCreateOuriFolder, updateUserDriveFolderId } from './drive';
import type { User } from '@/types/user';

// 앱 시작 시 1회 호출
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

// DB 스네이크케이스 → 앱 카멜케이스 변환
function mapDbUserToUser(dbUser: {
  id: string;
  nickname: string;
  google_drive_connected: boolean;
  google_drive_folder_id: string | null;
  created_at: string;
  updated_at: string;
}): User {
  return {
    id: dbUser.id,
    nickname: dbUser.nickname,
    // DB 플래그 대신 folderId 존재 여부로 연동 상태 판별
    googleDriveConnected: dbUser.google_drive_folder_id != null,
    googleDriveFolderId: dbUser.google_drive_folder_id,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

// public.users 테이블에 사용자 upsert
// 기존 사용자의 Drive 연동 상태를 덮어쓰지 않도록 ignoreDuplicates 사용
async function upsertUser(userId: string, nickname: string): Promise<User> {
  // 먼저 기존 사용자 확인
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) {
    // 기존 사용자: nickname만 업데이트 (Drive 상태 유지)
    const { data, error } = await supabase
      .from('users')
      .update({ nickname })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`사용자 정보 업데이트 실패: ${error.message}`);
    return mapDbUserToUser(data);
  }

  // 신규 사용자: INSERT
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, nickname })
    .select()
    .single();

  if (error) throw new Error(`사용자 정보 저장 실패: ${error.message}`);
  return mapDbUserToUser(data);
}

export interface LoginResult {
  user: User;
  driveInitFailed: boolean;
}

// Google Sign-In → Supabase Auth → users 테이블 upsert
export async function loginWithGoogle(): Promise<LoginResult> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Google 로그인이 취소되었습니다');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google 인증 토큰을 받지 못했습니다');
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

  if (authError) throw new Error(`로그인 실패: ${authError.message}`);
  if (!authData.user) throw new Error('사용자 정보를 가져올 수 없습니다');

  const nickname =
    authData.user.user_metadata?.full_name ||
    authData.user.user_metadata?.name ||
    authData.user.email?.split('@')[0] ||
    '사용자';

  const user = await upsertUser(authData.user.id, nickname);

  // Drive 폴더 초기화 (실패해도 로그인 성공)
  if (!user.googleDriveFolderId) {
    try {
      const folderId = await getOrCreateOuriFolder();
      await updateUserDriveFolderId(user.id, folderId);
      // folderId 반영된 사용자 정보 반환
      return {
        user: { ...user, googleDriveConnected: true, googleDriveFolderId: folderId },
        driveInitFailed: false,
      };
    } catch (e) {
      console.warn('Drive 폴더 초기화 실패:', e);
      return { user, driveInitFailed: true };
    }
  }

  return { user, driveInitFailed: false };
}

// 로그아웃
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  await GoogleSignin.signOut();
}

// 현재 세션에서 사용자 조회 (세션 복원)
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return null;
  return mapDbUserToUser(data);
}

// Google 로그인 취소 여부 판별
export function isSignInCancelled(error: unknown): boolean {
  return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
}
