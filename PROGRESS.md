# PROGRESS.md — The Logbook

> Single source of truth for **what is done, what is in flight, and what is next.**
> Updated at the end of every session, in the same commit as the work (`AGENTS.md §6`).

| Field | Value |
| --- | --- |
| Project | **VidyaSetu** — free, unlimited-forever online classes for Indian students |
| Audience | Class 9, NCERT — Mathematics, Science, Social Science, English, Hindi |
| Branch | `arena/183a925b-psychic-fishstick` |
| Current session | **App-shell redesign — shipped** (app frame, three views, new design system) |
| App code | ✅ Phase 2 + redesign: app shell, workspace views, BYOK settings |
| Last updated | 2026-11-26 |

---

## 1. Completed

| ID | Item | Date | Commit | Verified how |
| --- | --- | --- | --- | --- |
| S0-1 | `AGENTS.md` — constraints, quality bar, visual identity, workflow, self-testing, session hygiene, modular rules, do-not-touch, security, DoD | 2026-11-26 | `00be123` | reviewed against the brief |
| S0-2 | `ARCHITECTURE.md` — structure with one-sentence file purposes, data flow, contracts, storage schema, no-server-routes, verified API facts | 2026-11-26 | `00be123` | matches shipped tree, checked file by file |
| S0-3 | `PROGRESS.md` — this file | 2026-11-26 | `00be123` | — |
| P2-1 | `data/subjects.json` — 5 subjects, 12 books, **72 real NCERT chapter titles**, syllabus note | 2026-11-26 | `825306d` | JSON parses; counts derived by `countChapters()`, not typed |
| P2-2 | `index.html` — skip link, fixed nav, hero, subject browser, how-it-works/BYOK, footer, settings dialog, toast host, SVG sprite, CSP | 2026-11-26 | `825306d` | 196 lines; 16/16 assets return 200 |
| P2-3 | `styles/` — 11 files: tokens, base, layout, nav, sections, components, cards, states, dialog, toast, scrollbar | 2026-11-26 | `825306d` | all ≤ 200 lines; no raw value outside `tokens.css` |
| P2-4 | `modules/` — nav, subjects, subjectPanel, settings, keyList, theme, toast, dom | 2026-11-26 | `825306d` | 8 files parse as ESM; no fetch/storage |
| P2-5 | `services/` — storageService, byokService, providers, contentService | 2026-11-26 | `825306d` | **32/32** behavioural checks (§6) |
| P2-6 | Custom scrollbars, gradients, staged entrance, reduced-motion + LEDM | 2026-11-26 | `825306d` | CSS-only; motion audit clean |
| S0-5 | Close-out: constraint audit, lazy below-fold (`C-01`), transform-only motion (`C-02`), `.nav__label` (`C-03`) | 2026-11-26 | `c2b126f` | see §4 and §6 |
| S0-6 | Close-out round 2: contracts audit, CSP↔registry equality, docs accuracy | 2026-11-26 | `b3741b4` | §6 |
| R-1 | **App frame**: `body` locked to `100dvh`, one scrolling viewport, app bar with the view name, bottom tab bar below 60rem that becomes a left rail at 60rem — one markup, two layouts | 2026-11-26 | `7231d82` | 45/45 jsdom DOM checks (§6) |
| R-2 | **Design system rewrite**: Editorial light default + Studio dark, one indigo accent, 4px spacing grid, two elevation levels, 12 stylesheets | 2026-11-26 | `7231d82` | contrast computed for 25 pairs; no raw value outside `tokens.css` |
| R-3 | **Workspace views**: Home (real counts, key status, shortcuts), Subjects (list ⇄ detail pane, deep-linkable), Settings (a view, not a dialog) | 2026-11-26 | `7231d82` | 45/45 jsdom checks; 32/32 service checks unchanged |
| R-4 | **Router + shared content load**: `router.js`, `contentStore.js`, `subjectRow.js` added; `nav.js`, `layout.css`, `nav.css`, `dialog.css` deleted | 2026-11-26 | `7231d82` | 35/35 referenced files return 200; no stale references |

