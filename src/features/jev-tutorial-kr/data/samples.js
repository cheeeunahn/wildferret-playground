// Jev(타입세이프 System One 모델)가 같은 상태(state)에 대해 세 가지 질문을
// 한 번에 받고 돌려주는 응답을 그대로 옮겨 둔 샘플이다. 실제 호출 대신
// 고정된 답을 두어, 대시보드가 "응답을 어떻게 읽는가"에만 집중하게 한다.
// 나중에 /v1/answers 응답을 이 모양 그대로 끼워 넣으면 화면은 그대로 동작한다.

export const PRIMITIVES = {
  choice: {
    id: 'choice',
    name: 'Choice',
    korean: '하나 고르기',
    tagline: '미리 정한 선택지에서 가장 알맞은 답을 고른다',
    summary:
      '가장 유력한 답과 각 선택지의 확률을 함께 보여 준다. 다른 답일 가능성이 얼마나 남아 있는지도 비교할 수 있다.',
    useFor: '문의 분류, 작업 배정, 여러 후보 중 하나 고르기',
    watchOut:
      '선택지에 없는 답은 나올 수 없다. 맞는 항목이 없을 수도 있다면 "해당 없음"을 선택지에 넣어야 한다.',
  },
  score: {
    id: 'score',
    name: 'Score',
    korean: '단계 매기기',
    tagline: '낮음부터 높음까지 어느 단계에 가까운지 판단한다',
    summary:
      '각 단계의 가능성을 계산한 뒤 이를 평균 내어 점수로 보여 준다. 그래서 1.3처럼 두 단계 사이의 값이 나올 수 있다.',
    useFor: '심각도, 우선순위, 적합도처럼 정도를 비교하는 일',
    watchOut:
      '각 단계는 구체적인 상황으로 설명해야 한다. "보통", "높음"처럼 모호한 말만 쓰면 결과가 흔들린다.',
  },
  noul: {
    id: 'noul',
    name: 'Noul',
    korean: '예/아니오',
    tagline: '어떤 조건이 맞을 가능성을 계산한다',
    summary:
      '예/아니오 질문에 대해 "예"일 확률을 0부터 1 사이의 값으로 보여 준다. 이 값 자체가 답이므로 별도의 확신도는 없다.',
    useFor: '조건 확인, 자동 처리 여부 결정, 여러 항목을 각각 분류하는 일',
    watchOut:
      '0.5는 조건이 절반만 맞는다는 뜻이 아니라, 예와 아니오를 판단하기 어렵다는 뜻이다. 정도를 재려면 Score를 사용한다.',
  },
};

const URGENCY_LEGEND = {
  0: '단순 문의. 지금 답하지 않아도 고객이 손해를 보지 않는다',
  1: '기능이나 배송이 막혔지만 우회할 방법이 있다',
  2: '돈이 이미 빠져나갔거나 기한이 걸려 있어 오늘 안에 처리해야 한다',
};

export const SAMPLES = [
  {
    id: 'refund',
    label: '환불 요청',
    ticket: {
      channel: '앱 내 문의',
      text:
        '어제 받은 상품 박스가 찢어져 있고 안에 부품도 하나 없어요. 그냥 환불해 주세요. 재주문은 생각 없습니다.',
    },
    answers: {
      team: {
        type: 'choice',
        choice: 'returns',
        confidence: 0.93,
        probabilities: { returns: 0.95, shipping: 0.04, billing: 0.01 },
      },
      urgency: {
        type: 'score',
        score: 1.2,
        confidence: 0.61,
        legend: URGENCY_LEGEND,
        probabilities: { 0: 0.05, 1: 0.7, 2: 0.25 },
      },
      wants_human: { type: 'noul', noul: 0.18 },
    },
    usage: { input_tokens: 412, output_tokens: 47 },
  },
  {
    id: 'delay',
    label: '배송 지연 (애매한 경우)',
    ticket: {
      channel: '카카오톡 상담',
      text:
        '주문한 지 9일 지났는데 아직도 배송 중이라고만 떠요. 이 정도면 그냥 취소하는 게 맞나요?',
    },
    answers: {
      team: {
        type: 'choice',
        choice: 'shipping',
        confidence: 0.42,
        probabilities: { shipping: 0.58, returns: 0.37, billing: 0.05 },
      },
      urgency: {
        type: 'score',
        score: 0.9,
        confidence: 0.55,
        legend: URGENCY_LEGEND,
        probabilities: { 0: 0.22, 1: 0.66, 2: 0.12 },
      },
      wants_human: { type: 'noul', noul: 0.41 },
    },
    usage: { input_tokens: 398, output_tokens: 47 },
  },
  {
    id: 'billing',
    label: '결제 오류 + 상담원 요청',
    ticket: {
      channel: '전화 후 남긴 메모',
      text:
        '이번 달에 같은 금액이 두 번 빠져나갔습니다. 챗봇 말고 사람이랑 통화하고 싶어요. 오늘 안에 연락 주세요.',
    },
    answers: {
      team: {
        type: 'choice',
        choice: 'billing',
        confidence: 0.97,
        probabilities: { billing: 0.98, returns: 0.01, shipping: 0.01 },
      },
      urgency: {
        type: 'score',
        score: 1.88,
        confidence: 0.86,
        legend: URGENCY_LEGEND,
        probabilities: { 0: 0.01, 1: 0.1, 2: 0.89 },
      },
      wants_human: { type: 'noul', noul: 0.99 },
    },
    usage: { input_tokens: 421, output_tokens: 47 },
  },
];

// 세 질문 모두 같은 state를 보고, 서로의 답을 보지 못한 채 한 번의 요청에서
// 병렬로 처리된다. 화면 아래 "보낸 질문" 패널이 이 정의를 그대로 보여 준다.
export const QUESTIONS = {
  team: {
    primitive: 'choice',
    title: '어느 팀이 맡아야 하나',
    instructions: '이 문의를 처리할 팀을 고른다.',
    criteria: {
      returns: '교환, 환불, 잘못 왔거나 파손된 상품',
      shipping: '배송 상태, 지연, 분실',
      billing: '청구, 영수증, 결제 오류',
    },
  },
  urgency: {
    primitive: 'score',
    title: '얼마나 급한가',
    instructions: '이 문의가 얼마나 급한지 판단한다.',
    criteria: [URGENCY_LEGEND[0], URGENCY_LEGEND[1], URGENCY_LEGEND[2]],
  },
  wants_human: {
    primitive: 'noul',
    title: '사람 상담원을 원하는가',
    instructions: '고객이 사람 상담원과 연결되기를 원하고 있는가?',
    criteria: {
      true: '사람과 이야기하겠다고 말했거나 자동 응답을 거부했다',
      false: '연결 방식에 대해 말한 바가 없다',
    },
  },
};
