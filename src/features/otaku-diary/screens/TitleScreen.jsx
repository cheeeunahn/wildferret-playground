import { assetUrl } from '../assets';
import Submarine from '../components/Submarine';
import styles from './TitleScreen.module.css';

export default function TitleScreen({ onStart, disabled }) {
  const background = assetUrl('bg-title.jpg');

  return (
    <div
      className={styles.screen}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      <Submarine className={styles.submarine} />
      <div className={styles.titles}>
        <h1 className={styles.title}>내 덕후 다이어리</h1>
        <p className={styles.tagline}>본 애니만큼 깊어지는 바다</p>
      </div>
      <button className={styles.cta} type="button" onClick={onStart} disabled={disabled}>
        기록하기
      </button>
    </div>
  );
}
