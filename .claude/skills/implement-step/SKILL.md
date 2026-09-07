---
name: implement-step
description: Implement a single step from a plan document in docs/ (e.g. "PLAN.md 5.2"), looping on its "Done when" checks until they pass, then verify and code-review in parallel via subagents. Does not commit. Use when the user asks to implement/do/build a specific plan step or phase.
argument-hint: <plan-document> <phase-or-step>
user-invocable: true
---

# Implement Plan Phase

## Usage

```
/implement-step PLAN.md <phase-or-step>   # e.g. PLAN.md 5.2
```

Args: `<plan-document> <phase-or-step>`. A bare filename (no `/`) resolves under `docs/`. `5` means phase 5; `5.2` means step 5.2. The project plan is `docs/PLAN.md`.

## Workflow

### Sync `main` and create a branch

- Check `git status --short` first. If the working tree isn't clean, stop and ask the user how to proceed rather than silently stashing or discarding anything.
- `git checkout main && git pull origin main`.
- Create a new branch off the updated `main`: `git checkout -b <name>`.
- The branch name must be descriptive and self-explanatory of what the phase actually does — e.g. `add-shared-todo-schemas`, not `phase-0` or `add-validation-phase`. Never include the plan's phase number (or any other number) in the branch name; a reader with no access to the plan doc should be able to tell what the branch does from its name alone.

### Locate and read the step

Phases are markdown headers like `## Phase <N> — <title>`. Most phases contain numbered **steps** (`### Step <N>.<M>`).

**Implement exactly one step per invocation, not a whole phase.** Given only a phase number, implement its first unimplemented step and say which one you picked. Given `<N>.<M>`, implement that step.

Each step has these subsections:

| Subsection           | What it means                                  |
| -------------------- | ---------------------------------------------- |
| **What to do**       | the instructions                               |
| **Why**              | the reason — read it, it constrains the how    |
| **What to expect**   | known gotchas; read before starting, not after |
| **What to learn**    | the concept the step teaches                   |
| **Not in this step** | binding scope limit — do not cross it          |
| **Done when**        | **the contract.** Machine-checkable pass/fail  |

Older phases (11–13) predate this format and use **Goal (measurable)**, **Concepts**, **Libs/deps**, **Files** instead. Treat **Goal (measurable)** + **Acceptance checks** as **Done when**.

If the document, phase, or step doesn't exist, stop and say so — never guess or substitute.

Note the step's **Done when** verbatim before writing any code. It defines finished.

### Implement the step

- Implement exactly what **What to do** describes — nothing from later steps or phases, even if related.
- Respect **Not in this step** absolutely. If you cannot finish without crossing it, stop and report.
- Follow this repo's `CLAUDE.md` conventions: no AI attribution in commits (not relevant mid-implementation, but don't leave stray comments referencing it either), Tailwind utility classes from `tailwind.config.js` — never inline hex values or new color constants, DRY/KISS/SRP, component/function composition over large multi-purpose ones.
- Touch whatever's actually needed for this phase: schema, backend module, frontend component, config, or docs — match what the phase's **Files** list calls for.

#### Reuse ladder — before writing new code

Stop at the first rung that holds:

1. **Does it need to exist?** Skip it if the Goal doesn't need it.
2. **Already in this repo?** Search first — `TodoService`, `executeOperation`, `libs/types` schemas, existing hooks and fetchers. Extend it rather than adding a sibling.
3. **Stdlib does it?** `crypto`, `Intl`, `URL`, array and object built-ins.
4. **Native platform does it?** HTML5 inputs, CSS, browser APIs, MongoDB indexes.
5. **Already in `package.json`?** Use it. Never add a dependency here — if a phase needs one, stop and ask.
6. **Then write it** — the smallest version that meets the Goal.

Say which rung you stopped at when you add anything non-trivial.

This is about _how_ you build, not _whether_ the plan is right. Tests, evals, migrations, confirmation gates, validation, and accessibility are the Goal — never trim them. If the ladder fights the plan, the plan wins; say so.

### Do not commit

- Leave changes in the working tree, staged or not. Never run `git commit`. The branch was already created in the sync step above — the user runs `/commit` themselves afterward.
- Don't create extra markdown files summarizing what you did (process docs, branch-rename notes, etc.) — only the files the phase's Goal actually calls for. The summary at the end goes in chat, not a file.

