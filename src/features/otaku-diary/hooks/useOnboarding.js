import { useMemo, useReducer } from 'react';
import { initialOnboarding, onboardingReducer } from '../domain/onboarding';

export function useOnboarding() {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboarding);
  const actions = useMemo(
    () => ({
      submitName: (nickname) => dispatch({ type: 'nameSubmitted', nickname }),
      pickAnime: (anime) => dispatch({ type: 'animePicked', anime }),
      advance: () => dispatch({ type: 'advanced' }),
      enterSubmarine: () => dispatch({ type: 'submarineEntered' }),
    }),
    [],
  );
  return [state, actions];
}
