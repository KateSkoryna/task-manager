# Orcrist-Oriented Implementation Plan

## Goal

Upgrade the Todo List repository into a validated, adoption-ready full-stack prototype aligned with the Orcrist Technologies Full-Stack Engineer (TypeScript - Prototyping) role.

The target outcome is not a feature-bloated task manager. It is a compact reference implementation proving secure multitenancy, PostgreSQL, orchestration, real-time UX, observability, CI, Kubernetes packaging, and high-quality handoff documentation.

## Delivery model

Use four time-boxed milestones. Each milestone should end with a demo, automated tests, and updated documentation.

---

## Milestone 1: PostgreSQL and tenant isolation

### Objectives

- replace the primary MongoDB persistence layer with PostgreSQL;
- introduce an explicit tenant model;
- enforce tenant isolation in every repository operation;
- preserve current functionality during migration.

### Work items

1. Add PostgreSQL to local Docker Compose.
2. Select Prisma or TypeORM. TypeORM aligns with the current CV; Prisma may reduce implementation time.
3. Create migrations for:
   - `Tenant`
   - `User`
   - `TenantMembership`
   - `TaskList`
   - `Task`
   - `AuditEvent`
   - `FeatureFlag`
4. Add `tenantId` to every business entity.
5. Replace user-ID-based ownership assumptions with authenticated tenant context.
6. Create a migration script for existing development data.
7. Add seed data containing two tenants and users with different roles.
8. Add PostgreSQL integration tests using Testcontainers or a disposable CI database.

### Required tests

- user can read data from their own tenant;
- user cannot read another tenant's list by guessing an ID;
- user cannot update or delete another tenant's task;
- uniqueness constraints behave correctly within tenant boundaries;
- migrations apply cleanly from an empty database.

### Definition of done

- MongoDB is no longer required for the core application;
- all API handlers operate through tenant-scoped repositories;
- cross-tenant access tests pass;
- README includes migration and local database setup instructions.

---

## Milestone 2: RBAC, auditability, feature flags, and privacy

### Objectives

- make security and audit expectations part of normal application behavior;
- demonstrate secure-by-default product engineering;
- create visible evidence for reviewers.

### Work items

1. Add roles:
   - `OWNER`
   - `ADMIN`
   - `MEMBER`
   - `VIEWER`
2. Add authorization middleware with explicit action checks.
3. Centralize policies in a module such as `authorization/policies.ts`.
4. Add append-only audit events for:
   - authentication changes;
   - tenant membership changes;
   - task/list creation, updates, and deletion;
   - permission failures;
   - feature-flag changes.
5. Add an audit-log page visible to authorized users.
6. Redact sensitive fields in logs and audit metadata.
7. Add tenant-aware feature flags with a simple admin UI.
8. Add request rate limiting and security headers.
9. Add a documented PII inventory and retention policy for the prototype.

### Required tests

- viewers cannot mutate tasks;
- members cannot manage tenant memberships;
- admins can manage users but cannot delete the tenant unless explicitly allowed;
- audit events are written for successful and rejected sensitive operations;
- secret or token values never appear in logs;
- feature flags affect only the intended tenant.

### Documentation

Create:

- `docs/security-model.md`
- `docs/threat-model.md`
- `docs/privacy-and-pii.md`
- `docs/adr/0001-tenant-isolation.md`
- `docs/adr/0002-rbac-model.md`

### Definition of done

A reviewer can log in as different roles, observe permission differences, and inspect audit records without reading the source code.

---

## Milestone 3: Temporal reminders and real-time notifications

### Objectives

- demonstrate a meaningful orchestration integration;
- deliver a complete real-time vertical slice;
- show failure handling rather than only happy-path behavior.

### Architecture

Use Temporal for durable task-reminder workflows and SSE for browser updates.

Flow:

1. client creates or updates a task with a reminder;
2. API writes the task transactionally;
3. API starts or signals a Temporal workflow;
4. workflow waits until the scheduled time;
5. workflow creates a notification;
6. backend publishes an event;
7. browser receives the event over SSE;
8. UI updates the unread badge and notification list.

### Work items

1. Add a Temporal development service to Docker Compose.
2. Create workflow and activity packages.
3. Use deterministic workflow IDs, for example `task-reminder/{tenantId}/{taskId}`.
4. Add cancellation and rescheduling behavior.
5. Persist notification state in PostgreSQL.
6. Add an SSE endpoint scoped by tenant and user.
7. Add reconnect behavior and last-event IDs.
8. Add a notification centre and unread badge.
9. Add structured logs and metrics around workflow starts, retries, failures, and latency.

### Required tests

