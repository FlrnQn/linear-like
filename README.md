# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 8 — Analytics, performance & virtualization.** Cursor-paginated issue lists, a virtualized List view, a workspace dashboard (stat tiles + Recharts activity chart), and composite indexes verified against a 10k-issue seed. Real-time (WebSocket) landed in Phase 7; a command palette, persistent sidebar, light/dark theme, and Motion-driven polish in Phase 6. 3D accents and final polish are what's left.

## Stack

| Layer      | Choices                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Form, TanStack Virtual, Zustand, dnd-kit, Radix UI, cmdk, Motion, Recharts, Lucide, Tailwind CSS v4 |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis (pub/sub), WebSocket (`@fastify/websocket`)                                                                             |
| Database   | Drizzle ORM (node-postgres driver), Drizzle Kit migrations, snake_case DB / camelCase JS via `casing: 'snake_case'`                                                       |
| Auth       | Argon2 password hashing, JWT access tokens (`@fastify/jwt`), rotating opaque refresh tokens in an httpOnly cookie                                                         |
| Validation | Zod schemas shared between web and api via `@lynx/types` (request bodies, forms, env parsing)                                                                             |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose                                                                                                |

Additional libraries called for in the full spec (shadcn/ui, Three.js/R3F) are **not installed yet**. They're introduced in the phase where they're first actually used, so every dependency in `package.json` has a real caller. TanStack Virtual and Recharts joined in Phase 8.

## Architecture

