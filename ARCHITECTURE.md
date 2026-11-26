# ARCHITECTURE.md — The Map

> Companion to `AGENTS.md` (rules). This file describes **structure, interfaces, and data flow**.
> Read it before adding a module, a page, or a provider. If code and this document disagree, the document
> wins until the human says otherwise — then update the document in the same commit as the code.

---

## 1. System Overview

ClassZero is a **static site with a client-side application runtime**. There is no server, no database, no
authentication service, and no API of our own. The host does one thing: serve files.

```
 ┌─────────────────────────── Browser (the only runtime) ───────────────────────────┐
 │                                                                                  │
 │   HTML shells          CSS layers              ES modules (vanilla)              │
 │   ───────────          ──────────              ─────────────────────              │
 │   index.html           reset → tokens          core/    (state, events, router)  │
 │   lessons.html    →    → base → layout    +    modules/ (domain logic)            │
 │   notes.html           → components            ui/      (render, views)          │
 │   settings.html        → utilities             utils/   (pure helpers)           │
 │                                                                                  │
 │   Persistent state: localStorage (small, hot) + IndexedDB (notes, keys, caches)   │
 └───────────────────────────────────────┬──────────────────────────────────────────┘
                                         │  fetch() with the USER'S key,
                                         │  only when the user asks for an AI action
                                         ▼
                     Third-party AI provider (user-owned account, CORS-enabled)
```

Consequences of "no server" that shape every decision:

| Reality | Architectural response |
| --- | --- |
| No secrets on the server | BYOK: keys live in the user's browser, encrypted at rest if remembered (`AGENTS.md §7`). |
| No request proxying | Calls go **browser → provider directly**; the provider must allow CORS. Providers without CORS are unsupported. |
| No server-side rendering | Every page has a real, crawlable HTML shell; JS enhances it. Content that must be indexed ships in HTML. |
| No server routing | Hash-based routing (`#/lesson/3`) plus one real HTML file per top-level page. |
| No server push/sync | Local-first. Everything works offline except explicit AI calls. |
| Deploys are file copies | Paths must be **relative** so GitHub Pages project sites (`/repo/`) and custom domains both work. |

---

## 2. Hosting & Path Contract

- Serving root = repository root. `index.html` sits at the root.
- **All local asset paths are relative** (`./src/css/base.css`, `../assets/icons/check.svg`).
  Root-absolute paths (`/src/...`) break GitHub Pages project deployments — banned.
- No trailing-slash assumptions; links point at explicit files (`notes.html`).
- HTTPS only (required by Web Crypto, service workers, and most AI provider CORS policies).
- No redirects, no rewrites, no custom headers. Everything the app needs must be achievable with files.
- A `404.html` at the root provides the fallback page on GitHub Pages.

---

## 3. Folder Structure

Target structure. Files marked `(later)` are planned, not yet created. Do not create empty placeholders.

