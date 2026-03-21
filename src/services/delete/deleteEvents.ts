// 삭제 이벤트 시스템 (콜백 기반)

export type DeleteEvent =
  | { type: 'progress'; tripId: string; current: number; total: number }
  | { type: 'complete'; tripId: string; totalDeleted: number }
  | { type: 'error'; tripId: string; error: string }
  | { type: 'paused' }
  | { type: 'resumed' };

type Listener = (event: DeleteEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(event: DeleteEvent): void {
  listeners.forEach((listener) => listener(event));
}
