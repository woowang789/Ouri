-- ==============================================
-- Ouri 초기 스키마 마이그레이션
-- Supabase Dashboard SQL Editor에서 실행
-- ==============================================

-- ============ 테이블 생성 ============

-- users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  google_drive_connected boolean not null default false,
  google_drive_folder_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  location_name text not null,
  location_lat double precision not null,
  location_lng double precision not null,
  cover_photo_id uuid,  -- FK는 photos 생성 후 추가
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- photos
create table photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  drive_file_id text not null,
  drive_thumbnail_link text not null,
  taken_at timestamptz not null,
  taken_lat double precision,
  taken_lng double precision,
  taken_location_name text,
  uploaded_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trips.cover_photo_id FK 추가 (SET NULL: 사진 삭제 시 대표사진만 해제)
alter table trips
  add constraint trips_cover_photo_id_fkey
  foreign key (cover_photo_id) references photos(id) on delete set null;

-- memos (사진 단위 메모)
create table memos (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  content text not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ RLS 정책 ============

-- 모든 테이블 RLS 활성화
alter table users enable row level security;
alter table trips enable row level security;
alter table photos enable row level security;
alter table memos enable row level security;

-- users: 본인 데이터만 접근
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- trips: 본인 여행만 접근
create policy "trips_select_own" on trips for select using (auth.uid() = user_id);
create policy "trips_insert_own" on trips for insert with check (auth.uid() = user_id);
create policy "trips_update_own" on trips for update using (auth.uid() = user_id);
create policy "trips_delete_own" on trips for delete using (auth.uid() = user_id);

-- photos: 본인 여행의 사진만 접근 (trip 소유자 확인)
create policy "photos_select_own" on photos for select
  using (exists (select 1 from trips where trips.id = photos.trip_id and trips.user_id = auth.uid()));
create policy "photos_insert_own" on photos for insert
  with check (auth.uid() = uploaded_by);
create policy "photos_delete_own" on photos for delete
  using (exists (select 1 from trips where trips.id = photos.trip_id and trips.user_id = auth.uid()));

-- memos: 본인 사진의 메모만 접근 (photo → trip 소유자 확인)
create policy "memos_select_own" on memos for select
  using (exists (
    select 1 from photos
    join trips on trips.id = photos.trip_id
    where photos.id = memos.photo_id and trips.user_id = auth.uid()
  ));
create policy "memos_insert_own" on memos for insert
  with check (auth.uid() = created_by);
create policy "memos_delete_own" on memos for delete
  using (exists (
    select 1 from photos
    join trips on trips.id = photos.trip_id
    where photos.id = memos.photo_id and trips.user_id = auth.uid()
  ));

-- ============ updated_at 자동 갱신 트리거 ============

-- moddatetime 확장 활성화
create extension if not exists moddatetime schema extensions;

-- 각 테이블에 트리거 적용
create trigger handle_updated_at before update on users
  for each row execute procedure moddatetime(updated_at);
create trigger handle_updated_at before update on trips
  for each row execute procedure moddatetime(updated_at);
create trigger handle_updated_at before update on photos
  for each row execute procedure moddatetime(updated_at);
create trigger handle_updated_at before update on memos
  for each row execute procedure moddatetime(updated_at);
