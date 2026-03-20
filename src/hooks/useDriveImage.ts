import { useEffect, useState } from 'react';
import { getAccessToken } from '@/services/drive';

const DRIVE_MEDIA_URL = 'https://www.googleapis.com/drive/v3/files';

interface DriveImageSource {
  uri: string;
  headers: { Authorization: string };
}

// Google Drive 원본 이미지를 인증된 요청으로 로드하기 위한 소스 반환
export function useDriveImage(driveFileId: string | undefined): DriveImageSource | null {
  const [source, setSource] = useState<DriveImageSource | null>(null);

  useEffect(() => {
    if (!driveFileId) {
      setSource(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getAccessToken();
        if (cancelled) return;
        setSource({
          uri: `${DRIVE_MEDIA_URL}/${driveFileId}?alt=media`,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        if (!cancelled) setSource(null);
      }
    })();

    return () => { cancelled = true; };
  }, [driveFileId]);

  return source;
}
