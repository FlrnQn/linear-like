# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 3 — Auth, Workspaces, Teams, Users.** The monorepo, tooling, database, and a working authentication + permissions system with a minimal functional UI are in place. Issues/projects/cycles and visual polish land in the phases that follow.

## Stack

| Layer      | Choices                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Form, Zustand, Tailwind CSS v4                |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis                                                                   |
| Database   | Drizzle ORM (node-postgres driver), Drizzle Kit migrations, snake_case DB / camelCase JS via `casing: 'snake_case'` |
| Auth       | Argon2 password hashing, JWT access tokens (`@fastify/jwt`), rotating opaque refresh tokens in an httpOnly cookie   |
| Validation | Zod schemas shared between web and api via `@lynx/types` (request bodies, forms, env parsing)                       |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose                                          |

Additional libraries called for in the full spec (TanStack Virtual, Motion, dnd-kit, shadcn/ui, Radix, Recharts, Three.js/R3F) are **not installed yet**. They're introduced in the phase where they're first actually used, so every dependency in `package.json` has a real caller.

## Architecture

```text
lynx/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── app/            # router/query-client setup, AppProviders (session bootstrap)
│   │       ├── routes/         # TanStack Router file-based routes (/, /login, /signup)
│   │       ├── features/       # feature modules: auth, workspaces, teams (api + hooks + forms)
│   │       ├── components/     # (reserved) shared UI components — Phase 4+
│   │       ├── layouts/        # (reserved) page layouts (sidebar, shell…) — Phase 6
│   │       ├── hooks/          # (reserved) cross-cutting hooks
│   │       ├── lib/            # api-client (auth header + refresh-on-401), API base URL
│   │       ├── stores/         # Zustand auth-store (in-memory access token + user)
│   │       └── styles/         # Tailwind entry + design tokens
│   │
│   └── api/                    # Fastify backend
│       └── src/
│           ├── modules/        # health, auth, users, workspaces, teams (routes + services)
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

`packages/ui` from the target architecture isn't created yet — it will show up with the first real shared component (Phase 4+), rather than as an empty shell today.

### Why this shape

- **`apps/api/app.ts` vs `server.ts`** — `buildApp()` returns a fully wired Fastify instance without calling `.listen()`, which is exactly what Fastify's `.inject()` testing API needs later (Phase 10) without booting a real socket.
- **Env validation with Zod** — `apps/api/src/env.ts` parses `process.env` once at boot with sane defaults matching `docker-compose.yml`, so `pnpm dev` works out of the box even without a local `.env` file.
- **`@lynx/types` shared across web/api** — `HealthCheckResponse`, plus every auth/workspace/team Zod schema, is defined once and consumed by both the API routes and the frontend forms, so client and server validation can't drift.
- **TanStack Router, not `react-router`** — file-based routes with full type-safety on params/search, and built-in code-splitting per route (`autoCodeSplitting: true` in `vite.config.ts`).
- **Tailwind v4 CSS-first config** — no `tailwind.config.ts`; tokens live in `src/styles/globals.css` via `@theme`, with light/dark values swapped through a `.dark` class scope, ready for a real theme switcher later.

## Database

Schema lives in `apps/api/src/db/schema/` (one file per entity) and covers the full domain from the spec: `users`, `workspaces`, `workspace_members`, `teams`, `team_members`, `projects`, `cycles`, `issues`, `labels`, `issue_labels`, `comments`, `activities`. `apps/api/src/db/relations.ts` wires Drizzle's relational query API (`db.query.issues.findFirst({ with: {...} })`) across all of them.

Notable design decisions:

- **Cycles belong to a team, not the workspace.** The spec's relationship diagram shows Team/Project/Cycle as siblings under Workspace, but that's a simplification — Linear's actual model (and the more coherent one) scopes cycles to a team, since a cycle is a fixed time-box for that team's issues. Projects stay workspace-scoped so they can span multiple teams.
- **No stored `identifier` column.** `ENG-421`-style identifiers are computed by joining `teams.key` with `issues.number`, not denormalized onto the row — avoids a sync hazard if a team's key ever changed.
- **`teams.issueCount` is a running counter**, incremented when issues are created, used to assign each new issue's per-team sequential `number` (equivalent to `MAX(number)+1` but race-safe under concurrent inserts once wrapped in a transaction — that transaction lives in the future issue-creation service, Phase 4).
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

Open http://localhost:5173 — you'll land on `/login`. Create an account via `/signup` (or use one of the seeded users — see `apps/api/src/db/seed.ts` — though seeded users have no password set, so sign up fresh for now), then create your first workspace and team from the home screen. The API's `/health` endpoint (Postgres + Redis probes) is still available for ops/monitoring.

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
- [ ] Phase 4 — Issues, statuses, priorities, labels, comments
- [ ] Phase 5 — Projects, cycles, Kanban (dnd-kit)
- [ ] Phase 6 — Command palette, keyboard shortcuts, search, animations
- [ ] Phase 7 — Real-time (WebSocket), optimistic updates
- [ ] Phase 8 — Analytics, performance, virtualization
- [ ] Phase 9 — 3D accents, advanced animations, empty/loading states
- [ ] Phase 10 — Tests, CI, docs, final cleanup
