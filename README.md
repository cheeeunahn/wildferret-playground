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

## Commands

```sh
pnpm dev        # vite dev server
pnpm lint       # oxlint
pnpm build      # production build into dist/
pnpm preview    # serve the build locally
```
