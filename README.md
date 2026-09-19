# LYNX

A Linear-inspired project management platform, built from scratch as a technical playground for modern full-stack TypeScript practices.

> **Status: Phase 10 — Tests, E2E, documentation, final cleanup.** Vitest covers backend regression tests (Fastify `.inject()`, a dedicated `lynx_test` database) and a handful of frontend unit tests; Playwright drives the real browser through login, signup, logout, create/edit issue, status change, assignment, and permission checks. That real end-to-end coverage — the first time this app has run in an actual browser rather than been curl-tested — surfaced and fixed five genuine bugs (see below). CI is intentionally out of scope for now. 3D accents and animation polish landed in Phase 9; analytics, virtualization, and real-time in Phases 7–8.

## Stack

| Layer      | Choices                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, TanStack Router, TanStack Query, TanStack Form, TanStack Virtual, Zustand, dnd-kit, Radix UI, cmdk, Motion, Recharts, Three.js, React Three Fiber, `@react-three/drei`, Lucide, Tailwind CSS v4 |
| Backend    | Node.js, TypeScript, Fastify 5, PostgreSQL, Redis (pub/sub), WebSocket (`@fastify/websocket`)                                                                                                                               |
| Database   | Drizzle ORM (node-postgres driver), Drizzle Kit migrations, snake_case DB / camelCase JS via `casing: 'snake_case'`                                                                                                         |
| Auth       | Argon2 password hashing, JWT access tokens (`@fastify/jwt`), rotating opaque refresh tokens in an httpOnly cookie                                                                                                           |
| Validation | Zod schemas shared between web and api via `@lynx/types` (request bodies, forms, env parsing)                                                                                                                               |
| Tooling    | pnpm workspaces, Turborepo, ESLint (flat config), Prettier, Docker Compose                                                                                                                                                  |

Additional libraries called for in the full spec (shadcn/ui) are **not installed yet** — introduced in the phase where they're first actually used, so every dependency in `package.json` has a real caller. TanStack Virtual and Recharts joined in Phase 8; Three.js/React Three Fiber/drei and `@radix-ui/react-select`/`@radix-ui/react-tooltip` joined in Phase 9.

## Architecture

