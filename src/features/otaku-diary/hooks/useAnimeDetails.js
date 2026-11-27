import { useCallback, useEffect, useState } from 'react';
import { animeRepository } from '../data/animeRepository';

// Loads the details of one anime. status: loading | ready | error.
// `retry` tries again after an error.
export function useAnimeDetails(id) {
  const [state, setState] = useState({ id: null, status: 'loading', details: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    animeRepository
      .getDetails(id, { signal: controller.signal })
      .then((details) => setState({ id, status: 'ready', details }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ id, status: 'error', details: null });
      });
    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => {
    setState({ id: null, status: 'loading', details: null });
    setAttempt((n) => n + 1);
  }, []);

  // A result for another id is stale.
  if (state.id !== id) return { status: 'loading', details: null, retry };
  return { ...state, retry };
}
