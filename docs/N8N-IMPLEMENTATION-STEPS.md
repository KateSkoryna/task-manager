# Telegram Agent — Implementation Steps

> **Purpose:** an execution document. [`N8N-AGENT-PLAN.md`](./N8N-AGENT-PLAN.md) says _what_ the agent is and _why_; this file says exactly _what to type_. Each numbered phase below is one self-contained unit of work, sized for a single session.
>
> **How to run one:** `implement-step` with `N8N-IMPLEMENTATION-STEPS.md phase <N>`, or `/loop` over the phases in order. Do not start a phase until the one before it is merged.
>
> **Numbering:** phases here are **steps**, not the phases in `N8N-AGENT-PLAN.md`. The mapping is in the table below. When this file says "agent-plan Phase 2", it means that other document.

## Rules that apply to every phase

These are not suggestions. A phase is not complete until all of them hold.

1. **Never commit, push, merge, or deploy.** Leave changes in the working tree for review. Do not run `git commit` even if the work looks finished.
2. **Never connect to the production database.** `MONGODB_URI` in `.env` points at `todo_dev`. Do not change it, and do not construct a production URI from it.
3. **Run `npx prettier --write <files>`** on every file created or edited, before finishing.
4. **Run these before declaring done**, and fix anything they report:
   ```bash
   npx nx run-many -t lint test --projects=todo-be,types
   npx tsc -p apps/todo/tsconfig.app.json --noEmit
   ```
   Frontend phases additionally need `npx nx test todo`.
5. **Add no npm dependencies.** Everything needed is installed. If a phase seems to need one, stop and say so instead.
6. **Shared contracts live in `libs/types`** and are imported through `@shared/types`. Never define the same shape twice.
7. **Never hand-roll timezone logic.** Use the helpers in `libs/types/src/lib/datetime.ts`. `new Date()` on the server is UTC and is wrong for every user.
8. **Only Tailwind theme tokens** for colour (`text-accent`, `bg-dark-bg`, …). Introduce no new colours.
9. **Every user-visible string** goes in `apps/todo/src/app/i18n/locales/{en,de,uk}.json`. No hardcoded copy in components.
10. **Tests are part of the work**, not a follow-up. A phase with new behaviour and no test is incomplete.
11. **Never log** raw task text, model output, tokens, secrets, or signatures.
12. If a phase's instructions conflict with the codebase as you find it, **stop and report** rather than improvising.

## Conventions to copy

| Need                | Copy the pattern from                               |
| ------------------- | --------------------------------------------------- |
| Controller + guards | `apps/todo-be/src/user/user.controller.ts`          |
| Module wiring       | `apps/todo-be/src/user/user.module.ts`              |
| Service + errors    | `apps/todo-be/src/todo/todo.service.ts`             |
| Mongoose model      | `apps/todo-be/src/app/models/todo.model.ts`         |
| Zod shared schema   | `libs/types/src/lib/user-preferences.schemas.ts`    |
| Backend API test    | `apps/todo-be/src/app/integrations/api.spec.ts`     |
| Shared schema test  | `apps/todo-be/src/app/shared-agent-schemas.spec.ts` |
| Frontend fetcher    | `apps/todo/src/app/fetchers/todolist.ts`            |
| Frontend hook       | `apps/todo/src/app/hooks/useTodoListsData.ts`       |

`executeOperation` from `apps/todo-be/src/common/utils/execute-operation.ts` wraps every service method that touches the database. `CurrentUser` supplies the authenticated user; never trust a `userId` from the URL without the guard.

## Step-to-plan mapping

| Step | Covers                      | Agent-plan phase | Status          |
| ---- | --------------------------- | ---------------- | --------------- |
| 1    | User model fields           | Phase 1          | Done 2026-08-20 |
| 2    | Session and report models   | Phase 1          | Done 2026-08-20 |
| 3    | Preferences API             | Phase 2          | Done 2026-08-21 |
| 4    | Preferences data layer      | Phase 2          | Done 2026-08-21 |
| 5    | Settings page UI            | Phase 2          | Not started     |
| 6    | Raw body and service config | Phase 3          | Not started     |
| 7    | HMAC guard                  | Phase 3          | Not started     |
| 8    | Integrations module         | Phase 3          | Not started     |
| 9    | Link code model and service | Phase 4          | Not started     |
| 10   | Link endpoints              | Phase 4          | Not started     |
| 11   | Telegram linking UI         | Phase 4          | Not started     |

