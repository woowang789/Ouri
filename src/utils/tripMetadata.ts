import type { SelectedPhoto } from '@/types/photo';

export interface ExtractedTripMeta {
  startDate: string;       // 가장 이른 takenAt (YYYY-MM-DD)
  endDate: string;         // 가장 늦은 takenAt (YYYY-MM-DD)
  locationName: string;    // GPS 있는 첫 번째 사진 장소명
  locationLat: number;
  locationLng: number;
}

// 선택된 사진들의 EXIF에서 여행 메타데이터 추출
export function extractTripMetadata(
  photos: SelectedPhoto[],
): ExtractedTripMeta | null {
  const withDate = photos.filter((p) => p.takenAt != null);
  if (withDate.length === 0) return null;

  // 날짜 기준 정렬
  const sorted = [...withDate].sort(
    (a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime(),
  );

  const startDate = sorted[0].takenAt!.slice(0, 10);
  const endDate = sorted[sorted.length - 1].takenAt!.slice(0, 10);

  // GPS 정보가 있는 첫 번째 사진에서 장소명 추출
  const withLocation = photos.find(
    (p) => p.takenLat != null && p.takenLng != null && p.takenLocationName,
  );

  if (!withLocation) {
    return { startDate, endDate, locationName: '', locationLat: 0, locationLng: 0 };
  }

  return {
    startDate,
    endDate,
    locationName: withLocation.takenLocationName!,
    locationLat: withLocation.takenLat!,
    locationLng: withLocation.takenLng!,
  };
}
