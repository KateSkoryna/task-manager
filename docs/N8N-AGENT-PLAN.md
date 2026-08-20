# Telegram Agent Plan — n8n, Gemini, and Atlas Vector Search

> **Objective:** capture tasks by messaging a Telegram bot in natural language, have them appear in the existing web app, and close each day with a generated report and a fair, non-judgmental analysis of how the day went.
>
> **Strategy:** n8n owns conversation orchestration; NestJS owns all data. Every task write goes through an authenticated API endpoint that reuses the shared Zod schemas and user-isolation guards already in this repository. Numbers are computed deterministically in NestJS and tested; the model only phrases them.

## How to use this plan

- This document is the source of truth for the Telegram agent feature. [`docs/PLAN.md`](./PLAN.md) remains the source of truth for the wider portfolio roadmap.
- **Prerequisites live in [`docs/PLAN.md`](./PLAN.md), in the "Blockers — resolve before Phase 7 and the n8n agent" section.** Accounts, domains, production data decisions, and the existing unmanaged n8n container are tracked there as B1–B9, each naming the phase it gates. Check it before starting any phase below.
- Implement phases in order. Phases 1–5 are prerequisites and unlock everything after them.
- Run one phase per `task/<id>-<slug>` branch via the `run-task-workflow` skill, or with `implement-step` using `N8N-AGENT-PLAN.md phase <N>`.
- **For step-by-step execution, use [`docs/N8N-IMPLEMENTATION-STEPS.md`](./N8N-IMPLEMENTATION-STEPS.md).** It breaks the phases below into single-session units with exact file paths, explicit constraints, and per-step acceptance checks. This document remains the source of truth for intent; that one is the source of truth for execution.
- Treat every **Goal (measurable)** as the definition of done for that phase.
- Update **Current state** below after each merge.
- Do not commit, push, or deploy from the implementation workflow. Leave changes for review.

## Settled decisions

| Decision                   | Choice                                                                                  | Rationale                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Responsibility split       | n8n orchestrates, NestJS owns data                                                      | One owner of MongoDB; shared Zod validation and ownership guards still apply; logic stays unit-testable |
| n8n hosting                | Local Docker + named Cloudflare Tunnel, then Hetzner CX22                               | Working bot before paying for or hardening a server; identical compose file moves across                |
| Public ingress             | Cloudflare Tunnel on both local and Hetzner                                             | Zero inbound ports, no certificate management, origin IP never exposed                                  |
| Scope                      | Multi-user, linked by one-time code                                                     | Matches the multi-tenant architecture already built; demonstrable to a reviewer                         |
| LLM provider               | Gemini (`@google/genai`, already a dependency)                                          | One provider, one key; `docs/PLAN.md` Phase 7 is already written around it                              |
| Embeddings                 | Manual via `gemini-embedding-001`, 768 dimensions                                       | Vector is ordinary data we control, so it is testable offline and portable off Atlas                    |
| Embedding uses             | Follow-up resolution + duplicate detection (core); semantic search (deferred, Phase 14) | Retrieval for reports rejected — structured aggregation is exact where vectors are approximate          |
| Atlas Automated Embeddings | Rejected                                                                                | Cannot run against Docker MongoDB or `mongodb-memory-server`; adds Voyage as a second provider          |
| `$rerank`                  | Rejected for now                                                                        | Tunes a five-candidate list that Gemini already adjudicates                                             |

## Current state — 2026-08-20

Nothing in this plan is implemented. The repository is at commit `c244564` with Phase 6 of `docs/PLAN.md` shipped.

### Blocking defects found during planning

| Defect                                   | Location                                                                                                           | Impact                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statistics silently exclude Inbox tasks  | `apps/todo-be/src/user/user.service.ts` — `$lookup` + `$unwind` on `todolists` drops todos with `todolistId: null` | Bot-created tasks land in Inbox by default and would be invisible to statistics, reports, and analytics. Every number in this feature would be wrong. Fixed in Phase 1. |
| `Todo` has no priority field             | `apps/todo-be/src/app/models/todo.model.ts`                                                                        | "urgent: call the bank" has nowhere to store urgency without inventing a todo list. Fixed in Phase 1.                                                                   |
| No user preferences or timezone anywhere | `apps/todo-be/src/app/models/user.model.ts`, `SettingsPage.tsx` is a placeholder                                   | Greetings, report cadence, and end-of-day scheduling all depend on the user's local time. Fixed in Phases 1–2.                                                          |
| No non-Firebase authentication path      | All routes are `users/:userId/*` behind `FirebaseAuthGuard`                                                        | n8n holds no Firebase ID token and cannot call any existing endpoint. Fixed in Phase 3.                                                                                 |

