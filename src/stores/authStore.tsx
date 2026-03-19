import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '@/types/user';
import { mockUser } from '@/mocks/user';

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  mockGoogleLogin: () => void;
  mockLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
  });

  // Google 로그인 + Drive scope 동시 요청 시뮬레이션
  const mockGoogleLogin = useCallback(() => {
    setState({
      isLoggedIn: true,
      user: {
        ...mockUser,
        nickname: '구글 사용자',
        googleDriveConnected: true,
        googleDriveFolderId: 'mock-folder-id',
      },
    });
  }, []);

  const mockLogout = useCallback(() => {
    setState({
      isLoggedIn: false,
      user: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, mockGoogleLogin, mockLogout }}>
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
