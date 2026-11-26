# AGENTS.md — The Rulebook

> **Read this file first, in full, before writing a single line of code.**
> Then read `ARCHITECTURE.md` (how the system fits together) and `PROGRESS.md` (what is actually being built right now).
>
> This document is the contract between the human owner and every AI agent working in this repository.
> Rules here are **hard constraints**, not suggestions. If a task requires breaking one, stop and ask the human.

---

## ▶ Workflow Protocol: "Plan First, Code Second"

> **This is a process gate, not a preference. It runs before any code.**
> Referred to elsewhere in this repository as **the Workflow Protocol**.
> It is **not** waived by a task being large, urgent, obvious, "just scaffolding", or "already described in the
> chat". The only way past it is an explicit `Approved` from the human, or the Exception Rule at the bottom.

To ensure stability, zero-cost compliance, and strict adherence to the BYOK/static architecture, you **MUST**
follow this two-step loop for any feature larger than a simple CSS tweak.

### Step 1 — Architect Mode (read-only & planning)

When the human requests a new feature (e.g. "Add a Quiz Module", "Implement note saving"):

1. **READ** `ARCHITECTURE.md` to understand the current file structure.
2. **READ** `PROGRESS.md` to check for existing conflicts or completed tasks.
3. **ANALYZE** the request against our Core Constraints:
   - Is it purely client-side (HTML/CSS/JS)?
   - Does it rely on user-provided keys (BYOK) if API calls are needed?
   - Is it lightweight for low-end devices?
4. **OUTPUT** a detailed implementation plan (see the required contents below).
5. **STOP. DO NOT WRITE CODE YET.** Wait for approval.

**Step 1 is strictly read-only.** While planning you may read files and run read-only commands
(`ls`, `cat`, `grep`, `wc`, `git log`). You may **not** create, edit, move, or delete files, install anything,
or run generators. A plan is a message in the chat, not a commit — do not add planning documents to the repo
unless explicitly asked.

**Required plan contents** — every heading must appear, even if the answer is "none". Paths follow §3.1.

| Section | What it must contain |
| --- | --- |
| **Files to create** | Exact paths, e.g. `src/js/modules/QuizEngine.js`. One line of purpose each. No vague "a new file". |
| **Files to edit** | Specific file + specific function or section, e.g. `src/js/main.js → boot()`. Not "update main.js". |
| **Data flow** | Where the data lives: `localStorage` key (`cz:v1:…`) or IndexedDB store + record shape, size estimate, and whether a `STORAGE_VERSION` migration is needed. Reference `ARCHITECTURE.md §6.5`. |
| **Security check** | How API keys (if any) are handled, or the explicit sentence "No key, no network calls." Include the CSP/`connect-src` impact if a provider is added. |
| **Perf & a11y impact** | Bytes added vs. the budgets in §6; keyboard/contrast/`aria-live` implications. |
| **Acceptance criteria** | Testable checkboxes, in the style of `PROGRESS.md §3`. |
| **Risks & assumptions** | What could be wrong, what you are assuming, open questions numbered for the human. |
| **Out of scope** | What you are deliberately **not** doing, so scope cannot creep mid-build. |
| **Execution steps** | Ordered, commit-sized steps — the sequence you will follow in Step 2. |

Keep the plan tight: roughly 20–40 lines. Interface sketches (function signatures, a JSON shape, a folder tree)
are allowed and encouraged; **implementation bodies are not** — that is Step 2.

If the request is ambiguous, put at most three numbered questions **inside** the plan instead of stalling
(see §11.1, item 5). Do not ask and plan in two separate turns when one will do.

### Step 2 — Review & Execute

1. The human reviews the plan.
2. If the human says **"Approved"**, execute the plan step-by-step, in the order stated.
   - **"Approved with changes"** → restate the amended plan in ≤ 5 lines, then execute.
   - **Rejected, or questions returned** → revise the plan. Do not write code. Do not partially implement the
     parts that "seemed fine".
   - **Silence is not approval.** Neither is a vague "ok let's see". Wait for an unambiguous go-ahead.
3. Execute in commit-sized steps, in order. One logical change per commit (§10). Tick plan items as you go and
   report progress as you pass each step — do not disappear for the whole build.
4. **Deviation rule.** Stop and re-plan (back to Step 1) if implementation reveals that the plan was wrong about
   anything on this list:
   - a new file is needed that the plan did not list;
   - a storage schema/key changes, or a migration appears;
   - the security surface changes (key handling, CSP, a network origin);
   - added weight exceeds a §6 budget;
   - a dependency, framework, backend, or build step becomes necessary (also escalation, §12).

   Small deviations (a variable name, a token value, splitting a function) may proceed — note them in the commit
   body and in `PROGRESS.md`.
5. When the code is done, you **MUST** update `PROGRESS.md` with the completed status and any new bugs/notes:
   tick the acceptance criteria, add manual-verification notes, log decisions (`D-0xx`), record bugs found
   (`P0`–`P3`), and add a dated changelog entry. Then run the pre-flight checklist in §11.3.

### Exception Rule — trivial changes

For trivial changes (e.g. "Change the header colour to blue") you may skip Step 1 and code directly, but you
**must still update `PROGRESS.md`** (changelog row for anything user-visible) and commit conventionally.

A change is trivial only if **all** of the following are true:

- ≤ 20 changed lines across ≤ 2 existing files;
- no new file, no renamed file;
- no change in JavaScript behaviour or logic (a token value, copy/typo, comment, `alt` text, an icon swap);
- no storage schema, no `fetch`, no BYOK/key handling, no CSP change;
- no new dependency or asset.

Anything touching keys, storage schemas, network calls, CSP, `index.html`'s `<head>`, or that creates a file is
**never** trivial, however small it looks. If you have to think about whether it counts as trivial, it does not —
write the five-line plan.

---

## ★ Quality Bar: Production-Grade, Never Demo-Grade

> **This is the standard every task is judged against, whatever its size.** A feature that "works when I click
> it once" is not shipped. The Definition of Done (§11.4) enforces this bar; §4 and §6 hold the measured detail.
> Where this section and §4/§6 state the same rule, they must agree — if they ever disagree, that is a bug in
> the docs: fix both in one commit.

### Completeness

- Every feature ships fully working: **real seeded content** (sample Class 9 notes, quizzes, lessons), **all
  states handled** (loading, empty, error, success), **zero TODOs, zero dead buttons**.
