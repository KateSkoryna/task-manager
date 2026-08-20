# Portfolio-Ready Todo App Plan

> **Objective:** turn this repository into a credible full-stack portfolio project that is easy to run, pleasant to review, secure by default, and rich enough to support strong technical-interview stories.
>
> **Strategy:** favor visible engineering evidence over feature count. The core plan demonstrates shared validation, automated testing, dependency injection, API design, security, observability, one evaluated AI feature, deployment, and clear architectural reasoning. Advanced AI features remain optional.

## How to use this plan

- Treat this file as the single source of truth for shipped status, planned work, priorities, and acceptance criteria.
- Implement phases in order unless a phase explicitly says it can run in parallel.
- Ship each phase as a reviewable PR; split Phase 3 by backend feature module.
- Treat every **Goal (measurable)** as the definition of done.
- Update the **Current state** and phase status after each merge.
- Do not start stretch work until the core definition of done passes.

## Current state — 2026-08-04

### Already shipped

- React 18 frontend in an Nx workspace with React Query, Zustand, Tailwind, i18n, and Zod.
- Express 4 and Mongoose backend with controller/repository separation.
- Firebase Authentication with email/password and Google sign-in; Firebase Admin verifies ID tokens.
- MongoDB user profiles and authenticated user-scoped todo lists and todos.
- Todo fields for due date, location, notes, status, completion date, and image attachment.
- Todo-list priority, category, due date, notes, and client-side sorting.
- Per-user statistics with period filters, KPI cards, and Recharts visualizations.
- Backend Jest/Supertest tests, Cypress project, and GitHub Actions for lint, typecheck, tests, and build.
- Vercel frontend, Render backend, and MongoDB Atlas deployment configuration.

### Gaps that weaken the portfolio story

| Area                   | Current weakness                                              | Portfolio signal to create                                                 |
| ---------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Frontend tests         | No meaningful component/hook suite                            | RTL/MSW tests with an enforced coverage threshold                          |
| Backend architecture   | Routes and static controllers wired manually in Express       | NestJS modules, DI, guards, pipes, filters, and testable services          |
| Validation             | Hand-written backend checks duplicate frontend rules          | Shared Zod schemas enforced on both sides                                  |
| Image storage          | Base64 data stored inside MongoDB documents                   | Firebase Storage URLs with user-scoped rules                               |
| Security               | No consistent headers, throttling, request IDs, or pagination | Verifiable hardening and bounded list endpoints                            |
| AI                     | `@google/genai` is installed but unused                       | One narrow feature with evals, privacy controls, and measured latency      |
| Developer experience   | Full stack needs several services and environment variables   | One-command local setup, seed/demo data, and reliable setup docs           |
| Portfolio presentation | Features exist but architectural decisions are hard to skim   | Architecture diagram, ADRs, screenshots, live demo, and concise case study |

## Scope and priorities

- **P0 — Engineering foundation:** Phases 0–5. These make the repository defensible in an interview.
- **P1 — Product differentiator:** Phases 6–8. These make the app memorable and easy to demonstrate.
- **P2 — Portfolio packaging:** Phase 9. This makes the work discoverable in under five minutes.
- **Post-core lab — Performance optimization and refactor:** Phase 10. This measures bottlenecks and validates improvements without deploying experiments from the lab branch.
- **Stretch:** advanced AI and supporting infrastructure only after the core plan is complete.

---

## Phase 0 — Baseline and quality contract

**Why:** large refactors are only credible when their before/after behavior and quality gates are explicit.

**Goal (measurable):** document and run the current lint, typecheck, unit-test, production-build, and critical Cypress flows; record a baseline for backend test count, frontend test count, and API payload size for an image-heavy list; CI is green before Phase 1 begins.

**Concepts:** characterization tests, regression baselines, performance budgets, risk-driven test selection.

**Libs/deps:** none.

**Files:**

- `.github/workflows/ci.yml` — confirm every required gate runs on pull requests.
- `apps/todo-e2e/src/e2e/` — cover sign-in and the primary todo CRUD path if missing.
- `README.md` — keep only reproducible development and verification commands.

