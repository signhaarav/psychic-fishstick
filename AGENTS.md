# AGENTS.md — The VidyaSetu Rulebook

> **Read this file, then `ARCHITECTURE.md`, then `PROGRESS.md` — in that order, before touching anything.**
> VidyaSetu is a free, unlimited-forever online class platform for Indian students. Class 9 NCERT first
> (Mathematics, Science, Social Science, English, Hindi). It must run on a 2-thread 2.2 GHz CPU with 10 GB RAM
> and be flawless at **375 px**.
>
> Every rule below is a hard constraint. If a task needs one broken, stop and ask. Never invent scope.

---

## 1. Constraints — non-negotiable

| # | Rule |
| --- | --- |
| **C1** | **Pure HTML5 + CSS3 + vanilla ES6+ JavaScript.** No framework, no bundler, no build step, no backend, no paid service. `$0` to build and `$0` to use, forever. |
| **C2** | **All external APIs are BYOK.** The user pastes their own key. Keys live only in the user's browser (`localStorage`), are **masked** in the UI, **never logged**, **never sent anywhere except the chosen provider**, and are **removable** by the user at any time. |
| **C3** | **All user data → `localStorage` / IndexedDB. All content → static JSON files.** No database, no server-side anything. |
| **C4** | **Static hosting (GitHub Pages compatible): relative paths only.** `./styles/base.css`, never `/styles/base.css`. |
| **C5** | **Performance budget: < 200 KB initial page weight.** System font stack only (no `@font-face`, ever). CSS-only animations on `transform` / `opacity`. `prefers-reduced-motion` respected. Below-the-fold content lazy-loaded. |
| **C6** | **WCAG AA contrast, full keyboard navigation, visible focus states, semantic HTML.** |

Consequences you must not talk yourself out of: no `npm install`, no `package.json` build scripts, no CDN
libraries, no Google Fonts, no analytics, no cookies, no service worker until a later session says so.
The site must run by serving the folder with `python3 -m http.server`.

---

## 2. Quality Bar — production-grade, never demo-grade

**Every feature ships complete.** No placeholders, no "phase 2", no half-states.

- **Real seeded content.** The app looks finished on first load: real subject copy, real lesson counts, real
  descriptions. Lorem ipsum, "Coming soon", `0 items` and empty grids are **not** acceptable seed data.
- **All states handled:** **loading**, **empty**, **error**, **success**. Each one is built, styled, and
  reachable. An empty-state that says nothing and an error that crashes the page are bugs.
- **Zero TODOs, zero dead buttons.** No `TODO`/`FIXME` in shipped code. A control that is visible, focusable and
  does nothing — or does something other than its label — is a **P1 bug**, not a placeholder.
- **Lists get live search / filter / sort where relevant.** Typing filters as you type (no submit button), and
  the result count is announced politely to screen readers.
- **Undo after destructive actions.** Deleting a key or a note shows a toast with a working **Undo** for 5 s
  before the deletion is final.
- **Optimistic UI updates.** The UI changes immediately; if persistence fails, it **rolls back** and says so.
  A UI that silently disagrees with storage is a P1 bug.
- **Every BYOK feature works in three paths:**
  1. **No key** → friendly setup prompt that opens Settings. Never a crash, never a wall.
  2. **Invalid key** → clear, specific error ("Groq rejected this key — check it in Settings"), no crash, no
     data loss, and the key stays editable.
  3. **Valid key** → the full feature works.

If you would not show it to a student, it is not done.

---

## 3. Visual Identity

Subject-derived, not a template. **Ink and chalk, with saffron for what matters.**

All values live in **`styles/tokens.css`** — the single source of truth. Every colour in the site is a token;
a raw hex outside `tokens.css` is a review failure. Contrast ratios below were **computed** (WCAG 2.1 relative
luminance). Re-verify with a script if you change a value; never eyeball.

