// The only file that knows the diary lives on our server (worker/diary.js).
// Every diary method is one request and resolves to the whole diary,
// `{ profile, records, auth }`. The visitor is recognised by an HttpOnly
// cookie the server sets, so there is no id to handle here. Signing up or
// logging in (worker/auth.js) ties that diary to an account.

import { normalizeReview } from '../domain/review';

const API = '/api/diary';
const AUTH_API = '/api/auth';
// Where the diary lived before the server: imported once, then set aside.
const LOCAL_KEY = 'otaku-diary:v1';
const IMPORTED_KEY = 'otaku-diary:v1:imported';

async function call(method, path = '', body, base = API) {
  let response;
  try {
    response = await fetch(base + path, {
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

  // The account calls below change who the browser is, then resolve to the
  // diary it now has.

  // Makes an account out of the diary already in this browser.
  // `ageConfirmed` is the "14 or over" box; the server refuses without it.
  signup(loginId, password, ageConfirmed) {
    return inOrder(async () => {
      await call('POST', '/signup', { loginId, password, ageConfirmed }, AUTH_API);
      return call('GET');
    });
  },

  // Opens the account's diary. Anything recorded here before logging in is
  // merged into it by the server.
  login(loginId, password) {
    return inOrder(async () => {
      await call('POST', '/login', { loginId, password }, AUTH_API);
      return call('GET');
    });
  },

  // Deletes the account and everything recorded under it, on every device.
  // The password is asked again; rejects if it is wrong.
  deleteAccount(password) {
    return inOrder(async () => {
      await call('POST', '/delete', { password }, AUTH_API);
      return call('GET');
    });
  },

  // Leaves a blank diary here; the account's diary stays on the server.
  logout() {
    return inOrder(async () => {
      await call('POST', '/logout', undefined, AUTH_API);
      return call('GET');
    });
  },
};
