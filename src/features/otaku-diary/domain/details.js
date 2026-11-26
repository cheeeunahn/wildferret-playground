// Turns AniList's detail fields into what the detail sheet shows. Pure: no
// React, no browser APIs.

const MAX_TAGS = 8;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…' };

// AniList synopses are HTML (`<br>`, `<i>`, `<b>`) even with asHtml: false.
// Line breaks become newlines, other tags go, entities are decoded, and
// paragraphs are separated by one blank line.
export function plainText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? match;
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Only YouTube trailers can be embedded. AniList ids sometimes carry stray
// whitespace (Attack on Titan's ends in a tab), so they are trimmed and then
// checked strictly before going anywhere near an iframe URL.
export function toTrailer(trailer) {
  if (trailer?.site !== 'youtube') return null;
  const youtubeId = trailer.id?.trim();
  if (!YOUTUBE_ID.test(youtubeId ?? '')) return null;
  return {
    youtubeId,
    thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
  };
}

export function youtubeEmbedUrl(youtubeId) {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`;
}

export function youtubeWatchUrl(youtubeId) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

// Spoiler tags are dropped; the rest stay in AniList's order (most relevant
// first).
function visibleTags(tags) {
  return (tags ?? [])
    .filter((tag) => !tag.isMediaSpoiler)
    .slice(0, MAX_TAGS)
    .map((tag) => tag.name);
}

export function toDetails(media) {
  return {
    id: media.id,
    nativeTitle: media.title?.native ?? null,
    description: plainText(media.description),
    genres: media.genres ?? [],
    tags: visibleTags(media.tags),
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    status: media.status ?? null,
    source: media.source ?? null,
    score: media.averageScore ?? media.meanScore ?? null,
    studio: media.studios?.nodes?.[0]?.name ?? null,
    banner: media.bannerImage ?? null,
    trailer: toTrailer(media.trailer),
    siteUrl: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
  };
}

const SEASON_LABEL = { WINTER: '겨울', SPRING: '봄', SUMMER: '여름', FALL: '가을' };
const STATUS_LABEL = {
  FINISHED: '완결',
  RELEASING: '방영 중',
  NOT_YET_RELEASED: '방영 예정',
  CANCELLED: '중단',
  HIATUS: '휴재',
};
const SOURCE_LABEL = {
  ORIGINAL: '오리지널',
  MANGA: '만화',
  LIGHT_NOVEL: '라이트 노벨',
  NOVEL: '소설',
  WEB_NOVEL: '웹소설',
  VISUAL_NOVEL: '비주얼 노벨',
  VIDEO_GAME: '게임',
  GAME: '게임',
  WEBTOON: '웹툰',
};

// The facts row under the title, as `{ label, value }` pairs, skipping any
// AniList does not know.
export function factsOf(details) {
  const facts = [];
  if (details.seasonYear) {
    const season = SEASON_LABEL[details.season];
    facts.push({ label: '방영', value: season ? `${details.seasonYear} ${season}` : `${details.seasonYear}` });
  }
  if (details.status) facts.push({ label: '상태', value: STATUS_LABEL[details.status] ?? details.status });
  if (details.episodes) {
    const length = details.duration ? ` · ${details.duration}분` : '';
    facts.push({ label: '화수', value: `${details.episodes}화${length}` });
  }
  if (details.studio) facts.push({ label: '제작', value: details.studio });
  if (details.source) facts.push({ label: '원작', value: SOURCE_LABEL[details.source] ?? '기타' });
  if (details.score) facts.push({ label: 'AniList 평점', value: `${details.score}점` });
  return facts;
}
