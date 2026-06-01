CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT DEFAULT 'clinician',
  facility    TEXT DEFAULT '',
  county      TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  avatar_url  TEXT,
  password_hash TEXT NOT NULL,
  preferences TEXT DEFAULT '{}',
  onboarded   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  used       INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step      INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  payload   TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  action     TEXT NOT NULL,
  resource   TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
