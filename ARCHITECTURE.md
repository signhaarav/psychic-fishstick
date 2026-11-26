# ARCHITECTURE.md — The Map

> Companion to `AGENTS.md` (rules). This describes **what exists, what each file is for, and how data moves**.
> One sentence per file, deliberately: if a file needs a paragraph, it is doing too much (200-line cap).
> If code and this document disagree, the document is right until we change both together.

---

## 1. Shape of the system

VidyaSetu is **static files plus a browser-side script layer**. There is no server, no build step, no database.
Since the redesign it is shaped like an **app**, not a page: a fixed frame with three views and one scrolling area.

```
Host (GitHub Pages / python3 -m http.server)
        │  serves files, does nothing else
        ▼
 ┌────────────────────────── Browser ───────────────────────────┐
 │  index.html ──► styles/*.css (tokens → frame → views)        │
 │      │  app bar ─ viewport (only scroll container) ─ tab bar  │
 │      └─► modules/*.js ──► router.js (which view is visible)   │
 │               └─► services/*.js (storage + network)           │
 │                        ├─► localStorage  (user data)          │
 │                        └─► provider API  (BYOK)               │
 └────────────────────────────────────────────────────────────────┘
```

Measured first load, resolved through the import graph: **35 requests · 90.7 KB raw · 32.1 KB gzip**
(budget 200 KB).

Four consequences that shape everything:

| Reality | Response |
| --- | --- |
| No build step | Files load as written: `<script type="module">`, native CSS, ES modules with `.js` extensions. |
| Hosted under a sub-path (`/vidyasetu/`) | **Relative paths only** (`./styles/shell.css`). Root-absolute paths break on GitHub Pages project sites. |
| No server to hide anything | Keys are the user's, live in their browser, and go only to the provider they chose. |
| Phone-first, app-shaped | `body` never scrolls; `main#main` is the only scroll container; navigation swaps panes in place. |

---

## 2. Structure

Shipped as of the app-shell redesign (2026-11-26). Every file is ≤ 200 lines (`AGENTS.md §7`); where that cap
forced a split, the split is by responsibility.

```
/
├── index.html                 # The app shell: skip link, app bar, three views (Home, Subjects, Settings), tab bar / desktop rail, toast host, inline SVG sprite, four module <script> tags.
├── README.md                  # Human-facing intro: what it is, how to serve it, what it promises.
├── AGENTS.md                  # The rulebook. Untouched by the redesign — its §3.1 palette table is now stale (PROGRESS §4).
├── ARCHITECTURE.md            # This map.
├── PROGRESS.md                # The logbook.
│
├── styles/
│   ├── tokens.css             # Every design value: Editorial light + Studio dark palettes, type scale, 4px spacing grid, radii, two elevation levels, motion durations, frame sizes.
│   ├── base.css               # Reset, element defaults, focus ring, utilities, sprite host, skip link.
│   ├── shell.css              # The app frame: app bar, the single scrolling viewport, tab bar that becomes a rail, view entrance.
│   ├── components.css         # Buttons and the segmented control.
│   ├── controls.css           # Text fields, search, switch — boundaries use --line-control (≥ 3:1).
│   ├── sections.css           # View headers, surface blocks, the stat strip, detail headers.
│   ├── cards.css              # Subject rows and the five hue hooks (icon colour only).
│   ├── chapters.css           # Book groups and numbered chapter rows.
│   ├── states.css             # Loading / empty / error blocks.
│   ├── settings.css           # Settings view: appearance rows, key form, saved-key rows, about list.
│   ├── toast.css              # One toast, its action, its entrance, its desktop offset.
│   └── scrollbar.css          # Thin, theme-aware scrollbar for the viewport only.
│
├── modules/
│   ├── router.js              # Hash router: view visibility, tab aria-current, app-bar label, document title, scroll reset, focus to the view title.
│   ├── home.js                # Home view: real counts, the BYOK status line, subject shortcuts. No invented metrics.
│   ├── subjects.js            # Subjects view: searchable list, count, loading/empty/error states, pane swap into a subject.
│   ├── subjectPanel.js        # Chapter list for one subject (books → numbered chapters), pure rendering.
│   ├── subjectRow.js          # One subject as a tappable row, shared by Home and Subjects.
│   ├── contentStore.js        # One shared load of the catalogue per page; a failure is not cached.
│   ├── settings.js            # Settings view: theme radios, LEDM switch, provider select, key save/test/remove-with-undo.
│   ├── keyList.js             # Masked key rows and the honest "no keys yet" state.
│   ├── theme.js               # Light/dark/system resolution, LEDM detection, settings persistence, theme-color meta.
│   ├── toast.js               # notify(message, opts) into the single aria-live region.
│   └── dom.js                 # el() and svgIcon() helpers — no state, no data access, no HTML strings.
│
├── services/
│   ├── storageService.js      # The only code that touches localStorage: namespaced read/write/remove/clear, JSON-safe, quota- and private-mode-aware.
│   ├── byokService.js         # The only code that holds or sends keys: CRUD, masking, test call, typed errors. Never logs a key.
│   ├── providers.js           # The provider registry: id, label, origin, key hint, docs URL, test-request builder.
│   └── contentService.js      # The only code that fetches content: loads and validates data/subjects.json, typed ContentError.
│
├── data/
│   ├── subjects.json          # Seeded Class 9 NCERT catalogue: 5 subjects, 12 books, 72 real chapter titles, hue + icon keys.
│   └── lessons/               # (Session 1) One JSON file per lesson plus index.json. Not created yet.
│
└── assets/
    └── icons/                 # Source .svg files (7): favicon, logo, one per subject. The shipped marks live in the index.html sprite.
```

