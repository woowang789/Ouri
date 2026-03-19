import type { SelectedPhoto } from '@/types/photo';

const placeholder = (id: number) =>
  `https://picsum.photos/seed/gallery${id}/400/300`;

// 갤러리에 있는 사진 풀 (EXIF 메타데이터 포함)
const galleryPool: SelectedPhoto[] = [
  {
    localUri: placeholder(1),
    takenAt: '2026-03-10T09:30:00Z',
    takenLat: 37.5665,
    takenLng: 126.9780,
    takenLocationName: '서울 시청',
  },
  {
    localUri: placeholder(2),
    takenAt: '2026-03-10T14:00:00Z',
    takenLat: 37.5796,
    takenLng: 126.9770,
    takenLocationName: '경복궁',
  },
  {
    localUri: placeholder(3),
    takenAt: '2026-03-11T11:00:00Z',
    takenLat: 33.4507,
    takenLng: 126.5706,
    takenLocationName: '용두암',
  },
  {
    localUri: placeholder(4),
    takenAt: '2026-03-12T16:30:00Z',
    takenLat: 33.2541,
    takenLng: 126.4100,
    takenLocationName: '한라산 입구',
  },
  {
    localUri: placeholder(5),
    takenAt: '2026-03-13T10:00:00Z',
    takenLat: 35.1586,
    takenLng: 129.1604,
    takenLocationName: '해운대 해수욕장',
  },
  {
    localUri: placeholder(6),
    takenAt: '2026-03-13T18:00:00Z',
    takenLat: 35.1001,
    takenLng: 129.0368,
    takenLocationName: '광안리',
  },
  {
    localUri: placeholder(7),
    takenAt: null,
    takenLat: null,
    takenLng: null,
    takenLocationName: null,
  },
  {
    localUri: placeholder(8),
    takenAt: '2026-03-14T12:00:00Z',
    takenLat: 37.7955,
    takenLng: 128.9140,
    takenLocationName: '안목해변 카페거리',
  },
];

// 갤러리에서 사진을 선택하는 동작 시뮬레이션
export function mockPickPhotos(count: number): SelectedPhoto[] {
  const shuffled = [...galleryPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