```text
lynx/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── app/            # router/query-client setup, AppProviders (session bootstrap)
│   │       ├── routes/         # TanStack Router routes (/, /login, /signup, /settings, /teams/$id, /projects/$id)
│   │       ├── features/       # auth, workspaces, teams, projects, cycles, issues, labels, comments,
│   │       │                   # activities, search, command-palette, realtime, dashboard, three
│   │       ├── components/     # cross-feature shared UI (ToastStack, Skeleton, EmptyState, Tooltip, ErrorBoundary)
│   │       ├── layouts/        # Sidebar (collapsible, animated, workspace nav)
│   │       ├── hooks/          # usePrefersReducedMotion
│   │       ├── lib/            # api-client (auth header + refresh-on-401), API base URL
│   │       ├── stores/         # Zustand: auth, ui (theme/sidebar/palette), workspace, toast
│   │       ├── styles/         # Tailwind entry + design tokens
│   │       └── test/           # Vitest setup (jest-dom matchers, Testing Library cleanup)
│   │   └── e2e/                 # Playwright specs (auth, issues, projects) + global-setup.ts
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── modules/        # health, auth, users, workspaces, teams, projects, cycles, issues,
│       │   │                   # labels, comments, activities, search, dashboard
│       │   ├── plugins/        # Fastify plugins (cors, sensible, cookie, jwt)
│       │   ├── middleware/     # requireWorkspaceRole (RBAC check)
│       │   ├── lib/            # HttpError hierarchy shared by routes and services
│       │   ├── db/             # Postgres pool, Redis client, Drizzle schema/relations/migrations/seed
│       │   ├── websocket/      # WS route + Redis pub/sub fan-out (events.ts, websocket.plugin.ts)
│       │   ├── app.ts          # buildApp(): assembles the Fastify instance (testable)
│       │   └── server.ts       # boots buildApp() and starts listening
│       └── test/               # Vitest global-setup (migrate + truncate lynx_test) + shared test helpers
│
├── packages/
│   ├── config/                 # shared tsconfig bases (base/react/node)
│   ├── types/                  # shared TypeScript types (@lynx/types)
│   └── shared/                 # shared runtime utils, e.g. cn() (@lynx/shared)
│
├── docker-compose.yml           # Postgres 17 + Redis 7 (always); api + web + migrate behind the `full` profile
├── .dockerignore
├── turbo.json
├── pnpm-workspace.yaml
└── package.json

apps/api/Dockerfile              # runs @lynx/api via tsx (see "Running everything in Docker")
apps/web/Dockerfile              # vite build → static files served by nginx
apps/web/nginx.conf              # SPA fallback + asset caching for the built web app
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

## 3D accents, animations & empty/loading states

- **One React Three Fiber "LYNX object," reused everywhere it appears** — a single distorted icosahedron mesh (`apps/web/src/features/three/lynx-canvas.tsx`), parameterized by a `variant` prop (`login` / `boot` / `empty`) that only tweaks scale, rotation speed, and distortion — not three different bespoke scenes. Matches the spec's request for "un objet 3D LYNX minimaliste," singular: one recognizable shape carries the brand accent, rather than a different gimmick per screen.
- **Every call site goes through one `<Scene3D>` wrapper**, never `LynxCanvas` directly — it's the single place that (1) checks `prefers-reduced-motion` and renders nothing if set, (2) lazy-loads the Three.js chunk via `React.lazy`, and (3) wraps it in an error boundary with a `null` fallback. A third-party WebGL scene failing to mount should never be able to take a page down with it — the spec's "légère, désactivable, performante" requirements are enforced structurally at this one seam, not repeated per usage.
- **The accent color is a hand-verified sRGB conversion, not a guess.** three.js's `Color` doesn't parse `oklch()` strings, so the app's accent (`oklch(0.72 0.19 280)`) was converted with the standard OKLab→sRGB matrices and round-tripped back to OKLCH to confirm the math (`#9092ff` → `oklch(0.706 0.157 280.8)`, matching within expected sRGB-gamut clipping) before hardcoding it in the 3D material.
- **Measured, not assumed, that `@react-three/drei`'s `Float`/`MeshDistortMaterial` aren't the bundle cost.** Built the 3D chunk with and without drei: raw three.js + fiber alone is ~907 kB / 242 kB gzip; adding drei's helpers costs another ~1.5 kB gzip. The weight is three.js/fiber's own core (renderer, geometries, materials, the custom reconciler) — an unavoidable property of the mandated stack, not a wasteful import. The chunk is lazy (`React.lazy`, confirmed via build-output grep to be absent from the eager main entry) and every page around it renders immediately regardless of whether the 3D chunk has finished loading (`Suspense fallback={null}`), so the cost is real but never blocks anything.
- **Found and fixed a real React/React Three Fiber version conflict, not a false-positive peer warning.** `@react-three/fiber@9.7.0`'s custom reconciler depends on `scheduler@^0.27.0`; React 19.3.0 ships `scheduler@0.28.0` — running both under one renderer is a genuine, structurally unsafe combination (confirmed via upstream reports, not just the peer-range warning), not upstream being overly cautious. Fixed by pinning `react`/`react-dom`/`@types/react`/`@types/react-dom` to the exact stable `19.2.0` release the whole monorepo now uses — `pnpm peers check` reports zero issues after the pin.
- **Status/priority pickers are now animated Radix `Select` components**, replacing native `<select>` — same external `{value, onChange}` props as before (a 3-call-site blast radius, verified before rewriting), same Radix-primitive + `asChild` + `motion.div` + `forceMount`/`AnimatePresence` pattern already established for the issue-detail dialog and command palette in Phase 6, so the codebase has one consistent way to build an animated overlay, not several.
- **Page transitions wrap `<Outlet />` in `__root.tsx`**, keyed on the router's current pathname — a plain fade/slide, skipped entirely (renders children directly, no wrapper) when `prefers-reduced-motion` is set.
- **A shared `usePrefersReducedMotion` hook** (`apps/web/src/hooks/`, the first real occupant of that previously-empty reserved directory) wraps `matchMedia('(prefers-reduced-motion: reduce)')` via `useSyncExternalStore` — used to gate both the 3D scenes and the page-transition wrapper from one source of truth.
- **Every ad hoc "Loading X…" and "No X yet" string became a real component.** A `<Skeleton>` primitive (a single pulsing div) replaces loading text across the home page, issue board (List and Kanban), and team/project pages. A `<EmptyState>` component replaces empty-state text, with three deliberately different treatments: the 3D LYNX object for the one most prominent empty state (an empty issue list — the literal example from the spec), a Lucide icon + heading + description block for secondary lists (teams, projects), and a compact single-line icon+text form for empty states already living inside a tight space (cycles, comments, activity feed) — not every "no X yet" line earns the same visual weight.
- **Dashboard stat tiles count up on mount and on value change**, via Motion's imperative `animate()` driving a plain `useState` (not a `MotionValue` rendered as text — Motion values bind to style/props, not arbitrary JSX children) — a real, scoped answer to the spec's "transitions des statistiques," not a generic fade.
- **The sidebar's collapse toggle gets a Radix `Tooltip`** (same Motion-animated pattern as Select), the one icon-only control in the app that previously had no visible affordance beyond its `aria-label`.

