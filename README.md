# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 2 — Database.** The monorepo, tooling, a health-checked full-stack skeleton, and the full Drizzle schema/migrations/seed pipeline are in place. Product-facing features (auth, issues UI, projects, real-time…) land in the phases that follow.

## Stack

| Layer      | Choices                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, Tailwind CSS v4                                                        |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis                                                                   |
| Database   | Drizzle ORM (node-postgres driver), Drizzle Kit migrations, snake_case DB / camelCase JS via `casing: 'snake_case'` |
| Validation | Zod (env parsing today; request/response schemas from Phase 3)                                                      |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose                                          |

Additional libraries called for in the full spec (TanStack Query/Form/Virtual, Zustand, Motion, dnd-kit, shadcn/ui, Radix, Recharts, Three.js/R3F) are **not installed yet**. They're introduced in the phase where they're first actually used, so every dependency in `package.json` has a real caller.

## Architecture

```text
lynx/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── app/            # (reserved) app-wide providers/composition — empty until Phase 3+
│   │       ├── routes/         # TanStack Router file-based routes
│   │       ├── features/       # (reserved) feature modules
│   │       ├── components/     # (reserved) shared UI components
│   │       ├── layouts/        # (reserved) page layouts (sidebar, shell…)
│   │       ├── hooks/          # cross-cutting hooks (e.g. useHealthCheck)
│   │       ├── lib/            # framework-agnostic helpers (API base URL…)
│   │       ├── stores/         # (reserved) Zustand UI-state stores
│   │       └── styles/         # Tailwind entry + design tokens
│   │
│   └── api/                    # Fastify backend
│       └── src/
│           ├── modules/health/ # health-check route (Postgres + Redis probes)
│           ├── plugins/        # Fastify plugins (cors, sensible…)
│           ├── middleware/     # (reserved) auth/permissions middleware
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

`packages/ui` from the target architecture isn't created yet — it will show up with the first real shared component (Phase 3+), rather than as an empty shell today.

### Why this shape

- **`apps/api/app.ts` vs `server.ts`** — `buildApp()` returns a fully wired Fastify instance without calling `.listen()`, which is exactly what Fastify's `.inject()` testing API needs later (Phase 10) without booting a real socket.
- **Env validation with Zod** — `apps/api/src/env.ts` parses `process.env` once at boot with sane defaults matching `docker-compose.yml`, so `pnpm dev` works out of the box even without a local `.env` file.
- **`@lynx/types` shared across web/api** — `HealthCheckResponse` is defined once and consumed by both the API route and the frontend hook, so they can't drift.
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

Open http://localhost:5173 — the home page calls `GET /health` on the API and shows live status dots for the API itself, PostgreSQL, and Redis.

## Environment variables

No secrets are required to run locally — every variable below has a working default (matching `docker-compose.yml`), so `pnpm dev` runs without any `.env` file. Override by exporting real environment variables or creating your own `.env` in `apps/api/` (loaded via `dotenv/config`).

| Variable                                                                | Default                                    | Used by        |
| ----------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| `NODE_ENV`                                                              | `development`                              | api            |
| `PORT`                                                                  | `4000`                                     | api            |
| `HOST`                                                                  | `0.0.0.0`                                  | api            |
| `DATABASE_URL`                                                          | `postgres://lynx:lynx@localhost:5432/lynx` | api            |
| `REDIS_URL`                                                             | `redis://localhost:6379`                   | api            |
| `CORS_ORIGIN`                                                           | `http://localhost:5173`                    | api            |
| `VITE_API_URL`                                                          | `http://localhost:4000`                    | web            |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | `lynx` / `lynx` / `lynx` / `5432`          | docker-compose |
| `REDIS_PORT`                                                            | `6379`                                     | docker-compose |

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
- [ ] Phase 3 — Auth, workspaces, teams
- [ ] Phase 4 — Issues, statuses, priorities, labels, comments
- [ ] Phase 5 — Projects, cycles, Kanban (dnd-kit)
- [ ] Phase 6 — Command palette, keyboard shortcuts, search, animations
- [ ] Phase 7 — Real-time (WebSocket), optimistic updates
- [ ] Phase 8 — Analytics, performance, virtualization
- [ ] Phase 9 — 3D accents, advanced animations, empty/loading states
- [ ] Phase 10 — Tests, CI, docs, final cleanup
