import { useEffect, useState } from 'react';
import { assetUrl } from '../assets';
import AnimeSearch from '../components/AnimeSearch';
import Character from '../components/Character';
import DialogueBox from '../components/DialogueBox';
import NicknameInput from '../components/NicknameInput';
import ReviewSheet from '../components/ReviewSheet';
import SeaScene from '../components/SeaScene';
import SoundToggle from '../components/SoundToggle';
import { depthFor } from '../domain/depth';
import { GUIDE_NAME, lineFor } from '../domain/onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
import styles from './OnboardingScreen.module.css';

const FLOAT_MS = 1100;

// The first-visit visual novel: greeting, name, first search, first dive,
// and an invitation into the submarine, which is how it ends.
export default function OnboardingScreen({ diary, onFinish }) {
  const [state, actions] = useOnboarding();
  const { step } = state;
  const line = lineFor(state);
  const atSea = step === 'dive' || step === 'invite';
  // Steps the user answers by doing something, not by tapping the text box.
  const waitsForAction = step === 'greet' || step === 'search' || step === 'invite';

  const submitName = (nickname) => {
    diary.saveProfile({ nickname: nickname.trim() });
    actions.submitName(nickname);
  };

  // The anime picked from search, waiting for its stars.
  const [picked, setPicked] = useState(null);

  const recordPicked = async (review) => {
    await diary.addAnime(picked, review);
    actions.pickAnime(picked);
    setPicked(null);
  };

  const background = assetUrl('bg-deck.jpg');

  return (
    <div
      className={styles.screen}
      style={!atSea && background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {atSea && (
        <FirstDive
          anime={state.firstAnime}
          depth={diary.depth}
          onSubmarineClick={step === 'invite' ? onFinish : undefined}
        />
      )}

      <SoundToggle className={styles.sound} />

      <Character
        expression={line.expression}
        size={step === 'search' || atSea ? 'small' : 'full'}
      />

      {step === 'search' && (
        <div className={styles.searchSlot}>
          <AnimeSearch onPick={setPicked} autoFocus highlight />
        </div>
      )}

      <DialogueBox
        key={step}
        speaker={GUIDE_NAME}
        text={line.text}
        voice={line.voice}
        onAdvance={waitsForAction ? undefined : actions.advance}
      >
        {step === 'greet' && <NicknameInput onSubmit={submitName} />}
      </DialogueBox>

      {picked && (
        <ReviewSheet anime={picked} onSubmit={recordPicked} onCancel={() => setPicked(null)} />
      )}
    </div>
  );
}

// The submarine floats for a moment with the old count, then the anime goes
// in and it sinks to the new one.
function FirstDive({ anime, depth, onSubmarineClick }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), FLOAT_MS);
    return () => clearTimeout(timer);
  }, []);

  const before = depthFor(Math.max(depth.count - (anime?.countsForDepth ? 1 : 0), 0));

  return (
    <div className={styles.sea}>
      <SeaScene
        depth={loaded ? depth : before}
        cargo={loaded ? anime : null}
        onSubmarineClick={onSubmarineClick}
        nudge={onSubmarineClick ? '여기를 눌러봐!' : null}
      />
    </div>
  );
}
