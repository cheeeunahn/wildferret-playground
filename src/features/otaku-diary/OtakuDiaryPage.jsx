import { useCallback, useEffect, useRef, useState } from 'react';
import { useDiary } from './hooks/useDiary';
import { useLockedHeight } from './hooks/useLockedHeight';
import { useMusic } from './hooks/useSound';
import LibraryScreen from './screens/LibraryScreen';
import LoadingScreen from './screens/LoadingScreen';
import MainScreen from './screens/MainScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RoomScreen from './screens/RoomScreen';
import TapRipple from './components/TapRipple';
import TitleScreen from './screens/TitleScreen';
import './fonts.css';
import './tokens.css';
import styles from './OtakuDiaryPage.module.css';

// Half of the trip into or out of the submarine: the screen fades to dark for this
// long, changes, then fades back in. Matches the transition in the CSS.
const FADE_MS = 400;
// The loading screen stays at least this long, even when the diary answers
// at once, so it reads as an opening rather than a flicker.
const MIN_LOADING_MS = 3000;

// Wires the diary to the screens and decides which one shows.
export default function OtakuDiaryPage() {
  const diary = useDiary();
  const backdropRef = useLockedHeight();
  // loading | title | onboarding | main | room | library
  const [screen, setScreen] = useState('loading');
  // Once it is known who is visiting, the first screen is chosen, one time.
  // Someone the server already knows (logged in, or a visitor who finished
  // onboarding in this browser) goes straight in; only a first-time visitor
  // sees the title screen. A diary that failed to load shows it too, as that
  // is where the error and its retry button are. Logging out, in the
  // settings, is the way back to the title screen.
  // Past the title screen everyone has finished onboarding. When that stops
  // being true, the diary was swapped from the settings sheet: logging out or
  // deleting the account leaves a blank visitor, who goes back to the title
  // screen; a new account, or one that never finished onboarding, starts it.
  if (['main', 'room', 'library'].includes(screen) && !diary.loading && !diary.profile.onboarded) {
    setScreen(diary.loginId ? 'onboarding' : 'title');
  }
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);
  if (screen === 'loading' && waited && (diary.error || !diary.loading)) {
    const known = !diary.error && (diary.loginId || diary.profile.onboarded);
    setScreen(!known ? 'title' : diary.profile.onboarded ? 'main' : 'onboarding');
  }
  const [firstRoomVisit, setFirstRoomVisit] = useState(false);
  const { saveProfile } = diary;
  // Background music plays on every screen but the title and the wait before it.
  useMusic(screen !== 'title' && screen !== 'loading');

  // Fades the screen out, runs `change` while it is dark, and fades back in.
  // Taps during the fade are ignored.
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef(null);
  useEffect(() => () => clearTimeout(fadeTimer.current), []);
  const fadeTo = useCallback((change) => {
    if (fadeTimer.current) return;
    setFading(true);
    fadeTimer.current = setTimeout(() => {
      fadeTimer.current = null;
      change();
      setFading(false);
    }, FADE_MS);
  }, []);

  // Onboarding ends with the user stepping into the submarine.
  const finishOnboarding = useCallback(() => {
    fadeTo(() => {
      saveProfile({ onboarded: true, visitedRoom: true });
      setFirstRoomVisit(true);
      setScreen('room');
    });
  }, [fadeTo, saveProfile]);

  const enterSubmarine = () => {
    // The guide shows the room around on the first visit only.
    const firstVisit = !diary.profile.visitedRoom;
    fadeTo(() => {
      setFirstRoomVisit(firstVisit);
      saveProfile({ visitedRoom: true });
      setScreen('room');
    });
  };

  return (
    <div ref={backdropRef} className={styles.backdrop}>
      <main className={styles.phone}>
        {screen === 'loading' && <LoadingScreen />}
        {screen === 'title' && (
          <TitleScreen
            disabled={diary.loading}
            error={diary.error}
            onRetry={diary.reload}
            diary={diary}
            onStart={() => setScreen(diary.profile.onboarded ? 'main' : 'onboarding')}
          />
        )}
        {screen === 'onboarding' && (
          <OnboardingScreen diary={diary} onFinish={finishOnboarding} />
        )}
        {screen === 'main' && (
          <MainScreen diary={diary} onEnterSubmarine={enterSubmarine} />
        )}
        {screen === 'room' && (
          <RoomScreen
            diary={diary}
            showTour={firstRoomVisit}
            onTourEnd={() => setFirstRoomVisit(false)}
            onOpenBookshelf={() => setScreen('library')}
            onBack={() => fadeTo(() => setScreen('main'))}
          />
        )}
        {screen === 'library' && (
          <LibraryScreen
            diary={diary}
            onBack={() => {
              setFirstRoomVisit(false);
              setScreen('room');
            }}
          />
        )}
        <div className={styles.fade} data-on={fading || undefined} aria-hidden="true" />
        <TapRipple />
      </main>
    </div>
  );
}