## Testing

```bash
pnpm test               # backend (Vitest + Fastify inject) and frontend (Vitest + Testing Library) unit tests
pnpm --filter @lynx/web test:e2e   # Playwright — boots its own api+web servers against a dedicated test database
```

- **Backend tests use `buildApp()` + Fastify's `.inject()`** (`apps/api/src/modules/*/*.routes.test.ts`) — no real HTTP server or ports involved, exactly why `app.ts`/`server.ts` were split back in Phase 1. Each test file creates its own fixtures (signup/workspace/team through the real routes, not direct DB inserts) against a dedicated **`lynx_test` database** — a real, separate Postgres database, not a mock, so a passing test means the actual SQL and Drizzle queries ran. Files run serially (`fileParallelism: false`) since they share that one database; a global setup (`apps/api/test/global-setup.ts`) migrates and truncates it once per run.
- **Frontend unit tests** (Vitest + Testing Library + jsdom) are deliberately few and targeted at the highest-value logic: `mapCachedIssues` (the two-cache-shape optimistic-update helper from Phase 8), `formatCount`, and `EmptyState`'s branching (3D vs. icon vs. compact) — the 3D scene itself is mocked out in that last one, since jsdom has no WebGL context and testing Three.js rendering isn't what a unit test is for.
- **Playwright drives a real Chromium browser** through the spec's named critical flows — login, signup, logout, permissions, create/edit issue, status change, and assignment — against its own api+web server pair (ports 4010/5180, pointed at `lynx_test`, with `CORS_ORIGIN` set to match) so it never touches the dev servers or their demo data.
- **This was the first time the app had actually run in a browser**, as opposed to being curl-tested or read for correctness — every prior phase's frontend verification caveat (see memory/prior phases) said as much. Writing these E2E tests immediately surfaced five real, previously-invisible bugs, all now fixed:
  1. **Every "create X and navigate/close" form was silently non-functional under React 19 StrictMode.** `mutateAsync(vars, { onSuccess })`'s per-call callback is delivered through whichever `MutationObserver` instance is "current" at settle time — under StrictMode's double-invoked render, that can differ from the instance the calling closure captured, so the callback is dropped without error. The mutation itself (and its returned promise) still succeeds, which is what made this so easy to miss by reading the code. Fixed in every affected form (signup, login, create workspace/team/project/issue/cycle, delete issue) by calling the success handler directly off the already-reliable `await mutateAsync(...)`, not passing it as a mutate option.
  2. **Signing out never actually redirected to `/login`.** `beforeLoad` route guards only run on navigation, not reactively when auth state flips while already on a page — logging out cleared the auth store but nothing ever called `navigate()`.
  3. **`POST /auth/logout` (and any other no-body request) 400'd.** `apiFetch` always sent `Content-Type: application/json`, and Fastify's default JSON body parser rejects that header on an empty body. Fixed by only setting it when a body is actually present.
  4. **Duplicate `id="name"` (and other field ids) across forms rendered on the same page** — `<label htmlFor={field.name}>` used the bare TanStack Form field key as the DOM id, so `CreateTeamForm` and `CreateProjectForm` (both rendered on the home page) collided, and a browser resolved the label ambiguously. Fixed with `useId()`-namespaced ids everywhere this pattern was used.
  5. **The animated Radix `Select` (Phase 9) displayed a blank value after picking a new option.** The `forceMount`+`AnimatePresence` pattern reused from the Dialog/palette (Phase 6) fully unmounts `Select.Item`s on close — but `Select.Value`'s label lookup depends on those items staying registered. Fixed by dropping `forceMount`/Motion here specifically and using a `data-state`-driven CSS transition instead: Radix's own `Presence` utility waits for a real CSS transition to finish before unmounting, so the close still animates, and the items never disappear from Radix's registry in the first place.
