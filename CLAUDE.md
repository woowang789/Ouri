# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Ouri(우리) - 여행/데이트 사진을 Google Drive에 저장하여 데이터 주권을 보장하는 여행 기록 앱. MVP 개발 단계.

## 기술 스택

- **프레임워크**: Expo v54 + React Native 0.81 (New Architecture 활성화)
- **언어**: TypeScript 5.9
- **라우팅**: Expo Router v6 (파일 기반, `app/` 디렉터리)
- **백엔드**: Supabase (Auth, PostgreSQL + RLS)
- **스토리지**: Google Drive API v3 (사진), expo-sqlite (오프라인 캐시)
- **인증**: Google Sign-In → Supabase Auth (Drive scope 동시 요청)
- **지도/장소**: react-native-maps, 카카오 로컬 API

## 개발 명령어

```bash
npm start          # Expo 개발 서버
npm run ios        # iOS 시뮬레이터 실행
npm run android    # Android 에뮬레이터 실행
npm run web        # 웹 브라우저 실행
npm run lint       # ESLint 실행
```

## 환경 변수

`.env` 파일 필요 (`.env.example` 참고):
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase 공개 API 키

## 아키텍처

### 디렉터리 구조 (두 계층 분리)
- **`app/`** - Expo Router 라우팅 전용 (화면 진입점과 레이아웃만 배치)
- **`src/`** - 앱 소스 코드 (비즈니스 로직, 컴포넌트, 서비스 등)
- 경로 별칭: `@/*` → `src/*`

### 라우팅 구조 (`app/`)
- `app/_layout.tsx` - RootLayout: 인증 상태에 따른 2단계 라우팅 분기 (비로그인 → auth, 로그인 → tabs)
- `app/(auth)/` - 비로그인 사용자 (Google 로그인)
- `app/(tabs)/` - 메인 탭 (홈 타임라인, 지도, 마이페이지)
- `app/trip/` - 여행 스택 (생성, 상세, 사진 뷰어)

### 소스 구조 (`src/`)
- `src/components/` - 도메인별 UI 컴포넌트 (`ui/`, `trip/`, `photo/`, `memo/`, `map/`, `auth/`)
- `src/services/` - 외부 API 호출 계층 (Supabase, Drive, 카카오 등)
- `src/hooks/` - 커스텀 훅 (useAuth, useTrips, usePhotos 등)
- `src/stores/` - 전역 상태 관리 (authStore — 인증 + Drive 연동 상태 통합)
- `src/types/` - TypeScript 타입 정의 (PRD 데이터 모델 기반)
- `src/constants/` - 테마, 설정값
- `src/utils/` - 유틸리티 (날짜, 좌표, 쓰로틀링)
- `src/mocks/` - Mock 데이터 (UI 개발 단계용, 추후 제거)

### 데이터 흐름
- **사진**: 디바이스 갤러리 → EXIF 메타데이터 추출 → Google Drive 업로드 (Resumable) → Supabase에 메타데이터 저장
- **인증 토큰**: OAuth refresh token은 `expo-secure-store`에만 저장 (서버 저장 금지)
- **오프라인**: expo-sqlite로 여행 목록/메모 캐시, expo-file-system으로 썸네일 캐시

## 코드 규칙

- 응답/주석/커밋 메시지/문서: **한국어**
- 변수명/함수명: **영어**

## 주요 기술 제약사항

- Google Drive API: 사용자당 60초/2,400건, 일 750GB 업로드 제한
- 카카오 로컬 API: 장소 검색 디바운스 300ms, 월 300만건 무료
- 역지오코딩 쓰로틀링: 500ms 간격, 동일 좌표 근접(100m) 캐싱
- `@robinbobin/react-native-google-drive-api-wrapper` v2.2.6의 Expo v54 + New Architecture 호환성 PoC 필요
