// Narrowing the bookshelf. Pure: no React, no browser APIs.
//
// A filter holds, for each kind, the values picked: `{ ratings, genres,
// studios, formats }`, each a list, empty when that kind is not in use. A
// record must match one of the picked values of every kind in use: "액션 or
// 드라마, and 5 stars". `facets` maps an anime id to `{ genres, studio, title }`
// from AniList, and may be missing ids that have not loaded: those records
// simply have no genre or studio yet.

import { formatLabel, genreLabel } from './format';
import { MAX_RATING } from './review';

export const FILTER_KINDS = ['ratings', 'genres', 'studios', 'formats'];
export const NO_FILTER = { ratings: [], genres: [], studios: [], formats: [] };

// How many values are picked across every kind.
export function filterCount(filter) {
  return FILTER_KINDS.reduce((sum, kind) => sum + filter[kind].length, 0);
}

export function isFiltering(filter) {
  return filterCount(filter) > 0;
}

// Picks `value` of `kind`, or unpicks it if it was picked.
export function toggleFilter(filter, kind, value) {
  const picked = filter[kind];
  return {
    ...filter,
    [kind]: picked.includes(value) ? picked.filter((v) => v !== value) : [...picked, value],
  };
}

export function applyFilter(records, facets, filter) {
  return records.filter((record) => {
    const facet = facets[record.id];
    if (filter.ratings.length && !filter.ratings.includes(record.rating)) return false;
    if (filter.formats.length && !filter.formats.includes(record.format)) return false;
    if (filter.genres.length && !filter.genres.some((genre) => facet?.genres.includes(genre))) {
      return false;
    }
    if (filter.studios.length && !filter.studios.includes(facet?.studio)) return false;
    return true;
  });
}

// What a picked value is called, for the chips above the list.
function labelOf(kind, value, language) {
  if (kind === 'ratings') return `별점 ${value}점`;
  if (kind === 'genres') return genreLabel(value, language);
  if (kind === 'formats') return formatLabel(value);
  return value;
}

// Every picked value as `{ kind, value, label }`, in the order the filter
// sheet lists the kinds.
export function appliedFilters(filter, language = 'ko') {
  return FILTER_KINDS.flatMap((kind) =>
    filter[kind].map((value) => ({ kind, value, label: labelOf(kind, value, language) })),
  );
}

// `[{ value, label, count }]`, most recorded first, then by name.
function tally(values, labelFor = (value) => value) {
  const counts = new Map();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// The choices the filter sheet offers, each with how many records have it.
// Genres, studios and formats are only what is on this bookshelf; ratings
// are always all five, best first.
export function filterOptions(records, facets, language = 'ko') {
  return {
    ratings: Array.from({ length: MAX_RATING }, (_, i) => {
      const value = MAX_RATING - i;
      return {
        value,
        label: labelOf('ratings', value, language),
        count: records.filter((record) => record.rating === value).length,
      };
    }),
    genres: tally(
      records.flatMap((record) => facets[record.id]?.genres ?? []),
      (genre) => genreLabel(genre, language),
    ),
    studios: tally(records.map((record) => facets[record.id]?.studio)),
    formats: tally(
      records.map((record) => record.format),
      formatLabel,
    ),
  };
}