**Acceptance checks:**

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm exec nx build todo`
- `npm exec nx build todo-be`
- One authenticated Cypress smoke flow against local emulators.

---

## Phase 1 — Shared full-stack validation

**Why:** one schema enforced at the UI and API boundaries is a strong, concrete type-safety story and removes duplicated controller logic.

**Goal (measurable):** todo and todo-list create/update Zod schemas live once in `libs/types`; backend request validation and frontend forms import those schemas; duplicated hand-written validation is removed; invalid API payloads produce a consistent `400` response shape.

**Concepts:** Zod transforms and refinements, partial update schemas, input/output type inference, React Hook Form resolvers, validation at trust boundaries.

**Libs/deps:** `@hookform/resolvers`.

**Files:**

- `libs/types/src/lib/todo.schemas.ts`
- `libs/types/src/lib/todolist.schemas.ts`
- `libs/types/src/index.ts`
- `apps/todo/src/app/component/todo/TodoForm.tsx`
- `apps/todo/src/app/component/todo/TodoListForm.tsx`
- Backend controller validation entry points, followed by the Nest pipe in Phase 3.

**Acceptance checks:**

- The same invalid fixture fails in frontend and backend tests.
- Cross-field rules such as completion status/completion date and valid due dates are covered.
- No controller contains a second implementation of a shared schema rule.

---

## Phase 2 — Frontend testing foundation

**Why:** the frontend is the largest untested surface. Establishing its safety net before UI and API refactors reduces risk and demonstrates professional testing practice.

**Goal (measurable):** add at least 40 meaningful frontend tests and reach at least 70% statement coverage for app components and hooks; enforce the threshold in CI; tests use MSW at the network boundary and React Testing Library through accessible roles and labels.

**Concepts:** test pyramid, user-observable assertions, `user-event`, `renderHook`, MSW, deterministic async testing, accessibility-first selectors.

**Libs/deps:** `msw`, `@testing-library/user-event`; reuse `@testing-library/react` and `@testing-library/jest-dom`.

**Files:**

- `apps/todo/src/test-setup.ts`
- `apps/todo/src/mocks/handlers.ts`
- `apps/todo/src/mocks/server.ts`
- Tests for auth bootstrap, `useTodoListsData`, forms, todo cards, task pages, statistics, and error/empty states.
- `apps/todo/jest.config.ts` or the active Jest configuration — coverage thresholds.
- `.github/workflows/ci.yml` — coverage-enabled frontend test command.

**Acceptance checks:**

- Tests cover loading, success, empty, validation-error, server-error, and unauthorized states.
- Network behavior is mocked through MSW rather than implementation-level fetcher mocks.
- CI fails when coverage drops below the agreed threshold.

---

## Phase 3 — Incremental Express-to-NestJS migration

**Why:** NestJS turns the backend into a stronger architecture case study through modules, dependency injection, guards, pipes, filters, and generated API documentation.

**Goal (measurable):** every documented endpoint preserves its request/response behavior against a NestJS application; controllers and services are injectable classes; Firebase authorization is a guard; shared Zod schemas are enforced by a pipe; repeated controller `try/catch` blocks are replaced by one global exception layer; existing backend tests retain their intent and pass against Nest.

**Concepts:** modules, controllers, providers, constructor DI, guards, custom parameter decorators, pipes, exception filters, interceptors, configuration injection, Mongoose model injection, Nest testing modules.

**Libs/deps:** `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/mongoose`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/testing`, `reflect-metadata`, `rxjs`.

**Migration sequence:**

1. Add a Nest bootstrap and root module alongside Express; keep the deployed API stable.
2. Migrate auth as the guard/decorator/configuration spike.
3. Migrate todo lists.
4. Migrate todos.
5. Migrate users and statistics.
6. Run parity tests, repoint the frontend, then remove the old Express wiring.

**Files:**

- `apps/todo-be/src/main.ts`
- `apps/todo-be/src/app.module.ts`
- `apps/todo-be/src/auth/`
- `apps/todo-be/src/todolist/`
- `apps/todo-be/src/todo/`
- `apps/todo-be/src/user/`
- `apps/todo-be/src/common/decorators/current-user.decorator.ts`
- `apps/todo-be/src/common/filters/http-exception.filter.ts`
- `apps/todo-be/src/common/pipes/zod-validation.pipe.ts`
- `apps/todo-be/src/integrations/firebase/firebase.module.ts`

**Acceptance checks:**

- Split this phase into feature-sized PRs; do not perform a big-bang rewrite.
- Authorization tests prove one user cannot read or mutate another user's data.
- Swagger/OpenAPI is generated from the application and checked for endpoint parity.
- Old Express controllers, middleware, and duplicated repositories are removed only after parity passes.

---

## Phase 4 — Image storage migration

**Why:** base64 images inflate MongoDB documents and list responses. Moving blobs to the existing Firebase platform creates an easy-to-explain scalability improvement.

**Goal (measurable):** new todo images are stored in Firebase Storage under user-scoped paths; MongoDB stores only a URL and storage object reference; deleting or replacing an image cleans up the old object; an image-heavy list response is materially smaller than the Phase 0 baseline.

**Concepts:** object storage, signed/download URLs, ownership rules, orphan cleanup, client-direct upload versus backend proxy, migration compatibility.