```text
lynx/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── app/            # router/query-client setup, AppProviders (session bootstrap)
│   │       ├── routes/         # TanStack Router routes (/, /login, /signup, /settings, /teams/$id, /projects/$id)
│   │       ├── features/       # auth, workspaces, teams, projects, cycles, issues, labels, comments,
│   │       │                   # activities, search, command-palette, realtime, dashboard
│   │       ├── components/     # cross-feature shared UI (e.g. ToastStack)
│   │       ├── layouts/        # Sidebar (collapsible, animated, workspace nav)
│   │       ├── hooks/          # (reserved) cross-cutting hooks
│   │       ├── lib/            # api-client (auth header + refresh-on-401), API base URL
│   │       ├── stores/         # Zustand: auth, ui (theme/sidebar/palette), workspace, toast
│   │       └── styles/         # Tailwind entry + design tokens
│   │
│   └── api/                    # Fastify backend
│       └── src/
│           ├── modules/        # health, auth, users, workspaces, teams, projects, cycles, issues,
│           │                   # labels, comments, activities, search, dashboard
│           ├── plugins/        # Fastify plugins (cors, sensible, cookie, jwt)
│           ├── middleware/     # requireWorkspaceRole (RBAC check)
│           ├── lib/            # HttpError hierarchy shared by routes and services
│           ├── db/             # Postgres pool, Redis client, Drizzle schema/relations/migrations/seed
│           ├── websocket/      # WS route + Redis pub/sub fan-out (events.ts, websocket.plugin.ts)
│           ├── app.ts          # buildApp(): assembles the Fastify instance (testable)
│           └── server.ts       # boots buildApp() and starts listening
│
├── packages/
│   ├── config/                 # shared tsconfig bases (base/react/node)
│   ├── types/                  # shared TypeScript types (@lynx/types)
│   └── shared/                 # shared runtime utils, e.g. cn() (@lynx/shared)
│
├── docker-compose.yml           # PostgreSQL 17 + Redis 7
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

`packages/ui` from the target architecture isn't created yet — it will show up once a component is truly shared _across_ features (not just within one), rather than as an empty shell today.

### Why this shape

- **`apps/api/app.ts` vs `server.ts`** — `buildApp()` returns a fully wired Fastify instance without calling `.listen()`, which is exactly what Fastify's `.inject()` testing API needs later (Phase 10) without booting a real socket.
- **Env validation with Zod** — `apps/api/src/env.ts` parses `process.env` once at boot with sane defaults matching `docker-compose.yml`, so `pnpm dev` works out of the box even without a local `.env` file.
- **`@lynx/types` shared across web/api** — every Zod schema (auth, workspaces, teams, projects, cycles, issues, labels, comments) and enum (`ISSUE_STATUSES`, `ISSUE_PRIORITIES`, …) is defined once and consumed by both the API routes/Drizzle enums and the frontend forms/selects, so client and server can't drift.
- **TanStack Router, not `react-router`** — file-based routes with full type-safety on params/search, and built-in code-splitting per route (`autoCodeSplitting: true` in `vite.config.ts`).
- **Tailwind v4 CSS-first config** — no `tailwind.config.ts`; tokens live in `src/styles/globals.css` via `@theme`, with light/dark values swapped through a `.dark` class scope, ready for a real theme switcher later.

## Database

Schema lives in `apps/api/src/db/schema/` (one file per entity) and covers the full domain from the spec: `users`, `workspaces`, `workspace_members`, `teams`, `team_members`, `projects`, `cycles`, `issues`, `labels`, `issue_labels`, `comments`, `activities`. `apps/api/src/db/relations.ts` wires Drizzle's relational query API (`db.query.issues.findFirst({ with: {...} })`) across all of them.

Notable design decisions:

- **Cycles belong to a team, not the workspace.** The spec's relationship diagram shows Team/Project/Cycle as siblings under Workspace, but that's a simplification — Linear's actual model (and the more coherent one) scopes cycles to a team, since a cycle is a fixed time-box for that team's issues. Projects stay workspace-scoped so they can span multiple teams.
- **No stored `identifier` column.** `ENG-421`-style identifiers are computed by joining `teams.key` with `issues.number`, not denormalized onto the row — avoids a sync hazard if a team's key ever changed.
- **`teams.issueCount` is a running counter**, incremented when issues are created, used to assign each new issue's per-team sequential `number` (equivalent to `MAX(number)+1` but race-safe under concurrent inserts since the increment and the insert happen in the same transaction — see `apps/api/src/modules/issues/issues.service.ts`).
- **Audit-friendly deletes.** `activities.issueId` is `ON DELETE SET NULL` (not cascade) so a permanent "Florian deleted ENG-421" log entry can outlive the issue row; the `metadata` jsonb column carries a snapshot for exactly that case.
- **`issues.sortOrder`** (float) exists from day one for drag-and-drop Kanban ordering (Phase 5) — retrofitting an ordering column after real rows exist means a backfill migration, so it's cheaper to add now.

### Migrations

Drizzle Kit generates versioned SQL migrations from the schema; a small programmatic runner applies them (works in any environment with just `drizzle-orm` installed, no dev-only `drizzle-kit` dependency required at runtime):

```bash
pnpm db:generate   # diff schema/*.ts against migrations/ and write new SQL
pnpm db:migrate    # apply pending migrations to DATABASE_URL
pnpm db:studio     # open Drizzle Studio to browse the database
```

### Seeding

```bash
pnpm db:seed                        # truncates all tables, seeds ~120 issues
SEED_ISSUE_COUNT=2000 pnpm db:seed  # scale up, e.g. for virtualization testing (Phase 8)
```

The seed is deterministic (`faker.seed(1234)`) and produces one workspace ("Lynx Demo") with 8 users, 3 teams (ENG/DES/PRO), labels, projects, 2 cycles per team, and issues distributed across statuses/priorities/assignees with comments and activity-log entries — inserted in batches of 500 rows so it scales to large counts without hitting PostgreSQL's parameter limit.

Each issue gets its own `createdAt`, spread over the last 60 days (`faker.date.between`), rather than sharing the single `now()` timestamp a naive bulk insert would give every row. That distinction only shows up at realistic volume — at ~120 issues it's invisible, but at 10k it's the difference between a flat single-day spike and a chart that actually looks like 30 days of activity, which is what surfaced it while building the Phase 8 dashboard.

## Authentication & permissions

- **Password hashing**: Argon2 (`argon2` package) — OWASP's current recommendation over bcrypt.
- **Access tokens**: short-lived JWTs (15 min default) signed by `@fastify/jwt`, sent as `Authorization: Bearer` and kept **in memory only** on the client (a Zustand store, never `localStorage`) to limit XSS exposure.
- **Refresh tokens**: opaque random tokens, stored **hashed** (SHA-256) in a `sessions` table, delivered via an `httpOnly`/`sameSite=lax` cookie scoped to `/auth`. Every `/auth/refresh` call **rotates** the token (old session revoked, new one issued) — standard theft-detection practice, and it means logout / "sign out of this device" is a real server-side revocation, not just a client-side token drop.
- **Silent refresh on load**: since the access token isn't persisted, `AppProviders` calls `/auth/refresh` once on boot to restore a session from the cookie before rendering any route — see `apps/web/src/features/auth/bootstrap-session.ts`.
- **401 handling**: `apps/web/src/lib/api-client.ts` transparently retries a request once after a successful silent refresh, de-duplicating concurrent refresh calls so multiple simultaneous 401s don't race.
- **Permissions**: workspace roles (`OWNER`/`ADMIN`/`MEMBER`/`GUEST`) are checked **server-side only**, in the route handler via `requireWorkspaceRole()` — e.g. creating a team requires `OWNER` or `ADMIN`. The frontend never gates access based on role; it only reflects what the API allows.
- **Errors**: every thrown `HttpError` (see `apps/api/src/lib/errors.ts`) and every Zod validation failure are normalized by the global error handler into `{ error: { message, statusCode, issues? } }` — one shape for the whole API.

## Issues, labels, comments & activity

- **Identifiers are computed, never stored** — `GET /issues` joins `teams.key` with `issues.number` at read time (`apps/api/src/modules/issues/issues.mapper.ts`), matching the Phase 2 decision to avoid denormalization.
- **Per-team issue numbers are race-safe** — creating an issue atomically increments `teams.issueCount` inside the same transaction as the insert (`UPDATE ... SET issue_count = issue_count + 1 RETURNING issue_count`), so two concurrent creates in the same team can't collide on the same number.
- **Every mutation writes an activity** — `updateIssue()` diffs the incoming patch against the current row and only logs the activity types that actually changed (`ISSUE_STATUS_CHANGED`, `ISSUE_PRIORITY_CHANGED`, `ISSUE_ASSIGNED`, `ISSUE_LABELED`/`ISSUE_UNLABELED`), so the feed reads like a real history, not a generic "issue updated".
- **Deleting an issue still leaves a trail** — the `ISSUE_DELETED` activity is inserted _before_ the issue row is deleted, inside the same transaction; the FK's `ON DELETE SET NULL` (see [Database](#database)) then nulls out `issueId` on every one of that issue's activities automatically, leaving a permanent workspace-level log with a `{identifier, title}` snapshot in `metadata`.
- **Optimistic UI, honestly scoped** — status/priority/title/description/estimate changes update the issue detail view instantly (with rollback on error) because they map 1:1 onto the `Issue` shape. Assignee and label changes wait for the server response instead, because rendering them optimistically would require resolving a bare `assigneeId`/`labelIds` into full user/label objects on the client — doable, but not worth the risk of a flickering wrong render for this phase. See `apps/web/src/features/issues/use-update-issue.ts`.
- **The issue detail view is a Radix `Dialog`**, not a route — matches the "drawer over full page navigation" UX from the spec, and gets a real focus trap, `Escape`-to-close, and ARIA wiring for free instead of hand-rolling it.
- **Permissions**: any workspace member (including `GUEST`) can view issues/comments/activity; creating, editing, or deleting an issue or label requires `OWNER`/`ADMIN`/`MEMBER`.

## Projects, cycles & Kanban

- **Cross-scope validation on write, not just read.** Assigning `projectId`/`cycleId` to an issue checks that the project belongs to the issue's workspace and the cycle belongs to the issue's team (`assertProjectBelongsToWorkspace` / `assertCycleBelongsToTeam` in `apps/api/src/modules/issues/issues.service.ts`) — otherwise nothing would stop an issue from silently linking to another team's cycle.
- **Cycle numbering isn't race-hardened like issue numbering.** Unlike `teams.issueCount` (Phase 2/4), cycle numbers are computed with a plain `MAX(number)+1` inside a transaction, no dedicated counter column. This was a deliberate asymmetry from Phase 2: cycles are created rarely (a handful per team per quarter) versus issues (constantly), so the tiny theoretical race window wasn't worth a schema column.
- **The Kanban board is `dnd-kit`, not a custom drag implementation** — `@dnd-kit/core` + `@dnd-kit/sortable` give per-column `SortableContext`s plus `useDroppable` on each column (so dropping into an _empty_ column still registers), and `closestCorners` collision detection for reliable cross-column drops.
- **Drag-and-drop is genuinely optimistic across every open view**, not just the dragged card. `useUpdateIssue` (`apps/web/src/features/issues/use-update-issue.ts`) patches the single-issue cache _and_ every currently-cached `['issues', ...]` list query — so if the List view and Kanban view both have data cached, dragging a card in the Kanban updates the List's cache too, with automatic rollback on error.
- **New issue position uses fractional ordering**: dropping a card computes `sortOrder` as the midpoint between its new neighbors (`(prev + next) / 2`), falling back to `± 1000` at either end of a column. Only the dragged issue is written — no bulk renumbering of the rest of the column.

## Command palette, sidebar & polish

- **`cmdk` inside a hand-rolled Radix `Dialog`**, not `Command.Dialog`. cmdk's own dialog wrapper doesn't expose the `forceMount` hook Motion needs for exit animations, so the palette reuses the same Radix-`Dialog` + `AnimatePresence(forceMount)` pattern as the issue detail view — one consistent way to build an animated modal across the app, instead of two.
- **Global `⌘K` listener lives in the palette component itself** (a `keydown` effect at the root), not a separate keybinding library — a single shortcut didn't justify one.
- **`activeWorkspaceId` moved from page-local `useState` to a persisted Zustand store** (`stores/workspace-store.ts`). The palette is rendered once at the app root and has no route params to read a workspace from, so "which workspace am I in" had to become real global state — the first genuine cross-page UI-state need in the app, exactly the case Zustand is for.
- **Theme is a Zustand-persisted class toggle** (`.dark` / default `:root`), not a `prefers-color-scheme` media query alone — initialized from the OS preference once, then fully user-controlled via Settings or the palette.
- **Optimistic-update errors now surface as a toast**, not just a silent cache rollback — `useUpdateIssue`'s `onError` pushes "changes reverted" so a failed drag isn't invisible.
- Motion is used for: the palette and issue-detail dialog (fade + scale enter, `forceMount`+`AnimatePresence` for real exit animations on the palette), the sidebar's collapse width transition, issue-row layout/enter/exit animations in the list view, and the toast stack's spring-in/fade-out. Dragged Kanban cards deliberately do **not** get a Motion `layout` animation — it fights with dnd-kit's own transform-based positioning on the same element, and a broken drag would be worse than no animation.

## Real-time

- **Redis finally earns its place in the stack.** Phases 1–6 only used it for a health-check ping; Phase 7 uses it for what it's actually for — pub/sub fan-out (`workspace:events` channel) so `issue.*`/`comment.*`/`project.updated` events reach every Fastify instance a client might be connected to, not just the instance that handled the mutation.
- **The event publisher is best-effort.** `publishWorkspaceEvent()` swallows its own errors — a Redis hiccup must never fail the issue update/comment/etc. that triggered it. Real-time is a UX enhancement, not a correctness dependency.
- **Auth handshake is a query-param JWT** (`wss://.../ws?token=...`), because the browser `WebSocket` constructor can't set custom headers. This is a known, widely-used simplification for this exact constraint — a hardened production system would prefer a short-lived one-time ticket instead of the access token itself, to avoid the token appearing in server/proxy logs. Documented here rather than silently shipped.
- **Room membership is verified server-side on every `subscribe` message** (`requireWorkspaceRole`), not trusted from the client — a socket only starts receiving a workspace's events after the same permission check every REST endpoint uses.
- **The frontend applies full server objects, not deltas.** `issue.updated` events carry the entire updated `Issue`; the client does `setQueryData` directly instead of re-deriving a patch, so it can never drift from what the server actually persisted (unlike the deliberately-partial optimistic patch used for local mutations).
- **Self-originated events are silenced.** Every event carries `actorId`; the client compares it to the logged-in user before showing a toast, so your own edits don't narrate themselves back at you — only teammates' changes do.
- **Reconnection is a flat 2s retry** while the hook is mounted, not exponential backoff — simple and sufficient at this scale; the effect re-runs (and reconnects with a fresh token) automatically whenever the access token rotates.

