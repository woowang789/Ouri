import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { User } from '@/types/user';
import {
  configureGoogleSignIn,
  loginWithGoogle,
  logout as authLogout,
  getCurrentUser,
  isSignInCancelled,
} from '@/services/auth';
import { supabase } from '@/services/supabase';

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    isLoading: true, // 세션 복원 중
    error: null,
  });

  // 초기화: Google Sign-In 설정 + 세션 복원
  useEffect(() => {
    configureGoogleSignIn();

    getCurrentUser()
      .then((user) => {
        setState({
          isLoggedIn: !!user,
          user,
          isLoading: false,
          error: null,
        });
      })
      .catch(() => {
        setState({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: null,
        });
      });
  }, []);

  // Supabase Auth 상태 변경 리스너
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // 토큰 갱신 실패 시에도 SIGNED_OUT 이벤트가 발생함
        // 이전에 로그인 상태였다면 세션 만료로 판단
        setState((prev) => ({
          ...prev,
          isLoggedIn: false,
          user: null,
          error: prev.isLoggedIn
            ? '세션이 만료되었습니다. 다시 로그인해주세요.'
            : null,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await loginWithGoogle();
      setState({
        isLoggedIn: true,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // 사용자가 취소한 경우 에러 표시하지 않음
      if (isSignInCancelled(error)) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      const message =
        error instanceof Error ? error.message : '로그인에 실패했습니다';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // isLoggedIn만 false로 변경하여 리다이렉트 트리거
      // user 데이터는 유지하여 전환 애니메이션 중 "?" 표시 방지
      setState((prev) => ({
        ...prev,
        isLoggedIn: false,
        error: null,
      }));
      await authLogout();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '로그아웃에 실패했습니다';
      setState((prev) => ({
        ...prev,
        error: message,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
}