**Libs/deps:** no new SDK; reuse Firebase Storage support from `firebase`.

**Files:**

- `apps/todo/src/app/lib/firebase.ts`
- `apps/todo/src/app/lib/imageUtils.ts`
- Todo form and mutation flow.
- `apps/todo-be/src/todo/todo.service.ts`
- `storage.rules`
- Optional one-time migration script for existing base64 images.

**Acceptance checks:**

- Storage rules prevent cross-user reads and writes.
- Upload failure does not create a broken todo; database failure does not silently orphan an upload.
- Existing base64 records remain readable until migrated, then compatibility code is removed.
- URLs and object paths are validated; raw base64 payloads are rejected after migration.

---

## Phase 5 — Backend hardening and API maturity

**Why:** security, bounded queries, structured logs, and a stable API contract distinguish production-minded work from a CRUD tutorial.

**Goal (measurable):** every response has appropriate security headers; auth and AI routes return `429` after configurable limits; every request produces structured logs with a request ID and latency; list endpoints use bounded cursor pagination and return `{ items, nextCursor }`; OpenAPI matches runtime behavior; no secrets or raw personal/AI text appear in logs.

**Concepts:** HTTP security headers, CORS policy, throttling, structured logging, correlation IDs, cursor pagination, redaction, graceful shutdown, health/readiness checks.

**Libs/deps:** `helmet`, `@nestjs/throttler`, `nestjs-pino`, `pino-http`.

**Files:**

- `apps/todo-be/src/main.ts`
- `apps/todo-be/src/app.module.ts`
- Todo and todo-list query DTOs/services.
- Frontend paginated fetchers and React Query hooks.
- Health/readiness endpoint and deployment configuration.

**Acceptance checks:**

- `curl -I` or an integration test verifies security headers.
- Tests verify throttling, cursor boundaries, invalid cursors, and stable ordering.
- Logs are JSON in production and redact authorization headers and user content.
- API errors use one documented shape with a request ID.

---

## Phase 6 — Product UX that demonstrates frontend depth

**Why:** reviewers need a polished, coherent workflow to see the engineering work. Improve the core task-management experience instead of adding disconnected screens.

**Goal (measurable):** the dashboard works as a daily command center; users can capture an inbox task without choosing a list, organize it later with accessible drag-and-drop or an equivalent keyboard action, identify vital tasks, and complete the main flow on mobile and desktop without accessibility-critical violations.

**Concepts:** information hierarchy, optimistic updates, accessible drag-and-drop, responsive layout, keyboard navigation, focus management, empty/error states, internationalization.

**Features:**

- Dashboard daily-focus strip with a lightweight horizontal week view and Today selected by default.
- Today's completion ring calculated only from tasks due on the current day.
- Top three high-priority tasks for today, an inbox count for tasks without a list or date, and a prominent quick-add action that saves to Inbox by default.
- Inbox support for tasks without a list.
- Flat and grouped task views.
- Reordering or moving tasks between Inbox and lists with keyboard-accessible controls.
- Vital Tasks “Rule of Three” presentation with expanded, goal-oriented cards; show a gentle focus warning when more than five vital tasks are selected.
- Optional local Pomodoro focus mode and a restrained urgency treatment for deadlines within four hours that respects reduced-motion preferences.
- Consistent skeleton, empty, error, and retry states.
- Responsive and accessible auth, tasks, statistics, settings, and help pages.

**Files:**

- `apps/todo/src/app/component/pages/DashboardPage.tsx`
- `apps/todo/src/app/component/pages/TasksPage.tsx`
- `apps/todo/src/app/component/pages/VitalTaskPage.tsx`
- Shared components, hooks, fetchers, types, and backend schemas required for Inbox/order support.

**Acceptance checks:**

- Keyboard-only users can create, edit, move, complete, and delete a task.
- Mobile layouts work at 320px without horizontal overflow.
- New visible strings exist in English, German, and Ukrainian locale files.
- Component tests cover the critical interactions and optimistic rollback.

---

## Blockers — resolve before Phase 7 and the n8n agent

**Why:** Phase 6 is shipped. Everything from Phase 7 onward, and all of [`docs/N8N-AGENT-PLAN.md`](./N8N-AGENT-PLAN.md), depends on external accounts, a production data audit, and infrastructure decisions that cannot be made from inside the repository. Each item below either blocks a phase outright or turns into a rebuild when discovered late.

**How to use:** do not start a gated phase until its blockers are closed. "n8n Phase N" refers to `N8N-AGENT-PLAN.md`; bare "Phase N" refers to this file.

