import { useEffect, useRef } from 'react';

const HOLD_MS = 450;
// A finger that travels this far is scrolling, not holding.
const SLOP_PX = 10;

// Press-and-hold, as on a phone's list. Returns `press(value)`: the handlers
// to spread on an element, which call `onLongPress(value)` once the pointer
// has stayed down on it. The click that ends such a press is swallowed, so
// the element's own tap action does not fire as well.
export function useLongPress(onLongPress) {
  const timer = useRef(null);
  const origin = useRef(null);
  const fired = useRef(false);
  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);

  return (value) => ({
    onPointerDown: (e) => {
      if (e.button) return; // Only the main button; right-click keeps its menu.
      cancel();
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        fired.current = true;
        navigator.vibrate?.(10);
        onLongPress(value);
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      if (!timer.current) return;
      if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > SLOP_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClickCapture: (e) => {
      if (!fired.current) return;
      fired.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
    // Holding a finger down also asks the browser for its own menu.
    onContextMenu: (e) => {
      if (timer.current || fired.current) e.preventDefault();
    },
  });
}
