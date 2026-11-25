import { assetUrl } from '../assets';
import styles from './SeaLife.module.css';

// Who lives in the sea and how each one moves. All sprites are drawn facing
// right; `dir: -1` swims right to left and mirrors the sprite.
//   top      where in the water, as % of its height
//   size     sprite width in px
//   seconds  time to cross the screen (or to drift, for floaters)
//   delay    negative, so each starts part-way through its path
const SWIMMERS = [
  { id: 'orange', sprite: 'sea-fish-orange.png', top: 14, size: 40, seconds: 22, delay: -4, dir: 1 },
  { id: 'blue', sprite: 'sea-fish-blue.png', top: 38, size: 44, seconds: 27, delay: -15, dir: -1 },
  { id: 'turtle', sprite: 'sea-turtle.png', top: 58, size: 78, seconds: 46, delay: -20, dir: 1 },
  { id: 'puffer', sprite: 'sea-puffer.png', top: 76, size: 46, seconds: 38, delay: -30, dir: -1 },
  { id: 'whale', sprite: 'sea-whale.png', top: 86, size: 104, seconds: 70, delay: -48, dir: 1 },
  // A small school: the same fish three times, close together.
  { id: 'pink-1', sprite: 'sea-fish-pink.png', top: 24, size: 24, seconds: 18, delay: -9, dir: -1 },
  { id: 'pink-2', sprite: 'sea-fish-pink.png', top: 27.5, size: 20, seconds: 18, delay: -8.3, dir: -1 },
  { id: 'pink-3', sprite: 'sea-fish-pink.png', top: 21, size: 18, seconds: 18, delay: -7.9, dir: -1 },
];

// These stay in one place and bob.
const FLOATERS = [
  { id: 'jelly-1', sprite: 'sea-jellyfish.png', top: 46, left: 80, size: 46, seconds: 7, delay: 0 },
  { id: 'jelly-2', sprite: 'sea-jellyfish.png', top: 70, left: 26, size: 34, seconds: 9, delay: -3 },
  { id: 'seahorse', sprite: 'sea-seahorse.png', top: 30, left: 88, size: 30, seconds: 5, delay: -2 },
];

// Fish, turtles and friends swimming in the water behind the submarine.
// A creature whose drawing is missing is simply left out.
export default function SeaLife() {
  return (
    <div className={styles.life} aria-hidden="true">
      {SWIMMERS.map((c) => {
        const src = assetUrl(c.sprite);
        return (
          src && (
            <div
              key={c.id}
              className={styles.lane}
              data-dir={c.dir === -1 ? 'left' : 'right'}
              style={{
                top: `${c.top}%`,
                animationDuration: `${c.seconds}s`,
                animationDelay: `${c.delay}s`,
              }}
            >
              <img
                className={styles.swimmer}
                src={src}
                alt=""
                draggable={false}
                style={{ width: c.size, animationDelay: `${c.delay}s` }}
              />
            </div>
          )
        );
      })}
      {FLOATERS.map((c) => {
        const src = assetUrl(c.sprite);
        return (
          src && (
            <img
              key={c.id}
              className={styles.floater}
              src={src}
              alt=""
              draggable={false}
              style={{
                top: `${c.top}%`,
                left: `${c.left}%`,
                width: c.size,
                animationDuration: `${c.seconds}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          )
        );
      })}
    </div>
  );
}