**Agent-plan Phase 1 is complete.** Steps 3–11 are gated on nothing external. Agent-plan Phase 5 onward needs a Cloudflare domain, which is not yet bought.

## Already done — do not redo

Merged or committed on `task/n8n-phase-1-data-model`:

- `libs/types/src/lib/datetime.ts` — timezone helpers, DST-tested.
- `libs/types/src/lib/user-preferences.schemas.ts`, `agent.schemas.ts`, `report.schemas.ts` — shared contracts, exported from `libs/types/src/index.ts`.
- `todo.types.ts` / `todo.schemas.ts` — `priority` and `source` added. `source` is deliberately absent from both input schemas; it is set server-side.
- `todo.model.ts` — `priority`, `source`, `embedding` (`select: false`), `embeddingUpdatedAt`, and indexes on `{userId, todolistId}`, `{userId, dueDate}`, `{todolistId}`.
- `user.service.ts` — statistics now match `userId` directly instead of joining through `todolists`, so inbox todos are counted.
- `apps/todo-be/src/migrations/001-agent-fields.ts` — backfills `userId`, `priority`, `source`, and user preferences. Idempotent, supports `--dry-run`.
- `todolist.service.ts` — deleting a list reparents its todos to the inbox.
- `user.model.ts` — `preferences` subdocument holding **all six** preference fields, `telegram` subdocument, and a unique partial index on `telegram.chatId`. `toJSON` emits `telegramLinked` and never the chat id.
- `agent-session.model.ts` — TTL index on `expiresAt`, unique `{userId, chatId}`, `version` field for optimistic concurrency.
- `report.model.ts` — unique `{userId, period, periodStart}` and a `{userId, periodStart: -1}` index for the list page.

**Deviation from the agent plan, deliberate.** That plan puts `timezone` and `locale` at the top level of `User` with a separate `preferences` subdocument. They are instead all six inside `preferences`, so `userPreferencesSchema.parse(user.preferences)` works directly and there is one place a timezone can live rather than two that can disagree. Treat `preferences` as the only source.

**Note on the chat id index.** It uses `partialFilterExpression`, not `sparse` — MongoDB rejects combining the two, and the partial filter is the stronger guarantee because it also tolerates an explicit `null`.

---

## Phase 1 — User model fields

> **Done 2026-08-20.** Kept for reference; do not re-run.

**Goal:** `User` documents carry timezone, locale, preferences, and Telegram linkage, with defaults that leave existing users working unchanged.

**Files:**

- `apps/todo-be/src/app/models/user.model.ts` — modify.
- `libs/types/src/lib/auth.types.ts` — extend the `User` interface.
- `apps/todo-be/src/app/models/user.model.spec.ts` — create if absent, otherwise extend.

**Do exactly this:**

1. Add to `userSchema`:
   - `timezone`: `String`, default `'UTC'`.
   - `locale`: `String`, enum from `SUPPORTED_LOCALES`, default `'en'`.
   - `preferences`: a subdocument with `reportCadence` (enum `REPORT_CADENCES`, default `'off'`), `deliveryHour` (`Number`, default `9`), `tone` (enum `REPORT_TONES`, default `'neutral'`), `aiConsent` (`Boolean`, default `false`). Import the constants from `@shared/types`; do not retype the string unions.
   - `telegram`: a subdocument with `chatId` (`String`, sparse unique index), `linkedAt` (`Date`), `username` (`String`). The whole subdocument is optional and absent until linking happens.
