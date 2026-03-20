# Ouri MVP 개발 로드맵

> **원칙**: UI 셸(Mock 데이터) → 내부 로직 구현 순서로 진행한다.
> 각 단계는 이전 단계 완료를 전제로 하며, 체크박스로 진행 상황을 추적한다.

---

## 기능 의존관계

```
F008 Google 인증 (+ Drive scope 동시 요청) ──┐
                                             ▼
                              F003 사진 업로드 ── F004 사진 뷰어
                              │                └── F010 사진 삭제
                              │
F001 여행 생성 ── F002 타임라인 ──┬── F005 메모 작성
                                 ├── F009 여행 삭제
                                 └── F007 지도 뷰 (F003의 GPS 데이터 필요)
```

---

## Phase 1: 프로젝트 기반 구축

> 네비게이션 구조, 디자인 시스템, Mock 데이터 인프라를 먼저 갖춘다.

### 1-1. 프로젝트 디렉터리 구조 세팅

- [x] 기존 Expo 템플릿 코드 전체 제거
- [x] 아래 디렉터리 구조로 재구성
- [x] `tsconfig.json` 경로 별칭 설정 (`@/*` → `src/*`)

```
Ouri/
│
├── app/                                # Expo Router — 라우팅 전용 (화면 진입점)
│   ├── _layout.tsx                     # RootLayout: 인증 상태에 따른 2단계 분기
│   │
│   ├── (auth)/                         # 그룹: 비로그인 사용자
│   │   ├── _layout.tsx                 # Stack 레이아웃
│   │   └── login.tsx                   # 로그인 페이지 (F008) — Google 로그인 + Drive scope 동시 요청
│   │
│   ├── (tabs)/                         # 그룹: 메인 탭 (로그인 + Drive 연동 완료)
│   │   ├── _layout.tsx                 # 하단 탭: 홈, 지도, 마이
│   │   ├── index.tsx                   # 홈 — 타임라인 (F002)
│   │   ├── map.tsx                     # 지도 (F007)
│   │   └── mypage.tsx                  # 마이페이지 (F006, F008)
│   │
│   └── trip/                           # 여행 관련 스택 화면
│       ├── create.tsx                  # 여행 생성 (F001)
│       ├── [id]/
│       │   ├── index.tsx               # 여행 상세 (F003, F005, F009, F010)
│       │   └── photo-viewer.tsx        # 사진 뷰어 — 모달 (F004)
│       └── _layout.tsx                 # trip 스택 레이아웃
│
├── src/                                # 앱 소스 코드 (라우팅 외 전부)
│   │
│   ├── components/                     # 재사용 UI 컴포넌트
│   │   ├── ui/                         # 기본 프리미티브 (도메인 무관)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── FAB.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ThemedView.tsx
│   │   │
│   │   ├── trip/                       # 여행 도메인 컴포넌트
│   │   │   ├── TripCard.tsx            # 타임라인 카드
│   │   │   ├── TripHeader.tsx          # 상세 페이지 헤더
│   │   │   ├── TimelineFeed.tsx        # 사진+메모 시간순 피드
│   │   │   └── MonthDivider.tsx        # 월별 구분선
│   │   │
│   │   ├── photo/                      # 사진 도메인 컴포넌트
│   │   │   ├── PhotoGrid.tsx           # 사진 썸네일 그리드
│   │   │   ├── PhotoViewer.tsx         # 풀스크린 뷰어 (스와이프+줌)
│   │   │   └── PhotoUploadSheet.tsx    # 갤러리/카메라 선택 바텀시트
│   │   │
│   │   ├── memo/                       # 메모 도메인 컴포넌트
│   │   │   ├── MemoCard.tsx            # 메모 표시 카드
│   │   │   └── MemoInputModal.tsx      # 메모 작성 모달
│   │   │
│   │   ├── map/                        # 지도 도메인 컴포넌트
│   │   │   ├── TripMarker.tsx          # 여행 장소 핀 마커
│   │   │   └── TripSummaryCard.tsx     # 핀 탭 시 하단 요약 카드
│   │   │
│   │   └── auth/                       # 인증 도메인 컴포넌트
│   │       └── SocialLoginButton.tsx   # Google 로그인 버튼
│   │
│   ├── services/                       # 외부 서비스 연동 (API 호출 계층)
│   │   ├── supabase.ts                 # Supabase 클라이언트 초기화
│   │   ├── auth.ts                     # 소셜 로그인/로그아웃/토큰 관리
│   │   ├── trip.ts                     # 여행 CRUD (Supabase)
│   │   ├── photo.ts                    # 사진 CRUD + EXIF 추출
│   │   ├── memo.ts                     # 메모 CRUD (Supabase)
│   │   ├── drive.ts                    # Google Drive 연동/업로드/삭제
│   │   ├── kakao.ts                    # 카카오 로컬 API (장소 검색)
│   │   └── location.ts                 # 위치 기록 + 역지오코딩
│   │
│   ├── hooks/                          # 커스텀 React 훅
│   │   ├── useAuth.ts                  # 인증 상태 + 로그인/로그아웃
│   │   ├── useTrips.ts                 # 여행 목록/상세 조회
│   │   ├── usePhotos.ts               # 사진 조회/업로드/삭제
│   │   ├── useMemos.ts                # 메모 CRUD
│   │   ├── useDrive.ts                # Drive 연동 상태/용량
│   │   ├── usePlaceSearch.ts          # 장소 검색 (디바운스 포함)
│   │   ├── useColorScheme.ts          # 다크모드 감지
│   │   └── useThemeColor.ts           # 테마 색상 선택
│   │
│   ├── stores/                         # 전역 상태 관리 (Context 또는 Zustand)
│   │   └── authStore.ts               # 인증 상태 (유저 정보, 로그인 여부, Drive 연동 포함)
│   │
│   ├── types/                          # TypeScript 타입 정의
│   │   ├── user.ts                     # User 인터페이스
│   │   ├── trip.ts                     # Trip 인터페이스
│   │   ├── photo.ts                    # Photo 인터페이스
│   │   ├── memo.ts                     # Memo 인터페이스
│   │   └── kakao.ts                    # 카카오 API 응답 타입
│   │
│   ├── constants/                      # 상수
│   │   ├── theme.ts                    # 색상 팔레트, 폰트, 스페이싱
│   │   └── config.ts                   # API 키 래퍼, 설정값
│   │
│   ├── utils/                          # 유틸리티 함수
│   │   ├── date.ts                     # 날짜 포맷, 월별 그룹핑
│   │   ├── geo.ts                      # 좌표 거리 계산, 근접 캐싱
│   │   └── throttle.ts                 # 쓰로틀링, 디바운스 헬퍼
│   │
│   └── mocks/                          # Mock 데이터 (Phase 2에서 사용)
│       ├── user.ts                     # Mock 사용자 프로필
│       ├── trips.ts                    # Mock 여행 3~5개
│       ├── photos.ts                   # Mock 사진 10~15장
│       └── memos.ts                    # Mock 메모 5개
│
├── assets/                             # 정적 에셋
│   ├── images/                         # 아이콘, 스플래시, 로고
│   └── fonts/                          # 커스텀 폰트 (필요 시)
│
├── docs/                               # 프로젝트 문서
│   ├── PRD.md
│   └── ROADMAP.md
│
├── app.json                            # Expo 설정
├── tsconfig.json                       # TypeScript 설정 (경로 별칭)
├── eslint.config.js                    # ESLint 설정
├── .env.example                        # 환경 변수 템플릿
└── package.json
```