---

## 2. Current

**Redesign shipped.** The app opens on a Home workspace with real counts and a real key status, tabs between
three views without reloading, keeps the page itself unscrollable, and swaps Subjects for a subject detail pane
with working browser back/forward.

Two honest gaps, both stated in the UI:

1. **No lesson page yet** — the subject detail says lessons arrive in the next build. That is the only "not yet"
   surface, and it is the next task.
2. **`AGENTS.md §3.1` still lists the pre-redesign palette** ("Ink & Chalk", saffron fills, gradients). The app
   now ships the Editorial/Studio system in `tokens.css`. `AGENTS.md` is do-not-touch without approval (§8), so
   the rulebook and the code disagree until you say otherwise — see §4.

---

## 3. Next — exactly one task

**Session 1 — Lesson viewer.** Open one real lesson from the subject panel and read it: `data/lessons/` +
`index.json` + `modules/lesson.js`, with a route from a chapter. Notes are deliberately **not** part of this
task; they follow as their own task once the viewer is verified.

Acceptance for that task: one complete real lesson (sections, worked example, practice set with explanations),
reachable from its chapter, zero console errors, 375/1280 clean, and the detail-pane note ("lesson pages open in
the next build") replaced with a real lesson link.

Status: **not started, awaiting "Approved"** (`AGENTS.md §4` — plan first).

---

## 4. Known bugs

**None open** in shipped code. One item needs your decision:

| ID | Needs | Detail |
| --- | --- | --- |
| A-01 | **Approval to edit `AGENTS.md`** | §3 visual identity ("Ink and chalk, saffron for what matters") and its §3.1 palette table describe the old system. The redesign uses a neutral canvas + single indigo accent (Editorial light / Studio dark). The file is untouched per §8, so it currently misdescribes the app. Say "update AGENTS §3" and it becomes a docs-only commit. |

Fixed during this build, before the commit (recorded so the same mistakes are not repeated):

| ID | Severity | Bug | Fix |
| --- | --- | --- | --- |
| B-01 | P2 | `nav.js` set `href` on the `<svg>`, not the `<use>`, so the menu icon never changed | target the `use` element |
| B-02 | P1 | Theme "system" never produced dark: tokens only respond to `[data-theme="dark"]` | resolve system → dark/light in `theme.js` and set the attribute |
| B-03 | P2 | `.panel__lede` and `.subject-card__text` were used by JS but never styled | added both to `cards.css` |
| B-04 | P1 | `load()` referenced an undefined `ui` variable while showing the loading state | replaced with real loading markup + `aria-busy` |
| B-05 | P3 | An open chapter panel could survive a search that filtered its subject out | close the panel when its subject leaves the filter |

Close-out audit findings (constraint audit, after the Phase 2 commit) — all fixed before this commit:

| ID | Constraint | Finding | Fix |
| --- | --- | --- | --- |
| C-01 | **C5** — lazy-load below-the-fold content | Nothing was lazy: the how-it-works block and footer were laid out and painted on load | `.section--tinted` and `.footer` now use `content-visibility: auto` + `contain-intrinsic-size: auto 40rem` — CSS-only, no observer, no layout shift |
| C-02 | **C5** — animation on transform/opacity only | Two `transition` declarations still animated `background-color` / `border-color` | Removed; hover now changes colour instantly and only `transform` transitions |
| C-03 | Modular rules / hygiene | `.nav__label` was used by markup and `nav.js` but had no CSS rule | Added a rule in `nav.css`, so the class is defined where it is used |

Found during the redesign (all fixed before the commit):

| ID | Severity | Bug | Fix |
| --- | --- | --- | --- |
| B-06 | P1 | `home.js` called `subjectRow()` after a silent failed edit — the import never landed, so Home caught the `ReferenceError` and showed "Subjects could not be loaded" while Subjects worked | Added the import; the jsdom run caught it. *Lesson: verify every scripted edit, never trust that a `replace` matched.* |
| B-07 | P1 (method) | The first jsdom run "passed" 43 checks while the app scripts had **never executed** — jsdom does not support `<script type="module">`, so the assertions were testing static markup | Bundle the real module graph with esbuild and inject it; only then trust the run |
| B-08 | P2 | At 320–375 px the theme segmented control could overflow its row, and the key input could refuse to shrink beside the Show button | Stack the theme row under 30rem; `min-width: 0` on the field |
| C-04 | C5 / hygiene | Dead CSS after the rewrite: `chip`, `chip--accent`, `chip--warning`, `iconbtn`, `switch__text`, `set-row--stack`, `.stack`, `.divider` | Removed; the class-coverage audit now reports no dead rules |
| C-05 | §7 line cap | Four files exceeded 200 lines after first draft (components 326, cards 218, index 203, subjects 205) | Split into `controls.css`, `chapters.css`, `subjectRow.js`; largest file now 199 lines |
| C-06 | **C5** — motion on transform/opacity only | A `transition: border-color` came back with the new `.field__control` | Removed; every transition in `styles/` is `transform` again (5 rules, all verified by grep) |
| C-07 | **C6** — 1.4.11 non-text contrast | The search field used `border-color: transparent` on a `--sunken` fill: its boundary was **1.10:1** against the page | Border is `--line-control` — **3.42:1** against the fill, 3.64:1 against the page (dark 3.66 / 3.83) |
| C-08 | **C6** — 1.4.11 non-text contrast | The selected theme segment was a white pill on a `--sunken` track: **1.10:1** light, **1.04:1** dark — the selected state was not perceivable | Checked label carries a `--line-control` ring — **3.76:1** light, 3.53:1 dark. A filled control is never its own boundary |

---

## 5. Phase 2 board — done

| ID | Item | Status |
| --- | --- | --- |
| P2-1 … P2-7 | Phase 2 scope (`AGENTS.md` §1); delivered | ✅ |
| R-1 … R-4 | App-shell redesign: frame, design system, three views, router | ✅ |

---

## 6. Verification — what was and was not checked

**Performed (this environment):**

- **DOM integration run, 45/45 passing.** The real module graph (bundled by esbuild only for the harness, not
  shipped) executed in jsdom against the live server and real `localStorage`: default view, stat strip = 5/12/72
  from the JSON, five Home shortcuts, honest no-key status line, tab switching + `aria-current` + focus to the
  view title, deep link `#/subjects/science` twice, chapter count equal to the JSON, back link, search filter and
  empty state and clear-search, provider list, key save (row rendered, masked shown, raw key absent from the DOM,
  `vs:v1:byok` written), Home reflecting the saved key, dark theme + `theme-color` + persistence, LEDM class +
  persistence, remove + Undo restoring the key, and the `#main` skip link leaving the view alone. **Zero console
  errors or unhandled rejections.**
- **Service suite, 32/32 passing** (unchanged from Phase 2): storage round-trip, corrupt-JSON fallback,
  unserialisable write, namespace clear; key validation/masking/save→list→remove→restore; `testKey` for
  200/401/429/503/network/no-key; key in a header never a URL; Gemini header; console-leak assertion;
  `contentService` against the real JSON plus malformed/404/network mapping.
- **All 35 referenced files return 200** (`python3 -m http.server`), resolved through the full import closure —
  zero 404s.
- **All 11 JS modules parse as ES modules**; HTML tags balance, 46 ids with no duplicates, every
  `aria-labelledby`/`aria-describedby`/`aria-controls`/`for` target resolves, every sprite reference resolves.
- **Weight: 35 requests · 90.7 KB raw · 32.1 KB gzip** (budget 200 KB, ~109 KB headroom).
- **Line caps:** largest file 199 lines (`index.html`); every file ≤ 200.
- **Contrast computed, not eyeballed** (25 pairs): light ink 18.1:1, ink-2 9.7:1, ink-3 5.7:1, white-on-accent
  6.3:1, accent on accent-weak 7.0:1, control border 3.76:1; dark ink 17.7:1, ink-2 12.1:1, ink-3 7.5:1,
  on-accent 9.2:1, accent 9.0:1, control border 3.53:1.
- **Hygiene greps:** no inline styles or handlers, no `innerHTML`/`eval`/`new Function`, no `console.*` except one
  documented `console.warn`, no globals on `window`, no `fetch`/`localStorage` in `modules/`, no dependencies,
  no stale references to the deleted `nav.js` / `layout.css` / `nav.css` / `dialog.css`.
- **Class and token coverage:** every class emitted by markup or JS has a rule; every `var(--…)` is defined;
  no dead rules remain; `[data-theme="dark"]` and `.ledm` both exist and are wired.

**Not performed — do not assume these pass:**

- **No real browser run.** jsdom executes the JS but paints nothing: pixel layout at 375 px and 1280 px, the
  rail/tab-freeze behaviour of `100dvh` on iOS Safari, focus-ring visibility on real hardware, and 200 % zoom
  were **not** observed. These are the first things to check in the preview.
- **BYOK end-to-end with a live provider:** no key exists here and the sandbox cannot reach provider hosts. The
  invalid-key path is proven at unit level; the **valid-key path is implemented, not verified**.
- **CORS behaviour** of the four providers from a browser remains unverified.
- **Screen-reader pass** (VoiceOver/TalkBack) is pending a human.

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
| D-15 | Lazy loading is CSS-only (`content-visibility: auto`) | Satisfies C5 with no JS, no IntersectionObserver, no layout shift; the browser skips layout and paint for off-screen blocks. |
| D-16 | Hover colour changes are instant; transitions are `transform` only | Strict reading of C5. Colour fades are not worth a paint on a 2-thread device. |
| D-17 | Weight is measured through the import graph, not the `<script>` tags | The first honest number is 26 requests / 85.9 KB; the earlier 17-request figure was wrong and is corrected in §6. |
| D-18 | **`AGENTS.md` left untouched** during close-out, even though the close-out protocol is not yet in it | `AGENTS.md §8` protects its protocol sections and the close-out rule itself says AGENTS.md changes need explicit approval. The protocol currently lives in the conversation only; codifying it in §5 is a one-line ask away. |
| D-19 | Session 1 scope cut to **lesson viewer only**, notes moved to the following task | The close-out protocol requires exactly one next task; a viewer+notes bundle would have been two. |
| D-20 | Redesign ships as **one feature commit**, not the two I first proposed | The frame and the views are inseparable: any split would have produced an intermediate commit with either dead CSS or orphan markup, which the Green Repo Rule forbids. |
| D-21 | Content caching moved to `modules/contentStore.js`, not into `contentService` | A module-level cache inside the service changed its behaviour for every caller and broke the service suite's isolated scenarios. Caching is an app concern; services stay pure transports. |
| D-22 | Settings became a **view**, and the `<dialog>` was deleted | A dialog on mobile steals the whole screen and needs a focus trap, Escape handling and scroll locking. A routed view gets back-button support and keyboard behaviour for free. |
| D-23 | **`AGENTS.md` still untouched**, even though §3/§3.1 now describe the old palette | Same rule as D-18: changing the visual identity section is a rule change, and rule changes need explicit approval. Tracked as `A-01` in §4 rather than silently edited. |
| D-24 | Home shows **only facts it can prove** — no streak, no completion ring, no "progress %" | Lessons do not exist yet, so any progress metric would be invented. Real counts + real key status + real shortcuts only. |

---

## 8. How to update this file

1. Pick work from §2/§3 or from my explicit instruction — nothing else.
2. On completion: move the row to §1, mark ✅, and record **how it was verified**. "Implemented, not verified" stays listed under §6.
3. Log every non-obvious choice as a `D-xx` row; log every bug (including fixed ones) in §4.
4. Never claim a check you did not perform (`AGENTS.md §5.2`).
5. Append a dated line when a session closes; never rewrite history.

This section is part of the protected protocol (`AGENTS.md §8`).
