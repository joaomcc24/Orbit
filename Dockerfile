# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /workspace

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED="1"
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN --mount=type=cache,id=orbit-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY apps apps
COPY packages packages
RUN pnpm --filter api prisma generate
RUN pnpm --filter api build
RUN pnpm --filter web build
RUN pnpm deploy --filter=api --prod /prod/api
# pnpm deploy prunes the CLI, so transfer the already-generated runtime client.
RUN source_client="$(readlink -f apps/api/node_modules/@prisma/client)" \
    && target_client="$(readlink -f /prod/api/node_modules/@prisma/client)" \
    && source_modules="$(dirname "$(dirname "$source_client")")" \
    && target_modules="$(dirname "$(dirname "$target_client")")" \
    && cp -R "$source_modules/.prisma" "$target_modules/.prisma"

# Migrations are a release operation, not part of every API replica startup.
FROM build AS migration
ENV NODE_ENV="production"
WORKDIR /workspace/apps/api
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

FROM base AS api
ENV NODE_ENV="production"
ENV PORT="3001"
WORKDIR /app
COPY --from=build --chown=node:node /prod/api ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3001}/api/health/live`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]

FROM base AS web
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3000}`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "apps/web/server.js"]
