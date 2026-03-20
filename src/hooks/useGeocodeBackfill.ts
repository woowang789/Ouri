import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { runGeocodeBackfill } from '@/services/cache/geocodeBackfill';

/**
 * 네트워크 복구(오프라인→온라인) 시 역지오코딩 백필 자동 실행
 * app/_layout 또는 (tabs)/_layout에 배치
 */
export function useGeocodeBackfill(): void {
  const { isOnline } = useNetworkStatus();
  const prevOnline = useRef(true);

  useEffect(() => {
    // 오프라인 → 온라인 전환 감지
    if (isOnline && !prevOnline.current) {
      runGeocodeBackfill().catch((e) =>
        console.warn('역지오코딩 백필 실행 실패:', e)
      );
    }
    prevOnline.current = isOnline;
  }, [isOnline]);
}
