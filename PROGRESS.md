# PROGRESS.md — The Logbook

> Single source of truth for **what is done, what is in flight, and what is next.**
> Updated at the end of every session, in the same commit as the work (`AGENTS.md §6`).

| Field | Value |
| --- | --- |
| Project | **VidyaSetu** — free, unlimited-forever online classes for Indian students |
| Audience | Class 9, NCERT — Mathematics, Science, Social Science, English, Hindi |
| Branch | `arena/183a925b-psychic-fishstick` |
| Current session | **Session 0 — complete** (foundation shipped) |
| App code | ✅ Phase 2 built: shell, subjects, BYOK settings |
| Last updated | 2026-11-26 |

---

## 1. Completed

| ID | Item | Verified how |
| --- | --- | --- |
| S0-1 | `AGENTS.md` — constraints, quality bar, visual identity, workflow, self-testing, session hygiene, modular rules, do-not-touch, security, DoD | reviewed against the brief |
| S0-2 | `ARCHITECTURE.md` — structure with one-sentence file purposes, data flow, service/module contracts, storage schema, no-server-routes | matches shipped tree (checked file by file) |
| S0-3 | `PROGRESS.md` — this file | — |
| S0-4 | Phase 2 plan → approved → executed | plan in session log, code in commit |
| P2-1 | `data/subjects.json` — 5 subjects, 12 books, **72 real NCERT chapter titles**, syllabus note | JSON parses; counts derived, not typed |
| P2-2 | `styles/` — tokens, base, layout, nav, sections, components, cards, states, dialog, toast, scrollbar | 11 files, all ≤ 200 lines, no raw values outside `tokens.css` |
| P2-3 | `index.html` — skip link, fixed nav, hero, subject browser, how-it-works/BYOK, footer, settings dialog, toast host, SVG sprite, CSP | 196 lines, every referenced path returns 200 |
| P2-4 | `modules/` — nav, subjects, subjectPanel, settings, keyList, theme, toast, dom | 8 files; grammar-checked; no fetch/storage |
| P2-5 | `services/` — storageService, byokService, providers, contentService | 26/26 behavioural checks in Node (below) |
| P2-6 | Custom scrollbars, gradients, staged entrance, reduced-motion + LEDM | CSS-only; `prefers-reduced-motion` collapse in `base.css` |
| P2-7 | Self-test pass + docs + commit | see §6 |

---

## 2. Current

**Session 0 closed.** Nothing is half-built: the page loads its real content, search works, the settings dialog
saves/tests/removes keys, and the docs match the code.

Open item carried into Session 1: there is **no lesson page yet**, so subject cards open the real chapter list
and say plainly that lessons arrive next session. That is the only "not yet" surface in the UI.

---

## 3. Next — Session 1

**Lesson viewer + notes.** Preconditions: Phase 2 accepted by the owner.

1. `data/lessons/index.json` + one complete real lesson (sections, worked example, practice set, explanations).
2. `modules/lesson.js` (view) + `services/noteService.js` (notes CRUD, `vs:v1:notes`).
3. Route from a chapter in the panel → lesson; remember last-read position.
4. Notes: create/edit/delete per lesson, autosave debounced, Undo on delete.
5. Replace the "Lessons in Session 1" chip with an honest state that reflects what exists.

---

## 4. Known bugs

**None open.**

Fixed during this build, before the commit (recorded so the same mistakes are not repeated):

| ID | Severity | Bug | Fix |
| --- | --- | --- | --- |
| B-01 | P2 | `nav.js` set `href` on the `<svg>`, not the `<use>`, so the menu icon never changed | target the `use` element |
| B-02 | P1 | Theme "system" never produced dark: tokens only respond to `[data-theme="dark"]` | resolve system → dark/light in `theme.js` and set the attribute |
| B-03 | P2 | `.panel__lede` and `.subject-card__text` were used by JS but never styled | added both to `cards.css` |
| B-04 | P1 | `load()` referenced an undefined `ui` variable while showing the loading state | replaced with real loading markup + `aria-busy` |
| B-05 | P3 | An open chapter panel could survive a search that filtered its subject out | close the panel when its subject leaves the filter |

---

## 5. Phase 2 board — done

| ID | Item | Status |
| --- | --- | --- |
| P2-1 … P2-7 | See `AGENTS.md` §1 for scope; all delivered in this commit | ✅ |

---

## 6. Verification — what was and was not checked

**Performed (this environment):**

