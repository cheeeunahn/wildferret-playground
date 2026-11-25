import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { voiceUrl } from '../assets';

// One voice for the whole app: a new line cuts off the one before it, and
// the sound setting is shared by every screen and remembered.

const MUTED_KEY = 'otaku-diary:muted';
const listeners = new Set();
let current = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTED_KEY) === '1';
} catch {
  // No storage: sound stays on for this visit.
}

function stop() {
  current?.pause();
  current = null;
}

// Returns the playing clip, or null when the line is silent (no clip, or
// sound is off), so a caller can wait for it to end.
function play(id) {
  stop();
  const url = id && voiceUrl(id);
  if (!url || muted) return null;
  const audio = new Audio(url);
  current = audio;
  // Browsers refuse sound before the first tap; a silent line is fine. It is
  // reported as an error on the clip, so anyone waiting for it to end moves on.
  audio.play().catch(() => audio.dispatchEvent(new Event('error')));
  return audio;
}

function setMuted(next) {
  muted = next;
  if (muted) stop();
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // Not remembered, but it still applies now.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

// `play(id)` speaks a line from domain/voiceLines.js; lines without a clip
// are silent.
export function useVoice() {
  const isMuted = useSyncExternalStore(subscribe, () => muted);
  const toggleMuted = useCallback(() => setMuted(!muted), []);
  return { play, stop, muted: isMuted, toggleMuted };
}

// Speaks `id` when it appears and stops when it goes away.
export function useSpokenLine(id) {
  useEffect(() => {
    play(id);
    return stop;
  }, [id]);
}
