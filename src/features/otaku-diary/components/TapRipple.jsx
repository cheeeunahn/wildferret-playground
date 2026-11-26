import { useEffect, useRef, useState } from 'react';
import styles from './TapRipple.module.css';

// How long one ripple lives. Matches the animations in the CSS.
const RIPPLE_MS = 600;
// Fast tapping keeps only the newest few on screen.
const MAX_RIPPLES = 6;
const SPARKS = [0, 1, 2, 3, 4];

// A ring, a soft glow and a few sparks wherever the user taps. It listens on
// its parent (the phone frame), draws above everything, and never takes a
// tap itself. People who ask for less motion get none.
export default function TapRipple() {
  const layerRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const frame = layerRef.current?.parentElement;
    if (!frame) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let nextId = 0;
    const timers = new Set();
    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const box = frame.getBoundingClientRect();
      const ripple = {
        id: (nextId += 1),
        x: event.clientX - box.left,
        y: event.clientY - box.top,
        // Each tap throws its sparks a different way.
        turn: Math.round(Math.random() * 360),
      };
      setRipples((current) => [...current.slice(1 - MAX_RIPPLES), ripple]);
      const timer = setTimeout(() => {
        timers.delete(timer);
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, RIPPLE_MS);
      timers.add(timer);
    };

    // Capture, so taps that a button stops from bubbling still ripple.
    frame.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    return () => {
      frame.removeEventListener('pointerdown', onPointerDown, { capture: true });
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{ left: ripple.x, top: ripple.y, '--turn': `${ripple.turn}deg` }}
        >
          <span className={styles.glow} />
          <span className={styles.ring} />
          <span className={styles.ringThin} />
          {SPARKS.map((spark) => (
            <span key={spark} className={styles.spark} style={{ '--i': spark }} />
          ))}
        </span>
      ))}
    </div>
  );
}
