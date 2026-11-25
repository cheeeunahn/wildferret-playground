import { useTypewriter } from '../hooks/useTypewriter';
import { useSpokenLine, useVoice } from '../hooks/useVoice';
import styles from './DialogueBox.module.css';

// Visual-novel text box. A tap finishes the line; a second tap calls
// `onAdvance`. `children` (an input, say) appear once the line is complete.
// `voice` is the id of the clip spoken with the line, if it has one.
export default function DialogueBox({ speaker, text, voice, onAdvance, children }) {
  const { shown, done, skip } = useTypewriter(text);
  const { muted, toggleMuted } = useVoice();
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
        <button
          className={styles.sound}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMuted();
          }}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={muted ? '목소리 켜기' : '목소리 끄기'}
          aria-pressed={!muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>
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
