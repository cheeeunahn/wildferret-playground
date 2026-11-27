import { formatLabel } from '../domain/format';
import Stars from './Stars';
import styles from './AnimeCard.module.css';

// One anime as a row: poster, title, year and format, plus the user's stars
// and comment when it has been rated. `action` is whatever the caller wants
// at the right edge. With `onOpen`, the poster and text become one button;
// `press` is extra handlers for it (a long press, say). While the list is in
// selection mode `selected` is true or false, and the row shows a check mark
// and acts as a toggle; otherwise leave it undefined. `size` "l" is the
// bookshelf's reading list: a bigger poster, the `studio` in the meta line,
// and the comment set as a quote.
export default function AnimeCard({ anime, action, onOpen, press, selected, showReview = true, size = 'm', studio }) {
  const selecting = selected !== undefined;
  const large = size === 'l';
  const meta = [anime.year, formatLabel(anime.format), large && studio]
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
      {selecting && <span className={styles.check} data-on={selected || undefined} aria-hidden="true" />}
      <Poster anime={anime} className={styles.poster} />
      <span className={styles.body}>
        <span className={styles.title}>{anime.title}</span>
        <span className={styles.meta}>{meta}</span>
        {showReview && anime.rating > 0 && <Stars rating={anime.rating} className={styles.stars} />}
        {showReview && anime.comment && (
          <span className={styles.comment}>{large ? `“${anime.comment}”` : anime.comment}</span>
        )}
      </span>
    </>
  );

  return (
    <div className={styles.card} data-size={size}>
      {onOpen ? (
        <button
          className={styles.open}
          type="button"
          onClick={onOpen}
          aria-pressed={selecting ? selected : undefined}
          aria-label={selecting ? `${anime.title} 선택` : `${anime.title} 작품 정보 보기`}
          {...press}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {action}
    </div>
  );
}

// The poster's main colour sits behind the image, so a poster that fails to
// load still leaves a coloured card.
export function Poster({ anime, className }) {
  return (
    <span className={className} style={{ backgroundColor: anime.color ?? '#b9c6dd' }}>
      {anime.cover && (
        <img
          src={anime.cover}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </span>
  );
}
