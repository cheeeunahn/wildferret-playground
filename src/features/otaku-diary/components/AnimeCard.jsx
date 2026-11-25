import Stars from './Stars';
import styles from './AnimeCard.module.css';

const FORMAT_LABEL = {
  TV: 'TV',
  TV_SHORT: 'TV 단편',
  MOVIE: '극장판',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: '스페셜',
  MUSIC: '뮤직',
};

// One anime as a row: poster, title, year and format, plus the user's stars
// and comment when it has been rated. `action` is whatever the caller wants
// at the right edge. With `onOpen`, the poster and text become one button.
export default function AnimeCard({ anime, action, onOpen, showReview = true }) {
  const meta = [anime.year, FORMAT_LABEL[anime.format] ?? anime.format]
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
      <Poster anime={anime} className={styles.poster} />
      <span className={styles.body}>
        <span className={styles.title}>{anime.title}</span>
        <span className={styles.meta}>{meta}</span>
        {showReview && anime.rating > 0 && <Stars rating={anime.rating} className={styles.stars} />}
        {showReview && anime.comment && <span className={styles.comment}>{anime.comment}</span>}
      </span>
    </>
  );

  return (
    <div className={styles.card}>
      {onOpen ? (
        <button className={styles.open} type="button" onClick={onOpen} aria-label={`${anime.title} 작품 정보 보기`}>
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
