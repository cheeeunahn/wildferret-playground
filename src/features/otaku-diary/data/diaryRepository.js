// The only file that knows the diary lives on our server (worker/diary.js).
// Every method is one request and resolves to the whole diary,
// `{ profile, records }`. The visitor is recognised by an HttpOnly cookie
// the server sets, so there is no id to handle here.

import { normalizeReview } from '../domain/review';

const API = '/api/diary';
// Where the diary lived before the server: imported once, then set aside.
const LOCAL_KEY = 'otaku-diary:v1';
const IMPORTED_KEY = 'otaku-diary:v1:imported';

async function call(method, path = '', body) {
  let response;
  try {
    response = await fetch(API + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(data?.error || '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
  }
  return data;
}

// Requests go out one at a time, in the order they were made. A visitor gets
// their cookie on the first write; two first writes at once would create two
// diaries.
let queue = Promise.resolve();
function inOrder(task) {
  const result = queue.then(task);
  queue = result.catch(() => {});
  return result;
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const diary = raw && JSON.parse(raw);
    const hasContent = diary?.records?.length > 0 || diary?.profile?.onboarded || diary?.profile?.nickname;
    return hasContent ? { raw, diary } : null;
  } catch {
    return null;
  }
}

// A diary recorded in this browser before the server existed is sent up
// once. The server merges it without overwriting anything, and the local
// copy is kept under another key rather than deleted.
async function importLocal(local) {
  const diary = await call('POST', '/import', {
    profile: local.diary.profile ?? {},
    records: local.diary.records ?? [],
  });
  try {
    localStorage.setItem(IMPORTED_KEY, local.raw);
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    // Importing again later is harmless.
  }
  return diary;
}

export const diaryRepository = {
  load() {
    return inOrder(() => {
      const local = readLocal();
      return local ? importLocal(local) : call('GET');
    });
  },

  saveProfile(patch) {
    return inOrder(() => call('PATCH', '/profile', patch));
  },

  // Newest first. Adding a title twice keeps the first record. `review` is
  // `{ rating, comment }`; rejects if the rating is not 1–5.
  addRecord(anime, review) {
    return inOrder(() => call('POST', '/records', { anime, review: normalizeReview(review) }));
  },

  // Replaces the rating and comment of a title already recorded.
  saveReview(animeId, review) {
    return inOrder(() => call('PUT', `/records/${animeId}/review`, normalizeReview(review)));
  },

  reset() {
    return inOrder(() => call('DELETE'));
  },
};