```
/
├── AGENTS.md                     # rulebook (read-only for agents)
├── ARCHITECTURE.md               # this file
├── PROGRESS.md                   # logbook / board
├── README.md                     # human-facing intro + run instructions
│
├── index.html                    # Home: welcome, resume-where-you-left-off, quick links
├── lessons.html                  # Lesson/unit browser (later)
├── practice.html                 # Quiz + practice runner (later)
├── notes.html                    # NoteTaker workspace (later)
├── settings.html                 # API keys, theme, LEDM, data & privacy (later)
├── 404.html                      # (later)
│
├── assets/
│   ├── icons/
│   │   ├── src/                  # hand-authored individual SVGs (source of truth)
│   │   └── sprite.svg            # GENERATED — do not hand-edit
│   └── img/                      # optimised raster images only (< 40 KB each)
│
├── src/
│   ├── css/
│   │   ├── reset.css             # modern minimal reset
│   │   ├── tokens.css            # ALL design tokens (colour, type, space, radii, shadows)
│   │   ├── base.css              # element defaults, typography, form primitives
│   │   ├── layout.css            # app shell, grids, containers
│   │   ├── utilities.css         # .u-* helpers (visually-hidden, stack, cluster)
│   │   └── components/           # one file per component block
│   │       ├── button.css
│   │       ├── card.css
│   │       ├── quiz-card.css
│   │       ├── field.css
│   │       └── toast.css
│   │
│   ├── js/
│   │   ├── main.js               # entry point: boot sequence, page dispatch
│   │   │
│   │   ├── core/
│   │   │   ├── config.js         # APP_NAME, STORAGE_VERSION, PROVIDER_ORIGINS, feature flags
│   │   │   ├── events.js         # tiny pub/sub event bus
│   │   │   ├── store.js          # in-memory app state + subscribe/notify
│   │   │   └── router.js         # hash router for in-page views
│   │   │
│   │   ├── modules/
│   │   │   ├── StorageManager.js # the ONLY module that touches Web Storage / IndexedDB
│   │   │   ├── BYOKManager.js    # key capture, memory vault, AES-GCM at-rest vault
│   │   │   ├── APIHandler.js     # provider-agnostic fetch layer (timeout, cancel, retry)
│   │   │   ├── ProviderRegistry.js # per-provider request/response adapters
│   │   │   ├── QuizEngine.js     # question flow, grading, attempt history
│   │   │   ├── NoteTaker.js      # create/edit/search notes (IndexedDB-backed)
│   │   │   ├── ProgressTracker.js# per-topic mastery, streaks, resume point
│   │   │   ├── ContentRepository.js # load + cache curriculum JSON
│   │   │   └── SettingsManager.js# theme, font scale, LEDM, locale; applies to <html>
│   │   │
│   │   ├── ui/
│   │   │   ├── UIRenderer.js     # safe DOM helpers (el, html-tag, patch, mount)
│   │   │   ├── components/       # reusable widgets (toast.js, dialog.js, key-field.js)
│   │   │   └── views/            # one module per page: home.js, practice.js, notes.js…
│   │   │
│   │   └── utils/
│   │       ├── dom.js            # $, $$, on, delegate, escape, focus trap
│   │       ├── crypto.js         # PBKDF2 + AES-GCM wrappers over crypto.subtle
│   │       ├── validate.js       # schema-ish guards for user + imported data
│   │       ├── format.js         # dates, durations, marks, pluralisation
│   │       ├── debounce.js       # debounce/throttle/rafThrottle
│   │       └── log.js            # levelled logger with secret redaction
│   │
│   └── data/
│       ├── curriculum/
│       │   └── class9/
│       │       ├── index.json            # units → lessons manifest
│       │       └── science-01-matter.json # one file per lesson (schema below)
│       └── seed/
│           ├── notes.json                # sample notes shipped so Notes is never empty
│           └── progress.json             # seeded progress/streak so home looks alive (optional)
│
├── tests/
│   ├── index.html                # opens the assert runner in a browser
│   ├── assert.js                 # ~40-line tiny harness (no dependencies)
│   └── *.test.js                 # unit tests for pure logic (QuizEngine, validators…)
│
└── scripts/                      # (later) local-only helpers, never shipped behaviour
    └── build-sprite.sh
```

Rules implied by the tree:

- `/src` is source. Nothing in `/src` is generated. Nothing outside `/src` is application logic.
- `/assets` holds binaries and hand-authored SVGs only.
- `/tests` and `/scripts` are never referenced by shipped pages.
- One component = one CSS file + (if stateful) one JS module. Co-locate, don't centralise.

---

## 4. Runtime Layers

Strict layering. **Imports may only point downward.** A cycle is a design bug.