- Every list supports **search / filter / sort where relevant**. Every delete has an **Undo** toast. Every
  mutation updates the UI immediately (**optimistic update**) and persists to `localStorage` / IndexedDB.
- Every BYOK feature has **three working paths**: **no key** (friendly setup prompt), **invalid key** (clear
  error, no crash), **valid key** (full feature).

What "done" means for each of those words:

| Term | Definition |
| --- | --- |
| **Seeded** | Present on first load with zero setup: at least one complete lesson (sections + questions with explanations), a handful of sample notes, a populated-looking (not empty) home. Lorem ipsum, "Coming soon", `0 items`, and dead links are **not** seed data. |
| **Four states** | Every view that fetches, loads, or saves renders: loading (inline, no layout jump), empty (explains the next action), error (says what failed and offers a retry), success. Tested by forcing each one — not assumed. |
| **Relevant** | The list can realistically exceed ~10 items, or the user has a reason to narrow it. A 3-item menu needs no filter; a 60-lesson list does. |
| **Undo** | A toast with a working Undo for ≥ 5 s, restoring the exact prior state. Soft-delete first, hard-delete after the window, and say so in the copy. |
| **Optimistic** | UI updates before the write resolves; on failure it **rolls back** and tells the user. Silent divergence between UI and storage is a P1 bug. |
| **Dead button** | Visible, focusable, does nothing, or does something different from its label. A P1 bug — not a placeholder, not "phase 2". |

### Visual Identity (Education, not generic template)

- Commit to a subject-derived palette: **deep ink-indigo dominant, saffron/amber primary accent, chalk-white
  warm neutral surfaces**, plus semantic **success / warning / danger / info** tones. Define all as CSS custom
  properties in `src/css/tokens.css`. **No default gray anywhere** — no `#808080`, `#ccc`, `#eee`, no
  browser-default borders, scrollbars, or selection colours. Exact tokens and measured ratios: §4.1.
- **Custom scrollbars styled from the palette** (track, thumb, hover), in both themes: `scrollbar-color` +
  `scrollbar-width` for standards browsers, `::-webkit-scrollbar*` for Chromium/Safari. Never hide the
  scrollbar, never fake a scroll container, thumb ≥ 3:1 against its track (§4.7).
- **Fixed navbar on scroll** with **active-section highlighting**; **anchor jumps offset by navbar height**
  (`scroll-margin-top`). One IntersectionObserver does the highlighting — never a `scroll` handler (§4.7).

### Richness Within the LEDM Budget

- **Animations:** CSS transitions on `transform` / `opacity` **ONLY**. No animation libraries, no canvas/WebGL
  unless a lesson truly needs it. Nothing that forces layout or paint per frame.
- **Respect `prefers-reduced-motion`.** Staged entrance animations must be cheap and skippable: ≤ 300 ms,
  stagger ≤ 60 ms, instantly complete under reduced-motion or LEDM.
- **Initial page weight: under 200 KB** excluding user content. **System font stack only.** **Lazy-load
  below-the-fold sections.** (§6 breaks this into per-file ceilings.)
- Must run smoothly on a **2-thread, 2.2 GHz CPU, 10 GB RAM** device. **If a feature janks there, simplify the
  feature** — not the device, not the budget.

### Accessibility

- **WCAG AA contrast on every text/control pair.** Full keyboard navigation. Visible focus states.
  Semantic HTML. (AA is the floor for the whole UI; body text still targets 7:1 — §4.1, §5.)

---

## 0. Precedence & Interpretation

When documents conflict, resolve in this order:

1. The human's latest direct instruction in the conversation.
2. `AGENTS.md` (this file) — rules and constraints.
3. `ARCHITECTURE.md` — structure and interfaces.
4. `PROGRESS.md` — current work, ordering, and status.
5. Existing code conventions in the repository (follow the neighbourhood).

If a rule cannot be followed, do **not** silently work around it. Write the conflict in
`PROGRESS.md → Risks & Open Questions` and ask.

The **Workflow Protocol** above is a process gate rather than a preference: it is not overridden by
convenience, by a long conversation, or by the apparent simplicity of the change. Only the human saying
`Approved`, or a change that satisfies every clause of the Exception Rule, gets you to code.

---

## 1. Project Identity

| Field | Value |
| --- | --- |
| Working codename | **ClassZero** (provisional; single source of truth is `src/js/core/config.js → APP_NAME`) |
| One-liner | A free, unlimited, offline-first study platform for Class 9 students, built with nothing but HTML, CSS, and vanilla JavaScript. |
| Primary user | A Class 9 student in India, on a low-end Android phone, possibly on metered or intermittent data. |
| Design constraint | **LEDM — Low-End Device Mode.** Every screen must be usable and fast on a 2 GB RAM device with a 4-year-old mid-tier SoC. |
| Deployment | Static files only, served from GitHub Pages or any static host. |
| Total running cost | **₹0 / $0, forever.** No servers, no paid databases, no paid analytics, no subscriptions. |

### 1.1 The four promises

Every feature must survive all four:

1. **Free** — a user never has to pay, sign up, or hand over personal data to use the core product.
2. **Unlimited** — no artificial caps, no quotas, no "upgrade to continue".
3. **Lightweight** — it works on a bad phone on a bad connection.
4. **Yours** — all user data stays in the browser. Nothing is uploaded unless the user explicitly invokes a
   third-party provider with their own key.

If a feature cannot meet all four, it is out of scope.

---

## 2. Tech Stack — Allowed & Banned

### 2.1 Allowed (this is the entire list)

| Layer | Allowed |
| --- | --- |
| Markup | HTML5, semantic elements, `<template>`, ARIA where semantics fall short |
| Styling | CSS3 — custom properties, Grid, Flexbox, `clamp()`, container queries, `prefers-*` media queries |
| Scripting | ES2020+ JavaScript, native ES modules (`<script type="module">`), Web APIs |
| Storage | `localStorage`, `sessionStorage`, `IndexedDB`, Cache API (optional) |
| Network | `fetch`, `AbortController`, `ReadableStream` — **client-side only** |
| Crypto | Web Crypto API (`crypto.subtle`) |
| Graphics | Inline SVG, CSS gradients, `<canvas>` when genuinely needed |
| Hosting | Any static file host |

### 2.2 Banned — hard no

