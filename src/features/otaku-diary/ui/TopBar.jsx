import IconButton from './IconButton';
import styles from './TopBar.module.css';

// The bar across the top of a screen you can leave: a back button at the
// left, the screen's name in the middle, and room at the right for one
// action (`end`). `onBack` and `backLabel` (read out, e.g. "바다로
// 돌아가기") make the back button; without `onBack` there is none.
// `overlay` lays the bar over a full-screen picture instead of above it.
// Inside a screen's own header (one that also holds filters, say) pass a
// `className` to drop the bar's background and let the header's show.
export default function TopBar({ title, onBack, backLabel = '뒤로', end, overlay = false, className }) {
  return (
    <header className={`${styles.bar} ${className ?? ''}`} data-overlay={overlay || undefined}>
      <div className={styles.side}>
        {onBack && <IconButton icon="back" label={backLabel} variant="plain" onClick={onBack} />}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.side} data-end>
        {end}
      </div>
    </header>
  );
}
