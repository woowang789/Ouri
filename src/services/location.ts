import * as Location from 'expo-location';

// 역지오코딩 결과 캐시 (좌표 키 → 장소명)
const cache = new Map<string, string>();

// Haversine 공식으로 두 좌표 간 거리 계산 (미터)
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 캐시에서 100m 이내 근접 좌표의 결과 찾기
function findNearbyCache(lat: number, lng: number): string | null {
  for (const [key, value] of cache) {
    const [cLat, cLng] = key.split(',').map(Number);
    if (haversineDistance(lat, lng, cLat, cLng) <= 100) {
      return value;
    }
  }
  return null;
}

// 쓰로틀링용 마지막 호출 시간
let lastCallTime = 0;
const THROTTLE_MS = 500;

// GPS 좌표 → 장소명 역지오코딩
// 쓰로틀링 500ms + 100m 이내 캐싱
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  // 캐시 확인 (100m 이내)
  const cached = findNearbyCache(lat, lng);
  if (cached) return cached;

  // 쓰로틀링 (500ms 간격)
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < THROTTLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS - elapsed));
  }
  lastCallTime = Date.now();

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (results.length === 0) return null;

    const addr = results[0];
    // 도시 + 구/군 + 동/거리 조합
    const parts = [addr.city, addr.district, addr.street]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    const locationName = parts.length > 0 ? parts.join(' ') : addr.name ?? null;

    if (locationName) {
      cache.set(`${lat},${lng}`, locationName);
    }
    return locationName;
  } catch {
    return null;
  }
}
