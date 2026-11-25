// The only file that knows the diary lives in localStorage. Every method is
// async so a server-backed version can replace it without touching callers:
// each one maps to a single request and resolves to the whole diary.

import { normalizeReview } from '../domain/review';

const KEY = 'otaku-diary:v1';
const EMPTY = { profile: { nickname: '', onboarded: false }, records: [] };

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return stored ? { ...EMPTY, ...stored } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(diary) {
  try {
    localStorage.setItem(KEY, JSON.stringify(diary));
  } catch {
    // Private windows may refuse storage; the session still works in memory.
  }
  return diary;
}

export const diaryRepository = {
  async load() {
    return read();
  },

  async saveProfile(patch) {
    const diary = read();
    return write({ ...diary, profile: { ...diary.profile, ...patch } });
  },

  // Newest first. Adding a title twice keeps the first record. `review` is
  // `{ rating, comment }`; rejects if the rating is not 1–5.
  async addRecord(anime, review) {
    const fields = normalizeReview(review);
    const diary = read();
    if (diary.records.some((r) => r.id === anime.id)) return diary;
    const record = { ...anime, ...fields, recordedAt: new Date().toISOString() };
    return write({ ...diary, records: [record, ...diary.records] });
  },

  // Replaces the rating and comment of a title already recorded.
  async saveReview(animeId, review) {
    const fields = normalizeReview(review);
    const diary = read();
    const records = diary.records.map((r) => (r.id === animeId ? { ...r, ...fields } : r));
    return write({ ...diary, records });
  },

  async reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing stored, nothing to clear.
    }
    return EMPTY;
  },
};
