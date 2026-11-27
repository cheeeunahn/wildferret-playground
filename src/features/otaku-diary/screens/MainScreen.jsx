import { useMemo, useState } from 'react';
import AnimeSearch from '../components/AnimeSearch';
import ReviewSheet from '../components/ReviewSheet';
import SeaScene from '../components/SeaScene';
import SettingsSheet from '../components/SettingsSheet';
import Button from '../ui/Button';
import styles from './MainScreen.module.css';

// Where the user lands after onboarding: search, rate, add, watch the
// submarine.
// Tapping the submarine goes inside it. The button in the top right opens
// the settings, where the account (logging in and out) lives; there is no
// way back to the title screen from here.
export default function MainScreen({ diary, onEnterSubmarine }) {
  const { profile, records, depth } = diary;
  const [lastAdded, setLastAdded] = useState(null);
  const recordedIds = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  // The anime picked from search, waiting for its stars.
  const [picked, setPicked] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const add = async (review) => {
    await diary.addAnime(picked, review);
    setLastAdded(picked);
    setPicked(null);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.heading}>
            <span>{profile.nickname || '덕후'}</span>님의 애니 기록
          </h1>
          <Button variant="outlined" size="s" onClick={() => setSettingsOpen(true)}>
            설정
          </Button>
        </div>
        <AnimeSearch onPick={setPicked} recordedIds={recordedIds} />
      </header>

      <div className={styles.sea}>
        <SeaScene
          depth={depth}
          cargo={lastAdded}
          onSubmarineClick={onEnterSubmarine}
          nudge={profile.visitedRoom ? null : '잠수함을 한 번 클릭해봐!'}
        />
      </div>

      {settingsOpen && <SettingsSheet diary={diary} onClose={() => setSettingsOpen(false)} />}
      {picked && (
        <ReviewSheet anime={picked} onSubmit={add} onCancel={() => setPicked(null)} />
      )}
    </div>
  );
}
