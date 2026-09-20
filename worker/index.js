// 배포판은 지금까지 정적 자산만 올리는 Worker였다. `/api/jev` 하나 때문에
// 실제 Worker가 되었는데, 키를 담아 둘 곳이 필요해서다. 그 경로가 아닌 요청은
// 예전과 똑같이 dist/의 자산으로 넘긴다(SPA 폴백 포함).

import { handleJevRequest } from '../server/jevProxy.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/jev') {
      return handleJevRequest(request, env.TYPESAFE_API_KEY);
    }

    return env.ASSETS.fetch(request);
  },
};