## Analytics, performance & virtualization

- **Cursor (keyset) pagination, not `OFFSET`, for `GET /issues`.** Seeded to 10k issues and measured with `EXPLAIN ANALYZE`: an `OFFSET 9000` page took ~30x longer than a composite-cursor equivalent, because Postgres has to walk and discard every skipped row instead of seeking straight in via the index. The cursor is `base64url({createdAt, id})`, and the tie-breaker on `id` is required — `createdAt` alone isn't unique enough to guarantee a stable sort order across pages when timestamps collide. See `apps/api/src/modules/issues/issues.service.ts`.
- **Composite indexes match the pagination query shape exactly**: `issues_team_created_idx` / `issues_project_created_idx` on `(teamId, createdAt, id)` (`apps/api/src/db/schema/issues.ts`) — the index's column order mirrors the `WHERE scope = ? ORDER BY createdAt DESC, id DESC` clause so Postgres can satisfy the whole query from the index without a separate sort step.
- **Cursor pagination is asymmetric with cycle numbering on purpose** — same reasoning as the Phase 5 `teams.issueCount` vs. plain `MAX(number)+1` split. Issue lists are read constantly and need to scale to thousands of rows; cycles per team are a handful, so they don't get the same treatment.
- **Deliberately did _not_ denormalize `workspaceId` onto `issues`** for the dashboard's "recent issues across the workspace" query, even though it would let that query skip the `teams` join. Measured it first: at 10k issues the join costs ~6ms. Not worth a schema column and a write-path to keep in sync for a query that's already fast.
- **The dashboard's day-bucketed activity chart is zero-filled server-side, not client-side** — `GROUP BY` only returns days that have at least one issue, which would silently draw a shorter, gap-toothed line for quiet periods. `apps/api/src/modules/dashboard/dashboard.service.ts` builds the full 30-day date list up front and left-joins counts onto it in JS, so every day in the window is always present, `count: 0` and all.
- **That same query group-bys on a `to_char(...)`-formatted string, not `::date`.** Verified empirically: the Postgres session runs in UTC, but the API process's local timezone is whatever the host is set to. Letting `node-postgres` parse a `date` column hands back a JS `Date` reinterpreted at _local_ midnight — serializing it to ISO and re-displaying it in a browser in yet another timezone can silently shift the label to the wrong calendar day. Formatting to `'YYYY-MM-DD'` inside Postgres sidesteps the whole reinterpretation chain.
- **The six dashboard stats queries run via `Promise.all`**, not sequentially — they're fully independent reads (total count, per-status breakdown, project count, team count, 30-day activity, recent issues), so there's no reason to pay for round-trip latency six times over.
- **The issue List view is virtualized with `@tanstack/react-virtual`, backed by `useInfiniteQuery`.** Only the ~15 rows in the visible viewport (plus overscan) are ever mounted, regardless of whether the team has 50 or 50,000 issues; scrolling near the end triggers `fetchNextPage()` automatically. Status filtering moved from a client-side `.filter()` on the fetched page (which only ever saw one page's worth of data) to a real server-side query param, now that the list is genuinely paginated.
- **Kanban intentionally does _not_ virtualize** — it fetches one capped page (`limit=500`, the API's max) instead. Combining `@tanstack/react-virtual`'s windowed rendering with `@dnd-kit`'s drag-and-drop (which needs every draggable's real DOM node for measurement) is a well-known hard combination; for a board view, "show the most recent 500 and say so" (a small notice appears above the board when a team exceeds it) is an honest, much simpler tradeoff than fighting that integration.
- **A shared cache-mapping helper (`apps/web/src/features/issues/issues-cache.ts`) replaced the old flat-array assumption** in optimistic updates and the realtime WebSocket handler. Once the List view's cache became `InfiniteData<PaginatedIssues>` and Kanban's became a plain `PaginatedIssues`, both `useUpdateIssue`'s optimistic patch and `issue.updated` WebSocket events needed to reach into either shape — `mapCachedIssues()` handles both without either call site needing to know which one it's looking at.
- **`IssueRow` and `KanbanCard` are wrapped in `React.memo`** — with hundreds of rows/cards on screen, a single issue's optimistic update (or a WebSocket patch) shouldn't force every sibling row to re-render.
- **The area chart's color follows the dataviz method, not eyeballing**: a single time-series (issues created per day) is a one-hue "sequential/1-categorical" color job, which is explicitly out of scope for the categorical six-checks validator (`validate_palette.js` — it validates _identity_ palettes; a lone accent hue isn't one). It reuses the app's existing single accent (`var(--color-accent)`, already contrast-checked by virtue of being the app's button/focus color) at full opacity for the 2px line and ~10% opacity for the area wash, with solid (never dashed) hairline gridlines and no legend — a single series needs none.
- **Measured, didn't assume, that the new `recharts`/`@tanstack/react-virtual` dependencies don't bloat the eagerly-loaded bundle.** Built both before and after this phase's changes (via `git stash`): the main entry chunk was 671.95 kB before and 672.13 kB after — a ~0.2 kB difference. Both new dependencies land inside route-level async chunks (`recharts` in the `/` route's chunk, `react-virtual` in the shared chunk behind the team/project issue views) thanks to TanStack Router's `autoCodeSplitting`, so they only download for someone who actually visits those routes. The pre-existing >500 kB main-chunk warning predates this phase and wasn't introduced or made worse by it.

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 12 (`corepack enable` or `brew install pnpm`)
- Docker (for PostgreSQL + Redis)