### Loop on "Done when" until it passes

**Do not report a step done while any `Done when` line fails.** Loop:

1. Run every command in the step's **Done when**.
2. All pass → go to the deterministic checks below.
3. Any fail → fix the cause, then run **all of them again** from the top. A later fix can break an earlier check.
4. After **3 full failed rounds**, stop. Report what still fails, what you tried, and your best guess at why. Do not keep going.

Rules while looping:

- Fix the **cause**, never the check. Deleting an assertion, loosening a test, adding `as any`, or `--force` is failing the step, not passing it.
- Never edit the plan document to make a step easier.
- If a `Done when` line is not machine-checkable ("feels fast", "works well"), say so in your report and check it by hand — do not silently skip it.
- If a check cannot run at all (MongoDB not started, no emulator), say so explicitly. Never report a check as passing that you did not run.

### Run deterministic checks yourself first

`/verify` only drives behavior end-to-end — by design it does not typecheck or lint. `/code-review` is judgment-based, not a compiler. Neither is guaranteed to catch what `git`/CI would reject. Run these directly (not via a subagent) before spending time on the verify-and-review step below, based on what you actually touched:

| You touched                                                     | Run                                                                                                                                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| any `.ts`/`.tsx` file                                           | `npm run typecheck` and `npm run lint`                                                                                                                                       |
| a Mongoose schema/model (`*.model.ts`, or a Nest `*.schema.ts`) | no migration system to run (MongoDB is schemaless) — instead run the affected repository/service's Jest suite and manually smoke-test the changed document shape via the app |
| anything under `apps/todo/src` (frontend)                       | `npx nx build todo`                                                                                                                                                          |
| anything under `apps/todo-be/src` (backend)                     | `npx nx build todo-be` and `npm run test:unit:be`                                                                                                                            |
| a `*.spec.ts`/`*.spec.tsx` file, new or changed                 | `npx nx test todo --testPathPattern=<name>` or `npx nx test todo-be --testPathPattern=<name>`, scoped to it                                                                  |

Fix everything these report before moving on — they're pass/fail, not advisory. If a check can't run (e.g. MongoDB isn't running locally), say so explicitly in the final report rather than skipping it silently.

Finish this phase with `git status --short` and read it — confirm nothing unexpected got created (stray build artifacts, `.env` changes, files outside what the phase called for) before handing off.

### Verify and review in parallel

Once the deterministic checks pass, launch two subagents in parallel — a single message with two Agent tool calls:

- One runs `/verify` against the change.
- One runs `/code-review` against the current diff (default effort).

Give each subagent the step's **Done when** as the definition of correct behavior, plus the list of files you touched. Don't tell them what you believe is already correct — let them check independently.

If the verify subagent needs to sign in to exercise an authenticated page or flow: this repo has no fixed seeded test account. Start the Firebase Auth Emulator (`npm run emulator`, or `npm run all` for the full stack), then either register a throwaway account through the app's "Create One" link or use the emulated Google sign-in dialog — both work against the emulator with no real email/Google account required. See the README's "Local Auth Emulator" section for details.

Wait for both to finish, then:

- Fix anything either surfaces that's a real correctness bug or would fail a **Done when** check.
- Skip cosmetic or low-confidence findings unless they're trivial to fix.
- If you make a fix because of a finding, re-run the deterministic checks above plus whichever of verify/code-review caught it — not both blindly.

If **Done when** requires infrastructure that isn't running locally (MongoDB, the Firebase emulator, etc.), say so explicitly instead of silently skipping that part of verification.

### Report

Reply in chat with a short summary, not a document:

- What changed, file by file.
- Why (tie it back to the step's **Why** section).
- Any non-obvious decisions you made that the plan didn't spell out (naming, error handling, defaults, etc.).
- The **Done when** results line by line, with real output, and how many loop rounds it took.
- Which reuse-ladder rung you stopped at for anything non-trivial you added.
- Results of the deterministic checks, and what verify/code-review found and what you did about it.
- The final `git status --short` output, so the user can see exactly what's about to be committed.
