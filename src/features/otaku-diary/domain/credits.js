// What this app is built from and whose work it shows, for the settings
// sheet. Pure data: no React, no browser APIs.
//
// Keep it true to the code: when a dependency in package.json, a font, a
// sound, or an outside service is added or dropped, change this in the same
// commit. Each item is `{ name, note?, license?, url? }`.

export const CREDITS = [
  {
    heading: '작품 정보',
    items: [
      { name: 'AniList', note: '작품 정보, 포스터 이미지, 장르, 태그', url: 'https://anilist.co' },
      {
        name: 'TMDB',
        note: '한국어 제목과 줄거리. 이 서비스는 TMDB API를 사용하지만 TMDB의 보증이나 인증을 받은 것은 아닙니다.',
        url: 'https://www.themoviedb.org',
      },
      { name: 'YouTube', note: '예고편 영상', url: 'https://www.youtube.com' },
    ],
  },
  {
    heading: '소리와 그림',
    items: [
      {
        name: 'AivisSpeech · コハク',
        note: '코토리의 목소리',
        license: 'Aivis Common Model License 1.0',
        url: 'https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md',
      },
      { name: 'Sparkling Seaside Adventure', note: '배경음악' },
      { name: 'Codex 이미지 생성', note: '캐릭터, 잠수함, 카페, 바다 생물, 배경 그림' },
    ],
  },
  {
    heading: '글꼴과 아이콘',
    items: [
      {
        name: 'Material Symbols',
        note: 'Google',
        license: 'Apache License 2.0',
        url: 'https://github.com/google/material-design-icons/blob/master/LICENSE',
      },
      {
        name: '나눔스퀘어라운드',
        note: 'NAVER',
        license: 'SIL Open Font License 1.1',
        url: 'https://github.com/innks/NanumSquareRound',
      },
    ],
  },
  {
    heading: '오픈소스 소프트웨어',
    items: [
      { name: 'React, React DOM', note: 'Meta Platforms, Inc.', license: 'MIT', url: 'https://github.com/facebook/react/blob/main/LICENSE' },
      { name: 'React Router', note: 'Remix Software Inc.', license: 'MIT', url: 'https://github.com/remix-run/react-router/blob/main/LICENSE.md' },
      { name: 'Mantine', note: 'Vitaly Rtishchev', license: 'MIT', url: 'https://github.com/mantinedev/mantine/blob/master/LICENSE' },
      { name: 'Motion', note: 'Motion B.V.', license: 'MIT', url: 'https://github.com/motiondivision/motion/blob/main/LICENSE.md' },
      {
        name: 'Strudel (@strudel/embed)',
        note: '사이트 공용 스크립트. 이 다이어리에서는 쓰지 않습니다.',
        license: 'AGPL-3.0-or-later',
        url: 'https://codeberg.org/uzu/strudel',
      },
    ],
  },
];
