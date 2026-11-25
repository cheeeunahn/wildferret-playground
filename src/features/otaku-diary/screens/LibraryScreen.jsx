import { useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import AnimeDetailSheet from '../components/AnimeDetailSheet';
import ReviewSheet from '../components/ReviewSheet';
import SoundToggle from '../components/SoundToggle';
import { NO_FILTER, applyFilter, filterOptions, isFiltering } from '../domain/filters';
import { MAX_RATING } from '../domain/review';
import { useAnimeFacets } from '../hooks/useAnimeFacets';
import styles from './LibraryScreen.module.css';

// Filter choices, best first. 0 means every record.
const RATING_FILTERS = [0, ...Array.from({ length: MAX_RATING }, (_, i) => MAX_RATING - i)];

// The bookshelf, opened: every anime the user has recorded, newest first,
// with its stars and comment. Tapping a row opens its details (synopsis,
// trailer, genres), and each row can be re-rated. The list can be narrowed
// by star rating, genre, studio and format, all at once.
export default function LibraryScreen({ diary, onBack }) {
  const { records } = diary;
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState(NO_FILTER);
  const setOne = (name, value) => setFilter((current) => ({ ...current, [name]: value }));
  // Genre and studio come from AniList; they load after the list shows.
  const { status: facetStatus, facets } = useAnimeFacets(records);
  const options = filterOptions(records, facets);
  const shown = applyFilter(records, facets, filter);
  const editing = records.find((r) => r.id === editingId);
  const open = records.find((r) => r.id === openId);

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
                aria-pressed={rating === filter.rating}
                aria-label={rating ? `별점 ${rating}점만 보기` : '전체 보기'}
                onClick={() => setOne('rating', rating)}
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
        {records.length > 0 && (
          <div className={styles.filters} role="group" aria-label="장르, 제작사, 형식으로 걸러 보기">
            <FilterSelect
              label="장르"
              value={filter.genre}
              options={options.genres}
              loading={facetStatus === 'loading'}
              onChange={(value) => setOne('genre', value)}
            />
            <FilterSelect
              label="제작사"
              value={filter.studio}
              options={options.studios}
              loading={facetStatus === 'loading'}
              onChange={(value) => setOne('studio', value)}
            />
            <FilterSelect
              label="형식"
              value={filter.format}
              options={options.formats}
              onChange={(value) => setOne('format', value)}
            />
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
        <p className={styles.empty}>
          고른 조건에 맞는 애니가 없어요.
          <br />
          <button className={styles.clear} type="button" onClick={() => setFilter(NO_FILTER)}>
            조건 지우기
          </button>
        </p>
      ) : (
        <ul className={styles.list}>
          {isFiltering(filter) && (
            <li className={styles.summary}>
              {records.length}편 중 {shown.length}편
              <button className={styles.clear} type="button" onClick={() => setFilter(NO_FILTER)}>
                조건 지우기
              </button>
            </li>
          )}
          {shown.map((anime) => (
            <li key={anime.id}>
              <AnimeCard
                anime={anime}
                onOpen={() => setOpenId(anime.id)}
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

      {open && (
        <AnimeDetailSheet
          key={open.id}
          anime={open}
          onEditReview={() => setEditingId(open.id)}
          onClose={() => setOpenId(null)}
        />
      )}
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

// One dropdown filter, drawn as a chip. The first choice means "any". It is
// switched off while its choices load, or when the bookshelf offers none.
function FilterSelect({ label, value, options, loading, onChange }) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={options.length === 0}
      aria-label={label}
      data-on={value ? true : undefined}
    >
      <option value="">{loading && options.length === 0 ? `${label}…` : `${label} 전체`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} ({option.count})
        </option>
      ))}
    </select>
  );
}
