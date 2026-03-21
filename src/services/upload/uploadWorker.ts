// 업로드 워커 — 싱글톤 패턴으로 큐 기반 순차 업로드 처리

import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import {
  uploadFileToDrive,
} from '@/services/drive';
import { addPendingGeocode } from '@/services/cache/geocodeBackfill';
import {
  getNextPending,
  updateStatus,
  getQueueStats,
  hasPendingItems,
  clearCompleted,
  type QueueItem,
} from './uploadQueue';
import { emit } from './uploadEvents';

// 재시도 지연 시간 (지수 백오프)
const RETRY_DELAYS = [1000, 4000, 16000];

class UploadWorkerClass {
  private running = false;
  private paused = false;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  /**
   * 워커 시작 — 큐에서 순차적으로 업로드 처리
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

    // 실행 중이 아니면 다시 시작
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
        // 모든 항목 처리 완료 — 완료된 항목 정리
        clearCompleted();
        break;
      }

      await this.processItem(item);
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    // 상태를 uploading으로 변경
    updateStatus(item.id, 'uploading');

    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // Drive 폴더 ID 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('google_drive_folder_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.google_drive_folder_id) {
        throw new Error('Google Drive 연동이 필요합니다');
      }

      // Google Drive에 업로드
      const { fileId } = await uploadFileToDrive(
        item.localUri,
        item.fileName,
        item.mimeType,
        userData.google_drive_folder_id,
      );

      // Supabase photos 테이블에 메타데이터 저장
      const { data: created, error } = await supabase
        .from('photos')
        .insert({
          trip_id: item.tripId,
          drive_file_id: fileId,
          taken_at: item.takenAt,
          taken_lat: item.takenLat,
          taken_lng: item.takenLng,
          taken_location_name: item.takenLocationName,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(`사진 메타데이터 저장 실패: ${error.message}`);

      // 역지오코딩 백필 등록
      if (!item.takenLocationName && item.takenLat != null && item.takenLng != null) {
        addPendingGeocode(created.id, item.takenLat, item.takenLng);
      }

      // 첫 사진이면 자동 커버 설정
      const { data: tripData } = await supabase
        .from('trips')
        .select('cover_photo_id')
        .eq('id', item.tripId)
        .single();

      if (tripData && !tripData.cover_photo_id) {
        await supabase
          .from('trips')
          .update({ cover_photo_id: created.id, updated_at: new Date().toISOString() })
          .eq('id', item.tripId);
      }

      // 성공
      updateStatus(item.id, 'uploaded', { driveFileId: fileId });

      // 진행률 이벤트
      const stats = getQueueStats(item.tripId);
      emit({
        type: 'progress',
        tripId: item.tripId,
        current: stats.uploaded,
        total: stats.total,
      });

      // 모든 항목 완료 시 complete 이벤트
      if (stats.pending === 0 && stats.uploading === 0) {
        emit({
          type: 'complete',
          tripId: item.tripId,
          totalUploaded: stats.uploaded,
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류';
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount < 3) {
        // 재시도 대기 후 pending으로 변경
        updateStatus(item.id, 'pending', {
          retryCount: newRetryCount,
          errorMessage,
        });
        await this.delay(RETRY_DELAYS[item.retryCount] ?? 16000);
      } else {
        // 최대 재시도 초과 → failed 고정
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
export const uploadWorker = new UploadWorkerClass();
