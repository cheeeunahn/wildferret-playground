-- The anime diary. A visitor is a row in `users`; how they prove who they are
-- lives in other tables, so a login provider can be added without touching
-- the diary itself.

CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  nickname     TEXT NOT NULL DEFAULT '',
  onboarded    INTEGER NOT NULL DEFAULT 0,
  visited_room INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

-- One row per signed-in browser. The cookie holds a random token; only its
-- SHA-256 hash is stored, so a copy of this table cannot be used to sign in.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_by_user ON sessions(user_id);

-- External logins (e.g. provider 'kakao'). Empty until a provider is added:
-- linking one is a single row pointing at the visitor's existing user.
CREATE TABLE identities (
  provider         TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX identities_by_user ON identities(user_id);

-- One row per recorded anime. The primary key makes "adding a title twice
-- keeps the first record" a database rule. `rating` is NULL for records
-- made before ratings existed.
CREATE TABLE records (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id     INTEGER NOT NULL,
  title        TEXT NOT NULL,
  native_title TEXT,
  year         INTEGER,
  format       TEXT,
  cover        TEXT,
  color        TEXT,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT NOT NULL DEFAULT '',
  recorded_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, anime_id)
);
CREATE INDEX records_by_user_time ON records(user_id, recorded_at DESC);
