import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react';
import styles from './Waves.module.css';

const WIDTH = 400;
const HEIGHT = 28;
const MID = HEIGHT / 2;
const STEP = 8;

// Each layer is a sum of sine waves with different lengths and speeds, some
// running the other way, so crests grow, merge and pass through each other
// instead of sliding by as one fixed shape.
const LAYERS = [
  {
    id: 'far',
    behind: true,
    swells: [
      { amp: 2.4, length: 210, speed: 0.5, phase: 0.4 },
      { amp: 1.2, length: 90, speed: -0.8, phase: 2.1 },
    ],
  },
  {
    id: 'mid',
    behind: true,
    swells: [
      { amp: 3.4, length: 260, speed: 0.75, phase: 1.3 },
      { amp: 1.6, length: 120, speed: 1.3, phase: 0.2 },
      { amp: 0.7, length: 46, speed: -1.9, phase: 3.0 },
    ],
  },
  {
    id: 'near',
    behind: false,
    swells: [
      { amp: 4.2, length: 300, speed: 1.0, phase: 2.6 },
      { amp: 2.0, length: 140, speed: -0.6, phase: 0.9 },
      { amp: 0.9, length: 58, speed: 2.3, phase: 1.7 },
    ],
  },
];

function heightAt(swells, x, seconds) {
  return swells.reduce(
    (y, s) => y + s.amp * Math.sin((2 * Math.PI * x) / s.length - s.speed * seconds + s.phase),
    MID,
  );
}

// `crest` is the open line along the top; `body` closes it down to the
// bottom edge so it can be filled.
function shapeAt(swells, seconds) {
  let crest = '';
  for (let x = 0; x <= WIDTH; x += STEP) {
    crest += `${x === 0 ? 'M' : 'L'}${x} ${heightAt(swells, x, seconds).toFixed(2)}`;
  }
  return { crest, body: `${crest}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z` };
}

function WaveLayer({ id, swells }) {
  const still = useReducedMotion();
  const first = shapeAt(swells, 0);
  const body = useMotionValue(first.body);
  const crest = useMotionValue(first.crest);

  useAnimationFrame((ms) => {
    if (still) return;
    const shape = shapeAt(swells, ms / 1000);
    body.set(shape.body);
    crest.set(shape.crest);
  });

  return (
    <svg
      className={styles.layer}
      data-layer={id}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path className={styles.body} d={body} />
      <motion.path className={styles.crest} d={crest} />
    </svg>
  );
}

// The moving sea surface. Render `<Waves behind />` under the submarine and
// `<Waves />` over it, so the hull sits in the water rather than on it.
export default function Waves({ behind = false }) {
  return LAYERS.filter((layer) => layer.behind === behind).map((layer) => (
    <WaveLayer key={layer.id} {...layer} />
  ));
}
