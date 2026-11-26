import { useState } from 'react';
import { useAnimeSearch } from '../hooks/useAnimeSearch';
import AnimeCard from './AnimeCard';
import styles from './AnimeSearch.module.css';

// Search bar with a results panel under it. `recordedIds` marks titles the
// user already has; `onPick` receives the chosen anime. `highlight` makes the
// bar glow on and off until the user starts typing.
export default function AnimeSearch({ onPick, recordedIds, autoFocus = false, highlight = false }) {
  const [query, setQuery] = useState('');
  const { status, results, error } = useAnimeSearch(query);

  const pick = (anime) => {
    setQuery('');
    onPick(anime);
  };

  return (
    <div className={styles.search}>
      <label className={styles.bar} data-highlight={(highlight && !query) || undefined}>
        <span className={styles.icon} aria-hidden="true">🔍</span>
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="본 애니 검색 (한국어·영어 제목)"
          aria-label="애니 검색"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
        {query && (
          <button
            className={styles.clear}
            type="button"
            onClick={() => setQuery('')}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </label>

      {status !== 'idle' && (
        <div className={styles.panel}>
          {status === 'loading' && <p className={styles.note}>찾는 중…</p>}
          {status === 'error' && <p className={styles.note}>{error}</p>}
          {status === 'ready' && results.length === 0 && (
            <p className={styles.note}>검색 결과가 없어요. 다른 제목으로 찾아보세요.</p>
          )}
          {status === 'ready' && results.length > 0 && (
            <ul className={styles.list}>
              {results.map((anime) => {
                const recorded = recordedIds?.has(anime.id);
                return (
                  <li key={anime.id}>
                    <button
                      className={styles.row}
                      type="button"
                      disabled={recorded}
                      onClick={() => pick(anime)}
                    >
                      <AnimeCard
                        anime={anime}
                        action={
                          <span className={styles.add} data-recorded={recorded || undefined}>
                            {recorded ? '기록됨' : '+ 기록'}
                          </span>
                        }
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.credit}>작품 정보·이미지: AniList · 한국어 제목: TMDB</p>
        </div>
      )}
    </div>
  );
}