2. Add a sparse unique index on `telegram.chatId` so one chat cannot bind to two accounts, and so unlinked users do not collide on `null`.
3. Extend the `User` interface in `auth.types.ts` with `timezone`, `locale`, and `preferences`. **Do not** expose `telegram.chatId` on the `User` type returned to the browser — add only a boolean `telegramLinked` derived in `toJSON`.
4. Update the `toJSON` transform to emit the new fields, defaulting each one so documents written before this change still serialise.

**Acceptance checks:**

- A user created without any of the new fields loads and serialises with defaults.
- `toJSON` output contains `telegramLinked` and does **not** contain a chat id.
- Two users cannot share a `telegram.chatId`; a test asserts the duplicate-key error.
- Many users with no `telegram` subdocument coexist — proving the index is sparse.
- `userPreferencesSchema.parse()` accepts the stored `preferences` shape unchanged.

**Do not:** add preference fields to the registration payload, or make any new field required.

---

## Phase 2 — Session and report models

> **Done 2026-08-20.** Kept for reference; do not re-run.

**Goal:** `AgentSession` and `Report` collections exist with the indexes that make later phases correct rather than merely working.

**Files:**

- `apps/todo-be/src/app/models/agent-session.model.ts` — create.
- `apps/todo-be/src/app/models/report.model.ts` — create.
- `apps/todo-be/src/app/models/agent-session.model.spec.ts` — create.
- `apps/todo-be/src/app/models/report.model.spec.ts` — create.

**Do exactly this:**

1. `AgentSession`: `userId` (ObjectId, ref `User`, required), `chatId` (String, required), `turns` (array matching `agentTurnSchema`), `pendingClarifications` (array matching `pendingClarificationSchema`), `lastTaskIds` (array of ObjectId), `expiresAt` (Date, required), `version` (Number, default 0).
2. Give `expiresAt` a TTL index: `agentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`. MongoDB deletes the document once `expiresAt` passes.
3. Add a unique index on `{ userId, chatId }` — one live session per chat per user.
4. `Report`: `userId` (ObjectId, ref `User`, required), `period` (enum `REPORT_PERIODS`), `periodStart` (Date), `periodEnd` (Date), `metrics` (subdocument matching `reportMetricsSchema`), `narrative` (String), `deliveredAt` (Date, nullable, default null).
5. Add a **unique compound index** on `{ userId, period, periodStart }`. This is the only thing preventing duplicate report delivery, so it must exist at the database level and not merely be checked in code.
6. Both models follow the `models[NAME] || model(...)` pattern used by every existing model, or they break under Jest's module reloading.

**Acceptance checks:**

- The TTL index exists on `expiresAt` with `expireAfterSeconds: 0`, asserted by reading `collection.indexes()`.
- Inserting two reports with the same `userId`, `period`, and `periodStart` throws a duplicate-key error (code `11000`).
- Inserting two sessions with the same `userId` and `chatId` throws.
- A session document round-trips through `agentSessionSchema` without loss.

**Do not:** implement session read/write logic, expiry sweeping, or any controller. This phase is models and indexes only.

---

## Phase 3 — Preferences API

> **Done 2026-08-21.** Merged in PR #20 from `add-user-preferences-api`.

**Goal:** `GET` and `PATCH /api/users/:userId/preferences` work, are user-isolated, and validate through the shared schema.

**Files:**

- `apps/todo-be/src/user/user-preferences.controller.ts` — create.
- `apps/todo-be/src/user/user-preferences.service.ts` — create.
- `apps/todo-be/src/user/user.module.ts` — register both, and add the `User` model to `MongooseModule.forFeature`.
- `apps/todo-be/src/app/integrations/api.spec.ts` — extend.

**Do exactly this:**

1. Controller at `@Controller('users/:userId/preferences')`, guarded by `FirebaseAuthGuard`, with `@ApiTags('preferences')` and `@ApiBearerAuth()` to match the existing controllers.
2. `GET` returns the user's preferences, filling defaults for any field absent from the document. Use `userPreferencesSchema.parse()` so defaults come from one place.
3. `PATCH` validates the body with `userPreferencesUpdateSchema`. An empty body is a `400`. Merge into the stored subdocument; never replace it wholesale.
4. Resolve the acting user from `@CurrentUser()`, not from the `:userId` path parameter. The guard already rejects a mismatch — do not add a second check that could disagree with it.
5. Validate `timezone` server-side with `isValidTimezone` from `@shared/types`.