The redesign replaced four files with twelve stylesheets and eleven modules: `layout.css`, `nav.css`,
`dialog.css` and `modules/nav.js` are gone; the views introduced `router.js`, `home.js`, `subjectRow.js` and
`contentStore.js`. Nothing else exists: no `src/`, no `dist/`, no `node_modules/`, no `package.json`, no
service worker.

---

## 3. Data flow

One direction, always: **input → module → service → storage → re-render**.

```
User taps a tab, or a subject row
        │
        ▼
modules/router.js          hashchange → show one view, set aria-current, title, focus
        │
        └─► modules/*.js   subscribed via onRoute(): render the pane for that route

User types in the subject search
        │
        ▼
modules/subjects.js        (input handler, debounced ~120ms)
        │  filters the already-loaded array in memory
        ▼
   re-render rows  ──► count announced via aria-live ──► empty state if 0 matches

User saves an API key
        │
        ▼
modules/settings.js        (form submit → validate shape → call service)
        │
        ▼
services/byokService.js    (masked preview, build record)
        │
        ▼
services/storageService.js (write JSON under vs:v1:byok)
        │
        ├─ ok      → toast "Key saved" + re-render key row + `vs:keys-changed` for Home
        └─ failure → toast (danger) + revert UI (optimistic rollback)
```

Rules the diagram encodes:

- **Modules never touch `localStorage` or `fetch`.** Only `services/*` may. This is checkable with a grep and is
  the whole point of the split. Caching a content load is an app concern, so it lives in `modules/contentStore.js`.
- **Services never touch the DOM.** They return data or throw typed errors; the module decides how to show it.
- **Routing is the only global state.** `router.js` holds which view is visible; every other module owns its own
  DOM subtree and its own closure state.
- **Persistence is immediate and optimistic.** UI updates first, storage write follows, failures roll back.

---

## 4. Service contracts

### 4.1 `storageService.js`

```js
export const KEYS = { settings: 'vs:v1:settings', byok: 'vs:v1:byok' };

export function read(key, fallback = null)        // parsed JSON or fallback; corrupt data → logged warn + fallback
export function write(key, value)                 // → { ok: true } | { ok: false, error: 'quota' | 'blocked' | 'unknown' }
export function remove(key)
export function clearNamespace()                  // removes every vs:* key (used by "erase my data")
export function isAvailable()                     // false in private mode / storage-blocked contexts
```

- All keys are namespaced `vs:v1:` and versioned. A schema change bumps the version and adds a migration here.
- Never throws to callers for expected conditions; returns a result object. Unexpected exceptions are caught and
  mapped to `{ ok: false, error: 'unknown' }`.
- Values are JSON. Non-serialisable values are rejected at write time, not silently dropped.

### 4.2 `contentService.js` and `providers.js`

```js
// contentService.js
export async function loadSubjects({ signal })   // fetch ./data/subjects.json, validate shape, throw ContentError
export function countChapters(subject)            // sum of chapters across a subject's books

// providers.js
export const PROVIDERS                            // [{ id, label, origin, keyHint, docsUrl, buildRequest(key) }]
export function getProvider(id)
export function listProviders()                   // display metadata only, no key material
```

`contentService` is the only module-facing way to read content, so `modules/*` stay fetch-free. `providers`
holds no state and performs no calls — it only describes how a request is built.

### 4.3 `byokService.js`