| ID  | Blocker                             | Gates                | Status                                         |
| --- | ----------------------------------- | -------------------- | ---------------------------------------------- |
| B1  | Production legacy-todo audit        | n8n Phase 1          | Closed 2026-08-20 — audited, 3 todos, no wipe  |
| B2  | Atlas Vector Search availability    | n8n Phase 8          | Closed 2026-08-20 — available                  |
| B3  | Local development database decision | n8n Phase 1          | Closed 2026-08-20 — `todo_dev` on Atlas        |
| B4  | Cloudflare domain and named tunnel  | n8n Phase 5          | Open                                           |
| B5  | Existing unmanaged n8n container    | n8n Phase 5          | Closed 2026-08-20 — keep it, run two instances |
| B6  | Secret custody                      | n8n Phase 5          | Vault set up — entries added as secrets exist  |
| B7  | Two Telegram bots                   | n8n Phase 5          | Open                                           |
| B8  | Gemini API key and model access     | Phase 7, n8n Phase 6 | Closed 2026-08-20 — key in Render and `.env`   |
| B9  | Hetzner account                     | n8n Phase 13         | Not needed yet                                 |

### Data blockers

**B1 — Production legacy-todo audit.** `userId` was added to `Todo` on 2026-08-12 in `5abc738` as part of Inbox support. It is declared `required: false`, no backfill migration was ever written, and `todo.service.ts` carries a compatibility shim that resolves ownership through the parent list when `userId` is absent. The local audit on 2026-08-20 found 22 todos, 15 without `userId`; of those, 14 pointed at lists that no longer existed and 1 was recoverable. Local data has been cleaned (14 deleted with a backup retained, 1 backfilled) and now holds 8 todos, all carrying `userId`.

**Closed 2026-08-20.** Production was audited and holds almost nothing: 3 todos, 2 users, 1 todolist, 0 MB of data, on a replica set running MongoDB 8.0.29. Two of the three todos have `todolistId: null`, and none carry `priority`. A wipe was considered and rejected as unnecessary — at this volume, backfilling costs the same as deleting and discards nothing.

`tools/migrations/001-agent-fields.ts` should therefore backfill rather than delete: set `userId` from the parent list where it is missing and a list resolves, and log rather than remove anything that resolves through neither. It must stay idempotent and safe to run twice, per the n8n Phase 1 acceptance checks. n8n Phase 1 still flips `userId` to `required: true`; the migration is what makes that flip safe for documents created before the change.

Note that production is a replica set, so multi-document transactions are available there. The local MongoDB is a standalone and cannot serve them, so migrations and services must not depend on transactions to be correct.

**B2 — Atlas Vector Search availability.** **Closed 2026-08-20.** `$vectorSearch` exists only on Atlas; it is absent from the local Docker MongoDB and from `mongodb-memory-server`, which is why this had to be confirmed before n8n Phase 1 committed schema decisions built around it. On the production cluster `db.collection.aggregate([{ $listSearchIndexes: {} }])` returns an empty array rather than failing with `SearchNotEnabled`, so Atlas Search is enabled and n8n Phase 8 can proceed as written. The 512 MB free-tier storage budget still needs the calculation required by that phase's acceptance checks; current usage is effectively zero.

**Missing indexes, found during the same audit.** Both `todos` and `todolists` carry only the default `_id_` index in production — there is no index on `userId` or `todolistId`, so every user-scoped query and the statistics aggregation are full collection scans. This is harmless at three documents and will not stay harmless. n8n Phase 1 should add these indexes alongside its schema work.

**B3 — Local development database decision.** **Closed 2026-08-20.** Local development previously pointed at Docker MongoDB, which cannot serve `$vectorSearch` and would have failed on first contact with n8n Phase 8. It now points at a `todo_dev` database on the same Atlas cluster as production, verified connecting with `{"status":"ok","mongo":"connected"}` against MongoDB 8.0.29. Production `todo` and development `todo_dev` share a cluster and share nothing else.

Consequences for later phases:

- Migration `001` targets two databases, `todo` and `todo_dev`, and must be run against each.
- Tests are unaffected: they use `mongodb-memory-server` and stay offline, so CI needs no Atlas credentials. The vector-search interface substitution required by n8n Phase 8 is what keeps that true once embeddings exist.
- Local development now requires network access. The previous Docker connection string is retained, commented out, in `.env` as an offline fallback.
- The Docker MongoDB in `tools/mongodb/` remains available but is no longer the default development database. The README local-services table and `.env` template were updated on 2026-08-20 to say so; `docs/runbooks/` should repeat it when n8n Phase 5 documents local services.
- `DATABASE_NAME` was removed on 2026-08-20 from `.env`, `render.yaml`, and the README template. It was read nowhere — `app.module.ts` passes only `MONGODB_URI` to Mongoose, so the database name comes from the connection string path, and a variable that looks like configuration but configures nothing is a trap. The value still set in the Render dashboard is inert and can be deleted there.

