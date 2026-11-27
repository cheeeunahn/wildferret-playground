import { useEffect, useMemo, useState } from 'react';
import { animeRepository } from '../data/animeRepository';

const NONE = {};

// Genre and studio for every record, for the bookshelf's filters.
// status: loading | ready | error. On an error `facets` stays empty and the
// filters that need it are simply not offered.
export function useAnimeFacets(records) {
  // Only the set of ids matters: re-rating a title must not refetch.
  const key = useMemo(
    () =>
      records
        .map((record) => record.id)
        .sort((a, b) => a - b)
        .join(','),
    [records],
  );
  const [state, setState] = useState({ key: null, status: 'loading', facets: NONE });

  useEffect(() => {
    if (!key) return undefined;
    const controller = new AbortController();
    animeRepository
      .getFacets(key.split(',').map(Number), { signal: controller.signal })
      .then((facets) => setState({ key, status: 'ready', facets }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ key, status: 'error', facets: NONE });
      });
    return () => controller.abort();
  }, [key]);

  if (!key) return { status: 'ready', facets: NONE };
  // While a newly added title loads, keep filtering with what is known.
  if (state.key !== key) return { status: 'loading', facets: state.facets };
  return state;
}