### 3.1 Palette — eight hues

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `--surface-0` | `#FCFAF5` | Chalk-white page surface (warm) | — |
| `--surface-1` | `#F5F1E8` | Cards, panels, inset blocks | — |
| `--surface-2` | `#EFEADF` | Code blocks, wells, scrollbar track | — |
| `--ink-900` | `#0E1433` | Body text **and** the dominant dark surface | **17.3:1** on surface-0 |
| `--ink-800` | `#17204A` | Navbar/footer/hero band | chalk on it **15.0:1** |
| `--ink-700` | `#2A2E6E` | Mid indigo: gradients, hover bands | chalk on it **11.7:1** |
| `--plum-600` | `#6D3A7A` | Gradient terminal hue (genuinely different hue) | chalk on it **7.9:1** |
| `--text-muted` | `#4A5474` | Secondary text, captions, metadata (cool neutral) | **7.2:1** |
| `--text-subtle` | `#6B7590` | Icons, dividers-with-text, meta only — **not body copy** | **4.4:1** |
| `--border` | `#CBD3E3` | Hairlines — decorative only | not a text/UI pair |
| `--border-strong` | `#76809A` | Input borders, control outlines | **3.8:1** |
| `--saffron` | `#F0A22E` | **Primary CTA fill** — ink text on it **8.5:1** | boundary only **2.0:1** → see 3.2 |
| `--saffron-600` | `#C97F14` | Gradient stop, hover fill (ink text **5.6:1**) | — |
| `--saffron-700` | `#8F5400` | Accent **text**, links, saffron border | **5.9:1** |
| `--success` | `#1E6B45` | Saved, correct, confirmed | **6.2:1** (white on it 6.5:1) |
| `--warning` | `#8A5300` | Cautions, quota, offline | **6.1:1** |
| `--danger` | `#A3231F` | Errors, destructive actions | **7.2:1** (white on it 7.5:1) |
| `--info` | `#1E5A8A` | Neutral notices, tips | **7.0:1** (chalk on it 7.0:1) |
| `--focus` | `#2B3A8F` | Focus ring | **9.6:1** on surface · **4.7:1** on saffron |
| `--scroll-thumb` | `#6B7590` | Scrollbar thumb (hover `--text-muted`) | **3.8:1** vs track |
| `--scroll-track` | `#EFEADF` | Scrollbar track | — |

**Dark theme** (`<html data-theme="dark">`, respects `prefers-color-scheme`): surfaces `#131A38` / `#1B2347`,
text `#F5F1E8` (15.1:1), muted `#B9C0D6` (9.4:1), border-strong `#7C87A8` (4.8:1), saffron unchanged
(8.0:1), success `#7ED0A3`, warning `#F5C56B`, danger `#FF9E93`, info `#8FB3E0`, focus `#F0A22E`, scroll thumb
`#7C87A8` (4.8:1). Components never hardcode theme colours — token swap only.

### 3.2 Colour rules

- **No default gray anywhere:** no `#808080`, `#ccc`, `#ddd`, `#eee`, no browser-default borders, scrollbars,
  carets or selection. Every neutral is either warm (chalk) or cool (indigo-slate).
- **Saffron fills need a 1 px `--saffron-700` border** — saffron alone is 2.0:1 against chalk, and the border is
  what makes the button boundary legible. Ink text inside, never white.
- **Gradients across genuinely different hues only** — indigo→plum for dark bands, saffron→terracotta for
  accents. Never indigo→lighter-indigo. Text on a gradient must clear 4.5:1 at its **lightest** stop; chalk
  text is only allowed on the indigo/plum family. Gradients are decorative: if one is removed, nothing breaks.
- **Never encode meaning in colour alone.** Correct/incorrect also carries an icon and a word.
- AA (4.5:1) is the floor for every text/control pair; body text targets 7:1. Non-text boundaries and focus
  rings: 3:1.

### 3.3 Chrome

- **Fixed navbar** (`position: fixed; inset-block-start: 0`), height in `--nav-h` (`56px`, `48px` under LEDM).
  `body` gets `padding-block-start: var(--nav-h)` and `html` gets `scroll-padding-top: var(--nav-h)` so **anchor
  jumps are never hidden behind the bar**. Never hardcode 56 anywhere else.
- **Active-section state:** exactly **one** `IntersectionObserver` over sections, toggling `aria-current="true"`
  on the matching nav link. No `scroll` listeners, no `getBoundingClientRect()` in a loop.
- **Mobile menu** (≤ 640 px): a real `<button aria-expanded aria-controls>`; panel is keyboard-trapped, closes on
  Esc and on link activation, and returns focus to the button.
- **Custom scrollbars from the palette:** `scrollbar-color` + `scrollbar-width: thin` for standards browsers,
  `::-webkit-scrollbar*` for Chromium/Safari. Never hide the scrollbar. Style the document scrollbar only —
  no fake inner scroll containers.
- **Staged entrance animations:** CSS only, `transform`/`opacity` only. ≤ 300 ms per element, stagger ≤ 60 ms,
  and everything is **instantly complete** under `prefers-reduced-motion: reduce` or LEDM. Content must be
  readable before the animation runs (no opacity-0 content that only appears via JS).