### Infrastructure blockers

**B4 — Cloudflare domain and named tunnel.** No domain is currently owned. A _named_ tunnel requires a domain whose nameservers point at Cloudflare. A quick tunnel is not a substitute: its `*.trycloudflare.com` hostname changes on every restart, which forces re-registering the Telegram webhook and loses any update delivered in between. Cloudflare Registrar is the shortest path, since nameservers are correct on registration with no propagation wait; any other registrar works if the nameservers are moved to Cloudflare, at the cost of up to 24 hours of propagation. `cloudflared` v24.14.1 is already installed locally.

**B5 — Existing unmanaged n8n container.** **Investigated 2026-08-20; decision: run two independent instances.** An `n8nio/n8n:latest` container created 2026-08-07 runs on `:5678` from outside this repository, on the `n8n_data` Docker volume. It is not disposable — it holds 7 active workflows (Ideas Collector — Slack, Telegram Content Organizer, BrainCollector — Thread Replies, Chat AI Agent, Web Search Workflow, Error handling workflow, News Feed Translation), 9 credentials (Slack, Telegram, Notion, Miro, Google Sheets OAuth2, Google PaLM, Groq, and two HTTP header auths), and 123 executions.

It runs on SQLite with no `DB_TYPE` set, and no `N8N_ENCRYPTION_KEY` in its environment, so n8n auto-generated one and wrote it to `/home/node/.n8n/config` inside the volume. That key is the only thing that can decrypt those 9 credentials and exists nowhere else; destroying the volume means re-authenticating every connected service by hand. The volume was archived to `~/Desktop/n8n-backup-2026-08-20.tar.gz` and the key copied into the B6 vault.

**Therefore n8n Phase 5 must not replace this container.** It assumed it was creating the only n8n on the machine, which is false. The todo agent gets its own stack under `tools/n8n/` — Postgres-backed, its own volume, its own explicit `N8N_ENCRYPTION_KEY`, and a port other than 5678. Merging the two would mean a SQLite-to-Postgres migration that risks those credentials for no benefit.

The existing container also reveals why B4 matters in practice: its `N8N_WEBHOOK_URL` is a quick tunnel (`https://operate-pierre-vertical-sugar.trycloudflare.com/`) and no `cloudflared` process is running, so that hostname is dead and all 7 workflows show as active while receiving nothing. A named tunnel on an owned domain fixes both instances, not just the new one. Its `GENERIC_TIMEZONE` is `Europe/Berlin`, which is the timezone n8n Phase 10 report scheduling should expect for the owner's account.

**B6 — Secret custody.** Vault chosen 2026-08-20: the macOS built-in Passwords app. `GEMINI_API_KEY` is stored there. Remaining entries are created as each secret comes into existence: both Telegram bot tokens (B7), then `N8N_ENCRYPTION_KEY` and `N8N_SHARED_SECRET` at the first managed n8n start (n8n Phase 5). None belong in the repository, and `N8N_ENCRYPTION_KEY` cannot be reconstructed after the fact — it is the only secret here whose loss is unrecoverable rather than merely inconvenient.

### Account blockers

**B7 — Two Telegram bots.** Telegram permits exactly one webhook per bot token, so a single bot shared between environments means each silently overwrites the other. Create a dev bot and a prod bot in BotFather and record both tokens under B6.

**B8 — Gemini API key and model access.** **Closed 2026-08-20.** `@google/genai` v2.13.0 is already a dependency and is currently imported nowhere; no new SDK is needed. `GEMINI_API_KEY` is set in the Render dashboard and in the local `.env`, and `render.yaml` declares it with `sync: false` so the variable is documented in code while the value stays out of the repository. A GitHub repository secret of the same name also exists (added 2026-07-28) but is referenced by no workflow; it is only needed if evals are ever run in CI.

The key must never be exposed to the frontend. Frontend variables use the `NX_` prefix and are compiled into the browser bundle, so an `NX_GEMINI_API_KEY` would publish a billable credential to every visitor. The browser calls this backend; only the backend calls Gemini.

Still to confirm when the first call is written: that the key has access to a structured-output text model (Phase 7 and n8n Phase 6) and to `gemini-embedding-001` with `outputDimensionality: 768` (n8n Phase 8). Note also that no `.env.example` exists in the repository yet; n8n Phase 3 introduces one, and it should document this variable with a placeholder.

**B9 — Hetzner account.** No action needed now. New accounts sometimes require identity verification that takes a day or more, so create the account before the deployment phase rather than during it.

### Dependency review

