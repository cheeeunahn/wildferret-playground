import { useCallback, useState } from 'react';
import { useDiary } from './hooks/useDiary';
import { useMusic } from './hooks/useSound';
import LibraryScreen from './screens/LibraryScreen';
import MainScreen from './screens/MainScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RoomScreen from './screens/RoomScreen';
import TitleScreen from './screens/TitleScreen';
import './fonts.css';
import styles from './OtakuDiaryPage.module.css';

// Wires the diary to the screens and decides which one shows.
export default function OtakuDiaryPage() {
  const diary = useDiary();
  const [screen, setScreen] = useState('title'); // title | onboarding | main | room | library
  const [firstRoomVisit, setFirstRoomVisit] = useState(false);
  const { saveProfile, reset } = diary;
  // Background music plays on every screen but the title.
  useMusic(screen !== 'title');

  // Onboarding ends with the user stepping into the submarine.
  const finishOnboarding = useCallback(() => {
    saveProfile({ onboarded: true, visitedRoom: true });
    setFirstRoomVisit(true);
    setScreen('room');
  }, [saveProfile]);

  const enterSubmarine = () => {
    // The guide shows the room around on the first visit only.
    setFirstRoomVisit(!diary.profile.visitedRoom);
    saveProfile({ visitedRoom: true });
    setScreen('room');
  };

  const startOver = () => {
    reset();
    setScreen('title');
  };

  return (
    <div className={styles.backdrop}>
      <main className={styles.phone}>
        {screen === 'title' && (
          <TitleScreen
            disabled={diary.loading}
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
            onBack={() => setScreen('main')}
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
      </main>
    </div>
  );
}
