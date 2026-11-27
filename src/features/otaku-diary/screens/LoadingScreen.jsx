import styles from './LoadingScreen.module.css';

// Shown for the moment it takes to learn who is visiting: the sea, a
// line saying they are being let in, and three dots. A returning visitor goes from here straight
// to their sea; only a first-time one sees the title screen.
export default function LoadingScreen() {
  return (
    <div className={styles.screen} role="status">
      <p className={styles.text}>
        입장 중
        <span>잠시만 기다려 주세요</span>
      </p>
      <p className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
    </div>
  );
}