## Quickstart

```bash
pnpm install
pnpm docker:up     # starts Postgres + Redis
pnpm db:migrate    # creates all tables
pnpm db:seed       # populates demo data
pnpm dev           # starts the API (:4000) and the web app (:5173)
```

Open http://localhost:5173 — you'll land on `/login`. Create an account via `/signup` (or use one of the seeded users — see `apps/api/src/db/seed.ts` — though seeded users have no password set, so sign up fresh for now), create your first workspace and team from the home screen, then click into the team to create/assign/prioritize/label/comment on issues, or drag cards between columns on the Kanban board. Press **⌘K** / **Ctrl+K** anywhere to search issues or jump to a team/project. Open the same workspace in two browser windows (or two browsers) to see edits from one appear live in the other. The API's `/health` endpoint (Postgres + Redis probes) is still available for ops/monitoring.

## Environment variables

No secrets are required to run locally — every variable below has a working default (matching `docker-compose.yml`), so `pnpm dev` runs without any `.env` file. Override by exporting real environment variables or creating your own `.env` in `apps/api/` (loaded via `dotenv/config`).

| Variable                                                                | Default                                     | Used by        |
| ----------------------------------------------------------------------- | ------------------------------------------- | -------------- |
| `NODE_ENV`                                                              | `development`                               | api            |
| `PORT`                                                                  | `4000`                                      | api            |
| `HOST`                                                                  | `0.0.0.0`                                   | api            |
| `DATABASE_URL`                                                          | `postgres://lynx:lynx@localhost:5432/lynx`  | api            |
| `REDIS_URL`                                                             | `redis://localhost:6379`                    | api            |
| `CORS_ORIGIN`                                                           | `http://localhost:5173`                     | api            |
| `JWT_SECRET`                                                            | dev-only placeholder — **override in prod** | api            |
| `ACCESS_TOKEN_TTL`                                                      | `15m`                                       | api            |
| `REFRESH_TOKEN_TTL_DAYS`                                                | `30`                                        | api            |
| `VITE_API_URL`                                                          | `http://localhost:4000`                     | web            |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | `lynx` / `lynx` / `lynx` / `5432`           | docker-compose |
| `REDIS_PORT`                                                            | `6379`                                      | docker-compose |