### Architecture

```text
Telegram
   │  message
   ▼
n8n  (Docker: n8n + Postgres, behind Cloudflare Tunnel)
   ├─ resolve chatId → userId
   ├─ load session state
   ├─ Gemini: parse / clarify / phrase
   └─ HMAC-signed HTTPS
          │
          ▼
NestJS  /api/integrations/*   ← ServiceAuthGuard
   ├─ Zod validation (libs/types)
   ├─ ownership + user isolation
   ├─ deterministic analytics
   └─ Mongoose
          │
          ▼
MongoDB Atlas ── todos, users, agent_sessions, reports, $vectorSearch
          │
          ▼
React app ── dashboard, tasks, reports, settings
```

---

## Phase 1 — Data model and shared contracts

**Why:** every later phase writes to or reads from these fields. Changing them after workflows exist means editing n8n nodes by hand.

**Goal (measurable):** `User` carries timezone, locale, and report preferences; `Todo` carries priority, source, and an embedding field; `AgentSession` and `Report` collections exist with indexes; all new shapes have Zod schemas in `libs/types` used by both applications; the statistics aggregation counts Inbox todos and has a regression test proving it.

**Concepts:** schema evolution, backward-compatible migrations, IANA timezone identifiers, TTL indexes, discriminated unions, shared contracts at trust boundaries.

**Libs/deps:** none. The shared timezone helpers in `@shared/types` (`libs/types/src/lib/datetime.ts`) already exist — validate the `timezone` field with `isValidTimezone` rather than a regex or a second dayjs setup.

**Already done ahead of this phase (2026-08-20):**

- Deleting a list reparents its todos to the inbox instead of orphaning them, so `todolistId: null` is now only ever a deliberate state.
- Shared timezone helpers with DST coverage.
- Production and `todo_dev` audited; see the blockers section of [`docs/PLAN.md`](./PLAN.md).

**Files:**

- `apps/todo-be/src/app/models/user.model.ts` — add `timezone` (IANA string, default `UTC`), `locale`, `preferences` subdocument, `telegram` subdocument (`chatId`, `linkedAt`, `username`).
- `apps/todo-be/src/app/models/todo.model.ts` — add `priority` (`low|medium|high`, default `medium`), `source` (`web|telegram`, default `web`), `embedding` (`[Number]`, `select: false`), `embeddingUpdatedAt`.
- `apps/todo-be/src/app/models/agent-session.model.ts` — `userId`, `chatId`, `turns[]`, `pendingClarifications[]`, `lastTaskIds[]`, `expiresAt` with a TTL index.
- `apps/todo-be/src/app/models/report.model.ts` — `userId`, `period` (`daily|weekly|monthly`), `periodStart`, `periodEnd`, `metrics`, `narrative`, `deliveredAt`; unique compound index on `{ userId, period, periodStart }`.
- `libs/types/src/lib/user-preferences.schemas.ts`
- `libs/types/src/lib/agent.schemas.ts`
- `libs/types/src/lib/report.schemas.ts`
- `libs/types/src/lib/todo.schemas.ts` and `todo.types.ts` — extend with `priority` and `source`.
- `libs/types/src/index.ts`
- `apps/todo-be/src/user/user.service.ts` — replace the `$lookup`/`$unwind` join with a direct `userId` match so Inbox todos are counted.
- `tools/migrations/001-agent-fields.ts` — idempotent backfill of defaults on existing documents. Also backfill `userId` on todos that predate the field, resolving it through the parent list, and flip `userId` to `required: true` only once that backfill is proven. Must be run against **both** `todo` (production) and `todo_dev` (local development), which live on the same Atlas cluster.
- Indexes on `todos` for `userId` and `todolistId`. Both collections currently carry only the default `_id_` index in production, so every user-scoped query and the statistics aggregation is a full collection scan.

**Acceptance checks:**

- A todo with `todolistId: null` appears in `GET /api/users/:userId/stats`, covered by a test that fails against the current implementation.
- Existing todos and users load without error after migration; the migration is safe to run twice.
- `AgentSession` documents expire automatically; the TTL index is asserted in a test.
- Creating two reports for the same user, period, and period start is rejected by the unique index.
- No `any` escapes into the shared schemas; frontend and backend import the same definitions.

