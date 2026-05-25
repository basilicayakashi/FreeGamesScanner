import Database from "better-sqlite3";

import dotenv from "dotenv";
dotenv.config();

//export const db = new Database("database.sqlite");
export const db = new Database(process.env.SHARED_DB_PATH!);

db.exec(`
CREATE TABLE IF NOT EXISTS free_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_code TEXT NOT NULL,
    title TEXT NOT NULL,
    promo_url TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    promo_type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider_code, promo_url, promo_type)
);
`);

export const getAllFreeGamesStmt = db.prepare(`
  SELECT *
  FROM free_games
`);

export const getFreeGameStmt = db.prepare(`
  SELECT *
  FROM free_games
  WHERE provider_code = ?
    AND promo_url = ?
    AND promo_type = ?
`);

export const insertFreeGameStmt = db.prepare(`
  INSERT INTO free_games (
    provider_code,
    title,
    promo_url,
    expires_at,
    promo_type
  )
  VALUES (?, ?, ?, ?, ?)
`);

export const updateFreeGameStmt = db.prepare(`
  UPDATE free_games
  SET
    title = ?,
    expires_at = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE provider_code = ?
    AND promo_url = ?
    AND promo_type = ?
`);

export const deleteExpiredFreeGamesStmt = db.prepare(`
  DELETE FROM free_games
  WHERE expires_at < ?
`);