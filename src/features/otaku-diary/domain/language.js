// The language anime information is shown in: titles, synopses, genres and
// tags. Menus and 코토리's lines are Korean either way. Pure: no React, no
// browser APIs.

export const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];
export const DEFAULT_LANGUAGE = 'ko';

export function isLanguage(value) {
  return LANGUAGES.some((language) => language.value === value);
}

// AniList's own title for an anime, when it is known and English is wanted;
// otherwise the title as recorded (Korean when it was found by one).
export function titleIn(language, anime, aniListTitle) {
  return language === 'en' && aniListTitle ? { ...anime, title: aniListTitle } : anime;
}
