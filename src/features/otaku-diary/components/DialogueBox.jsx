import { useTypewriter } from '../hooks/useTypewriter';
import { useSpokenLine } from '../hooks/useSound';
import Icon from '../ui/Icon';
import styles from './DialogueBox.module.css';

// Visual-novel text box. A tap finishes the line; a second tap calls
// `onAdvance`. `children` (an input, say) appear once the line is complete.
// `voice` is the id of the clip spoken with the line, if it has one.
export default function DialogueBox({ speaker, text, voice, onAdvance, children }) {
  const { shown, done, skip } = useTypewriter(text);
  useSpokenLine(voice);

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
        {done && onAdvance && <span className={styles.next}>
            <Icon name="dropDown" />
          </span>}
      </div>
      {done && children}
    </div>
  );
}