```
┌──────────────────────────────────────────────────────────────┐
│ 4. Entry        main.js                                      │  wiring only
├──────────────────────────────────────────────────────────────┤
│ 3. UI           ui/views/*  ui/components/*  UIRenderer      │  DOM in, DOM out
├──────────────────────────────────────────────────────────────┤
│ 2. Domain       QuizEngine, NoteTaker, ProgressTracker,      │  pure-ish logic,
│                 ContentRepository, SettingsManager           │  no DOM, no fetch
├──────────────────────────────────────────────────────────────┤
│ 1. Platform     StorageManager, BYOKManager, APIHandler,     │  side effects live
│                 ProviderRegistry, router, events, store       │  ONLY here
├──────────────────────────────────────────────────────────────┤
│ 0. Utils        dom, crypto, validate, format, debounce, log │  pure, no imports
└──────────────────────────────────────────────────────────────┘
```

- Domain modules receive platform services by **injection** (`createQuizEngine({ storage, events })`), which
  keeps them testable in `/tests` without a DOM or a network.
- UI may read the store and call domain functions. UI must **never** call `fetch` or `localStorage`.
- Utils import nothing from our own tree (except each other in the same tier, one-way).

---

## 5. Core Modules — Contracts

Public API shapes below are the intended contract. Implement them as written unless this file is updated.

### 5.1 `StorageManager.js` — the only door to persistence

**Responsibility:** namespaced, versioned, validated access to `localStorage` + IndexedDB; migrations;
quota handling; export/import.

```js
export async function init()                          // open DB, run migrations
export function get(key, fallback)                    // sync read of a namespaced localStorage key
export async function set(key, value)                 // debounced write; throws StorageQuotaError
export function remove(key)
export function subscribe(key, cb) → unsubscribe
export async function put(storeName, record)          // IndexedDB
export async function getRecord(storeName, id)
export async function getAll(storeName)
export async function removeRecord(storeName, id)
export async function exportAll()   → object JSON    // NEVER includes secrets
export async function importAll(json)                 // validates, merges, migrates
export async function eraseAll()                      // deletes all cz:* keys + DB; verifies
```

- Prefixes every key with `cz:v{STORAGE_VERSION}:`.
- Serialises values as JSON; validates on read and falls back to `fallback` on corrupt data (and logs at `warn`).
- Handles `QuotaExceededError` by raising a typed error the UI can explain.
- Never logs values (they may contain user content); logs key names and byte sizes at `debug` only.

### 5.2 `BYOKManager.js` — key custody

**Responsibility:** capture keys, hold them in memory, optionally encrypt at rest, expose a key *only* to
`APIHandler` at request time, redact everywhere else.

```js
export function addKey({ provider, secret, remember, passphrase }) → Promise<void>
export function hasKey(provider) → boolean
export function getKeyForRequest(provider) → string        // throws KeyLockedError / KeyMissingError
export function listConfigured() → [{ provider, masked, tier, createdAt }]  // never raw keys
export function mask(secret) → 'abc…9f2a'
export async function unlock(passphrase)                   // decrypt vault into memory
export function lock()                                     // drop in-memory plaintext
export async function removeKey(provider)                  // overwrite + delete
export async function removeAllKeys()
export function onLockChange(cb) → unsubscribe
```

- Default tier is **memory only** (`AGENTS.md §7.2`). Nothing is written unless the user opts in.
- `getKeyForRequest` is the *only* getter that returns plaintext, and only to `APIHandler`.
- Keys are cleared on `pagehide`. Records live in IndexedDB store `keys` (ciphertext only).

### 5.3 `ProviderRegistry.js` + `APIHandler.js` — the network layer

**Responsibility:** `ProviderRegistry` describes *how to talk to a provider*; `APIHandler` performs the call
safely. UI never constructs URLs or headers.

```js
// ProviderRegistry.js
export const PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    origin: 'https://api.openai.com',
    keyPattern: /^sk-[A-Za-z0-9_-]{20,}$/,
    docs: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o-mini'],
    buildRequest({ key, model, messages, signal }) → { url, init },
    parseStream(chunkText) → { delta } | { done: true },
    classifyError(status, body) → 'auth' | 'rate_limit' | 'quota' | 'bad_request' | 'server' | 'network'
  }
  // google, openrouter, groq, anthropic … same shape
};

export function getProvider(id) → config
export function listProviders() → config[]
```