- Focus ring: 2 px `--focus` with 2 px offset; never `outline: none` without a replacement.

---

## 4. Workflow — Plan First, Code Second

**Any non-trivial feature follows this loop. No exceptions beyond a trivial tweak.**

### Step 1 — Architect mode (read-only)

1. **READ** `ARCHITECTURE.md` (current structure) and `PROGRESS.md` (current state, conflicts).
2. **OUTPUT** a plan containing, at minimum:
   - **Files to create / edit** — exact paths, and which function in each.
   - **Data flow** — what is written to `localStorage`/IndexedDB, under which key, and what re-renders.
   - **Security check** — how BYOK keys are handled (or "no key, no network").
3. **WRITE NO CODE.** Wait for the words **"Approved"** (or "Approved, execute …").

Read-only means read-only: no file creation, no edits, no installs while planning.

### Step 2 — Execute

- "Approved" → build exactly the approved plan, in the stated order.
- "Approved with changes" → restate the changes in ≤ 5 lines, then build.
- Rejected or questioned → revise the plan. Do not partially build the parts that "seemed fine".
- If the plan turns out to be wrong mid-build (new file, new storage key, new network origin), **stop and
  re-plan**. Do not improvise architecture.

### Trivial exemption

Single-file tweaks that change no JavaScript behaviour, no storage key, no network call and no new file — e.g.
a copy fix, a token value, a spacing tweak — may be done directly. Still record them in `PROGRESS.md`.
Anything touching keys, storage, `fetch`, or creating a file is never trivial.

---

## 5. Self-Testing Protocol

**There is no build command. Nothing compiles, nothing type-checks, nothing tests for you.** Verification is
manual and it is your job.

### 5.1 The procedure (every session, every feature)

```bash
python3 -m http.server 8000     # from the repo root; open http://localhost:8000
```

Then, in the browser:

1. **Zero console errors and zero warnings.** Open DevTools first, then reload.
2. **Zero 404s** in the Network panel (catches relative-path mistakes that only show on GitHub Pages).
3. **Exercise the edited flow twice.** Click through it, then do it again from the start. The second pass is
   what catches duplicate event listeners, double-mounted components and state corruption.
4. **Check 375 px and 1280 px.** No horizontal scroll, no overlap, no clipped text, no unreachable control.
   Also check 200 % zoom and keyboard-only (Tab through everything; focus always visible).
5. **Reload to confirm persistence.** Anything saved must survive F5; anything deleted must stay deleted.
6. **BYOK three paths** (if the feature touches keys): no key → friendly prompt; invalid key → clear error, no
   crash; valid key → works.
7. **Reduced motion:** enable it (DevTools → Rendering) and confirm the UI is fully usable with animation off.

### 5.2 Honesty clause

**Never claim a check you did not perform.** Say "verified in Chrome, 375 px and 1280 px, console clean" or say
"not yet verified". "Should work" is not verification. If you could not test something (no key available, no
Safari), state exactly that and why.

### 5.3 Rubber Duck rule

On **any** bug report — mine, yours, or one you notice:

1. **Edit nothing yet.** Trace the root cause: which file, which line, which assumption.
2. **Explain it in plain language** — the cause, not the symptom. "The listener is registered in a module
   re-imported on every render, so it stacks" beats "the button fires twice".
3. Propose the **minimal fix** and wait for approval.
4. Fix exactly that. Then re-run §5.1.
5. **Never log API keys**, not during debugging, not temporarily, not in a comment. Redact as `sk-…9f2a`.
6. **Remove debug logs after the fix.** No stray `console.log` ships.

---

## 6. Session Hygiene

- **One feature per chat.** Do not bundle unrelated work; if I ask for two things, do one and say so.
- **Start by reading** `AGENTS.md`, `ARCHITECTURE.md`, `PROGRESS.md` — in that order.
- **End by updating** `PROGRESS.md` (status, decisions, bugs) **and** `ARCHITECTURE.md` (structure/data flow, if
  anything changed), then:

```bash
git add -A && git commit -m "feat: <summary>"
```

- Commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `chore:`. One logical change each.
- Never commit `node_modules/`, OS cruft, or anything containing a real key.
- Work only on the current branch. No force-push.

---

## 7. Modular Rules

