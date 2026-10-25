FROM oven/bun:1.4.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY database/package.json ./database/
COPY contract/package.json ./contract/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile && \
    mkdir -p /app/frontend/node_modules

FROM oven/bun:1.4.4-alpine AS runtime-deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY database/package.json ./database/
COPY contract/package.json ./contract/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

FROM oven/bun:1.4.4-alpine AS frontend-builder
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY ./frontend ./frontend
COPY ./contract ./contract

RUN bun --filter=./frontend run build:ci

FROM oven/bun:1.4.4-alpine
WORKDIR /app

RUN apk add --no-cache fontconfig font-dejavu

COPY package.json ./
COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=runtime-deps /app/backend/node_modules ./backend/node_modules
COPY --from=runtime-deps /app/database/node_modules ./database/node_modules
COPY ./backend ./backend
COPY ./database ./database
COPY ./contract ./contract

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

CMD ["bun", "run", "--cwd", "backend", "start"]
