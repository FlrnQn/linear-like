# Build context is the repo root (needed to reach the pnpm workspace and the
# @lynx/types / @lynx/shared / @lynx/config packages @lynx/api depends on):
#   docker build -f apps/api/Dockerfile .
# docker-compose.yml at the repo root is already wired up this way.

FROM node:22-slim AS deps
RUN corepack enable
WORKDIR /app

# argon2 ships prebuilt binaries for common linux/glibc targets, but not for
# every host architecture Docker Desktop might build for (e.g. arm64 on Apple
# Silicon) — these let node-gyp-build fall back to compiling from source.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Manifests only, first — every workspace package.json must be present for
# `pnpm install --frozen-lockfile` to validate against pnpm-lock.yaml, but
# copying just these (instead of full source) keeps this layer cached across
# rebuilds that only touch application code.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/shared/package.json packages/shared/package.json

# `@lynx/api...` = that package plus everything it depends on — skips
# apps/web's toolchain (Vite, Playwright, etc.) entirely.
RUN pnpm install --frozen-lockfile --filter=@lynx/api...

FROM node:22-slim AS runtime
RUN corepack enable
WORKDIR /app

COPY --from=deps /app ./
# Bakes the exact pnpm version pinned in package.json's "packageManager" field
# into this layer, so the container doesn't hit the npm registry on every
# start just to resolve which pnpm binary to run. `corepack prepare` alone
# only caches the pnpm package itself — pnpm's own single-file native binary
# is fetched separately (into ~/.local/share/pnpm) the first time `pnpm` is
# actually invoked, so trigger that here too.
RUN corepack prepare --activate && pnpm --version
COPY packages ./packages
COPY apps/api ./apps/api

# @lynx/api is run from TypeScript source via tsx (the same way `pnpm dev`
# runs it), not `tsc`'s dist/ output — the compiled output's relative imports
# aren't ESM-extension-safe for Node's native loader, and @lynx/types /
# @lynx/shared are consumed as raw .ts source workspace-wide (no build step
# of their own), so plain `node dist/server.js` cannot resolve either. tsx
# handles both correctly, and this is exactly the already-proven dev path.
ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
