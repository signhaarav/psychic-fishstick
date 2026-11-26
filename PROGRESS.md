# PROGRESS.md — The Logbook

> Single source of truth for **what is done, what is being done, and what is next.**
> Every agent updates this file in the same commit as its work. A task is never "done" here until its
> acceptance criteria are ticked and its manual verification is recorded.
>
> Read order: `AGENTS.md` → `ARCHITECTURE.md` → this file.

| Field | Value |
| --- | --- |
| Project | **ClassZero** — Free & Unlimited Online Class Platform (codename; see `config.js → APP_NAME`) |
| Branch | `arena/183a925b-psychic-fishstick` |
| Phase | **Phase 0 — Foundation** (docs only, no application code) |
| Status | 🟢 Docs complete · ⚪ No code yet |
| Last updated | 2026-11-26 |
| Updated by | Agent (project initialization) |
| App code exists? | **No** — nothing under `/src` yet, by instruction |

---

## 1. Status Legend

| Symbol | Meaning |
| --- | --- |
| ✅ | Done and manually verified |
| 🟡 | Implemented, not yet verified |
| 🔵 | In progress |
| ⚪ | Not started / queued |
| 🔴 | Blocked (see §7) |

---

## 2. Completed Features

**None — Project Initialization only.**

| ID | Item | Date | Notes |
| --- | --- | --- | --- |
| P-000 | Repository initialized (empty) | 2026-11-26 | Base commit `f21d75c`, branch `arena/183a925b-psychic-fishstick` |
| P-001 | `AGENTS.md` — rulebook written ✅ | 2026-11-26 | Tech bans, coding style, design tokens with computed contrast ratios, LEDM, perf budget, BYOK security, Do-Not-Touch list, agent protocol |
| P-002 | `ARCHITECTURE.md` — map written ✅ | 2026-11-26 | Folder structure, layered runtime, module contracts, data-flow diagrams, storage schema, "no server routes" section, provider registry, content schema |
| P-003 | `PROGRESS.md` — logbook written ✅ | 2026-11-26 | This file |

There are **zero user-facing features**. Nothing renders. Nothing is stored. Nothing calls a network.
No application code has been written, on purpose — the foundation comes first.

---

## 3. Current Tasks

Work these **in order**. Do not start #2 before #1 passes its acceptance criteria.

### T-001 — Basic HTML shell 🔵 *(next up)*

> **Gate:** this is a non-trivial feature. Per the **Workflow Protocol** (`AGENTS.md`), post the Step 1 plan
> (files to create/edit, data flow, security check, perf/a11y impact, acceptance criteria, execution steps) and
> wait for `Approved`. No file is created before that.

Create the single-page application shell that every later task builds on.

**Deliverables**
- `index.html` at the repository root.
- `src/css/reset.css`, `src/css/tokens.css` (all tokens from `AGENTS.md §4.1–4.3`, both themes), `src/css/base.css`, `src/css/layout.css`, `src/css/utilities.css`.
- `src/js/main.js` as an ES module: boots, applies theme/LEDM class, mounts the home view, logs at `debug` level only.
- `src/js/core/config.js` with `APP_NAME`, `STORAGE_VERSION = 1`, `PROVIDER_ORIGINS` (may be empty initially).
- `src/js/ui/UIRenderer.js` with `el()`, `mount()`, `setText()`, `showToast()`.
- `404.html` stub.

**Acceptance criteria**
- [ ] Valid HTML5; `<html lang="en">`, charset, viewport (`width=device-width, initial-scale=1, viewport-fit=cover`) present.
- [ ] Landmarks: `header` > `nav`, `main`, `footer`. Exactly one `h1`.
- [ ] Skip-to-content link is the first focusable element and becomes visible on focus.
- [ ] Loads with **zero** console errors/warnings; no 404s in the Network panel.
- [ ] All asset paths **relative** (`./src/css/...`) — verify by serving the repo from a sub-path, not just root.
- [ ] CSP meta tag present per `AGENTS.md §7.3` (`connect-src 'self'` for now).
- [ ] Works at 320 px, 360 px, 768 px, 1280 px with no horizontal scroll at 200 % zoom.
- [ ] Keyboard-only navigation reaches every control; focus ring visible via `--c-focus`.
- [ ] Light + dark theme via `prefers-color-scheme`; no flash of wrong theme.
- [ ] `index.html` ≤ 14 KB; total CSS ≤ 45 KB (check with `wc -c`).
- [ ] No frameworks, no build step, no font files, no external requests.

