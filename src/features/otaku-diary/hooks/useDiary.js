import { useCallback, useEffect, useMemo, useState } from 'react';
import { diaryRepository } from '../data/diaryRepository';
import { depthOfRecords } from '../domain/depth';

// The diary as screens use it: profile, records, depth, and the ways to
// change them.
export function useDiary() {
  const [diary, setDiary] = useState(null);

  useEffect(() => {
    let alive = true;
    diaryRepository.load().then((loaded) => alive && setDiary(loaded));
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = useCallback(
    async (patch) => setDiary(await diaryRepository.saveProfile(patch)),
    [],
  );
  const addAnime = useCallback(
    async (anime) => setDiary(await diaryRepository.addRecord(anime)),
    [],
  );
  const reset = useCallback(
    async () => setDiary(await diaryRepository.reset()),
    [],
  );

  const records = diary?.records;
  const depth = useMemo(() => depthOfRecords(records ?? []), [records]);

  return {
    loading: diary === null,
    profile: diary?.profile ?? { nickname: '', onboarded: false },
    records: records ?? [],
    depth,
    saveProfile,
    addAnime,
    reset,
  };
}
