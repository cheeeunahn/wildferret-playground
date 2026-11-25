import { useEffect, useState } from 'react';
import { animeRepository } from '../data/animeRepository';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 400;

// Searches once the user pauses typing. status: idle | loading | ready | error
export function useAnimeSearch(query) {
  const term = query.trim();
  const [state, setState] = useState({ term: '', status: 'idle', results: [], error: null });

  useEffect(() => {
    if (term.length < MIN_LENGTH) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      animeRepository
        .search(term, { signal: controller.signal })
        .then((results) => setState({ term, status: 'ready', results, error: null }))
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setState({ term, status: 'error', results: [], error: error.message });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  if (term.length < MIN_LENGTH) return { status: 'idle', results: [], error: null };
  // Results for an older term are stale: show loading until the new ones land.
  if (state.term !== term) return { status: 'loading', results: [], error: null };
  return state;
}
