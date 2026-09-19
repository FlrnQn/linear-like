# Build context is the repo root:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=http://localhost:4000 .
# docker-compose.yml at the repo root is already wired up this way.

FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app

# @playwright/test is a devDependency of @lynx/web; skip its browser download
# during install since this image only builds the app, it never runs e2e.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter=@lynx/web...

COPY packages ./packages
COPY apps/web ./apps/web

# Vite inlines VITE_* variables into the built JS at build time, not at
# container start — this must be the URL the *browser* can reach (the host
# machine's mapped API port), not the Docker-internal service name.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @lynx/web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
