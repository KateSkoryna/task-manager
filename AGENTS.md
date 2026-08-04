# Project Instructions

## Git Commits and Pull Requests

When making git commits in this repository:

- Never include AI-assistant, model, tool, or generator attribution in commit messages, pull-request titles, or pull-request descriptions.
- Do not add `Co-authored-by`, `Generated-by`, `Created-by`, or similar attribution trailers or footers.
- Remove automatically inserted AI branding or generation notices before committing or opening a pull request.
- Write simple, direct commit messages and pull-request descriptions that describe only the project changes.
- Follow standard git commit message conventions
- DO NOT commit and push changes without asking for user approval first
- Always let the user review changes before committing

Example of a proper commit message:

```
Add Vercel backend configuration

- Add vercel.json for backend deployment
- Create API entry point for serverless deployment
```

## Testing Before Deployment

Before making any changes that affect deployment:

- ALWAYS test the build locally first using `npm run build`
- Test the backend locally after building to ensure it works
- Verify API endpoints respond correctly
- Only suggest deployment after local testing succeeds
- DO NOT push changes directly - present them to the user for review first

## Testing Before Commits

- ALWAYS run tests before making commits
- Ensure all tests pass before committing changes
- Do not commit code that breaks existing tests

## Colors and Theming

All project colors are defined in `tailwind.config.js`. Use Tailwind utility classes wherever possible (`text-accent`, `bg-triadic-orange`, etc.).

For libraries that require raw hex values (e.g. recharts `Cell fill`), use the hex values directly — do NOT create intermediate color constant objects that duplicate the theme. The tailwind config is the single source of truth.

## Code Quality and Component Design

When creating components and functions:

- Follow the DRY (Don't Repeat Yourself) principle - avoid code duplication
- Follow the KISS (Keep It Simple, Stupid) principle - keep solutions simple and straightforward
- Each function should do one thing and do it well (Single Responsibility Principle)
- Use component composition and function composition to build complex functionality from simple, reusable parts
- Prefer small, focused functions over large, multi-purpose ones

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
