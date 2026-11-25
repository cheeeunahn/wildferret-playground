import { useCallback, useEffect, useRef, useState } from 'react';
import { useDiary } from './hooks/useDiary';
import { useLockedHeight } from './hooks/useLockedHeight';
import { useMusic } from './hooks/useSound';
import LibraryScreen from './screens/LibraryScreen';
import MainScreen from './screens/MainScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RoomScreen from './screens/RoomScreen';
import TitleScreen from './screens/TitleScreen';
import './fonts.css';
import styles from './OtakuDiaryPage.module.css';

// Half of the trip into or out of the submarine: the screen fades to dark for this
// long, changes, then fades back in. Matches the transition in the CSS.
const FADE_MS = 400;

// Wires the diary to the screens and decides which one shows.
export default function OtakuDiaryPage() {
  const diary = useDiary();
  const backdropRef = useLockedHeight();
  const [screen, setScreen] = useState('title'); // title | onboarding | main | room | library
  const [firstRoomVisit, setFirstRoomVisit] = useState(false);
  const { saveProfile, reset } = diary;
  // Background music plays on every screen but the title.
  useMusic(screen !== 'title');

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

  const startOver = () => {
    reset();
    setScreen('title');
  };

  return (
    <div ref={backdropRef} className={styles.backdrop}>
      <main className={styles.phone}>
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
          <MainScreen diary={diary} onEnterSubmarine={enterSubmarine} onReset={startOver} />
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
      </main>
    </div>
  );
}
