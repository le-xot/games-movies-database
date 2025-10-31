FROM oven/bun:1-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json bun.lock* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY backend/prisma ./backend/prisma/

RUN bun install --frozen-lockfile

RUN cd backend && bunx prisma generate

COPY . .

RUN cd frontend && bun run build 

RUN bun run build

CMD ["bun", "run", "start:backend"]