#### 구조 설계 원칙

| 원칙 | 설명 |
|------|------|
| **`app/`은 라우팅 전용** | 화면 진입점과 레이아웃만 배치. 비즈니스 로직·UI 컴포넌트는 `src/`에 분리 |
| **도메인별 컴포넌트 분류** | `components/trip/`, `components/photo/` 등 기능 단위로 그룹핑 |
| **서비스 계층 분리** | `services/`가 모든 외부 API 호출을 담당. Mock → 실제 교체 시 이 계층만 수정 |
| **`mocks/`는 임시** | Phase 3~5에서 실제 서비스로 교체 후 제거 |

### 1-1-2. 네비게이션 & 라우팅 구성

- [x] 인증 상태에 따른 라우팅 가드 (`app/_layout.tsx`에서 Mock 상태값으로 2단계 분기)
  - 비로그인 → `(auth)/login`
  - 로그인 → `(tabs)/` (Google 로그인 시 Drive scope 동시 요청으로 별도 연동 단계 불필요)
- [x] 하단 탭 네비게이션 구성 (홈, 지도, 마이 — 아이콘 포함)
- [x] trip 스택 네비게이션 (생성 → 상세 → 사진 뷰어)

### 1-2. 디자인 시스템 기초

- [x] 색상 팔레트 정의 (`constants/theme.ts` 확장)
- [x] 공통 타이포그래피 스타일 정의
- [x] 공통 컴포넌트 생성: Button, Input, Card, EmptyState
- [x] 다크모드 지원 확인 (기존 ThemedText/ThemedView 활용)