```js
// APIHandler.js
export async function chat({ providerId, messages, model, signal, onDelta }) → { text, usage }
export async function testKey({ providerId }) → { ok, latencyMs, error? }   // 1-token ping
export function abortAll()
```

`APIHandler` guarantees, for every provider:

| Guarantee | Implementation |
| --- | --- |
| Timeout | `AbortSignal.any([userSignal, AbortSignal.timeout(ms)])`, default 45 s |
| Cancellation | Caller-supplied `AbortSignal`; aborting surfaces `AbortError` and never a fake failure toast |
| Retry | Only on `network` and `5xx`, max 2 retries, exponential backoff + jitter. **Never** retry `4xx`. |
| Key hygiene | Key injected into headers only; never into URLs (some providers accept `?key=` — refused) |
| Logging | `{ provider, model, status, ms, bytes }` at `debug`; never prompt text, never headers |
| Error shape | Typed `APIError { kind, message, retryable, providerId }` — UI maps `kind` → human sentence |
| Streaming | `ReadableStream` + `TextDecoder`; UI paints at most every 120 ms (LEDM) |

### 5.4 `QuizEngine.js`

```js
export function createQuizEngine({ questions, progress, events })
  .start(lessonId)            // builds a session (order, shuffling per settings)
  .current() → { question, index, total }
  .answer(choiceIndex)        // grades, records attempt, emits 'quiz:answered'
  .next() / .previous() / .finish()
  .summary() → { correct, total, accuracy, perTopic }
```

- Pure grading logic, no DOM. Explanations are content, not generated.
- Emits `quiz:answered`, `quiz:finished`; `ProgressTracker` listens and persists.
- Never mutates stored progress directly; goes through `ProgressTracker`.

### 5.5 `NoteTaker.js`

```js
export function createNoteTaker({ storage })
  .create({ title, body, topicId }) → Note
  .update(id, patch) → Note
  .list({ topicId, query }) → Note[]        // search in-memory over metadata; body on demand
  .remove(id)                                // soft-delete with 10 s undo window
  .exportMarkdown() → string
```

- Notes live in IndexedDB store `notes` (bodies can be large). Autosave debounced 500 ms.
- No rich text editor. Plain text + Markdown-lite; render through the allowlist renderer only.

### 5.6 `ProgressTracker.js`

```js
export function createProgressTracker({ storage, events })
  .recordAttempt({ questionId, correct, topicId, ms })
  .topicMastery(topicId) → { attempts, correct, mastery }   // 0..1, own formula documented
  .lastPosition() / .setLastPosition({ page, lessonId })
  .streak() → { current, longest, lastActiveDay }
```

### 5.7 `ContentRepository.js`

```js
export async function listUnits()
export async function getLesson(lessonId) → Lesson
export async function prefetchUnit(unitId)                // user-initiated only
export function clearCache()
```

- Fetches JSON **only** from `./src/data/curriculum/…` (same origin). Never third-party.
- Caches parsed lessons in memory; optional Cache API layer in the offline phase.
- Validates shape before use; a malformed file fails to a friendly error, never a blank screen.

### 5.8 `SettingsManager.js`

```js
export function init()                       // read stored settings, apply to <html>
export function get() → Settings
export function update(patch)                // persists + applies + emits 'settings:changed'
export function detectLEDM() → boolean
```

Applies `data-theme`, `.ledm`, and `--font-scale` on `document.documentElement`. This is the **only**
place that writes to `<html>`.

### 5.9 `store.js`, `events.js`, `router.js`, `UIRenderer.js`

- `store.js`: flat, serialisable app state (`{ settings, session, progressMeta, route }`) with
  `getState()`, `patch(partial)`, `subscribe(cb)`. It is a cache for rendering, not a source of truth —
  persisted truth lives in `StorageManager`.
- `events.js`: `on(name, cb)`, `off`, `emit(name, detail)`, ~25 lines, no wildcards needed. Channel names are
  namespaced strings: `'storage:changed'`, `'quiz:answered'`, `'api:error'`, `'settings:changed'`.