| Banned | Why |
| --- | --- |
| Any backend language/runtime (Node server, PHP, Python, Ruby, Go, Java…) | There is no server. The host only serves files. |
| Any database (SQL, Firebase, Supabase, MongoDB…) | Storage is `localStorage` / `IndexedDB`. |
| Frameworks & view libraries (React, Vue, Svelte, Angular, Solid, Lit, Alpine, jQuery, Preact) | Payload cost + build step + the whole point of the project. |
| Build/bundler tooling in the delivery path (Webpack, Vite, Rollup, Parcel, esbuild, Babel, Sass/Less/PostCSS pipelines) | The browser runs the source files directly. |
| TypeScript | JSDoc + `// @ts-check` gives most of the safety with zero toolchain. |
| CSS frameworks (Tailwind, Bootstrap, Bulma, Pico) | We own our CSS. A framework's reset alone can cost more than our entire stylesheet. |
| Icon fonts, web fonts, sprite-font hacks | Bytes for nothing. Use inline SVG + system fonts. |
| ORM/query builders, state libraries, router libraries, animation libraries, date libraries, `lodash`-style utility bundles | Write the 20 lines. It is cheaper than the dependency. |
| Trackers, ads, third-party analytics, fingerprinting, session recording, cookie banners | Violates "free + private" and costs bytes. |
| Telemetry that phones home | Absolutely not. |
| Polyfill bundles | Target modern evergreen browsers; degrade gracefully instead. |
| `<iframe>` embeds of third-party apps on primary flows | Heavy, tracker-laden, often paywalled. |

### 2.3 The zero-dependency test

Before adding **anything** outside the allowed list, answer in writing (in the PR/commit message):

1. Does a native Web API or 20 lines of our own code already do this?
2. What is the exact added transfer size, gzipped?
3. Does it work with no build step, loaded as a plain ES module from a static host?
4. Is it licensed permissively (MIT/BSD/Apache/ISC/0BSD/CC0)?
5. Does it break when offline / on a 2 GB RAM device?

If any answer is unfavourable, do not add it. When in doubt: **write it yourself, small.**

> **A note on `package.json`:** it may exist solely to declare a local dev server
> (`npx serve`) and lint scripts. It must never become a runtime dependency of the shipped site.
> The site must work when the repository folder is dropped onto any static host, unbuilt.

---

## 3. Coding Style

### 3.1 File & folder conventions

| Kind | Convention | Example |
| --- | --- | --- |
| HTML pages | `kebab-case.html` | `index.html`, `notes.html` |
| JS modules | `PascalCase.js` for domain modules, `kebab-case.js` for utilities | `StorageManager.js`, `dom.js` |
| CSS files | `kebab-case.css` | `tokens.css`, `quiz-card.css` |
| Data/content | `kebab-case.json` | `class9-science-ch1.json` |
| Tests | `*.test.js`, co-located under `/tests` | `quiz-engine.test.js` |

- **One responsibility per file.** A module that needs the word "and" in its description is two modules.
- JS files export **named** exports (`export function createQuizEngine()`). Default exports are banned —
  they hide rename churn and encourage barrel files.
- No barrel/index re-export files. Import from the module you actually mean.
- Absolute import paths are banned; use relative paths with explicit `.js` extensions
  (`import { x } from '../utils/dom.js'`) — required by browsers.

### 3.2 Module shape

```js
// @ts-check
/**
 * QuizEngine — grades answers and owns quiz session state.
 * Public API is frozen; add methods deliberately.
 */
import { log } from '../utils/log.js';

/** @typedef {{ id: string, prompt: string, options: string[], answerIndex: number }} Question */

/**
 * @param {{ questions: Question[], onGrade?: (result: GradeResult) => void }} options
 */
export function createQuizEngine ({ questions, onGrade }) {
  // state is private to the closure; nothing leaks to `window`
  let index = 0;

  /** @returns {{ correct: boolean, explain: string }} */
  function submit (choiceIndex) { /* ... */ }

  return { submit, next, current, reset };
}
```

Rules:

- **Factory functions + closures** for stateful modules. `class` only for genuine value types or when
  extending a platform class. Never `new`-ing something that is really a namespace.
- **No global leakage.** Nothing on `window` except a single, explicitly opt-in debug handle
  (`window.__classzero`), gated behind `?debug=1`.
- **Pure functions** for calculation/formatting; side effects isolated in the outermost layer.
- **Dependency injection over direct imports** for storage and network inside domain modules, so the
  logic is testable: `createQuizEngine({ storage })`, not `import storage; storage.set(...)`.
- **Early returns** and guard clauses. Nesting depth ≤ 3.
- Functions ≤ 40 lines. Files ≤ 300 lines. Cyclomatic complexity ≤ 8 (split it instead).
- Parameters ≤ 3; beyond that take an options object.
- `const` by default, `let` only when reassigned, `var` never. `===` always. Semicolons always.
- Async/await over `.then()` chains. Every `await` on I/O is wrapped in `try/catch` **or** documented
  as intentionally letting the caller handle it.
- Every exported function has a JSDoc block with `@param`, `@returns`, and `@throws` where relevant.

### 3.3 Forbidden JavaScript

| Forbidden | Use instead |
| --- | --- |
| `innerHTML` / `outerHTML` / `insertAdjacentHTML` with any non-constant string | `textContent`, `createElement`, `<template>` + `cloneNode`, or the `html` tag helper with auto-escaping |
| `eval`, `new Function`, `setTimeout("string")` | Nothing. Ever. |
| `document.write` | Build DOM properly. |
| Inline event handlers (`onclick="..."`) | `addEventListener`. |
| `alert()` / `confirm()` / `prompt()` | In-page `<dialog>` or inline UI. |
| `console.log` in shipped code | `log.debug()` from `utils/log.js` (stripped behind a level gate) |
| Storing API keys or any secret in `localStorage` | `BYOKManager` (see §7) |
| `setInterval` polling loops | Event-driven updates; a single `requestAnimationFrame`-throttled loop if genuinely needed |
| `JSON.parse` on untrusted input without `try/catch` | Guarded parse helper |
| Modifying prototypes of built-ins | Plain functions |
| Synchronous XHR | `fetch` |
| `window.location` for internal navigation | Router (see `ARCHITECTURE.md`) |

### 3.4 HTML standards