**Manual verification to record:** browser(s) used, viewport sizes, zoom level, theme states.

---

### T-002 — CSS reset, base styles & app shell polish ⚪

**Deliverables**
- Minimal modern reset: box-sizing, margin trimming, media defaults (`max-width: 100%`, `height: auto`), form control font inheritance, `:focus-visible` defaults, `::selection`.
- `base.css`: typographic scale from `AGENTS.md §4.2`, link styles, headings, lists, blockquote, code, table, form primitives (`input`, `select`, `textarea`, `fieldset`, `label`, error/invalid states).
- `layout.css`: app shell grid (header / main / footer), content container capped at `72rem`, `.u-stack`, `.u-cluster`, `.u-visually-hidden`.
- `components/button.css`: primary / secondary / ghost / danger variants, 44 px minimum target, disabled + loading states.
- `components/field.css`: labelled input with hint + error (`aria-describedby`, `aria-invalid`), password-style masked input with show/hide toggle.
- `components/card.css`, `components/toast.js` + `toast.css` (polite live region).
- LEDM class behaviour: transitions/shadows off when `<html class="ledm">`.

**Acceptance criteria**
- [ ] Every colour, size, radius, shadow in CSS references a token — `grep -rn "#[0-9a-fA-F]\{3,6\}" src/css --include="*.css"` returns hits **only** in `tokens.css`.
- [ ] Buttons and inputs usable at 320 px without truncation; touch targets ≥ 44×44 px.
- [ ] Focus-visible ring on every interactive element, 2 px offset, ≥ 3:1 contrast (verified, not assumed).
- [ ] Form errors announced (`aria-live` / `role="alert"`) and never colour-only.
- [ ] `prefers-reduced-motion: reduce` and LEDM both kill all motion.
- [ ] No `!important` outside the two sanctioned media queries.
- [ ] CSS total ≤ 45 KB raw.
- [ ] **Chrome per Quality Bar / §4.7:** custom scrollbars (track/thumb/hover, ≥ 3:1, never hidden), styled
      `::selection` and caret, sticky navbar with `--nav-h` and `scroll-margin-top` offset anchors, active-section
      highlighting via a single IntersectionObserver.
- [ ] **No default gray** anywhere: warm neutrals from tokens only; audit grep in `AGENTS.md §11.3` returns clean.

---

### T-003 — BYOK key input interface ⚪

First BYOK surface: capture and custody of a provider key, per `AGENTS.md §7`.

**Deliverables**
- `src/js/utils/crypto.js` — PBKDF2-SHA-256 (≥ 600 000 iterations) + AES-GCM-256 helpers over `crypto.subtle`.
- `src/js/modules/BYOKManager.js` — memory-only default tier, optional encrypted-at-rest tier, `mask()`, `listConfigured()`, `removeKey()`, `removeAllKeys()`, lock/unlock.
- `src/js/modules/StorageManager.js` — minimal first version: namespaced `cz:v1:*` reads/writes + IndexedDB `keys` store. **No other module may touch storage.**
- `src/js/ui/components/key-field.js` — masked input, show/hide toggle, paste support, client-side format hint (never blocking validation on length alone), and a plain-language explanation of where the key goes.
- A "API keys" section on `settings.html` (or `index.html#/settings`): provider selector, add key, list of configured providers showing **masked** value + tier + created date, delete, delete-all, and a status line ("Stored in this tab only" / "Encrypted on this device").

**Acceptance criteria**
- [ ] Default tier stores **nothing** on disk: after entering a key, `localStorage` and IndexedDB contain no plaintext (verify in DevTools → Application).
- [ ] Encrypted tier: ciphertext only in IndexedDB `keys`; correct passphrase unlocks; wrong passphrase fails closed and is rate-limited; 3 failures wipe the record.
- [ ] Key never appears in the DOM after entry (no `value`, no `title`, no `data-*`, no attribute) — only the masked form (`abc…9f2a`).
- [ ] Key never appears in `console.*`, in a thrown error message, or in any `fetch` URL.
- [ ] "Delete all keys" removes records from IndexedDB and verifies (re-read returns empty), then announces success via `aria-live`.
- [ ] Explicit, non-alarming copy: the key is sent only to the chosen provider's origin, and local encryption protects against casual access, not malware.
- [ ] Works in Safari private mode (in-memory fallback, no crash, no silent failure).
- [ ] Fully keyboard-operable; password managers can autofill; `autocomplete="off"` + `name` set to avoid heuristic capture.
- [ ] No key handling code outside `BYOKManager` (except `APIHandler` reading via `getKeyForRequest`).
- [ ] **All four states shown, not implied:** no key yet (friendly setup prompt), invalid/blank input (inline
      error, no crash), valid key (configured card with tier + masked hint), error (storage unavailable →
      memory-only notice). Each is forced and checked, per the Quality Bar.

