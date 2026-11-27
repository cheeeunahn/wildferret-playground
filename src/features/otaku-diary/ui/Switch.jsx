import styles from './Switch.module.css';

// An on/off setting that applies at once: a track with a knob that sits
// right when on. Name it with `aria-label` or `aria-labelledby`.
export default function Switch({ checked, onChange, ...rest }) {
  return (
    <button
      className={styles.switch}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      {...rest}
    />
  );
}