- `router.js`: hash routes only. `#/`, `#/lessons`, `#/lesson/:id`, `#/practice/:id`, `#/notes`, `#/settings`.
  Parse → resolve view module → mount → update `<title>` and focus the new `<h1>`. Unknown route → 404 view.
- `UIRenderer.js`: `el(tag, props, children)`, `mount(parent, node)`, `patch(node, html)`-free safe updates,
  `setText(node, text)`, `showToast(msg, kind)`. All text via `textContent`.

---

## 6. Data Flow

### 6.1 Boot sequence (`main.js`)

```
DOMContentLoaded
  ├─ 1. SettingsManager.init()        read settings, apply theme + LEDM class  (sync, before paint ideally)
  ├─ 2. StorageManager.init()         open DB, run migrations                    (await)
  ├─ 3. store.hydrate()               load progress meta, last position          (await, small)
  ├─ 4. router.start()                resolve route → mount view
  ├─ 5. view.init()                   bind events, render from state
  └─ 6. idle work (requestIdleCallback, optional)
         └─ ContentRepository prefetch of the next lesson
```

Rules: the shell must render **before** any network/AI work. Boot never blocks on a third-party request.
If `StorageManager.init()` fails (private mode, corrupted DB), the app continues in **memory-only** mode and
shows a dismissible notice — it does not white-screen.

### 6.2 Write path — user input → storage → UI

```
User types in a note
        │  input event (view layer)
        ▼
ui/views/notes.js  ── debounce(500ms) ──►  NoteTaker.update(id, { body })
                                                │
                                                ├─► StorageManager.put('notes', record)   [IndexedDB]
                                                │         │
                                                │         └─ success → events.emit('storage:changed', {store:'notes'})
                                                └─► events.emit('note:updated', { id, savedAt })
                                                          │
                                                          ▼
                                              ui: status pill "Saved" (aria-live=polite)
```

Key properties:

- **UI is updated optimistically** from local state, then reconciled when persistence resolves.
- Failure is visible: "Not saved — storage full" with a retry action. No silent data loss.
- `storage:changed` is debounced before triggering re-renders, so a burst of keypresses paints once.

### 6.3 Read path — storage → state → UI

```
route change (#/practice/12)
   → router resolves view
   → view.init(): ProgressTracker.lastPosition(), ContentRepository.getLesson(12)
   → store.patch({ session: {...} })
   → UIRenderer builds nodes from state (createElement/textContent, no innerHTML)
   → document.title + focus the h1
```

Rendering is **explicit, targeted updates** of the nodes a change affects — no virtual DOM, no full-page
re-render, no template re-parsing per keystroke.

### 6.4 API path — BYOK request lifecycle

```
User clicks "Explain this answer"
        │
        ▼
ui/views/practice.js
        │ 1. hasKey(provider)?  ── no ──► inline prompt: "Add your free key in Settings" (no modal wall)
        │ 2. set aria-busy, render skeleton-free "Thinking…" line, create AbortController
        ▼
APIHandler.chat({ providerId, messages, signal, onDelta })
        │
        ├─ BYOKManager.getKeyForRequest(provider)      → plaintext, in memory, request-scoped
        ├─ ProviderRegistry.buildRequest(...)          → url + headers + body
        ├─ fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal })
        │      │
        │      ├─ 401/403 → APIError('auth')      → "Key rejected. Check it in Settings." + deep link
        │      ├─ 429     → APIError('rate_limit')→ "Provider limit reached. Try again in Ns."
        │      ├─ 402/insufficient_quota → 'quota'
        │      ├─ 5xx     → retry ×2 → then 'server'
        │      ├─ abort   → silent (user cancelled) — no toast, no state damage
        │      └─ ok      → stream chunks → onDelta(text) → UI appends text nodes
        ▼
UI finalises message, stores chat in memory only (optional opt-in to save as a note)
```

Hard rules for this path:

