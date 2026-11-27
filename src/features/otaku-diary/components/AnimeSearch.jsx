import { useState } from 'react';
import { titleIn } from '../domain/language';
import { useAnimeSearch } from '../hooks/useAnimeSearch';
import { useLanguage } from '../hooks/useLanguage';
import AnimeCard from './AnimeCard';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import styles from './AnimeSearch.module.css';

// Search bar with a results panel under it. `recordedIds` marks titles the
// user already has; `onPick` receives the chosen anime. `highlight` makes the
// bar glow on and off until the user starts typing.
export default function AnimeSearch({ onPick, recordedIds, autoFocus = false, highlight = false }) {
  const [query, setQuery] = useState('');
  const found = useAnimeSearch(query);
  const { status, error } = found;
  // With English chosen, a title found by its Korean name is listed, and
  // recorded, under AniList's.
  const { language } = useLanguage();
  const results = found.results.map((anime) => titleIn(language, anime, anime.aniListTitle));

  const pick = (anime) => {
    setQuery('');
    onPick(anime);
  };

  return (
    <div className={styles.search}>
      <label className={styles.bar} data-highlight={(highlight && !query) || undefined}>
        <Icon name="search" className={styles.icon} />
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
          <IconButton icon="close" label="검색어 지우기" variant="tonal" size="s" onClick={() => setQuery('')} />
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
                          <Chip accent={!recorded}>{recorded ? '기록됨' : '+ 기록'}</Chip>
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
