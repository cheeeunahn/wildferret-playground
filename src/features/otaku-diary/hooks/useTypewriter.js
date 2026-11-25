import { useEffect, useMemo, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Reveals `text` one character at a time. `skip` shows the rest at once.
export function useTypewriter(text, charsPerSecond = 26) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [typed, setTyped] = useState({ text, count: 0 });
  // A new line starts from zero without waiting for an effect.
  const count = typed.text === text ? typed.count : 0;
  const total = chars.length;

  useEffect(() => {
    if (count >= total) return undefined;
    if (prefersReducedMotion()) {
      setTyped({ text, count: total });
      return undefined;
    }
    const timer = setTimeout(
      () => setTyped({ text, count: count + 1 }),
      1000 / charsPerSecond,
    );
    return () => clearTimeout(timer);
  }, [text, count, total, charsPerSecond]);

  return {
    shown: chars.slice(0, count).join(''),
    done: count >= total,
    skip: () => setTyped({ text, count: total }),
  };
}
