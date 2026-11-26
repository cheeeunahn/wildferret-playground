// The only file that knows anime come from AniList. Screens see plain
// objects: { id, title, nativeTitle, year, format, cover, color,
// countsForDepth }, and getDetails adds the fields from domain/details.js.
// Swap the body for our own API later.
//
// Korean queries take a detour: our /api/anime/search asks TMDB which anime
// the Korean title names, and those are then looked up on AniList.
import { countsForDepth } from '../domain/depth';
import { toDetails } from '../domain/details';
import { isKoreanQuery, mergeKoreanResults, toAniListSearch } from '../domain/koreanSearch';
import { normalize, rankByQuery } from '../domain/search';

const ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  format
  seasonYear
  startDate { year }
  title { english romaji native }
  synonyms
  coverImage { medium large color }
`;

const AIRED = 'type: ANIME, isAdult: false, status_in: [FINISHED, RELEASING]';

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, ${AIRED}) { ${MEDIA_FIELDS} }
  }
}`;

// AniList's own search matches whole words, so "s" or "sp" finds nothing
// useful. The most popular titles are fetched once, in one request, and
// matched here by prefix instead.
const POPULAR_PAGES = [1, 2, 3, 4];
const POPULAR_QUERY = `
query {
  ${POPULAR_PAGES.map(
    (page) => `p${page}: Page(page: ${page}, perPage: 50) {
    media(sort: POPULARITY_DESC, ${AIRED}) { ${MEDIA_FIELDS} }
  }`,
  ).join('\n  ')}
}`;
const POPULAR_KEY = 'otaku-diary:popular:v1';
const POPULAR_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const LIVE_MIN_LENGTH = 2;
const MAX_RESULTS = 12;

function toAnime(media) {
  return {
    id: media.id,
    title: media.title.english || media.title.romaji || media.title.native,
    nativeTitle: media.title.native ?? null,
    year: media.seasonYear ?? media.startDate?.year ?? null,
    format: media.format ?? null,
    cover: media.coverImage?.large ?? media.coverImage?.medium ?? null,
    color: media.coverImage?.color ?? null,
    countsForDepth: countsForDepth(media.format),
  };
}

// An anime plus every name it can be found by.
function toEntry(media) {
  const names = [media.title.english, media.title.romaji, ...(media.synonyms ?? [])];
  return {
    anime: toAnime(media),
    names: names.filter(Boolean).map(normalize).filter(Boolean),
  };
}

const DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { native }
    description(asHtml: false)
    genres
    tags { name isMediaSpoiler }
    episodes
    duration
    season
    seasonYear
    status
    source
    averageScore
    meanScore
    studios(isMain: true) { nodes { name } }
    bannerImage
    trailer { id site }
    siteUrl
  }
}`;
const DETAILS_KEY = 'otaku-diary:details:v2:';
const DETAILS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function request(query, variables, signal) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (response.status === 429) {
    throw new Error('검색이 너무 잦아요. 잠시 후 다시 시도해 주세요.');
  }
  if (!response.ok) {
    throw new Error('검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
  }
  return (await response.json()).data;
}

function readPopularCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(POPULAR_KEY));
    if (cached && Date.now() - cached.at < POPULAR_MAX_AGE_MS) return cached.entries;
  } catch {
    // Unreadable cache: fetch again.
  }
  return null;
}

async function fetchPopular() {
  const cached = readPopularCache();
  if (cached) return cached;
  const data = await request(POPULAR_QUERY);
  const entries = POPULAR_PAGES.flatMap((page) => data[`p${page}`].media).map(toEntry);
  try {
    localStorage.setItem(POPULAR_KEY, JSON.stringify({ at: Date.now(), entries }));
  } catch {
    // No storage: it stays in memory for this visit.
  }
  return entries;
}

// One shared load. A failed load is forgotten so the next search retries,
// and search carries on with live results only.
let popular = null;
function loadPopular() {
  popular ??= fetchPopular().catch(() => {
    popular = null;
    return [];
  });
  return popular;
}

// AniList allows few requests per minute, so identical searches are answered
// from memory.
const liveCache = new Map();
async function searchLive(key, signal) {
  if (liveCache.has(key)) return liveCache.get(key);
  const data = await request(SEARCH_QUERY, { search: key }, signal);
  const results = (data?.Page?.media ?? []).map(toAnime);
  liveCache.set(key, results);
  return results;
}

// One AniList request looks up every title TMDB named, a few anime each: a
// series on TMDB is several seasons and films on AniList.
const KOREAN_SEARCH = '/api/anime/search';
const KOREAN_POPULAR = '/api/anime/popular';
const KOREAN_POPULAR_KEY = 'otaku-diary:popular-ko:v1';
const PER_CANDIDATE = 4;
const MAX_CANDIDATES = 8;

function candidatesQuery(count) {
  const indexes = Array.from({ length: count }, (_, i) => i);
  return `