- **A root-level `<ErrorBoundary>`** now wraps the whole app (`main.tsx`), not just the Phase 9 3D scenes — a full-page "something went wrong, reload" fallback instead of a blank white screen on an unhandled render error.

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 12 (`corepack enable` or `brew install pnpm`)
- Docker + Docker Compose v2 (for Postgres/Redis always, and optionally the whole app — see below)

## Running locally (recommended for active development)

The API and web app run directly on your machine with hot reload (`tsx watch` / Vite); only Postgres and Redis run in Docker.

```bash
pnpm install
pnpm docker:up     # starts Postgres + Redis only
pnpm db:migrate    # creates all tables
pnpm db:seed       # populates demo data
pnpm dev           # starts the API (:4000) and the web app (:5173), with hot reload
```

Open http://localhost:5173 — you'll land on `/login`. Create an account via `/signup` (or use one of the seeded users — see `apps/api/src/db/seed.ts` — though seeded users have no password set, so sign up fresh for now), create your first workspace and team from the home screen, then click into the team to create/assign/prioritize/label/comment on issues, or drag cards between columns on the Kanban board. Press **⌘K** / **Ctrl+K** anywhere to search issues or jump to a team/project. Open the same workspace in two browser windows (or two browsers) to see edits from one appear live in the other. The API's `/health` endpoint (Postgres + Redis probes) is still available for ops/monitoring.

Stop the infra with `pnpm docker:down` when you're done; `pnpm dev` itself just runs local Node/Vite processes and doesn't need stopping via Docker.

## Running everything in Docker

For running the whole app without installing Node locally, or to sanity-check a production-like build: `apps/api/Dockerfile` and `apps/web/Dockerfile` build the API and web app into containers, alongside Postgres and Redis. These three extra services (`api`, `web`, `migrate`) sit behind a Compose **`full` profile**, so they never start by accident — plain `pnpm docker:up` / `docker compose up` still only starts Postgres + Redis, exactly as above.

```bash
pnpm docker:full:up     # builds api + web images, runs migrations once, starts everything
pnpm docker:full:logs   # tail api + web logs
pnpm docker:full:down   # stop and remove api + web + migrate (Postgres/Redis keep running)
```

Open http://localhost:5173 — same app, same ports, now fully containerized. What happens on `docker:full:up`:

