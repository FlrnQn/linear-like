# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 1 — Foundations.** The monorepo, tooling, and a health-checked full-stack skeleton are in place. Product features (auth, issues, projects, real-time…) land in the phases that follow.

## Stack

| Layer      | Choices                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, Tailwind CSS v4               |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis                          |
| Validation | Zod (env parsing today; request/response schemas from Phase 3)             |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose |

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
│           ├── db/             # Postgres pool + Redis client
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

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 12 (`corepack enable` or `brew install pnpm`)
- Docker (for PostgreSQL + Redis)

## Quickstart

```bash
pnpm install
pnpm docker:up     # starts Postgres + Redis
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
```

## Roadmap

Phase 1 (this phase) delivers the monorepo, tooling, Docker services, and a verified full-stack skeleton. Upcoming phases, in order: database schema & migrations (Drizzle), auth/workspaces/teams, issues/labels/comments, projects/cycles/Kanban, command palette & polish, real-time (WebSocket), performance/virtualization, 3D accents, then tests/CI/docs hardening.
