import styles from './Sheet.module.css';

// A sheet that rises from the bottom of the phone over a scrim: the diary's
// way of asking for input or showing detail without leaving the screen.
//
// `label` names it for screen readers. `onClose` runs on a tap outside or
// Escape, unless `busy` (a request is out). With `onSubmit` the sheet is a
// <form>. `flush` drops the padding, for content that runs to the edges.
// Buttons at the foot go in <SheetActions>.
export default function Sheet({ label, onClose, busy = false, onSubmit, flush = false, className, children }) {
  const Tag = onSubmit ? 'form' : 'section';
  return (
    <div className={styles.scrim} onClick={busy ? undefined : onClose}>
      <Tag
        className={`${styles.sheet} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-flush={flush || undefined}
        // Focusable, so Escape still closes it after a tap on plain text.
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
        onSubmit={onSubmit}
      >
        {children}
      </Tag>
    </div>
  );
}

// The row of buttons at the foot of a sheet or dialog: the quiet one first,
// the main one after it, taking the rest of the width.
export function SheetActions({ children }) {
  return <div className={styles.actions}>{children}</div>;
}
