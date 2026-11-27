import Icon from '../ui/Icon';
import Stars from './Stars';
import styles from './PosterTile.module.css';

// One anime in the bookshelf's poster grid: the poster, then its title (two
// lines at most) and the user's stars. Without a poster the box shows the
// anime's main colour. `onOpen`, `press` and `selected` work as in AnimeCard.
export default function PosterTile({ anime, onOpen, press, selected }) {
  const selecting = selected !== undefined;
  return (
    <button
      className={styles.tile}
      type="button"
      onClick={onOpen}
      aria-pressed={selecting ? selected : undefined}
      aria-label={selecting ? `${anime.title} 선택` : `${anime.title} 작품 정보 보기`}
      {...press}
    >
      <span className={styles.poster} style={anime.color ? { backgroundColor: anime.color } : undefined}>
        {anime.cover && (
          <img
            src={anime.cover}
            alt=""
            loading="lazy"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {selecting && (
          <span className={styles.check} data-on={selected || undefined}>
            {selected && <Icon name="check" />}
          </span>
        )}
      </span>
      <span className={styles.title}>{anime.title}</span>
      {anime.rating > 0 ? (
        <Stars rating={anime.rating} className={styles.stars} />
      ) : (
        <span className={styles.unrated}>별점 없음</span>
      )}
    </button>
  );
}
