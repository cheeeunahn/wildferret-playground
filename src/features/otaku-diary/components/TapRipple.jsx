import { useEffect, useRef, useState } from 'react';
import styles from './TapRipple.module.css';

// How long one ripple lives. Matches the animations in the CSS.
const RIPPLE_MS = 600;
// Fast tapping keeps only the newest few on screen.
const MAX_RIPPLES = 6;
const SPARKS = [0, 1, 2, 3, 4];
// A dragged finger leaves a dot of light each time it has gone this far.
const TRAIL_STEP_PX = 12;
// Every few dots, a spark drifts off the trail.
const TRAIL_SPARK_EVERY = 3;

// A ring, a soft glow and a few sparks wherever the user taps, and a trail
// of light behind a finger that drags. It listens on its parent (the phone
// frame), draws above everything, and never takes a tap itself. People who
// ask for less motion get none.
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
      trail = { pointerId: event.pointerId, x: ripple.x, y: ripple.y, count: 0 };
    };

    // The trail is drawn straight into the layer rather than through React
    // state: a drag makes dozens of dots a second, and each removes itself
    // when its animation ends.
    let trail = null;
    const layer = layerRef.current;
    const addTrail = (className, x, y) => {
      const dot = document.createElement('span');
      dot.className = className;
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
      layer.append(dot);
      return dot;
    };
    const onPointerMove = (event) => {
      if (!trail || event.pointerId !== trail.pointerId) return;
      const box = frame.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const distance = Math.hypot(x - trail.x, y - trail.y);
      if (distance < TRAIL_STEP_PX) return;
      // A fast drag skips pixels between events; fill the gap evenly.
      const steps = Math.min(Math.floor(distance / TRAIL_STEP_PX), 8);
      for (let step = 1; step <= steps; step += 1) {
        const px = trail.x + ((x - trail.x) * step) / steps;
        const py = trail.y + ((y - trail.y) * step) / steps;
        addTrail(styles.trail, px, py);
        trail.count += 1;
        if (trail.count % TRAIL_SPARK_EVERY === 0) {
          const spark = addTrail(styles.trailSpark, px, py);
          spark.style.setProperty('--dx', `${Math.round(Math.random() * 36 - 18)}px`);
          spark.style.setProperty('--dy', `${Math.round(Math.random() * 36 - 18)}px`);
        }
      }
      trail.x = x;
      trail.y = y;
    };
    // Also ends when the browser takes the touch over to scroll the page.
    const endTrail = (event) => {
      if (trail && event.pointerId === trail.pointerId) trail = null;
    };

    // Capture, so taps that a button stops from bubbling still ripple.
    frame.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    frame.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
    window.addEventListener('pointerup', endTrail, { passive: true });
    window.addEventListener('pointercancel', endTrail, { passive: true });
    return () => {
      frame.removeEventListener('pointerdown', onPointerDown, { capture: true });
      frame.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('pointerup', endTrail);
      window.removeEventListener('pointercancel', endTrail);
      layer.querySelectorAll(`.${styles.trail}, .${styles.trailSpark}`).forEach((dot) => dot.remove());
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
