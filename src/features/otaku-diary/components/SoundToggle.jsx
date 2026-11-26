import { useMuted } from '../hooks/useSound';
import styles from './SoundToggle.module.css';

// Turns all sound (voice and music) on or off. The label says how things are
// now: SOUND ON while sound plays.
export default function SoundToggle({ className }) {
  const { muted, toggleMuted } = useMuted();
  return (
    <button
      className={`${styles.toggle} ${className ?? ''}`}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleMuted();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      aria-pressed={!muted}
      data-muted={muted || undefined}
    >
      {muted ? 'SOUND OFF' : 'SOUND ON'}
    </button>
  );
}
