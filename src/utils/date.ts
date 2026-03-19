import type { Trip } from '@/types/trip';

// 날짜를 "2026년 1월 10일" 형식으로 포맷
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜를 "1월 10일" 형식으로 포맷 (연도 생략)
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 날짜 범위를 "1월 10일 - 13일" 형식으로 포맷
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;

  if (startMonth === endMonth) {
    return `${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`;
  }
  return `${startMonth}월 ${start.getDate()}일 - ${endMonth}월 ${end.getDate()}일`;
}

// "2026년 1월" 형식의 월 키 생성
export function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// 여행 목록을 월별로 그룹핑
export function groupTripsByMonth(
  trips: Trip[]
): { title: string; data: Trip[] }[] {
  const groups = new Map<string, Trip[]>();

  for (const trip of trips) {
    const key = getMonthKey(trip.startDate);
    const existing = groups.get(key);
    if (existing) {
      existing.push(trip);
    } else {
      groups.set(key, [trip]);
    }
  }

  return Array.from(groups.entries()).map(([title, data]) => ({
    title,
    data,
  }));
}

// ISO 날짜 문자열에서 날짜 부분만 추출 (YYYY-MM-DD)
export function toDateString(isoStr: string): string {
  return isoStr.split('T')[0];
}

// 날짜를 "3월 15일 토요일" 형식으로 포맷 (여행 상세용)
const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export function toFriendlyDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  return `${month}월 ${day}일 ${dayName}`;
}
