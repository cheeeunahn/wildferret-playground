import styles from './TextField.module.css';

// A framed text input. With `label` it is a labelled field, with the label
// above and an optional `hint` below; `labelEnd` sits at the label's right
// (a character count). Without a label, give it an `aria-label`.
// `multiline` makes it a <textarea>. Everything else, `ref` included, goes
// to the input.
export default function TextField({ label, labelEnd, hint, multiline = false, className, ...rest }) {
  const Input = multiline ? 'textarea' : 'input';
  const input = <Input className={`${styles.input} ${className ?? ''}`} data-multiline={multiline || undefined} {...rest} />;
  if (!label) return input;
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {labelEnd && <span className={styles.labelEnd}>{labelEnd}</span>}
      </span>
      {input}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
