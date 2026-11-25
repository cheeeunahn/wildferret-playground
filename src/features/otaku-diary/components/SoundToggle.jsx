import { useMuted } from '../hooks/useSound';
import styles from './SoundToggle.module.css';

// Turns all sound (voice and music) on or off.
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
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