---

## Phase 2 — Settings page and user preferences API

**Why:** report cadence, timezone, tone, and AI consent are user-controlled inputs to every workflow that follows. The Settings route is currently a placeholder.

**Goal (measurable):** a signed-in user can set timezone, report cadence (`daily|weekly|monthly|off`), delivery hour, tone (`neutral|encouraging|direct`), and AI consent; preferences persist through `GET`/`PATCH /api/users/:userId/preferences`; the page is fully translated in English, German, and Ukrainian; component and API tests cover the round trip.

**Concepts:** preference persistence, `Intl.DateTimeFormat().resolvedOptions().timeZone` detection with manual override, consent as an explicit gate, partial-update schemas, optimistic UI with React Query.

**Libs/deps:** none. Reuse `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, and the shared timezone helpers in `@shared/types`.

**Files:**

- `apps/todo-be/src/user/user-preferences.controller.ts`
- `apps/todo-be/src/user/user-preferences.service.ts`
- `apps/todo/src/app/component/pages/SettingsPage.tsx` — replace the placeholder.
- `apps/todo/src/app/component/settings/` — preference form sections.
- `apps/todo/src/app/fetchers/preferences.ts`
- `apps/todo/src/app/hooks/usePreferences.ts`
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json`

**Acceptance checks:**

- Timezone is auto-detected on first visit and can be overridden; the stored value is a valid IANA identifier, validated server-side. Use `detectTimezone()` and `isValidTimezone()` from `@shared/types` rather than a second implementation.
- Setting cadence to `off` disables report delivery end to end, verified in Phase 10.
- AI consent defaults to off, and every Gemini call in this plan is gated on it.
- A user cannot read or write another user's preferences; covered by an authorization test.
- All new strings exist in all three locales; no hardcoded copy in components.
- Only Tailwind theme tokens are used; no new colors introduced.

---

## Phase 3 — Service authentication for n8n

**Why:** this is the security boundary of the entire feature. n8n has no Firebase token, so it needs its own authenticated path — and that path must not become a way to impersonate any user.

**Goal (measurable):** `/api/integrations/*` accepts only requests carrying a valid HMAC-SHA256 signature over the raw body plus a timestamp; requests older than 300 seconds are rejected; replayed nonces are rejected; forged, tampered, and unsigned requests are rejected with `401`; the guard is covered by tests for each failure mode.

**Concepts:** HMAC request signing, constant-time comparison, replay windows, nonce caching, raw-body capture before JSON parsing, defense in depth, secret rotation.

**Libs/deps:** Node `crypto`. No new dependency.

**Files:**

- `apps/todo-be/src/integrations/service-auth.guard.ts`
- `apps/todo-be/src/integrations/service-auth.module.ts`
- `apps/todo-be/src/integrations/integrations.module.ts`
- `apps/todo-be/src/common/config/service-auth.config.ts` — `N8N_SHARED_SECRET`, replay window, throttle limits.
- `apps/todo-be/src/main.ts` — preserve the raw body for signature verification.
- `.env.example`

**Security requirements:**

- Compare signatures with `crypto.timingSafeEqual`, never `===`.
- Sign the raw body bytes, not a re-serialized object.
- Every `/api/integrations/*` route resolves its target user server-side from the linked `chatId`; n8n may never pass a `userId` that is trusted without verification.
- Apply a dedicated throttle bucket, separate from the auth and default buckets.
- Never log the shared secret, signatures, raw task text, or model output.
- Document secret rotation: both old and new secrets accepted during a rotation window.

**Acceptance checks:**

- A request with a valid body but wrong signature returns `401`.
- A byte-level tampered body with a previously valid signature returns `401`.
- A replayed request within the window returns `401` on the second attempt.
- A request with a timestamp outside the window returns `401`.
- An integration route asked to act on a `chatId` that is not linked returns `404`, not a partially applied write.

---

## Phase 4 — Telegram account linking

**Why:** multi-user means every incoming message must resolve to exactly one app user, provably and revocably.

**Goal (measurable):** a signed-in user generates a one-time code on the Settings page; sending `/start <code>` to the bot binds that chat to that account; codes are single-use and expire in 10 minutes; a user can unlink; an unlinked chat receives a clear instruction rather than silence.

**Concepts:** out-of-band account linking, single-use tokens, TTL expiry, idempotent binding, revocation, enumeration resistance.

