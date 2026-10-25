FROM oven/bun:1.4.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY database/package.json ./database/
COPY contract/package.json ./contract/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production --filter=./database

FROM oven/bun:1.4.4-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/database/node_modules ./database/node_modules
COPY package.json ./
COPY database ./database
# `node_modules/@gmdb/contract` — симлинк на этот каталог: без него он висит.
COPY contract ./contract
WORKDIR /app/database
CMD ["bun", "run", "migrate"]
