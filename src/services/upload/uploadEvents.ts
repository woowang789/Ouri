// 업로드 이벤트 시스템 (콜백 기반)

export type UploadEvent =
  | { type: 'progress'; tripId: string; current: number; total: number }
  | { type: 'complete'; tripId: string; totalUploaded: number }
  | { type: 'error'; tripId: string; error: string }
  | { type: 'paused' }
  | { type: 'resumed' };

type Listener = (event: UploadEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(event: UploadEvent): void {
  listeners.forEach((listener) => listener(event));
}