- **Semantic first.** `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `button`, `label`.
  A `div` with a click handler is a bug; use `<button>`.
- Exactly **one `<h1>` per page**; headings descend in order, never skip a level for visual size.
- Every form control has a real `<label for>`; placeholders are **not** labels.
- Every page declares `<html lang="en">` (or the active language), `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Every `<img>` has `alt` (empty `alt=""` for decorative), explicit `width`/`height` to prevent layout shift,
  `loading="lazy"` and `decoding="async"` below the fold.
- Interactive elements are reachable and operable by keyboard, in visual order, with a visible focus ring.
- Touch targets ≥ 44×44 CSS px, with ≥ 8 px spacing between adjacent targets.
- Use `<dialog>` for modals (native focus trap, Esc handling, `::backdrop`). Do not hand-roll modals.
- No layout tables. No `dir="ltr"` lint noise. No inline `<style>`/`<script>` except the sanctioned
  boot fallback documented in `ARCHITECTURE.md`.

### 3.5 CSS standards

- **BEM for components**, utilities for layout/spacing:
  - Block: `.quiz-card`
  - Element: `.quiz-card__prompt`
  - Modifier: `.quiz-card--answered`
  - State: `.is-loading`, `.is-active` (JS-toggled; always paired with `aria-*` or a real attribute selector)
  - Utility: `.u-stack-md`, `.u-visually-hidden`, `.u-cluster`
- **No magic values.** Colour, spacing, radius, shadow, and font size come from custom properties in
  `tokens.css`. A raw hex code outside `tokens.css` is a review failure.
- **Mobile-first** media queries only (`min-width`). Desktop-down (`max-width`) queries are banned except for
  `prefers-*` capability checks.
- **Specificity ceiling: 0,2,0.** No ID selectors. No `style` attribute writes for state — toggle classes.
- No `!important`, except inside `@media (prefers-reduced-motion: reduce)` and `@media print`.
- No element selectors deeper than one descendant. Class-based targeting.
- Animations: `transform` and `opacity` only (compositor-friendly). Never animate `width`, `height`, `top`,
  `left`, `box-shadow`, or `filter` on low-end devices.
- Use logical properties (`margin-inline`, `padding-block`) so future RTL/Hindi support is free.
- Prefer borders over shadows for separation (painting a shadow is expensive on weak GPUs).
- Keep the cascade shallow: `@layer` is allowed and encouraged for `reset, tokens, base, layout, components, utilities`.

---

## 4. Design Rules

### 4.1 Palette — subject-derived, high contrast, verified

The direction is fixed by the **Quality Bar**: deep ink-indigo dominant, saffron/amber primary accent,
chalk-white warm neutrals, four semantic tones. This is not a grey UI with a blue button — it is a study
material palette: ink on chalk, saffron for what matters.

All values live in `src/css/tokens.css` (and **only** there — §3.5). Ratios below were computed with the WCAG
2.1 relative-luminance formula against the stated background. **Do not eyeball replacements; re-verify if you
change a value** (a 10-line script is enough — do not guess).

**Default theme — "Chalk & Ink"**

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--c-bg` | `#FBF8F2` | Page background — chalk-white, warm | — |
| `--c-bg-alt` | `#F4EFE4` | Cards, panels, code blocks | surface step, never a text pair |
| `--c-text` | `#141830` | Body text, headings — deep ink-indigo | **16.5:1** on bg · **15.2:1** on alt |
| `--c-text-muted` | `#4C4F66` | Secondary text, captions, metadata — indigo-tinted slate | **7.6:1** · **7.0:1** |
| `--c-border` | `#DED6C6` | Hairlines, dividers — **decorative only** | not used for text or control boundaries |
| `--c-border-strong` | `#7E7666` | Input borders, control outlines | **4.2:1** on bg |
| `--c-ink` | `#141830` | Dominant dark surface: header, footer, hero band | chalk text on it **15.2:1** |
| `--c-on-ink` | `#F5EFE2` | Text on ink surfaces | **15.2:1** |
| `--c-on-ink-muted` | `#B9B4C4` | Secondary text on ink surfaces | **8.6:1** |
| `--c-accent` | `#F0A22E` | Primary CTA fill — saffron | ink text on it **8.2:1**; against chalk only **2.0:1** → a 1 px `--c-accent-strong` border is **mandatory** on saffron fills |
| `--c-on-accent` | `#141830` | Text/icon inside saffron fills | **8.2:1** |
| `--c-accent-strong` | `#8F5400` | Links, accent text, hover fill, saffron border | **5.8:1** on bg · **5.3:1** on alt · white on it **6.1:1** |
| `--c-accent-tint` | `#FBEBD0` | Selected row, current nav item, highlight wash | ink **14.9:1** · accent-strong **5.2:1** |
| `--c-success` | `#1E6B45` | Correct answer, saved state | **6.1:1** on bg · **5.7:1** on its tint |
| `--c-success-tint` | `#E7F3EA` | Correct-answer background | — |
| `--c-warning` | `#8A5300` | Caution, quota, offline notice | **6.0:1** on bg · **5.5:1** on its tint |
| `--c-warning-tint` | `#F8EEDA` | Caution background | — |
| `--c-danger` | `#A3231F` | Wrong answer, errors, destructive actions | **7.0:1** on bg · **6.5:1** on its tint |
| `--c-danger-tint` | `#FCEBE8` | Error background | — |
| `--c-info` | `#1E5A8A` | Tips, neutral notices | **6.9:1** on bg · **6.3:1** on its tint |
| `--c-info-tint` | `#E7EFF7` | Info background | — |
| `--c-focus` | `#2B3A8F` | Focus ring — indigo | **9.4:1** on bg · **4.7:1** against `--c-accent` |
| `--c-scroll-track` | `#F1EADC` | Scrollbar track | — |
| `--c-scroll-thumb` | `#8F8674` | Scrollbar thumb | **3.0:1** vs track (§4.7) |
| `--c-scroll-thumb-hover` | `#6F6757` | Scrollbar thumb, hover | one step darker than thumb |

