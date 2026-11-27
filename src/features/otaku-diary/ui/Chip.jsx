import styles from './Chip.module.css';

// A small rounded label. With `onClick` it is a button: a toggle that can be
// pressed in when `selected` is given (true or false), or a plain action
// (removing an applied filter) when it is not. Without `onClick` it only
// names something. `accent` tints it pink; `grow` shares a row's width
// equally between chips.
export default function Chip({ selected, accent, grow = false, onClick, children, ...rest }) {
  if (!onClick) {
    return (
      <span className={styles.chip} data-accent={accent || undefined} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <button
      className={styles.chip}
      type="button"
      aria-pressed={selected === undefined ? undefined : Boolean(selected)}
      data-accent={accent || undefined}
      data-grow={grow || undefined}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
