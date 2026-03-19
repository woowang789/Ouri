import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// SecureStore 2048바이트 제한 대응: 청크 분할 저장
const CHUNK_SIZE = 1800;

// expo-secure-store 기반 커스텀 스토리지 어댑터
// 웹에서는 localStorage 폴백
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    // 첫 번째 청크 읽기
    const firstChunk = await SecureStore.getItemAsync(key);
    if (!firstChunk) return null;

    // 단일 청크인 경우 (청크 메타데이터 없음)
    if (!firstChunk.startsWith('__chunked__:')) {
      return firstChunk;
    }

    // 청크 수 파싱 후 전체 복원
    const totalChunks = parseInt(firstChunk.split(':')[1], 10);
    let value = '';
    for (let i = 0; i < totalChunks; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (!chunk) return null;
      value += chunk;
    }
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // 청크 분할 저장
    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    // 메타데이터 저장 (청크 수 기록)
    await SecureStore.setItemAsync(key, `__chunked__:${totalChunks}`);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }

    const existing = await SecureStore.getItemAsync(key);
    if (existing?.startsWith('__chunked__:')) {
      const totalChunks = parseInt(existing.split(':')[1], 10);
      for (let i = 0; i < totalChunks; i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
