// 삭제 워커 — 싱글톤 패턴으로 큐 기반 순차 삭제 처리

import { AppState, type AppStateStatus } from 'react-native';
import { deletePhoto } from '@/services/photo';
import {
  getNextPending,
  updateStatus,
  getDeleteQueueStats,
  hasPendingItems,
  clearCompleted,
  type DeleteQueueItem,
} from './deleteQueue';
import { emit } from './deleteEvents';

// 재시도 지연 시간 (지수 백오프)
const RETRY_DELAYS = [1000, 4000, 16000];

class DeleteWorkerClass {
  private running = false;
  private paused = false;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  /**
   * 워커 시작 — 큐에서 순차적으로 삭제 처리
   * 이미 실행 중이면 무시
   */
  async start(): Promise<void> {
    if (this.running) return;

    if (!hasPendingItems()) return;

    this.running = true;
    this.paused = false;
    this.listenAppState();

    try {
      await this.processQueue();
    } finally {
      this.running = false;
      this.removeAppStateListener();
    }
  }

  /**
   * 워커 중지
   */
  stop(): void {
    this.running = false;
    this.paused = false;
    this.removeAppStateListener();
  }

  /**
   * 일시정지 (백그라운드 전환 시)
   */
  pause(): void {
    this.paused = true;
    emit({ type: 'paused' });
  }

  /**
   * 재개 (포그라운드 복귀 시)
   */
  async resume(): Promise<void> {
    if (!this.paused) return;
    this.paused = false;
    emit({ type: 'resumed' });

    if (!this.running) {
      await this.start();
    }
  }

  /**
   * 현재 실행 중인지 확인
   */
  isRunning(): boolean {
    return this.running;
  }

  private async processQueue(): Promise<void> {
    while (this.running && !this.paused) {
      const item = getNextPending();
      if (!item) {
        clearCompleted();
        break;
      }

      await this.processItem(item);
    }
  }

  private async processItem(item: DeleteQueueItem): Promise<void> {
    // 상태를 deleting으로 변경
    updateStatus(item.id, 'deleting');

    try {
      // 기존 deletePhoto 함수 재사용 (메모 → Drive → Supabase → 커버 재설정)
      await deletePhoto(item.photoId);

      // 성공
      updateStatus(item.id, 'deleted');

      // 진행률 이벤트
      const stats = getDeleteQueueStats(item.tripId);
      emit({
        type: 'progress',
        tripId: item.tripId,
        current: stats.deleted,
        total: stats.total,
      });

      // 모든 항목 완료 시 complete 이벤트
      if (stats.pending === 0 && stats.deleting === 0) {
        emit({
          type: 'complete',
          tripId: item.tripId,
          totalDeleted: stats.deleted,
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류';
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount < 3) {
        updateStatus(item.id, 'pending', {
          retryCount: newRetryCount,
          errorMessage,
        });
        await this.delay(RETRY_DELAYS[item.retryCount] ?? 16000);
      } else {
        updateStatus(item.id, 'failed', {
          retryCount: newRetryCount,
          errorMessage,
        });
        emit({
          type: 'error',
          tripId: item.tripId,
          error: errorMessage,
        });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private listenAppState(): void {
    this.removeAppStateListener();
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private removeAppStateListener(): void {
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }

  private handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === 'background' || nextState === 'inactive') {
      this.pause();
    } else if (nextState === 'active' && this.paused) {
      this.resume();
    }
  };
}

// 싱글톤 인스턴스
export const deleteWorker = new DeleteWorkerClass();
