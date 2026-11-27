import { useMuted } from '../hooks/useSound';
import Button from '../ui/Button';
import styles from './SoundToggle.module.css';

// Turns all sound (voice and music) on or off, where the settings sheet is
// not in reach (onboarding). The label says how things are now: SOUND ON
// while sound plays.
export default function SoundToggle({ className }) {
  const { muted, toggleMuted } = useMuted();
  return (
    <Button
      className={`${styles.toggle} ${className ?? ''}`}
      variant="outlined"
      size="s"
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
    </Button>
  );
}
