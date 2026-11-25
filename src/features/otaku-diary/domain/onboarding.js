// The onboarding steps and the moves between them. Pure.

export const GUIDE_NAME = '코토리';

export const initialOnboarding = {
  step: 'greet', // greet → nameOk → search → dive → farewell → done
  nickname: '',
  firstAnime: null,
};

const NEXT_ON_ADVANCE = {
  nameOk: 'search',
  dive: 'farewell',
  farewell: 'done',
};

export function onboardingReducer(state, action) {
  switch (action.type) {
    case 'nameSubmitted': {
      const nickname = action.nickname.trim();
      if (state.step !== 'greet' || !nickname) return state;
      return { ...state, step: 'nameOk', nickname };
    }
    case 'animePicked':
      if (state.step !== 'search') return state;
      return { ...state, step: 'dive', firstAnime: action.anime };
    case 'advanced': {
      const next = NEXT_ON_ADVANCE[state.step];
      return next ? { ...state, step: next } : state;
    }
    default:
      return state;
  }
}

// What the guide says at each step, and which drawing she uses. `expression`
// shows while the line is being typed; `settled`, when given, replaces it
// once the line is finished and she is waiting for the user.
export function lineFor({ step, nickname }) {
  switch (step) {
    case 'greet':
      return {
        expression: 'neutral',
        settled: 'ask',
        text: '안녕, 덕후 다이어리에 온 것을 환영해. 너를 어떻게 불러줬으면 좋겠어?',
      };
    case 'nameOk':
      return { expression: 'happy', text: `${nickname}. 좋은 이름이구나!` };
    case 'search':
      return {
        expression: 'point',
        text: '먼저 예전에 본 애니를 하나 찾아볼까? 위 검색창에 제목을 영어로 입력해 봐.',
      };
    case 'dive':
      return {
        expression: 'wow',
        text: '봐, 애니를 한 편 실을 때마다 잠수함이 조금씩 더 깊이 내려가.',
      };
    case 'farewell':
      return { expression: 'cheer', text: '자, 바다 탐험을 시작해보자!' };
    default:
      return { expression: 'neutral', text: '' };
  }
}
