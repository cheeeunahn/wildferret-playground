// Who is asking. A visitor is recognised by a random token in an HttpOnly
// cookie, which page scripts cannot read; the database keeps only its hash.
// Nothing here knows how the session came to exist, so a login provider can
// create sessions for an existing user later.

const COOKIE = 'diary_session';
const DAY_MS = 24 * 60 * 60 * 1000;
const TTL_DAYS = 365;
// A session used in its last half is pushed out again, so a regular visitor
// never loses their diary to an expiry date.
const RENEW_BELOW_DAYS = 180;

function readCookie(request) {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const at = part.indexOf('=');
    if (at !== -1 && part.slice(0, at).trim() === COOKIE) return part.slice(at + 1).trim();
  }
  return null;
}

function cookieFor(token, url, maxAgeDays = TTL_DAYS) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/api; Max-Age=${maxAgeDays * 86400}; HttpOnly; SameSite=Lax${secure}`;
}

async function hashOf(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Resolves to `{ userId, cookie }` for a valid session, where `cookie` is a
// Set-Cookie value when the session was renewed; otherwise null.
export async function readSession(request, url, db) {
  const token = readCookie(request);
  if (!token) return null;
  const tokenHash = await hashOf(token);
  const row = await db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .bind(tokenHash)
    .first();
  const now = Date.now();
  if (!row || Date.parse(row.expires_at) <= now) return null;

  let cookie = null;
  if (Date.parse(row.expires_at) - now < RENEW_BELOW_DAYS * DAY_MS) {
    await db
      .prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?')
      .bind(new Date(now + TTL_DAYS * DAY_MS).toISOString(), tokenHash)
      .run();
    cookie = cookieFor(token, url);
  }
  return { userId: row.user_id, cookie };
}

// The statement that stores a new session for `userId`, plus its cookie.
// The caller runs the statement, usually in a batch with creating the user.
export async function newSession(url, db, userId) {
  const token = newToken();
  const now = Date.now();
  const statement = db
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await hashOf(token), userId, new Date(now).toISOString(), new Date(now + TTL_DAYS * DAY_MS).toISOString());
  return { statement, cookie: cookieFor(token, url) };
}
