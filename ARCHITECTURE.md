# ARCHITECTURE.md — The Map

> Companion to `AGENTS.md` (rules). This describes **what exists, what each file is for, and how data moves**.
> One sentence per file, deliberately: if a file needs a paragraph, it is doing too much (200-line cap).
> If code and this document disagree, the document is right until we change both together.

---

## 1. Shape of the system

VidyaSetu is **static files plus a browser-side script layer**. There is no server, no build step, no database.

```
Host (GitHub Pages / python3 -m http.server)
        │  serves files, does nothing else
        ▼
 ┌────────────────────────── Browser ──────────────────────────┐
 │  index.html ──► styles/*.css (presentation)                 │
 │             └─► modules/*.js (behaviour)                     │
 │                      └─► services/*.js (storage + network)   │
 │                                ├─► localStorage  (user data) │
 │                                └─► provider API  (BYOK)      │
 └──────────────────────────────────────────────────────────────┘
```

Three consequences that shape everything:

| Reality | Response |
| --- | --- |
| No build step | Files load as written: `<script type="module">`, native CSS, ES modules with `.js` extensions. |
| Hosted under a sub-path (`/vidyasetu/`) | **Relative paths only** (`./styles/base.css`). Root-absolute paths break on GitHub Pages project sites. |
| No server to hide anything | Keys are the user's, live in their browser, and go only to the provider they chose. |

---

## 2. Structure

Shipped as of Phase 2. Every file is ≤ 200 lines (`AGENTS.md §7`); where that cap forced a split, the split is
by responsibility, listed below.

```
/
├── index.html                 # The page: skip link, fixed nav, hero, subject browser, how-it-works/BYOK, footer, settings dialog, toast host, inline SVG sprite, three module <script> tags.
├── README.md                  # Human-facing intro: what it is, how to serve it, what it promises.
├── AGENTS.md                  # The rulebook: constraints, quality bar, visual identity, workflow, testing, module rules.
├── ARCHITECTURE.md            # This map: file purposes, data flow, storage schema, extension guides.
├── PROGRESS.md                # The logbook: what is done, what is in flight, decisions, bugs.
│
├── styles/
│   ├── tokens.css             # Every design value as a custom property (palette both themes, type scale, spacing, radii, z-index, nav-h, motion) — the only file allowed to hold raw values.
│   ├── base.css               # Reset, element defaults, typography, focus/selection/caret, utilities, reduced-motion collapse.
│   ├── layout.css             # Page shell: container, section rhythm, footer, toast host.
│   ├── nav.css                # The fixed navbar: brand, links, active state, mobile disclosure menu.
│   ├── sections.css           # Hero, subject-browser toolbar and grid, "how it works" steps, BYOK explainer.
│   ├── components.css         # Buttons and form fields (label, control, hint, error, show/hide row).
│   ├── cards.css              # Icons, chips, subject cards, hue mapping, chapter panel.
│   ├── states.css             # Loading / empty / error blocks, the staged entrance animation and its keyframes.
│   ├── dialog.css             # The settings modal and the saved-key rows inside it.
│   ├── toast.css              # One toast, its action button, its entrance.
│   └── scrollbar.css          # Palette scrollbars for standards browsers and Chromium/Safari, plus the dialog's inner scroller.
│
├── modules/
│   ├── nav.js                 # Fixed-nav behaviour: menu toggle with aria-expanded, Esc/outside-click close, one IntersectionObserver for active-section state.
│   ├── subjects.js            # Renders the grid, live search, result count, and the loading/empty/error states; owns which subject is open.
│   ├── subjectPanel.js        # Renders the chapter panel for one subject (books → chapters), pure and reusable.
│   ├── settings.js            # Settings dialog: provider select, masked key field, save, per-key test/remove-with-undo, appearance controls.
│   ├── keyList.js             # Renders the saved-key rows (masked only) and the honest "no keys yet" state.
│   ├── theme.js               # Theme resolution (light/dark/system), LEDM detection and application, settings persistence.
│   ├── toast.js               # notify(message, opts) into the single aria-live region; one timer, one toast, optional action.
│   └── dom.js                 # el() and svgIcon() helpers — no state, no data access, no HTML strings.
│
├── services/
│   ├── storageService.js      # The only code that touches localStorage: namespaced read/write/remove/clear, JSON-safe, quota- and private-mode-aware.
│   ├── byokService.js         # The only code that holds or sends keys: CRUD, masking, test call, typed errors. Never logs a key.
│   ├── providers.js           # The provider registry: id, label, origin, key hint, docs URL, and how to build each test request.
│   └── contentService.js      # The only code that fetches content: loads and validates data/subjects.json, typed ContentError.
│
├── data/
│   ├── subjects.json          # Seeded Class 9 NCERT catalogue: 5 subjects, 12 books, 72 real chapter titles, hue + icon keys.
│   └── lessons/               # (Session 1) One JSON file per lesson plus index.json; same schema family as subjects.json. Not created yet.
│
└── assets/
    └── icons/                 # Source .svg files (7): favicon, logo, and one per subject. The shipped copies live in the index.html sprite.
```