## Available commands

Run from the repo root (orchestrated by Turborepo across all workspaces):

```bash
pnpm dev            # run all apps in dev mode
pnpm build          # build all apps/packages
pnpm typecheck      # tsc --noEmit / tsc -b across the workspace
pnpm lint           # ESLint across the workspace
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm docker:up      # start Postgres + Redis
pnpm docker:down    # stop Postgres + Redis
pnpm db:generate    # generate a migration from the schema
pnpm db:migrate     # apply pending migrations
pnpm db:seed        # reset + seed demo data
pnpm db:studio      # browse the database in Drizzle Studio
```

## Roadmap

- [x] Phase 1 — Monorepo, tooling, Docker services, verified full-stack skeleton
- [x] Phase 2 — Database schema, migrations, and seed (Drizzle)
- [x] Phase 3 — Auth, workspaces, teams, users
- [x] Phase 4 — Issues, statuses, priorities, labels, comments, activity
- [x] Phase 5 — Projects, cycles, Kanban (dnd-kit)
- [x] Phase 6 — Command palette, keyboard shortcuts, search, animations
- [x] Phase 7 — Real-time (WebSocket), optimistic updates
- [x] Phase 8 — Analytics, performance, virtualization
- [ ] Phase 9 — 3D accents, advanced animations, empty/loading states
- [ ] Phase 10 — Tests, CI, docs, final cleanup
