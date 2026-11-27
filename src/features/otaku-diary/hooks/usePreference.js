import { useCallback, useState } from 'react';

// A small choice remembered in this browser, such as how the bookshelf is
// laid out. `isValid` checks what was stored, so an old or edited value
// falls back to `fallback`. Without storage it lasts for this visit only.
export function usePreference(key, fallback, isValid) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null && isValid(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });
  const remember = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Not remembered, but it still applies now.
      }
    },
    [key],
  );
  return [value, remember];
}
