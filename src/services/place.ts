import type { KakaoPlaceDocument } from '@/types/kakao';
import { mockPlaces } from '@/mocks/places';

// Mock 장소 검색 서비스
// Phase 3에서 카카오 로컬 API로 교체 예정

export async function searchPlaces(query: string): Promise<KakaoPlaceDocument[]> {
  // 검색어가 비어있으면 빈 배열 반환
  if (!query.trim()) return [];

  // Mock: 장소명 또는 주소에서 검색어 포함 여부로 필터
  const keyword = query.toLowerCase();
  return mockPlaces.filter(
    (p) =>
      p.placeName.toLowerCase().includes(keyword) ||
      p.addressName.toLowerCase().includes(keyword)
  );
}
