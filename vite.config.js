import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleJevRequest } from './server/jevProxy.js';

// wrangler가 로컬 비밀값을 읽는 파일을 그대로 쓴다. `pnpm dev`와
// `wrangler dev`가 같은 파일 하나를 보게 되므로 .env를 따로 둘 이유가 없다.
function readDevVars() {
  try {
    const text = readFileSync(new URL('.dev.vars', import.meta.url), 'utf8');
    return Object.fromEntries(
      text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const at = line.indexOf('=');
          const value = line.slice(at + 1).trim();
          // 따옴표로 감싼 값도 허용한다.
          return [
            line.slice(0, at).trim(),
            value.replace(/^["'](.*)["']$/, '$1'),
          ];
        }),
    );
  } catch {
    // 파일이 없으면 키도 없는 것으로 본다. 프록시가 알아들을 수 있는 오류를
    // 돌려주므로 여기서 죽일 필요는 없다.
    return {};
  }
}

// 개발 서버에서 배포판 Worker와 같은 `/api/jev`를 제공한다. 핸들러는
// server/jevProxy.js 하나를 양쪽이 나눠 쓴다.
function jevDevProxy() {
  return {
    name: 'jev-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      const apiKey = readDevVars().TYPESAFE_API_KEY;

      server.middlewares.use('/api/jev', async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        const response = await handleJevRequest(
          new Request('http://localhost/api/jev', {
            method: req.method,
            headers: { 'content-type': 'application/json' },
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }),
          apiKey,
        );

        res.statusCode = response.status;
        res.setHeader('content-type', response.headers.get('content-type'));
        res.end(await response.text());
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jevDevProxy()],
})
