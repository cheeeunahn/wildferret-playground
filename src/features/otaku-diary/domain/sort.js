// The orders the bookshelf can be listed in. Pure: no React, no browser APIs.

export const SORTS = [
  { value: 'recent', label: '최근 기록순' },
  { value: 'rating', label: '별점 높은순' },
  { value: 'title', label: '제목순' },
  { value: 'year', label: '방영연도순' },
];
export const DEFAULT_SORT = 'recent';

export function isSort(value) {
  return SORTS.some((sort) => sort.value === value);
}

// `records` come newest first, and every order keeps that as its tiebreak:
// among titles with the same stars, the one recorded last comes first.
// Unrated titles and titles with no year go to the end.
export function sortRecords(records, sort, language = 'ko') {
  const list = [...records];
  if (sort === 'rating') return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (sort === 'year') return list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  if (sort === 'title') {
    const collator = new Intl.Collator(language === 'en' ? 'en' : 'ko', { numeric: true });
    return list.sort((a, b) => collator.compare(a.title, b.title));
  }
  return list;
}
