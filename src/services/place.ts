import { Config } from '@/constants/config';
import type { KakaoPlaceDocument } from '@/types/kakao';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

// 카카오 API 응답 원본 타입 (snake_case)
interface RawKakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  category_name: string;
  phone: string;
}

// snake_case → camelCase 매핑
function mapToDocument(raw: RawKakaoPlace): KakaoPlaceDocument {
  return {
    id: raw.id,
    placeName: raw.place_name,
    addressName: raw.address_name,
    roadAddressName: raw.road_address_name,
    x: raw.x,
    y: raw.y,
    categoryName: raw.category_name,
    phone: raw.phone,
  };
}

// 카카오 로컬 API 키워드 장소 검색
export async function searchPlaces(query: string): Promise<KakaoPlaceDocument[]> {
  if (!query.trim()) return [];

  if (!Config.kakaoRestApiKey) {
    console.warn('카카오 REST API 키가 설정되지 않았습니다');
    return [];
  }

  try {
    const params = new URLSearchParams({ query, size: '15' });
    const res = await fetch(`${KAKAO_KEYWORD_URL}?${params.toString()}`, {
      headers: { Authorization: `KakaoAK ${Config.kakaoRestApiKey}` },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`카카오 API 응답 오류: ${res.status} - ${errorBody}`);
    }

    const data = await res.json();
    return (data.documents as RawKakaoPlace[]).map(mapToDocument);
  } catch (error) {
    console.warn('장소 검색 실패:', error);
    return [];
  }
}
