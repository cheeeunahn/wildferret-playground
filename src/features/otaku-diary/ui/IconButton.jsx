import Icon from './Icon';
import styles from './IconButton.module.css';

// A round button that is only an icon, so `label` (read out, never shown)
// is required. `variant`: outlined for a screen's header, tonal inside a
// sheet or field, scrim over a picture, plain (no fill) in a top bar. `size`: s, m or l.
export default function IconButton({ icon, label, variant = 'outlined', size = 'l', className, ...rest }) {
  return (
    <button
      className={`${styles.button} ${className ?? ''}`}
      type="button"
      aria-label={label}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
