FROM oven/bun:1-alpine as deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS frontend-builder
WORKDIR /app
COPY --from=node:24-alpine /usr/local/bin/node /usr/local/bin/

COPY package.json ./
COPY ./frontend ./frontend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

RUN bun build:frontend

FROM oven/bun:1-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY ./backend ./backend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

COPY package.json ./
RUN cd backend && bunx prisma generate

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN cd backend && bun prisma generate

RUN bun build:backend

CMD ["bun", "run", "start:backend"]