Reviewed 2026-08-20 against every phase from Phase 7 onward: **no new npm dependency is required.** `recharts`, `dayjs`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `react-i18next`, `react-router-dom`, `@google/genai`, and `msw` are all installed and sufficient. Phase 3 uses Node's built-in `crypto`. The only new software is infrastructure, not packages: Docker images for n8n, Postgres, and `cloudflared`.

A mapping library was considered and rejected. `location` is free text on `Todo`, no phase reads it geographically, and adding Mapbox would introduce a paid API and another key to manage for a feature the agent never touches. It belongs in the stretch roadmap if it is wanted at all.

### Resolved

**Todo orphaning on list delete.** Fixed 2026-08-20. Deleting a list previously removed only the list document and abandoned its todos, which is where all 14 local orphans in B1 came from. `todolist.service.ts` now reparents a list's todos to the Inbox — `todolistId: null` with `userId` preserved — before deleting the list, ordered so that a failure leaves an empty list rather than unreachable todos. Multi-document transactions are deliberately not used because the local MongoDB is a standalone and cannot serve them. Covered by the `api.spec.ts` case "moves todos to the inbox when their list is deleted", verified to fail without the fix. Inbox remains a virtual list (`todolistId: null`), which is how `MoveToListSelect` and `TodoService.findInbox` already treat it.

**No timezone capability on the backend.** Fixed 2026-08-20. `dayjs` was a frontend-only dependency, `dayjs.extend` appeared nowhere in the codebase, and the backend computed dates from `new Date()` — server time, which is UTC on Render. Four separate phases assume otherwise: relative date resolution (n8n Phase 6), day boundaries for analytics (n8n Phase 9), per-user delivery hours (n8n Phase 10), and greeting buckets (n8n Phase 12).

`libs/types/src/lib/datetime.ts` now extends dayjs with the `utc` and `timezone` plugins once, and exports `isValidTimezone`, `detectTimezone`, `inZone`, `startOfDayInZone`, `endOfDayInZone`, `hourInZone`, `dayKeyInZone`, and `isSameDayInZone` through `@shared/types`. Boundary helpers return plain `Date` instants so no dayjs object reaches Mongoose. An unknown zone falls back to UTC rather than throwing, so a corrupted `timezone` field degrades a greeting instead of taking down the report scheduler.

Covered by `apps/todo-be/src/app/shared-datetime.spec.ts`, including the 23-hour and 25-hour Berlin days across both 2026 DST transitions — the cases where plain `dayjs` silently reports 24 hours and analytics quietly drop or double-count an hour twice a year. The n8n Phase 9 acceptance check for DST correctness is therefore satisfied at the helper level before that phase begins.

### Relationship to the n8n agent plan

Phase 7 below and n8n Phase 6 both parse natural language into tasks with Gemini, and both are gated on B8. Phase 7 is the in-app parser with a review step before saving; n8n Phase 6 is the conversational capture path with no review step. Decide whether they share `libs/types` schemas and an eval fixture set before implementing the second one, or the two will drift into separate prompt and validation stacks.

---

## Phase 7 — Gemini Smart Parser with evaluation and privacy

**Why:** one well-engineered AI feature is more valuable than several shallow integrations. Natural-language task parsing fits the product and demonstrates structured output, validation, evaluation, cost control, and GDPR-aware design.

**Goal (measurable):** `POST /api/ai/parse-todo` converts free text into schema-valid task fields; at least 90% of a fixed 20-case eval set produces acceptable date, priority, location, and category values; p95 server latency is measured; the UI completes a parse in under two seconds under normal conditions; users review every suggestion before saving.

**Concepts:** structured model output, prompt versioning, untrusted-output validation, deterministic evals, latency/cost measurement, rate limiting, consent, data minimization, fallback behavior.

**Libs/deps:** reuse `@google/genai`; do not add a second Gemini SDK.

**Files:**

- `apps/todo-be/src/ai/ai.module.ts`
- `apps/todo-be/src/ai/ai.controller.ts`
- `apps/todo-be/src/ai/ai.service.ts`
- `libs/types/src/lib/ai.schemas.ts`
- `apps/todo/src/app/fetchers/ai.ts`
- `apps/todo/src/app/component/todo/TodoForm.tsx`
- `apps/todo-be/src/ai/evals/` — versioned fixtures and scorer.
- User AI preferences/consent UI and persistence.

**Privacy and safety requirements:**

- Obtain explicit consent before the first external AI request and support opt-out.
- Never log raw task text or model output in production.
- Send only the text required for parsing; never send unrelated profile or task history.
- Validate model output with Zod and reject unknown fields.
- Rate-limit by authenticated user and define a timeout and non-AI fallback.
- Document data flow, retention assumptions, and how to use a local Ollama-compatible provider later.

