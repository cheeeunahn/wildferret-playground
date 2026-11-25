import OtakuDiaryPage from './OtakuDiaryPage';

// Not in FEATURES: reachable only by URL. It is a full-screen, phone-sized
// app, so it is routed without the site layout.
export const otakuDiaryPage = {
  id: 'otaku-diary',
  path: 'otaku-diary',
  Component: OtakuDiaryPage,
};