- workflow starts when a reminder is created;
- changing the date reschedules the workflow;
- deleting a task cancels the workflow;
- duplicate requests do not create duplicate notifications;
- unauthorized clients cannot subscribe to another tenant's stream;
- SSE reconnection restores missed events;
- failed activities retry and surface a visible failure state.

### Definition of done

A demo can create a task with a near-term reminder and show the durable workflow, audit event, backend event, and live UI notification.

---

## Milestone 4: CI, observability, Kubernetes, and adoption package

### Objectives

- make the prototype operable and easy to hand off;
- demonstrate engineering hygiene expected in a Kubernetes/GitOps environment.

### CI pipeline

Add `.github/workflows/ci.yml` with jobs for:

1. dependency installation with lockfile enforcement;
2. formatting check;
3. ESLint;
4. TypeScript type check;
5. frontend unit tests;
6. backend unit and integration tests;
7. Cypress smoke journey;
8. production builds;
9. Docker image builds;
10. dependency and container vulnerability scans.

Add branch protection recommendations to the README.

### Containerization

Create:

- `Dockerfile.frontend`
- `Dockerfile.backend`
- `.dockerignore`
- `compose.yaml`

Use non-root users, multi-stage builds, pinned base images, health checks, and minimal runtime images.

### Kubernetes packaging

Create:

```text
deploy/
  base/
    frontend-deployment.yaml
    frontend-service.yaml
    backend-deployment.yaml
    backend-service.yaml
    configmap.yaml
    ingress.yaml
    network-policy.yaml
  overlays/
    local/
    demo/
```

Use Kustomize. Include:

- readiness and liveness probes;
- resource requests and limits;
- ConfigMaps and Secret references;
- NetworkPolicy;
- rolling-update strategy;
- PodDisruptionBudget as a stretch item.

Do not commit real secrets.

### Observability

Implement:

- JSON logs using Pino or equivalent;
- request and correlation IDs;
- `/health/live`;
- `/health/ready` with database and Temporal checks;
- Prometheus metrics for request latency, error rate, workflow state, and notification delivery;
- OpenTelemetry traces for API-to-workflow paths as a stretch goal.

### Adoption package

Create:

- `docs/architecture.md`
- `docs/api-contracts.md`
- `docs/data-model.md`
- `docs/deployment-runbook.md`
- `docs/operational-runbook.md`
- `docs/demo-script.md`
- `docs/integration-backlog.md`
- `docs/known-limitations.md`

Include Mermaid diagrams for:

- system context;
- container architecture;
- authentication sequence;
- task-reminder sequence;
- tenant authorization decision.

### Definition of done

- CI is green from a clean clone;
- the system runs with Docker Compose;
- Kubernetes manifests render successfully;
- health and metrics endpoints work;
- a new engineer can follow the runbook without private knowledge.

---

## Suggested repository structure

```text
apps/
  todo/
  todo-be/
libs/
  types/
  authorization/
  observability/
  database/
  workflows/
docs/
  adr/
  architecture.md
  security-model.md
  threat-model.md
  privacy-and-pii.md
  deployment-runbook.md
  operational-runbook.md
  integration-backlog.md
deploy/
  base/
  overlays/
.github/workflows/
```

## Portfolio evidence checklist

Before linking the repository in an application, confirm that it visibly contains:

- [ ] PostgreSQL migrations
- [ ] tenant-scoped data model
- [ ] RBAC middleware and tests
- [ ] audit-log UI
- [ ] Temporal workflow
- [ ] real-time notifications
- [ ] full CI workflow
- [ ] production Dockerfiles
- [ ] Kubernetes/Kustomize assets
- [ ] health checks, metrics, and structured logs
- [ ] architecture and security diagrams
- [ ] demo instructions and screenshots
- [ ] live deployment or recorded demo

## Recommended README opening after completion

> Multi-Tenant Operations Workspace is a validated full-stack TypeScript prototype built with React, Node.js, PostgreSQL, Temporal, and Kubernetes. It demonstrates tenant-isolated RBAC, auditable workflows, real-time notifications, operational telemetry, and a documented adoption package designed for handoff to a product delivery team.

## Scope controls

Do not add Kafka and OpenSearch in the first implementation unless the core milestones are complete. PostgreSQL full-text search and Temporal are enough to demonstrate the required concepts coherently.

## Estimated effort

- Milestone 1: 4-6 focused days
- Milestone 2: 3-5 focused days
- Milestone 3: 4-6 focused days
- Milestone 4: 3-5 focused days

Total: approximately 14-22 focused development days, depending on familiarity with Temporal and Kubernetes.

## Final acceptance test

The project is ready when a reviewer can clone it, start it, create two tenants, verify isolation, schedule a reminder, observe a real-time notification and audit record, inspect metrics, and understand the deployment path from the documentation.