---

## 4. Backlog — sequenced roadmap

Only the *head* of this list is actionable. Later phases stay unstarted until the human says go.

| Phase | ID | Item | Depends on | Notes |
| --- | --- | --- | --- | --- |
| 1 | T-004 | Hash router + view mounting + 404 view | T-001 | `ARCHITECTURE.md §9` |
| 1 | T-005 | `StorageManager` full: migrations, quota handling, export/import, erase-all | T-003 | `§5.1` |
| 1 | T-006 | `SettingsManager`: theme, font scale, LEDM toggle + auto-detect | T-002 | `§5.8` |
| 1 | T-007 | "Data & Privacy" panel: what is stored, export, erase everything | T-005, T-006 | `AGENTS.md §7.4` |
| 2 | T-008 | `ContentRepository` + curriculum JSON schema validation **+ seeded lesson set** | T-005 | `§5.7`, `§12`; seed is a Quality Bar requirement, not a nice-to-have |
| 2 | T-009 | Lesson browser + lesson reader views | T-004, T-008 | Markdown-lite allowlist renderer; needs ≥1 complete seeded lesson to be "done" |
| 2 | T-010 | `ProgressTracker` + resume-where-you-left-off on home | T-005 | `§5.6` |
| 2 | T-011 | `QuizEngine` + practice view with explanations | T-008, T-010 | `§5.4`; pure logic unit-tested |
| 3 | T-012 | `NoteTaker` + notes view, search, undo delete | T-005 | `§5.5` |
| 3 | T-013 | Test harness (`tests/`) + fixtures for pure modules | T-011 | `§13` |
| 3 | T-014 | Offline/PWA: manifest + hand-written service worker | T-009 | `§11`, deferred by design |
| 4 | T-015 | `ProviderRegistry` + `APIHandler` (timeout, cancel, retry, typed errors) | T-003 | `§5.3`, `§7` |
| 4 | T-016 | AI actions UI: "Explain this", "Give a hint", "Quiz me" (fixed actions, not free chat) | T-015, T-011 | `§15` open question 5 recommends this |
| 4 | T-017 | Provider adapters: Google, OpenRouter, Groq, then OpenAI/Anthropic | T-015 | Verify CORS per provider; update CSP |
| 5 | T-018 | Accessibility + LEDM audit pass across all views | all | `AGENTS.md §5` |
| 5 | T-019 | Performance audit against budgets; payload diet | all | `AGENTS.md §6` |
| 5 | T-020 | Hindi/English language layer (`lang="hi"`, copy split) | all | Pending decision §15 |

---

## 5. Known Bugs

**None.** No application code exists yet, so there is nothing to break.

*(Template for future entries — one row per bug, never delete a row, mark it fixed instead.)*

| ID | Severity | Area | Description | Status |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

Severity scale: **P0** data loss / secret exposure · **P1** feature broken · **P2** degraded UX ·
**P3** cosmetic.

---

## 6. Next Steps

1. **Wait for the human's go-ahead to start T-001 (basic HTML shell).**
   No application code is to be written before that instruction.
2. When starting T-001: follow the **Workflow Protocol** in `AGENTS.md` — post the plan first, wait for
   `Approved`, then code. Re-read `AGENTS.md §11.1` (pre-code protocol) and `ARCHITECTURE.md §3–§6`.
3. Answer the open questions below before T-008/T-009 (content) and T-015 (AI) — they change scope.

### Open questions awaiting the human

