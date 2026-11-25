import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { voiceUrl } from '../assets';
import themeUrl from '../assets/music/sparkling-seaside-adventure.mp3';

// All the app's sound in one place: 코토리's voice, the background music, and
// one on/off setting for both, shared by every screen and remembered.
//
// The music sits well under the voice and dips further while she speaks, so
// her lines always stand out.

const MUTED_KEY = 'otaku-diary:muted';
const MUSIC_VOLUME = 0.2;
const MUSIC_UNDER_VOICE = 0.07;
const FADE_MS = 400;

const listeners = new Set();
let voice = null;
let music = null;
let musicWanted = false;
let muted = false;
try {
  muted = localStorage.getItem(MUTED_KEY) === '1';
} catch {
  // No storage: sound stays on for this visit.
}

// Moves the music's volume to `target` over FADE_MS.
let fadeTimer = null;
function fadeMusic(target) {
  if (!music) return;
  clearInterval(fadeTimer);
  const start = music.volume;
  const startedAt = performance.now();
  fadeTimer = setInterval(() => {
    const t = Math.min((performance.now() - startedAt) / FADE_MS, 1);
    music.volume = start + (target - start) * t;
    if (t === 1) clearInterval(fadeTimer);
  }, 30);
}

function startMusic() {
  if (muted) return;
  if (!music) {
    music = new Audio(themeUrl);
    music.loop = true;
    music.volume = 0;
  }
  // Browsers refuse sound before the first tap; it starts on a later one.
  music.play().then(
    () => fadeMusic(voice ? MUSIC_UNDER_VOICE : MUSIC_VOLUME),
    () => {},
  );
}

function pauseMusic() {
  clearInterval(fadeTimer);
  music?.pause();
}

function stopVoice() {
  voice?.pause();
  voice = null;
  fadeMusic(MUSIC_VOLUME);
}

// Returns the playing clip, or null when the line is silent (no clip, or
// sound is off), so a caller can wait for it to end.
function playVoice(id) {
  stopVoice();
  const url = id && voiceUrl(id);
  if (!url || muted) return null;
  const audio = new Audio(url);
  voice = audio;
  fadeMusic(MUSIC_UNDER_VOICE);
  const done = () => {
    if (voice === audio) stopVoice();
  };
  audio.addEventListener('ended', done);
  audio.addEventListener('error', done);
  // A refused clip is reported as an error, so anyone waiting for it to end
  // moves on.
  audio.play().catch(() => audio.dispatchEvent(new Event('error')));
  return audio;
}

function setMuted(next) {
  muted = next;
  if (muted) {
    stopVoice();
    pauseMusic();
  } else if (musicWanted) {
    startMusic();
  }
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

// The shared on/off setting.
export function useMuted() {
  const isMuted = useSyncExternalStore(subscribe, () => muted);
  const toggleMuted = useCallback(() => setMuted(!muted), []);
  return { muted: isMuted, toggleMuted };
}

// `play(id)` speaks a line from domain/voiceLines.js; lines without a clip
// are silent.
export function useVoice() {
  return { play: playVoice, stop: stopVoice, ...useMuted() };
}

// Speaks `id` when it appears and stops when it goes away.
export function useSpokenLine(id) {
  useEffect(() => {
    playVoice(id);
    return stopVoice;
  }, [id]);
}

// Plays the background music while `on` is true.
export function useMusic(on) {
  useEffect(() => {
    musicWanted = on;
    if (on) startMusic();
    else pauseMusic();
  }, [on]);
}
