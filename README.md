# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 5 — Projects, Cycles, Kanban.** Issues can now belong to a project and a cycle, and a full drag-and-drop Kanban board sits alongside the list view. Command palette, animations, and visual polish land in the phases that follow.

## Stack

| Layer      | Choices                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Form, Zustand, dnd-kit, Radix UI, Lucide, Tailwind CSS v4 |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis                                                                               |
| Database   | Drizzle ORM (node-postgres driver), Drizzle Kit migrations, snake_case DB / camelCase JS via `casing: 'snake_case'`             |
| Auth       | Argon2 password hashing, JWT access tokens (`@fastify/jwt`), rotating opaque refresh tokens in an httpOnly cookie               |
| Validation | Zod schemas shared between web and api via `@lynx/types` (request bodies, forms, env parsing)                                   |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose                                                      |

Additional libraries called for in the full spec (TanStack Virtual, Motion, shadcn/ui, Recharts, Three.js/R3F) are **not installed yet**. They're introduced in the phase where they're first actually used, so every dependency in `package.json` has a real caller.

## Architecture

```text
lynx/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── app/            # router/query-client setup, AppProviders (session bootstrap)
│   │       ├── routes/         # TanStack Router file-based routes (/, /login, /signup, /teams/$teamId)
│   │       ├── features/       # auth, workspaces, teams, projects, cycles, issues, labels, comments, activities
│   │       ├── components/     # (reserved) shared UI components
│   │       ├── layouts/        # (reserved) page layouts (sidebar, shell…) — Phase 6
│   │       ├── hooks/          # (reserved) cross-cutting hooks
│   │       ├── lib/            # api-client (auth header + refresh-on-401), API base URL
│   │       ├── stores/         # Zustand auth-store (in-memory access token + user)
│   │       └── styles/         # Tailwind entry + design tokens
│   │
│   └── api/                    # Fastify backend
│       └── src/
│           ├── modules/        # health, auth, users, workspaces, teams, projects, cycles, issues, labels, comments, activities
│           ├── plugins/        # Fastify plugins (cors, sensible, cookie, jwt)
│           ├── middleware/     # requireWorkspaceRole (RBAC check)
│           ├── lib/            # HttpError hierarchy shared by routes and services
│           ├── db/             # Postgres pool, Redis client, Drizzle schema/relations/migrations/seed
│           ├── websocket/      # (reserved) real-time layer — Phase 7
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

Open http://localhost:5173 — you'll land on `/login`. Create an account via `/signup` (or use one of the seeded users — see `apps/api/src/db/seed.ts` — though seeded users have no password set, so sign up fresh for now), create your first workspace and team from the home screen, then click into the team to create/assign/prioritize/label/comment on issues. The API's `/health` endpoint (Postgres + Redis probes) is still available for ops/monitoring.

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
- [ ] Phase 6 — Command palette, keyboard shortcuts, search, animations
- [ ] Phase 7 — Real-time (WebSocket), optimistic updates
- [ ] Phase 8 — Analytics, performance, virtualization
- [ ] Phase 9 — 3D accents, advanced animations, empty/loading states
- [ ] Phase 10 — Tests, CI, docs, final cleanup