- The key is **never** logged, never in the URL, never echoed into the DOM, never included in an error message.
- The conversation is **not** persisted by default. If the user saves it, it becomes a normal note (local only).
- The app is fully usable with **zero keys configured** — every non-AI feature works.

### 6.5 Persistence map

| Data | Where | Why |
| --- | --- | --- |
| Settings (theme, LEDM, font scale, language) | `localStorage` `cz:v1:settings` | Tiny, needed synchronously at boot to avoid a flash |
| Profile (display name — optional, local only) | `localStorage` `cz:v1:profile` | Tiny |
| Progress (per-topic counters, last position, streak) | `localStorage` `cz:v1:progress` | Small JSON, hot |
| BYOK metadata (provider, tier, masked hint, createdAt — **no secret**) | `localStorage` `cz:v1:byok:meta` | Needed to render Settings instantly |
| BYOK ciphertext | IndexedDB `keys` | Never in localStorage; ciphertext only |
| Notes (title + body) | IndexedDB `notes` | Can be large; bodies loaded on demand |
| Quiz attempt history (capped ring, 500 entries) | IndexedDB `attempts` | Grows; ring-buffered |
| Curriculum cache (optional, phase 3) | Cache API / IndexedDB `content` | Offline support |
| Conversation with AI | **memory only** | Privacy default; opt-in to save |

Schemas carry a `schemaVersion` field. Any change requires a migration in `StorageManager.init()` and an
entry in `PROGRESS.md → Decisions`.

---

## 7. API "Routes" — There Are None

**This project has no server and therefore no API routes, no endpoints of its own, no `/api/*`, and no
webhooks.** Nothing is ever sent to the project's own domain. There is no origin to send it to.

All network activity is:

1. **Same-origin static files** — HTML, CSS, JS, JSON curriculum. `fetch('./src/data/...')` with default
   caching. No credentials (`credentials: 'omit'`).
2. **Client-side calls to third-party providers, authorised by the user's own key.**

```
Browser ──(user's key)──► https://api.openai.com/…            ← direct, no proxy, no middleman
Browser ──(user's key)──► https://generativelanguage.googleapis.com/…
Browser ──(user's key)──► https://openrouter.ai/api/v1/…
Browser ──(user's key)──► https://api.groq.com/…
```

### 7.1 Provider registry (initial, phase 4)

| Provider id | Origin | Notes |
| --- | --- | --- |
| `openai` | `https://api.openai.com` | OpenAI-compatible chat completions; CORS allowed |
| `google` | `https://generativelanguage.googleapis.com` | Gemini; free tier available; key in query is **refused by us** — use the header form where supported |
| `openrouter` | `https://openrouter.ai` | Many models, including free ones; single key |
| `groq` | `https://api.groq.com` | Fast/cheap, free tier |
| `anthropic` | `https://api.anthropic.com` | Requires `anthropic-dangerous-direct-browser-access` header for browser use |

Exact endpoints, headers, and model ids are **verified at implementation time** against each provider's
current docs; `ProviderRegistry.js` is the single place to change them. Adding a provider requires updating
`PROVIDER_ORIGINS` in `config.js` **and** the CSP `connect-src` list in every HTML head, in the same commit.

### 7.2 CORS reality check

Because the browser calls the provider directly:

- Providers that do not send `Access-Control-Allow-Origin` for our origin cannot be supported. Their absence
  is a hard technical limit, not a bug — the "Configure" screen says so plainly.
- A custom `Authorization` header triggers a preflight `OPTIONS`. The provider must allow the headers we send
  (`authorization`, `content-type`) — verified per provider before shipping the adapter.
- No `mode: 'no-cors'` (opaque responses are useless and hide failures).
- No credentials/cookies to providers; keys only, in headers.

### 7.3 What we deliberately do **not** build

- No key-relay endpoint ("for your convenience, paste your key into our proxy") — that would be a free
  credential-harvesting service.
- No shared/free pooled key. Users always bring their own.
- No server-side caching of AI responses.
- No usage tracking or cost dashboards that require sending prompts anywhere.

---

## 8. Rendering Strategy

