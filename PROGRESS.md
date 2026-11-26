# PROGRESS.md — The Logbook

> Single source of truth for **what is done, what is in flight, and what is next.**
> Updated at the end of every session, in the same commit as the work (`AGENTS.md §6`).

| Field | Value |
| --- | --- |
| Project | **VidyaSetu** — free, unlimited-forever online classes for Indian students |
| Audience | Class 9, NCERT — Mathematics, Science, Social Science, English, Hindi |
| Branch | `arena/183a925b-psychic-fishstick` |
| Current session | **Session 0 — Project initialization** |
| Application code | **None yet** (Phase 2 not approved) |
| Last updated | 2026-11-26 |

---

## 1. Completed

**None.** Project initialization only: the three protocol documents exist and the repository is otherwise empty.

| ID | Item | Status |
| --- | --- | --- |
| S0-1 | `AGENTS.md` — constraints, quality bar, visual identity, workflow, self-testing, session hygiene, modular rules, do-not-touch, security, DoD | ✅ |
| S0-2 | `ARCHITECTURE.md` — structure with one-sentence file purposes, data flow, service/module contracts, storage schema, "no server routes" | ✅ |
| S0-3 | `PROGRESS.md` — this file | ✅ |
| S0-4 | Phase 2 implementation plan | ⏸ awaiting `Approved. Execute Phase 2.` |

There are **zero user-facing features**: nothing renders, nothing stores, nothing calls the network.

---

## 2. Current — Session 0

Session 0's single task is foundation. It is complete except for the approval gate:

- Documentation written to match the VidyaSetu constraints (C1–C6 in `AGENTS.md §1`).
- Structure fixed: `index.html` + `/styles` + `/modules` + `/services` + `/data` + `/assets`, relative paths,
  no build step.
- Palette defined and verified by computation (ink-indigo / saffron / chalk / cool slate + 4 semantic hues,
  8 total) with AA-or-better on every text pair; saffron fills carry a `--saffron-700` border because saffron
  alone is only 2.0:1 against chalk.
- Phase 2 plan produced and **waiting for the word "Approved"**. No application code will be written before it.

---

## 3. Next — Session 1

**Session 1 = Lesson viewer + notes feature.** Preconditions: Phase 2 shipped and committed.

Scope sketch (to be planned properly in Session 1, not now):

1. `data/lessons/index.json` + one real Class 9 lesson (content authored, not generated).
2. Lesson viewer module: read a lesson, navigate between chapters, remember last position.
3. Notes: create/edit/delete per lesson, persisted through a new `noteService` + existing `storageService`,
   with undo on delete and optimistic writes.
4. Wire the subject grid through to lessons (no dead tiles).

---

## 4. Known bugs

**None.** No application code exists.

---

## 5. Phase 2 board *(planned — blocked on approval)*

Reference only; the authoritative plan is the one posted in the session, not this table.

| ID | Item | Depends | Notes |
| --- | --- | --- | --- |
| P2-1 | `data/subjects.json` — 5 real NCERT Class 9 subjects | — | Believable copy, real lesson counts, no lorem ipsum. |
| P2-2 | `styles/tokens.css` → `scrollbar.css` | — | Palette + type scale + spacing; reset; layout; components; all four states. |
| P2-3 | `modules/toast.js`, `services/storageService.js` | — | Foundation others depend on. |
| P2-4 | `services/byokService.js` | P2-3 | Key CRUD, masking, provider registry, test call, typed errors, redaction. |
| P2-5 | `modules/settings.js` — BYOK dialog | P2-4 | Three key paths + undo on removal. |
| P2-6 | `modules/nav.js`, `modules/subjects.js` | P2-2 | Fixed nav, mobile menu, active section, live search. |
| P2-7 | `index.html` — full page | all above | Nav, hero, subjects, how-it-works/BYOK, footer. |
| P2-8 | Self-test pass + docs + commit | all | `AGENTS.md §5.1`, then `git add -A && git commit`. |

---

## 6. Decisions

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| D-01 | 2026-11-26 | Name: **VidyaSetu** (विद्यासेतु — "bridge of knowledge") | Given by the owner; replaces the earlier "ClassZero" placeholder. |
| D-02 | 2026-11-26 | Flat top-level folders (`/styles`, `/modules`, `/services`, `/data`, `/assets`) instead of `src/` | Matches the modular rule set; no build step means no source/output split to justify. |
| D-03 | 2026-11-26 | BYOK keys in `localStorage` (`vs:v1:byok`), as specified in C2 | Simplest path for a student, no passphrase to forget. Residual risk accepted and mitigated by XSS controls: strict CSP, no third-party scripts, no `innerHTML` with data, keys masked everywhere (`AGENTS.md §9`). |
| D-04 | 2026-11-26 | Fixed navbar (`position: fixed`) + `padding-top` on body + `scroll-padding-top` | Explicitly requested; the two offsets are what keep anchors and content from hiding behind the bar. |
| D-05 | 2026-11-26 | Palette is 8 hues with cool neutrals and multi-hue gradients allowed | Requested identity: ink-indigo dominant, saffron accent, chalk surfaces, cool slate neutrals; gradients indigo→plum and saffron→terracotta only. |
| D-06 | 2026-11-26 | Live search is client-side filtering of already-loaded `subjects.json` | Zero network per keystroke; 5 items today, room for dozens later. |
| D-07 | 2026-11-26 | No service worker in Phase 2 | Caching a BYOK app before its storage layer settles creates a second source of truth. Revisit in a later session. |

---

## 7. How to update this file

1. Pick work from §2/§5 or from my explicit instruction — nothing else.
2. On completion: move the row to §1, mark ✅, and record **how it was verified** (browser, widths, what was
   exercised twice) — "implemented, not verified" stays pending.
3. Log every non-obvious choice as a new `D-xx` row: what, why, what was rejected.
4. Log every bug found in §4, including ones fixed in the same session, with severity (P0–P3).
5. Append a dated line under the session heading when the session closes; never rewrite history.
6. Keep §3 honest: if Session 1's scope changes, say so here before building it.

This section is part of the protected protocol (`AGENTS.md §8`) — do not restructure it without approval.
