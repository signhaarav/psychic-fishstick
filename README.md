# VidyaSetu

Free, unlimited-forever online classes for Indian students. Starting point: **Class 9, NCERT**
(Mathematics, Science, Social Science, English, Hindi).

No sign-up. No ads. No trackers. No server. Runs on a cheap phone.

## Status

Session 0 — foundation only. The three protocol documents exist; application code starts in Phase 2.

## Run it

```bash
python3 -m http.server 8000
# http://localhost:8000
```

No install, no build step. Any static host works (GitHub Pages included, relative paths only).

## Read first

| File | What it is |
| --- | --- |
| `AGENTS.md` | The rulebook — constraints, quality bar, workflow, testing protocol, module rules |
| `ARCHITECTURE.md` | The map — file purposes, data flow, storage schema, no-server-routes policy |
| `PROGRESS.md` | The logbook — what is done, what is next, decisions, bugs |

## Principles

- Pure HTML, CSS and vanilla ES modules. No framework, no bundler, no backend, no paid service — $0 forever.
- AI features are BYOK: you bring your own key, it stays in your browser, and you can remove it any time.
- All user data lives in `localStorage`. All content is static JSON.
- Under 200 KB on first load, system fonts, WCAG AA, keyboard-first.
