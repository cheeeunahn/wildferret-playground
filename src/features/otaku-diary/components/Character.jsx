import { assetUrl } from '../assets';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './Character.module.css';

// The guide's standing sprite. All drawings share one canvas, so swapping
// the image does not move her.
export default function Character({ expression = 'neutral', size = 'full' }) {
  const src =
    assetUrl(`kotori-${expression}.png`) ?? assetUrl('kotori-neutral.png');

  return (
    <div className={styles.character} data-size={size}>
      {src ? (
        <img className={styles.sprite} src={src} alt={GUIDE_NAME} draggable={false} />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={GUIDE_NAME} />
      )}
    </div>
  );
}
