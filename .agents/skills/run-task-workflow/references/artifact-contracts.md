# Artifact contracts

Use these schemas for every task workflow. Store artifacts under `docs/tasks/<task-id>/`.

## Workflow state

```markdown
# Workflow state: <task-id>

- Source plan: `<path>`
- Original task heading or ID: `<value>`
- Branch: `<branch>`
- Starting branch: `<branch>`
- Base revision: `<sha>`
- Status: Planning | Implementing | Testing | Repairing | Passed | Blocked
- Plan revision: <number>
- Test run: <number>
- Last updated: <ISO-8601 timestamp>

## Task-owned paths

- `<path recorded from git status after each agent handoff>`
```

## Implementation plan

```markdown
# Implementation plan: <task-id>

- Source plan: `<path>`
- Branch: `<branch>`
- Revision: 1
- Status: Ready

## Original requirement

Copy the selected task text verbatim.

## Goal
## Non-goals
## Current implementation
## Decisions and constraints
## Risks and edge cases

## Phase 1: <name>

- Status: Pending
- Depends on: None

### Files and symbols
### Required changes
### Verification
### Acceptance criteria

## Final integration verification
```

When Architect corrects the plan, increment `Revision` and append:

```markdown
## Revision history

### Revision <n>

- Triggering failure IDs: ...
- Incorrect assumption: ...
- Corrected phases: ...
- Reason the original requirement is unchanged: ...
```

## Independent test charter

Tester must write this before detailed implementation inspection or test execution. Store it at `test-runs/<zero-padded-run>/test-charter.md`; never overwrite an earlier run.

```markdown
# Independent test charter: <task-id>

- Source requirement: `<path and task ID>`
- Test run: <number>

## Required behaviors
## Negative scenarios
## Boundaries and edge cases
## Integration scenarios
## Regression risks
## Automated-test strategy
## Local-runtime strategy
## Planned commands and observations
```

## Test report

Store it at `test-runs/<zero-padded-run>/test-report.md`; never overwrite an earlier run.

```markdown
# Independent test report: <task-id>

- Result: PASS | FAIL | BLOCKED
- Test run: <number>

## Commands and results
## Tests added or changed
## Local runtime

- Build passed: yes | no | not applicable
- Services started: yes | no | not applicable
- Readiness passed: yes | no | not applicable
- Smoke tests passed: yes | no | not applicable
- Critical runtime errors: none | <evidence>
- Clean shutdown: yes | no | not applicable

## Failures

For every failure, include a stable ID and normalized root-cause signature:

```markdown
### TEST-001: <title>

- Root-cause signature: `<stable behavior or error signature>`
- Command: `...`
- Reproduction: ...
- Expected: ...
- Actual: ...
- Evidence: ...
```

## Untested areas
## Confidence and residual risks
```

## Agent routing responses

Architect:

```yaml
status: PLAN_CREATED | PLAN_UPDATED | PLAN_VALID | REQUIREMENT_BLOCKED
task_id: TASK-000
plan_revision: 1
reason: "..."
affected_phases: []
```

Executor:

```yaml
status: FIXED | PLAN_REVIEW_REQUIRED | REQUIREMENT_BLOCKED | ENVIRONMENT_BLOCKED
task_id: TASK-000
failure_ids: []
classification: NONE | IMPLEMENTATION_FAILURE | PLAN_FAILURE | REQUIREMENT_BLOCKED | ENVIRONMENT_BLOCKED
reason: "..."
commands_run: []
```

Tester:

```yaml
status: PASS | FAIL | BLOCKED
task_id: TASK-000
test_run: 1
failure_ids: []
local_runtime:
  build_passed: true
  services_started: true
  readiness_passed: true
  smoke_tests_passed: true
  critical_log_errors: []
  shutdown_cleanly: true
report_path: docs/tasks/TASK-000/test-runs/001/test-report.md
```

Use `not_applicable` instead of `true` only when the repository genuinely has no corresponding target or service. Explain every `not_applicable` value in the test report.