**Acceptance checks:**

- Eval results, prompt version, model name, error rate, and latency are reproducible.
- Malformed, adversarial, empty, oversized, and timeout cases are tested.
- The feature degrades to the normal manual form without blocking task creation.
- No AI suggestion is automatically persisted.

---

## Phase 8 — Production readiness and developer experience

**Why:** a reviewer should be able to clone, run, verify, and understand the app without private knowledge or several fragile manual steps.

**Goal (measurable):** a clean clone can start the local stack with one documented command; CI runs lint, typecheck, unit/integration tests, production builds, and one critical E2E smoke flow; deployed services expose health checks and useful error telemetry; a reviewer can access safe demo data without real credentials.

**Concepts:** container orchestration, twelve-factor configuration, seed data, CI caching, deployment health checks, error monitoring, dependency/security scanning, backup/restore awareness.

**Libs/deps:** Docker Compose; optionally Sentry or an equivalent error-monitoring service with PII scrubbing.

**Files:**

- Root `docker-compose.yml` for MongoDB, Firebase emulators, backend, and frontend where practical.
- `.env.example` with placeholders and explanations, never secrets.
- Idempotent demo seed command.
- `.github/workflows/ci.yml`
- `render.yaml` and frontend deployment configuration.
- Dependabot or Renovate configuration.

**Acceptance checks:**

- Fresh-clone setup is tested from the documented steps.
- CI is green and required on the default branch.
- Production health checks distinguish liveness from dependency readiness.
- Error monitoring redacts tokens, task text, email addresses, and AI payloads.
- Dependency audit findings are resolved or explicitly risk-accepted.

---

## Phase 9 — Portfolio presentation and interview package

**Why:** excellent engineering has little CV value if a reviewer cannot discover the problem, decisions, evidence, and live result quickly.

**Goal (measurable):** the repository front page explains the product and engineering highlights in under two minutes; a reviewer can open a live demo, inspect architecture and API documentation, see CI/coverage evidence, and read concise decision records for the major tradeoffs; prepared CV bullets use truthful measured outcomes.

**Concepts:** technical storytelling, architecture decision records, evidence-based claims, reproducible demos, recruiter skim paths.

**Files and artifacts:**

- `README.md` — hero screenshot/GIF, live links, features, architecture, quick start, tests, security/privacy, AI eval results, and tradeoffs.
- `docs/architecture.md` — one system/context diagram and key request/data flows.
- `docs/adr/` — short ADRs for Firebase Auth, Nest migration, Firebase Storage, shared Zod validation, cursor pagination, and AI provider/privacy decisions.
- Generated OpenAPI endpoint linked from README.
- CI, coverage, deployment, and license badges that point to real evidence.
- A 60–90 second demo script covering sign-in, quick capture, organization, statistics, and Smart Parser review.

**Acceptance checks:**

- Every headline claim links to code, a test, a metric, an ADR, or a live behavior.
- Screenshots contain realistic synthetic data and no personal information.
- Public demo has clear loading/error states and no broken routes.
- README documents known limitations and next steps honestly.

**Candidate CV bullets — replace placeholders with measured results:**

- “Built and deployed a multi-tenant task platform with React, NestJS, MongoDB, Firebase Auth, and Nx; enforced user isolation through guarded APIs and integration tests.”
- “Reduced image-heavy API payloads by **X%** by migrating embedded base64 data to user-scoped object storage.”
- “Created shared Zod contracts across frontend and backend and added **N** automated tests with **X%** frontend coverage.”
- “Shipped an evaluated Gemini structured-output workflow with **X%** task-parsing accuracy and **Y ms** p95 latency, including consent, redacted logging, and rate limits.”

---

## Phase 10 — Performance optimization and refactor lab

**Why:** performance work is credible only when it starts from reproducible measurements and proves that a focused change improves user-visible behavior without weakening correctness or maintainability. Exploratory profiling and refactors should remain isolated from production code until independently verified.

**Goal (measurable):** on a dedicated lab branch, establish reproducible Lighthouse, bundle-size, frontend-rendering, and API-latency baselines; identify the highest-impact bottlenecks; prototype focused optimizations or refactors; and record before/after evidence. Do not deploy the lab branch or merge experimental code directly. Promote only independently verified improvements through separate task branches and reviewable pull requests.

**Concepts:** measurement variance, performance budgets, production-build profiling, bundle analysis, React render profiling, network waterfalls, backend latency, memory and query profiling, incremental refactoring, before/after validation.

**Libs/deps:** prefer existing browser and build tooling; add Lighthouse CI or a bundle analyzer only inside the lab when it makes measurements reproducible and remove unused experimental dependencies.

**Lab files and artifacts:**

