// The onboarding steps and the moves between them. Pure.

export const GUIDE_NAME = '코토리';

export const initialOnboarding = {
  step: 'greet', // greet → nameOk → search → dive → invite → done
  nickname: '',
  firstAnime: null,
};

const NEXT_ON_ADVANCE = {
  nameOk: 'search',
  dive: 'invite',
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
    // The invitation is answered by going into the submarine, not by a tap
    // on the text box.
    case 'submarineEntered':
      return state.step === 'invite' ? { ...state, step: 'done' } : state;
    case 'advanced': {
      const next = NEXT_ON_ADVANCE[state.step];
      return next ? { ...state, step: next } : state;
    }
    default:
      return state;
  }
}

// What the guide says at each step, and which drawing she uses.
export function lineFor({ step, nickname }) {
  switch (step) {
    case 'greet':
      return {
        expression: 'neutral',
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
    case 'invite':
      return {
        expression: 'point',
        text: '네가 실은 애니는 잠수함 안에 보관해 둘게. 잠수함을 눌러서 안으로 들어가 볼래?',
      };
    default:
      return { expression: 'neutral', text: '' };
  }
}

// What the guide says the first time the user steps inside the submarine.
export const ROOM_TOUR = [
  { expression: 'happy', text: '여기가 잠수함 안이야. 어때, 포근하지?' },
  {
    expression: 'neutral',
    text: '네가 기록한 애니는 저 책장에 꽂아 둘게. 책장을 누르면 목록을 볼 수 있어.',
  },
  { expression: 'cheer', text: '자, 그럼 바다 탐험을 시작해보자!' },
];
