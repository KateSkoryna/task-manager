# Todo App Roadmap

> Status cross-checked against the codebase and `PLAN.md` (the original phased implementation plan, kept in the repo root for history).

## Shipped

### Firebase Authentication

Replaced the original JWT/bcrypt plan (`PLAN.md` Phases 0–1) — see `PLAN.md` Phase 11. Email/password + Google OAuth, backend verifies Firebase ID tokens via `firebase-admin`. No custom password hashing or refresh-token handling.

### User-Scoped Data + Extended Todo Properties

Todos and todolists are scoped per authenticated user (Mongo `ObjectId` reference, not the original numeric `userId`). Todos support `dueDate`, `location`, `notes`, `status` (`pending` / `successful` / `failed`), `completedAt`.

### Per-User Statistics

`GET /api/users/:userId/stats?period=day|week|month|year` — KPI cards (total/successful/failed/pending/completion rate), bar chart, line chart (completion trend), and a category breakdown chart on `StatisticsPage`, built with Recharts.

### TodoList Metadata & Sorting

Todolists support `priority` (low/medium/high), `category` (home/education/work/family/health), `dueDate`, `notes`, and client-side sorting by name/priority/due date/category.

### Image Support for Todo Items

Users can attach an image to a todo item. Images are uploaded on the frontend, compressed and encoded as base64, stored as a string in MongoDB, and rendered back as `<img src={base64}>`. Max file size: **5 MB**.

- Shared types: `image?: string | null` on `NewTodoItem`, `TodoItem`, `UpdateTodoItem` (`libs/types/src/lib/todo.types.ts`)
- Backend: `image` field on the model, extracted/validated (≤7M chars)/persisted in the controller and repository (`apps/todo-be/src/app/models/todo.model.ts`, `.../controllers/todo.controller.ts`, `.../repositories/todo.repository.ts`)
- Frontend: `compressImage(file)` utility — validates ≤5 MB, resizes to max 1200px, encodes as JPEG 85% (`apps/todo/src/app/lib/imageUtils.ts`)
- Frontend: image threaded through mutation hooks, data hook, and fetchers (`fetchers/api.tsx`, `hooks/useTodoListsData.ts`, `fetchers/todolist.ts`)
- `TodoForm`: file input, compression, thumbnail preview, error messaging
- `TodoItem`: thumbnail in card + image field in inline edit
- `TasksPage` detail panel: full-size image display when a task is selected

---

## Planned

### 1. Dashboard Page: The "Pulse" of Today

The Dashboard is transformed from a static view into a dynamic daily command center.

- **Daily Focus Strip:** A minimalist horizontal week view with "Today" highlighted by default. No heavy calendar widgets.
- **Smart Metric Ring:** A visual progress circle showing the percentage of completed tasks **only for the current day**.
- **Vital Tasks Snippet:** A dedicated high-visibility section displaying the top 3 high-priority tasks for today.
- **Inbox Counter:** A small, non-intrusive badge showing the number of unorganized tasks (tasks without a list or date).
- **Quick Add Action:** A prominent floating button that saves tasks to the "Inbox" by default for maximum speed.

### 2. Vital Tasks Page: Deep Work Mode

This page is designed to eliminate distractions and force progress on high-impact goals.

- **The "Rule of Three" Constraint:** Visually emphasizes the first three tasks. If more than five tasks are added, the UI applies a subtle "Focus Warning" to prevent burnout.
- **Expanded Card UI:** Unlike standard lists, Vital Tasks use large cards with clear typography and goal-oriented descriptions.
- **Focus Mode (Pomodoro):** A one-click "Start Focus" button on each task that triggers a fullscreen timer.
- **Visual Urgency:** Subtle animated borders or gradient accents for tasks with deadlines approaching within 4 hours.

### 3. My Tasks Page: Flexible Organization

The core of the app's database, now supporting both structured and unstructured data.

- **The Inbox Section:** A permanent top-level category for tasks where `list_id` is `null`. This removes the barrier of having to choose a folder immediately.
- **Drag-and-Drop Sorting:** Seamless movement of tasks from the "Inbox" into custom user-defined lists.
- **Multi-List View:** Ability to toggle between "All Tasks" (flat list) and "Grouped by List" (folders).

### 4. Gemini AI Integration

**Not started** — zero implementation in the codebase as of this writing (no AI endpoints, no embeddings, no `@google/generative-ai`/`@google/genai` calls yet; the `@google/genai` dependency is installed but unused). This section merges the product framing from the original `ai.md` with the more technical spec from `PLAN.md` Phase 9 — the two described the same feature area with some non-overlapping detail, so they're consolidated here as one plan.

The AI operates as backend middleware — no chat interface.

**Role 1: The Smart Parser (Assistant)** — _`PLAN.md` 9.1_

- **Mechanism:** When a user types a task, the backend sends the string to Gemini via `POST /api/ai/parse-todo`.
- **Outcome:** The AI extracts date, priority, location, and category; response validated/sanitized with Zod before returning.
- **User Experience:** User types "Doctor appointment Friday 4pm near Hauptbahnhof" → the app auto-fills date, location, and category ("Health"). User reviews and edits before submitting.

**Role 2: The Strategist (Mentor)**

- **Mechanism:** For any task in "Vital Tasks," the AI generates a background checklist.
- **Outcome:** When the user expands a task, they see "Suggested Steps" generated by Gemini.
- **User Experience:** "Build Backend" → subtasks "Setup Node.js," "Configure DB," "Define Routes" appear automatically.

**Role 3: The "Tough Love" Engine (Motivator)** — overlaps with _`PLAN.md` 9.3 (AI Productivity Insights)_

- **Mechanism:** A cron job analyzes progress; if Vital Tasks are stalled, Gemini triggers a notification. `PLAN.md`'s version is an on-demand `GET /api/users/:userId/insights?period=week` endpoint (streamed via SSE) rather than a background cron — worth deciding which trigger model to build.
- **Style:** "The Stick" approach.
- **User Experience:** "Kate, you've been staring at the same task for 4 hours. Stop overthinking and commit the first line of code now."

**Semantic Search (RAG)** — _`PLAN.md` 9.2, no equivalent in the original product plan_

- Embed each todo's `name + notes` (Gemini `text-embedding-004`) into a vector store (Qdrant) on save.
- `GET /api/users/:userId/todos/search?q=<query>` — embed the query, cosine-similarity search, return ranked results.
- Frontend semantic search bar highlighting matches across all lists.

**Auto-Categorisation & Priority Suggestion** — _`PLAN.md` 9.4_

- `POST /api/ai/suggest-list-meta` — suggests category + priority for a new list/todo name, shown as a dismissible chip in `TodoListForm`.

**GDPR & Privacy Hardening** — _`PLAN.md` 9.5, required before shipping any of the above_

- One-time consent banner before the first AI call; opt-out respected per feature (AI settings page).
- No raw user text logged server-side — only metadata (userId hash, endpoint, latency).
- Document a local-Ollama fallback so the app can run without sending data to Gemini.

### 5. Technical Architecture Notes

- **Database:** Modify `tasks` to allow `list_id` to be `NULL` (Inbox support).
- **Backend:** Node.js service using `@google/genai` to process task strings via system prompts.
- **Frontend:** React with a focus on minimalist design — no emojis or icons, per brand guidelines.
