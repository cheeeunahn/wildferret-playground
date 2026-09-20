// TypeSafe API 키는 서버에만 둔다. 브라우저는 자기가 잰 측정값만 올려 보내고,
// 실제 호출은 여기서 한다. 이 파일은 Node(개발 서버)와 Cloudflare Worker(배포)
// 양쪽에서 같이 쓰이므로, 어디에나 있는 fetch/Request/Response만 사용한다.

import { buildQuestions } from '../src/features/jev-tutorial-kr/data/drawingQuestions.js';

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';

// 질문은 브라우저가 아니라 서버가 정한다. 그래야 이 경로가 아무 프롬프트나
// 실어 나르는 일반 릴레이로 쓰이지 않는다. 클라이언트가 보낼 수 있는 것은
// 캔버스에서 잰 숫자뿐이다.
const ALLOWED_FEATURES = [
  '획수',
  '가로세로비',
  '잉크비율',
  '닫힌영역수',
  '가장큰닫힌영역비율',
  '위쪽뾰족돌출수',
  '곧은획수',
  '좌우대칭도',
  '잉크격자',
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// 들어온 본문에서 아는 필드만 골라 담는다. 모르는 키는 조용히 버린다.
function sanitize(features) {
  if (!features || typeof features !== 'object') return null;

  const picked = {};
  for (const key of ALLOWED_FEATURES) {
    if (key in features) picked[key] = features[key];
  }
  return Object.keys(picked).length === ALLOWED_FEATURES.length ? picked : null;
}

export async function handleJevRequest(request, apiKey) {
  if (request.method !== 'POST') {
    return json({ error: 'POST만 받는다.' }, 405);
  }

  if (!apiKey) {
    // 키를 잊은 채 띄웠을 때 조용히 401로 끝나면 원인을 찾기 어렵다.
    return json(
      { error: 'TYPESAFE_API_KEY가 서버에 설정되어 있지 않다.' },
      500,
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: '본문을 JSON으로 읽지 못했다.' }, 400);
  }

  const measured = sanitize(payload?.features);
  if (!measured) {
    return json({ error: '측정값의 모양이 맞지 않는다.' }, 400);
  }

  let upstream;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        state: {
          // 여기에 "고양이를 그리라고 했다"를 적으면 모든 질문이 그 말에
          // 끌려간다. 실제로 집이나 낙서에도 Choice가 고양이를 골랐다.
          // 그 전제가 필요한 질문(고양이다움)만 제 instructions에서 말한다.
          과제: '사용자가 빈 캔버스에 무언가를 그렸다.',
          안내:
            '아래 값은 그림 자체가 아니라, 브라우저가 획을 재어 얻은 측정값이다. 좌표는 그림을 감싸는 사각형 기준 0~1이고, y는 아래로 갈수록 커진다. `잉크격자`는 6×6 칸마다의 선 밀도를 0~9로 나타낸 것으로, 첫 줄이 그림의 맨 위다.',
          측정값: measured,
        },
        questions: buildQuestions(),
      }),
    });
  } catch {
    return json({ error: 'TypeSafe에 연결하지 못했다.' }, 502);
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    // 상류의 오류 본문에는 키가 들어 있지 않지만, 그대로 흘려보내는 대신
    // 상태 코드만 전하고 내용은 서버 로그에 남긴다.
    console.error('TypeSafe 응답 오류', upstream.status, text);
    return json({ error: `TypeSafe가 ${upstream.status}로 답했다.` }, 502);
  }

  return new Response(text, {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
