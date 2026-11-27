import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import styles from './Select.module.css';

// A choice of one from a short list that would take too much room laid out
// (the bookshelf's order): a chip showing the current choice, which opens a
// small menu under it. `options` are `[{ value, label }]`; `label` names the
// choice for screen readers ("정렬").
//
// It works like a native select from the keyboard: arrows move, Enter or
// Space picks, Escape closes, Home and End jump. A tap outside closes it.
export default function Select({ options, value, onChange, label, className }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const current = options[chosen];

  const openMenu = () => {
    setActive(chosen);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const choose = (option) => {
    if (option.value !== value) onChange(option.value);
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.focus();
    // A tap outside only closes the menu, as a native one does: the click
    // it would make (opening a poster under it, say) is swallowed.
    const swallow = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const outside = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
      document.addEventListener('click', swallow, { capture: true, once: true });
      // A press that turns into a scroll makes no click; forget it then.
      setTimeout(() => document.removeEventListener('click', swallow, true), 600);
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);

  const onListKey = (event) => {
    const last = options.length - 1;
    const moves = {
      ArrowDown: () => setActive((i) => Math.min(i + 1, last)),
      ArrowUp: () => setActive((i) => Math.max(i - 1, 0)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(options[active]),
      ' ': () => choose(options[active]),
      Escape: close,
      Tab: () => setOpen(false),
    };
    const move = moves[event.key];
    if (!move) return;
    if (event.key !== 'Tab') {
      event.preventDefault();
      // Escape here must not also close a sheet the menu sits in.
      event.stopPropagation();
    }
    move();
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ''}`}>
      <button
        ref={buttonRef}
        className={styles.trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${current?.label ?? ''}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className={styles.value}>{current?.label}</span>
        <Icon name="chevronDown" className={styles.chevron} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          className={styles.menu}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((option, index) => {
            const selected = index === chosen;
            return (
              <li
                key={option.value}
                id={`${id}-${index}`}
                className={styles.option}
                role="option"
                aria-selected={selected}
                data-active={index === active || undefined}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {option.label}
                {selected && <Icon name="check" className={styles.check} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
