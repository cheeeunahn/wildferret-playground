import { useMemo, useState } from 'react';
import AnimeSearch from '../components/AnimeSearch';
import SeaScene from '../components/SeaScene';
import styles from './MainScreen.module.css';

// Where the user lands after onboarding: search, add, watch the submarine.
// Tapping the submarine goes inside it.
export default function MainScreen({ diary, onEnterSubmarine, onReset }) {
  const { profile, records, depth } = diary;
  const [lastAdded, setLastAdded] = useState(null);
  const recordedIds = useMemo(() => new Set(records.map((r) => r.id)), [records]);

  const add = (anime) => {
    setLastAdded(anime);
    diary.addAnime(anime);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.heading}>
          <span>{profile.nickname || '덕후'}</span> 님의 다이어리
        </h1>
        <AnimeSearch onPick={add} recordedIds={recordedIds} />
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
        <button type="button" onClick={onReset}>
          처음부터 다시
        </button>
      </footer>
    </div>
  );
}
