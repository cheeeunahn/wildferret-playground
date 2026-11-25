import { useEffect } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
import styles from './DialogueBox.module.css';

// Visual-novel text box. A tap finishes the line; a second tap calls
// `onAdvance`. `children` (an input, say) appear once the line is complete.
export default function DialogueBox({ speaker, text, onAdvance, onTypingChange, children }) {
  const { shown, done, skip } = useTypewriter(text);

  // Lets the caller know when the line has finished typing.
  useEffect(() => {
    onTypingChange?.(!done);
  }, [done, onTypingChange]);

  const handleTap = () => {
    if (!done) skip();
    else onAdvance?.();
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.box}
        onClick={handleTap}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTap()}
        role="button"
        tabIndex={0}
        aria-label={text}
      >
        <span className={styles.speaker}>{speaker}</span>
        {/* The full line holds the box's height; the typed part sits on top. */}
        <p className={styles.text} aria-hidden="true">
          <span className={styles.ghost}>{text}</span>
          <span className={styles.typed}>{shown}</span>
        </p>
        {done && onAdvance && <span className={styles.next}>▼</span>}
      </div>
      {done && children}
    </div>
  );
}
