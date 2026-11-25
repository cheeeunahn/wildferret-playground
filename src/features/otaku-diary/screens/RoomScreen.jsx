import { assetUrl } from '../assets';
import SpeechBubble from '../components/SpeechBubble';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './RoomScreen.module.css';

// Inside the submarine: a small café with chibi 코토리 and the bookshelf
// that holds the user's recorded anime.
export default function RoomScreen({ diary, showShelfHint, onOpenBookshelf, onBack }) {
  const background = assetUrl('bg-room.jpg');
  const bookshelf = assetUrl('bookshelf.png');
  const chibi = assetUrl('kotori-chibi.png');
  const count = diary.records.length;

  return (
    <div
      className={styles.screen}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={onBack}>
          ← 바다로
        </button>
        <span className={styles.place}>잠수함 카페</span>
      </header>

      <button
        className={styles.bookshelf}
        type="button"
        onClick={onOpenBookshelf}
        aria-label={`책장 열기, 기록한 애니 ${count}편`}
      >
        {bookshelf ? (
          <img src={bookshelf} alt="" draggable={false} />
        ) : (
          <span className={styles.shelfFallback} />
        )}
        <span className={styles.tag}>책장 · {count}편</span>
      </button>

      <div className={styles.chibi}>
        {showShelfHint && (
          <SpeechBubble className={styles.line}>
            {count > 0 ? '책장에 네가 본 애니를 꽂아 뒀어!' : '책장이 아직 비어 있네.'}
          </SpeechBubble>
        )}
        {chibi ? (
          <img src={chibi} alt={GUIDE_NAME} draggable={false} />
        ) : (
          <span className={styles.chibiFallback} role="img" aria-label={GUIDE_NAME} />
        )}
      </div>
    </div>
  );
}
