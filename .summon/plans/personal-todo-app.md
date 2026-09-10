---
status: pending
title: Personal Todo App with Due Dates (local-only)
---

## Context

The project directory is currently empty — no `package.json`, no `src/`. This plan therefore includes
initial scaffolding as Phase 0. Scope is deliberately tight: one person, one task list, browser
`localStorage` persistence, and due-date handling as the headline feature. No accounts, no backend,
no sharing, no tags/projects/subtasks.

### What "reminders" means here (be explicit)

With no server there is no way to push a notification to a closed browser. Reminders are therefore
delivered **in-app only**, in this order of priority:

1. **Visual urgency states** — overdue and due-today tasks are visually distinct and sorted to the top.
2. **Due-date grouping** — the list is grouped into Overdue / Today / Tomorrow / Upcoming / No date.
3. **An at-a-glance counter** — a small summary line ("2 overdue, 1 due today").
4. **Optional browser notification (stretch, Phase 5)** — using the Notification API, fired only while
   the tab is open, once per task per day, gated behind an explicit "Enable reminders" opt-in button.
   If permission is denied or unsupported, the app silently falls back to the visual states above.

No push notifications, no service worker, no email, no scheduled background jobs.

## Phase 0 — Scaffolding and baseline

1. Initialise the project with Vite (React + TypeScript template) so `package.json`, `index.html`,
   `tsconfig.json`, and `vite.config.ts` exist. Install `@tanstack/react-router`,
   `@tanstack/router-plugin`, `tailwindcss`, and `@tailwindcss/vite`.
   *Outcome:* `npm run dev` serves a blank app.
2. Configure `vite.config.ts` with the React plugin, the TanStack Router plugin (file-based routing
   pointed at `src/routes`), and the Tailwind plugin. Add the `@/` → `src/` path alias in both
   `vite.config.ts` and `tsconfig.json`.
   *Outcome:* `@/` imports resolve; `src/routeTree.gen.ts` is generated automatically on dev start
   and is never hand-edited.
3. Create `src/styles/global.css` containing exactly `@import "tailwindcss";` as its first line, plus
   a small block of CSS custom properties for the app's accent and urgency colours.
   *Outcome:* Tailwind utilities work.
4. Create `src/main.tsx` that imports `@/styles/global.css` once, builds the router from the generated
   route tree, and mounts the app into the root element.
   *Outcome:* app renders through the router.
5. Create `src/routes/__root.tsx` as the app shell: centred max-width column, page background, a
   simple header with the app name, and the child route outlet.
   *Outcome:* consistent layout wrapper for every route.

**Checkpoint A:** blank styled shell renders at `/` with no console errors.

## Phase 1 — Data model and types

6. Create `src/types/todo.ts` defining the `Todo` shape: `id` (string), `title` (string),
   `completed` (boolean), `dueDate` (ISO date-only string or `null`), `createdAt` (ISO timestamp),
   and `completedAt` (ISO timestamp or `null`). Also define a `DueBucket` union covering
   `overdue` | `today` | `tomorrow` | `upcoming` | `none`, and a `TodoFilter` union covering
   `all` | `active` | `completed`.
   *Outcome:* a single source of truth for task shape; date stored as date-only string to avoid
   timezone drift.

## Phase 2 — Persistence layer and state hook

7. Create `src/lib/storage.ts` with read and write helpers for a single versioned localStorage key
   (e.g. `todo-app:v1`). Reading must be defensive: wrap in try/catch, validate that the parsed value
   is an array, drop entries missing an `id` or `title`, and return an empty array on any failure.
   Writing must also be try/catch-guarded so a full or blocked storage quota never crashes the app.
   *Outcome:* corrupt or absent storage degrades to an empty list instead of a white screen.
8. Create `src/hooks/useTodos.ts` — the only place task state is mutated. It loads once from storage on
   mount, holds tasks in React state, persists on every change, and exposes `todos`, `addTodo`,
   `updateTodo`, `toggleTodo`, `deleteTodo`, and `clearCompleted`. Generate ids with `crypto.randomUUID()`.
   *Outcome:* components never touch localStorage directly.
9. Create `src/lib/dates.ts` with pure date helpers: today's date-only string, a `getDueBucket(dueDate)`
   that returns a `DueBucket`, a human label formatter ("Today", "Tomorrow", "Overdue by 3 days",
   "Fri 12 Sep"), and a comparator that sorts by bucket then by date then by creation time.
   All comparisons are done on local date-only values, never raw `Date` millisecond math.
   *Outcome:* one tested place for every due-date decision.

**Checkpoint B:** tasks added in one session survive a full page reload.

## Phase 3 — Route and page structure