**Libs/deps:** none.

**Files:**

- `apps/todo-be/src/app/models/telegram-link-code.model.ts` — hashed code, `userId`, `expiresAt` TTL index, `usedAt`.
- `apps/todo-be/src/integrations/telegram/telegram-link.controller.ts` — `POST /api/users/:userId/telegram/link-code` (Firebase-guarded), `DELETE /api/users/:userId/telegram/link`.
- `apps/todo-be/src/integrations/telegram/telegram-link.service.ts`
- `apps/todo-be/src/integrations/telegram/telegram-resolve.controller.ts` — `POST /api/integrations/telegram/link` and `GET /api/integrations/telegram/resolve` (service-guarded).
- `apps/todo/src/app/component/settings/TelegramLinkSection.tsx`
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json`

**Acceptance checks:**

- Codes are stored hashed, never in plaintext.
- A code works exactly once; the second attempt fails.
- An expired code fails and is cleaned up by the TTL index.
- Linking a chat already bound to another account is rejected with a clear message.
- Unlinking stops all message processing and report delivery for that chat.
- Codes are long enough and rate-limited enough that guessing is impractical; covered by a throttle test.

---

## Phase 5 — n8n infrastructure, local first

**Why:** the workflow environment must be reproducible and committed before workflows exist, or the move to Hetzner becomes a rebuild.

**Goal (measurable):** `docker compose -f tools/n8n/docker-compose.yml up` starts n8n backed by Postgres; a named Cloudflare Tunnel serves it on a stable hostname; a dev bot reaches it; workflow JSON exports live in `n8n/workflows/`; every environment-specific value is an env var.

**Concepts:** infrastructure as code, credential encryption at rest, stable webhook endpoints, dev/prod environment separation, tunnel-based ingress.

**Libs/deps:** Docker Compose, `n8nio/n8n`, `postgres:16`, `cloudflared`.

**Files:**

- `tools/n8n/docker-compose.yml` — n8n + Postgres + named volumes, matching the `tools/mongodb/` convention.
- `tools/n8n/.env.example`
- `n8n/workflows/.gitkeep` — exported workflow JSON, committed.
- `docs/runbooks/n8n-local.md`
- `README.md` — add n8n to local services.

**Critical setup requirements:**

- Postgres from the first run, never SQLite, or execution history and credentials do not survive the migration.
- `N8N_ENCRYPTION_KEY` set explicitly in `.env` and backed up outside the repository. Without it, moving the database renders every stored credential permanently undecryptable.
- A **named** Cloudflare Tunnel on a domain you own. Quick tunnels issue a new `*.trycloudflare.com` hostname on every restart, which forces re-registering the Telegram webhook each time.
- **Two Telegram bots**, dev and prod. Telegram permits exactly one webhook per token, so a single bot means each environment silently kills the other.
- `WEBHOOK_URL` and `APP_API_BASE_URL` as env vars — local points at `http://host.docker.internal:3333`, production points at the Render URL.

**Acceptance checks:**

- A fresh clone can start n8n from the documented steps alone.
- Restarting the stack preserves workflows and credentials.
- The tunnel hostname survives a restart.
- No secret is committed; `.env.example` carries placeholders only.
- Exported workflow JSON contains no credential values.

---

## Phase 6 — Capture workflow: brain-dump to tasks

**Why:** this is the core product promise — one unstructured message becomes the right set of tasks.

**Goal (measurable):** a message containing several tasks across several days produces correctly dated, correctly prioritized todos visible on the dashboard; a 20-case eval fixture reaches at least 90% acceptable output on date, priority, and title; the bot always replies, including on failure; duplicate Telegram deliveries never create duplicate tasks.

**Concepts:** structured model output, schema-constrained generation, untrusted output validation, relative date resolution in the user's timezone, idempotency keys, graceful degradation, prompt versioning.

**Libs/deps:** reuse `@google/genai`.

**Files:**

- `apps/todo-be/src/agent/agent.module.ts`
- `apps/todo-be/src/agent/agent-capture.controller.ts` — `POST /api/integrations/agent/capture`.
- `apps/todo-be/src/agent/task-parser.service.ts` — Gemini structured output, Zod-validated.
- `apps/todo-be/src/agent/prompts/parse-tasks.v1.ts` — versioned prompt.
- `apps/todo-be/src/agent/evals/` — fixtures and scorer.
- `libs/types/src/lib/agent.schemas.ts`
- `n8n/workflows/capture.json`

