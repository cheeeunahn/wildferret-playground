import { useId } from 'react';
import { SheetActions } from './Sheet';
import styles from './Dialog.module.css';

// A small box in the middle of the phone that must be answered: for a
// question whose answer cannot be undone. It sits above any open sheet.
//
// `title` is the question; the children explain it. `actions` are its
// buttons (the safe one first). `onClose` runs on a tap outside or Escape,
// unless `busy`.
export default function Dialog({ title, children, actions, onClose, busy = false }) {
  const id = useId();
  return (
    <div className={styles.scrim} onClick={busy ? undefined : onClose}>
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
      >
        <h2 id={`${id}-title`} className={styles.title}>
          {title}
        </h2>
        <div id={`${id}-body`} className={styles.body}>
          {children}
        </div>
        <SheetActions>{actions}</SheetActions>
      </section>
    </div>
  );
}
