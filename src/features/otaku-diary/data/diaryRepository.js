// The only file that knows the diary lives in localStorage. Every method is
// async so a server-backed version can replace it without touching callers.

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

  // Newest first. Adding a title twice keeps the first record.
  async addRecord(anime) {
    const diary = read();
    if (diary.records.some((r) => r.id === anime.id)) return diary;
    const record = { ...anime, recordedAt: new Date().toISOString() };
    return write({ ...diary, records: [record, ...diary.records] });
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
