import OtakuDiaryPage from './OtakuDiaryPage';
import PrivacyPage from './PrivacyPage';

// Not in FEATURES: reachable only by URL. It is a full-screen, phone-sized
// app, so it is routed without the site layout.
export const otakuDiaryPage = {
  id: 'otaku-diary',
  path: 'otaku-diary',
  Component: OtakuDiaryPage,
};

// Linked from the diary's title screen and its sign-up form.
export const otakuDiaryPrivacyPage = {
  id: 'otaku-diary-privacy',
  path: 'otaku-diary/privacy',
  Component: PrivacyPage,
};