### 1-3. Mock 데이터 & 타입 정의

- [x] TypeScript 타입 정의 (`types/` 디렉터리)
  - `User`, `Trip`, `Photo`, `Memo` 인터페이스 (PRD 데이터 모델 기반)
- [x] Mock 데이터 생성 (`mocks/` 디렉터리)
  - 샘플 여행 3~5개, 사진 10~15장, 메모 5개
  - Mock 사용자 프로필
- [x] Mock 서비스 레이어 (`services/` 디렉터리에 인터페이스만 정의)
  - 추후 실제 Supabase/Google Drive로 교체할 수 있는 구조

---

## Phase 2: UI 셸 구현 (Mock 데이터)

> 모든 화면을 Mock 데이터로 먼저 구현하여 UX 흐름을 검증한다.

### 2-1. 인증 화면 (F008 UI)

- [x] 로그인 페이지 UI
  - Google 로그인 버튼 (탭 시 Mock 로그인 + Drive 연동 동시 처리 → 바로 홈 이동)
  - 로고, 앱 이름, 태그라인 표시

> **설계 변경**: Apple 로그인 제거, 회원가입 페이지 제거, Drive 연동 화면 제거.
> Google 로그인 시 Drive scope를 동시 요청하여 1회 인증으로 로그인 + Drive 연결 완료.

### 2-2. 홈 — 타임라인 (F002 UI)

- [x] 여행 카드 컴포넌트 (대표 사진, 제목, 날짜, 장소)
- [x] 월별 구분선이 있는 시간순 카드 리스트 (SectionList)
- [x] 빈 상태 안내 메시지 (여행이 없을 때)
- [x] 우하단 FAB "+" 버튼 (여행 생성 페이지로 이동)
- [x] Pull-to-refresh 기능

### 2-3. 여행 생성 (F001 UI)

- [x] 여행 제목 입력 필드
- [x] 날짜 범위 선택 (시작일 ~ 종료일)
- [x] 장소 검색 UI (Mock 검색 결과)
- [x] 사진 선택 (갤러리/카메라)
- [x] "여행 만들기" 버튼 (Mock 생성 → 여행 상세로 이동)

### 2-4. 여행 상세 (F003, F005, F009, F010 UI)

- [x] 여행 헤더 (제목, 날짜, 장소 표시 + 편집/삭제 버튼)
- [x] 사진 날짜별 그룹핑 피드 (SectionList)
  - 사진 썸네일 3열 그리드
  - 메모 배지 표시
- [x] 사진 추가 버튼 (갤러리/카메라 선택 바텀시트)
- [x] 메모 추가 모달 (사진 뷰어에서 접근)
- [x] 삭제 확인 다이얼로그 (ConfirmDialog)

### 2-5. 사진 뷰어 (F004 UI)

- [x] 풀스크린 사진 표시 (Mock 이미지)
- [x] 좌우 스와이프 제스처 (FlatList 페이지네이션)
- [x] 촬영 날짜·위치 정보 오버레이
- [x] 탭하여 UI 토글 (몰입 모드)
- [x] 메모 표시 및 삭제 기능

### 2-6. 지도 (F007 UI)

