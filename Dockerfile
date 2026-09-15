FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

FROM oven/bun:1-alpine AS runtime-deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS frontend-builder
WORKDIR /app
COPY --from=node:24-alpine /usr/local/bin/node /usr/local/bin/

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY ./frontend ./frontend

RUN bun --filter=./frontend run build:ci

FROM oven/bun:1-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json ./
COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=runtime-deps /app/backend/node_modules ./backend/node_modules
COPY ./backend ./backend
RUN cd backend && bunx prisma generate

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

CMD ["bun", "run", "--cwd", "backend", "start"]
