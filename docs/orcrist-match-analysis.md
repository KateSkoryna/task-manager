# Orcrist Full-Stack Engineer Match Analysis

## Purpose

This document evaluates the Todo List repository against the Orcrist Technologies Full-Stack Engineer (TypeScript - Prototyping) vacancy. The target role expects validated vertical-slice prototypes across React/Next.js, Node.js APIs, storage/search integrations, security, observability, CI, Kubernetes/GitOps, documentation, and handoff artifacts.

## Current project baseline

The repository already demonstrates a credible full-stack TypeScript product:

- React 18 frontend in an Nx monorepo
- Express 4 backend
- MongoDB with Mongoose
- Firebase Authentication and Firebase Admin token verification
- TanStack Query for server state
- Zustand for client state
- Zod schemas and shared TypeScript types
- Jest, Supertest, mongodb-memory-server, and Cypress
- Swagger API documentation
- Layered backend structure with controllers, services, repositories, middleware, and models

This makes the project a strong base for Orcrist because it already spans UI, API, authentication, persistence, testing, and documentation.

## Requirement-by-requirement assessment

| Vacancy expectation | Current evidence | Gap | Priority |
|---|---|---|---|
| React/Next.js + TypeScript | React 18, TypeScript, Nx | Next.js is not required if full-stack depth is strong | Low |
| Node.js APIs | Express backend with REST routes | Add stronger API contracts and operational concerns | Medium |
| PostgreSQL | Not present | MongoDB does not prove relational design or Postgres skill | Critical |
| Search integration | Not present | Add PostgreSQL full-text search or OpenSearch | High |
| Auth flows | Firebase Auth and backend token verification | Add tenant-aware authorization and roles | Critical |
| Auditability | Not present | Add append-only audit events and audit UI | Critical |
| Multitenancy assumptions | User-scoped data only | Add tenant model and isolation tests | Critical |
| Feature flags | Not present | Add tenant-aware flags and rollout controls | Medium |
| Observability | Not documented | Add logs, metrics, tracing, health checks | High |
| Kafka/Temporal | Not present | Add one real orchestration use case | High |
| Kubernetes/GitOps | Docker Compose only for MongoDB | Add container images and Kustomize/Helm manifests | High |
| Tests and CI | Test tooling exists | Add enforceable CI and integration coverage | High |
| Adoption package | README is good | Add ADRs, schemas, runbook, backlog, threat model | High |
| Security/PII | Token verification exists | Add authorization, privacy policy, rate limits, audit tests | Critical |
| Real-time UI | Notifications are planned | Implement SSE or WebSockets | Medium |

## Strategic repositioning

The project should be presented as a validated enterprise prototype rather than a generic personal task manager.

Recommended portfolio name:

> Multi-Tenant Operations Workspace

Recommended one-line description:

> A production-minded TypeScript prototype with tenant-aware RBAC, PostgreSQL search, Temporal workflows, real-time notifications, auditability, observability, and Kubernetes deployment assets.

This remains factual only after the planned features are implemented.

## Key architecture risks to address

### 1. Route-level ownership risk

Current routes contain `:userId`. Any endpoint that trusts a user ID supplied by the client can become vulnerable to horizontal privilege escalation unless authorization is checked against the authenticated identity.

Required response:

- derive user and tenant identity from verified authentication context;
- never authorize solely from URL parameters;
- add integration tests proving cross-user and cross-tenant access is rejected;
- document the authorization model.

### 2. MongoDB-only persistence

MongoDB is valid, but the vacancy explicitly values PostgreSQL. Keeping the project only on MongoDB leaves a major evidence gap.

Recommended response:

- migrate the main domain model to PostgreSQL;
- use Prisma or TypeORM;
- retain MongoDB only if there is a clear secondary use case, such as event payload storage or analytics;
- add migration and rollback documentation.

### 3. Planned instead of implemented real-time features

The README documents notifications as planned. For portfolio evidence, planned work is insufficient.

Required response:

- implement notifications end-to-end;
- expose delivery state in the UI;
- add test coverage and observability;
- show failure and retry behavior.

### 4. Missing operational maturity

The current project has good local development scripts but does not yet demonstrate production packaging.

Required response:

- add Dockerfiles for frontend and backend;
- add CI with lint, type check, tests, image build, and security checks;
- add Kubernetes manifests;
- add logs, health endpoints, and metrics;
- document deployment and rollback.

## Recommended technical direction

### Core data model

Introduce the following relational entities:

- `Tenant`
- `User`
- `TenantMembership`
- `Role`
- `TaskList`
- `Task`
- `Comment`
- `Notification`
- `AuditEvent`
- `FeatureFlag`

Every business entity should include a `tenantId`. Repository methods must require tenant context explicitly.

### Access-control model

Start with RBAC:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

Later, add resource-level conditions if useful. Keep the first implementation understandable and fully tested.

### Orchestration use case

Use Temporal for task reminders:

1. a task is created with a due date;
2. the backend starts a workflow;
3. the workflow waits until reminder time;
4. the workflow emits a notification;
5. the client receives status through SSE or WebSockets;
6. task edits reschedule the workflow;
7. task deletion cancels the workflow.

This is a coherent use of Temporal, not decorative infrastructure.

### Search

Implement PostgreSQL full-text search first:

- search task title and description;
- filter by assignee, status, date, and tenant;
- add ranked results;
- add indexes and query-plan notes.

OpenSearch can be a documented future integration, not a mandatory first step.

## What not to add

Avoid adding Kafka, Temporal, OpenSearch, GraphQL, Kubernetes, WebSockets, and multiple databases simultaneously without a clear product story. The goal is one coherent, testable prototype with an adoption package.

## Success criteria

The upgraded repository should allow a reviewer to verify the following within ten minutes:

1. The system runs locally with one command.
2. Two tenants can be created.
3. A user from Tenant A cannot access Tenant B data.
4. A task reminder workflow executes visibly.
5. Audit events record sensitive actions.
6. Search returns tenant-scoped ranked results.
7. CI status is green.
8. Architecture, security, deployment, and handoff docs are easy to find.

## Final match projection

Current project match for this vacancy: **7.5/10**

Projected match after implementation: **9/10**

The largest value comes from PostgreSQL, tenant-aware security, orchestration, observability, CI, and deployment documentation.