Why more files than the original sketch: the 200-line cap applies to HTML, CSS and JS alike, so `components.css`
became `components + cards + states + dialog + toast + nav`, and `subjects.js` split into
`subjects + subjectPanel + dom`. Each file now has exactly one job. Total first-load weight is still ~62 KB raw
(~21 KB gzip) across 17 requests, and there is still no build step.

Nothing else exists: no `src/`, no `dist/`, no `node_modules/`, no `package.json`, no service worker.

---

## 3. Data flow

One direction, always: **input → module → service → storage → re-render**.

```
User types in the subject search
        │
        ▼
modules/subjects.js        (oninput handler, debounced ~120ms)
        │  filters the already-loaded array in memory
        ▼
   re-render grid  ──► count announced via aria-live ──► empty state if 0 matches

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
        ├─ ok      → toast "Key saved" + re-render key row (masked)
        └─ failure → toast (danger) + revert UI (optimistic rollback)
```

Rules the diagram encodes:

- **Modules never touch `localStorage` or `fetch`.** Only `services/*` may. This is checkable with a grep and is
  the whole point of the split.
- **Services never touch the DOM.** They return data or throw typed errors; the module decides how to show it.
- **Rendering is explicit.** No framework, no virtual DOM: modules re-render the specific node they own.
  Text goes in via `textContent`; nodes via `createElement`/`<template>` clones.
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
export function getKey(id)                 // internal-only plaintext accessor for test(); not exported to modules
export async function testKey(id, { signal })  // 1-token ping → { ok, latencyMs } | { ok:false, kind }
```

- **`getKey` is not part of the module-facing API.** Modules deal in masked values; only this service reads raw
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
| `nav.js` | side-effect init on load | Menu toggle (`aria-expanded`, label and icon swap), Esc and outside-click close, active-section `aria-current` via one IntersectionObserver, reset on resize to desktop. |
| `subjects.js` | side-effect init on load | Grid render, debounced live search, result count announcement, loading/empty/error states, which subject panel is open, focus return. |
| `subjectPanel.js` | `renderPanel(panel, subject, note)` | The chapter panel markup for one subject; shows the syllabus note and the honest "lessons in Session 1" line. |
| `settings.js` | side-effect init on load | Dialog open/close + focus return, provider select, key save/validation messages, per-key test, remove with Undo, appearance controls. |
| `keyList.js` | `renderKeyList(listEl)` | Masked key rows and the empty state. Renders no raw key, ever. |
| `theme.js` | `readSettings`, `applyTheme`, `detectLEDM`, `applyLEDM`, `saveSettings`, `initTheme` | Resolving light/dark/system to `data-theme`, LEDM class, settings persistence, reacting to OS theme changes. |
| `toast.js` | `notify(message, opts)`, `dismissToast()` | The single toast: one at a time, own timer, optional action button (used for Undo). |
| `dom.js` | `el(tag, opts)`, `svgIcon(id)` | Element creation with `textContent` only — there is no code path that builds HTML from a string. |

Rules every module follows:

- **State lives in closure scope.** Nothing is attached to `window`; nothing is exported that another module can mutate.
- **No fetch, no storage.** Those calls exist only in `services/*`; modules import the service and handle its result.
- **Idempotent init.** Module bodies run once per page load; handlers are attached to elements that exist in
  `index.html` or to containers that are re-rendered wholesale (delegation), so re-rendering never stacks listeners.
- **Explicit re-render.** A module re-renders only the node it owns; there is no global "render the page" call.

---

## 6. `index.html` — sections and anchors

| Section | `id` | Content |
| --- | --- | --- |
| Navbar | `#site-nav` | Logo/link home, Home / Subjects / How It Works / Settings, theme toggle, mobile menu button. |
| Hero | `#home` | Genuine copy: free forever, no sign-up, no ads, works on cheap phones; primary CTA → `#subjects`. |
| Subjects | `#subjects` | Search field + grid seeded from `data/subjects.json` (5 Class 9 NCERT subjects, inline SVG icons). |
| How It Works / BYOK | `#how-it-works` | Three steps, plain-language explanation that AI features use the student's own key, provider list, "Open settings". |
| Footer | `#footer` | What this is, "no trackers/no cookies" statement, data-ownership line, link to `#how-it-works`. |

Nav order matches DOM order, so tab order and visual order agree. Anchor targets get `scroll-margin-top` from
`--nav-h`; the nav uses `scroll-padding-top` as the belt-and-braces version.

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

---

## 8. Storage schema

| Key | Owner | Shape | Why |
| --- | --- | --- | --- |
| `vs:v1:byok` | `byokService.js` | `{ [providerId]: { key, addedAt } }` | BYOK keys (constraint C2). Only this record; no duplicates elsewhere. |
| `vs:v1:settings` | `settings.js` → `storageService` | `{ theme: 'light' or 'dark' or 'system', ledm: boolean }` | Needed synchronously on load to avoid a theme flash. |
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

- **Four states per dynamic area:** loading (inline text, no layout jump), empty (explains the next action),
  error (what failed + retry), success. Built in CSS and in the module, not implied.
- **No `innerHTML` with data.** `textContent` for strings, `createElement`/`<template>` for structure.
- **No layout thrash:** read phase then write phase; no `getBoundingClientRect()` inside a mutating loop.
- **Animation:** `transform`/`opacity` only, ≤ 300 ms, stagger ≤ 60 ms, fully disabled under
  `prefers-reduced-motion: reduce` and under `<html class="ledm">`.
- **Accessibility is structural:** landmarks, one `h1`, labelled inputs, `aria-expanded` on the menu, Esc to
  close dialogs, focus returned to the trigger, `aria-live` for results and toasts, 3:1 focus ring at 2 px offset.
- **Touch targets ≥ 44×44 px**, verified at 375 px.

---

## 11. Extension guides

**Add a subject** → append to `data/subjects.json`, add an icon to `assets/icons/`, inline it in `index.html`.
No JS change (the grid renders whatever the JSON says).

**Add a lesson** (Session 1+) → add `data/lessons/<id>.json`, register it in `data/lessons/index.json`, render via
the lesson module. Content only; no new storage keys.

**Add a section to the home page** → new `<section id="…">` in `index.html`, a nav link, layout rules in
`layout.css`. The nav's IntersectionObserver picks it up automatically — never hardcode the section list twice.

**Add a provider** → one entry in `PROVIDERS` in `byokService.js` **and** its origin in the CSP `connect-src`
in the same commit; verify CORS with a real key before shipping; add an error-mapping case.

**Add a page** (later) → new `.html` plus its own module; keep `styles/` shared, keep relative paths, and give
each page its own CSP copy.

Any of these larger than a trivial tweak goes through the Workflow in `AGENTS.md §4`: plan first, then
"Approved".