- [x] react-native-maps 지도 렌더링 (한국 중심 초기 좌표)
- [x] Mock 여행 장소 커스텀 핀 마커 (TripMarker)
- [x] 핀 탭 시 하단 여행 요약 카드 (TripSummaryCard)
- [x] 요약 카드 탭 → 여행 상세 이동
- [x] Android 폴백 UI (Google Maps API 키 필요 안내)

### 2-7. 마이페이지 (F008 UI)

- [x] 프로필 정보 표시 (Mock 닉네임, 가입일)
- [x] Google Drive 사용 용량 표시 (프로그레스 바, Mock 데이터)
- [x] 설정 메뉴 (알림, 도움말, 앱 정보)
- [x] 로그아웃 버튼 (ConfirmDialog 확인)

### Phase 2 완료 기준

- [x] **전체 화면 워크스루 가능**: 로그인 → 홈 → 여행 생성 → 여행 상세 → 사진 뷰어 → 지도 → 마이페이지 → 로그아웃, 모든 전환이 Mock 데이터로 동작
- [x] **UX 검토 완료**: 화면 전환 흐름, 빈 상태, 로딩 상태 확인

---

## Phase 3: 인증 & 데이터베이스 연동

> Mock을 실제 백엔드로 교체한다. 인증이 모든 기능의 전제 조건이므로 가장 먼저 구현한다.

### 3-1. Supabase 설정

- [x] Supabase 프로젝트 테이블 생성 (users, trips, photos, memos)
- [x] RLS 정책 설정 (사용자 단위 데이터 격리)
- [x] `updated_at` 자동 갱신 trigger 설정 (`moddatetime`)
- [x] Supabase 클라이언트 초기화 (`lib/supabase.ts`)

### 3-2. 소셜 인증 구현 (F008)

- [x] Google 네이티브 로그인 (`@react-native-google-signin/google-signin`)
  - EAS Dev Build 설정 (Expo Go 미지원)
  - Google Cloud Console OAuth 클라이언트 ID 설정 (Drive scope 포함)
  - Supabase Auth와 연동
- [x] 로그인 화면의 Mock → 실제 인증으로 교체
- [x] `expo-secure-store`에 토큰 저장 로직 구현
- [x] 토큰 갱신 실패 시 재로그인 유도 처리
- [x] 로그아웃 구현

### 3-3. 여행 CRUD 연동 (F001, F002, F009)

- [x] 여행 생성 → Supabase `trips` INSERT
- [x] 타임라인 조회 → Supabase `trips` SELECT (시간순 정렬)
- [x] 여행 삭제 → Supabase `trips` DELETE (CASCADE로 photos, memos 포함)
- [x] Mock 데이터 → 실제 Supabase 데이터로 교체

### 3-4. 메모 CRUD 연동 (F005)

- [x] 메모 생성 → Supabase `memos` INSERT
- [x] 메모 조회 → 여행 상세에서 `memos` SELECT
- [x] 메모 삭제 → Supabase `memos` DELETE

---

## Phase 4: Google Drive & 사진 기능

> 앱의 핵심 차별점인 Google Drive 연동과 사진 기능을 구현한다.

### 4-1. Google Drive 연동 (F006)

- [x] **PoC 수행**: `@robinbobin/react-native-google-drive-api-wrapper`가 Expo v54 + New Architecture에서 동작하는지 검증
  - 호환 불가 → Google Drive REST API v3 `fetch` 경량 래퍼 자체 구현 (`src/services/drive.ts`)
- [x] Google 로그인 시 Drive scope 동시 요청 구현 (Phase 3 인증과 연계)
- [x] Ouri/ 전용 폴더 자동 생성 로직
- [x] Drive 연동 상태 Supabase `users` 테이블 업데이트
- [x] 마이페이지 저장 용량 표시 (Drive API quota 조회)

### 4-2. 사진 업로드 + 메타데이터 (F003)

