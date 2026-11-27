# wildferret's playground

A small React + Vite site at [playground.wildferret.dev](https://playground.wildferret.dev),
deployed to Cloudflare Workers: static assets, plus a small Worker behind
`/api/*` that keeps the anime diary in a D1 database.

## Routes

| URL | What |
| --- | --- |
| `/` | redirects to `/songs/` |
| `/songs/` | the Strudel piece archive and its player |
| `/tools/` | the tools tab: pick a tool, use it inside the page |
| `/tools/<tool-id>/` | one tool on its own page, without the site chrome |
| `/otaku-diary` | 애니와 함께하는 바다모험, a phone-sized anime diary (unlisted; reachable by URL only) |
| `/otaku-diary/privacy` | the diary's privacy policy (개인정보 처리방침) |

Routing is client-side (`react-router-dom`), so `wrangler.jsonc` sets
`not_found_handling: "single-page-application"` to serve `index.html` for
every path. `/api/*` is the exception: `run_worker_first` sends it to the
Worker.

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
    otaku-diary/            the anime diary (see below)
worker/                     the Worker behind /api/* (diary API, accounts)
migrations/                 the D1 tables, one SQL file per change
scripts/
  kotori-voice.mjs          regenerates the diary's voice clips
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
`STANDALONE_PAGES` fill the whole screen themselves, as the anime diary does.

## The anime diary (`/otaku-diary`)

A front-end prototype of 애니와 함께하는 바다모험: the user logs anime they have
watched, and a submarine dives one step deeper for each title. 코토리, the
guide character, walks them through it in visual-novel scenes and speaks every
line in Japanese while the text stays Korean.

A returning visitor skips the title screen: the page shows a loading screen
while it asks the server who is visiting (for at least three seconds, however
fast the answer), and anyone it already knows
(logged in, or a visitor who finished onboarding in this browser) lands on the
sea. Only a first-time visitor sees the title screen; logging out, logging in and
signing up are in 설정 on the sea screen. Music cannot start before the first
tap in a browser, so on that path it starts with the first tap.

The flow: title screen → onboarding (nickname, first search, first dive) →
코토리 invites the user into the submarine → a café inside it, whose bookshelf
opens the list of recorded anime. Tapping 코토리 in the café makes her say a
line with a matching expression.

```
src/features/otaku-diary/
  OtakuDiaryPage.jsx        picks the screen and starts the music
  domain/                   pure rules, no React or browser APIs:
                            depth, onboarding steps, search ranking,
                            the café lines and the Japanese voice script
  data/                     the only code that knows where data lives:
                            AniList for anime, our /api/diary for the diary
  hooks/                    state for screens (diary, search, sound, …)
  tokens.css                the design system's tokens (see below)
  ui/                       the design system's components: Button, Sheet, …
  screens/                  title, onboarding, sea, café, bookshelf
  components/               dialogue box, character, sea scene, sea life, …
  assets/                   art, voice/ clips, music/
```

Screens get their state from hooks and never touch storage or the network
themselves; only the repositories in `data/` do.

**Design system.** The diary has its own, structured like Material Design 3
(colour roles, a type scale, a shape scale) with the diary's own values.

- `tokens.css` is the single source of every colour, text size, weight,
  corner radius, control size and layer. Style files use `var(--od-…)`; one
  that needs a value the file lacks adds a token, not a literal. Drawings are
  exempt: the sea's gradients, glows and bubbles, shadows under character art,
  text shadows over pictures.
- Colour roles: **primary** (코토리's pink: main actions, selection, links),
  **secondary** (sea and sky: the sea screen's chrome), **tertiary** (paper and
  wood: bookshelf and café), **error** (anything that deletes for good), and
  **surface** with four strengths of text on it. A screen sets `--od-outline`
  to its own outline colour and the outlined buttons and chips on it follow.
- `ui/` holds the shared pieces, built only from tokens. Use these instead of
  styling a new button or sheet by hand:

  | Component | For |
  | --- | --- |
  | `Button` | every text button; `variant` filled, tonal, outlined, text, danger, dangerText; `size` s, m, l |
  | `IconButton` | a round icon-only button (back, close); needs a `label` |
  | `Icon` | Material Symbols, by name |
  | `TopBar` | the bar at the top of a screen you can leave: back button, centred title, one action |
  | `Sheet`, `SheetActions` | anything that rises from the bottom: forms, details, settings |
  | `Dialog` | a question in the middle of the screen that cannot be undone |
  | `TextField` | a framed input or textarea, with label, hint and counter |
  | `Switch` | an on/off setting that applies at once |
  | `Select` | one choice from a short list that would take too much room laid out (the bookshelf's order); a chip that opens a menu |
  | `SegmentedControl` | one choice among a few, all visible (language, login/signup) |
  | `Chip` | a filter that presses in, or a small label (genres, tags) |
  | `Message` | a note or an error under a form |

- Rules of use: one filled button per screen or sheet, with a tonal 취소 to its
  left; deleting is always `danger`, behind a `Dialog`; no soft shadows on
  controls, and no gradients on them; icons are never emoji or text glyphs.
- A component takes a `className` for layout (margins, width) and the rare
  local variation. Its own rules weigh one class each, so the caller's class
  wins as long as the ui component is imported before the module's stylesheet.

**Data.** Anime come from the public [AniList](https://anilist.co) API, called
from the browser (credited in the UI). The 200 most popular titles are fetched
once and cached for a week, so a search returns results from its first letter.

AniList has no Korean titles, so a query with Hangul in it goes to
`/api/anime/search` (`worker/anime.js`) instead. The Worker asks
[TMDB](https://www.themoviedb.org) which animation the Korean title names and
returns each one's original title; the browser looks those up on AniList in one
request, and the exact match is shown under its Korean title. TMDB's search
matches whole words, so one syllable ("사") finds little: `/api/anime/popular`
returns the ~700 most-voted Japanese animation with Korean titles, which the
browser keeps for a week and matches by prefix, ahead of TMDB's own results.
This needs a TMDB
key (a v3 API key or a v4 read access token, from themoviedb.org → Settings →
API): `TMDB_API_KEY=…` in `.dev.vars` for `pnpm dev`, and
`pnpm wrangler secret put TMDB_API_KEY` for the deployed Worker. Without it
Korean searches say so and English ones work as before. This product uses the
TMDB API but is not endorsed or certified by TMDB.

**The diary's backend.** The nickname and the recorded anime live in a
Cloudflare D1 database, behind `/api/diary` (routes are listed at the top of
`worker/diary.js`). A visitor is recognised by a random token in an HttpOnly
cookie, set on their first write, and the database keeps only the token's
hash. Without an account, a diary belongs to that one browser.

**Accounts.** The title screen leads with 로그인, then 비회원으로 시작하기
for using the diary without an account, and a 회원가입 link. Accounts are an ID
and a password (`worker/auth.js`); logging in or signing up goes straight into
the diary. A new account always starts empty, with onboarding: a diary made in
the browser without an account is not carried over, and is deleted on sign-up
(the form says so). Logging in on another device opens that diary, and an
anonymous diary already made on that device is merged into it. Logging out
leaves the browser with a blank diary; the account's stays on the server.

- Passwords are stored only as a salted PBKDF2-SHA256 hash, 100,000 rounds
  (the most Workers allows), in the `credentials` table.
- Five wrong passwords in a row lock an ID for five minutes.
- There is no email, so there is no password recovery: a forgotten password
  can only be reset by hand in the database. The sign-up form says so.
- The empty `identities` table is kept for an external login provider later.
- Signing up needs the "만 14세 이상입니다" box ticked; the server checks it too.
- 계정 삭제, in 설정 on the sea screen, asks for the password, then deletes the
  account, its records and every session.
- A visitor without an account is forgotten once their session has expired
  (a year after their last visit): their records go with it.

**Privacy policy.** `/otaku-diary/privacy` is linked from the title screen and
the sign-up form. Its text is `domain/privacy.js` and describes what the code
does: change it in the same commit as any change to what is stored, where, or
which outside services the page contacts. The contact address shown on the
page is `CONTACT_EMAIL` in the same file.
A diary recorded in `localStorage` before the backend existed is sent to the
server once, on the next visit, and merged.

The bookshelf shows the records as a grid of posters, or as a list with bigger
posters, the studio and each comment; the user switches between them, and the
choice is remembered in the browser, as is the order (최근 기록순, 별점 높은순,
제목순, 방영연도순). 필터 opens a sheet that narrows by star rating, genre,
studio and format: several values of one kind match any of them, and kinds
combine. The sheet shows how many titles each choice has and how many the
whole selection leaves, and applies only on "N편 보기"; what is applied shows
as removable chips above the shelf. The layout follows Apple's guidance
(images in a grid, text in a list) and Baymard's mobile filtering research
(one filter button, a sheet, a result count, visible applied filters).
Filtering and sorting are `domain/filters.js` and `domain/sort.js`. Genre and studio are not stored with a record: they are fetched from
AniList for the whole bookshelf, 50 titles per request, and cached in the
browser for a week.

Tapping a title on the bookshelf opens its details: the synopsis, genres,
non-spoiler tags, facts and, when AniList has one, the YouTube trailer. Records are
removed the way a phone's list does it: holding a row down (or 선택 in the
header) starts selecting, taps tick more rows, and 삭제 in the bar at the
bottom removes them all in one request once a dialog has confirmed it. 책장에서
삭제 at the foot of the details does the same for that one title. Ratings and
comments go with the records; the submarine rises by that title's depth. The
synopsis is TMDB's Korean one when `/api/anime/overview` finds the title there
(a later season gets its series' synopsis, as TMDB keeps one per series), and
AniList's English one otherwise. Details are fetched only when a title is opened and cached
for a week; the trailer loads only when tapped, and the music pauses while it
plays.

**Settings.** 설정, in the top right of the sea screen, holds the account, the
sound controls (below) and the language of anime information. The account
section has 로그아웃 and 계정 삭제 for someone logged in, and 로그인 and 회원가입
for a visitor. Logging out or deleting the account leaves a blank visitor, who
is sent back to the title screen; a new account goes to onboarding. With English chosen, titles,
synopses, genres and tags are AniList's own; menus and 코토리's lines stay
Korean. A record keeps the title it was saved under, so the bookshelf shows
its English title from the same AniList request that loads genres and studios.
The sheet ends with 정보: the operator and contact address, a link to the
privacy policy, and the list of open source software, fonts, sounds and data
sources the diary uses. That list is `domain/credits.js`; change it in the
same commit as any change to dependencies, fonts, sounds or outside services.

**Art.** The character, submarine, café, sea life and backgrounds were drawn
with Codex image generation. Icons are [Material Symbols](https://fonts.google.com/icons)
(Rounded, Apache 2.0), copied as SVG paths into `components/Icon.jsx`, so
nothing is fetched for them; use `<Icon name="…" />` rather than an emoji or a
text glyph.

**Sound.** All sound is behind one on/off toggle, remembered per browser. 설정,
in the top right of the sea screen, has the same toggle and a volume slider
each for the music and the voice, both starting at 50%. Onboarding keeps
the SOUND ON/OFF button, as it comes before the sea screen; the café and the
bookshelf have none.

- Background music, `assets/music/sparkling-seaside-adventure.mp3`, plays on
  every screen except the title, quietly, and dips further while 코토리 speaks.
- Voice clips in `assets/voice/` are generated ahead of time; the app only
  plays files. They use the コハク voice from
  [AivisSpeech](https://aivis-project.com/), under the
  [Aivis Common Model License 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md).

To change a line, edit `domain/voiceLines.js` (and the Korean text in
`domain/onboarding.js` or `domain/chatter.js`), start a local AivisSpeech
engine, and regenerate the clips (ffmpeg is needed too):

```sh
node scripts/kotori-voice.mjs --list                     # voices and style ids
node scripts/kotori-voice.mjs --speaker 1878365376       # every clip, コハク
node scripts/kotori-voice.mjs --speaker 1878365376 --only greet,chatPoke
```

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
pnpm dev        # vite dev server; also serves /api/* with a local D1 database
pnpm lint       # oxlint
pnpm build      # production build into dist/
pnpm preview    # serve the build locally (static files only, no /api)
pnpm db:migrate           # apply new migrations/ files to the production database
pnpm db:migrate:preview   # ...and to the database PR previews share
```

`pnpm dev` runs the Worker's handler inside Vite against a local database in
`.wrangler/`, and applies migrations to it on start. The two remote databases
are not migrated by deploys: after adding a file to `migrations/`, run the two
`db:migrate` commands before the code that needs it goes live. PR previews use
their own database (`previews` in `wrangler.jsonc`), never production's.