**Behavioral requirements:**

- Resolve relative dates ("tomorrow", "next Tuesday", "end of the week") against the user's stored timezone, not the server's.
- **Do not interrogate the user per task.** Parse and create everything unambiguous immediately, then send **one** batched follow-up covering only genuinely ambiguous items, with inline keyboard options (`Today` / `Tomorrow` / `This week` / `Skip`).
- Validate model output with Zod and reject unknown fields before any write.
- Use the Telegram `update_id` as an idempotency key so retried deliveries are no-ops.
- On model timeout or failure, reply with a clear error and save the raw text as a single untitled task rather than losing it.
- Gate every Gemini call on the AI consent flag from Phase 2.

**Acceptance checks:**

- Eval results, prompt version, model name, error rate, and p95 latency are reproducible and recorded.
- Malformed, adversarial, empty, oversized, and timeout inputs are tested.
- A message producing five tasks across three dates creates exactly five correctly dated todos.
- Re-delivering the same Telegram update creates nothing new.
- Raw task text and model output never appear in production logs.

---

## Phase 7 — Sessions and conversational follow-ups

**Why:** a clarification the bot asked ten seconds ago and a "same as yesterday" an hour later are both continuations, and neither works without state.

**Goal (measurable):** answering a pending clarification updates the correct task without repeating context; a conversation resumes correctly after an hour and after a day; sessions expire automatically; concurrent messages do not corrupt state.

**Concepts:** conversation state machines, rolling context windows, TTL expiry, pending-question resolution, optimistic concurrency, context minimization.

**Libs/deps:** none.

**Files:**

- `apps/todo-be/src/agent/session.service.ts`
- `apps/todo-be/src/agent/agent-session.controller.ts` — service-guarded session read/write.
- `apps/todo-be/src/app/models/agent-session.model.ts`
- `n8n/workflows/capture.json` — session load and save steps.

**Behavioral requirements:**

- Keep a bounded rolling window of recent turns; never send unbounded history to the model.
- Track `pendingClarifications` explicitly so a bare reply like "Friday" resolves to the right task.
- Expire sessions via TTL, with a longer retention for `lastTaskIds` so day-later references still resolve.
- Guard against interleaved messages with a version field or atomic update.

**Acceptance checks:**

- Bot asks for a date, user replies "Friday", the correct task is updated and no new task is created.
- A follow-up 25 hours later still resolves against recent tasks.
- An expired session degrades to fresh capture rather than erroring.
- Two rapid messages do not lose either update.
- Session documents contain no more raw text than the rolling window requires.

---

## Phase 8 — Embeddings: follow-up resolution and duplicate detection

**Why:** "add cheese to that shopping thing" shares no keyword with "buy groceries for the week". Only semantic similarity can connect them.

**Goal (measurable):** a follow-up referring to an existing task by meaning rather than wording updates that task in at least 85% of a fixed relevance fixture set; near-duplicate captures are merged rather than duplicated; vector search never returns another user's tasks; the whole feature runs in tests without Atlas.

**Concepts:** text embeddings, cosine similarity, approximate nearest neighbor search, pre-filtering, retrieval versus decision, dimensionality reduction, hermetic testing through interface substitution.

**Libs/deps:** reuse `@google/genai` (`gemini-embedding-001`, output dimensionality **768**).

**Files:**

- `apps/todo-be/src/agent/vector/vector-search.interface.ts`
- `apps/todo-be/src/agent/vector/atlas-vector-search.service.ts`
- `apps/todo-be/src/agent/vector/in-memory-vector-search.service.ts` — cosine similarity, used by tests and local development.
- `apps/todo-be/src/agent/embedding.service.ts`
- `apps/todo-be/src/agent/task-resolver.service.ts`
- `tools/migrations/002-backfill-embeddings.ts`
- `docs/atlas-vector-index.md` — the index definition, since it is configured in Atlas rather than in code.

**Design requirements:**

- Embed on create and on name/notes update; store `embeddingUpdatedAt` and skip unchanged text.
- The Atlas index must declare `userId` and `status` as filter fields.
- **`filter: { userId }` on every `$vectorSearch` is mandatory.** Without it the query returns other users' tasks, bypassing the ownership guards entirely.
- Vector search **retrieves candidates only**; Gemini decides whether the message refers to one of them or is new. Never act on raw similarity rank.
- Apply a similarity floor so a wholly unrelated message produces no candidates rather than a bad match.
- Select the interface implementation by environment so `mongodb-memory-server` tests never touch Atlas.

