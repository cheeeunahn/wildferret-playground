import { MAX_RATING } from '../domain/review';
import Icon from '../ui/Icon';
import styles from './Stars.module.css';

const VALUES = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

// A rating shown as five stars, read-only.
export default function Stars({ rating, className }) {
  return (
    <span
      className={`${styles.stars} ${className ?? ''}`}
      role="img"
      aria-label={`별점 ${rating}점`}
    >
      {VALUES.map((value) => (
        <span key={value} data-on={value <= rating || undefined} aria-hidden="true">
          <Icon name="star" />
        </span>
      ))}
    </span>
  );
}

// Five stars to tap. `value` is 0 until the user picks one.
export function StarInput({ value, onChange, disabled }) {
  return (
    <div className={styles.input} role="radiogroup" aria-label="별점">
      {VALUES.map((star) => (
        <button
          key={star}
          className={styles.star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star}점`}
          data-on={star <= value || undefined}
          disabled={disabled}
          onClick={() => onChange(star)}
        >
          <Icon name="star" />
        </button>
      ))}
    </div>
  );
}