query (${indexes.map((i) => `$s${i}: String`).join(', ')}) {
  ${indexes
    .map(
      (i) => `c${i}: Page(perPage: ${PER_CANDIDATE}) {
    media(search: $s${i}, ${AIRED}) { ${MEDIA_FIELDS} }
  }`,
    )
    .join('\n  ')}
}`;
}

async function fetchCandidates(url, signal) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? '검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
  }
  return body?.results ?? [];
}

// TMDB's search matches whole words too, so "사" finds almost nothing. The
// best-known anime with Korean titles are fetched once, kept for a week, and
// matched here by prefix, like the AniList list above.
function toKoreanEntries(candidates) {
  return candidates.map((candidate) => ({
    anime: candidate,
    names: [normalize(candidate.koreanTitle)],
  }));
}

async function fetchKoreanPopular() {
  try {
    const cached = JSON.parse(localStorage.getItem(KOREAN_POPULAR_KEY));
    if (cached && Date.now() - cached.at < POPULAR_MAX_AGE_MS) {
      return toKoreanEntries(cached.candidates);
    }
  } catch {
    // Unreadable cache: fetch again.
  }
  const candidates = await fetchCandidates(KOREAN_POPULAR);
  try {
    localStorage.setItem(KOREAN_POPULAR_KEY, JSON.stringify({ at: Date.now(), candidates }));
  } catch {
    // No storage: it stays in memory for this visit.
  }
  return toKoreanEntries(candidates);
}

// One shared load, forgotten on failure, as with `loadPopular`.
let koreanPopular = null;
function loadKoreanPopular() {
  koreanPopular ??= fetchKoreanPopular().catch(() => {
    koreanPopular = null;
    return [];
  });
  return koreanPopular;
}

// Well-known titles that start with the query come first, then whatever
// TMDB's own search adds.
async function koreanCandidates(key, signal) {
  const fromPopular = rankByQuery(await loadKoreanPopular(), key, MAX_CANDIDATES);
  if (key.length < LIVE_MIN_LENGTH) return fromPopular;

  let fromLive;
  try {
    fromLive = await fetchCandidates(`${KOREAN_SEARCH}?q=${encodeURIComponent(key)}`, signal);
  } catch (error) {
    if (error.name === 'AbortError' || fromPopular.length === 0) throw error;
    fromLive = [];
  }
  const seen = new Set(fromPopular.map((candidate) => candidate.originalTitle));
  return [
    ...fromPopular,
    ...fromLive.filter((candidate) => !seen.has(candidate.originalTitle)),
  ].slice(0, MAX_CANDIDATES);
}

async function searchKorean(key, signal) {
  if (liveCache.has(key)) return liveCache.get(key);
  const candidates = await koreanCandidates(key, signal);
  let results = [];
  if (candidates.length > 0) {
    const variables = Object.fromEntries(
      candidates.map((candidate, i) => [`s${i}`, toAniListSearch(candidate.originalTitle)]),
    );
    const data = await request(candidatesQuery(candidates.length), variables, signal);
    const matches = candidates.map((_, i) => (data?.[`c${i}`]?.media ?? []).map(toAnime));
    results = mergeKoreanResults(candidates, matches, MAX_RESULTS);
  }
  liveCache.set(key, results);
  return results;
}

// Genre and studio for many titles at once, for the bookshelf's filters:
// one request covers up to 50 ids. Kept in storage for a week, under one key.
const FACETS_QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      genres
      studios(isMain: true) { nodes { name } }
    }
  }
}`;
const FACETS_KEY = 'otaku-diary:facets:v1';
const FACETS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const FACETS_PER_REQUEST = 50;

let facetsCache = null;
function loadFacetsCache() {
  if (facetsCache) return facetsCache;
  facetsCache = {};
  try {
    const stored = JSON.parse(localStorage.getItem(FACETS_KEY)) ?? {};
    for (const [id, entry] of Object.entries(stored)) {
      if (Date.now() - entry.at < FACETS_MAX_AGE_MS) facetsCache[id] = entry;
    }
  } catch {
    // Unreadable cache: fetch again.
  }
  return facetsCache;
}

// Details are fetched only when a title is opened, then kept in memory for
// the visit and in storage for a week: AniList allows few requests a minute.
const detailsCache = new Map();

function readDetailsCache(id) {
  try {
    const cached = JSON.parse(localStorage.getItem(DETAILS_KEY + id));
    if (cached && Date.now() - cached.at < DETAILS_MAX_AGE_MS) return cached.details;
  } catch {
    // Unreadable cache: fetch again.
  }
  return null;
}