```js
export const PROVIDERS = [ { id, label, keyHint, docsUrl, origin, test(model, key, signal) } ];

export function listKeys()                 // [{ id, masked: 'sk-…9f2a', addedAt }] — never the raw key
export function saveKey(id, rawKey)        // validates shape → persists → { ok, masked } | { ok:false, error }
export function removeKey(id)              // soft-delete for 5s undo window, then hard delete
export function restoreKey(id)             // used by the Undo action
function getRawKey(id)                     // private: plaintext accessor used only by testKey(); never exported
export async function testKey(id, { signal })  // 1-token ping → { ok, latencyMs } | { ok:false, kind }
```

- **`getRawKey` is private and not exported.** Modules deal in masked values; only this service reads raw
  keys, and only when a request is being built.
- Error kinds: `no-key`, `invalid-key`, `rate-limited`, `network`, `provider-down`. Each maps to one human
  sentence in the UI layer.
- Redaction helper lives here and is used before any error message is constructed.
- Removing a key that is mid-undo does **not** leave a copy in storage after the window closes — that is
  verified in the self-test (reload after the toast expires).

---

## 5. Module contracts

| Module | Public surface | Owns |
| --- | --- | --- |
| `router.js` | `currentRoute()`, `navigate(path)`, `onRoute(fn)` (replays the current route, returns unsubscribe) | Which view is visible, the tab's `aria-current`, the app-bar label, `document.title`, scroll reset, focus to the view's `h1`. Unknown hashes (e.g. the `#main` skip link) are ignored, never navigated. |
| `home.js` | side-effect init on load | Stat strip values from the JSON, the BYOK status line, subject shortcuts, reacting to `vs:keys-changed`. |
| `subjects.js` | side-effect init on load | Debounced search, result count announcement, loading/empty/error states, swapping list for detail, re-applying a deep link once data arrives. |
| `subjectPanel.js` | `renderPanel(container, subject, note)` | Book groups and numbered chapter rows for one subject, the back link, the "lessons arrive next build" note. |
| `subjectRow.js` | `subjectRow(subject, { sub })` | One `<li>` with the tappable row: icon, name, sub-line, chapter count, chevron. |
| `contentStore.js` | `getSubjects()` | The single shared in-flight load; cleared on failure so retry really retries. |
| `settings.js` | side-effect init on load | Theme radios, LEDM switch, provider select, key save/validation, per-key test, remove with Undo, `vs:keys-changed`. |
| `keyList.js` | `renderKeyList(listEl)` | Masked key rows and the empty state. Renders no raw key, ever. |
| `theme.js` | `readSettings`, `applyTheme`, `detectLEDM`, `applyLEDM`, `saveSettings`, `initTheme` | Resolving light/dark/system to `data-theme`, the LEDM class, settings persistence, `theme-color`, OS theme changes. |
| `toast.js` | `notify(message, opts)`, `dismissToast()` | The single toast: one at a time, own timer, optional action button (Undo). |
| `dom.js` | `el(tag, opts)`, `svgIcon(id, className)` | Element creation with `textContent` only — no code path builds HTML from a string. |

Rules every module follows:

- **State lives in closure scope.** Nothing is attached to `window`; nothing is exported that another module can mutate.
- **No fetch, no storage.** Those calls exist only in `services/*`; modules import the service and handle its result.
- **Idempotent init.** Module bodies run once per page load; handlers attach to elements that exist in
  `index.html` or to containers re-rendered wholesale (delegation), so re-rendering never stacks listeners.
- **Explicit re-render.** A module re-renders only the node it owns; there is no global "render the page" call.

---

## 6. `index.html` — the app shell and its views

| Part | Selector | Content |
| --- | --- | --- |
| App bar | `.appbar` | Brand → `#/home`, and the current view's name (`#appbar-where`). |
| Viewport | `main#main` | The **only** scroll container. Holds `.wrap` with the three views. |
| Home | `#view-home` | Eyebrow, `h1`, stat strip (5 / 12 / 72 from the JSON), AI helper card with `#ai-status`, subject shortcuts. |
| Subjects | `#view-subjects` | `#subjects-browser` (search, `#subjects-count`, `#subjects-grid`) and `#subject-detail` — exactly one visible. |
| Settings | `#view-settings` | Appearance card (theme radios, LEDM switch), AI keys card (`#key-form`, `#key-list`), About card. |
| Tab bar | `.tabbar` | Home / Subjects / Settings. Bottom bar below 60rem, left rail at 60rem and up — one markup, two layouts. |
| Toast host | `#toasts` | The single `aria-live` region, fixed above the tab bar. |