| # | Question | Blocks | Default if unanswered |
| --- | --- | --- | --- |
| Q1 | Final product name (replacing "ClassZero") | branding polish only | keep codename |
| Q2 | Class 9 Science only, or multiple subjects at launch? | T-008 | Science only |
| Q3 | English only, or English + Hindi? | T-009, T-020 | English only, with `lang` hooks ready |
| Q4 | Who authors the lesson content, against which syllabus (NCERT/CBSE/state)? The Quality Bar requires **real seeded content** at launch (lesson + questions with explanations + sample notes), so "empty until content arrives" is no longer acceptable. | T-008, T-009 | agent-authored sample lesson + quiz + notes, clearly marked as sample |
| Q5 | AI tutor: fixed actions or free-form chat? | T-016 | fixed actions |
| Q6 | Which providers matter most to the target users (free tiers)? | T-017 | Google + Groq + OpenRouter first |

---

## 7. Risks & Blockers

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Providers block browser-origin requests (CORS) | AI features impossible for that provider | Verify CORS before building an adapter; list only verified providers; never build a proxy |
| CSP `connect-src` allowlist drifts from `PROVIDER_ORIGINS` | Broken calls or a wide-open policy | Update both in the same commit; add a test that compares them |
| Aiming at low-end devices late | Perf work becomes a rewrite | Budgets in `AGENTS.md §6` enforced from T-001; test at 320 px and 4× CPU throttle every task |
| `innerHTML` slipping in for convenience | XSS → API key theft (P0) | Grep in the pre-flight checklist; `UIRenderer` offers safe primitives so there is no reason to bypass it |
| localStorage quota in Safari private mode | Crashes or silent data loss | `StorageManager` memory-only fallback + explicit UI notice (T-005) |
| Plaintext keys written "just for testing" | Secret exposure | Memory-only default; pre-commit grep for `sk-`; never enable a plaintext path |
| Scope creep toward "another learning app" | Never ships | T-001→T-003 only; backlog is sequenced; new ideas go to §4, not into the current task |

---

## 8. Decisions Log

| # | Date | Decision | Rationale |
| --- | --- | --- | --- |
| D-001 | 2026-11-26 | No build step; browser-native ES modules | Zero toolchain, zero dependency drift; the repo can be dropped on any static host |
| D-002 | 2026-11-26 | No frameworks, no CSS framework, no web fonts | Payload and target-device constraints (`AGENTS.md §2`) |
| D-003 | 2026-11-26 | Hash routing instead of history API | Static hosts cannot rewrite paths; deep links must survive cold loads |
| D-004 | 2026-11-26 | BYOK default tier = memory only; encryption is opt-in (AES-GCM + PBKDF2) | Never write a plaintext secret by default; "encrypt if possible" without forcing a passphrase on a student |
| D-005 | 2026-11-26 | `StorageManager` is the only module allowed to touch Web Storage/IndexedDB | One place for namespacing, migrations, quota errors, and audits |
| D-006 | 2026-11-26 | `localStorage` for small hot settings; IndexedDB for notes/attempts/keys | Sync boot needs vs. size and growth |
| D-007 | 2026-11-26 | Palette contrast verified by computation (body text ≥ 7:1) | Accessibility claims must be measurable, not aesthetic |
| D-008 | 2026-11-26 | Dark mode and LEDM are token/class swaps on `<html>` | No conditional styling scattered through components |
| D-009 | 2026-11-26 | AI conversations are not persisted by default | Privacy default; saving is an explicit user action |
| D-010 | 2026-11-26 | Offline/PWA deferred to phase 3 | Core flows must be correct before caching adds a second source of truth |
| D-011 | 2026-11-26 | No third-party analytics or telemetry, ever | "Free and private" promise; also removes a request and a tracker |
| D-012 | 2026-11-26 | Adopted the **Workflow Protocol** ("Plan First, Code Second"): plan → human `Approved` → execute, for anything larger than a trivial tweak | Keeps scope, cost, and BYOK handling reviewable *before* code exists; trivial-change exception prevents bureaucracy on one-line fixes |
| D-013 | 2026-11-26 | Adopted the **Quality Bar** (production-grade, never demo-grade): seeded content, all four states, no TODOs/dead buttons, undo deletes, optimistic mutations, three BYOK paths, subject-derived ink-indigo/saffron/chalk palette with no default gray, custom chrome, 200 KB first-view ceiling, AA floor | Supersedes the earlier neutral-blue palette values (D-007 stands: ratios stay computed, not judged). A demo-grade build cannot be retrofitted into a trustworthy study tool, and the palette is the product's identity, not decoration |

---

