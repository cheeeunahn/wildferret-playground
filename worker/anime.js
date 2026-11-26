// Korean titles for the anime diary.
//
//   GET /api/anime/search?q=귀멸의 칼날   what TMDB finds for the query
//   GET /api/anime/popular                the best-known anime, for matching
//                                         a query by its first letter
//     -> { results: [{ koreanTitle, originalTitle, year, kind }] }
//   GET /api/anime/overview?title=鬼滅の刃  the Korean synopsis for an
//                                         AniList title, by its native title
//     -> { overview: '…' | null }
//
// AniList, where the diary's anime come from, has no Korean titles. TMDB
// does, so a Korean query is looked up there and answered with each match's
// original title; the browser then finds those on AniList. The TMDB key
// stays here, in the `TMDB_API_KEY` secret.

import { HttpError } from './http.js';
import {
  overviewQueries,
  pickOverview,
  toCandidates,
} from '../src/features/otaku-diary/domain/koreanSearch.js';

const TMDB = 'https://api.themoviedb.org/3';
const MAX_QUERY_LENGTH = 50;
const MAX_TITLE_LENGTH = 200;
const SEARCH_CACHE_SECONDS = 24 * 60 * 60;
const POPULAR_CACHE_SECONDS = 7 * 24 * 60 * 60;
// TMDB lists 20 titles a page: 500 series and 200 films.
const POPULAR_PAGES = { tv: 25, movie: 10 };

// TMDB issues two kinds of key: a short v3 key that goes in the URL, and a
// long v4 token (a JWT) that goes in a header. Either works here.
async function tmdb(key, path, params) {
  const url = new URL(TMDB + path);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set('language', 'ko-KR');
  url.searchParams.set('include_adult', 'false');
  const headers = { accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.authorization = `Bearer ${key}`;
  else url.searchParams.set('api_key', key);

  const response = await fetch(new Request(url, { headers }));
  if (response.status === 429) {
    throw new HttpError(429, '검색이 너무 잦아요. 잠시 후 다시 시도해 주세요.');
  }
  if (!response.ok) {
    console.error(`TMDB ${path} failed: ${response.status}`);
    throw new HttpError(502, '검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
  }
  return response.json();
}

// The same request has the same answer for everyone, so browsers may keep it.
function cacheable(body, seconds) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${seconds}`,
    },
  });
}

async function search(key, url) {
  const query = (url.searchParams.get('q') ?? '').trim();
  if (!query || query.length > MAX_QUERY_LENGTH) {
    throw new HttpError(400, '검색어가 올바르지 않아요.');
  }
  const data = await tmdb(key, '/search/multi', { query });
  return cacheable({ results: toCandidates(data.results) }, SEARCH_CACHE_SECONDS);
}

async function overview(key, url) {
  const title = (url.searchParams.get('title') ?? '').trim();
  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new HttpError(400, '작품 정보가 올바르지 않아요.');
  }
  let found = null;
  for (const query of overviewQueries(title)) {
    const data = await tmdb(key, '/search/multi', { query });
    found = pickOverview(data.results, title);
    if (found) break;
  }
  return cacheable({ overview: found }, SEARCH_CACHE_SECONDS);
}

// The most-voted Japanese animation that has a Korean title. Sorting by
// votes rather than TMDB's "popularity" keeps the list to titles people know
// instead of whatever aired this week.
async function fetchPopular(key) {
  const pages = Object.entries(POPULAR_PAGES).flatMap(([kind, count]) =>
    Array.from({ length: count }, (_, i) =>
      tmdb(key, `/discover/${kind}`, {
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'vote_count.desc',
        page: String(i + 1),
      }).then((data) => ({ kind, votes: data.results ?? [] })),
    ),
  );
  const items = (await Promise.all(pages))
    .flatMap(({ kind, votes }) => votes.map((item) => ({ ...item, media_type: kind })))
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
  return toCandidates(items, { limit: Infinity }).filter((candidate) => candidate.koreanTitle);
}

// 35 TMDB requests make one answer, so it is kept in Cloudflare's cache and
// built again only once a week. `pnpm dev` has no such cache and builds it
// each time the browser's own copy runs out.
async function popular(key, request, ctx) {
  const cache = globalThis.caches?.default;
  const cached = await cache?.match(request);
  if (cached) return cached;
  const response = cacheable({ results: await fetchPopular(key) }, POPULAR_CACHE_SECONDS);
  if (cache) {
    const stored = cache.put(request, response.clone());
    if (ctx?.waitUntil) ctx.waitUntil(stored);
    else await stored;
  }
  return response;
}

export async function handleAnime(request, env, url, ctx) {
  const route = {
    '/api/anime/search': search,
    '/api/anime/popular': popular,
    '/api/anime/overview': overview,
  }[url.pathname];
  if (!route) throw new HttpError(404, '없는 주소예요.');
  if (request.method !== 'GET') throw new HttpError(405, '허용되지 않은 요청이에요.');
  const key = env.TMDB_API_KEY?.trim();
  if (!key) throw new HttpError(503, '한국어 검색이 아직 준비되지 않았어요. 영어 제목으로 찾아보세요.');
  return route === popular ? popular(key, request, ctx) : route(key, url);
}