**Acceptance checks:**

- `GET` on a user with no stored preferences returns the full default set.
- `PATCH { "timezone": "Europe/Berlin" }` persists and is visible on the next `GET`.
- `PATCH { "timezone": "Europe/Atlantis" }` returns `400`.
- `PATCH {}` returns `400`.
- `PATCH { "deliveryHour": 25 }` returns `400`.
- User A cannot read or write user B's preferences — `403`, asserted by a test.
- Setting one field leaves the others untouched.

**Do not:** build any UI in this phase.

---

## Phase 4 — Preferences data layer

> **Done 2026-08-21.** The hook tests mock the preferences fetchers instead of using MSW because MSW 2.15's ESM-only dependency chain is incompatible with this project's CommonJS Jest pipeline. Initial loading, successful updates, optimistic updates, and rollback after a rejected request are covered without changing the project-wide Jest transform configuration.

**Goal:** the frontend can read and write preferences through React Query, with optimistic update and rollback.

**Files:**

- `apps/todo/src/app/fetchers/preferences.ts` — create.
- `apps/todo/src/app/hooks/usePreferences.ts` — create.
- `apps/todo/src/app/hooks/usePreferences.spec.ts` — create.

**Do exactly this:**

1. Fetchers `getPreferences` and `updatePreferences`, using the existing Axios client from `apps/todo/src/app/fetchers/api.tsx`. Type both from `@shared/types`; declare no local interfaces.
2. A `usePreferences` hook exposing the query and a mutation. On mutate, apply the change optimistically; on error, roll back to the previous cache value; on settle, invalidate.
3. Test with MSW, following the existing hook tests. Cover: initial load, successful update, and a failed update that rolls back.

**Acceptance checks:**

- A failed `PATCH` restores the previous values in the cache, asserted by a test.
- The query key is stable and shared between hook and fetcher.
- No `any`.

**Do not:** render anything.

---

## Phase 5 — Settings page UI

**Goal:** `SettingsPage.tsx` stops being a placeholder and lets a user set every preference, in three languages.

**Files:**

