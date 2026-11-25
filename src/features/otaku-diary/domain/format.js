// AniList's format codes, as the diary names them. Pure.
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