10. Create `src/routes/index.tsx` as the single main route (`/`). It calls `useTodos`, owns the active
    filter in local state, derives grouped/sorted lists via `src/lib/dates.ts`, and composes the
    components from Phase 4.
    *Outcome:* the whole app lives at one URL — no unnecessary navigation for a personal list.
11. Add `src/routes/__root.tsx` handling for unknown paths via the router's `notFoundComponent`, showing
    a short message and a link back to `/`.
    *Outcome:* no dead ends on a mistyped URL.

## Phase 4 — Components

12. `src/components/TodoForm.tsx` — a single-line title input plus a native `<input type="date">` for the
    optional due date and a submit button. Trims input, refuses empty titles, clears and refocuses the
    input after submit, and supports Enter to add.
    *Outcome:* adding a task with or without a due date takes one interaction.
13. `src/components/TodoItem.tsx` — checkbox, title, due-date badge, edit affordance, delete button.
    Completed tasks render with reduced emphasis and a struck-through title. Inline edit mode swaps the
    title into a text input and the date into a date input; Enter or blur saves, Escape cancels.
    Delete is immediate but reversible only by re-adding — keep it a small, deliberate icon button.
    *Outcome:* full edit/complete/delete lifecycle per row, no modals.
14. `src/components/DueBadge.tsx` — small pill rendering the label from `src/lib/dates.ts`, coloured by
    bucket: overdue in red, today in amber, tomorrow and upcoming in neutral/slate, hidden entirely when
    there is no due date. Includes a `title` attribute with the exact date for hover clarity.
    *Outcome:* urgency is readable at a glance without reading dates.
15. `src/components/TodoList.tsx` — renders bucket sections in fixed order (Overdue, Today, Tomorrow,
    Upcoming, No date), each with a heading and a count, omitting empty sections. Completed tasks are
    collected into a single collapsed "Completed" section at the bottom rather than inside buckets.
    *Outcome:* the list reads as a prioritised agenda.
16. `src/components/FilterBar.tsx` — All / Active / Completed segmented control, the reminder summary
    line ("2 overdue · 1 due today"), and a "Clear completed" action that only appears when completed
    tasks exist.
    *Outcome:* lightweight control strip, no settings screen.
17. `src/components/EmptyState.tsx` — three distinct messages: first-run (no tasks ever), all-done
    (tasks exist but all completed), and filter-empty (e.g. Active filter with nothing active). Each is a
    short line of copy, no illustration dependency.
    *Outcome:* the app never shows a blank rectangle.

**Checkpoint C:** add, edit, complete, delete, filter, and grouping all work end to end.

## Phase 5 — Due-date polish and optional notifications

18. Handle the day-rollover edge case: recompute buckets when the tab regains focus or visibility so a
    task left open overnight moves from "Today" to "Overdue" without a manual reload.
    *Outcome:* buckets are never stale.
19. Add `src/hooks/useReminders.ts` — opt-in only. Exposes permission status and a request function; when
    granted, fires one browser notification per overdue/due-today task per calendar day while the tab is
    open, recording which task/day pairs have already fired in localStorage. Feature-detects
    `window.Notification` and no-ops when unavailable.
    *Outcome:* a genuine reminder nudge where the browser allows it, with a clean fallback where it does not.
20. Surface the opt-in as a single small "Enable reminders" button in `src/components/FilterBar.tsx`,
    hidden once permission is granted or permanently denied, with one line of copy stating reminders only
    appear while the app is open.
    *Outcome:* honest expectations, no dead toggle.

## Phase 6 — Styling, accessibility, and edge cases

21. Establish the visual direction in `src/routes/__root.tsx` and the components: a calm single-column
    layout (max width ~640px), generous vertical rhythm, one accent colour for primary actions, and
    red/amber reserved exclusively for due-date urgency so colour always means the same thing.
    Support dark mode only insofar as Tailwind's `dark:` variants are cheap to add alongside base styles.
    *Outcome:* focused, uncluttered personal tool.
22. Accessibility and interaction pass: label the checkbox and date inputs, give icon-only buttons
    accessible names, ensure visible focus rings, announce list-count changes via a polite live region,
    and confirm the whole flow is keyboard-operable.
    *Outcome:* usable without a mouse.
23. Edge-case sweep: very long titles (wrap, never overflow), dates far in the past or future,
    hundreds of tasks (verify no layout or scroll breakage), localStorage disabled or full,
    and a second tab writing concurrently (last write wins — document this, do not build sync).
    *Outcome:* known, documented behaviour under stress.

**Checkpoint D:** a full manual pass — add tasks with past/today/future/no dates, reload, edit, complete,
clear completed, and toggle filters — behaves correctly with no console errors.

## Explicitly out of scope

Accounts and auth, any database or backend, multi-device sync, sharing or collaboration, tags,
projects, subtasks, recurring tasks, attachments, drag-to-reorder, search, and analytics/streaks.