**Dark theme — "Ink & Chalk"** (opt-in, `prefers-color-scheme` + manual override)

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--c-bg` | `#12152B` | Page — deep ink-indigo | — |
| `--c-bg-alt` | `#1B1F38` | Cards, panels | — |
| `--c-text` | `#F2EDE3` | Body text — chalk on ink | **15.4:1** |
| `--c-text-muted` | `#B5B2C2` | Secondary text | **8.7:1** on bg · **7.8:1** on alt |
| `--c-border` | `#2E3352` | Hairlines — decorative only | — |
| `--c-border-strong` | `#767C9E` | Input borders, control outlines | **4.4:1** on bg |
| `--c-ink` | `#0B0E20` | Darker band for header/footer | chalk on it **16.7:1** |
| `--c-on-ink` | `#F5EFE2` | Text on ink surfaces | **16.7:1** |
| `--c-accent` | `#F5B23E` | CTA fill + accent text — bright saffron | **9.7:1** on bg · ink on it **9.7:1** (no border needed in dark) |
| `--c-on-accent` | `#12152B` | Text inside saffron fills | **9.7:1** |
| `--c-accent-strong` | `#F5B23E` | Links, accent text, accent borders | **9.7:1** |
| `--c-success` | `#6FD39B` | Correct answer, saved state | **9.8:1** |
| `--c-warning` | `#F0B64A` | Caution | **9.8:1** |
| `--c-danger` | `#FF9A93` | Errors, destructive text | **8.8:1** |
| `--c-danger-fill` | `#C0392F` | Destructive button fill | `#FFF5F4` text **5.1:1** · **3.3:1** vs bg |
| `--c-info` | `#8FC3EE` | Tips, neutral notices | **9.6:1** |
| `--c-focus` | `#F5B23E` | Focus ring | **9.7:1** on bg |
| `--c-scroll-track` | `#1B1F38` | Scrollbar track | — |
| `--c-scroll-thumb` | `#767C9E` | Scrollbar thumb | **4.0:1** vs track |
| `--c-scroll-thumb-hover` | `#9AA0C0` | Scrollbar thumb, hover | one step lighter than thumb |

`--c-on-ink-muted` (`#B9B4C4`) is unchanged from the default theme. Dark theme has **no tint tokens**:
selected/active states use `--c-bg-alt` plus a 1 px accent border.

Additional rules:

- **Never encode meaning in colour alone.** Correct/incorrect also carries an icon and a word.
- **Contrast floors:** AA (**4.5:1**) for **every** text and control pair; body text targets **7:1**; non-text UI
  boundaries and focus rings **3:1**. Semantic text on its own tint is verified above — re-verify any new pair.
- **No default gray, anywhere.** Every neutral is warm and named. `#808080`, `#ccc`, `#ddd`, `#eee`, `silver`,
  `gray`, `initial`, and browser-default control chrome are banned. Audit with
  `grep -rniE "#(ccc|ddd|eee|fff|000|808080)|\\bgray|\\bgrey|\\bsilver\\b" src/`.
- **Count discipline:** 1 warm neutral ramp + 1 ink-indigo + 1 saffron + 4 semantic tones (+ their tints).
  No decorative gradients, no glassmorphism, no shadow stacks.
- Saffron fills always pair with `--c-on-accent` (ink) text **and** a 1 px `--c-accent-strong` border — saffron
  alone is only 2.0:1 against chalk, so the border is what makes the control boundary legible.
- Dark mode is a token swap on `<html data-theme="dark">`. Components never hardcode theme colours.
- Focus ring: 2 px `--c-focus`, 2 px offset, so the ring always sits on the surface colour rather than on the
  fill it surrounds.

### 4.2 Typography — system fonts, zero bytes

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans",
             "Noto Sans Devanagari", "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
             "Liberation Mono", monospace;
```

- **No web fonts.** No `@font-face`. No Google Fonts. Not even one weight.
- `"Noto Sans Devanagari"` in the stack costs nothing and gives correct rendering when the device has it —
  important for Hindi medium students.
- Base: `font-size: 100%` (respects user browser settings), `line-height: 1.5`, body text `1rem`.
- Fluid scale, capped so it never breaks 320 px screens:

| Step | Value | Use |
| --- | --- | --- |
| `--fs-xs` | `0.8125rem` (13px) | Metadata, badges |
| `--fs-sm` | `0.9375rem` (15px) | Secondary UI |
| `--fs-md` | `1rem` (16px) | Body |
| `--fs-lg` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem)` | Lead paragraph |
| `--fs-xl` | `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)` | Section headings |
| `--fs-2xl` | `clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)` | Page title |

- Measure: `max-width: 68ch` for prose. Never full-width paragraphs on desktop.
- `text-wrap: pretty` on headings/paragraphs where supported (progressive enhancement).
- Respect `prefers-contrast: more` (thicken borders, remove tints) and the user's OS font scaling.

### 4.3 Spacing, radius, elevation

```css
--sp-1: 4px;  --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
--sp-5: 24px; --sp-6: 32px;  --sp-7: 48px;  --sp-8: 64px;
--radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-pill: 999px;
```

- Everything is a multiple of 4 px. No arbitrary margins.
- Elevation is expressed with a 1 px border by default; a single shadow token (`--shadow-1`) exists for
  overlays only (`<dialog>`, popovers, toasts). No shadow stacks.

### 4.4 Breakpoints — mobile-first

| Name | `min-width` | Reference device |
| --- | --- | --- |
| *(base)* | 0 | 320 px floor — smallest supported. Everything must work here first. |
| `sm` | 480 px | Small Android phones |
| `md` | 768 px | Large phones landscape, small tablets |
| `lg` | 1024 px | Tablets, small laptops |
| `xl` | 1280 px | Desktop (content capped at `72rem`, centred) |

Rules:

- Design at **360 × 640** first. If it works there, it works everywhere.
- Hard floor: **320 px width with 200 % zoom, no horizontal scrolling** (except intentional data tables).
- Use `@media (min-width: …)` only. Layout with Grid/Flexbox + `clamp()`; reach for a breakpoint only when
  content actually breaks, not at device-sounding numbers.
- Landscape phone (≈ 640 × 360) must keep primary actions reachable — do not pin CTAs below the fold.
- Safe areas: `padding-inline: max(var(--sp-4), env(safe-area-inset-left))` for notched devices.

### 4.5 LEDM — Low-End Device Mode

Auto-enable when **any** of these is true, and always allow manual override in Settings:

```js
navigator.connection?.saveData === true
|| /2g|slow-2g|3g/.test(navigator.connection?.effectiveType ?? '')
|| (navigator.deviceMemory ?? 8) <= 2
|| (navigator.hardwareConcurrency ?? 8) <= 4
|| matchMedia('(prefers-reduced-motion: reduce)').matches
```

When LEDM is on:

