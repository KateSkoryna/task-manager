---
name: implement-step
description: Implement a single numbered phase from a plan document in docs/ (e.g. "portfolio-improvement-plan.md phase <N>"), then verify and code-review the result in parallel via subagents. Does not commit. Use when the user asks to implement/do/build a specific plan phase by document name and phase number.
argument-hint: <plan-document> <phase-number>
user-invocable: true
---

# Implement Plan Phase

## Usage

```
/implement-step portfolio-improvement-plan.md <phase-number>
```

Args: `<plan-document> <phase-number>`. If the document is given as a bare filename (no `/`), resolve it under `docs/`.

## Workflow

### Sync `main` and create a branch

- Check `git status --short` first. If the working tree isn't clean, stop and ask the user how to proceed rather than silently stashing or discarding anything.
- `git checkout main && git pull origin main`.
- Create a new branch off the updated `main`: `git checkout -b <name>`.
- The branch name must be descriptive and self-explanatory of what the phase actually does — e.g. `add-shared-todo-schemas`, not `phase-0` or `add-validation-phase`. Never include the plan's phase number (or any other number) in the branch name; a reader with no access to the plan doc should be able to tell what the branch does from its name alone.

### Locate and read the phase

- Read the plan document. Find the section for the given phase (in this repo's plan doc, phases are markdown headers like `## Phase <N> — <title>`, each with **Why**, **Goal (measurable)**, **Concepts** (to learn/recall), **Libs/deps**, and **Files** subsections).
- If the document or the phase number doesn't exist in it, stop and say so — do not guess at a phase or substitute a different one.
- Note the **Goal (measurable)** verbatim; it defines "done" for this task, the same role solar-calculator's "Goal" + "Visible result" pair plays there.

### Implement the phase

- Implement exactly what the phase's **Goal (measurable)** describes — nothing from later phases, even if related (e.g. don't start wiring rate limiting while implementing the Nest migration phase just because hardening is next).
- Follow this repo's `CLAUDE.md` conventions: no AI attribution in commits (not relevant mid-implementation, but don't leave stray comments referencing it either), Tailwind utility classes from `tailwind.config.js` — never inline hex values or new color constants, DRY/KISS/SRP, component/function composition over large multi-purpose ones.
- Touch whatever's actually needed for this phase: schema, backend module, frontend component, config, or docs — match what the phase's **Files** list calls for.

### Do not commit

- Leave changes in the working tree, staged or not. Never run `git commit`. The branch was already created in the sync step above — the user runs `/commit` themselves afterward.
- Don't create extra markdown files summarizing what you did (process docs, branch-rename notes, etc.) — only the files the phase's Goal actually calls for. The summary at the end goes in chat, not a file.

### Run deterministic checks yourself first

`/verify` only drives behavior end-to-end — by design it does not typecheck or lint. `/code-review` is judgment-based, not a compiler. Neither is guaranteed to catch what `git`/CI would reject. Run these directly (not via a subagent) before spending time on the verify-and-review step below, based on what you actually touched:

| You touched                                                     | Run                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| any `.ts`/`.tsx` file                                            | `npm run typecheck` and `npm run lint`                                                                  |
| a Mongoose schema/model (`*.model.ts`, or a Nest `*.schema.ts`)   | no migration system to run (MongoDB is schemaless) — instead run the affected repository/service's Jest suite and manually smoke-test the changed document shape via the app |
| anything under `apps/todo/src` (frontend)                        | `npx nx build todo`                                                                                      |
| anything under `apps/todo-be/src` (backend)                      | `npx nx build todo-be` and `npm run test:unit:be`                                                       |
| a `*.spec.ts`/`*.spec.tsx` file, new or changed                  | `npx nx test todo --testPathPattern=<name>` or `npx nx test todo-be --testPathPattern=<name>`, scoped to it |

Fix everything these report before moving on — they're pass/fail, not advisory. If a check can't run (e.g. MongoDB isn't running locally), say so explicitly in the final report rather than skipping it silently.

Finish this phase with `git status --short` and read it — confirm nothing unexpected got created (stray build artifacts, `.env` changes, files outside what the phase called for) before handing off.

### Verify and review in parallel

Once the deterministic checks pass, launch two subagents in parallel — a single message with two Agent tool calls:

- One runs `/verify` against the change.
- One runs `/code-review` against the current diff (default effort).

Give each subagent the phase's **Goal (measurable)** as the definition of correct behavior, plus the list of files you touched. Don't tell them what you believe is already correct — let them check independently.

If the verify subagent needs to sign in to exercise an authenticated page or flow: this repo has no fixed seeded test account. Start the Firebase Auth Emulator (`npm run emulator`, or `npm run all` for the full stack), then either register a throwaway account through the app's "Create One" link or use the emulated Google sign-in dialog — both work against the emulator with no real email/Google account required. See the README's "Local Auth Emulator" section for details.

Wait for both to finish, then:

- Fix anything either surfaces that's a real correctness bug or would fail the **Goal (measurable)** check.
- Skip cosmetic or low-confidence findings unless they're trivial to fix.
- If you make a fix because of a finding, re-run the deterministic checks above plus whichever of verify/code-review caught it — not both blindly.

If the **Goal (measurable)** requires infrastructure that isn't running locally (MongoDB, the Firebase emulator, etc.), say so explicitly instead of silently skipping that part of verification.

### Report

Reply in chat with a short summary, not a document:

- What changed, file by file.
- Why (tie it back to the phase's **Why** section).
- Any non-obvious decisions you made that the plan didn't spell out (naming, error handling, defaults, etc.).
- Results of the deterministic checks, and what verify/code-review found and what you did about it.
- The final `git status --short` output, so the user can see exactly what's about to be committed.
