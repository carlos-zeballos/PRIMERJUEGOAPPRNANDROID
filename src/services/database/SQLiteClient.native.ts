import * as SQLite from 'expo-sqlite';
import { DatabaseClient } from './SQLiteClient';

let _db: SQLite.SQLiteDatabase | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await runMigrationV1(db);
  await runMigrationV2(db);
}

async function runMigrationV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id          TEXT PRIMARY KEY,
      text        TEXT NOT NULL UNIQUE,
      difficulty  TEXT NOT NULL CHECK(difficulty IN ('EASY', 'MEDIUM', 'HARD', 'INFERNAL')),
      category    TEXT,
      language    TEXT NOT NULL DEFAULT 'es',
      pack_id     TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  INTEGER NOT NULL,
      synced_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id              TEXT PRIMARY KEY,
      config_json     TEXT NOT NULL,
      board_json      TEXT NOT NULL,
      turns_json      TEXT NOT NULL,
      active_team     TEXT NOT NULL,
      phase           TEXT NOT NULL,
      result          TEXT NOT NULL,
      blue_score      INTEGER NOT NULL DEFAULT 0,
      red_score       INTEGER NOT NULL DEFAULT 0,
      blue_total      INTEGER NOT NULL,
      red_total       INTEGER NOT NULL,
      started_at      INTEGER NOT NULL,
      ended_at        INTEGER,
      synced_at       INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
    CREATE INDEX IF NOT EXISTS idx_words_language ON words(language);
    CREATE INDEX IF NOT EXISTS idx_words_active ON words(is_active);
    CREATE INDEX IF NOT EXISTS idx_sessions_ended ON game_sessions(ended_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_synced ON game_sessions(synced_at);
  `);
}

async function runMigrationV2(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- Sesión activa del modo solitario (una por usuario)
    CREATE TABLE IF NOT EXISTS solo_active_session (
      session_id    TEXT PRIMARY KEY,
      uid           TEXT NOT NULL,
      payload_json  TEXT NOT NULL,
      version       INTEGER NOT NULL DEFAULT 1,
      updated_at    INTEGER NOT NULL,
      sync_status   TEXT NOT NULL DEFAULT 'local_only'
    );

    -- Historial de partidas solitario completadas
    CREATE TABLE IF NOT EXISTS solo_matches (
      match_id         TEXT PRIMARY KEY,
      uid              TEXT NOT NULL,
      payload_json     TEXT NOT NULL,
      difficulty       TEXT NOT NULL,
      team             TEXT NOT NULL,
      status           TEXT NOT NULL,
      final_score      INTEGER NOT NULL DEFAULT 0,
      created_at       INTEGER NOT NULL,
      sync_status      TEXT NOT NULL DEFAULT 'pending',
      retry_count      INTEGER NOT NULL DEFAULT 0,
      last_sync_error  TEXT
    );

    -- Cache de estadísticas agregadas (evita recalcular todo el historial)
    CREATE TABLE IF NOT EXISTS solo_stats_cache (
      uid          TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at   INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_solo_matches_uid         ON solo_matches(uid);
    CREATE INDEX IF NOT EXISTS idx_solo_matches_sync        ON solo_matches(sync_status);
    CREATE INDEX IF NOT EXISTS idx_solo_matches_created     ON solo_matches(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_solo_active_uid          ON solo_active_session(uid);
  `);
}

export async function getDatabase(): Promise<DatabaseClient> {
  if (_db) {
    return wrapDb(_db);
  }
  _db = await SQLite.openDatabaseAsync('susurros.db');
  await runMigrations(_db);
  return wrapDb(_db);
}

function wrapDb(db: SQLite.SQLiteDatabase): DatabaseClient {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params = []) => { await db.runAsync(sql, params as never[]); },
    getAllAsync: <T>(sql: string, params: (string | number | null)[] = []) =>
      db.getAllAsync<T>(sql, params as never[]),
    getFirstAsync: <T>(sql: string, params: (string | number | null)[] = []) =>
      db.getFirstAsync<T>(sql, params as never[]),
    withTransactionAsync: (fn) => db.withTransactionAsync(fn),
  };
}
