# wildferret's playground

A small React + Vite site at [playground.wildferret.dev](https://playground.wildferret.dev),
deployed to Cloudflare Workers as static assets.

## Routes

| URL | What |
| --- | --- |
| `/` | redirects to `/songs/` |
| `/songs/` | the Strudel piece archive and its player |
| `/tools/` | the tools tab: pick a tool, use it inside the page |
| `/tools/<tool-id>/` | one tool on its own page, without the site chrome |

Routing is client-side (`react-router-dom`), so `wrangler.jsonc` sets
`not_found_handling: "single-page-application"` to serve `index.html` for
every path.

## Layout

```
src/
  main.jsx        providers + <BrowserRouter>
  routes.jsx      the route table
  theme.js        Mantine theme, on the blog's palette
  layout/         the site shell: header, nav, <Outlet>
  pages/          one file per route
  songs/          the piece archive and the Strudel embed
  tools/          tools.js registry + one folder per tool
```

Add a song by appending to `PIECES` in `src/songs/pieces.js`. Add a tool by
dropping a component under `src/tools/` and appending to `TOOLS` in
`src/tools/tools.js` — its `id` becomes the last segment of its own URL.

## Commands

```sh
pnpm dev        # vite dev server
pnpm lint       # oxlint
pnpm build      # production build into dist/
pnpm preview    # serve the build locally
```
