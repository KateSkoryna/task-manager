---
name: run-task-workflow
description: Execute a selected task from a Markdown plan through a dedicated Git branch and a sequential Architect, Executor, and independent Tester loop. Use when asked to implement, execute, build, or continue a specific plan task and the work must remain isolated, repair implementation or plan defects automatically, pass all relevant checks, and run locally before stopping for review.
---

# Run Task Workflow

Execute one plan task on one dedicated branch. Keep Architect, Executor, and Tester work sequential. Leave every change uncommitted for user review.

Read [references/artifact-contracts.md](references/artifact-contracts.md) before starting. Treat its document and response schemas as required contracts.

## Resolve the task

1. Read all applicable `AGENTS.md` files.
2. Resolve the source plan path and stable task ID from the request. Prefer an ID already present in the plan. If a plan contains several tasks and the requested task is not identifiable, ask the user to select one.
3. Extract the exact original task text. Never let an agent silently change it.
4. Derive a short lowercase branch slug. Use `task/<task-id>-<slug>`.
5. Set the artifact directory to `docs/tasks/<task-id>/`.

## Establish branch isolation

1. Inspect the current branch, status, and HEAD before changing Git state.
2. If already on the matching task branch, verify `workflow-state.md`, confirm its base revision is an ancestor of `HEAD`, and require every dirty path to appear in its task-owned path list. If state is missing, inconsistent, or has unowned dirty paths, stop for user input. With a clean worktree, reconstruct the base from an explicit user-supplied base or the repository's discovered default branch; ask when the base is ambiguous.
3. Otherwise, require a clean worktree. If unrelated changes exist, stop and ask how the user wants them isolated; do not stash or move them automatically.
4. Create or switch to the dedicated task branch. Record the starting branch and revision in `docs/tasks/<task-id>/workflow-state.md`.
5. Keep every agent in this branch and working directory. Agents must not create or switch branches, commit, push, or open a pull request.
6. For concurrent tasks, use a distinct Git worktree per task branch. Never run write-capable agents for different tasks in the same checkout.
7. Record the workflow-start `HEAD`. After every agent handoff, verify the branch is unchanged and `HEAD` still equals that revision. Stop immediately and report if an agent changed Git history. Also verify these invariants before declaring completion.
8. After every handoff, compare newly dirty paths with the exact task scope and the agent's contract before adding them to the task-owned path list. Never automatically bless an unexpected path; investigate it and stop for user input when ownership is uncertain. The repository's conditional PreToolUse guard blocks common commit, push, pull-request, merge, and deployment actions while workflow state is active on the current branch. If the hook is unavailable or awaiting trust, warn the user and retain the branch/HEAD checks; never weaken the agent prohibitions.

## Run the state machine

Use the custom agents named `architect`, `executor`, and `tester`. The parent agent is the controller and owns routing. Wait for each agent before starting the next write-capable agent.

### 1. Plan

Spawn Architect with the task ID, source plan, exact original task text, artifact path, repository path, and branch. Require `docs/tasks/<task-id>/implementation-plan.md` using the contract in the reference.

Reject an Architect result that changes product requirements, edits production code, or lacks independently verifiable phases. If the original requirement needs a product decision, stop for the user instead of inventing one.

### 2. Execute

Spawn Executor with the source plan, implementation plan, repository, branch, and any current failure evidence. Require sequential phase implementation and deterministic verification through the repository's prescribed commands.

Executor must return exactly one routing status:

- `FIXED`: implementation is ready for independent testing; classification is `NONE` on an ordinary first pass.
- `PLAN_REVIEW_REQUIRED`: technical plan is wrong or incomplete.
- `REQUIREMENT_BLOCKED`: original requirements require a user decision.
- `ENVIRONMENT_BLOCKED`: an external dependency prevents progress.

For `PLAN_REVIEW_REQUIRED`, route the evidence to a fresh Architect turn. Architect must revise only `implementation-plan.md`, increment its revision, and describe the corrected phases. If Architect returns `PLAN_UPDATED`, run Executor against the revision. If Architect returns `PLAN_VALID`, send its technical evidence to Executor as an implementation defect. Stop for `REQUIREMENT_BLOCKED`.

### 3. Test independently

Spawn a context-free Tester after every Executor result of `FIXED`. Use a no-history spawn when supported; otherwise start a separate fresh thread with only the task ID, source plan, exact original task text, repository path, branch, test-run number, artifact contract, and applicable `AGENTS.md` guidance. Do not pass Architect or Executor messages, suggested tests, claimed results, risk assessments, or implementation conclusions.

Before forming its charter, Tester must not read `implementation-plan.md`, prior test runs, workflow state beyond task/branch identity, or other workflow conclusions. It first derives its strategy from the original requirement and existing project conventions and writes `test-runs/<zero-padded-run>/test-charter.md`. It may then inspect the complete repository, changed files, diff, and implementation plan to discover additional cases without weakening the independent charter. It must not modify production code.

Require Tester to run the complete relevant validation, including:

- positive, negative, boundary, integration, and regression cases;
- existing and newly justified automated tests;
- lint, type checks, and production build when configured;
- local backend and frontend startup as applicable;
- readiness or health checks and critical user-flow smoke tests;
- runtime-log inspection and clean process shutdown.

Tester writes `test-runs/<zero-padded-run>/test-report.md` and returns `PASS`, `FAIL`, or `BLOCKED` using the reference contract. Never overwrite an earlier run. Route `BLOCKED` to safe environment diagnostics or user input according to its evidence.

### 4. Repair

For `FAIL`, preserve Tester's raw evidence and spawn a fresh Executor turn. Do not include Tester's proposed implementation fixes. Executor classifies each failure:

- `IMPLEMENTATION_FAILURE`: fix code and relevant regression coverage.
- `PLAN_FAILURE`: return `PLAN_REVIEW_REQUIRED` and explain the plan defect.
- `REQUIREMENT_BLOCKED`: stop for a user decision.
- `ENVIRONMENT_BLOCKED`: exhaust safe diagnostics, then report the external requirement.

After any code or plan repair, spawn a fresh Tester and rerun the complete relevant suite, not only the formerly failing check.

Continue until Tester returns `PASS`. Track a normalized root-cause signature rather than only a failure ID. If the same underlying failure survives three repair cycles, whether or not Architect participated or the ID changed, stop with exact evidence and request user direction instead of looping indefinitely.

## Completion gate

Complete only when all configured relevant checks pass, the application builds, applicable services start locally, readiness and smoke checks pass, relevant runtime logs contain no critical errors, processes shut down cleanly, and a fresh independent Tester reports `PASS`.

Review the final diff against the original task. Update `workflow-state.md` and provide the branch, base revision, plan revision, phases completed, changed files, commands and results, local-runtime evidence, remaining risks, and Tester result.

Do not commit, push, open a pull request, deploy, or merge. Leave the branch and all changes ready for user review.