### 6.1 Routes

| Hash | View | Notes |
| --- | --- | --- |
| `#/home` | Home | Default when the hash is empty or unknown on first load. |
| `#/subjects` | Subjects (list) | |
| `#/subjects/<id>` | Subjects (detail) | Deep-linkable; if the data has not arrived yet, the route is replayed after load. |
| `#/settings` | Settings | A place in the app, not a modal. |

Browser back/forward works because routes are hashes, and a route change moves focus to the view's `h1`
(`tabindex="-1"`), so a keyboard user is never left behind in the old pane.

---

## 7. No server routes

**There are no API routes, no endpoints of ours, no `/api/*`, no webhooks.** Nothing is ever sent to this
site's origin. Every network request falls into exactly one bucket:

1. **Same-origin static files** — `./data/subjects.json`, CSS, JS, icons. `fetch('./data/subjects.json')`.
2. **Direct browser → provider, with the user's key** — the only outbound calls that exist:

```
browser ──(Authorization: Bearer <user key>)──► https://<provider-origin>/...   ← no proxy, no middleman
```

Provider registry (verify CORS and endpoints against current docs before implementing each one):

| Provider id | Origin | Notes |
| --- | --- | --- |
| `google` | `https://generativelanguage.googleapis.com` | Gemini free tier; key sent in a header, never in the query string. |
| `groq` | `https://api.groq.com` | Fast, free tier, OpenAI-compatible chat shape. |
| `openrouter` | `https://openrouter.ai` | One key, many models including free ones. |
| `openai` | `https://api.openai.com` | OpenAI-compatible; paid tier only. |

Non-negotiables: no proxy or relay (that would be a credential-harvesting service), no `mode: 'no-cors'`,
no key in a URL, `AbortSignal` on every request with a timeout, and a typed error for every failure branch.
A provider whose CORS policy blocks browser calls simply is not offered — and the UI says why, plainly.

### 7.1 Verified API facts

Kept deliberately honest: this section records only what has been **observed**, never what is merely documented.

**Verified (2026-11-26, Node with stubbed `fetch`, no live network):**

- The key is placed in a header, never in the URL — asserted for Groq (`Authorization: Bearer …`) and Gemini
  (`x-goog-api-key`).
- Requests use `credentials: 'omit'` and an `AbortSignal` with a 12 s timeout.
- Status mapping: `400/401/403 → invalid-key`, `429 → rate-limited`, `5xx → provider-down`,
  thrown `fetch` → `network`, timeout → `timeout`.
- The CSP `connect-src` list and `PROVIDERS[].origin` are identical (4 origins); no request builds a host
  outside that list.

**Not verified — do not assume any of these work:**

| Fact | Status |
| --- | --- |
| Any provider answers a browser-origin request (CORS preflight for `authorization`, `content-type`) | **Unknown** — no live call was made |
| Model ids (`gemini-2.0-flash`, `llama-3.1-8b-instant`, `meta-llama/llama-3.1-8b-instruct:free`, `gpt-4o-mini`) are current | **Unknown** |
| Free-tier availability and rate limits per provider | **Unknown** |
| Each provider's exact auth header still matches its docs | **Unknown** |

To verify: open Settings, save a real key, press **Test**, and record the result (provider, date, outcome) in
this table. If a provider blocks browser requests, delete its entry from `services/providers.js` **and** its CSP
origin in the same commit.

---

## 8. Storage schema

| Key | Owner | Shape | Why |
| --- | --- | --- | --- |
| `vs:v1:byok` | `byokService.js` | `{ [providerId]: { key, addedAt } }` | BYOK keys (constraint C2). Only this record; no duplicates elsewhere. |
| `vs:v1:settings` | `theme.js` → `storageService` | `{ theme: 'light' or 'dark' or 'system', ledm: boolean }` | Needed synchronously on load to avoid a theme flash. |
| `vs:v1:notes` | (Session 1, `noteService`) | `{ [noteId]: { title, body, topicId, updatedAt } }` | Small text notes; migrate to IndexedDB only if they approach quota. |

Rules: namespaced and versioned; JSON only; written exclusively by services; corrupted values fall back safely;
`clearNamespace()` exists so "erase my data" is real.

---

## 9. `data/subjects.json`

