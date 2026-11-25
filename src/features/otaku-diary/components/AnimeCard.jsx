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

// One anime as a row: poster, title, year and format. `action` is whatever
// the caller wants at the right edge.
export default function AnimeCard({ anime, action }) {
  const meta = [anime.year, FORMAT_LABEL[anime.format] ?? anime.format]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={styles.card}>
      <Poster anime={anime} className={styles.poster} />
      <div className={styles.body}>
        <span className={styles.title}>{anime.title}</span>
        <span className={styles.meta}>{meta}</span>
      </div>
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
