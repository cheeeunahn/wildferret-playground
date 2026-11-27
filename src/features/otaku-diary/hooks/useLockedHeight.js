import { useLayoutEffect, useRef } from 'react';

const isTyping = () => {
  const el = document.activeElement;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
};

// Keeps the screen at its full height while the on-screen keyboard is up.
// Some mobile browsers and in-app webviews shrink the viewport for the
// keyboard, which would squash every screen sized from it. The height is
// written to --app-height on the returned ref's element, and height-only
// resizes are ignored while a text field has focus, so the browser scrolls
// the field into view instead.
export function useLockedHeight() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    let width = window.innerWidth;
    const apply = () => ref.current?.style.setProperty('--app-height', `${window.innerHeight}px`);
    const onResize = () => {
      // A width change is a rotation or a window resize, never the keyboard.
      const widthChanged = window.innerWidth !== width;
      width = window.innerWidth;
      if (widthChanged || !isTyping()) apply();
    };

    apply();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return ref;
}
