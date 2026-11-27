import { useSyncExternalStore } from 'react';
import { DEFAULT_LANGUAGE, isLanguage } from '../domain/language';

// The language setting for anime information (domain/language.js), shared by
// every screen and remembered in this browser.

const LANGUAGE_KEY = 'otaku-diary:language';

const listeners = new Set();
let language = DEFAULT_LANGUAGE;
try {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (isLanguage(saved)) language = saved;
} catch {
  // No storage: Korean for this visit.
}

function setLanguage(next) {
  if (!isLanguage(next)) return;
  language = next;
  try {
    localStorage.setItem(LANGUAGE_KEY, next);
  } catch {
    // Not remembered, but it still applies now.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useLanguage() {
  return { language: useSyncExternalStore(subscribe, () => language), setLanguage };
}
