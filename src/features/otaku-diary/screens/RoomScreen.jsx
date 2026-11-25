import { assetUrl } from '../assets';
import { useEffect, useState } from 'react';
import Character from '../components/Character';
import DialogueBox from '../components/DialogueBox';
import SoundToggle from '../components/SoundToggle';
import SpeechBubble from '../components/SpeechBubble';
import { MOODS, pickChatter } from '../domain/chatter';
import { GUIDE_NAME, ROOM_TOUR } from '../domain/onboarding';
import { useVoice } from '../hooks/useSound';
import styles from './RoomScreen.module.css';

// How long a line stays up: until its clip ends, or this long when silent.
const CHATTER_MS = 4000;
const CHATTER_AFTER_VOICE_MS = 600;

// Inside the submarine: a small café with 코토리 and the bookshelf
// that holds the user's recorded anime. On the first visit (`showTour`) she
// steps forward and explains the room, visual-novel style, then goes back
// to standing in it. Tapping her there makes her say something.
export default function RoomScreen({ diary, showTour, onTourEnd, onOpenBookshelf, onBack }) {
  const [tourStep, setTourStep] = useState(0);
  const tourLine = showTour ? ROOM_TOUR[tourStep] : null;

  // Hidden extra: a tap on her brings up a line, which fades after a while.
  const [chatter, setChatter] = useState(null);
  const voice = useVoice();
  useEffect(() => {
    if (!chatter) return undefined;
    const clear = () => setChatter((now) => (now === chatter ? null : now));
    if (!chatter.audio) {
      const timer = setTimeout(clear, CHATTER_MS);
      return () => clearTimeout(timer);
    }
    let timer;
    const afterVoice = () => {
      timer = setTimeout(clear, CHATTER_AFTER_VOICE_MS);
    };
    // `error` too, so a clip that fails to load does not leave her talking.
    chatter.audio.addEventListener('ended', afterVoice);
    chatter.audio.addEventListener('error', afterVoice);
    return () => {
      clearTimeout(timer);
      chatter.audio.removeEventListener('ended', afterVoice);
      chatter.audio.removeEventListener('error', afterVoice);
    };
  }, [chatter]);

  // Leaving the room cuts her off.
  const { play: speak, stop: hush } = voice;
  useEffect(() => hush, [hush]);

  const chat = () => {
    const context = { nickname: diary.profile.nickname, count: diary.depth.count };
    const line = pickChatter(context, chatter?.text, Math.random());
    // A new object each time, so tapping again starts over.
    setChatter({ ...line, audio: speak(line.voice) });
  };

  // Her face while she speaks; null (the resting drawing) if that mood has
  // no drawing.
  const moodSrc = chatter ? assetUrl(`kotori-room-${chatter.mood}.png`) : null;

  const advanceTour = () => {
    if (tourStep + 1 < ROOM_TOUR.length) setTourStep(tourStep + 1);
    else onTourEnd();
  };

  const background = assetUrl('bg-room.jpg');
  const bookshelf = assetUrl('bookshelf.png');
  const kotori = assetUrl('kotori-room.png');
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
        <div className={styles.headerEnd}>
          <span className={styles.place}>잠수함 카페</span>
          <SoundToggle />
        </div>
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

      {tourLine ? (
        <>
          <Character expression={tourLine.expression} />
          <DialogueBox
            key={tourStep}
            speaker={GUIDE_NAME}
            text={tourLine.text}
            voice={tourLine.voice}
            onAdvance={advanceTour}
          />
        </>
      ) : (
        <div className={styles.kotori}>
          {chatter && (
            <SpeechBubble key={chatter.text} className={styles.chatter}>
              {chatter.text}
            </SpeechBubble>
          )}
          <button
            className={styles.kotoriTap}
            type="button"
            onClick={chat}
            aria-label={`${GUIDE_NAME}에게 말 걸기`}
          />
          {kotori ? (
            <>
              {/* The resting drawing sets her size and stays in place; a mood
                  drawing is the same figure with another face, laid exactly
                  over it. All are kept loaded so a tap never flickers. */}
              <img
                className={styles.sprite}
                src={kotori}
                alt={GUIDE_NAME}
                draggable={false}
                data-hidden={moodSrc ? '' : undefined}
              />
              {MOODS.map((mood) => {
                const src = assetUrl(`kotori-room-${mood}.png`);
                return (
                  src && (
                    <img
                      key={mood}
                      className={`${styles.sprite} ${styles.mood}`}
                      src={src}
                      alt=""
                      draggable={false}
                      data-hidden={src === moodSrc ? undefined : ''}
                    />
                  )
                );
              })}
            </>
          ) : (
            <span className={styles.kotoriFallback} role="img" aria-label={GUIDE_NAME} />
          )}
        </div>
      )}
    </div>
  );
}
