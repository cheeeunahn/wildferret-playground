import styles from './SpeechBubble.module.css';

// A small bubble with a tail pointing down at whatever it sits above.
export default function SpeechBubble({ children, className }) {
  return <span className={`${styles.bubble} ${className ?? ''}`}>{children}</span>;
}