1. `postgres` and `redis` start (or are reused if already running from `pnpm docker:up`).
2. `migrate` runs once against `postgres` (`tsx src/db/migrate.ts`) and exits — safe to re-run, already-applied migrations are no-ops. Seeding is **not** automatic (it truncates all tables); run it manually once migrations are in:
   ```bash
   docker compose --profile full exec api pnpm exec tsx src/db/seed.ts
   ```
3. `api` starts once `migrate` exits successfully.
4. `web` (built by Vite, served by nginx with SPA-fallback routing) starts alongside it.

A few things worth knowing if you touch the Docker setup:

- **The API image runs TypeScript source directly via `tsx`**, the same way `pnpm dev` does — not `apps/api`'s own `tsc` build output. `@lynx/types`/`@lynx/shared` are consumed as raw `.ts` workspace source everywhere in this repo (no build step of their own), and the compiled `dist/*.js` files' relative imports aren't extension-qualified for Node's native ESM resolver — so a plain `node dist/server.js` currently can't run standalone. `tsx` resolves both correctly, matching the already-proven dev path, so the Docker image sidesteps the issue rather than papering over it.
- **`VITE_API_URL` is baked into the web bundle at build time**, not read at container start — Vite inlines `import.meta.env.VITE_API_URL` during `vite build`. The Dockerfile takes it as a build arg (`docker-compose.yml` passes `http://localhost:${API_PORT:-4000}` by default, i.e. the URL your *browser* can reach, not the internal `api` service name). Change `API_PORT` before running `docker:full:up` if you need a different port — changing it afterward requires a rebuild (`pnpm docker:full:up` again; Compose will notice the build arg changed).
- **Override ports/secrets via a root `.env` file** (not committed) or exported env vars — `API_PORT`, `WEB_PORT`, `JWT_SECRET`, `POSTGRES_*`, `REDIS_PORT` all follow the same "everything has a working default" approach as local dev (see [Environment variables](#environment-variables)).
- Rebuild after dependency or source changes with `pnpm docker:full:up` again (it always passes `--build`); use `docker compose build --no-cache api` for a clean rebuild if a stale layer ever seems suspect.

## Environment variables

No secrets are required to run locally or in Docker — every variable below has a working default (matching `docker-compose.yml`), so neither `pnpm dev` nor `pnpm docker:full:up` need any `.env` file. Override by exporting real environment variables, or creating your own `.env` in `apps/api/` for local dev (loaded via `dotenv/config`) or at the repo root for Docker Compose (read automatically by `docker compose`).

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
| `API_PORT`                                                              | `4000`                                      | docker-compose (`full` profile) |
| `WEB_PORT`                                                              | `5173`                                      | docker-compose (`full` profile) |

## Available commands

Run from the repo root (orchestrated by Turborepo across all workspaces):

```bash
pnpm dev              # run all apps in dev mode
pnpm build            # build all apps/packages
pnpm typecheck        # tsc --noEmit / tsc -b across the workspace
pnpm lint             # ESLint across the workspace
pnpm test             # Vitest — backend (Fastify inject) + frontend (Testing Library) unit tests
pnpm format           # Prettier write
pnpm format:check     # Prettier check
pnpm docker:up        # start Postgres + Redis only
pnpm docker:down      # stop Postgres + Redis
pnpm docker:full:up   # build + start api, web, migrate, Postgres, Redis (whole app in Docker)
pnpm docker:full:down # stop api, web, migrate (Postgres/Redis keep running)
pnpm docker:full:logs # tail api + web container logs
pnpm db:generate      # generate a migration from the schema
pnpm db:migrate       # apply pending migrations
pnpm db:seed          # reset + seed demo data
pnpm db:studio        # browse the database in Drizzle Studio
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
- [x] Phase 9 — 3D accents, advanced animations, empty/loading states
- [x] Phase 10 — Tests, E2E, docs, final cleanup (CI intentionally deferred)
