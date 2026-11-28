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
| `/otaku-diary`, `/otaku-diary/privacy` | 301 to [deepdivelog.app](https://deepdivelog.app), where the anime diary now lives as 다이브로그 (`public/_redirects`) |

Routing is client-side (`react-router-dom`), so `wrangler.jsonc` sets
`not_found_handling: "single-page-application"` to serve `index.html` for
every path. `public/_redirects` is applied by the assets layer before that
fallback, so the old diary URLs redirect instead of rendering the site.

## Project structure

```
src/
  main.jsx                  app bootstrap and providers
  app/                      global routing, theme, and styles
  shared/                   UI shared by multiple features
  features/
    index.js                feature registry (routing + navigation)
    songs/
      SongsPage.jsx
      components/           song-specific reusable UI
      library/              song registry + one file per song
    tools/
      ToolsPage.jsx
      ToolPage.jsx
      catalog/              tool registry + one folder per tool
.github/workflows/
  claude-code-review.yml    Claude Code review on every pull request
```

The repository is organized by feature rather than by file type. A feature owns
its pages, components, data, and feature-specific routes, which keeps unrelated
categories from becoming coupled as the playground grows.

## Adding content

### A song

1. Add one song module under `src/features/songs/library/` that exports its
   `id`, `name`, and `code`.
2. Import it in `src/features/songs/library/index.js` and append it to `SONGS`.

### A tool

1. Add a folder under `src/features/tools/catalog/` containing the tool's UI,
   styles, logic, and an `index.js` metadata export.
2. Import that metadata in `src/features/tools/catalog/index.js` and append it
   to `TOOLS`. Its `id` becomes the last segment of `/tools/<tool-id>/`.

### Another category

1. Add `src/features/<category>/` with its page and an `index.js` feature
   descriptor (`id`, `label`, `path`, and `Component`).
2. Register the descriptor in `src/features/index.js`.

The feature registry automatically supplies the main route and navigation tab.
A feature can also declare `standaloneRoutes` when it needs routes outside the
shared site layout, as tools currently does for the full-window tool view.

### An unlisted page

`src/features/index.js` has two lists for pages that stay out of the
navigation: `UNLISTED_PAGES` sit inside the site frame, and
`STANDALONE_PAGES` fill the whole screen themselves.

## Deploys and pull requests

Cloudflare Workers Builds deploys `main` to
[playground.wildferret.dev](https://playground.wildferret.dev). Every other
branch gets a Preview at `<branch>-wildferret-playground.<subdomain>.workers.dev`,
built with `wrangler preview`; that is why `wrangler.jsonc` has
`"preview_urls": true` and an empty `"previews": {}` block. Preview links are
behind Cloudflare Access sign-in.

Cloudflare's bot comments on a pull request once but does not update that
comment on later pushes, so `.github/workflows/preview-link.yml` keeps a
"Preview" comment current: it waits for the Workers Builds check on each new
commit and updates the comment with the result and the branch's link.

Every pull request is also reviewed by Claude Code
(`.github/workflows/claude-code-review.yml`), which needs a
`CLAUDE_CODE_OAUTH_TOKEN` repository secret. GitHub only runs it once the
workflow file is on `main`.

## Commands

```sh
pnpm dev        # vite dev server
pnpm lint       # oxlint
pnpm build      # production build into dist/
pnpm preview    # serve the build locally
```
