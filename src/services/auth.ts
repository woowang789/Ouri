import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import type { User } from '@/types/user';

// 앱 시작 시 1회 호출
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
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
    googleDriveConnected: dbUser.google_drive_connected,
    googleDriveFolderId: dbUser.google_drive_folder_id,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

// public.users 테이블에 사용자 upsert
async function upsertUser(userId: string, nickname: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        nickname,
        google_drive_connected: false,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw new Error(`사용자 정보 저장 실패: ${error.message}`);
  return mapDbUserToUser(data);
}

// Google Sign-In → Supabase Auth → users 테이블 upsert
export async function loginWithGoogle(): Promise<User> {
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

  return upsertUser(authData.user.id, nickname);
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
