import { useEffect, useState } from 'react';
import { assetUrl } from '../assets';
import AnimeSearch from '../components/AnimeSearch';
import Character from '../components/Character';
import DialogueBox from '../components/DialogueBox';
import NicknameInput from '../components/NicknameInput';
import SeaScene from '../components/SeaScene';
import { depthFor } from '../domain/depth';
import { GUIDE_NAME, lineFor } from '../domain/onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
import styles from './OnboardingScreen.module.css';

const FLOAT_MS = 1100;

// The first-visit visual novel: greeting, name, first search, first dive.
export default function OnboardingScreen({ diary, onFinish }) {
  const [state, actions] = useOnboarding();
  const { step } = state;
  const line = lineFor(state);
  const atSea = step === 'dive' || step === 'farewell';
  // Starts true: the first line is typed as soon as the screen opens.
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (step === 'done') onFinish();
  }, [step, onFinish]);

  const submitName = (nickname) => {
    diary.saveProfile({ nickname: nickname.trim() });
    actions.submitName(nickname);
  };

  const pickAnime = (anime) => {
    diary.addAnime(anime);
    actions.pickAnime(anime);
  };

  if (step === 'done') return null;

  const background = assetUrl('bg-deck.jpg');

  return (
    <div
      className={styles.screen}
      style={!atSea && background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {atSea && <FirstDive anime={state.firstAnime} depth={diary.depth} />}

      <Character
        expression={typing ? line.expression : (line.settled ?? line.expression)}
        size={step === 'search' || atSea ? 'small' : 'full'}
      />

      {step === 'search' && (
        <div className={styles.searchSlot}>
          <AnimeSearch onPick={pickAnime} autoFocus />
        </div>
      )}

      <DialogueBox
        key={step}
        speaker={GUIDE_NAME}
        text={line.text}
        onTypingChange={setTyping}
        onAdvance={step === 'greet' || step === 'search' ? undefined : actions.advance}
      >
        {step === 'greet' && <NicknameInput onSubmit={submitName} />}
      </DialogueBox>
    </div>
  );
}

// The submarine floats for a moment with the old count, then the anime goes
// in and it sinks to the new one.
function FirstDive({ anime, depth }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), FLOAT_MS);
    return () => clearTimeout(timer);
  }, []);

  const before = depthFor(Math.max(depth.count - (anime?.countsForDepth ? 1 : 0), 0));

  return (
    <div className={styles.sea}>
      <SeaScene depth={loaded ? depth : before} cargo={loaded ? anime : null} />
    </div>
  );
}
