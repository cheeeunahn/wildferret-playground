import AnimeCard from '../components/AnimeCard';
import styles from './LibraryScreen.module.css';

// The bookshelf, opened: every anime the user has recorded, newest first.
export default function LibraryScreen({ diary, onBack }) {
  const { records } = diary;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={onBack} aria-label="잠수함으로 돌아가기">
          ←
        </button>
        <h1 className={styles.heading}>
          내 책장 <span>{records.length}편</span>
        </h1>
      </header>

      {records.length === 0 ? (
        <p className={styles.empty}>
          아직 꽂힌 애니가 없어요.
          <br />
          바다로 나가서 본 애니를 검색해 보세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {records.map((anime) => (
            <li key={anime.id}>
              <AnimeCard anime={anime} />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.credit}>작품 정보·이미지: AniList</p>
    </div>
  );
}
