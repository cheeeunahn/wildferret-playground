// The site's Worker. Static files are served by the assets layer without
// running this; only /api/* comes here (see `run_worker_first` in
// wrangler.jsonc). `pnpm dev` runs the same handler inside Vite.

import { handleAuth } from './auth.js';
import { handleDiary } from './diary.js';
import { HttpError, json } from './http.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/diary' || url.pathname.startsWith('/api/diary/')) {
        return await handleDiary(request, env, url);
      }
      if (url.pathname.startsWith('/api/auth/')) return await handleAuth(request, env, url);
      throw new HttpError(404, '없는 주소예요.');
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, { status: error.status });
      console.error(error);
      return json({ error: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
    }
  },
};