- **HTML shells are real HTML.** Each page contains its landmarks, headings, and static content. JS enhances.
  A page must remain readable (if not interactive) with JS disabled or still loading.
- **Build DOM nodes, don't re-parse strings.** `UIRenderer.el()` + `<template>` cloning.
  `innerHTML` is banned for any interpolated data (`AGENTS.md §3.3`).
- **No virtual DOM.** Views keep references to the nodes they own and update them in place.
- **State → view is one-way.** Views never mutate `store` directly; they call domain functions, which update
  state and emit events; subscribers re-render the affected nodes.
- **Lists are bounded.** Render ≤ 50 rows at a time; "Load more" or windowing beyond that.
- **Event delegation** on the container for lists, not one listener per row.
- **Images**: `width`/`height` always set, `loading="lazy"` below the fold, `srcset` only where it saves bytes.
- **Four states per view, always.** Every view module exposes `renderLoading()`, `renderEmpty()`,
  `renderError(err)`, and its success render. A view that can fetch or save but has no empty/error branch is
  incomplete (`AGENTS.md` → Quality Bar).
- **Lazy below the fold.** Sections render on approach (`content-visibility: auto` where safe, else an
  IntersectionObserver that mounts once). The first viewport is the only thing built eagerly.
- **Progressive enhancement ladder**: HTML + CSS works → JS adds interactivity → AI features add convenience.

---

## 9. Routing

| Route | File / view | Purpose |
| --- | --- | --- |
| `index.html` | `ui/views/home.js` | Welcome, resume, quick actions |
| `index.html#/lessons` | `ui/views/lessons.js` | Unit/lesson browser |
| `index.html#/lesson/:id` | `ui/views/lesson.js` | Lesson reader |
| `index.html#/practice/:id` | `ui/views/practice.js` | Quiz runner |
| `#/notes` | `ui/views/notes.js` | Notes workspace |
| `#/settings` | `ui/views/settings.js` | Keys, appearance, data |
| anything else | `ui/views/not-found.js` | Friendly recovery links |

- Hash routing only — static hosts cannot rewrite paths. (One real HTML file per *page* if a page grows large
  enough to deserve its own URL and its own `<title>`; the hash handles in-page views.)
- Router responsibilities: parse, guard (a lesson route with an unknown id → not-found view), mount, update
  `document.title` from the view's `title`, move focus to the `<h1>`, scroll to top, announce route change.
- Back/forward must work for every in-app navigation (never `history.pushState` behind a stale view).
- Deep links are shareable and must survive a cold load (route parsed after boot, not before).

---

## 10. Error Handling & Observability (local only)

- **Typed errors** over strings: `StorageQuotaError`, `KeyLockedError`, `KeyMissingError`,
  `APIError { kind, retryable }`, `ContentError`. UI maps type → human sentence + next action.
- **Three severities at the UI level:** recoverable inline notice, blocking panel (with a way out), silent
  abort (user-initiated cancel).
- **Local error ring buffer** (last 20 errors, no payloads, no keys) in memory, viewable via
  `?debug=1 → Diagnostics`. Never uploaded.
- **Never** let an exception produce a blank page: `window.onerror` / `unhandledrejection` handlers show a
  "Something broke — reload / reset data" panel.
- **No** third-party error reporting, ever (`AGENTS.md §2.2`).

---

## 11. Offline & PWA (phase 3 — not yet)

Planned, deliberately deferred until the core flows work:

- `manifest.webmanifest` + inline SVG icons; `display: standalone`, `theme_color` from tokens.
- Hand-written `service-worker.js` (no Workbox): precache the shell; network-first for curriculum JSON;
  cache-first for icons/CSS; **never** cache provider API responses or anything with an `Authorization` header.
- Version constant injected at the `// === GENERATED: VERSION ===` marker; old caches deleted on `activate`.
- "Update available" toast; never force-reload mid-task.

---

## 12. Curriculum Content Schema

Content is data, authored per lesson, and validated by `ContentRepository`. Reference shape:

