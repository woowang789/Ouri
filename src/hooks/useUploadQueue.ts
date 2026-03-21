import { useEffect, useState } from 'react';
import {
  getQueueStats,
  subscribeUploadEvents,
  uploadWorker,
} from '@/services/upload';
import type { QueueStats, UploadEvent } from '@/services/upload';

interface UploadQueueState {
  isUploading: boolean;
  stats: QueueStats;
  lastEvent: UploadEvent | null;
}

/**
 * 업로드 큐 상태 구독 훅 (GlobalUploadProgressBar 전용)
 */
export function useUploadQueue() {
  const [state, setState] = useState<UploadQueueState>({
    isUploading: uploadWorker.isRunning(),
    stats: getQueueStats(),
    lastEvent: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeUploadEvents((event) => {
      setState({
        isUploading: uploadWorker.isRunning(),
        stats: getQueueStats(),
        lastEvent: event,
      });
    });

    return unsubscribe;
  }, []);

  return {
    isUploading: state.isUploading,
    stats: state.stats,
    lastEvent: state.lastEvent,
  };
}
