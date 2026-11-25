import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/* in `pnpm dev` with the same handler the deployed Worker
// runs (worker/index.js), against a local copy of the D1 database kept in
// .wrangler/. Edits to the worker apply on the next request.
function workerApiDev() {
  return {
    name: 'worker-api-dev',
    apply: 'serve',
    async configureServer(server) {
      // Creates or updates the local tables; does nothing when up to date.
      execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'apply', 'DB', '--local'], {
        stdio: 'ignore',
        env: { ...process.env, CI: '1' },
      })
      const { getPlatformProxy } = await import('wrangler')
      const platform = await getPlatformProxy()
      server.httpServer?.once('close', () => platform.dispose())

      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const headers = new Headers()
          for (const [name, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
          }
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })
          const worker = (await server.ssrLoadModule('/worker/index.js')).default
          const response = await worker.fetch(request, platform.env)

          res.statusCode = response.status
          const cookies = response.headers.getSetCookie()
          if (cookies.length) res.setHeader('set-cookie', cookies)
          response.headers.forEach((value, name) => {
            if (name !== 'set-cookie') res.setHeader(name, value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), workerApiDev()],
})
