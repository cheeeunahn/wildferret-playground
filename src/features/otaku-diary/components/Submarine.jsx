import { assetUrl } from '../assets';
import styles from './Submarine.module.css';

// The submarine on its own; SeaScene decides where it sits.
export default function Submarine({ className }) {
  const src = assetUrl('submarine.png');
  return (
    <div className={`${styles.submarine} ${className ?? ''}`}>
      {src ? (
        <img src={src} alt="잠수함" draggable={false} />
      ) : (
        <svg viewBox="0 0 300 200" role="img" aria-label="잠수함">
          <rect x="120" y="30" width="60" height="50" rx="12" fill="#ffd3e2" />
          <rect x="146" y="6" width="8" height="30" fill="#33486e" />
          <ellipse cx="150" cy="125" rx="130" ry="58" fill="#fff6ee" stroke="#33486e" strokeWidth="5" />
          <circle cx="150" cy="122" r="30" fill="#bfe9ff" stroke="#ff8fb8" strokeWidth="8" />
        </svg>
      )}
    </div>
  );
}
