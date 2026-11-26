// Finding anime by their Korean titles. AniList has none, so a Korean query
// goes to TMDB first, and TMDB's original (Japanese) titles are then searched
// on AniList. Pure: used by both the Worker and the browser.

const HANGUL_SYLLABLE = /[가-힣]/;
const ANIMATION_GENRE = 16;
// The countries AniList lists anime from. Without this, "겨울왕국" would send
// "Frozen" to AniList and come back as some unrelated anime.
const ANIME_LANGUAGES = new Set(['ja', 'zh', 'ko', 'cn']);

// True once the query holds a finished Korean syllable. Lone jamo ("ㄱ"), as
// typed halfway through a syllable, match nothing and are not worth a request.
export function isKoreanQuery(query) {
  return HANGUL_SYLLABLE.test(query);
}

function yearOf(date) {
  const year = Number.parseInt(date, 10);
  return Number.isInteger(year) ? year : null;
}

// TMDB results, narrowed to animation and to the fields the browser needs:
// `{ koreanTitle, originalTitle, year, kind }`. Search results say what each
// item is; lists of only series or only films do not, so `kind` says it.
export function toCandidates(results, { kind, limit = 5 } = {}) {
  const seen = new Set();
  const candidates = [];
  for (const item of results ?? []) {
    const itemKind = kind ?? item.media_type;
    if (itemKind !== 'tv' && itemKind !== 'movie') continue;
    if (!item.genre_ids?.includes(ANIMATION_GENRE)) continue;
    if (!ANIME_LANGUAGES.has(item.original_language)) continue;
    const originalTitle = (item.original_name ?? item.original_title ?? '').trim();
    const koreanTitle = (item.name ?? item.title ?? '').trim();
    if (!originalTitle || seen.has(originalTitle)) continue;
    seen.add(originalTitle);
    candidates.push({
      // Without a Korean translation TMDB repeats the original title.
      koreanTitle: isKoreanQuery(koreanTitle) ? koreanTitle : null,
      originalTitle,
      year: yearOf(item.first_air_date ?? item.release_date),
      kind: itemKind,
    });
    if (candidates.length === limit) break;
  }
  return candidates;
}

// TMDB writes film titles as 劇場版「鬼滅の刃」無限列車編; AniList, which finds
// nothing for that, has 鬼滅の刃 無限列車編.
export function toAniListSearch(originalTitle) {
  return originalTitle
    .replace(/劇場版|映画/g, ' ')
    .replace(/[「」『』【】]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A title without spaces, punctuation or letter case, for comparing.
function titleKey(text) {
  return (text ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function sameTitle(a, b) {
  return titleKey(a) !== '' && titleKey(a) === titleKey(b);
}

// What to ask TMDB for an AniList title, most exact first. AniList lists
// each season on its own (鬼滅の刃 遊郭編) where TMDB has only the series
// (鬼滅の刃), so the title's first part is tried when the whole finds nothing.
export function overviewQueries(nativeTitle) {
  const whole = toAniListSearch(nativeTitle ?? '');
  const first = whole.split(' ')[0];
  return [...new Set([whole, first])].filter(Boolean);
}

// The Korean synopsis among TMDB search results for an AniList title, or
// null. Only animation whose original title is the AniList title, or its
// beginning (the series a season belongs to), is trusted; the closest wins.
// A title without a Korean translation has an empty overview on TMDB.
export function pickOverview(results, nativeTitle) {
  const wanted = titleKey(toAniListSearch(nativeTitle ?? ''));
  let best = null;
  for (const item of results ?? []) {
    if (item.media_type !== 'tv' && item.media_type !== 'movie') continue;
    if (!item.genre_ids?.includes(ANIMATION_GENRE)) continue;
    if (!ANIME_LANGUAGES.has(item.original_language)) continue;
    const overview = (item.overview ?? '').trim();
    if (!isKoreanQuery(overview)) continue;
    const key = titleKey(toAniListSearch(item.original_name ?? item.original_title ?? ''));
    if (key.length < 2 || !wanted.startsWith(key)) continue;
    if (!best || key.length > best.key.length) best = { key, overview };
  }
  return best?.overview ?? null;
}

// `matches[i]` are the anime AniList found for `candidates[i]`, best match
// first, as `{ id, title, nativeTitle, ... }`. Returns one list, each anime
// once: every candidate's best match in the candidates' order, then every
// second match, and so on, so "사" lists many titles rather than every season
// of the first. The anime TMDB actually meant gets its Korean title; the
// sequels and films AniList lists beside it keep their own.
export function mergeKoreanResults(candidates, matches, limit) {
  // A Map keeps the order anime were first found in. A film often turns up
  // first beside its series and only later as the candidate it matches, so a
  // later exact match still gets to name it.
  const merged = new Map();
  const depth = Math.max(0, ...matches.map((found) => found?.length ?? 0));
  for (let rank = 0; rank < depth; rank += 1) {
    candidates.forEach((candidate, index) => {
      const anime = matches[index]?.[rank];
      if (!anime) return;
      const exact =
        candidate.koreanTitle &&
        (sameTitle(anime.nativeTitle, candidate.originalTitle) ||
          sameTitle(anime.nativeTitle, toAniListSearch(candidate.originalTitle)));
      if (exact) merged.set(anime.id, { ...anime, title: candidate.koreanTitle });
      else if (!merged.has(anime.id)) merged.set(anime.id, anime);
    });
  }
  return [...merged.values()].slice(0, limit);
}
