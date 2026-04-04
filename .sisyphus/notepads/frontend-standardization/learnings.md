# Learnings

## [2026-04-04] Session Start

### Project Stack
- Vue 3.5, Vite 8 beta, Tailwind 4, shadcn-vue (reka-ui), Pinia + @pinia/colada
- vue-router 4, vee-validate 5 + zod 4, @tanstack/vue-table, socket.io-client
- Bun monorepo — `bun lint`, `bun build`, `bun dev:frontend`

### Conventions
- Single quotes enforced. No Prettier, ESLint only (@antfu/eslint-config)
- Imports: `.vue` files MUST keep extension; `.ts` imports MUST NOT have extension
- `<script setup lang="ts">` always
- Icons: lucide-vue-next primary, vue3-simple-icons for brands
- Path alias: `@/` → `./src/`

### Architecture Patterns
- 5 media pages (anime, cartoon, movie, games, series) each have 3 composables: use-*-params.ts, use-*.ts, use-*-table.ts
- These 15 composables are near-identical — differ only by: genre enum, query key, column sizes, episode column presence, Russian delete title, items name (`videos` vs `games`)
- WebSocket composable (use-websocket.ts) calls refetch methods by name: `refetchVideos` (anime/cartoon/series/movie) and `refetchGames` (games) — CRITICAL contract

### Key Discoveries
- `use-autions.ts` (typo) has wrong store ID `'queue/use-auction'` should be `'auction/use-auction'`
- `use-series.ts` uses `cartoonParams` variable (copy-paste bug)
- `btoa(url)` in image.ts fails on non-ASCII URLs
- `localStorage.clear()` in main.ts is too aggressive (wipes `loginReturnUrl` mid-auth)
- Router `beforeEach` awaits `fetchUser()` for ALL routes including public ones
- `columnsVisibility` localStorage key shared across all pages — should be per-genre

### NEVER DO
- NEVER touch `frontend/src/lib/api.ts` (auto-generated from Swagger)
- NEVER touch `frontend/src/components/ui/` (shadcn-generated)
- NEVER change Pinia store IDs
- NEVER change composable function export names (useAnime, useMovie, etc.)
- NEVER standardize items property names (keep `games`/`videos` per page)
