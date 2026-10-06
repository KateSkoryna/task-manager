# Portfolio-Ready Todo App — Plan

**Single source of truth for this project.** Tracks only work that is still open — shipped phases (0–9, 11, 13, and Phase 14's Steps 14.1–14.9) have been trimmed out; see git history for the full plan as executed, including the resolved blockers, decision log, and per-phase results.

## How to use this document

This plan is written to be executed by **Claude Sonnet 5**, one step at a time.

<execution_rules>

1. **Execute exactly one step per session.** Stop at the end of the step and report.
   Do not begin the next step, even if it looks trivial. Kate reviews between steps.
2. **Do not commit, push, or open a pull request.** Leave every change uncommitted in the
   working tree. Kate commits after review.
3. **Each step lists `Files` explicitly.** Create or modify only those files. If the step
   cannot be completed without touching a file not on that list, stop and report which
   file and why, rather than editing it.
4. **`Done when` is the contract.** A step is complete only when every listed command
   exits zero and every listed assertion holds. Paste the actual command output into your
   report — do not summarise it as "tests pass."
5. **Run `npx prettier --write <files>` on every file you create or edit**, as the last
   action before reporting.
6. **Tests before completion.** Run the step's test command. If a pre-existing unrelated
   test is already failing, report it and continue; if your change broke a test, fix it.
7. **When blocked, stop and ask.** Do not invent a schema, an env var, an API shape, or a
   Gemini SDK method signature. If the SDK surface differs from what this plan describes,
   report the actual signature and stop — the plan was written against `@google/genai`
   v2.13.0 and the SDK may have moved.
8. **Scope discipline.** Each step has a `Not in this step` list. Treat it as binding.
9. **Match surrounding code.** Follow the conventions already in `apps/todo-be/src` —
   `executeOperation` for service error wrapping, Zod schemas in `libs/types`, pino for
   logging, `FirebaseAuthGuard` for auth. Do not introduce a new pattern where one exists.

</execution_rules>

Each step below is structured as: **What to do** · **Why** · **What to expect** ·
**What to learn** · **Done when**. The "What to learn" section is not decoration — it names
the concept the step exists to teach, which is the point of this project.

---

## Architecture in one paragraph

A new `apps/todo-be/src/agent/` module exposes `POST /api/agent/message` behind the
existing `FirebaseAuthGuard`. It loads the `AgentSession` for `(userId, chatId)`, sends the
rolling turn window to Gemini along with a set of **declared function tools**, and streams
the response back over SSE. Gemini returns tool calls rather than prose; each call is
validated with Zod and then executed through the **existing `TodoService`**, so ownership
checks, `executeOperation` error wrapping, and the `completedAt` sync logic all apply
unchanged. The agent holds no database handle of its own. On the frontend, a `ChatPanel`
component with a `useAgentChat` hook consumes the stream, and a mic button backed by the
browser `SpeechRecognition` API fills the same text input a keyboard would.

**Why not n8n.** n8n bought a visual runner for logic that is ~500 lines of TypeScript, and
charged four infrastructure blockers, a second Postgres, and `N8N_ENCRYPTION_KEY` — the one
secret in the system whose loss is unrecoverable. The conversation-state layer it was
supposed to justify (`agent-session.model.ts`, `agent.schemas.ts`, migration 001) is
already built in this repository and is not n8n-specific. It all survives.

**Why not the Vercel AI SDK.** Considered and rejected 2026-09-04. `streamText` + `useChat`
would have saved roughly 150 lines of streaming plumbing and made a future local-Ollama swap
a one-liner (see `docs/AGENT-ARCHITECTURE.md`), but it means two new dependencies and a second
Gemini SDK alongside `@google/genai`. Hand-rolling the SSE layer is also the more instructive
path: you learn what `useChat` is doing rather than configuring it.

---

## Model selection

**Use `gemini-3.5-flash`.** Configure it as `GEMINI_MODEL` in the environment, defaulting to
that string in code, so the model can be changed without a redeploy of logic.

Reasoning, from the current [pricing page](https://ai.google.dev/gemini-api/docs/pricing):

- **Free tier is available on it.** Confirmed 2026-09-04. Also free-tier: `gemini-3.8-flash`,
  `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-2.5-flash`, and the Flash-Lite line.
  `gemini-3.1-pro-preview` is **not** free-tier.
- **It reasons.** The 3.x Flash line supports thinking. Set a **low thinking budget** — this
  agent parses "add milk Friday, high priority" into a function call, and paying latency for
  extended deliberation on that is waste. Raise it only if the eval set shows multi-step
  requests failing.
- **It is multimodal**, which matters because the speech fallback for browsers without
  `SpeechRecognition` uploads an audio blob to the same model. A text-only model would force
  a second model dependency.
- **Not `gemini-3.8-flash`/`3.7-flash`:** documented as tuned for "long-horizon software
  engineering and autonomous agents." Wrong shape and more latency than this needs.
- **Not Flash-Lite:** higher request quota, but function-calling reliability on ambiguous
  natural language is exactly where the Lite tier gives ground. Reliability matters more than
  RPD here; a portfolio app does not have 1,000 requests a day.
- **Fallback pin:** if 3.5 Flash misbehaves on the eval set, drop to `gemini-2.5-flash`, which
  is the most-documented free-tier function-calling model.

> **Local development model, 2026-09-11.** `gemini-3.5-flash`'s free-tier RPD cap is only 20
> requests/day (confirmed live via a `429 RESOURCE_EXHAUSTED` during manual testing),
> which exhausts fast during interactive development — this is a local-dev convenience choice,
> not a reversal of the production model decision above. `.env`'s `GEMINI_MODEL` is set to
> `gemini-3.1-flash-lite` for local work: confirmed live to resolve and to have its own,
> separate free-tier quota bucket (quotas are keyed by `{project, model}`, not shared across
> models). Discovered in the process: **a `thinkingBudget` of exactly `0` is rejected outright
> by `gemini-3.5-flash-lite` with a `400 INVALID_ARGUMENT`** — confirmed live — while the full
> `gemini-3.5-flash` model accepts `0` fine. `1` works identically on both (`thoughtsTokenCount`
> stays `0` either way), so `agent.service.ts` now hardcodes `MIN_THINKING_BUDGET = 1` instead
> of `0`, which is what makes any Lite-family model usable at all through this code. This
> constant, not `.env`, is what production must keep in mind if `GEMINI_MODEL` is ever pointed
> at a Lite variant there.

---

## Phase 10 — Semantic search — **only when the trigger fires**

**Do not build this yet.** It is written down so the decision has a condition instead of a feeling.

### The trigger

Build this phase when **either** of these becomes true:

| Measure                              | Threshold    | How to check                                                                                                |
| ------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Tasks for a single user              | **> 2,000**  | `db.todos.aggregate([{ $group: { _id: "$userId", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 1 }])` |
| Tokens sent by one `find_tasks` call | **> 15,000** | logged automatically, see below                                                                             |

Current maximum: about 50 tasks. **Both are far from firing, so the answer today is: do not build it.**

**You do not have to remember to check.** `AgentToolsService`'s `find_tasks` handler already measures both on every call and logs a `warn` line when either is exceeded:

```
find_tasks payload 16204 tokens / 2143 tasks — PLAN.md Phase 10 trigger reached
```

When that line appears in the Render logs, read this phase again. Until then, there is nothing to do. The Mongo query above stays useful for checking by hand.

### Why a number instead of "later"

"Revisit when `$regex` stops being enough" cannot be checked, so it means _never_ or _whenever I feel like it_. A number can be measured, which does two things: it stops the work being built years early, and it stops it being forgotten. In the write-up, "deferred with a documented condition" is an engineering decision; "did not get to it" is not.

### Why the threshold sits there

Below roughly 2,000 tasks the whole list fits comfortably in the model's context, so `find_tasks` answers the question by reasoning and beats embedding similarity on multi-hop queries. Above it, prefill grows slow and expensive while the extra round trip to embed the query stays constant, and retrieval starts winning. Between 2,000 and 5,000 it is close either way; 2,000 is the conservative end.

### What it would look like

- `$vectorSearch` on Atlas — confirmed available. **No second datastore. No Qdrant.**
- `gemini-embedding-001`, `outputDimensionality: 768`. The `embedding` field already exists on `todoSchema` with `select: false`.
- Embed on write, plus a resumable backfill for existing tasks.
- Hybrid ranking: vector for meaning, `$regex`/text for exact tokens like `PR #482`, fused with Reciprocal Rank Fusion.
- Exposed as `search_tasks` — **one more tool the model chooses to call**, with the same interface as `find_tasks`. The prompt does not change and the evals still run, so this is an additive swap, not a rewrite.

**If you want to build retrieval sooner for its own sake, build it in `quizdom-react-app` instead.** That corpus is global rather than per-user, and near-duplicate detection at quiz generation is a problem only embeddings solve. See that repo's `VECTOR-SEARCH-PLAN.md`.

---

## Deferred — not in this plan

- **Telegram.** No public webhook is needed for an in-app chat panel. `AgentService` takes `(userId, chatId, text)`, so a Telegram transport would be a new controller, not a new architecture.
- **Batch task capture.** `parsedTaskBatchSchema` exists but stays unused.
- **AI button in `TodoForm`.** Decided against 2026-09-05 — the Inbox field and the chat panel are sufficient, and a third surface means a third prompt to keep in sync.
- **Scheduled report delivery.** Generation itself is Phase 14 Step 14.10 (open). Emailing or otherwise delivering the generated report is not planned at all yet.

---

## Phase 12 — Portfolio presentation and interview package

**Why:** excellent engineering has little CV value if a reviewer cannot discover the problem, decisions, evidence, and live result quickly.

**Goal (measurable):** the repository front page explains the product and engineering highlights in under two minutes; a reviewer can open a live demo, inspect architecture and API documentation, see CI/coverage evidence, and read concise decision records for the major tradeoffs; prepared CV bullets use truthful measured outcomes.

**Concepts:** technical storytelling, architecture decision records, evidence-based claims, reproducible demos, recruiter skim paths.

**Files and artifacts:**

- `README.md` — hero screenshot/GIF, live links, features, architecture, quick start, tests, security/privacy, AI eval results, and tradeoffs.
- `docs/architecture.md` — one system/context diagram and key request/data flows.
- `docs/adr/` — short ADRs for Firebase Auth, Nest migration, Firebase Storage, shared Zod validation, cursor pagination, and AI provider/privacy decisions. Include two the agent plan already argues in full: **why not n8n** and **why not the Vercel AI SDK**. A third, **why not vector search yet**, is worth writing because declining a technology with measurements is a stronger signal than adopting one.
- Generated OpenAPI endpoint linked from README.
- CI, coverage, deployment, and license badges that point to real evidence.
- A 60–90 second demo script covering sign-in, Inbox quick capture, organization, statistics, and the chat agent.

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

## Phase 14 — Periodic reports: remaining work

Steps 14.1–14.9 shipped: on-demand report generation from Statistics (weekly/monthly/yearly,
no quarterly — narrowed from the original enum), a frozen per-report task snapshot, the
Reports list (search/filter/sort), the report detail page reusing Statistics' chart
components, print/PDF export, and (beyond the original scope) AI-generated report insights
with a fallback model and a per-report generation cap. Only scheduled generation remains.

### Step 14.10 — Scheduled generation from `preferences.reportCadence`

**What to do.** Narrow `REPORT_CADENCES` to `['weekly', 'monthly', 'off']` in `libs/types/src/lib/user-preferences.schemas.ts` (existing stored `'daily'` values should be treated as `'off'` at read time, not migrated in the database). Add a scheduled job (library choice to confirm first — e.g. `node-cron`) that, on a regular tick, finds users whose `preferences.reportCadence !== 'off'` and whose local hour (via `hourInZone`) matches `preferences.deliveryHour`, and calls `ReportsService.generate` for their just-completed period.

**Why.** This is the actual point of `reportCadence`/`deliveryHour` existing on `User` already — automatic generation on the user's own schedule, independent of whether they ever click the manual button.

**What to expect.** `generate`'s existing idempotency guarantee (upsert on `{userId, period, periodStart}`) is what makes "tick every N minutes and check every user" safe — a user whose report already exists for the current period is a no-op, not a duplicate or an error.

**What to learn.** Reusing an idempotent operation as the safety net for a polling/scheduling design, instead of building separate "has this already run" bookkeeping.

**Not in this step.** Emailing or otherwise delivering the generated report — `deliveredAt` can stay `null` here.

---

## Phase 15 — Performance optimization and refactor lab

**Why:** performance work is credible only when it starts from reproducible measurements and proves that a focused change improves user-visible behavior without weakening correctness or maintainability. Exploratory profiling and refactors should remain isolated from production code until independently verified.

**Goal (measurable):** on a dedicated lab branch, establish reproducible Lighthouse, bundle-size, frontend-rendering, and API-latency baselines; identify the highest-impact bottlenecks; prototype focused optimizations or refactors; and record before/after evidence. Do not deploy the lab branch or merge experimental code directly. Promote only independently verified improvements through separate task branches and reviewable pull requests.

**Concepts:** measurement variance, performance budgets, production-build profiling, bundle analysis, React render profiling, network waterfalls, backend latency, memory and query profiling, incremental refactoring, before/after validation.

**Libs/deps:** prefer existing browser and build tooling; add Lighthouse CI or a bundle analyzer only inside the lab when it makes measurements reproducible and remove unused experimental dependencies.

**Lab files and artifacts:**

- `docs/performance/` — environment, dataset, commands, repeated-run results, bottlenecks, and before/after evidence.
- Lighthouse results for the primary authenticated flows against a production frontend build and representative local backend data.
- Bundle analysis for the main application entry points and largest lazy-loaded routes.
- React Profiler evidence for interactions with visible responsiveness problems.
- Backend latency and payload measurements for representative list, image, statistics, and AI endpoints — including the `reports` endpoints from Phase 14, and render profiling of the Statistics page.
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

## Phase 16 — Cypress E2E coverage

**Why:** `apps/todo-e2e` has exactly one spec (`authenticated-smoke.cy.ts`, register → create list →
add task → edit status → delete task → delete list), and both the `e2e` and `e2e-ci` Nx targets
pin `--spec` to that single file. Every other primary flow — sign-in with an existing account,
Inbox quick capture, the AI chat agent (including the delete-confirmation gate), reports, statistics,
settings/preferences, and the vital-task view — has no browser-level coverage at all, so a
regression in any of them would only surface as a unit-test gap or a manual bug report, not a
failed E2E run.

**Concepts:** page-object-free flow testing with `data-testid` selectors, `cy.intercept`/`cy.wait`
for network-dependent assertions, seeding/cleanup via `cy.task` against the real dev Mongo + Firebase
emulator (the pattern `cypress.config.ts` already establishes), test isolation via unique per-run
data instead of shared fixtures.

**Cross-cutting rules for every step below:**

- Follow `authenticated-smoke.cy.ts`'s existing conventions: unique `Date.now()`-suffixed emails/names
  per test, `data-testid`/`aria-label` selectors (never text-only or CSS-class selectors), and a
  `cy.task` cleanup in `afterEach` for anything written to Mongo or Firebase Auth.
- A spec that needs a signed-in user reuses the registration flow from the smoke test (or factors it
  into a shared `cy.task`/custom command in `support/commands.ts` — see Step 16.6) rather than
  duplicating the raw steps inline.
- Add any selector a step needs but doesn't yet find in the component (`data-testid` is present on
  most interactive elements already; a few, like the report/statistics pages, may need one added) —
  note added selectors in the step's report.
- No test may depend on execution order or another spec's leftover data.

### Step 16.1 — Sign-in and session flows

**What to do.** New spec `apps/todo-e2e/src/e2e/auth-session.cy.ts`: register a user (reusing the
smoke test's pattern), log out, then log back in with the same credentials on `/login` and confirm
landing on the authenticated shell. Add a second case for a wrong-password attempt that asserts the
inline error and confirms the user stays on `/login`. Add a third case for the "Forgot password"
link reaching `ForgotPasswordPage` and submitting a reset request.

**Why.** Registration is the only auth path the smoke test exercises; login (the path every returning
user takes) and the failure/reset paths have zero coverage.

**What to expect.** Cleanup mirrors the smoke test: capture `userId`/`firebaseUid` from the
`provisionUser` intercept and delete via `cy.task('cleanupAuthenticatedSmoke', ...)` in `afterEach`.

**What to learn.** Testing the negative path (wrong password) is as important as the happy path —
it's the one most manual testing skips.

**Not in this step.** Password-reset email delivery itself (no real inbox in this environment) —
stop at asserting the request was submitted/acknowledged.

**Done when.** `npx nx e2e todo-e2e --spec=apps/todo-e2e/src/e2e/auth-session.cy.ts` passes locally
against the running dev stack.

---

### Step 16.2 — Inbox quick capture

**What to do.** New spec `apps/todo-e2e/src/e2e/inbox-quick-capture.cy.ts`, against a registered
user: type a free-text line into the Inbox quick-capture input (`QuickCaptureInput`), submit, and
assert the parsed task appears in `InboxSection` (`data-testid="inbox-section"`). Cover the notice/undo
affordance (`noticeTestId`/`undoTestId` in `QuickCaptureInput.tsx`) by capturing right after submit and
clicking undo, asserting the task's name reverts to the original raw text. Cover moving a captured task out of the inbox into a
list via `MoveToListSelect`.

**Why.** Inbox capture is the app's primary "fast add" path (it's what feeds `parseTodoFetcher`/
`AgentService.parseTodo` on the backend) and currently has no E2E coverage despite being the first
thing a new user is likely to use.

**What to expect.** This exercises the same AI-consent gate as the chat agent (`POST /parse-todo`
returns 403 without `preferences.aiConsent`) — the registered test user needs consent enabled first,
either via the Settings UI or a seeded preference, whichever is less brittle to drive through the UI.

**What to learn.** Testing an optimistic-UI affordance (undo) requires asserting the _intermediate_
state, not just the final one — a naive test that only checks the end state would pass even if undo
were silently broken.

**Not in this step.** The full chat agent — that's Step 16.3.

**Done when.** `npx nx e2e todo-e2e --spec=apps/todo-e2e/src/e2e/inbox-quick-capture.cy.ts` passes.

---

### Step 16.3 — AI chat agent, including the delete-confirmation gate

**What to do.** New spec `apps/todo-e2e/src/e2e/agent-chat.cy.ts`. Open the chat panel
(`data-testid="chat-panel-launcher"` → `"chat-panel"`), send a message via `chat-composer-input` /
`chat-composer-send` that creates a task, and assert it appears via `ChatMessageList`. Seed a task,
then send a message asking the agent to delete it, assert a `ProposalCard` renders instead of an
immediate delete, click confirm, and assert the task is actually gone. Add a case where the proposal
is _not_ confirmed (panel closed / different message sent) and assert the task still exists.

**Why.** This is the single most architecturally interesting flow in the app — the
`AGENT_CONFIRM_REPLY_TEXT` two-step confirmation gate discussed in `agent.service.ts` — and it has no
browser-level test proving the UI actually enforces it end-to-end, only backend evals and unit specs.

**What to expect.** The SSE stream means assertions need to wait on the _rendered result_
(`cy.contains(...)` with Cypress's built-in retry) rather than a single network intercept, since the
response arrives as a sequence of `token`/`tool_call`/`proposal`/`done` events over one open
connection.

**What to learn.** E2E-testing a streaming endpoint means asserting on eventual UI state, not on the
transport — trying to `cy.wait()` a single SSE response the way `provisionUser` is awaited in the
smoke test won't work here.

**Not in this step.** The backend eval suite (`agent/evals/`) already covers model-behavior
correctness in isolation; this step only proves the UI wires the confirmation gate correctly, not that
the model chooses the right tool for every phrasing.

**Done when.** `npx nx e2e todo-e2e --spec=apps/todo-e2e/src/e2e/agent-chat.cy.ts` passes, including
the un-confirmed-delete case.

---

### Step 16.4 — Statistics and reports

**What to do.** New spec `apps/todo-e2e/src/e2e/statistics-reports.cy.ts`: seed a user with a handful
of completed/pending tasks across lists, visit the Statistics page and assert the summary
tiles/charts render with non-zero data, then visit Reports, generate a report for the current period,
assert it appears in the reports list, open the report detail page, and assert the frozen snapshot
renders. Add any `data-testid`s missing on `StatisticsPage`/`ReportsPage`/`ReportDetailPage` needed to
select the summary tiles, the generate button, and the report list row.

**Why.** Both pages currently have only component-level `.spec.tsx` tests (mocked data) — nothing
proves the real generate → list → detail round trip works against the live backend and a real Mongo
snapshot.

**What to expect.** Report generation is idempotent per `{userId, period, periodStart}` (Phase 14), so
re-running this spec against leftover data from a prior failed run should not error — but still clean
up generated reports in `afterEach` to keep runs isolated.

**What to learn.** Testing a page whose data depends on prior actions (tasks must exist and be
completed before a report is meaningful) means the spec's setup section is doing as much work as its
assertions — arranging valid state is often the harder half of an E2E test.

**Not in this step.** Print/PDF export — assert the export control is present and enabled, not the
resulting file contents (Cypress can't easily inspect a downloaded PDF).

**Done when.** `npx nx e2e todo-e2e --spec=apps/todo-e2e/src/e2e/statistics-reports.cy.ts` passes.

---

### Step 16.5 — Settings and preferences

**What to do.** New spec `apps/todo-e2e/src/e2e/settings-preferences.cy.ts`: visit Settings, toggle
AI consent, change theme (`AppearanceSection`) and assert the applied theme class/attribute, change
timezone (`TimezoneField`) and assert it persists across a reload, and toggle report cadence. Assert
each change survives a page reload (i.e. actually persisted server-side via `usePreferences`, not just
local component state).

**Why.** Preferences gate several other features (AI consent gates both quick-capture and chat;
timezone affects `dueDateOffsetDays`-style date logic throughout the backend) but nothing currently
proves a preference change made through the UI actually round-trips to the server and back.

**What to expect.** Reload-then-reassert is the key technique here — it's the only way to
distinguish "the UI updated optimistically" from "the change actually persisted."

**What to learn.** For any settings/preferences UI, the meaningful assertion is post-reload, not
immediately after the click.

**Not in this step.** Every individual preference field — cover the ones that gate other tested
features (AI consent, timezone) plus one purely cosmetic one (theme) as a representative sample.

**Done when.** `npx nx e2e todo-e2e --spec=apps/todo-e2e/src/e2e/settings-preferences.cy.ts` passes.

---

### Step 16.6 — Shared auth helper and CI wiring

**What to do.** Extract the registration-and-login boilerplate duplicated across Steps 16.1–16.5 into
a `cy.task` (e.g. `provisionTestUser`) or a real custom Cypress command in `support/commands.ts`
(replacing the unused boilerplate `login` command already stubbed there), so each spec's setup is one
call instead of a copy-pasted `cy.visit('/login')` block. Update `project.json`'s `e2e` and `e2e-ci`
targets, and `package.json`'s `test:e2e` script, to run the full `src/e2e/**/*.cy.ts` glob instead of
pinning `--spec` to `authenticated-smoke.cy.ts` alone. Add `test:e2e:agent`/similar if CI needs to keep
a fast subset separate from the full suite.

**Why.** Without this, every future spec keeps re-deriving the same registration flow, and CI silently
never runs anything added in Steps 16.1–16.5 because `e2e-ci` is still hardcoded to one file.

**What to expect.** Refactoring `authenticated-smoke.cy.ts` itself to use the new helper is in scope
here, to prove the extraction didn't change its behavior.

**What to learn.** A test suite's own DRY debt (duplicated setup) is exactly as real as production
code's, and a CI target that pins `--spec` to one file is a silent coverage gap — the kind that
doesn't show up as a failure, only as work nobody knew wasn't running.

**Not in this step.** Parallelizing or sharding the suite in CI — only make sure everything actually
runs.

**Done when.** `npx nx e2e todo-e2e` (no `--spec` override) runs every spec in `src/e2e/` and all pass;
`e2e-ci`'s config no longer references a single hardcoded file.

---

## Phase 17 — Agent hardening: close the known gaps

**Why:** four weaknesses in the agent are known and documented but still open — a repeated
create request duplicates tasks, the "ask when ambiguous" rule for updates is only a prompt
instruction, the session `version` counter is incremented but never checked, and the eval
pass rate (81.8%, 18 of 22, last recorded run) is under the 90% target. Each one is a question
an interviewer reading the code will ask. Close them one at a time, each with a test that
fails before the change.

**Concepts:** idempotency keys, structural gates versus prompt instructions, optimistic
concurrency, eval-driven prompt changes.

### Step 17.1 — Idempotency key for agent messages

**What to do.** Add an optional `messageId` (client-generated UUID) to `agentMessageInputSchema`.
The chat hook generates one per `send` call and reuses it if the same message is retried. On the
server, record the `messageId` of each handled message on the `AgentSession`; when a request
arrives with a `messageId` already recorded, do not run the tool loop again — reply with the
stored assistant turn for that message.

**Why.** `createTasks` has no duplicate protection: the same create request delivered twice
(a network retry, a double submit from two tabs) creates the tasks twice. Today only the
one-stream-at-a-time UI and the per-user throttle stand in the way, and neither is a guarantee.

**What to expect.** The record-and-check must be one atomic write (`findOneAndUpdate` with the
`messageId` absent in the filter), the same pattern `consumeConfirmation` already uses —
a read followed by a write would reintroduce the race it is meant to close.

**What to learn.** An idempotency key turns "at least once" delivery into "effectively once":
the client may send twice, the server acts once.

**Files.** `libs/types/src/lib/agent.schemas.ts`, `apps/todo-be/src/app/models/agent-session.model.ts`,
`apps/todo-be/src/agent/agent-session.service.ts`, `apps/todo-be/src/agent/agent.controller.ts`,
`apps/todo/src/app/hooks/useAgentChat.ts`, `apps/todo/src/app/fetchers/agent.ts`, and their specs.

**Not in this step.** Idempotency for the plain REST `POST /todos` endpoint or for `parse-todo`.

**Done when.** A new integration test sends the same create message twice with one `messageId`
and asserts the tasks exist once; the existing agent specs still pass.

### Step 17.2 — Structural ambiguity gate for `update_task` and `complete_task`

**What to do.** Make "more than one plausible match" a server-side outcome instead of a prompt
rule. When the model calls `update_task` or `complete_task` on a task it located through
`find_tasks` in the same request, and that search left several close candidates, return
`{ ok: false, reason: 'clarification_required', candidates }` instead of executing. Confirm the
candidate-matching rule with Kate before coding it — it must be deterministic (for example,
case-insensitive name overlap), not another model call.

**Why.** `docs/AGENT-ARCHITECTURE.md` already records that the prompt instruction "does not
reliably hold" for updates (eval case `ambiguous-update-target`). Delete is safe only because its
confirmation gate re-asks regardless; update and complete have no such gate.

**What to expect.** The session model already has a `pendingClarifications` field that nothing
writes yet — check whether it fits before adding a new one.

**What to learn.** A rule the model is asked to follow is a request; a rule the server enforces
is a guarantee. Move a rule from the prompt into code when a wrong action costs the user data.

**Files.** `apps/todo-be/src/agent/agent-tools.service.ts`, `apps/todo-be/src/agent/agent.service.ts`,
`apps/todo-be/src/agent/agent.tools.ts`, `apps/todo-be/src/agent/agent.prompt.ts` (bump
`PROMPT_VERSION`), and their specs; update the "What the confirmation gate does not cover"
section of `docs/AGENT-ARCHITECTURE.md`.

**Not in this step.** Semantic or vector matching (Phase 10), and any change to `delete_task`.

**Done when.** A unit test shows an update against two similarly named tasks returns
`clarification_required` and writes nothing; eval cases 13 and 14 pass.

### Step 17.3 — Use the session `version` counter, or remove it

**What to do.** `AgentSession.version` is incremented on every write, and its doc comment says
it exists "so interleaved messages cannot clobber state", but no query ever filters on it.
Either make `appendTurns` conditional on the `version` read at the start of the request (and
decide what a conflict does — retry the append against the fresh document, since turns are
append-only), or delete the field and its comment. Decide with Kate which before starting.

**Why.** Two tabs on the same chat can each read the turn window, run a request, and append —
the stored history then interleaves in an order neither tab saw. A counter that is written but
never read claims a protection the code does not provide.

**What to expect.** `$push` itself is atomic, so turns are not lost — the risk is ordering and a
request that ran against stale context, not corruption.

**What to learn.** Optimistic concurrency: read a version, write only if it is unchanged, and
handle the conflict explicitly.

**Files.** `apps/todo-be/src/agent/agent-session.service.ts`,
`apps/todo-be/src/app/models/agent-session.model.ts`, `apps/todo-be/src/agent/agent.controller.ts`,
and their specs.

**Not in this step.** Cross-tab UI synchronisation on the frontend.

**Done when.** Either a test proves a stale-version append is detected and handled, or the
field, its `$inc` calls and its comment are gone and all specs pass.

### Step 17.4 — Raise the eval pass rate to the 90% target

**What to do.** Run `npm run eval:agent` and record which of the 22 cases fail, with the model
and `PROMPT_VERSION`. Fix the failures one cause at a time — after Steps 17.1–17.2, since the
ambiguity gate should turn cases 13 and 14 from prompt-dependent into structural. Re-run after
each prompt change and keep the per-case results.

**Why.** The README states the 81.8% pass rate against a 90% target and points to "PLAN.md
Phase 9", which has since been trimmed from this document. This step is where that open item
now lives.

**What to expect.** The production model's free tier allows 20 requests a day, so a full run
uses most of a day's quota; local runs use `gemini-3.1-flash-lite`. Record which model each
result came from.

**What to learn.** Change one thing, re-measure, keep the evidence — a pass rate is only
meaningful next to the prompt version and model that produced it.

**Files.** `apps/todo-be/src/agent/agent.prompt.ts`, `apps/todo-be/src/agent/evals/cases/*`
(only to add cases, never to weaken an expectation), `README.md` (the pass-rate line and the
"Phase 9" pointer), `docs/AGENT-ARCHITECTURE.md`.

**Not in this step.** Switching model or provider to gain points.

**Done when.** A recorded run shows at least 20 of 22 cases passing, and the README's pass rate,
prompt version and phase pointer match that run.

---

## Phase 18 — Today page, Inbox and add-task fixes — **Status: URGENT**

**Why:** a real user added a task on the dashboard and could not find it. It had gone to the
Inbox, which the dashboard did not make visible, and nothing told her whether lists are required.
Her words: "I add it and it doesn't show up, and it isn't intuitive that it's in Inbox... or are
lists an optional extra?" This is a bug in what the app shows after an action, so it comes
before the onboarding tour (Phase 19) and before the remaining polish and stretch work.

**Decisions (Kate, 2026-10-06):**

- The dashboard becomes a Today page (Step 18.1). It has no add form: tasks are added on the
  Tasks page only, and the Today page links there.
- Lists are optional. A task without a list goes to the Inbox, and the Inbox is the default.
- Whatever the user adds must be visible straight away: the page scrolls to it and selects it.
- The Inbox appears on the Today page as a clear, separate section (read-only there).
- New tasks start as "Not Started", not "In Progress". Second user report: "a task added outside
  a list is marked as in progress". The stored status values are renamed so the code says what
  the user sees (Step 18.4).

**Concepts:** feedback after an action, sensible defaults, one job per page, naming that matches
behaviour, data migrations.

### Step 18.1 — Turn the dashboard into a Today page with no task input

**Decisions (Kate, 2026-10-06).** The dashboard had no single job: it mixed a completion ring, a
top-priority panel, status donuts for a selected day, a week strip, today's tasks and completed
tasks. Kate's words: "I don't see any value and it is not obvious at all what I see and why."
The page now answers one question, "What do I need to do now?". The status section stays. The
week strip goes. Tasks can be completed on the page. The navigation label stays "Dashboard" and
the page itself says "Today". The page uses the existing palette to highlight what matters.

**What to do.**

1. Remove `QuickAddInbox` and its `QuickCaptureInput` from `DashboardPage`.
2. Rebuild the page around four blocks, each with a plain title:
   - A header band titled "Today" with one progress line ("3 of 7 done today"), a progress bar
     and a message that follows the day. It does not repeat the date.
   - A main column with a read-only Inbox panel (it lists Inbox tasks and links to the Tasks
     page) and, under it, "Due today": every task due today, unfinished first, then by
     priority, completed ones shown ticked. On desktop it shows as many rows as its
     height allows (measured with `useFittingItemCount`), with previous and next arrows, so
     the page does not scroll.
   - A side column with "Today's status" (the three donuts, fixed to today) and "Overdue":
     tasks due before today that are not completed, oldest first, each showing how late it is.
     It shows four at a time with previous and next arrows, and is hidden when there are none.
3. Keep the Top Priority panel (high-priority tasks due today) under the header band; Kate
   asked for it back. Remove the completion ring, the Completed panel and the week strip.
4. Let the user mark a task completed, and undo it, from the "Overdue" and "Due today" rows.
5. Add one "Add task" button to the header band. It navigates to `/tasks` with a location state
   that opens the add-task form, the same way `openCreateList` opens the list form. There is no
   add form on the Today page.
6. On the Tasks page, add one header "Add task" button that opens the add form for the Inbox,
   and remove the Inbox section's own "+" button. Quick capture and the per-list "+" buttons
   stay (Kate chose this narrow reading); Step 18.2 turns the form into one with a list picker.
7. In `TopHeader.tsx`, show the date as "Tuesday, 06 October 2026" in the user's language. Build
   it from `Intl.DateTimeFormat(...).formatToParts` so the order stays day, month, year in every
   locale and the month keeps its grammatical form (Ukrainian "06 жовтня 2026").

Colour and mood, using only tokens that already exist in `tailwind.config.js`:

- **Header (the mood block).** A dark band (`bg-sidebar`, `text-sidebar-text`) with the title
  "Today", the progress line and a progress bar in `accent`. Its message follows the day: overdue tasks
  ("2 overdue — start there"), work left ("4 to go"), or all done. When everything due today is
  completed, the band switches to `bg-accent` with `text-on-accent`.
- **Overdue.** The only warning block: a `danger` left border, a light `bg-danger/10` tint and a
  `text-danger` title.
- **Due today.** Stays a neutral `surface` card, because it is the working area. Each row gets a
  left border in its priority colour (`priority-high-bg`, `priority-medium-bg`, `priority-low`),
  as the Top Priority cards do today.
- **Today's status.** The donuts keep the `status-complete`, `status-progress` and `status-open`
  colours.
- **Inbox.** Icon and count in `notification-dot`, matching the Inbox on the Tasks page.
- **Add task button.** `accent` with `on-accent` text.

Keep it to two strongly coloured blocks (header and Overdue) so a highlight still means
something. Do not add colour tokens or hex values; if the palette cannot express a state, stop
and ask Kate. Check contrast in the light and dark themes.

**Why.** Adding a task on a page that does not show tasks is the root of the first user report,
and a page that repeats two other pages gives no reason to open it. Overdue tasks were not shown
anywhere on the dashboard.

**What to expect.** `QuickCaptureInput` is also used in the Inbox section of the Tasks page;
remove only the dashboard usage. Split the new blocks into their own components instead of
growing `DashboardPage.tsx`. The date store (`useDateStore`) only served the week strip. The
statuses still have their old names here; Step 18.4 renames them.

**What to learn.** A page earns its place by answering one question; removing a block is a
design decision, not a loss.

**Files.** `apps/todo/src/app/component/pages/DashboardPage.tsx`, `DashboardPage.spec.tsx`,
`DashboardSkeleton.tsx`, new components under `apps/todo/src/app/component/dashboard/`,
`apps/todo/src/app/component/pages/TasksPage.tsx`, `TasksPage.spec.tsx`,
`apps/todo/src/app/component/todo/InboxSection.tsx`, `TodoItem.tsx`,
`apps/todo/src/app/component/elements/TopHeader.tsx`, small helpers in `apps/todo/src/app/lib/`,
`apps/todo/src/app/hooks/useTodoListsData.ts`, `apps/todo/src/app/store/dateStore.ts`, their
specs, and the three locale files in `apps/todo/src/app/i18n/locales/`.

**Not in this step.** Onboarding, the list picker and form defaults (Step 18.2), scrolling to a
new task (Step 18.3), editing or deleting tasks on the Today page, or new statistics.

**Done when.** Tests show: the dashboard renders no task input; an overdue task appears under
"Overdue" and not under "Due today"; tasks due today are ordered unfinished first, then by
priority; the progress line and the donuts count the same tasks; completing a task from a row
calls the toggle with the completed status; the header band shows the overdue, in-progress,
all-done and empty messages for the matching data; the Inbox panel renders Inbox tasks; the
"Add task" button navigates to the Tasks page, which opens the add form; the Tasks page has one
header add-task button and the Inbox section has none; `TopHeader` shows "06 October 2026" for
6 October 2026 in English. The diff adds no hex colour and no new colour token.
`pnpm nx test todo` passes. Kate reviews the colours by eye in both themes.

### Step 18.2 — Sensible defaults in the add-task form: Inbox, priority and today

**What to do.** In the add-task form, show the target list explicitly, with "Inbox" selected by
default and a short hint such as "No list needed — tasks without a list go to Inbox." Show the
priority and due date fields in the form without opening "More options". Preselect today's date
and a priority (Medium unless Kate says otherwise), and pass the chosen priority through the
create call. The form has no priority field today, and the task creation helpers in
`useTodoListsData.ts` do not accept one.

**Why.** It answers "are lists optional?" at the moment the user is deciding.

**What to learn.** Show the default instead of explaining it later.

**Files.** `apps/todo/src/app/component/todo/` (the add-task form, `TodoForm.tsx`, and
`MoveToListSelect.tsx` if it fits), `apps/todo/src/app/hooks/useTodoListsData.ts`,
`apps/todo/src/app/component/pages/TasksPage.tsx`, locale files, and their specs.

**Not in this step.** Changing the data model or the Inbox API.

**Done when.** A test shows the form defaults to Inbox, today's date and the default priority,
and a task added without changing them lands in the Inbox with that date and priority.

### Step 18.3 — Scroll to and select the task that was just added

**What to do.** After a task is added, scroll the list or Inbox containing it into view and mark
the new task as selected. Do this for both an Inbox task and a task added to a list. Respect
`prefers-reduced-motion` (jump instead of smooth scroll).

**Why.** The user must see the result of the action. This is the feedback the original report
was missing.

**What to expect.** `TasksPage` already has `selectedTask` state and a `useRef`; reuse them
before adding new state. Make sure an active list filter or collapsed section cannot hide the new
task.

**What to learn.** Feedback after an action: the interface confirms what happened and where.

**Files.** `apps/todo/src/app/component/pages/TasksPage.tsx`,
`apps/todo/src/app/component/todo/InboxSection.tsx`, `apps/todo/src/app/component/todo/TodoLists.tsx`,
and their specs.

**Not in this step.** Toasts, onboarding, or any change on the dashboard.

**Done when.** Tests show that adding to the Inbox and adding to a list each select the new task
and call `scrollIntoView` on it.

### Step 18.4 — Rename task statuses and default new tasks to Not Started

**What to do.** Replace the stored `TodoStatus` values: `failed` → `not_started`,
`pending` → `in_progress`, `successful` → `completed`. Make `not_started` the default for every
new task, whether it is created in a list, in the Inbox, through quick capture, or through the
agent. Then:

1. Change the type, Zod schemas, Mongoose enums and default in `libs/types` and
   `apps/todo-be/src/app/models/`, including the report model if it stores these values.
2. Update every reader and writer of the old values: the backend services, the agent tools,
   prompt and eval cases, the dashboard and statistics code, the task components, and the
   translation keys (`tasks.status_*`), so keys and values share the same names.
3. Add `apps/todo-be/src/migrations/003-rename-statuses.ts`, in the style of `002-indexes.ts`:
   idempotent, with `--database` and `--dry-run`, mapping the old values to the new ones in
   `todos` (and in `reports` if they store statuses), and printing the counts it would change.
4. Update the unit, integration and Cypress tests that use the old values.

**Why.** Today `failed` is shown as "Not Started" and `pending` as "In Progress", so a new task
(default `pending`) looks started and the code contradicts the UI. Statuses named after what the
user sees are testable and stop the next reader guessing.

**What to expect.** This is the largest step in the phase (about 60 files match the old values;
many matches are tests). It cannot be split without leaving the app broken between sessions,
because the frontend and backend must agree on the values. Not every match is a task status:
check each one, since words like `pending` also appear for confirmations and the Pomodoro timer.
Existing tasks keep their meaning through the mapping, so tasks that are "In Progress" only
because it used to be the default stay as they are; they cannot be told apart from tasks the user
really started.

**Production data — Kate runs this, not Claude.** The migration must never be run against
production by the executor; hand Kate the dry-run and real commands. Decide with Kate the rollout
order. Old code does not understand the new values and new code does not understand the old, so
there is a short window between the deploy and the migration. For a solo app, deploy and run the
migration back to back.

**What to learn.** A data migration is a deliberate, reversible, auditable step, and a name that
disagrees with the UI is a bug waiting to happen.

**Files.** `libs/types/src/lib/todo.types.ts`, `todo.schemas.ts`, `report.schemas.ts`;
`apps/todo-be/src/app/models/todo.model.ts`, `report.model.ts`; the backend, agent, report and
user services that match the old values; the frontend files that match them (search the three
old values, and `status_pending` / `status_successful` / `status_failed`); the three locale
files; `apps/todo-be/src/migrations/003-rename-statuses.ts` and its spec; the E2E specs in
`apps/todo-e2e/src/e2e/`; and `docs/AGENT-ARCHITECTURE.md` if it names the values.

**Not in this step.** Adding new statuses, changing what each status means, or editing
conversation text already stored in agent sessions.

**Done when.** `grep` finds no remaining `'pending'`, `'successful'` or `'failed'` used as a task
status in `apps` or `libs`; a test shows a task created with no status is `not_started` through
the REST API, quick capture and the agent; the migration spec shows the mapping, a second run
changing nothing, and `--dry-run` writing nothing; lint, typecheck, `pnpm nx test` for the
affected projects and the production builds pass.

---

## Phase 19 — Guided onboarding tour

**Why:** the app does not say what to do first. A new user lands on an empty home page with
nothing pointing to the Tasks page or explaining the Inbox. Phase 18 fixes the confusing
behaviour and gives the home page one job; this phase adds the guidance. It starts after it,
because the tour points at the Today page, its Inbox panel, the single "Add task"
button and the Inbox default.

**Concepts:** empty states, progressive disclosure, first-run flows.

### Step 19.1 — Guided onboarding tour

**What to do.** Add a first-run tour with notes and arrows: "This is your Today page", "This is
where your tasks live", "Create your first task". Show it once to a new user, store that it was
seen, and add a way to replay it from Help or Settings. The tour's last stop is the "Add task" button on the Today page.

**Why.** The app needs to say what to do first. Kate chose a guided tour over a static
instruction block.

**What to expect.** **Decided (Kate, 2026-10-06): use `driver.js`** (MIT, about 5 KB gzipped,
framework-free). Load it with a dynamic `import('driver.js')` only when the tour is about to
show, so users who have seen the tour never download it. Style its popover through custom class
names using Tailwind theme tokens; do not add colors outside `tailwind.config.js`. Check the
production build output and record the size added. Where the "seen" flag is stored (a
`preferences` field on the server, or local storage) still needs Kate's decision. The tour must
be keyboard-accessible and skippable, and must work on mobile layouts.

**What to learn.** First-run experience design, and when a server-side flag is worth more than
local storage.

**Files.** To be fixed after the storage decision. Add `driver.js` to `package.json`. Expect new files in
`apps/todo/src/app/component/onboarding/`, `DashboardPage.tsx`, `TasksPage.tsx`, `HelpPage.tsx`,
locale files, and a `libs/types` change if the flag is stored on the server.

**Not in this step.** Per-feature tooltips beyond the three tour stops.

**Done when.** A test shows the tour appears for a new user, can be skipped, does not reappear
after being seen, and can be replayed; the Cypress journey in Step 16.2 is updated if the tour
changes its first screen.

---

## Stretch roadmap — only after the core plan

Semantic search is covered in full by Phase 10 above, not repeated here. AI-generated
productivity insights shipped as part of Phase 14 (report narratives).

### Suggested subtasks and metadata

- Generate an optional, expandable checklist of suggested steps for a vital task; never persist generated steps without confirmation.
- Suggest category and priority after a debounce through a dedicated AI endpoint; show confidence in a dismissible UI and require acceptance.
- Prefer a deterministic rule-based fallback for obvious cases.

### Notifications

**Decided 2026-09-04: no Firestore.** This project uses MongoDB Atlas, Firebase Auth, and Firebase Storage. Firestore would be a fourth datastore added for one feature, with its own security-rule surface to maintain. Use what is already here — a due-today/overdue query on the existing `{ userId, dueDate }` index, polled by the client or pushed over the SSE channel the agent already introduces.

- Generate notifications idempotently; a task must not notify twice for the same day.
- Respect `preferences.timezone` for "today" and `preferences.deliveryHour` for timing.
- Add background delivery only when it is actually required, not before.

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
- The task agent meets its documented eval, latency, privacy, and fallback requirements.
- README, diagrams, ADRs, metrics, screenshots, and demo links make all major claims verifiable.
- The repository contains no secrets, dead experimental dependencies, obsolete auth path, or contradictory active plans.
