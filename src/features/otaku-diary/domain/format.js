// AniList's format codes and genres, as the diary names them. Pure.
export const FORMAT_LABEL = {
  TV: 'TV',
  TV_SHORT: 'TV 단편',
  MOVIE: '극장판',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: '스페셜',
  MUSIC: '뮤직',
};

export function formatLabel(format) {
  return FORMAT_LABEL[format] ?? format;
}

// AniList's genres are a fixed list of English names. The English name stays
// the value everywhere (filters, caches); this is only what is shown. A genre
// AniList adds later shows in English until it is listed here.
export const GENRE_LABEL = {
  Action: '액션',
  Adventure: '모험',
  Comedy: '코미디',
  Drama: '드라마',
  Ecchi: '엣치',
  Fantasy: '판타지',
  Hentai: '성인',
  Horror: '호러',
  'Mahou Shoujo': '마법소녀',
  Mecha: '메카',
  Music: '음악',
  Mystery: '미스터리',
  Psychological: '심리',
  Romance: '로맨스',
  'Sci-Fi': 'SF',
  'Slice of Life': '일상',
  Sports: '스포츠',
  Supernatural: '초자연',
  Thriller: '스릴러',
};

export function genreLabel(genre) {
  return GENRE_LABEL[genre] ?? genre;
}
