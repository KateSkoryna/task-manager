# Todo List Application

A full-stack task-management application built in an Nx workspace with React, Express, MongoDB, Firebase Authentication, and Firebase Storage.

The app supports authenticated, user-scoped task management; rich todo and list metadata; dashboard and statistics views; image attachments; and English, German, and Ukrainian UI translations.

## Install and run

After creating the required `.env` file, install dependencies and start MongoDB, the Firebase emulators, the backend, and the frontend:

```bash
npm install
npm run all
```

Open the app at `http://localhost:4200`. See [Prerequisites](#prerequisites) and [Environment variables](#environment-variables) if this is your first local setup.

## Local services

| Service                   | URL                              |
| ------------------------- | -------------------------------- |
| Frontend                  | `http://localhost:4200`          |
| Backend                   | `http://localhost:3333`          |
| Swagger UI                | `http://localhost:3333/api-docs` |
| Firebase Emulator UI      | `http://localhost:4000`          |
| Firebase Auth emulator    | `http://localhost:9099`          |
| Firebase Storage emulator | `http://localhost:9199`          |
| MongoDB                   | `mongodb://localhost:27017`      |
| mongo-express             | `http://localhost:8081`          |

You can also start services separately:

```bash
npm run docker:mongodb
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
- Dashboard with date selection, task-status charts, and recently completed tasks.
- Vital Tasks view based on high-priority lists.
- Statistics view with week/month/year filtering, status breakdowns, time series, weekday activity, and category charts.
- Responsive authentication screens and a shared application shell.
- English, German, and Ukrainian translations.
- Backend unit/integration coverage and Cypress E2E specifications.
- GitHub Actions checks for lint, typecheck, unit tests, coverage collection, and production builds.

### Not yet complete

- Settings and Help routes currently contain placeholder content.
- There are no frontend component or hook tests yet.
- Cypress is not run by the current CI workflow.
- The hand-maintained Swagger file still contains obsolete pre-Firebase auth endpoints and does not fully match the running API.
- Firebase Storage reads are public; writes are restricted to the authenticated user's path.
- Gemini is installed but no AI feature is connected to the application.
- Rate limiting, security headers, structured request logging, and pagination are planned rather than shipped.

[`docs/PLAN.md`](docs/PLAN.md) is the source of truth for shipped status, planned work, priorities, and acceptance criteria.

## Architecture

```text
React frontend
  ├─ Firebase Auth ───────────── email/password + Google sign-in
  ├─ Firebase Storage ───────── direct image upload/delete
  └─ Axios + Firebase ID token
             │
             ▼
Express REST API
  ├─ Firebase Admin ─────────── token verification
  ├─ auth middleware ────────── MongoDB profile lookup + ownership check
  ├─ controllers/repositories
  └─ Mongoose
             │
             ▼
MongoDB ─────────────────────── users, todo lists, todos, image URLs
```

The browser authenticates with Firebase and attaches the current ID token to API requests. The backend verifies that token, resolves the corresponding MongoDB profile, and rejects requests whose `:userId` does not match the authenticated user.

Images follow a separate path: the frontend compresses the selected file, uploads it directly to `todos/{firebaseUid}/...` in Firebase Storage, and stores the resulting download URL on the todo document.

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

- Node.js 20 and Express 4
- Mongoose 7 and MongoDB
- Firebase Admin SDK
- Swagger UI with a YAML OpenAPI document

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
│   │       │   │   ├── elements/     # Shared UI and application shell
│   │       │   │   ├── pages/        # Dashboard, Tasks, Vital, Settings, Help
│   │       │   │   ├── statistics/   # Charts and statistics helpers
│   │       │   │   └── todo/         # Forms, lists, cards, detail/edit panel
│   │       │   ├── fetchers/          # REST queries and mutations
│   │       │   ├── hooks/             # Todo-list orchestration
│   │       │   ├── i18n/              # en/de/uk locales
│   │       │   ├── lib/               # API client, Firebase, image uploads
│   │       │   └── store/             # Auth and selected-date state
│   │       └── environments/
│   ├── todo-be/                       # Express/Mongoose API
│   │   └── src/app/
│   │       ├── controllers/
│   │       ├── integrations/          # Firebase Admin
│   │       ├── middleware/            # Firebase auth + ownership check
│   │       ├── models/
│   │       ├── repositories/
│   │       └── utils/
│   └── todo-e2e/                      # Cypress specifications
├── libs/types/                        # Shared TypeScript types and Zod schemas
├── tools/mongodb/                     # MongoDB + mongo-express Compose stack
├── tools/swagger.yml                  # Served at /api-docs; currently stale
├── docs/
│   └── PLAN.md                        # Authoritative phased implementation plan
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

Create `.env` in the repository root. Never commit real credentials.

```dotenv
# Runtime
NODE_ENV=development
PORT=3333
NX_API_URL=http://localhost:3333/api

# MongoDB
MONGODB_URI=mongodb://root:password@localhost:27017/?authSource=admin
DATABASE_NAME=todo

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
```

Notes:

- The frontend reads the `NX_FIREBASE_*` values from `apps/todo/src/environments/`.
- The backend initializes Firebase Admin from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
- Store a multiline private key with escaped newlines (`\\n`); the backend converts them at startup.
- `FIREBASE_AUTH_EMULATOR_HOST` is for local development. Do not set it in production.
- The Firebase Storage emulator is selected by frontend code whenever `environment.production` is `false`.

## Local authentication

The development frontend connects to the Firebase Auth and Storage emulators. Keep `npm run emulator` running before testing sign-in or image uploads.

- **Email/password:** open `/register` and create any throwaway account.
- **Google:** the emulator displays a fake Google sign-in dialog; no real Google account is needed.
- **Password reset:** Firebase handles the request. The emulator does not send a real email; inspect the Emulator UI instead.
- **Emulator users:** view and remove them at `http://localhost:4000/auth`.

After Firebase authentication, the frontend calls `POST /api/auth/provision` to create or link the MongoDB profile. Subsequent requests load that profile through the protected API middleware.

## Frontend routes

| Route              | Access        | Current behavior                                        |
| ------------------ | ------------- | ------------------------------------------------------- |
| `/`                | Authenticated | Date-filtered dashboard, status donuts, completed tasks |
| `/tasks`           | Authenticated | Todo-list and todo CRUD with detail/edit panel          |
| `/vital`           | Authenticated | Lists with `high` priority and task details             |
| `/statistics`      | Authenticated | Client-side week/month/year analytics and charts        |
| `/settings`        | Authenticated | Placeholder                                             |
| `/help`            | Authenticated | Placeholder                                             |
| `/login`           | Public-only   | Email/password and Google sign-in                       |
| `/register`        | Public-only   | Validated account creation and Google sign-up           |
| `/forgot-password` | Public        | Firebase password-reset request                         |

Authenticated and public-only routes redirect appropriately after Firebase auth state is restored. Unknown routes redirect to `/`.

## API

All endpoints below require a Firebase ID token in `Authorization: Bearer <token>`. `POST /api/auth/provision` verifies the Firebase token but does not require an existing MongoDB profile.

```text
# Authentication and profile
GET    /api/auth/user
POST   /api/auth/provision

# Statistics (?period=day|week|month|year; default: week)
GET    /api/users/:userId/stats

# Todo lists
GET    /api/users/:userId/todolists
POST   /api/users/:userId/todolists
PUT    /api/users/:userId/todolists/:todolistId
DELETE /api/users/:userId/todolists/:todolistId

# Todos
POST   /api/users/:userId/todolists/:todolistId/todos
PUT    /api/users/:userId/todolists/:todolistId/todos/:id
DELETE /api/users/:userId/todolists/:todolistId/todos/:id
```

`GET /api/users/:userId/todolists` populates the todos inside each list, so the frontend does not use separate read endpoints for individual todos.

> The running route list above is authoritative. `tools/swagger.yml` still documents removed JWT-era routes (`register`, `login`, `refresh`, and `logout`) and must be synchronized before the Swagger page can be treated as the API contract.

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

## Testing and verification

Run workspace checks through Nx-backed npm scripts:

```bash
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

# Interactive Cypress run
npm run test:e2e:watch
```

Useful Nx commands:

```bash
npm exec nx show projects
npm exec nx graph
npm exec nx affected --target=lint
npm exec nx affected --target=test
npm exec nx affected --target=build
```

CI runs on pushes and pull requests targeting `main` with three parallel jobs:

1. Lint all configured projects.
2. Typecheck the frontend, backend, and shared library.
3. Run Jest in CI/coverage mode, then build all buildable projects.

## Deployment

- `render.yaml` builds and starts the backend from `dist/apps/todo-be/main.js` in Render's Frankfurt region.
- The production frontend uses `NX_API_URL`; its fallback API is `https://todo-list-5iqb.onrender.com/api`.
- Production also requires MongoDB Atlas and Firebase client/Admin configuration in the deployment environment.
- The frontend is deployed separately on Vercel; deployment configuration is managed outside this repository.

Before deploying, run the full local build and test suite and smoke-test the authenticated API against the intended environment.

## Roadmap highlights

The next high-value improvements are:

1. Shared Zod validation across frontend and backend.
2. Frontend component/hook tests with MSW and an enforced coverage threshold.
3. Incremental Express-to-NestJS migration.
4. Security headers, throttling, structured logging, pagination, and accurate OpenAPI generation.
5. Dashboard/Inbox/Vital Tasks UX and accessibility improvements.
6. A Gemini Smart Parser with structured-output validation, evals, consent, and rate limiting.
7. One-command local setup, CI E2E coverage, and portfolio-focused architecture documentation.

[`docs/PLAN.md`](docs/PLAN.md) expands these items into measurable phases and acceptance checks and is the project's planning source of truth.