- All transitions/animations off (duration `0ms`), no skeleton shimmer.
- Shadows, blur, and `backdrop-filter` off.
- Images: `loading="lazy"`, lower-resolution source, no hero image at all.
- Lists over 50 items are paginated/windowed, never fully rendered.
- Streaming AI responses are buffered and painted at most every 120 ms.
- Decorative SVG is hidden. Icon-only buttons keep `aria-label`.

LEDM is a **token + class swap** (`<html class="ledm">`), never an `if` scattered through components.

### 4.6 Layout & interaction rules

- Single column on mobile; two-column (nav + content) from `lg`.
- Primary action is visually dominant and appears **before** secondary/destructive actions in DOM order.
- Destructive actions require confirmation and use `--c-danger`; never label them "OK".
- Loading states: inline text ("Saving…"), not a spinner replacing the page. No layout jump.
- Empty states explain what to do next and include the action.
- Forms: validate on blur, not on every keystroke; show errors next to the field with `aria-describedby`
  and `aria-invalid="true"`; preserve user input on error.
- Feedback messages appear in an `aria-live="polite"` region. Errors in `aria-live="assertive"`.

### 4.7 Chrome — navbar, scrollbars, selection

Required by the Quality Bar; these are the rules that keep it cheap and accessible.

**App header / navbar**

- `position: sticky; top: 0` — **not** `fixed`. Sticky keeps the document flow intact (no spacer hacks, no
  jump when it appears) and is cheaper to composite.
- Height lives in a token: `--nav-h: 56px` (`--nav-h: 48px` under LEDM). Nothing hardcodes 56.
- **Anchor offset:** every in-page target (`h2[id]`, `section[id]`, `.anchor-target`) gets
  `scroll-margin-top: calc(var(--nav-h) + var(--sp-4))`. Without it, every jump hides the heading behind the bar.
- **Active-section highlighting:** exactly **one** `IntersectionObserver` observing section headings, updating
  an `aria-current="true"` link. No `scroll` listeners, no `getBoundingClientRect()` in a scroll loop.
- The bar itself must survive 320 px: collapse to a menu button with a proper `<button aria-expanded>` and a
  keyboard-trapped panel — or simply drop secondary links below `sm`. Never let it overlap content.
- Under LEDM/reduced-motion the bar does not animate in or change opacity on scroll.

**Scrollbars** (styled from the palette, never hidden)

```css
html {
  scrollbar-color: var(--c-scroll-thumb) var(--c-scroll-track); /* Firefox */
  scrollbar-width: thin;
}
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: var(--c-scroll-track); }
::-webkit-scrollbar-thumb {
  background: var(--c-scroll-thumb);
  border: 3px solid var(--c-scroll-track);   /* makes the thumb a rounded pill */
  border-radius: var(--radius-pill);
}
::-webkit-scrollbar-thumb:hover { background: var(--c-scroll-thumb-hover); }
```

- Thumb ≥ **3:1** against its track (verified in §4.1). Hover is a one-step change, not a new hue.
- **Never** `scrollbar-width: none`, never hide the scrollbar to "look clean" — it removes a scroll affordance.
- Style the document scrollbar only. Do **not** create fake inner scroll containers to "have nicer bars";
  they trap keyboard focus and hurt touch scrolling.

**Selection, caret, focus**

```css
::selection { background: var(--c-accent-tint); color: var(--c-text); }
```

- Caret colour via `caret-color: var(--c-accent-strong)` on inputs — never left as browser default.
- `scroll-behavior: smooth` on `html` is allowed **only** inside a `@media (prefers-reduced-motion: no-preference)`
  block, and only for in-page anchors. No scroll-jacking, no parallax, no hijacked wheel events.
- `<meta name="theme-color">` and `manifest.theme_color` use `--c-ink` (light) / `--c-bg` (dark).

---

## 5. Accessibility — Definition of "done"

Target: **WCAG 2.1 AA on every text and control pair** (the Quality Bar floor), with **AAA for body text**.
Ratios are computed, not judged (§4.1). Every item below is checked per component and recorded in the task's
notes in `PROGRESS.md`; an untested item is an unfinished item.

- [ ] Keyboard: every action reachable via Tab, in logical order; no keyboard traps.
- [ ] Focus: `:focus-visible` ring using `--c-focus`, 2 px offset, never removed (`outline: none` alone is banned).
- [ ] Semantics: correct landmark roles, one `h1`, `button` for actions, `a` for navigation.
- [ ] Labels: all inputs labelled; icon buttons have `aria-label`.
- [ ] Contrast: verified by computation (see §4.1), not intuition.
- [ ] Motion: honours `prefers-reduced-motion`.
- [ ] Zoom: usable at 200 % zoom and at 320 px width.
- [ ] Dynamic updates: announced via `aria-live` without stealing focus.
- [ ] Screen-reader sanity pass on the flow you touched (VoiceOver/TalkBack if available, else DOM-order reasoning).
- [ ] Language: `<html lang>` correct; Hindi strings marked `lang="hi"` where mixed.

---

## 6. Performance Budget — enforced

Measured **unminified, uncompressed** (there is no build step) unless stated. These are ceilings, not goals.

| Budget | Ceiling | Check |
| --- | --- | --- |
| **Initial page weight (first view, all HTML+CSS+JS+images, excl. user content)** | **200 KB — hard ceiling; target 150 KB** | DevTools → Network, "Disable cache", sum of transfer size |
| `index.html` | 14 KB | `wc -c` |
| All CSS on first load | 45 KB (≈ 9 KB gzip) | `wc -c src/css/**/*.css` |
| JS on first load (before interaction) | 40 KB (≈ 10 KB gzip) | sum of module sizes in the boot graph |
| Any single JS file | 20 KB / 300 lines | review |
| Any single raster image | 40 KB | review |
| Total shipped assets (whole repo, excl. curriculum JSON) | 500 KB | `du -sh` |
| DOM nodes per page | < 1 500 | DevTools |
| Third-party requests | **0** | Network panel |
| Cacheable, versioned asset URLs | required once a service worker lands | review |

The 200 KB first-view figure (Quality Bar) and the 500 KB repository figure measure different things: the first
is what a student downloads to open a page, the second is everything shipped over the life of the site. The
per-file ceilings are stricter than both and must not be relaxed to "fit" under either.

**Reference device for smoothness:** **2 threads · 2.2 GHz · 10 GB RAM** (plus the Moto G-class profile below).
If a feature janks there, **simplify the feature** — do not raise the budget, and do not blame the device.
Never assume a GPU: no filters, no `backdrop-filter`, no large blur, no WebGL.

