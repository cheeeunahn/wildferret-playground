// The only file that knows anime come from AniList. Screens see plain
// objects: { id, title, nativeTitle, year, format, cover, color,
// countsForDepth }. Swap the body for our own API later.
import { countsForDepth } from '../domain/depth';

const ENDPOINT = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, type: ANIME, isAdult: false, status_in: [FINISHED, RELEASING]) {
      id
      format
      seasonYear
      startDate { year }
      title { english romaji native }
      coverImage { medium large color }
    }
  }
}`;

// AniList allows few requests per minute, so identical searches are answered
// from memory.
const cache = new Map();

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

export const animeRepository = {
  async search(query, { signal } = {}) {
    const key = query.trim().toLowerCase();
    if (!key) return [];
    if (cache.has(key)) return cache.get(key);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: key } }),
      signal,
    });
    if (response.status === 429) {
      throw new Error('검색이 너무 잦아요. 잠시 후 다시 시도해 주세요.');
    }
    if (!response.ok) {
      throw new Error('검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
    const body = await response.json();
    const results = (body.data?.Page?.media ?? []).map(toAnime);
    cache.set(key, results);
    return results;
  },
};
