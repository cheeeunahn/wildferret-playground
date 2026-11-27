import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { voiceUrl } from '../assets';
import themeUrl from '../assets/music/sparkling-seaside-adventure.mp3';

// All the app's sound in one place: 코토리's voice, the background music, one
// on/off setting for both and a volume for each, shared by every screen and
// remembered.
//
// The music sits well under the voice and dips further while she speaks, so
// her lines always stand out.

const MUTED_KEY = 'otaku-diary:muted';
const LEVELS_KEY = 'otaku-diary:volume';
// The music with its slider at the top, and while 코토리 speaks. The user's
// music level (0 to 1) scales both. Sliders start in the middle, where the
// music is a quiet 0.2 and there is room to turn it up.
const MUSIC_VOLUME = 0.4;
const MUSIC_UNDER_VOICE = 0.14;
const DEFAULT_LEVEL = 0.5;
const FADE_MS = 400;

const listeners = new Set();
let voice = null;
let music = null;
let musicWanted = false;
// Something else is playing sound (a trailer), so the music waits.
let musicHolds = 0;
let muted = false;
try {
  muted = localStorage.getItem(MUTED_KEY) === '1';
} catch {
  // No storage: sound stays on for this visit.
}

const clamp = (level) => (Number.isFinite(level) ? Math.min(Math.max(level, 0), 1) : DEFAULT_LEVEL);
// How loud the user wants each kind of sound, 0 to 1. Replaced, never
// changed in place, so React can tell when it is new.
let levels = { music: DEFAULT_LEVEL, voice: DEFAULT_LEVEL };
try {
  const saved = JSON.parse(localStorage.getItem(LEVELS_KEY) ?? 'null');
  if (saved) levels = { music: clamp(saved.music), voice: clamp(saved.voice) };
} catch {
  // The default levels for this visit.
}
const musicVolume = () => (voice ? MUSIC_UNDER_VOICE : MUSIC_VOLUME) * levels.music;

// Moves the music's volume to where it should be now, over FADE_MS.
let fadeTimer = null;
function fadeMusic() {
  if (!music) return;
  clearInterval(fadeTimer);
  const target = musicVolume();
  const start = music.volume;
  const startedAt = performance.now();
  fadeTimer = setInterval(() => {
    const t = Math.min((performance.now() - startedAt) / FADE_MS, 1);
    music.volume = start + (target - start) * t;
    if (t === 1) clearInterval(fadeTimer);
  }, 30);
}

function startMusic() {
  if (muted || musicHolds > 0) return;
  if (!music) {
    music = new Audio(themeUrl);
    music.loop = true;
    music.volume = 0;
  }
  // Browsers refuse sound before the first tap or key press on the page. A
  // returning visitor lands on the sea without either, so the music waits
  // for one and starts then.
  music.play().then(
    () => fadeMusic(),
    () => startMusicOnFirstTouch(),
  );
}

let waitingForTouch = false;
function startMusicOnFirstTouch() {
  if (waitingForTouch) return;
  waitingForTouch = true;
  const start = () => {
    waitingForTouch = false;
    document.removeEventListener('pointerdown', start, true);
    document.removeEventListener('keydown', start, true);
    if (musicWanted) startMusic();
  };
  document.addEventListener('pointerdown', start, true);
  document.addEventListener('keydown', start, true);
}

function pauseMusic() {
  clearInterval(fadeTimer);
  music?.pause();
}

function stopVoice() {
  voice?.pause();
  voice = null;
  fadeMusic();
}

// Returns the playing clip, or null when the line is silent (no clip, or
// sound is off), so a caller can wait for it to end.
function playVoice(id) {
  stopVoice();
  const url = id && voiceUrl(id);
  if (!url || muted) return null;
  const audio = new Audio(url);
  audio.volume = levels.voice;
  voice = audio;
  fadeMusic();
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

// Applies at once, so a slider is heard while it is dragged.
function setLevel(kind, level) {
  levels = { ...levels, [kind]: clamp(level) };
  if (voice) voice.volume = levels.voice;
  if (music) {
    clearInterval(fadeTimer);
    music.volume = musicVolume();
  }
  try {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
  } catch {
    // Not remembered, but it still applies now.
  }
  listeners.forEach((notify) => notify());
}

// When this file is edited under `pnpm dev`, a fresh copy of it takes over
// with no music of its own. The old copy's music would play on with nothing
// left to switch it off, so it is stopped here.
import.meta.hot?.dispose(() => {
  clearInterval(fadeTimer);
  voice?.pause();
  music?.pause();
});

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

// The volume of the music and of 코토리's voice, each 0 to 1.
// `setLevel('music' | 'voice', level)` changes one.
export function useSoundLevels() {
  return { levels: useSyncExternalStore(subscribe, () => levels), setLevel };
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

// Pauses the music, and stops 코토리 mid-line, while `on` is true, for
// another sound source such as a trailer. The music comes back afterwards
// if the screen still wants it.
export function useMusicHold(on) {
  useEffect(() => {
    if (!on) return undefined;
    musicHolds += 1;
    stopVoice();
    pauseMusic();
    return () => {
      musicHolds -= 1;
      if (musicWanted) startMusic();
    };
  }, [on]);
}