- All 17 first-load requests return **200**; zero 404s (`python3 -m http.server` + request sweep).
- All 12 JS files **parse as ES modules** (`node --check` on `.mjs` copies).
- `data/subjects.json` parses; counts (5 subjects / 12 books / 72 chapters) derived from the file.
- **Service smoke test, 26/26 passing** in Node with stubbed storage and `fetch`: storage round-trip, corrupt-JSON
  fallback, unserialisable write rejected, namespace-scoped clear; key validation (`too-short`, `has-space`,
  `unknown-provider`), masking, save → list (masked only) → remove → restore; `testKey` for 200 / 401 / 429 / 503 /
  network throw / no-key; **key travels in a header, never the URL**; Gemini adapter header check; and a
  **console-leak assertion** confirming no key material reached any log call.
- Greps: no inline handlers, no inline styles, no `innerHTML`/`eval`/`document.write`, no `console.log`, no
  TODO/FIXME/lorem/"coming soon", no `href="#"`, no default-gray literals outside `tokens.css`, no absolute-root
  paths, and no `fetch`/`localStorage` anywhere in `modules/`.
- Weight: **62.4 KB raw / 20.8 KB gzip** over 17 requests — budget 200 KB, 138 KB headroom.
- Line caps: largest file 199 lines; everything ≤ 200.

**Not performed — do not assume these pass:**

- **No real browser run.** Console-error check in DevTools, 375 px and 1280 px layout inspection, 200 % zoom,
  keyboard-only tab order and focus-ring visibility were **not** executed here. These are the first things to do
  before accepting the build.
- **BYOK end-to-end with a live provider:** no key exists here and the sandbox cannot reach provider hosts. The
  invalid-key path is proven at unit level (401 → `invalid-key`); the **valid-key path is implemented, not verified**.
- **CORS behaviour** of Gemini / Groq / OpenRouter / OpenAI from a browser is unverified. If one blocks browser
  requests, the UI reports "could not reach the provider" — honest, but the provider list would need trimming.
- **Screen-reader pass** and the double-exercise test (click through twice) are pending a human.

---

## 7. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D-01 | Name **VidyaSetu** (विद्यासेतु) | Given by the owner; replaces the earlier placeholder. |
| D-02 | Flat folders (`/styles`, `/modules`, `/services`, `/data`, `/assets`), no `src/` | Matches the modular rules; no build step means no source/output split. |
| D-03 | Keys in `localStorage` (`vs:v1:byok`), per constraint C2 | No passphrase for a student to forget. Residual risk accepted; XSS controls (CSP, no third-party scripts, no HTML-string injection, masked UI) are the defence. |
| D-04 | Fixed navbar + `padding-block-start` on body + `scroll-padding-top` | Keeps anchors and content clear of the bar without spacer hacks. |
| D-05 | Palette: 8 hues, cool + warm neutrals, two multi-hue gradients | Requested identity; every pair verified by computation. Saffron fills carry a `--saffron-700` border because saffron is only 2.0:1 against chalk. |
| D-06 | Live search filters the in-memory array | Zero network per keystroke; 5 subjects today, dozens later. |
| D-07 | No service worker in Phase 2 | Caching a BYOK app before its storage layer settles creates a second source of truth. |
| D-08 | **More files than the sketch:** 11 CSS, 8 modules, 4 services | The 200-line cap is a hard rule and outranks an illustrative file list. Each file now has one responsibility. |
| D-09 | **New `services/contentService.js`** (not in the approved list) | `modules/*` may not `fetch`, and the subject JSON had nowhere to load from. Disclosed as a deviation; it is the content counterpart to `byokService`. |
| D-10 | `services/providers.js` split out of `byokService` | `byokService` crossed 200 lines; the registry is a separate responsibility anyway. |
| D-11 | "System" theme resolved in JS (`data-theme` set explicitly) | Keeps the dark palette defined once in `tokens.css` instead of duplicated inside a `prefers-color-scheme` block. |
| D-12 | Testing is per saved-key row; no "test the text in the box" path | One route to a request instead of two, and it matches the real flow: save, then test. |
| D-13 | Hindi listed by book, chapter titles deferred | Better an honest book list than 20 invented chapter names. Ships with the Hindi content pack. |
| D-14 | Subject cards open the chapter panel rather than linking nowhere | Real content behind every control; the only "not yet" is stated in plain words. |

---

## 8. How to update this file

1. Pick work from §2/§3 or from my explicit instruction — nothing else.
2. On completion: move the row to §1, mark ✅, and record **how it was verified**. "Implemented, not verified" stays listed under §6.
3. Log every non-obvious choice as a `D-xx` row; log every bug (including fixed ones) in §4.
4. Never claim a check you did not perform (`AGENTS.md §5.2`).
5. Append a dated line when a session closes; never rewrite history.

This section is part of the protected protocol (`AGENTS.md §8`).