- `docs/performance/` — environment, dataset, commands, repeated-run results, bottlenecks, and before/after evidence.
- Lighthouse results for the primary authenticated flows against a production frontend build and representative local backend data.
- Bundle analysis for the main application entry points and largest lazy-loaded routes.
- React Profiler evidence for interactions with visible responsiveness problems.
- Backend latency and payload measurements for representative list, image, statistics, and AI endpoints.
- Small, isolated experimental refactors tied to a measured bottleneck; avoid broad cleanup without measurable impact.

**Acceptance checks:**

- Measurement instructions specify build mode, browser/device profile, dataset, local services, warm-up, and number of runs.
- Lighthouse and latency conclusions use repeated runs and a representative median rather than one favorable result.
- Performance and accessibility budgets are explicit for the flows being evaluated.
- Every proposed optimization links to a measured bottleneck and includes before/after evidence.
- Relevant lint, typecheck, unit, integration, build, and smoke checks still pass after each experiment.
- Experimental changes remain on the lab branch; each improvement selected for production is reimplemented or cleanly extracted into its own task branch and independently tested before merge.
- The lab branch is not deployed and is not merged wholesale into the default branch.

---

## Stretch roadmap — only after the core plan

### AI productivity insights

- Generate a short, reviewable summary from existing aggregate statistics.
- Stream via SSE only if streaming materially improves the demo.
- Choose and document an explicit trigger model before implementation: user-requested insights are the default; background notifications require separate opt-in and scheduling infrastructure.
- Let users control motivational tone; prompts must remain constructive and must not shame or insult users.
- Never send raw task history when aggregate counts are sufficient.

### Semantic search

- Search tasks by meaning by embedding each task's name and notes in a user-scoped vector store such as Qdrant.
- Expose ranked results through a documented search endpoint and highlight matches across lists in the frontend.
- Define relevance fixtures and measure retrieval quality before building the UI.
- Keep vector records user-scoped and delete them with their source tasks.

### Suggested subtasks and metadata

- Generate an optional, expandable checklist of suggested steps for a vital task; never persist generated steps without confirmation.
- Suggest category and priority after a debounce through a dedicated AI endpoint; show confidence in a dismissible UI and require acceptance.
- Prefer a deterministic rule-based fallback for obvious cases.

### Notifications

- Add Firestore real-time notifications for tasks due today and overdue.
- Use user-scoped security rules and idempotent generation.
- Consider Cloud Functions only when background delivery is actually required.

### Extra presentation polish

- Storybook for reusable components.
- Playwright visual regression tests for the primary pages.

---

## Cross-phase quality rules

Every phase must:

- Preserve Firebase Auth; do not reintroduce custom JWT/password storage.
- Enforce authorization on the server, never only in the UI.
- Add or update tests with the behavior change.
- Keep shared contracts in `libs/types` when both applications use them.
- Use Tailwind theme tokens and utilities; do not duplicate colors in component constants.
- Keep secrets and personal data out of source control, logs, fixtures, screenshots, and AI prompts.
- Update generated/documented API contracts when endpoints change.
- Pass lint, typecheck, affected tests, and affected production builds before review.
- Leave unrelated roadmap and stretch work out of the current PR.

## Core definition of done

The portfolio project is ready to feature prominently on a CV when:

- A reviewer can run it locally from a clean clone and open a stable live demo.
- Authentication and cross-user authorization are covered by automated tests.
- Frontend and backend share runtime validation schemas.
- The backend uses clear module boundaries, dependency injection, centralized errors, structured logging, throttling, pagination, and generated OpenAPI documentation.
- Images live in object storage rather than MongoDB documents.
- Critical user journeys have unit/integration and E2E coverage; CI enforces the gates.
- The main experience is responsive, keyboard-accessible, localized, and handles loading/empty/error states.
- The Smart Parser meets its documented eval, latency, privacy, and fallback requirements.
- README, diagrams, ADRs, metrics, screenshots, and demo links make all major claims verifiable.
- The repository contains no secrets, dead experimental dependencies, obsolete auth path, or contradictory active plans.

## Recommended PR order

1. Baseline tests and quality contract.
2. Shared Zod validation.
3. Frontend testing foundation.
4. Nest auth module and application skeleton.
5. Nest todo-list module.
6. Nest todo module.
7. Nest user/statistics module and Express removal.
8. Firebase Storage image migration.
9. Security, logging, pagination, and OpenAPI hardening.
10. Dashboard, Inbox, task organization, and accessibility polish.
11. Gemini Smart Parser, privacy controls, and eval harness.
12. Local-stack/CI/deployment improvements.
13. Portfolio documentation and measured CV evidence.
14. Performance optimization and refactor lab; promote verified improvements through separate task branches only.