```json
{
  "schemaVersion": 1,
  "class": 9,
  "board": "NCERT",
  "syllabusNote": "Chapter lists follow the NCERT rationalised syllabus (2023–24). Check against the edition your school uses.",
  "subjects": [
    {
      "id": "science",
      "name": "Science",
      "tagline": "From particles of matter to the sound you hear",
      "description": "Matter, atoms and cells in the first half; motion, force, gravitation, work, sound and food resources in the second.",
      "icon": "icon-science",
      "hue": "sage",
      "books": [
        { "name": "Science — Textbook for Class IX", "chapters": ["Matter in Our Surroundings", "Is Matter Around Us Pure?"] }
      ]
    }
  ]
}
```

- **Shipped state:** 5 subjects, 12 books, **72 real chapter titles** (Mathematics 12, Science 12, Social Science
  20 across four books, English 28 across Beehive prose/poetry and Moments, Hindi listed by book only until its
  content pack lands).
- `books[].chapters` is the source of every count shown in the UI — `countChapters()` derives it, so no number is
  typed twice. A subject with no chapter titles yet (`hindi`) displays its book list instead of inventing titles.
- `hue` maps to a token (`hue-indigo`, `hue-sage`, …), never a raw hex.
- `syllabusNote` is shown inside the chapter panel so the student knows which edition the list follows.
- Lesson files (Session 1) live in `data/lessons/<subject-id>-<nn>-<slug>.json`, registered in `index.json`.

---

## 10. Rendering, state and accessibility contract

- **The page never scrolls.** `body` is locked to `100dvh` (with `100svh` as the stable fallback); `main#main`
  is the only scroll container, with `overscroll-behavior: contain`. A route change resets `scrollTop` to 0.
- **One view at a time**, toggled with the `hidden` attribute — no duplicated DOM, no off-screen sections to
  paint. Views enter with `opacity` + 6px `translateY` over 240 ms, disabled under reduced motion and LEDM.
- **Focus is managed, not accidental:** route changes focus the view title; opening a subject focuses the detail
  pane; the back link returns to the list. `:focus-visible` draws a 2 px ring at 2 px offset; nothing removes a
  focus outline without a replacement.
- **Four states per dynamic area:** loading (inline text, no layout jump), empty (explains the next action),
  error (what failed + retry), success. Built in CSS and in the module, not implied.
- **No `innerHTML` with data.** `textContent` for strings, `createElement` for structure.
- **Design values are tokens.** Raw colour, radius, shadow, duration and spacing values exist only in
  `tokens.css`; both palettes and the LEDM overrides are declared there.
- **Contrast is computed, not eyeballed.** Light: ink 18.1:1, ink-2 9.7:1, ink-3 5.7:1, white-on-accent 6.3:1,
  accent on `--accent-weak` 7.0:1, control border 3.76:1 (search pill 3.42:1 against its own fill, selected
  segment ring 3.76:1). Dark: ink 17.7:1, ink-2 12.1:1, ink-3 7.5:1, on-accent 9.2:1, accent 9.0:1, control
  border 3.53:1 (search pill 3.66:1, segment ring 3.53:1). A filled control is never its own boundary.
- **Motion is `transform`/`opacity` only**, ≤ 240 ms, no colour transitions; fully disabled under
  `prefers-reduced-motion: reduce` and `<html class="ledm">`.
- **Touch targets ≥ 44 px**: tab bar 52 px, list rows 56 px, every button and input at least 44 px tall.
- **Settings is a view, not a dialog** — no focus trap to get wrong, Escape does nothing surprising, and the
  back button leaves it naturally.

---

## 11. Extension guides

**Add a subject** → append to `data/subjects.json`, add an icon to `assets/icons/`, inline it in the sprite.
No JS change: Home and Subjects both render whatever the JSON says.

**Add a view** → add an entry to `VIEWS` in `modules/router.js`, a `<section class="view" data-view="…">` in
`index.html`, a `.tab` in the tab bar, and subscribe with `onRoute()`. Nothing else changes — the rail, the
`aria-current` state and the title follow automatically.

**Add a lesson** (Session 1+) → add `data/lessons/<id>.json`, register it in `data/lessons/index.json`, render via
a lesson module reachable from `subjectPanel.js`. Content only; no new storage keys.

**Restyle anything** → `styles/tokens.css` only. If a colour, radius or shadow is written outside that file, the
change is in the wrong place.

**Add a provider** → one entry in `PROVIDERS` in `services/providers.js` **and** its origin in the CSP
`connect-src` in the same commit; verify CORS with a real key before shipping; add an error-mapping case.

Any of these larger than a trivial tweak goes through the Workflow in `AGENTS.md §4`: plan first, then
"Approved".
