import { useEffect, useState } from 'react';
import {
  getDeleteQueueStats,
  subscribeDeleteEvents,
  deleteWorker,
} from '@/services/delete';
import type { DeleteQueueStats, DeleteEvent } from '@/services/delete';

interface DeleteQueueState {
  isDeleting: boolean;
  stats: DeleteQueueStats;
  lastEvent: DeleteEvent | null;
}

/**
 * 삭제 큐 상태 구독 훅
 */
export function useDeleteQueue() {
  const [state, setState] = useState<DeleteQueueState>({
    isDeleting: deleteWorker.isRunning(),
    stats: getDeleteQueueStats(),
    lastEvent: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeDeleteEvents((event) => {
      setState({
        isDeleting: deleteWorker.isRunning(),
        stats: getDeleteQueueStats(),
        lastEvent: event,
      });
    });

    return unsubscribe;
  }, []);

  return {
    isDeleting: state.isDeleting,
    stats: state.stats,
    lastEvent: state.lastEvent,
  };
}