Runtime targets (Moto G-class, 4× CPU throttle, Slow 4G):

- First Contentful Paint ≤ 1.5 s · Time to Interactive ≤ 3.5 s · CLS ≤ 0.05 · Long tasks ≤ 50 ms.
- Lighthouse mobile: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95.
- Interactions respond within 100 ms; anything longer shows immediate inline feedback.
- No layout thrash: batch DOM reads then writes; no `getBoundingClientRect()` inside a loop that mutates.
- Below-the-fold sections load lazily (`loading="lazy"`, `content-visibility: auto` where safe, or explicit
  render-on-approach) — never eagerly build the whole page.
- System fonts only, always: a single `@font-face` is a budget violation (§4.2).

**If a change breaks a budget, the change is wrong** — not the budget. Shrink it or cut the feature.

---

## 7. Security — BYOK (Bring Your Own Key)

The user's API keys are the single most sensitive thing this app touches. Treat mishandling as a **P0 bug**.

### 7.1 Absolute rules

1. **Never** transmit a key anywhere except the exact third-party origin the user configured for it.
   No proxy, no "relay", no analytics endpoint, no error reporter.
2. **Never** put a key in: `console.*`, an error message, a stack trace, a URL/query/hash, `document.title`,
   a `Referer`-leaking navigation, a DOM attribute, a screenshot-visible field by default, or an export file.
3. **Never** store a key in plaintext in `localStorage`, `sessionStorage`, IndexedDB, or a cookie.
4. **Never** commit a key, `.env` file, or fixture containing one. `.gitignore` must cover `.env*`, `*.key`,
   `secrets*`.
5. **Never** accept a key from a URL parameter. Keys are typed by the user, in the UI, masked.
6. **Never** log request bodies containing keys. Log request *metadata* only (provider, model, status, latency).
7. **Always** redact before display: `maskSecret('sk-live-…9f2a')` shows at most the first 3 and last 4 characters.
8. **Always** offer a one-click "Delete all keys" that overwrites then removes the records.

### 7.2 Storage tiers (implemented by `BYOKManager`)

| Tier | Default? | Behaviour |
| --- | --- | --- |
| **Memory only** | **Yes, default** | Key lives in a module-scoped variable for the tab's lifetime. Cleared on `pagehide` and on tab close. Nothing written to disk. |
| **Encrypted at rest** | Opt-in | User must set a passphrase (≥ 12 chars). Key encrypted with **AES-GCM 256**, key derived with **PBKDF2-SHA-256, ≥ 600 000 iterations, 16-byte random salt**, stored in **IndexedDB** as `{ id, provider, iv, ciphertext, kdf, iterations, salt, createdAt }`. Plaintext never touches storage. |
| **Session convenience** | Opt-in | Unlock once per session; keep the *derived* key in memory only. Lock on idle (15 min) or on tab hide. |

Rules for the encrypted tier:

- Unlock failures are rate-limited (exponential delay); **3 consecutive failures wipe the stored record**
  and require re-entry.
- Decrypt failures must fail *closed* — never fall back to a plaintext path.
- Changing the passphrase re-encrypts every record atomically (write new, verify, delete old).
- Document in the UI, in plain language, that local encryption protects against casual access to the browser
  profile, **not** against malware or a compromised device.

### 7.3 The real threat: XSS

A key in memory is only as safe as the page. Therefore:

- No `innerHTML` with interpolated data (see §3.3). All dynamic text goes through `textContent`.
- If a rich-text/markdown renderer is built, it must be **allowlist-based**: parse to an AST, emit nodes via
  `createElement`. No HTML passthrough, no `data:` URLs, no `javascript:` URLs, no raw `<a href>` without a
  scheme check.