- [x] `expo-image-picker` 갤러리 다중 선택 + EXIF(GPS/시간) 추출 (`exif: true` 옵션)
- [x] `expo-image-picker` 카메라 촬영
- [x] `expo-location` 카메라 촬영 시 현재 위치 기록
- [x] GPS 좌표 → 역지오코딩 장소명 변환 (`src/services/location.ts`)
  - 쓰로틀링 500ms 간격 적용
  - 동일 좌표 근접 100m 이내 캐싱 (haversine)
- [x] Google Drive Resumable Upload 구현 (5MB 초과 대응)
- [x] Supabase `photos` 테이블에 메타데이터 저장
- [x] Drive `thumbnailLink` 기반 썸네일 표시 (없을 시 localUri 폴백)
- [ ] `expo-file-system` 캐시 디렉터리에 썸네일 로컬 캐싱 (`{drive_file_id}.jpg`)

### 4-3. 사진 뷰어 실연동 (F004)

- [x] Mock 이미지 → Google Drive 원본 사진 로드로 교체
- [x] 촬영 날짜·위치 정보 실제 데이터 표시

### 4-4. 사진 삭제 (F010)

- [x] Supabase `photos` DELETE + Google Drive 파일 동시 삭제
- [x] 여행 삭제 시 포함된 사진 일괄 Drive 삭제 (F009 보완)

---

## Phase 5: 장소 검색 & 지도

> 장소 관련 기능을 실연동한다.

### 5-1. 카카오 로컬 API 장소 검색 (F001 보완)

- [x] 카카오 로컬 API 키워드 검색 연동
- [x] 디바운스 300ms 적용
- [x] 검색 결과에서 장소명 + 위도/경도 저장
- [x] 여행 생성 페이지의 Mock 검색 → 실제 API로 교체

### 5-2. 지도 실연동 (F007)

- [x] Mock 핀 → Supabase 여행 데이터 기반 실제 핀 표시
- [x] EXIF 위치 기반 사진 핀 자동 배치
- [x] 핀 탭 → 여행 상세 이동 실연동

---

## Phase 6: 오프라인 & 최적화

> 안정성과 사용성을 높인다.

### 6-1. 오프라인 캐시

- [ ] expo-sqlite 로컬 캐시 구현 (여행 목록, 메모)
- [ ] 오프라인 상태 감지 및 UI 표시
- [ ] 역지오코딩 실패 시 NULL 저장 → 네트워크 복구 시 백필

### 6-2. 성능 최적화

- [ ] 타임라인 FlatList 가상화 최적화 (대량 여행 카드)
- [ ] 사진 그리드 lazy loading
- [ ] Google Drive API 호출 최소화 (썸네일 캐시 히트율 확인)
- [ ] 대용량 사진 업로드 진행률 표시

### 6-3. 에러 처리 & 엣지 케이스

- [ ] 네트워크 에러 시 재시도 UI
- [ ] 토큰 만료 자동 갱신 / 실패 시 재로그인 유도
- [ ] 권한 거부 시 안내 (카메라, 갤러리, 위치)
- [ ] Google Drive 용량 부족 시 안내

---

## Phase 7: 빌드 & 배포 준비

- [ ] EAS Build 설정 (iOS / Android)
- [ ] 앱 아이콘, 스플래시 스크린 최종 에셋 적용
- [ ] 환경 변수 분리 (dev / production)
- [ ] EAS Submit 설정 (App Store / Google Play)

---

## Phase 요약

| Phase | 범위 | 관련 기능 | 핵심 산출물 |
|-------|------|-----------|-------------|
| **1** | 프로젝트 기반 | - | 라우팅, 디자인 시스템, Mock 인프라 |
| **2** | UI 셸 (Mock) | F001~F010 전체 | 모든 화면 워크스루 가능 |
| **3** | 인증 & DB | F008, F001, F002, F005, F009 | 실제 로그인, 여행/메모 CRUD |
| **4** | Drive & 사진 | F006, F003, F004, F010 | 사진 업로드/뷰어/삭제 실동작 |
| **5** | 장소 & 지도 | F001(검색), F007 | 카카오 API 검색, 지도 실연동 |
| **6** | 최적화 | - | 오프라인, 성능, 에러 처리 |
| **7** | 배포 | - | EAS 빌드 & 스토어 제출 |
