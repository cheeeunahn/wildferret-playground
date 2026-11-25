import { useMemo, useState } from 'react';
import AnimeSearch from '../components/AnimeSearch';
import ReviewSheet from '../components/ReviewSheet';
import SeaScene from '../components/SeaScene';
import SoundToggle from '../components/SoundToggle';
import styles from './MainScreen.module.css';

// Where the user lands after onboarding: search, rate, add, watch the
// submarine.
// Tapping the submarine goes inside it.
export default function MainScreen({ diary, onEnterSubmarine }) {
  const { profile, records, depth } = diary;
  const [lastAdded, setLastAdded] = useState(null);
  const recordedIds = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  // The anime picked from search, waiting for its stars.
  const [picked, setPicked] = useState(null);

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
          <SoundToggle />
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

      <p className={styles.progress}>
        {depth.nextLayer
          ? `다음 층(${depth.nextLayer.name})까지 ${depth.toNextLayer}편`
          : '가장 깊은 층에 도착했어요'}
      </p>

      <footer className={styles.footer}>
        <span>작품 정보·이미지: AniList</span>
      </footer>

      {picked && (
        <ReviewSheet anime={picked} onSubmit={add} onCancel={() => setPicked(null)} />
      )}
    </div>
  );
}
