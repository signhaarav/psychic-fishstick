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

```
/
├── index.html                 # The only page so far: nav, hero, subjects grid, how-it-works/BYOK, footer.
├── README.md                  # Human-facing intro: what it is, how to serve it, how to contribute content.
│
├── AGENTS.md                  # The rulebook: constraints, quality bar, workflow, testing, module rules.
├── ARCHITECTURE.md            # This map: file purposes, data flow, storage schema, extension guides.
├── PROGRESS.md                # The logbook: what is done, what is in flight, what is next, decisions, bugs.
│
├── styles/
│   ├── tokens.css             # Every design value as a CSS custom property: palette, type scale, spacing, radii, shadows, z-index — the only file allowed to contain raw values.
│   ├── base.css               # Reset, element defaults, typography, link/focus/selection/caret styling, reduced-motion and LEDM query hooks.
│   ├── layout.css             # Page shell: fixed navbar, container widths, hero, section rhythm, grid definitions, footer, 375px→1280px breakpoints.
│   ├── components.css         # Reusable blocks: buttons, cards, subject tiles, search field, modal/dialog, toast, badges, SVG icon sizing, all four UI states.
│   └── scrollbar.css          # Custom scrollbar (track/thumb/hover) for standards browsers and Chromium/Safari, in both themes.
│
├── modules/
│   ├── nav.js                 # Fixed-nav behaviour: mobile menu toggle, active-section highlighting via one IntersectionObserver, smooth anchor scrolling with navbar offset.
│   ├── subjects.js            # Loads ./data/subjects.json, renders the subject grid, and wires live search/filter (with an announced result count and empty state).
│   ├── settings.js            # Settings/BYOK dialog: provider select, masked key input, save/test/remove with undo, the three key paths, and theme toggle.
│   └── toast.js               # Tiny pub/sub toast system: notify(message, { variant, actionLabel, onAction, duration }) with an aria-live region and one-at-a-time stacking.
│
├── services/
│   ├── storageService.js      # The only code that touches localStorage: namespaced read/write/remove/list, JSON-safe, quota- and private-mode-aware, never throws raw.
│   └── byokService.js         # The only code that holds or transmits keys: CRUD, masking, provider registry, test connection, typed errors, redaction. Never logs a key.
│
├── data/
│   ├── subjects.json          # Seeded Class 9 NCERT subjects: id, name, tagline, description, lessonCount, icon id, colour key.
│   └── lessons/               # (future) One JSON file per lesson, plus an index.json manifest; same schema family as subjects.json.
│
└── assets/
    └── icons/                 # Source .svg files for each icon (name-matched to subjects.json `icon`); inlined into index.html at build-free authoring time.
```

Nothing else exists yet. No `src/`, no `dist/`, no `node_modules/`, no `package.json`.

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

### 4.2 `byokService.js`

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
| `nav.js` | `initNav()` | Mobile menu open/close/Esc/focus return; active-section `aria-current`; anchor scroll offset. |
| `subjects.js` | `initSubjects()` | Fetch-free rendering from `data/subjects.json`; live search; result count; empty and error states. |
| `settings.js` | `initSettings()` | Dialog open/close; key form; provider select; test/save/remove; undo wiring; theme toggle. |
| `toast.js` | `notify(message, opts)`, `initToasts()` | Single `aria-live="polite"` region; one toast at a time; optional action button; timers cleared on teardown. |

Every module exports one `init*` function and keeps its state in closure scope. No module writes to `window`.
Each `init*` returns a `destroy()`-style cleanup only if it registers document-level listeners — otherwise it is
idempotent and guarded against double-init (the "exercise it twice" test in `AGENTS.md §5.1` depends on this).

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
  "subjects": [
    {
      "id": "mathematics",
      "name": "Mathematics",
      "tagline": "Numbers, shapes, and the reasoning behind them",
      "description": "Real NCERT Class 9 chapters — from number systems and polynomials to circles, surface areas and statistics.",
      "lessonCount": 12,
      "icon": "icon-math",
      "hue": "indigo",
      "available": true
    }
  ]
}
```

- Five entries, real copy, real NCERT chapter counts. `hue` maps to a token colour, never a raw hex.
- `available: false` renders a "coming soon" state honestly rather than a dead link — and says when.
- Lesson files (later) live in `data/lessons/<subject-id>-<nn>-<slug>.json`, registered in `index.json`.

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
