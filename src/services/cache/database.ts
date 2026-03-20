import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'ouri_cache.db';
const DB_VERSION = 1;

let db: SQLiteDatabase | null = null;

/**
 * SQLite 캐시 데이터베이스 인스턴스 반환
 * 최초 호출 시 DB 열기 + 스키마 초기화
 */
export function getDatabase(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync(DB_NAME);
    initializeSchema(db);
  }
  return db;
}

/**
 * 캐시 테이블 스키마 초기화
 * PRAGMA user_version으로 버전 관리하여 향후 마이그레이션 지원
 */
function initializeSchema(database: SQLiteDatabase): void {
  const currentVersion = database.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version'
  )?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS cached_trips (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location_name TEXT NOT NULL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        cover_photo_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cached_photos (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        drive_file_id TEXT NOT NULL,
        drive_thumbnail_link TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        taken_lat REAL,
        taken_lng REAL,
        taken_location_name TEXT,
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cached_memos (
        id TEXT PRIMARY KEY,
        photo_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pending_geocode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id TEXT UNIQUE NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cached_trips_user_id ON cached_trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_cached_photos_trip_id ON cached_photos(trip_id);
      CREATE INDEX IF NOT EXISTS idx_cached_memos_photo_id ON cached_memos(photo_id);
      CREATE INDEX IF NOT EXISTS idx_pending_geocode_status ON pending_geocode(status);

      PRAGMA user_version = ${DB_VERSION};
    `);
  }
}

/**
 * 캐시 DB 전체 초기화 (로그아웃 시 호출)
 */
export function clearAllCache(): void {
  const database = getDatabase();
  database.execSync(`
    DELETE FROM cached_trips;
    DELETE FROM cached_photos;
    DELETE FROM cached_memos;
    DELETE FROM pending_geocode;
  `);
}
