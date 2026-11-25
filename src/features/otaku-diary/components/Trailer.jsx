import { useState } from 'react';
import { youtubeEmbedUrl, youtubeWatchUrl } from '../domain/details';
import { useMusicHold } from '../hooks/useSound';
import styles from './Trailer.module.css';

// A YouTube trailer, shown as its thumbnail until tapped so nothing loads
// from YouTube before the user asks. The background music pauses while the
// player is open. Some uploaders block embedding, so a plain link to YouTube
// is always offered too.
export default function Trailer({ trailer, title }) {
  const [playing, setPlaying] = useState(false);
  useMusicHold(playing);

  return (
    <div className={styles.trailer}>
      <div className={styles.frame}>
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(trailer.youtubeId)}
            title={`${title} 예고편`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            className={styles.cover}
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${title} 예고편 재생`}
          >
            <img src={trailer.thumbnail} alt="" loading="lazy" />
            <span className={styles.play} aria-hidden="true">
              ▶
            </span>
          </button>
        )}
      </div>
      <a className={styles.link} href={youtubeWatchUrl(trailer.youtubeId)} target="_blank" rel="noreferrer">
        YouTube에서 보기 ↗
      </a>
    </div>
  );
}
