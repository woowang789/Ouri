import { useCallback, useEffect, useState } from 'react';
import { getDriveStorageQuota } from '@/services/drive';

interface DriveState {
  used: number; // 바이트 단위
  isLoading: boolean;
  error: string | null;
}

// 바이트 → GB 변환
export function bytesToGB(bytes: number): string {
  return (bytes / (1024 ** 3)).toFixed(1);
}

// connected: Drive 연동 여부. false이면 API 호출하지 않음
export function useDrive(connected: boolean) {
  const [state, setState] = useState<DriveState>({
    used: 0,
    isLoading: connected,
    error: null,
  });

  const fetchQuota = useCallback(async () => {
    if (!connected) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const quota = await getDriveStorageQuota();
      setState({ used: quota.used, isLoading: false, error: null });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Drive 용량 조회 실패',
      }));
    }
  }, [connected]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { ...state, refetch: fetchQuota };
}