- `apps/todo/src/app/component/pages/SettingsPage.tsx` — replace the placeholder.
- `apps/todo/src/app/component/settings/PreferencesForm.tsx` — create.
- `apps/todo/src/app/component/settings/` — further small components as needed.
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json` — add strings.
- `apps/todo/src/app/component/pages/SettingsPage.spec.tsx` — create.

**Do exactly this:**

1. `react-hook-form` with `zodResolver(userPreferencesUpdateSchema)`, matching `TodoForm.tsx`.
2. Timezone: default to `detectTimezone()` on first visit when the user has none stored, and let it be overridden. Present a searchable list, not a free-text box.
3. Report cadence: `daily | weekly | monthly | off`. When `off`, disable the delivery-hour control — the setting is meaningless without a cadence.
4. Delivery hour: 0–23, labelled in the user's own locale.
5. Tone: `neutral | encouraging | direct`.
6. AI consent: a checkbox, off by default, with copy stating plainly what leaves the app and where it goes. This is a consent gate, not a feature toggle — do not pre-tick it.
7. Loading, empty, error, and saving states consistent with the existing pages. Reuse the skeleton convention.

**Acceptance checks:**

- Every visible string resolves in `en`, `de`, and `uk`; no literal copy in any component.
- Keyboard-only users can reach and change every control.
- Saving shows feedback; a failed save shows an error and keeps the entered values.
- Cadence `off` disables the hour control.
- Only theme tokens are used; `git diff tailwind.config.js` is empty.
- Component tests cover load, edit, save, and error.

---

## Phase 6 — Raw body and service configuration

**Goal:** the backend can verify a signature over the exact bytes it received.

**Files:**

- `apps/todo-be/src/main.ts` — modify.
- `apps/todo-be/src/common/config/service-auth.config.ts` — create.
- `.env.example` — create if absent, and document every variable the app reads.

**Do exactly this:**

1. Configure the Nest application to retain the raw request body for `/api/integrations/*` only. Under Express this means a `verify` callback on the JSON body parser that stashes the buffer on the request.
2. A config module exposing `N8N_SHARED_SECRET`, the replay window in seconds (default `300`), and the throttle limit for integration routes. Fail fast at startup if the secret is missing **while** integration routes are enabled.
3. `.env.example` lists every variable with placeholder values and no real secrets.

**Acceptance checks:**

- A request to `/api/integrations/*` exposes the raw body buffer; a request elsewhere does not.
- Existing routes still parse JSON normally — the full existing suite passes.
- Startup fails with a clear message when the secret is absent.

**Do not:** implement the guard here.

---

## Phase 7 — HMAC guard

**Goal:** `/api/integrations/*` accepts only correctly signed, recent, non-replayed requests. **This is the security boundary of the entire feature.**

**Files:**

- `apps/todo-be/src/integrations/service-auth.guard.ts` — create.
- `apps/todo-be/src/integrations/service-auth.guard.spec.ts` — create.
- `apps/todo-be/src/integrations/nonce-cache.ts` — create.

**Do exactly this:**

1. Expect three headers: signature, timestamp, and nonce. Compute HMAC-SHA256 over `timestamp + '.' + rawBody` using the shared secret.
2. Compare with `crypto.timingSafeEqual`, never `===` or `==`. Compare buffers of equal length; length-check first and reject early if they differ.
3. Reject a timestamp outside the replay window.
4. Reject a nonce already seen inside the window. An in-memory `Map` with periodic eviction is sufficient for one instance; note in a comment that a shared store is required if the backend is ever scaled beyond one process.
5. Every failure returns `401` with an identical body. Do not reveal which check failed.
6. Log rejections without the signature, secret, or body.

**Acceptance checks — each is a separate test:**

- Valid signature → passes.
- Wrong signature → `401`.
- Body altered by one byte after signing → `401`.
- Timestamp older than the window → `401`.
- Timestamp in the future beyond tolerance → `401`.
- Same nonce twice → second is `401`.
- Missing any of the three headers → `401`.
- All five failure bodies are byte-identical.

**Do not:** use `===` for comparison, and do not skip the tampered-body case — it is the one that catches signing a re-serialised object instead of raw bytes.

---

## Phase 8 — Integrations module

**Goal:** the guard is wired to a real route, with its own throttle bucket.

**Files:**

- `apps/todo-be/src/integrations/integrations.module.ts` — create.
- `apps/todo-be/src/integrations/service-auth.module.ts` — create.
- `apps/todo-be/src/integrations/health.controller.ts` — create, a signed no-op for verification.
- `apps/todo-be/src/app.module.ts` — register.

**Do exactly this:**

1. A dedicated throttle bucket for integration routes, separate from the auth and default buckets already configured.
2. A single guarded `POST /api/integrations/ping` returning `{ ok: true }`, so the whole path is provable end to end before any real endpoint exists.
3. Note that `apps/todo-be/src/app/integrations/` already exists and holds **tests**. The new source directory is `apps/todo-be/src/integrations/`. Do not merge them; if the similarity is confusing, say so rather than renaming anything.

**Acceptance checks:**

- A correctly signed `POST /api/integrations/ping` returns `200`.
- An unsigned one returns `401`.
- Exceeding the integration throttle returns `429` without affecting the login throttle.
- The full existing suite still passes.

---

## Phase 9 — Link code model and service

**Goal:** single-use, expiring, hashed codes that bind a Telegram chat to an account.

**Files:**

- `apps/todo-be/src/app/models/telegram-link-code.model.ts` — create.
- `apps/todo-be/src/integrations/telegram/telegram-link.service.ts` — create.
- `apps/todo-be/src/integrations/telegram/telegram-link.service.spec.ts` — create.

**Do exactly this:**

1. Model: `codeHash` (String, required, unique), `userId` (ObjectId, required), `expiresAt` (Date, TTL index), `usedAt` (Date, nullable, default null).
2. Store only a hash — SHA-256 of the code. The plaintext is returned to the caller once and never persisted.
3. Codes are at least 8 characters from a set excluding visually ambiguous glyphs (`0`/`O`, `1`/`l`/`I`), generated with `crypto.randomBytes`, never `Math.random`.
4. Expiry is 10 minutes.
5. Redemption is atomic: a single `findOneAndUpdate` matching `usedAt: null` and an unexpired `expiresAt`, setting `usedAt`. Two simultaneous redemptions must not both succeed.

**Acceptance checks:**

- The stored document never contains the plaintext code.
- A code works once; the second attempt fails.
- An expired code fails.
- Two concurrent redemptions of the same code yield exactly one success.
- Linking a chat already bound to a different account fails with a distinct, non-enumerating error.

---

## Phase 10 — Link endpoints

**Goal:** a signed-in user can generate a code and unlink; n8n can redeem a code and resolve a chat.

**Files:**

- `apps/todo-be/src/integrations/telegram/telegram-link.controller.ts` — create, Firebase-guarded.
- `apps/todo-be/src/integrations/telegram/telegram-resolve.controller.ts` — create, service-guarded.
- `apps/todo-be/src/integrations/integrations.module.ts` — register.
- `apps/todo-be/src/app/integrations/api.spec.ts` — extend.

**Do exactly this:**

1. Firebase-guarded: `POST /api/users/:userId/telegram/link-code` returns a fresh code; `DELETE /api/users/:userId/telegram/link` unlinks.
2. Service-guarded: `POST /api/integrations/telegram/link` redeems a code for a `chatId`; `GET /api/integrations/telegram/resolve` maps a `chatId` to a `userId`.
3. **The resolve endpoint must never accept a `userId` from the caller.** It derives the user from the linked `chatId` alone. This is the rule that keeps a compromised n8n from impersonating any account.
4. An unknown `chatId` returns `404` with no partial write.
5. Apply throttling tight enough that code guessing is impractical, and test it.

**Acceptance checks:**

- Generate → redeem → resolve returns the right user.
- Redeeming twice fails the second time.
- Resolving an unlinked chat returns `404`.
- Unlinking makes a previously working resolve return `404`.
- A brute-force loop hits the throttle.
- No endpoint trusts a caller-supplied `userId`.

---

## Phase 11 — Telegram linking UI

**Goal:** a user can link and unlink Telegram from Settings without leaving the page.

**Files:**

- `apps/todo/src/app/component/settings/TelegramLinkSection.tsx` — create.
- `apps/todo/src/app/component/pages/SettingsPage.tsx` — mount it.
- `apps/todo/src/app/fetchers/telegram.ts` — create.
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json` — add strings.
- `apps/todo/src/app/component/settings/TelegramLinkSection.spec.tsx` — create.

**Do exactly this:**

1. Unlinked state: a button generating a code, the code shown with a copy control, a visible countdown to expiry, and the exact instruction to send `/start <code>` to the bot.
2. Linked state: show that it is linked and when, plus an unlink control. Never display the chat id.
3. After expiry, the code is visibly dead and a new one can be generated.
4. Unlinking asks for confirmation, since it silently stops all bot delivery.

**Acceptance checks:**

- Both states render correctly and are keyboard-accessible.
- The countdown reaches zero and the UI updates without a reload.
- All strings exist in three locales.
- No chat id appears in the DOM.
- Tests cover unlinked, code-generated, expired, and linked.

---

## When the domain is bought

Steps 1–11 need nothing external. Agent-plan Phase 5 (n8n infrastructure) is blocked on B4 in [`PLAN.md`](./PLAN.md), and adds two constraints this document will inherit:

- The todo agent's n8n is a **second, separate stack** on a port other than 5678. An unrelated n8n with 7 live workflows and 9 credentials already runs there and must not be touched.
- Postgres from the first run, and an explicit `N8N_ENCRYPTION_KEY` backed up before the first start.
