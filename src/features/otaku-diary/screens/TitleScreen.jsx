import { assetUrl } from '../assets';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './TitleScreen.module.css';

export default function TitleScreen({ onStart, disabled }) {
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
        <p className={styles.tagline}>지금까지 본 애니메이션을 기록해보아요</p>
        <button className={styles.cta} type="button" onClick={onStart} disabled={disabled}>
          기록하기
        </button>
      </div>
    </div>
  );
}