- All URLs from data are validated: allow only `https:` (and `mailto:` where intended).
- Never trust AI/tutor output as HTML. It is text.
- `<meta http-equiv="Content-Security-Policy">` ships in every page:
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self';
  connect-src 'self' <explicit provider origins>; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`.
  Provider origins are curated in `src/js/core/config.js → PROVIDER_ORIGINS` and must be kept in sync with
  the CSP — adding a provider means editing both, in the same commit.
- `rel="noopener noreferrer"` on every external link; external links open in a new tab with a visible cue.

### 7.4 Privacy rules

- No cookies. No fingerprinting. No `localStorage` identifier shared across purposes.
- Store only what a feature needs; no "just in case" fields (no email, phone, school name, photo).
- Ship an in-app **Data & Privacy** panel: what is stored, where, how to export it, how to erase it.
- "Erase everything" must delete all namespaced storage keys and IndexedDB databases, verify deletion, and
  reload. It must not require a network call.

---

## 8. Data & Storage Rules

- **Namespaced keys.** Every `localStorage` key starts with `cz:v1:`. Version bumps live in
  `config.js → STORAGE_VERSION` and go through a migration function. Never read a key you did not write.
- **Ownership:** only `StorageManager` touches Web Storage / IndexedDB. No other module may call
  `localStorage.setItem` directly. This is testable and non-negotiable.
- **Size discipline:** `localStorage` is for small, hot JSON (< 16 KB total per key). Anything larger, binary,
  or growing (notes bodies, generated question banks, cached lesson content) goes to IndexedDB.
- **Always handle quota/errors.** `QuotaExceededError` → surface an actionable message ("Free up space by
  removing cached lessons"), never silent failure. Private-mode Safari throws on write — the app must still work
  read-only in memory.
- **Writes are debounced** (250 ms) and flushed on `pagehide`/`visibilitychange: hidden`.
- **Every schema change** ships with a migration + a note in `PROGRESS.md → Decisions`.
- **Export = plain JSON** the user can read; import validates shape and never trusts the file.
- **Never store secrets** in either store (see §7).

---

## 9. "Do Not Touch" — files agents must not hand-edit

Editing these by hand causes silent drift and lost work. Change the **source** and regenerate, or don't touch.

| Path | Reason | Do this instead |
| --- | --- | --- |
| `dist/`, `build/`, `out/` | Generated output (if a build is ever introduced) | Edit `src/` and rebuild |
| `*.min.js`, `*.min.css`, `*.map` | Tool output | Edit the unminified source |
| `assets/icons/sprite.svg` | Generated from `assets/icons/src/*.svg` | Add/edit the individual SVG, then run the sprite script |
| `CACHE_MANIFEST.json` | Generated by the asset-list script | Re-run the script |
| `service-worker.js` block marked `// === GENERATED: VERSION ===` | Injected at release | Bump the version in `config.js` |
| `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` | Package-manager owned | Change `package.json` and reinstall |
| `.env`, `.env.*`, any file containing credentials | Secrets | Never. Not even to "test". |
| `src/data/curriculum/**` | Authored content with its own schema + review | Agent edits only when explicitly instructed; content changes are not refactors |
| `AGENTS.md` | The contract | Propose changes to the human; never weaken a rule unilaterally |
| `LICENSE`, `CODE_OF_CONDUCT.md` | Legal/community | Human only |

Also never touch: `.git/`, `node_modules/` (do not commit it), and never `git push --force` to `main`.

---

## 10. Git & Commit Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`.
  Example: `feat(quiz): grade single-choice answers with explanations`.
- One logical change per commit. Do not mix `style:` reformatting with `feat:` logic.
- Never commit: `node_modules/`, editor folders, OS cruft (`.DS_Store`, `Thumbs.db`), build output,
  secrets, screenshots > 200 KB.
- Commit messages say **why**, in the body, when the change is not obvious.
- Work on the assigned branch. No force-pushes to shared branches. No rewriting history that others may have.
- If you touch behaviour, update `PROGRESS.md` **in the same commit**.

---

## 11. Agent Protocol — how to work here

### 11.1 Before you code

1. Run the **Workflow Protocol** at the top of this file. For anything bigger than a trivial tweak that means:
   post the plan, then **wait** for `Approved`. Step 2 does not begin without it.
2. Read `AGENTS.md` (this file), then `ARCHITECTURE.md`, then `PROGRESS.md`.
3. Pick work **only** from `PROGRESS.md → Current Tasks`, or from an explicit human instruction. Do not invent
   features or expand scope.
4. Confirm the module you're touching is in the allowed dependency direction (`ARCHITECTURE.md §5`).
5. If the task is ambiguous, ask **one** well-formed question with options instead of guessing — or fold the
   questions into the plan (Workflow Protocol, Step 1).

### 11.2 While you code

- Small, reviewable increments. Prefer 3 small commits to 1 large one.
- No new files without a purpose stated in the commit body.
- No new dependencies (see §2.3). No build step. The site must run by opening `index.html` from a static server.
- Write the accessible version first; enhancement layers second.
- Keep a manual QA pass in mind: does it work at 320 px, at 200 % zoom, with keyboard only, with JS-level
  errors surfaced (it must fail loudly in dev, gracefully in prod)?

### 11.3 When you finish

1. Update `PROGRESS.md`: move the task, tick acceptance criteria, log decisions, add bugs found.
2. Run the pre-flight checklist:

```bash
# size budget
wc -c index.html src/css/*.css src/js/**/*.js 2>/dev/null | tail -1
# no forbidden secrets/patterns
grep -rn "sk-[A-Za-z0-9]" --include="*.js" --include="*.html" . | grep -v node_modules
grep -rn "innerHTML\|document.write\|eval(" --include="*.js" src/ || echo "clean"
grep -rn "console.log" --include="*.js" src/ || echo "clean"
# no absolute-root asset paths (breaks GitHub Pages project sites)
grep -rn 'src="/\|href="/' --include="*.html" . || echo "clean"
# quality bar: no placeholders, no dead links
grep -rniE "TODO|FIXME|XXX|lorem ipsum|coming soon" --include="*.js" --include="*.html" --include="*.css" src/ || echo "clean"
grep -rn 'href="#"' --include="*.html" . || echo "clean"
# quality bar: no default gray, no raw colours outside tokens.css
grep -rniE "#(ccc|ddd|eee|fff|000|808080)|\bgray\b|\bgrey\b|\bsilver\b" --include="*.css" src/ | grep -v "tokens.css" || echo "clean"
```

3. State clearly what changed, what was verified manually, and what remains.
4. Never claim a feature "works" if you have not exercised it in a browser. Say "implemented, not yet verified"
   when that is the truth.

### 11.4 Definition of Done (all must hold)

- [ ] A plan was posted and **approved** before implementation — or the change qualified as trivial under the
      Workflow Protocol's Exception Rule.
- [ ] Behaviour matches the task's acceptance criteria in `PROGRESS.md`.
- [ ] **Quality Bar met:** real seeded content, all four states forced and checked (loading / empty / error /
      success), zero `TODO`/`FIXME`, zero dead buttons, zero "coming soon".
- [ ] **Lists** have search/filter/sort where relevant; **every delete** has a working Undo toast; **every
      mutation** is optimistic and rolls back visibly on failure.
- [ ] **Every BYOK feature** verified on all three paths: no key, invalid key, valid key.
- [ ] **Visual identity** holds: no default gray, palette tokens only, custom scrollbars/selection/caret in both
      themes, sticky navbar with offset anchors and active-section highlighting (§4.1, §4.7).
- [ ] **Weight:** first view under 200 KB excluding user content; below-the-fold content lazy-loaded.
- [ ] Works at 320 px → 1280 px, keyboard-only, 200 % zoom.
- [ ] Contrast and focus states verified (§4.1, §5).
- [ ] No new dependencies; no build step introduced.
- [ ] Size budgets respected (§6).
- [ ] No secrets, no `console.log`, no `innerHTML` with dynamic data, no inline handlers.
- [ ] `localStorage`/IndexedDB access only via `StorageManager`; keys namespaced and versioned.
- [ ] Failure paths handled: offline, quota exceeded, bad JSON, provider 401/429/5xx, aborted request.
- [ ] `PROGRESS.md` updated; commit message follows Conventional Commits.
- [ ] Manual verification noted, including what was *not* verified.

---

## 12. Escalation — when to stop and ask

Stop and ask the human if a task would require:

- introducing a framework, build step, dependency, or server;
- storing data outside the browser or phoning home;
- storing or transmitting a secret in a way not covered by §7;
- breaking a performance budget, a WCAG rule, or a "Do Not Touch" entry;
- deleting user data or changing a storage schema without a migration;
- changing this document.

Also stop mid-build if the approved plan turns out to be wrong in a way the Deviation Rule lists
(Workflow Protocol, Step 2.4) — re-plan instead of improvising.

Otherwise: proceed, keep it small, keep it fast, keep it accessible, and log what you did.