async function fetchDetails(id, signal) {
  const cached = readDetailsCache(id);
  if (cached) return cached;
  const data = await request(DETAILS_QUERY, { id }, signal);
  if (!data?.Media) throw new Error('작품 정보를 찾지 못했어요.');
  const details = toDetails(data.Media);
  try {
    localStorage.setItem(DETAILS_KEY + id, JSON.stringify({ at: Date.now(), details }));
  } catch {
    // No storage: it stays in memory for this visit.
  }
  return details;
}

// AniList's synopses are English. TMDB's Korean one is asked for through our
// Worker, by the native title, and kept for a week under its own key: "TMDB
// has none" is remembered too, but a failed request is not, so the next visit
// asks again. Returns null when there is none to show.
const KOREAN_OVERVIEW = '/api/anime/overview';
const OVERVIEW_KEY = 'otaku-diary:overview-ko:v1:';

async function fetchKoreanOverview(id, nativeTitle, signal) {
  if (!nativeTitle) return null;
  try {
    const cached = JSON.parse(localStorage.getItem(OVERVIEW_KEY + id));
    if (cached && Date.now() - cached.at < DETAILS_MAX_AGE_MS) return cached.overview;
  } catch {
    // Unreadable cache: fetch again.
  }
  let overview;
  try {
    const response = await fetch(`${KOREAN_OVERVIEW}?title=${encodeURIComponent(nativeTitle)}`, {
      headers: { accept: 'application/json' },
      signal,
    });
    if (!response.ok) return null;
    overview = (await response.json()).overview ?? null;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return null;
  }
  try {
    localStorage.setItem(OVERVIEW_KEY + id, JSON.stringify({ at: Date.now(), overview }));
  } catch {
    // No storage: it stays in memory for this visit.
  }
  return overview;
}

export const animeRepository = {
  // Call ahead of the first search so one-letter queries answer at once.
  warmUp() {
    loadPopular();
    loadKoreanPopular();
  },

  // Popular titles that start with the query come first, then whatever
  // AniList's own search adds. A Korean query is answered through TMDB.
  async search(query, { signal } = {}) {
    const key = query.trim().toLowerCase();
    if (!key) return [];
    if (isKoreanQuery(key)) return searchKorean(key, signal);

    const fromPopular = rankByQuery(await loadPopular(), key);
    if (key.length < LIVE_MIN_LENGTH) return fromPopular;

    let fromLive;
    try {
      fromLive = await searchLive(key, signal);
    } catch (error) {
      // The live search failing is only fatal when there is nothing else.
      if (error.name === 'AbortError' || fromPopular.length === 0) throw error;
      fromLive = [];
    }
    const seen = new Set(fromPopular.map((anime) => anime.id));
    return [...fromPopular, ...fromLive.filter((anime) => !seen.has(anime.id))].slice(
      0,
      MAX_RESULTS,
    );
  },

  // `{ [id]: { genres, studio } }` for the given anime ids. Ids AniList does
  // not return are remembered as having neither, so they are not asked for
  // again on every visit.
  async getFacets(ids, { signal } = {}) {
    const cache = loadFacetsCache();
    const missing = ids.filter((id) => !cache[id]);
    for (let i = 0; i < missing.length; i += FACETS_PER_REQUEST) {
      const chunk = missing.slice(i, i + FACETS_PER_REQUEST);
      const data = await request(FACETS_QUERY, { ids: chunk }, signal);
      const found = new Map((data?.Page?.media ?? []).map((media) => [media.id, media]));
      for (const id of chunk) {
        const media = found.get(id);
        cache[id] = {
          at: Date.now(),
          genres: media?.genres ?? [],
          studio: media?.studios?.nodes?.[0]?.name ?? null,
        };
      }
    }
    if (missing.length > 0) {
      try {
        localStorage.setItem(FACETS_KEY, JSON.stringify(cache));
      } catch {
        // No storage: it stays in memory for this visit.
      }
    }
    return Object.fromEntries(ids.map((id) => [id, cache[id]]));
  },

  // Synopsis, genres, trailer and the rest for one anime id. The synopsis is
  // TMDB's Korean one when it has it (`descriptionLang: 'ko'`), else AniList's.
  async getDetails(id, { signal } = {}) {
    if (detailsCache.has(id)) return detailsCache.get(id);
    const fromAniList = await fetchDetails(id, signal);
    const overview = await fetchKoreanOverview(id, fromAniList.nativeTitle, signal);
    const details = {
      ...fromAniList,
      description: overview ?? fromAniList.description,
      descriptionLang: overview ? 'ko' : 'en',
    };
    detailsCache.set(id, details);
    return details;
  },
};
