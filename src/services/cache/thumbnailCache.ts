import * as FileSystem from 'expo-file-system/legacy';
import { getAccessToken } from '@/services/drive';

const THUMBNAIL_DIR = `${FileSystem.cacheDirectory}thumbnails/`;
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const MAX_CONCURRENT = 5;

// 디렉터리 존재 확인/생성
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
  }
}

// Drive API에서 최신 thumbnailLink 조회
async function fetchFreshThumbnailUrl(driveFileId: string): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `${DRIVE_API}/files/${driveFileId}?fields=thumbnailLink`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { thumbnailLink?: string };
    return data.thumbnailLink ?? null;
  } catch {
    return null;
  }
}

// 인증 헤더와 함께 썸네일 다운로드
async function downloadWithAuth(url: string, localPath: string): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const result = await FileSystem.downloadAsync(url, localPath, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (result.status === 200) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && info.size && info.size > 0) return localPath;
    }
    await FileSystem.deleteAsync(localPath, { idempotent: true });
    return null;
  } catch {
    await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
    return null;
  }
}

// driveFileId만으로 캐시된 썸네일 URI 반환
export async function getThumbnailUri(driveFileId: string): Promise<string> {
  await ensureDir();
  const localPath = `${THUMBNAIL_DIR}${driveFileId}.jpg`;
  const info = await FileSystem.getInfoAsync(localPath);

  // 캐시 히트
  if (info.exists && info.size && info.size > 0) return localPath;

  // Drive API에서 최신 thumbnailLink 조회 후 다운로드
  const freshUrl = await fetchFreshThumbnailUrl(driveFileId);
  if (freshUrl) {
    const downloaded = await downloadWithAuth(freshUrl, localPath);
    if (downloaded) return downloaded;
    // 다운로드 실패해도 fresh URL 자체를 반환 (Image 컴포넌트에서 직접 로드)
    return freshUrl;
  }

  // 최종 폴백: alt=media URL (원본 이미지, 인증 필요하므로 useDriveImage와 동일)
  const accessToken = await getAccessToken();
  return `${DRIVE_API}/files/${driveFileId}?alt=media&access_token=${accessToken}`;
}

// 여러 사진의 썸네일 프리페치
export async function prefetchThumbnails(driveFileIds: string[]): Promise<void> {
  await ensureDir();
  const uncached: string[] = [];
  for (const id of driveFileIds) {
    const info = await FileSystem.getInfoAsync(`${THUMBNAIL_DIR}${id}.jpg`);
    if (!info.exists) uncached.push(id);
  }

  for (let i = 0; i < uncached.length; i += MAX_CONCURRENT) {
    const batch = uncached.slice(i, i + MAX_CONCURRENT);
    await Promise.allSettled(batch.map((id) => getThumbnailUri(id)));
  }
}

// 썸네일 캐시 전체 삭제
export async function clearThumbnailCache(): Promise<void> {
  await FileSystem.deleteAsync(THUMBNAIL_DIR, { idempotent: true });
}

// 캐시 디렉터리 크기 조회 (바이트)
export async function getThumbnailCacheSize(): Promise<number> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
  if (!info.exists) return 0;

  const files = await FileSystem.readDirectoryAsync(THUMBNAIL_DIR);
  let total = 0;
  for (const file of files) {
    const fileInfo = await FileSystem.getInfoAsync(`${THUMBNAIL_DIR}${file}`);
    if (fileInfo.exists && fileInfo.size) total += fileInfo.size;
  }
  return total;
}
