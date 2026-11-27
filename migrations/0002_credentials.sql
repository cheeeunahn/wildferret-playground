-- Accounts with an ID and a password. A row here ties a login ID to a user;
-- a user without one is an anonymous visitor known only by their cookie.
--
-- The password itself is never stored: only a salted PBKDF2-SHA256 hash, with
-- the iteration count kept beside it so it can be raised later.
-- `failed_attempts` and `locked_until` slow down password guessing.
CREATE TABLE credentials (
  login_id        TEXT PRIMARY KEY, -- always lowercase
  user_id         TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash   TEXT NOT NULL,
  salt            TEXT NOT NULL,
  iterations      INTEGER NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TEXT,
  created_at      TEXT NOT NULL
);
