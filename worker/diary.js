// /api/diary: one visitor's profile and recorded anime. Every route answers
// with the whole diary, `{ profile, records, auth }`, newest record first.
// `auth.loginId` is the account the diary belongs to, or null for a visitor
// who has not signed up (see auth.js).
//
//   GET    /api/diary                         read
//   PATCH  /api/diary/profile                 { nickname?, onboarded?, visitedRoom? }
//   POST   /api/diary/records                 { anime, review }
//   PUT    /api/diary/records/:animeId/review { rating, comment }
//   DELETE /api/diary/records                 { animeIds: [1, 2] }
//   POST   /api/diary/import                  { profile, records } from localStorage
//
// A visitor gets a user row and a session cookie on their first write, not
// on a read, so crawlers and passers-by leave nothing behind.

import { countsForDepth } from '../src/features/otaku-diary/domain/depth.js';
import { normalizeReview } from '../src/features/otaku-diary/domain/review.js';
import { loginIdOf } from './auth.js';
import { HttpError, assertSameOrigin, json, readJson } from './http.js';
import { newSession, readSession } from './session.js';

const MAX_NICKNAME_LENGTH = 12;
const MAX_TITLE_LENGTH = 300;
const MAX_RECORDS = 2000;
const IMPORT_CHUNK = 50;
// D1 allows 100 bound values in a statement.
const REMOVE_CHUNK = 90;
const FORMATS = new Set(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);

const EMPTY = { profile: { nickname: '', onboarded: false, visitedRoom: false }, records: [] };

// ---- reading ----

function toRecord(row) {
  return {
    id: row.anime_id,
    title: row.title,
    nativeTitle: row.native_title,
    year: row.year,
    format: row.format,
    cover: row.cover,
    color: row.color,
    countsForDepth: countsForDepth(row.format),
    rating: row.rating,
    comment: row.comment,
    recordedAt: row.recorded_at,
  };
}

async function readDiary(db, userId) {
  if (!userId) return EMPTY;
  const [user, records] = await db.batch([
    db.prepare('SELECT nickname, onboarded, visited_room FROM users WHERE id = ?').bind(userId),
    db
      .prepare('SELECT * FROM records WHERE user_id = ? ORDER BY recorded_at DESC, rowid DESC')
      .bind(userId),
  ]);
  const profile = user.results[0];
  if (!profile) return EMPTY;
  return {
    profile: {
      nickname: profile.nickname,
      onboarded: Boolean(profile.onboarded),
      visitedRoom: Boolean(profile.visited_room),
    },
    records: records.results.map(toRecord),
  };
}

// ---- validating what the browser sends ----

function text(value, max) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

// Covers are only ever AniList's own images.
function coverUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.anilist.co') ? url.href : null;
  } catch {
    return null;
  }
}

function parseAnime(anime) {
  const title = text(anime?.title, MAX_TITLE_LENGTH);
  if (!Number.isInteger(anime?.id) || anime.id <= 0 || !title) {
    throw new HttpError(400, '작품 정보가 올바르지 않아요.');
  }
  return {
    id: anime.id,
    title,
    nativeTitle: text(anime.nativeTitle, MAX_TITLE_LENGTH),
    year: Number.isInteger(anime.year) && anime.year > 1900 && anime.year < 2200 ? anime.year : null,
    format: FORMATS.has(anime.format) ? anime.format : null,
    cover: coverUrl(anime.cover),
    color: /^#[0-9a-f]{6}$/i.test(anime.color ?? '') ? anime.color : null,
  };
}

function parseReview(review) {
  try {
    return normalizeReview({ rating: review?.rating, comment: String(review?.comment ?? '') });
  } catch (error) {
    throw new HttpError(400, error.message);
  }
}

function parseProfile(patch) {
  const fields = {};
  if (typeof patch.nickname === 'string') fields.nickname = patch.nickname.trim().slice(0, MAX_NICKNAME_LENGTH);
  if (typeof patch.onboarded === 'boolean') fields.onboarded = Number(patch.onboarded);
  if (typeof patch.visitedRoom === 'boolean') fields.visited_room = Number(patch.visitedRoom);
  return fields;
}

function insertRecord(db, userId, anime, review, recordedAt) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO records
         (user_id, anime_id, title, native_title, year, format, cover, color, rating, comment, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      userId,
      anime.id,
      anime.title,
      anime.nativeTitle,
      anime.year,
      anime.format,
      anime.cover,
      anime.color,
      review.rating,
      review.comment,
      recordedAt,
    );
}

