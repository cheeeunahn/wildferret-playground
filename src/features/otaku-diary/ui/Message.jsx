import styles from './Message.module.css';

// A line of text under a form. `tone` "error" is announced as it appears
// and is for something that went wrong; "note" explains, quietly.
export default function Message({ tone = 'note', children }) {
  return (
    <p className={styles.message} data-tone={tone} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </p>
  );
}
