# Todo List Application

A full-stack task-management application built in an Nx workspace with React, NestJS, MongoDB, Firebase Authentication, and Firebase Storage.

The app supports authenticated, user-scoped task management; rich todo and list metadata; dashboard and statistics views; periodic, printable reports with optional AI-generated insights; image attachments; and English, German, and Ukrainian UI translations.

## Install and run

After creating the required `.env` file, install dependencies and start MongoDB, the Firebase emulators, the backend, and the frontend:

```bash
npm install
npm run all
```

Open the app at `http://localhost:4200`. See [Prerequisites](#prerequisites) and [Environment variables](#environment-variables) if this is your first local setup.

### Backend-only via Docker

`docker-compose.yml` at the repo root runs MongoDB and the backend as containers — no local Node or MongoDB install needed for the API:

```bash
cp .env.example .env   # fill in Firebase/Gemini values
docker compose up
```

The backend is then live at `http://localhost:3333` (`/api/health/ready` should report `{"status":"ok","mongo":"connected"}`). This does not containerize the frontend or the Firebase emulators — start those separately with `npm run serve:fe` and `npm run emulator` if you need the full app, not just the API. If the Firebase Auth emulator is running on the host while the backend runs in this container, the compose file already points `FIREBASE_AUTH_EMULATOR_HOST` at `host.docker.internal` so the container can reach it.

## Local services

| Service                     | URL                              |
| --------------------------- | -------------------------------- |
| Frontend                    | `http://localhost:4200`          |
| Backend                     | `http://localhost:3333`          |
| Swagger UI                  | `http://localhost:3333/api-docs` |
| Firebase Emulator UI        | `http://localhost:4000`          |
| Firebase Auth emulator      | `http://localhost:9099`          |
| Firebase Storage emulator   | `http://localhost:9199`          |
| MongoDB (optional, offline) | `mongodb://localhost:27017`      |
| mongo-express (optional)    | `http://localhost:8081`          |

The backend connects to a `todo_dev` database on MongoDB Atlas by default, not to
the Docker stack. Atlas Vector Search is unavailable in the MongoDB Docker image,
so features that rely on it only work against Atlas. The Docker stack in
`tools/mongodb/` remains available for offline work — switch `MONGODB_URI` to the
commented local line in `.env` to use it.

Tests are unaffected either way: they run against `mongodb-memory-server` and
never reach the network.

You can also start services separately:

```bash
npm run docker:mongodb   # only when working offline
npm run emulator
npm run serve:be
npm run serve:fe
```

## Current status

### Shipped

- Email/password and Google authentication through Firebase Auth.
- Firebase password-reset flow and configurable local/session login persistence.
- MongoDB user profiles provisioned from Firebase identities.
- Server-enforced user isolation for todo lists, todos, and statistics.
- Todo-list CRUD with priority, category, due date, notes, and sorting.
- Todo CRUD with status, due date, location, notes, completion date, and image attachment.
- Direct image uploads to Firebase Storage with client-side resizing and compression.
- Dashboard with date selection, task-status charts, recently completed tasks, a daily-focus week strip, a completion ring scoped to tasks due that day, a Top Priority panel, and an Inbox quick-add.
- Inbox support for tasks without a list, with flat and grouped task views and keyboard-accessible reordering and move-to-list controls.
- Vital Tasks view scoped to in-progress todos on high-priority lists, sharing the same list UI as the Tasks page.
- Optional local Pomodoro focus timer on Vital Tasks with an adjustable, click-to-edit duration, and phase-completion alerts (sound, OS notification, and an in-app banner that always shows alongside it).
- Restrained urgency styling for tasks due within four hours that respects reduced-motion preferences.
- Consistent skeleton loading states across the dashboard, tasks, and vital tasks pages, and the initial auth-loading app shell.
- Statistics view with week/month/year filtering, status breakdowns, time series, weekday activity, and category charts.
- Periodic reports (weekly, monthly, yearly): an explicit "Generate Report" action from Statistics freezes a snapshot of that period's tasks into an immutable, named document; the Reports page lists past reports, searchable by name and filterable/sortable by period and date; the detail page reuses Statistics' chart components against the frozen snapshot, so editing or deleting a task afterward never changes an already-generated report. Reports can be printed or saved as a PDF via a dedicated print stylesheet that hides all app chrome.
- Optional AI-generated report insights (Gemini): a structured summary plus Problems/Why/Try bullet sections grounded only in the report's own numbers, gated by the same AI-assistance consent as the chat agent, capped at 2 generations per report, and backed by a configurable fallback model for when the primary model is overloaded.
- An in-app notification bell that queues a "report ready" entry (read/unread state, deep link to the report) when generation finishes, instead of interrupting the Statistics page.
- Responsive authentication screens and a shared application shell.
- English, German, and Ukrainian translations.
- Backend unit/integration coverage, frontend component and hook tests, and an authenticated Cypress smoke flow.
- GitHub Actions checks for lint, typecheck, unit tests, coverage collection,
  production builds, and the authenticated Cypress smoke flow.
- Security headers, CORS policy, configurable rate limiting on auth routes,
  structured JSON request logging with request IDs and redaction, bounded
  cursor pagination for todo lists, and liveness/readiness health checks.
- A conversational task agent (Gemini, tool-calling) exposed as a chat panel: create, update,
  complete, delete, list, and find tasks through natural language, with relative-date and
  priority inference, a confirmation gate on deletes, consent gating, per-user rate limiting,
  and no user content in logs. Voice input via the Web Speech API. See
  [`docs/AGENT-ARCHITECTURE.md`](docs/AGENT-ARCHITECTURE.md).
- Inbox quick capture: typing a task with an inline due date and/or priority parses and fills
  those fields automatically via one Gemini call, without blocking task creation on the
  network.
- A 22-case deterministic eval harness (`npm run eval:agent`) scoring the agent's tool calls
  against fixed cases, covering creation, relative dates, priority inference, fuzzy
  updates/deletes, ambiguous targets, adversarial and off-topic input, and edge cases —
  current baseline in `docs/PLAN.md` Phase 9.
- A Settings page for appearance (theme) and preferences: timezone, AI-assistance consent,
  and report cadence/tone fields (not yet wired to a scheduler — see below).

### Not yet complete

- The Help route currently contains placeholder content.
- Scheduled/automatic report generation: `preferences.reportCadence` and `deliveryHour` exist
  and are editable in Settings, but nothing currently reads them — reports are generated only
  by the explicit "Generate Report" action.
- Frontend test coverage is not yet comprehensive or threshold-enforced project-wide.
- API documentation is generated from the NestJS application and served with Swagger UI.
- Firebase Storage reads are public; writes are restricted to the authenticated user's path.
- The agent's eval pass rate (81.8% as of the last recorded run) is below the 90% target;
  see `docs/PLAN.md` Phase 9 for the specific failure categories.

[`docs/PLAN.md`](docs/PLAN.md) is the source of truth for shipped status, planned work, priorities, and acceptance criteria.

## Architecture

```text
React frontend
  ├─ Firebase Auth ───────────── email/password + Google sign-in
  ├─ Firebase Storage ───────── direct image upload/delete
  └─ Axios + Firebase ID token
             │
             ▼
NestJS REST API
  ├─ Firebase Admin ─────────── token verification
  ├─ guards ─────────────────── MongoDB profile lookup + ownership check
  ├─ injectable controllers/services
  ├─ AgentService ───────────── Gemini tool-calling loop (SSE)
  └─ injected Mongoose models
             │
             ▼
MongoDB ─────────────────────── users, todo lists, todos, image URLs, agent sessions
```

The browser authenticates with Firebase and attaches the current ID token to API requests. The backend verifies that token, resolves the corresponding MongoDB profile, and rejects requests whose `:userId` does not match the authenticated user.

Images follow a separate path: the frontend compresses the selected file, uploads it directly to `todos/{firebaseUid}/...` in Firebase Storage, and stores the resulting download URL on the todo document.

The agent never touches MongoDB directly — every tool call is validated and routed through the same `TodoService` the REST API uses, so ownership checks apply automatically. See [`docs/AGENT-ARCHITECTURE.md`](docs/AGENT-ARCHITECTURE.md) for the trust boundary, the confirmation gate on deletes, and rate-limit/retention details.

## Tech stack

### Frontend

- React 18 and React Router 7
- TanStack React Query 5
- Zustand
- React Hook Form and Zod
- Tailwind CSS 3
- Recharts
- react-i18next
- Firebase JS SDK
- Webpack/Babel through Nx 17

### Backend

- Node.js 20 and NestJS 10
- Mongoose 7 and MongoDB
- Firebase Admin SDK
- `@google/genai` (Gemini) for the conversational agent and Inbox parsing
- Generated OpenAPI with Swagger UI

### Tests and delivery

- Jest, Supertest, and `mongodb-memory-server`
- Cypress
- GitHub Actions
- Render backend configuration
- Vercel frontend deployment
- MongoDB Atlas and Firebase

## Repository structure

```text
todo-list/
├── apps/
│   ├── todo/                         # React frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── component/
│   │       │   │   ├── auth/         # Login, registration, password reset
│   │       │   │   ├── elements/     # Shared UI and application shell (incl. notification bell)
│   │       │   │   ├── pages/        # Dashboard, Tasks, Vital, Statistics, Reports, Settings, Help
│   │       │   │   ├── settings/     # Appearance and preferences form
│   │       │   │   ├── statistics/   # Chart sections and statistics helpers (reused by report detail)
│   │       │   │   └── todo/         # Forms, lists, cards, detail/edit panel
│   │       │   ├── fetchers/          # REST queries and mutations
│   │       │   ├── hooks/             # Todo-list orchestration, Pomodoro timer, reduced-motion
│   │       │   ├── i18n/              # en/de/uk locales
│   │       │   ├── lib/               # API client, Firebase, image uploads, Pomodoro sound/notifications
│   │       │   └── store/             # Auth, selected-date, and in-app notification state
│   │       └── environments/
│   ├── todo-be/                       # NestJS/Mongoose API
│   │   └── src/
│   │       ├── agent/                  # Gemini tool-calling loop, tools, evals, report-narrative prompt
│   │       ├── auth/                  # Profile endpoints and Firebase guards
│   │       ├── common/                # Decorators, pipes, filters, errors
│   │       ├── integrations/firebase/ # Injectable Firebase Admin provider
│   │       ├── reports/                # Report generate/list/get + AI-narrative endpoints
│   │       ├── todo/                   # Nested todo controller/service/module
│   │       ├── todolist/               # Todo-list controller/service/module
│   │       └── user/                   # Statistics, preferences, and profile controllers/services
│   └── todo-e2e/                      # Cypress specifications
├── libs/types/                        # Shared TypeScript types and Zod schemas
├── tools/mongodb/                     # MongoDB + mongo-express Compose stack
├── docs/
│   ├── PLAN.md                        # Authoritative phased implementation plan
│   └── AGENT-ARCHITECTURE.md          # Agent data flow, trust boundary, retention
├── firebase.json                      # Auth/Storage emulator configuration
├── storage.rules
└── render.yaml
```

## Prerequisites

- Node.js 20.x
- npm 9.3.1 or newer
- Docker with Docker Compose
- Firebase CLI available as `firebase`
- A Firebase project for non-emulated authentication/storage

## Environment variables

Create `.env` in the repository root (`.env.example` documents every key with placeholders). Never commit real credentials.

```dotenv
# Runtime
NODE_ENV=development
PORT=3333
NX_API_URL=http://localhost:3333/api

# MongoDB — the database name is the path segment of the URI.
# Local development uses a `todo_dev` database on MongoDB Atlas, because
# Atlas Vector Search does not exist in the Docker image. Swap in the
# commented line to work offline against the Docker stack instead.
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/todo_dev?retryWrites=true&w=majority
# MONGODB_URI=mongodb://root:password@localhost:27017/todo?authSource=admin

# Firebase client configuration
NX_FIREBASE_API_KEY=
NX_FIREBASE_AUTH_DOMAIN=
NX_FIREBASE_PROJECT_ID=
NX_FIREBASE_STORAGE_BUCKET=
NX_FIREBASE_MESSAGING_SENDER_ID=
NX_FIREBASE_APP_ID=

# Firebase Admin credentials used by the backend
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=""

# Route Firebase Admin authentication calls to the local emulator
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# API hardening (all optional in development; CORS_ORIGIN is required when NODE_ENV=production)
CORS_ORIGIN=
LOG_LEVEL=info
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=300
AUTH_THROTTLE_TTL_MS=60000
AUTH_THROTTLE_LIMIT=10

# Conversational agent (Gemini) — required only if a user enables AI assistance
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
# Used for the report-narrative call when GEMINI_MODEL is overloaded (429/503)
# and retries on it are exhausted. Defaults to GEMINI_MODEL's value when unset.
GEMINI_FALLBACK_MODEL=
GEMINI_TIMEOUT_MS=30000
AGENT_THROTTLE_TTL_MS=60000
AGENT_THROTTLE_LIMIT=3

# Error monitoring — optional; the SDK no-ops without a DSN
SENTRY_DSN=
```

Notes:

- The frontend reads the `NX_FIREBASE_*` values from `apps/todo/src/environments/`.
- The backend initializes Firebase Admin from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
- Store a multiline private key with escaped newlines (`\\n`); the backend converts them at startup.
- `FIREBASE_AUTH_EMULATOR_HOST` is for local development. Do not set it in production.
- The Firebase Storage emulator is selected by frontend code whenever `environment.production` is `false`.
- `CORS_ORIGIN` accepts a comma-separated list of allowed origins; leave unset to allow all origins in local development. The backend refuses to start with `NODE_ENV=production` and no `CORS_ORIGIN` set.
- `SENTRY_DSN` enables error monitoring (`apps/todo-be/src/instrument.ts`). Request/response bodies, auto-populated user info, and AI input/output are never collected — task text, tokens, and agent payloads only ever live in this app's own request handling, not in Sentry.

## Local authentication

The development frontend connects to the Firebase Auth and Storage emulators. Keep `npm run emulator` running before testing sign-in or image uploads.

- **Email/password:** open `/register` and create any throwaway account.
- **Google:** the emulator displays a fake Google sign-in dialog; no real Google account is needed.
- **Password reset:** Firebase handles the request. The emulator does not send a real email; inspect the Emulator UI instead.
- **Emulator users:** view and remove them at `http://localhost:4000/auth`.

After Firebase authentication, the frontend calls `POST /api/auth/provision` to create or link the MongoDB profile. Subsequent requests load that profile through the protected API guard.

### Demo account

`npm run seed:demo` creates a ready-to-explore account — login-enabled, with sample lists and todos, AI assistance already opted in — against MongoDB and the Firebase Auth emulator. It refuses to run without `FIREBASE_AUTH_EMULATOR_HOST` set, since it creates a fixed, published password that must never exist against a real Firebase project. Safe to run repeatedly; every document is upserted by a stable key rather than duplicated. With the emulator running:

```bash
npm run seed:demo
```

Then sign in at `/login` with `demo@example.com` / `DemoPass123!`.

## Frontend routes

| Route                | Access        | Current behavior                                                                         |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `/`                  | Authenticated | Date-filtered dashboard, status donuts, completed tasks                                  |
| `/tasks`             | Authenticated | Todo-list and todo CRUD with detail/edit panel                                           |
| `/vital`             | Authenticated | In-progress todos on `high`-priority lists, task details, and an optional Pomodoro timer |
| `/statistics`        | Authenticated | Client-side week/month/year analytics and charts, with a "Generate Report" action        |
| `/reports`           | Authenticated | Searchable, filterable, sortable list of previously generated reports                    |
| `/reports/:reportId` | Authenticated | Immutable report detail: frozen-snapshot charts, print/PDF export, optional AI insights  |
| `/settings`          | Authenticated | Appearance and preferences (timezone, AI consent, report cadence/tone)                   |
| `/help`              | Authenticated | Placeholder                                                                              |
| `/login`             | Public-only   | Email/password and Google sign-in                                                        |
| `/register`          | Public-only   | Validated account creation and Google sign-up                                            |
| `/forgot-password`   | Public        | Firebase password-reset request                                                          |

Authenticated and public-only routes redirect appropriately after Firebase auth state is restored. Unknown routes redirect to `/`.

## API

All endpoints below require a Firebase ID token in `Authorization: Bearer <token>`. `POST /api/auth/provision` verifies the Firebase token but does not require an existing MongoDB profile.

```text
# Authentication and profile
GET    /api/auth/user
POST   /api/auth/provision

# Preferences (theme, timezone, AI consent, report cadence/tone)
GET    /api/users/:userId/preferences
PATCH  /api/users/:userId/preferences

# Statistics (?period=day|week|month|year; default: week)
GET    /api/users/:userId/stats

# Periodic reports (?period=weekly|monthly|yearly)
GET    /api/users/:userId/reports                 # list, paginated, filterable/sortable
POST   /api/users/:userId/reports                 # generate (or return the existing one, unchanged) for a period
GET    /api/users/:userId/reports/:id              # one report, including its frozen task snapshot
POST   /api/users/:userId/reports/:id/narrative    # generate AI insights (requires preferences.aiConsent;
                                                     # 403 otherwise; 429 after 2 generations for that report)

# Todo lists
GET    /api/users/:userId/todolists
POST   /api/users/:userId/todolists
PUT    /api/users/:userId/todolists/:todolistId
DELETE /api/users/:userId/todolists/:todolistId

# Todos (scoped to a list)
POST   /api/users/:userId/todolists/:todolistId/todos
PUT    /api/users/:userId/todolists/:todolistId/todos/:id
DELETE /api/users/:userId/todolists/:todolistId/todos/:id

# Todos (Inbox — list-less)
GET    /api/users/:userId/todos/inbox
POST   /api/users/:userId/todos
PUT    /api/users/:userId/todos/:id
DELETE /api/users/:userId/todos/:id

# Conversational agent (requires preferences.aiConsent; 403 otherwise)
POST   /api/agent/message      # text/event-stream: token, tool_call, tool_result, proposal, done, error
POST   /api/agent/parse-todo   # single-shot structured parse for Inbox quick capture
```

`GET /api/users/:userId/todolists` populates the todos inside each list, so the frontend does not use separate read endpoints for individual todos.

The generated OpenAPI document at `/api-docs-json` contains exactly these operations; Swagger UI is available at `/api-docs`. See [`docs/AGENT-ARCHITECTURE.md`](docs/AGENT-ARCHITECTURE.md) for the agent endpoints' data flow, tool contract, and trust boundary.

## Data model

### User

- Firebase UID, email, display name, first/last name, optional username
- MongoDB timestamps

### Todo list

- Name and owning MongoDB user ID
- Optional priority: `low | medium | high`
- Optional category: `home | education | work | family | health`
- Optional due date and notes
- MongoDB timestamps and populated todos

### Todo

- Name and parent todo-list ID
- Status: `pending | successful | failed`
- Optional due date, location, notes, completion date, and Firebase Storage image URL
- MongoDB timestamps

### Report

- Name, owning MongoDB user ID, and period: `weekly | monthly | yearly`
- `periodStart`/`periodEnd` (calendar boundaries in the user's timezone)
- `metrics`: due/completed/created/overdue counts, completion ratio, on-time rate, proactivity score
- `taskSnapshot`: a frozen, lightweight copy of that period's tasks at generation time, so later
  edits or deletions never change an already-generated report
- `narrative`: optional AI insights (`summary`, `problems[]`, `reasoning[]`, `tips[]`), or `null`
  until generated
- `narrativeAttempts`: number of AI-insight generation attempts, capped at 2
- Unique per `{userId, period, periodStart}` — regenerating an existing period returns the same
  document rather than duplicating it
- MongoDB timestamps

## Image handling

- Input files are limited to 5 MB.
- Large images are resized to a maximum dimension of 1200 px.
- Images are converted to JPEG at 85% quality.
- Objects are uploaded to `todos/{firebaseUid}/{timestamp}_{filename}`.
- Replaced and deleted todo images are also deleted from Storage on a best-effort basis.
- MongoDB stores the download URL, not the image bytes.
- Current Storage rules allow public reads and owner-only writes. Restricting reads is a planned security improvement.

## Statistics

The `/statistics` page currently computes charts in the browser from the authenticated user's populated todo lists. It supports week, month, and year views and displays:

- total, completed, pending, and failed tasks;
- completion rate and days tracked;
- time-series activity;
- weekday activity;
- status and category breakdowns.

The backend also exposes a smaller aggregate statistics endpoint with day/week/month/year periods. The frontend page does not currently consume that endpoint.

## Reports and AI insights

Reports are explicitly generated, immutable documents — never a side effect of viewing the Reports list. From `/statistics`, "Generate Report" freezes the period currently shown (weekly, monthly, or yearly) into a named document: the seven summary metrics plus a lightweight snapshot of every task in that period, so a later edit or delete of the underlying task can never retroactively change the report. Generating an already-generated period returns the existing document rather than duplicating it (enforced by a unique index, not a check-then-write race).

The Reports list is searchable by name and filterable/sortable by period and date. Opening a report reuses Statistics' own chart sections against the frozen snapshot, and can be printed or saved as a PDF through the browser's print dialog — a dedicated print stylesheet hides navigation, the chat panel, and all other app chrome so only the report content prints.

With AI assistance enabled in Settings, a report detail page can also request AI-generated insights (Gemini): one summary sentence plus **Problems**, **Why**, and **Try** bullet sections, grounded only in that report's own numbers — the model phrases and explains the data, it never computes or invents a number. Generation is capped at 2 attempts per report (a failed attempt still counts, since it still cost a real API call) to bound cost from repeated clicks; a configurable fallback model (`GEMINI_FALLBACK_MODEL`) is tried once if the primary model is overloaded. Finishing a "Generate Report" run queues an in-app notification (the bell in the header) rather than interrupting the Statistics page.

## Testing and verification

Run workspace checks through Nx-backed npm scripts:

```bash
# Interactive Cypress when the frontend is already running on port 4200
npm exec nx -- run todo-e2e:e2e-ci --watch

# Lint all configured projects
npm run lint

# Typecheck frontend, backend, and shared types
npm run typecheck

# Run all Jest targets
npm run test:unit

# Backend Jest/Supertest suite
npm run test:unit:be

# Frontend Jest target (currently passes with no tests)
npm run test:unit:fe

# Production builds for all buildable projects
npm exec nx run-many --target=build

# Interactive Cypress that starts the frontend (port 4200 must be free)
npm run test:e2e:watch

# Headless authenticated smoke flow (starts the frontend automatically)
npm run test:e2e

# Agent eval harness: 22 fixed cases scored against a live Gemini call,
# reporting pass rate, p50/p95 latency, prompt version, and model name
npm run eval:agent
```

Useful Nx commands:

```bash
npm exec nx show projects
npm exec nx graph
npm exec nx affected --target=lint
npm exec nx affected --target=test
npm exec nx affected --target=build
```

CI runs on pushes and pull requests targeting `main` with four parallel jobs:

1. Lint all configured projects.
2. Typecheck the frontend, backend, and shared library.
3. Run Jest in CI/coverage mode, then build all buildable projects.
4. Start MongoDB, the Firebase Auth and Storage emulators, and the backend,
   then run the authenticated Cypress smoke flow.

### Phase 0 quality baseline

Baseline recorded locally on 2026-08-04 with Node.js 24.14.1, the Firebase
Emulator Suite 15.14.0, and the repository's MongoMemoryServer configuration.
CI and the package engine remain standardized on Node.js 20.x, where the same
commands are required to pass:

| Signal                   |                                     Baseline |
| ------------------------ | -------------------------------------------: |
| Backend Jest tests       |                                   97 passing |
| Frontend Jest tests      | 0 (the configured target exits successfully) |
| Image-heavy list payload |                                  3,658 bytes |

The payload fixture is one populated todo list with ten todos. Each todo stores
a representative 157-character Firebase Storage download URL. The integration
test measures `Buffer.byteLength(JSON.stringify(response.body), 'utf8')` and
sets a 10,000-byte characterization guardrail; it does not include HTTP headers
or transport compression.

Run the complete deterministic baseline with:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm exec nx build todo
npm exec nx build todo-be
```

For the authenticated smoke flow, keep the root `.env` configured for local
MongoDB and the Firebase emulators, then use separate terminals:

```bash
npm run docker:mongodb
npm run emulator
npm run serve:be
npm run test:e2e
```

The Cypress flow registers a throwaway emulator account through the UI, creates
a todo list and task, marks the task complete, and deletes both records. It does
not use real Firebase credentials.

## Deployment

- `render.yaml` builds and starts the backend from `dist/apps/todo-be/main.js` in Render's Frankfurt region.
- The production frontend uses `NX_API_URL`; its fallback API is `https://todo-list-5iqb.onrender.com/api`.
- Production also requires MongoDB Atlas and Firebase client/Admin configuration in the deployment environment.
- The frontend is deployed separately on Vercel; deployment configuration is managed outside this repository.

Before deploying, run the full local build and test suite and smoke-test the authenticated API against the intended environment.

## Roadmap highlights

The next high-value improvements are:

1. Scheduled report generation and delivery, wiring the existing `preferences.reportCadence`/`deliveryHour` fields to a cron-style job.
2. Broader frontend component/hook tests with MSW and an enforced coverage threshold.
3. Raising the agent's eval pass rate toward the 90% target (`docs/PLAN.md` Phase 9).
4. Restricting Firebase Storage reads to the authenticated user's own images.
5. A performance/refactor pass across the now-larger codebase (`docs/PLAN.md` Phase 15).

[`docs/PLAN.md`](docs/PLAN.md) expands these items into measurable phases and acceptance checks and is the project's planning source of truth.
