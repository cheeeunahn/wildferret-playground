// Narrowing the bookshelf. Pure: no React, no browser APIs.
//
// A filter is `{ rating, genre, studio, format }`, each empty ('' or 0) when
// not in use; a record must pass every one that is set. `facets` maps an
// anime id to `{ genres, studio }` from AniList, and may be missing ids that
// have not loaded: those records simply have no genre or studio yet.

import { formatLabel } from './format';

export const NO_FILTER = { rating: 0, genre: '', studio: '', format: '' };

export function isFiltering(filter) {
  return Boolean(filter.rating || filter.genre || filter.studio || filter.format);
}

export function applyFilter(records, facets, filter) {
  return records.filter((record) => {
    const facet = facets[record.id];
    if (filter.rating && record.rating !== filter.rating) return false;
    if (filter.format && record.format !== filter.format) return false;
    if (filter.genre && !facet?.genres.includes(filter.genre)) return false;
    if (filter.studio && facet?.studio !== filter.studio) return false;
    return true;
  });
}

// `[{ value, label, count }]`, most recorded first, then by name.
function tally(values, labelOf = (value) => value) {
  const counts = new Map();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, label: labelOf(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// The choices each dropdown offers: only what is on this bookshelf.
export function filterOptions(records, facets) {
  return {
    genres: tally(records.flatMap((record) => facets[record.id]?.genres ?? [])),
    studios: tally(records.map((record) => facets[record.id]?.studio)),
    formats: tally(
      records.map((record) => record.format),
      formatLabel,
    ),
  };
}