**Acceptance checks:**

- A relevance fixture set defines expected matches and is scored before any UI work.
- A test proves user A's query cannot return user B's task, with the filter deliberately removed to confirm the test fails.
- Backfill is idempotent and resumable.
- Embedding failure degrades to keyword matching rather than blocking capture.
- Documents stay within the free tier's 512 MB budget at projected volume; the calculation is recorded.

---

## Phase 9 — Deterministic analytics engine

**Why:** "today you were proactive" must be earned by a number, not asserted by a model. A model that hallucinates a good day when nothing was completed destroys trust in the whole feature.

**Goal (measurable):** `GET /api/users/:userId/analytics/daily` returns a reproducible proactivity score with its component metrics; the same input always yields the same score; every component is unit-tested; no model is involved in computing it.

**Concepts:** metric design, deterministic scoring, normalization, edge-case handling, timezone-correct day boundaries, avoiding punitive metrics.

**Libs/deps:** reuse `dayjs` through the shared timezone helpers in `@shared/types`. Do not call `dayjs()` on a raw server date for anything day-boundary related — the backend runs in UTC, and `startOfDayInZone` / `endOfDayInZone` exist for exactly this.

**Files:**

- `apps/todo-be/src/analytics/analytics.module.ts`
- `apps/todo-be/src/analytics/analytics.controller.ts`
- `apps/todo-be/src/analytics/proactivity.service.ts`
- `libs/types/src/lib/analytics.schemas.ts`

**Metric definition (implement exactly, document any change):**

- **Completion ratio** — tasks completed today ÷ tasks due today.
- **On-time rate** — completed on or before due date ÷ completed today.
- **Engagement latency** — hours between local day start and first completion.
- **Overdue drift** — change in overdue count versus yesterday.
- **Capture activity** — tasks created today, weighted lightly; capturing is not achievement.

Combine into a 0–100 score with documented weights. Handle the zero-task day explicitly: a day with nothing due is **neutral**, never a failure.

**Acceptance checks:**

- Identical input produces an identical score across runs.
- Day boundaries follow the user's timezone, verified across a DST transition. The helpers themselves are already covered for the 23-hour and 25-hour Berlin days in `apps/todo-be/src/app/shared-datetime.spec.ts`; this check is about the analytics built on top of them.
- A user with no tasks due receives a neutral result, not a zero.
- Every component metric has direct unit-test coverage.
- The endpoint enforces user isolation.

---

## Phase 10 — Report generation, storage, and delivery

**Why:** the report is the daily payoff, and it must be identical on the Reports page and in Telegram.

**Goal (measurable):** at each user's configured local hour, a report for their configured cadence is generated once, stored, and delivered to Telegram; the narrative is phrased by Gemini strictly from Phase 9 numbers; duplicate delivery is impossible; cadence `off` delivers nothing.

**Concepts:** per-user timezone scheduling, cron fan-out, idempotent generation, unique-index guards, grounded generation, tone control, delivery-failure handling.

**Libs/deps:** reuse `@google/genai`, and `dayjs` through the shared timezone helpers in `@shared/types`. `hourInZone` is what decides whether a user's configured delivery hour has arrived.

**Files:**

- `apps/todo-be/src/reports/reports.module.ts`
- `apps/todo-be/src/reports/reports.service.ts`
- `apps/todo-be/src/reports/reports.controller.ts` — user-facing `GET` list and detail.
- `apps/todo-be/src/reports/report-generation.controller.ts` — service-guarded `POST /api/integrations/reports/due` and `POST /api/integrations/reports/generate`.
- `apps/todo-be/src/reports/prompts/narrative.v1.ts`
- `n8n/workflows/reports.json`

**Scheduling model:**

n8n runs hourly. Each run calls `POST /api/integrations/reports/due`, which returns the users whose local time now matches their configured delivery hour and whose cadence period has closed. n8n then generates and delivers each. This keeps all timezone logic in tested NestJS code and keeps the n8n schedule trivial.

**Generation requirements:**

- The model receives **only** the computed metrics and the tone preference — never raw task text.
- The prompt must be constructive and must never shame the user. A weak day is framed as information, not failure.
- Validate narrative output for length and unexpected content before storing.
- The unique index on `{ userId, period, periodStart }` is the idempotency guarantee; handle the duplicate-key error as success.
- A Telegram delivery failure leaves the stored report intact and retries without regenerating.