| Rule | Detail |
| --- | --- |
| **200 lines max per file** | HTML, CSS and JS alike. If a file passes 200 lines, split it by responsibility — not by arbitrary chunks. |
| **`/styles` = all CSS** | `tokens.css`, `base.css`, `layout.css`, `components.css`, `scrollbar.css`. No `<style>` blocks, no inline `style=""` attributes. |
| **`/modules` = UI behaviour + logic** | Anything that reacts to the user or shapes the view. **No `fetch`, no storage access** in this folder. |
| **`/services` = ALL storage and API calls** | `storageService.js`, `byokService.js`. The only place `localStorage`, `IndexedDB` or `fetch` may appear. |
| **`/data` = static JSON** | Content only. Never generated at runtime, never written to. |
| **HTML = structure only** | Semantics and landmarks. No behaviour beyond `<script type="module">` tags and `data-*` hooks. |
| **No inline handlers** | `onclick=""` is banned. `addEventListener` in a module, always. |
| **No global variables** | ES modules with `import`/`export`. Nothing on `window` except an opt-in debug handle behind `?debug=1`. |
| **No `innerHTML` with dynamic data** | `textContent` / `createElement` / `<template>` only. This is an XSS rule, and XSS is how API keys get stolen. |
| **No `eval`, no `new Function`, no `document.write`** | Ever. |

Import direction is one-way: `services` → (nothing) · `modules` → `services` · `index.html` → `modules`.
A cycle, or a module calling `fetch`, is a design bug.

---

## 8. Do Not Touch

These require my **explicit approval** before any change:

- **`styles/tokens.css` values** — colours, type scale, spacing, radii, shadows, z-index. Add new tokens only
  with a stated reason; never re-tune an existing value "to look better".
- **The protocol sections of the three `.md` files:** this file's §4 (Workflow), §5 (Self-Testing), §6 (Session
  Hygiene), §8 (Do Not Touch); `ARCHITECTURE.md` §7 (no server routes); `PROGRESS.md` §7 (update protocol).

Never touch `.git/`. Never edit `PROGRESS.md` history retroactively — append and correct, don't rewrite.

---

## 9. Security — how the BYOK rule is enforced

Keys are stored in `localStorage` (constraint C2). That means **any script running on this origin can read
them** — so the real defence is preventing script injection, not hiding the string.

- **Storage:** one namespaced record, `vs:v1:byok`, written **only** by `byokService.js`. Shape:
  `{ [providerId]: { key, addedAt } }`. No key in any other key, no key in `sessionStorage`, no cookies.
- **Display:** always masked — `sk-…9f2a` (first 3, last 4). The raw value never enters the DOM after entry:
  no `value`, no `title`, no `data-*`, no `aria-label`.
- **Transport:** in the `Authorization` / `x-api-key` **header only**, to the provider's own origin, over HTTPS.
  Never in a URL, query string, hash, or referrer.
- **Logging:** never. Not `console.*`, not a toast, not an error message, not a comment, not a stack trace.
  `byokService` redacts before any error surfaces.
- **Errors:** typify them — `no-key`, `invalid-key`, `rate-limited`, `network`, `provider-down` — and map each to
  a human sentence. Never echo the provider's raw body if it might contain the key.
- **CSP** in every page: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  connect-src 'self' <explicit provider origins>; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`.
  Adding a provider means editing the CSP **and** the allowlist in `byokService.js` in the same commit.
- **Removal:** "Remove key" deletes the record, verifies it is gone, and offers Undo for 5 s. "Remove all" does
  the same for every provider. Both work offline.
- **Export/import** (later) must strip keys entirely.
- **No third-party scripts, fonts, analytics or embeds.** Every one is an XSS surface pointed at the keys.

---

## 10. Definition of Done

- [ ] Approved plan executed; nothing outside its scope changed.
- [ ] Real content, all four states, no TODOs, no dead buttons.
- [ ] Search/filter/sort where relevant; undo on destructive actions; optimistic updates that roll back.
- [ ] BYOK: all three paths exercised.
- [ ] Palette tokens only; no default gray; scrollbars/selection/caret styled; gradients across real hues.
- [ ] `< 200 KB` initial weight; lazy below-the-fold; system fonts; CSS-only, transform/opacity animation;
      reduced-motion honoured.
- [ ] 375 px and 1280 px clean; keyboard-only pass; focus visible; AA everywhere.
- [ ] Zero console errors, zero 404s, flow exercised twice, persistence confirmed by reload.
- [ ] No file over 200 lines; no `fetch`/storage outside `/services`; no inline handlers/styles; no globals.
- [ ] `PROGRESS.md` (and `ARCHITECTURE.md` if structure moved) updated; commit made.
