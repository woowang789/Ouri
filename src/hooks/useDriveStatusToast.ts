import { useEffect, useRef } from 'react';
import { useAuth } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';

/**
 * driveStatus 변화를 감지하여 Toast를 표시하는 훅.
 * RootNavigator에서 호출한다.
 */
export function useDriveStatusToast() {
  const { isLoggedIn, isLoading, driveStatus } = useAuth();
  const { showToast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 앱 최초 로딩 완료 전에는 무시
    if (isLoading) return;

    // 초기 로딩 완료 시점 마킹
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // 초기 로딩 완료 직후에도 상태 체크
      if (isLoggedIn && driveStatus === 'disconnected') {
        showToast({
          type: 'warning',
          message: 'Google Drive 연동에 실패했습니다. 마이페이지에서 상태를 확인해주세요.',
        });
      }
      return;
    }

    // 로그아웃 상태에서는 Toast 표시하지 않음
    if (!isLoggedIn) return;

    if (driveStatus === 'disconnected') {
      showToast({
        type: 'warning',
        message: 'Google Drive 연동에 실패했습니다. 마이페이지에서 상태를 확인해주세요.',
      });
    }
  }, [isLoading, isLoggedIn, driveStatus]);
}