**Acceptance checks:**

- Two scheduler runs in the same hour deliver one report.
- Users in different timezones receive reports at their own local hour, tested across at least three zones.
- Cadence `off` and unlinked chats receive nothing.
- Weekly and monthly cadences use correct period boundaries, including month lengths.
- A user with an empty period receives a coherent report rather than an error.
- The narrative never contradicts the metrics; covered by fixture tests.

---

## Phase 11 — Reports page

**Why:** the report must be reviewable in the app, not only in a chat history that scrolls away.

**Goal (measurable):** a `/reports` route lists past reports with period filters and opens a detail view showing metrics and narrative; loading, empty, and error states are handled; the page is translated in all three locales and keyboard-accessible.

**Concepts:** list/detail routing, server state caching, empty-state design, accessible navigation, skeleton loading consistent with existing pages.

**Libs/deps:** reuse `@tanstack/react-query`, `react-router-dom`, `recharts`.

**Files:**

- `apps/todo/src/app/component/pages/ReportsPage.tsx`
- `apps/todo/src/app/component/pages/ReportsPageSkeleton.tsx`
- `apps/todo/src/app/component/reports/`
- `apps/todo/src/app/fetchers/reports.ts`
- `apps/todo/src/app/hooks/useReports.ts`
- Router and navigation registration.
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json`

**Acceptance checks:**

- Skeletons match the existing dashboard and tasks conventions.
- A user with no reports sees a helpful empty state pointing at Settings.
- Reports are user-scoped server-side; a direct fetch of another user's report fails.
- Component tests cover list, detail, empty, and error states.
- Only Tailwind theme tokens are used.

---

## Phase 12 — Dashboard greeting and period progress chart

**Why:** two of the original requests land here, and both depend on the timezone work from Phase 2.

**Goal (measurable):** the dashboard greets by time of day in the user's timezone and locale; a progress chart shows completion trends over week, month, and year; both are covered by tests with a pinned clock.

**Concepts:** timezone-correct time-of-day bucketing, localized greetings, time-series aggregation, chart accessibility, deterministic tests under fake timers.

**Libs/deps:** reuse `recharts`, `react-i18next`, and the shared timezone helpers in `@shared/types`. `dayKeyInZone` resolves the greeting bucket against the stored timezone rather than the browser's.

**Files:**

- `apps/todo/src/app/component/dashboard/Greeting.tsx`
- `apps/todo/src/app/component/dashboard/ProgressChart.tsx`
- `apps/todo/src/app/component/pages/DashboardPage.tsx`
- `apps/todo-be/src/user/user.service.ts` — time-series aggregation by period.
- `apps/todo/src/app/i18n/locales/{en,de,uk}.json`

**Requirements:**

- Greeting buckets: morning, day, evening, night — resolved in the user's timezone, not the browser's, so it stays correct while travelling.
- Greetings must be genuinely translated per locale, not string-concatenated.
- **Invoke the `dataviz` skill before writing the chart.** Use hex values directly for recharts `Cell fill` per `AGENTS.md`; do not create intermediate color constants.
- Follow the existing fake-timer convention from `DashboardPage.spec.tsx` so tests do not flake.

**Acceptance checks:**

- Greeting is asserted at four pinned times across at least two timezones.
- The chart renders correctly for week, month, and year, including sparse data.
- Chart colors come from the theme and pass contrast requirements in both states.
- Inbox tasks appear in the chart, confirming the Phase 1 fix end to end.

---

## Phase 13 — Hetzner deployment and hardening

**Why:** the tunnel-and-laptop setup is for building. This is where it becomes a service that runs without you.

**Goal (measurable):** n8n runs on a Hetzner CX22 reachable only through Cloudflare Tunnel, with no inbound ports open; the prod bot is registered against it; automated backups cover the n8n Postgres volume; a documented runbook covers restore, rotation, and upgrade.

**Prerequisites — graduate only when all six pass locally:**

1. A brain-dump produces multiple correct tasks, visible on the dashboard.
2. Ambiguous input yields one batched clarification, and answering it creates the tasks.
3. A follow-up an hour later attaches to the correct existing task.
4. The daily report fires on schedule and lands in Telegram.
5. Workflows are exported to `n8n/workflows/*.json` and committed.
6. The backend rejects a forged, unsigned, and replayed integration request.

**Concepts:** immutable infrastructure, least privilege, tunnel-based ingress, secret management, backup and restore verification, unattended patching.

**Files:**

- `tools/n8n/docker-compose.prod.yml`
- `docs/runbooks/n8n-hetzner.md`
- `docs/adr/` — ADRs for the orchestration split, Cloudflare Tunnel over a reverse proxy, and manual embeddings over Atlas Automated Embeddings.

**Hardening requirements:**

- x86 CX line, not ARM CAX — some community nodes with native dependencies are unreliable on ARM.
- `cloudflared` on the VPS; firewall denies all inbound except SSH, and SSH is key-only with password authentication disabled.
- n8n user management enabled; the editor UI restricted to Tailscale or an IP allowlist so only `/webhook/*` is publicly reachable.
- `unattended-upgrades` enabled.
- `N8N_ENCRYPTION_KEY` and `N8N_SHARED_SECRET` stored in a password manager, never in the repository.
- Hetzner automated backups enabled, and **a restore actually tested once** — an untested backup is not a backup.
- A keep-warm cron pinging `/api/health/live` every ten minutes to avoid Render cold starts on the free tier.

**Acceptance checks:**

- An external port scan shows no open n8n port.
- The prod bot works; the dev bot still works locally against its own webhook.
- Restoring the Postgres volume into a fresh container recovers workflows and credentials.
- Secret rotation is performed once, following the runbook, without downtime.
- README links the runbooks and documents the deployed topology.

---

## Phase 14 — Semantic task search (optional)

**Why:** the index from Phase 8 already exists, so a meaning-based search box is a small delta and a strong demo.

**Goal (measurable):** a search input on the Tasks page returns tasks by meaning across all lists; retrieval quality is measured against fixtures before the UI is built; results are highlighted and keyboard-navigable.

**Files:**

- `apps/todo-be/src/todo/todo-search.controller.ts`
- `apps/todo/src/app/component/todo/TaskSearch.tsx`
- Relevance fixtures and a scorer.

**Acceptance checks:**

- Retrieval quality is measured and recorded before UI work begins.
- Search is user-scoped, with a test proving cross-user isolation.
- Empty and no-result states are handled.
- Falls back to keyword search when embeddings are unavailable.

---

## Cross-phase rules

Every phase must:

- Route all writes through NestJS. n8n never connects to MongoDB directly.
- Resolve the acting user server-side from the linked `chatId`; never trust a `userId` supplied by n8n.
- Enforce authorization on the server, never only in the UI or in a workflow.
- Keep shared contracts in `libs/types` when both applications use them.
- Gate every Gemini call on the user's AI consent flag.
- Keep raw task text, model output, secrets, and signatures out of logs, fixtures, and screenshots.
- Send the model the minimum data required — aggregate metrics over raw history, always.
- Use Tailwind theme tokens; add no new colors without asking.
- Export and commit any changed n8n workflow JSON in the same change.
- Run `npx prettier --write` on every file written or edited.
- Pass lint, typecheck, affected tests, and affected builds before review.
- Leave changes uncommitted for user review; never commit, push, or deploy from the workflow.

## Definition of done

The Telegram agent is complete when:

- A new user can link Telegram from Settings in under a minute and immediately capture tasks by message.
- A multi-task brain-dump produces correctly dated, prioritized tasks visible on the dashboard.
- Ambiguity produces one batched question, not an interrogation.
- A follow-up hours or days later attaches to the right task by meaning.
- Reports arrive on each user's chosen cadence, at their own local hour, exactly once.
- The daily verdict is backed by a deterministic, tested score that the model only phrases.
- The Reports page, greeting, and progress chart work in all three locales.
- Forged, replayed, and cross-user requests are rejected, with tests proving each.
- n8n runs on Hetzner with no open inbound ports and a verified backup restore.
- Workflows, runbooks, and ADRs are committed and make the design reviewable.

## Recommended branch order

1. Data model, shared contracts, and the Inbox statistics fix.
2. Settings page and preferences API.
3. Service authentication guard.
4. Telegram account linking.
5. Local n8n infrastructure.
6. Capture workflow and eval harness.
7. Sessions and follow-up state.
8. Embeddings, resolution, and duplicate detection.
9. Deterministic analytics engine.
10. Report generation and delivery.
11. Reports page.
12. Dashboard greeting and progress chart.
13. Hetzner deployment and hardening.
14. Semantic search, only after the definition of done passes.