```json
{
  "schemaVersion": 1,
  "id": "science-01-matter",
  "class": 9,
  "subject": "science",
  "unit": "matter-around-us",
  "title": "Matter in Our Surroundings",
  "lang": "en",
  "estimatedMinutes": 12,
  "objectives": ["State the properties of particles of matter"],
  "sections": [
    { "type": "text", "md": "Particles of matter are very small…" },
    { "type": "callout", "variant": "note", "md": "Remember: …" },
    { "type": "formula", "tex": "p = F/A", "alt": "pressure equals force over area" }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "prompt": "Which state of matter is most compressible?",
      "options": ["Solid", "Liquid", "Gas", "Plasma"],
      "answerIndex": 2,
      "explain": "Gas particles are far apart, so they compress easily."
    }
  ],
  "topicTags": ["states-of-matter"]
}
```

- **Seeded content is mandatory.** The repository ships enough real content that the app looks and behaves like
  a finished product on first load: ≥ 1 complete lesson with questions and explanations, a handful of sample
  notes (`src/data/seed/notes.json`), and a home screen that is not empty. No lorem ipsum, no "coming soon".
- No HTML in content. Markdown-lite only, rendered through the allowlist renderer.
- `answerIndex` maybe shuffled at runtime for display; the canonical answer stays in the data.
- Media referenced by relative path under `/assets`; every file < 40 KB unless it is audio.

---

## 13. Testing Without a Build Step

- `tests/index.html` loads `assert.js` + `*.test.js` as modules and prints pass/fail. No runner, no config,
  no install. Open the file, read the page.
- Unit-test the **pure** layers: `QuizEngine` grading, `validate.js`, `format.js`, mastery maths,
  provider `parseStream`/`classifyError` adapters (with recorded fixtures).
- Manual QA matrix per release: 320 px / 200 % zoom / keyboard-only / reduced-motion / dark theme / LEDM /
  Safari private mode / offline after first load / invalid API key / expired key / aborted request.
- Nothing in the shipped site imports from `/tests`.

---

## 14. Extension Guides

Every guide below is an implementation sequence, not permission to start. Any of them that is bigger than a
trivial tweak goes through the **Workflow Protocol** in `AGENTS.md` first: post the plan, get `Approved`, then
execute.

**Add a page**
1. Create `src/js/ui/views/<name>.js` exporting `init(rootEl)`.
2. Add the route (or a new HTML shell if it needs its own URL/`<title>`).
3. Add a component CSS file if it introduces a new block; import nothing new at the top level.
4. Update `PROGRESS.md`.

**Add a provider**
1. Add a config block to `ProviderRegistry.js` (`buildRequest`, `parseStream`, `classifyError`, `keyPattern`).
2. Add its origin to `PROVIDER_ORIGINS` **and** the CSP `connect-src` in every HTML head.
3. Verify CORS with a real preflight against a real key; record the result in `PROGRESS.md → Decisions`.
4. Add a fixture-based test for `classifyError`.

**Add a lesson**
1. Add JSON under `src/data/curriculum/class9/`.
2. Register it in `index.json`.
3. Validate against `§12`; check the file size budget.

**Add a persisted field**
1. Add it to the schema + `STORAGE_VERSION` migration if the shape changes.
2. Read/write only through `StorageManager`; test the migration with an old fixture.
3. Update `PROGRESS.md → Decisions`.

---

## 15. Open Questions (to resolve with the human)

1. **Name & branding** — "ClassZero" is a placeholder; the display name lives only in `config.js → APP_NAME`.
2. **Subjects** — start with Science only, or Science + Maths + Social Science at once?
3. **Language** — English-only first, or English + Hindi from day one? (Impacts copy and layout width.)
4. **Content source** — who authors lesson JSON, and against which syllabus (NCERT, CBSE, state board)?
5. **AI tutor scope** — free-form chat (cost risk on the user's key) vs. fixed "explain this / give me a
   hint / quiz me" actions (predictable, cheap, better prompts)? Recommendation: fixed actions first.
