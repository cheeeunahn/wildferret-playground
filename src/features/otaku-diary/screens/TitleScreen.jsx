import { assetUrl } from '../assets';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './TitleScreen.module.css';

// `error` is shown in place of the tagline when the diary could not be
// loaded, and the button retries instead of starting.
export default function TitleScreen({ onStart, disabled, error, onRetry }) {
  const background = assetUrl('bg-title.jpg');
  const kotori = assetUrl('kotori-neutral.png');

  return (
    <div
      className={styles.screen}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {kotori && (
        <img className={styles.kotori} src={kotori} alt={GUIDE_NAME} draggable={false} />
      )}
      <div className={styles.panel}>
        <h1 className={styles.title}>애니와 함께하는 바다모험</h1>
        {error ? (
          <p className={styles.tagline} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.tagline}>지금까지 본 애니메이션을 기록해보아요</p>
        )}
        {error ? (
          <button className={styles.cta} type="button" onClick={onRetry}>
            다시 시도
          </button>
        ) : (
          <button className={styles.cta} type="button" onClick={onStart} disabled={disabled}>
            기록하기
          </button>
        )}
      </div>
    </div>
  );
}
