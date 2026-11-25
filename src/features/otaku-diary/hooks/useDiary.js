import { useCallback, useEffect, useMemo, useState } from 'react';
import { diaryRepository } from '../data/diaryRepository';
import { depthOfRecords } from '../domain/depth';

const BLANK_PROFILE = { nickname: '', onboarded: false };

// The diary as screens use it: profile, records, depth, and the ways to
// change them. `error` is set when the diary could not be loaded; `reload`
// tries again. `loginId` is the account the diary belongs to, or null while
// the visitor has not signed up or logged in.
export function useDiary() {
  const [diary, setDiary] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    diaryRepository.load().then(
      (loaded) => alive && setDiary(loaded),
      (failure) => alive && setError(failure.message),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  // The profile changes on screen at once and is saved behind it, so a tap
  // never waits on the network. Only the profile is taken from the answer:
  // a slow save must not undo a record added meanwhile.
  const saveProfile = useCallback(async (patch) => {
    setDiary((d) => d && { ...d, profile: { ...d.profile, ...patch } });
    try {
      const saved = await diaryRepository.saveProfile(patch);
      setDiary((d) => d && { ...d, profile: saved.profile });
    } catch (failure) {
      // Stays as shown for this visit; the next load has the server's copy.
      console.warn('profile not saved:', failure.message);
    }
  }, []);
  const addAnime = useCallback(
    async (anime, review) => setDiary(await diaryRepository.addRecord(anime, review)),
    [],
  );
  const saveReview = useCallback(
    async (animeId, review) => setDiary(await diaryRepository.saveReview(animeId, review)),
    [],
  );
  const reset = useCallback(async () => {
    setDiary((d) => ({ ...d, profile: BLANK_PROFILE, records: [] }));
    try {
      setDiary(await diaryRepository.reset());
    } catch (failure) {
      console.warn('diary not reset:', failure.message);
    }
  }, []);

  // These reject with a message for the user when the server says no.
  const signup = useCallback(
    async (loginId, password) => setDiary(await diaryRepository.signup(loginId, password)),
    [],
  );
  const login = useCallback(
    async (loginId, password) => setDiary(await diaryRepository.login(loginId, password)),
    [],
  );
  const logout = useCallback(async () => setDiary(await diaryRepository.logout()), []);

  const records = diary?.records;
  const depth = useMemo(() => depthOfRecords(records ?? []), [records]);

  return {
    loading: diary === null,
    error,
    reload,
    profile: diary?.profile ?? BLANK_PROFILE,
    records: records ?? [],
    depth,
    loginId: diary?.auth?.loginId ?? null,
    signup,
    login,
    logout,
    saveProfile,
    addAnime,
    saveReview,
    reset,
  };
}
