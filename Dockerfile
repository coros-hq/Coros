# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# ─── Builder ────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./
COPY apps/web ./apps/web
COPY libs ./libs

RUN pnpm install --frozen-lockfile

# VITE_COROS_API_ORIGIN must be passed at build time so Vite can inline it
ARG VITE_COROS_API_ORIGIN
ENV VITE_COROS_API_ORIGIN=$VITE_COROS_API_ORIGIN

RUN pnpm nx run @org/web:build

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4200

# Only copy what react-router-serve needs at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

EXPOSE 4200

CMD ["node_modules/.bin/react-router-serve", "apps/web/build/server/index.js"]