// 카카오 로컬 API 키워드 장소 검색 응답 타입
export interface KakaoPlaceDocument {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
  categoryName: string;
  phone: string;
}

export interface KakaoPlaceSearchResponse {
  meta: {
    totalCount: number;
    pageableCount: number;
    isEnd: boolean;
  };
  documents: KakaoPlaceDocument[];
}
