import { useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import ReviewSheet from '../components/ReviewSheet';
import SoundToggle from '../components/SoundToggle';
import { MAX_RATING } from '../domain/review';
import styles from './LibraryScreen.module.css';

// Filter choices, best first. 0 means every record.
const RATING_FILTERS = [0, ...Array.from({ length: MAX_RATING }, (_, i) => MAX_RATING - i)];

// The bookshelf, opened: every anime the user has recorded, newest first,
// with its stars and comment. Each row can be re-rated, and the list can be
// narrowed to one star rating.
export default function LibraryScreen({ diary, onBack }) {
  const { records } = diary;
  const [editingId, setEditingId] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const shown = ratingFilter ? records.filter((r) => r.rating === ratingFilter) : records;
  const editing = records.find((r) => r.id === editingId);

  const saveReview = async (review) => {
    await diary.saveReview(editingId, review);
    setEditingId(null);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={onBack} aria-label="잠수함으로 돌아가기">
          ←
        </button>
        <h1 className={styles.heading}>
          내 책장 <span>{records.length}편</span>
        </h1>
        <SoundToggle className={styles.sound} />
        {records.length > 0 && (
          <div className={styles.filters} role="group" aria-label="별점으로 걸러 보기">
            {RATING_FILTERS.map((rating) => (
              <button
                key={rating}
                className={styles.filter}
                type="button"
                aria-pressed={rating === ratingFilter}
                aria-label={rating ? `별점 ${rating}점만 보기` : '전체 보기'}
                onClick={() => setRatingFilter(rating)}
              >
                {rating ? (
                  <>
                    <span aria-hidden="true">★</span> {rating}
                  </>
                ) : (
                  '전체'
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {records.length === 0 ? (
        <p className={styles.empty}>
          아직 꽂힌 애니가 없어요.
          <br />
          바다로 나가서 본 애니를 검색해 보세요.
        </p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>별점 {ratingFilter}점을 준 애니가 아직 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {shown.map((anime) => (
            <li key={anime.id}>
              <AnimeCard
                anime={anime}
                action={
                  <button
                    className={styles.rate}
                    type="button"
                    data-unrated={!anime.rating || undefined}
                    onClick={() => setEditingId(anime.id)}
                  >
                    {anime.rating ? '수정' : '별점 주기'}
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.credit}>작품 정보·이미지: AniList</p>

      {editing && (
        <ReviewSheet
          key={editing.id}
          anime={editing}
          submitLabel="저장하기"
          onSubmit={saveReview}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