## 9. Changelog

### 2026-11-26 — Quality Bar added
- Added the **"Production-Grade, Never Demo-Grade"** bar to `AGENTS.md` (second gate at the top): completeness
  (seeded content, four states, zero TODOs/dead buttons, undo deletes, optimistic mutations, three BYOK paths),
  subject-derived visual identity, richness within the LEDM budget, and AA accessibility.
- Palette replaced with the required **ink-indigo / saffron / chalk-white** system in `§4.1`, every pair
  re-verified by computation, including scrollbar thumbs (3.0:1 / 4.0:1 vs track) and the saffron 2.0:1
  boundary problem (solved with a mandatory 1 px `--c-accent-strong` border).
- New `§4.7`: sticky navbar with `--nav-h` + offset anchors + active-section highlighting, palette scrollbars,
  selection/caret, no scroll-jacking.
- `§6`: 200 KB first-view ceiling (target 150 KB), 2-thread/2.2 GHz/10 GB reference device, lazy
  below-the-fold, optional `content-visibility`.
- `§5`, `§11.3` (new placeholder/gray greps), `§11.4` DoD updated to enforce the bar.
- `PROGRESS.md`: D-013, T-002/T-003 criteria, seeded-content notes on T-008/T-009, Q4 tightened, metrics row.
- `ARCHITECTURE.md §3/§8/§12`: seed directory, four-state rendering rule, seeded-content note.
- No application code written; documentation only.

### 2026-11-26 — Workflow Protocol added
- Added the **"Plan First, Code Second"** gate to `AGENTS.md` (unnumbered section at the top of the file,
  labelled **▶ Workflow Protocol**):
  read-only Architect Mode with a required plan format, an explicit approval gate ("Approved" is the only
  trigger; silence is not), an execution + deviation rule, and a strict Exception Rule for trivial changes
  (which still requires a `PROGRESS.md` update).
- Reconciled: §0 now states the gate is not a preference; §11.1 starts with it; §11.4 DoD requires an approved
  plan; §12 escalation covers mid-build plan failure. `ARCHITECTURE.md §14` and `PROGRESS.md §3/§6` point at it.
- No application code written; documentation only.

### 2026-11-26 — Phase 0: documentation foundation
- Added `AGENTS.md`: tech-stack bans, coding style, measured design tokens, breakpoints, LEDM, performance
  budgets, BYOK security rules, Do-Not-Touch list, git conventions, agent protocol, Definition of Done.
- Added `ARCHITECTURE.md`: folder structure, layered runtime, module contracts, data-flow diagrams, persistence
  map, explicit "no server routes" policy, provider registry, content schema, testing approach, extension guides.
- Added `PROGRESS.md` (this file): status, tasks T-001…T-003 with acceptance criteria, backlog T-004…T-020,
  risks, decisions log.
- No application code written.

---

## 10. Metrics Snapshot

Fill after T-001. Numbers from `AGENTS.md §6`, measured unminified on a throttled mobile profile.

| Metric | Budget | Current |
| --- | --- | --- |
| **Initial page weight (first view, excl. user content)** | **< 200 KB (target 150 KB)** | — |
| `index.html` size | ≤ 14 KB | — |
| Total CSS (raw) | ≤ 45 KB | — |
| JS on first load (raw) | ≤ 40 KB | — |
| Third-party requests | 0 | — |
| Lighthouse Perf / A11y / BP / SEO | 90 / 100 / 95 / 95 | — |
| FCP / TTI (Slow 4G, 4× CPU) | ≤ 1.5 s / ≤ 3.5 s | — |
| DOM nodes | < 1 500 | — |

---

## 11. How to Update This File

1. **Pick** a task from §3 only (or a human's explicit instruction).
2. **Move** it: set 🔵 → ✅, tick every acceptance criterion, and write one line of manual verification
   ("Chrome 121 @ 360×640, 200 % zoom, keyboard-only — passed").
3. **Log** any decision with a new `D-0xx` row (what, why, alternatives rejected).
4. **Record** bugs found in §5 — including ones you fixed in the same commit.
5. **Adjust** §4 backlog if scope changed; never silently delete a task, mark it dropped with a reason.
6. **Add** a dated §9 entry describing what changed and what was *not* verified.
7. Keep this file honest. "Implemented, not verified" is 🟡 — never ✅. If it isn't ticked, it isn't done.
