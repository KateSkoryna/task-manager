---
name: verify
description: Build/launch/drive recipe for verifying changes to this repo at runtime (frontend SPA + NestJS backend + Firebase Auth emulator).
---

# Verifying `todo-list` at runtime

This is an Nx monorepo: `apps/todo` (React SPA, webpack dev server) +
`apps/todo-be` (NestJS API) + Firebase Auth/Storage emulator + MongoDB
Atlas (`todo_dev`, dev database — not prod; safe to use per `.env`).
There is no SSR — `apps/todo` is client-rendered only.

## Start the stack

```bash
npm run emulator > /tmp/verify-emulator.log 2>&1 &   # Firebase Auth :9099, UI :4000
npm run serve:be  > /tmp/verify-backend.log 2>&1 &    # NestJS API :3333
npm run serve:fe  > /tmp/verify-frontend.log 2>&1 &   # React dev server :4200
```

Backend takes a few seconds to connect to Mongo and print
`Nest application successfully started`. Frontend takes ~10-15s to
webpack-compile (`No errors found.`). `.env` already points
`MONGODB_URI` at the `todo_dev` Atlas database — no local Docker Mongo
needed unless working fully offline (`npm run docker:mongodb`, then swap
the commented `MONGODB_URI` line in `.env`).

## Reach an authenticated screen

The app requires Firebase auth for every route except `/login`,
`/register`, `/forgot-password`. If no session exists, register a
throwaway account through the "Create One" link on `/login`, or use the
emulated Google sign-in dialog — both work against the emulator with no
real email/Google account. View/remove emulator users at
`http://localhost:4000/auth`.

## Drive it

Use `claude-in-chrome` MCP tools (`tabs_context_mcp` →
`navigate`/`computer`/`javascript_tool`). Useful checks:

- Theme: `document.documentElement.getAttribute('data-theme')` and
  `localStorage.getItem('todo-theme')` (`light`/`dark`) via
  `javascript_tool` — faster than screenshotting to confirm state.
- Settings → Appearance section is at `/settings`, above the rest of
  the preferences form.
- Language switch persists via i18next's own localStorage key
  (`i18nextLng`), independent of `todo-theme`.

## Gotchas

- **Segmented control click coordinates**: button label text changes
  with the active language (e.g. "Light"/"Dark" vs "Hell"/"Dunkel"),
  which shifts button widths/positions. Re-screenshot before clicking
  by coordinate after a language change — don't reuse coordinates from
  an earlier screenshot in a different language.
- Backend `npm run serve:be` and frontend `npm run serve:fe` each
  report "completed" almost immediately in a backgrounded bash call
  even though the server itself keeps running — that's the shell
  backgrounding, not the server exiting. Check the log file's actual
  content (e.g. `Nest application successfully started`, `No errors
  found.`) rather than trusting the background-task completion status.
