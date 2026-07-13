import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from '../config/env'

// SQLite 持久化（P4 服务端库）。生产环境用 DB_PATH 指向持久盘（如 Render disk /data/app.db）。
let _db: Database.Database | null = null

export function db(): Database.Database {
  if (!_db) {
    mkdirSync(dirname(env.DB_PATH), { recursive: true })
    _db = new Database(env.DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY,
        plan TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL
      );
    `)
  }
  return _db
}
