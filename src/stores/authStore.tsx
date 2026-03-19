import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '@/types/user';
import { mockUser } from '@/mocks/user';

interface AuthState {
  isLoggedIn: boolean;
  isDriveConnected: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  mockLogin: () => void;
  mockLogout: () => void;
  mockConnectDrive: () => void;
  mockSignup: (nickname: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isDriveConnected: false,
    user: null,
  });

  const mockLogin = useCallback(() => {
    setState({
      isLoggedIn: true,
      isDriveConnected: false,
      user: { ...mockUser, googleDriveConnected: false },
    });
  }, []);

  const mockLogout = useCallback(() => {
    setState({
      isLoggedIn: false,
      isDriveConnected: false,
      user: null,
    });
  }, []);

  const mockSignup = useCallback((nickname: string) => {
    setState({
      isLoggedIn: true,
      isDriveConnected: false,
      user: {
        id: `user-${Date.now()}`,
        nickname,
        googleDriveConnected: false,
        googleDriveFolderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }, []);

  const mockConnectDrive = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDriveConnected: true,
      user: prev.user
        ? { ...prev.user, googleDriveConnected: true, googleDriveFolderId: 'mock-folder-id' }
        : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, mockLogin, mockLogout, mockConnectDrive, mockSignup }}>
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