function updateProfile(db, userId, fields) {
  const columns = Object.keys(fields);
  return db
    .prepare(`UPDATE users SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
    .bind(...columns.map((c) => fields[c]), userId);
}

// ---- routes ----

async function saveProfile(db, userId, body) {
  const fields = parseProfile(body);
  if (Object.keys(fields).length > 0) await updateProfile(db, userId, fields).run();
}

async function addRecord(db, userId, body) {
  const anime = parseAnime(body.anime);
  const review = parseReview(body.review);
  const { n } = await db.prepare('SELECT COUNT(*) AS n FROM records WHERE user_id = ?').bind(userId).first();
  if (n >= MAX_RECORDS) throw new HttpError(409, `기록은 ${MAX_RECORDS}편까지 남길 수 있어요.`);
  await insertRecord(db, userId, anime, review, new Date().toISOString()).run();
}

async function saveReview(db, userId, animeId, body) {
  const review = parseReview(body);
  const result = await db
    .prepare('UPDATE records SET rating = ?, comment = ? WHERE user_id = ? AND anime_id = ?')
    .bind(review.rating, review.comment, userId, animeId)
    .run();
  if (result.meta.changes === 0) throw new HttpError(404, '기록을 찾지 못했어요.');
}

function parseAnimeIds(body) {
  const ids = body.animeIds;
  const valid =
    Array.isArray(ids) &&
    ids.length > 0 &&
    ids.length <= MAX_RECORDS &&
    ids.every((id) => Number.isInteger(id) && id > 0 && id < 1e9);
  if (!valid) throw new HttpError(400, '지울 기록이 올바르지 않아요.');
  return [...new Set(ids)];
}

// Removing a record that is already gone is not an error: the diary the
// answer carries is what the user asked for either way. All of them go in
// one transaction, so a failure does not leave half the selection behind.
async function removeRecords(db, userId, animeIds) {
  const statements = [];
  for (let i = 0; i < animeIds.length; i += REMOVE_CHUNK) {
    const chunk = animeIds.slice(i, i + REMOVE_CHUNK);
    statements.push(
      db
        .prepare(`DELETE FROM records WHERE user_id = ? AND anime_id IN (${chunk.map(() => '?').join(', ')})`)
        .bind(userId, ...chunk),
    );
  }
  await db.batch(statements);
}

// Brings over a diary kept in localStorage. Records already on the server
// win, and the profile is only taken while the server one is still blank, so
// sending the same diary twice changes nothing.
async function importDiary(db, userId, body) {
  const incoming = Array.isArray(body.records) ? body.records.slice(0, MAX_RECORDS) : [];
  const statements = [];
  for (const record of incoming) {
    let anime;
    try {
      anime = parseAnime(record);
    } catch {
      continue; // One unreadable record does not block the rest.
    }
    // Old records may have no rating yet.
    let review = { rating: null, comment: '' };
    try {
      review = normalizeReview({ rating: record.rating, comment: String(record.comment ?? '') });
    } catch {
      // Stays unrated.
    }
    const at = Date.parse(record.recordedAt);
    const recordedAt = new Date(Number.isNaN(at) ? Date.now() : Math.min(at, Date.now())).toISOString();
    statements.push(insertRecord(db, userId, anime, review, recordedAt));
  }
  for (let i = 0; i < statements.length; i += IMPORT_CHUNK) {
    await db.batch(statements.slice(i, i + IMPORT_CHUNK));
  }

  const fields = parseProfile(body.profile ?? {});
  if (Object.keys(fields).length > 0) {
    const current = await db.prepare('SELECT nickname, onboarded FROM users WHERE id = ?').bind(userId).first();
    if (current && !current.onboarded && !current.nickname) await updateProfile(db, userId, fields).run();
  }
}

function route(method, path) {
  if (path === '' && method === 'GET') return { name: 'read' };
  if (path === '/profile' && method === 'PATCH') return { name: 'profile' };
  if (path === '/records' && method === 'POST') return { name: 'add' };
  if (path === '/import' && method === 'POST') return { name: 'import' };
  const review = /^\/records\/(\d{1,9})\/review$/.exec(path);
  if (review && method === 'PUT') return { name: 'review', animeId: Number(review[1]) };
  if (path === '/records' && method === 'DELETE') return { name: 'remove' };
  return null;
}

export async function handleDiary(request, env, url) {
  const db = env.DB;
  const matched = route(request.method, url.pathname.slice('/api/diary'.length).replace(/\/$/, ''));
  if (!matched) throw new HttpError(404, '없는 주소예요.');

  const session = await readSession(request, url, db);
  let userId = session?.userId ?? null;
  let cookie = session?.cookie ?? null;

  const respond = async () =>
    json({ ...(await readDiary(db, userId)), auth: { loginId: await loginIdOf(env, userId) } }, { cookie });

  if (matched.name === 'read') return respond();

  assertSameOrigin(request, url);
  // Parse before creating anyone, so a malformed request leaves no user row.
  const body = await readJson(request);
  // Parsed first, for the same reason. A visitor who has recorded nothing
  // has nothing to remove, and gets no user row for asking.
  const removing = matched.name === 'remove' ? parseAnimeIds(body) : null;
  if (removing && !userId) return respond();
  if (!userId) {
    userId = crypto.randomUUID();
    const created = await newSession(url, db, userId);
    await db.batch([
      db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').bind(userId, new Date().toISOString()),
      created.statement,
    ]);
    cookie = created.cookie;
  }

  if (matched.name === 'profile') await saveProfile(db, userId, body);
  if (matched.name === 'add') await addRecord(db, userId, body);
  if (matched.name === 'review') await saveReview(db, userId, matched.animeId, body);
  if (removing) await removeRecords(db, userId, removing);
  if (matched.name === 'import') await importDiary(db, userId, body);
  return respond();
}
