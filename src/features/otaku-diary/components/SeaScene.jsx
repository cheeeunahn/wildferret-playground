import { useState } from 'react';
import { depthFor } from '../domain/depth';
import { Poster } from './AnimeCard';
import SeaLife from './SeaLife';
import SpeechBubble from './SpeechBubble';
import Submarine from './Submarine';
import Waves from './Waves';
import styles from './SeaScene.module.css';

// The scene is a camera on a tall sea. Distances are px in that sea,
// measured down from the waterline.
const FIRST_DIVE = 46; // the first title pulls the floating hull under
const PER_TITLE = 30; // every later title takes it this much deeper
const CRUISE = 136; // once the hull is this far down the screen, the camera follows
const RULER_BEFORE = 9; // ruler marks kept above and below the hull
const RULER_AFTER = 12;

// Where the bubbles let out on a dive start, around the hull.
const BURST = [
  { left: '8%', top: '55%', animationDelay: '1.0s' },
  { left: '22%', top: '30%', animationDelay: '1.25s' },
  { left: '48%', top: '12%', animationDelay: '1.1s' },
  { left: '70%', top: '24%', animationDelay: '1.4s' },
  { left: '88%', top: '50%', animationDelay: '1.2s' },
];

function sinkFor(count) {
  if (count <= 0) return 0;
  return FIRST_DIVE + (count - 1) * PER_TITLE;
}

// One mark per title, labelled with the depth that title count reaches.
function rulerMarks(count) {
  const marks = [];
  const from = Math.max(count - RULER_BEFORE, 0);
  for (let n = from; n <= count + RULER_AFTER; n += 1) {
    marks.push({ n, y: sinkFor(n), metres: depthFor(n).metres });
  }
  return marks;
}

// Sky, sea and submarine. `depth` comes from domain/depth. When `cargo`
// changes, that anime drops into the submarine before it sinks. With
// `onSubmarineClick` the submarine becomes a button; `nudge` is a bubble
// shown over it, and the hull glows on and off for as long as it shows.
//
// Each new title is shown three ways: the hull dips and lets out bubbles,
// the depth ruler slides up by one mark, and (near the top) the surface
// rises out of view.
export default function SeaScene({ depth, cargo, onSubmarineClick, nudge, children }) {
  const { count } = depth;
  // The count the scene opened with: only changes after that are animated.
  const [openedAt] = useState(count);
  const sink = sinkFor(count);
  const camera = Math.max(sink - CRUISE, 0);
  // Where the hull is on screen while the cargo drops: where it sat before
  // this title sank it. Once the camera follows, that is always CRUISE.
  const countBeforeCargo = Math.max(count - (cargo?.countsForDepth ? 1 : 0), 0);
  const cargoTarget = Math.min(sinkFor(countBeforeCargo), CRUISE);

  const hull = (
    <span key={count} className={styles.hull} data-dive={count !== openedAt || undefined}>
      <Submarine />
      {count > 0 && <span className={styles.count}>{count}편</span>}
      {count !== openedAt &&
        BURST.map((bubble, i) => (
          <span key={i} className={styles.burst} style={bubble} />
        ))}
    </span>
  );

  return (
    <div
      className={styles.scene}
      data-layer={depth.layer.id}
      style={{ '--sink': `${sink - camera}px`, '--camera': `${camera}px` }}
    >
      <div className={styles.sky} />
      <div className={styles.water}>
        <SeaLife />
        <span className={styles.bubble} style={{ left: '18%', animationDelay: '0s' }} />
        <span className={styles.bubble} style={{ left: '72%', animationDelay: '1.6s' }} />
        <span className={styles.bubble} style={{ left: '44%', animationDelay: '3.1s' }} />
      </div>

      <ul className={styles.ruler} aria-hidden="true">
        {rulerMarks(count).map((mark) => (
          <li
            key={mark.n}
            data-current={mark.n === count || undefined}
            style={{ '--y': `${mark.y - camera}px` }}
          >
            {mark.metres.toLocaleString()}m
          </li>
        ))}
      </ul>

      <Waves behind />

      {onSubmarineClick ? (
        <button
          className={styles.sub}
          type="button"
          onClick={onSubmarineClick}
          aria-label="잠수함 안으로 들어가기"
          data-glow={Boolean(nudge) || undefined}
        >
          {nudge && <SpeechBubble className={styles.nudge}>{nudge}</SpeechBubble>}
          {hull}
        </button>
      ) : (
        <div className={styles.sub}>{hull}</div>
      )}

      {/* A thin sheet of water in front, so the floating hull looks wet. */}
      <div className={styles.waterFront} />
      <Waves />

      {cargo && (
        <div
          key={cargo.id}
          className={styles.cargo}
          style={{ '--cargo-target': `${cargoTarget}px` }}
        >
          <Poster anime={cargo} className={styles.cargoPoster} />
        </div>
      )}

      <div className={styles.readout}>
        <strong>수심 {depth.metres.toLocaleString()}m</strong>
        <span>{depth.layer.name}</span>
      </div>
      {children}
    </div>
  );
}
