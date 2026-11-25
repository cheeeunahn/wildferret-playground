// /api/auth: accounts with an ID and a password.
//
//   POST /api/auth/signup  { loginId, password }  make an account
//   POST /api/auth/login   { loginId, password }
//   POST /api/auth/logout
//
// Each answers `{ ok: true }` and sets or clears the session cookie; the page
// then reads /api/diary as usual.
//
// There is no email, so there is no "forgot my password": a lost password
// can only be reset by hand in the database.

import { HttpError, assertSameOrigin, json, readJson } from './http.js';
import { hashPassword, verifyPassword, wastePasswordCheck } from './password.js';
import { clearedCookie, newSession, readSession } from './session.js';

const LOGIN_ID = /^[a-z0-9_]{4,20}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
// After this many wrong passwords in a row an ID is locked for a while.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

// One message for "no such ID" and "wrong password", so neither is revealed.
const WRONG = '아이디 또는 비밀번호가 맞지 않아요.';

function parseCredentials(body, { checkRules }) {
  const loginId = typeof body.loginId === 'string' ? body.loginId.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!checkRules) {
    // Logging in: anything that could not be an account is simply wrong.
    if (!loginId || !password || password.length > MAX_PASSWORD_LENGTH) throw new HttpError(401, WRONG);
    return { loginId, password };
  }
  if (!LOGIN_ID.test(loginId)) {
    throw new HttpError(400, '아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자여야 해요.');
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new HttpError(400, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`);
  }
  if (password.toLowerCase() === loginId) throw new HttpError(400, '아이디와 같은 비밀번호는 쓸 수 없어요.');
  return { loginId, password };
}

function accountOf(db, userId) {
  return db.prepare('SELECT login_id FROM credentials WHERE user_id = ?').bind(userId).first();
}

// A new token on every signup and login, so one captured before is useless
// after. Runs `statements` and the session change as one batch.
async function startSession(db, url, session, userId, statements) {
  if (session) statements.push(db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash));
  const created = await newSession(url, db, userId);
  statements.push(created.statement);
  await db.batch(statements);
  return created.cookie;
}

// The diary already in this browser becomes the new account's diary; with no
// diary yet, an empty one is created.
async function signup(request, env, url) {
  const db = env.DB;
  const { loginId, password } = parseCredentials(await readJson(request), { checkRules: true });
  const session = await readSession(request, url, db);
  if (session && (await accountOf(db, session.userId))) throw new HttpError(409, '이미 로그인되어 있어요.');
  if (await db.prepare('SELECT 1 FROM credentials WHERE login_id = ?').bind(loginId).first()) {
    throw new HttpError(409, '이미 쓰고 있는 아이디예요.');
  }

  const now = new Date().toISOString();
  const { hash, salt, iterations } = await hashPassword(password);
  const statements = [];
  let userId = session?.userId;
  if (!userId) {
    userId = crypto.randomUUID();
    statements.push(db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').bind(userId, now));
  }
  statements.push(
    db
      .prepare(
        'INSERT INTO credentials (login_id, user_id, password_hash, salt, iterations, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(loginId, userId, hash, salt, iterations, now),
  );
  let cookie;
  try {
    cookie = await startSession(db, url, session, userId, statements);
  } catch (error) {
    // Someone took the ID between the check above and the insert.
    if (String(error?.message).includes('UNIQUE')) throw new HttpError(409, '이미 쓰고 있는 아이디예요.');
    throw error;
  }
  return json({ ok: true }, { status: 201, cookie });
}

// Opens the account's diary in this browser. An anonymous diary made here
// before logging in is folded into the account first: records the account
// already has are kept as they are, and its profile wins unless still blank.
// A browser logged in to another account just switches; nothing is merged.
async function login(request, env, url) {
  const db = env.DB;
  const { loginId, password } = parseCredentials(await readJson(request), { checkRules: false });
  const account = await db.prepare('SELECT * FROM credentials WHERE login_id = ?').bind(loginId).first();
  if (!account) {
    await wastePasswordCheck(password);
    throw new HttpError(401, WRONG);
  }
  const now = Date.now();
  if (account.locked_until && Date.parse(account.locked_until) > now) {
    throw new HttpError(429, '비밀번호를 여러 번 틀렸어요. 5분 뒤에 다시 시도해 주세요.');
  }

  const correct = await verifyPassword(password, {
    hash: account.password_hash,
    salt: account.salt,
    iterations: account.iterations,
  });
  if (!correct) {
    const failed = account.failed_attempts + 1;
    const lock = failed >= MAX_FAILED_ATTEMPTS;
    await db
      .prepare('UPDATE credentials SET failed_attempts = ?, locked_until = ? WHERE login_id = ?')
      .bind(lock ? 0 : failed, lock ? new Date(now + LOCK_MS).toISOString() : null, loginId)
      .run();
    throw new HttpError(401, WRONG);
  }

  const userId = account.user_id;
  const session = await readSession(request, url, db);
  const statements = [
    db.prepare('UPDATE credentials SET failed_attempts = 0, locked_until = NULL WHERE login_id = ?').bind(loginId),
  ];
  const current = session?.userId;
  if (current && current !== userId && !(await accountOf(db, current))) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO records
             (user_id, anime_id, title, native_title, year, format, cover, color, rating, comment, recorded_at)
           SELECT ?1, anime_id, title, native_title, year, format, cover, color, rating, comment, recorded_at
             FROM records WHERE user_id = ?2`,
        )
        .bind(userId, current),
      db
        .prepare(
          `UPDATE users SET (nickname, onboarded, visited_room) =
             (SELECT nickname, onboarded, visited_room FROM users WHERE id = ?2)
           WHERE id = ?1 AND onboarded = 0 AND nickname = ''`,
        )
        .bind(userId, current),
      // Takes its sessions and records with it.
      db.prepare('DELETE FROM users WHERE id = ?').bind(current),
    );
  }
  return json({ ok: true }, { cookie: await startSession(db, url, session, userId, statements) });
}

// The browser is left with no session, so a blank diary. The account's diary
// stays on the server for the next login.
async function logout(request, env, url) {
  const session = await readSession(request, url, env.DB);
  if (session) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
  return json({ ok: true }, { cookie: clearedCookie(url) });
}

export async function handleAuth(request, env, url) {
  const path = url.pathname.slice('/api/auth'.length);
  const handler = { '/signup': signup, '/login': login, '/logout': logout }[path];
  if (!handler || request.method !== 'POST') throw new HttpError(404, '없는 주소예요.');
  assertSameOrigin(request, url);
  return handler(request, env, url);
}

// The ID this diary's owner logs in with, or null for an anonymous visitor.
export async function loginIdOf(env, userId) {
  if (!userId) return null;
  return (await accountOf(env.DB, userId))?.login_id ?? null;
}
