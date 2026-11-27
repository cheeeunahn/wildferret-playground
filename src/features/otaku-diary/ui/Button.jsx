import styles from './Button.module.css';

// The diary's button. `variant` says how much it asks for attention:
//   filled    the one main action of a screen or sheet
//   tonal     the quiet partner beside it (취소)
//   outlined  a standalone action in a header or on a surface
//   text      an inline action that should not look like a box
//   danger    a filled action that deletes for good
//   dangerText  the same, where it must stay quiet until chosen
// `size` is s (headers, rows), m (dialogs) or l (the foot of a sheet).
// `grow` lets it take the free width of its row. Everything else goes to
// the <button>; `type` defaults to "button" so it never submits by accident.
export default function Button({ variant = 'filled', size = 'm', grow = false, className, type = 'button', ...rest }) {
  return (
    <button
      className={`${styles.button} ${className ?? ''}`}
      type={type}
      data-variant={variant}
      data-size={size}
      data-grow={grow || undefined}
      {...rest}
    />
  );
}
