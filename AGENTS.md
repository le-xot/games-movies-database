# PROJECT KNOWLEDGE BASE

**Updated:** 2026-10-26
**Stack:** Bun + Elysia + Vue 3 (Nest, Socket.IO, Swagger и кодоген контракта выпилены)

## OVERVIEW

Full-stack personal media tracker (games, movies, anime, cartoons, series, PC games) with Twitch/Kick/Telegram login and real-time WebSocket updates. Bun monorepo: Vue 3 frontend + Elysia backend + PostgreSQL via Drizzle + Redis for rate limiting.

## STRUCTURE

```
./
├── frontend/               # Vue 3 SPA (Vite, Tailwind 4, shadcn-vue)
├── backend/                # Elysia API (Drizzle, JWT, native WebSocket, Redis rate limit)
├── contract/               # @gmdb/contract: enum'ы, WS-события, каталог косметики, разбор кадров
├── database/               # Drizzle schema + migrations app (own Dockerfile)
├── docker-compose.yml      # Production stack (Traefik via traefik-public network)
├── docker-compose.dev.yml  # Dev: postgres + redis + rustfs + dbx
├── Dockerfile              # App image: multi-stage bun build (deps → runtime-deps → frontend-builder → runtime)
├── .oxlintrc.json          # oxlint configuration (linting rules)
├── .oxfmtrc.json           # fmt configuration (bun fmt reads it: formatting + import sorting)
└── .github/workflows/      # CI: checks → build → GHCR → SSH deploy (server pulls images, no git)
```

## WHERE TO LOOK

| Task                 | Location                                                        | Notes                                                                                                                          |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Add backend feature  | `backend/src/gateway/{name}.ts` + `backend/src/modules/{name}/` | Роут и схемы — в гейтвее, домен — в modules                                                                                    |
| Add frontend page    | `frontend/src/pages/{feature}/`                                 | Страница `{Name}Page.vue` + `composables/`; жанровые разделы — только `composables/`, рендер общий `pages/media/MediaPage.vue` |
| Sidebar / nav        | `frontend/src/components/layout/db/`                            | `LayoutSidebar.vue`, `NavItem.vue`, `use-db-navigation.ts`                                                                     |
| Account modal        | `frontend/src/components/account/`                              | Открывается через `use-account-dialog`                                                                                         |
| Login modal          | `frontend/src/components/form/`                                 | `LoginDialog.vue`, открывается через `use-login-dialog`                                                                        |
| Command palette      | `frontend/src/components/palette/`                              | `CommandPalette.vue` + `stores/use-command-palette.ts`                                                                         |
| Add UI primitive     | `frontend/src/components/ui/{name}/`                            | shadcn-vue pattern: .vue files + index.ts barrel                                                                               |
| Modify auth flow     | `backend/src/gateway/auth-oauth.ts` + `gateway/auth-session.ts` | OAuth-роуты, cookie `token`, `tg_oidc_*`; guards — `gateway/auth.ts`                                                           |
| Issue JWT            | `backend/src/modules/auth/`                                     | `auth.service.ts` (подпись), `auth.oauth-state.ts` (state/PKCE)                                                                |
| Telegram login       | `backend/src/modules/telegram/`                                 | OIDC (PKCE, JWKS) + бот и рассылки; cookies `tg_oidc_*`, env `TELEGRAM_*`                                                      |
| Rate limiting        | `backend/src/gateway/rate-limit.ts`                             | Порт и `enforceRateLimit`; Redis-реализация — `utils/rate-limit.ts`, пресеты — `utils/rate-limits.ts`                          |
| Database schema      | `database/src/schema/`                                          | Drizzle `pgTable`/`pgEnum`; `isoTimestamp` отдаёт ISO-строку вместо `Date`                                                     |
| Server layer         | `backend/src/server/`                                           | Composition root, порты по доменам (`wiring/`), HTTP и статика; см. `server/AGENTS.md`                                         |
| Database migrations  | `database/migrations/`                                          | Generated SQL; applied by `migrations` compose service                                                                         |
| DB access            | `backend/src/database/drizzle.service.ts`                       | `DrizzleService` создаётся в `server/container.ts`, сервисы получают его в конструктор                                         |
| API client           | `frontend/src/lib/api.ts`                                       | Eden Treaty: типы выводятся из `App`, кодогена нет                                                                             |
| Environment vars     | `backend/.env.example`                                          | Copy to `backend/.env`                                                                                                         |
| Prod secrets         | Doppler (default) или Infisical (`SECRETS_PROVIDER`)            | `scripts/render-env.sh` рендерит `.env` на сервере; токен в `~/.config/gmd/secrets.env`                                        |
| Router paths         | `frontend/src/router/router-paths.ts`                           | ROUTER_PATHS constant                                                                                                          |
| Image proxy          | `frontend/src/utils/image.ts`                                   | Routes through `/api/img`                                                                                                      |
| Watch links          | `frontend/src/utils/generate-watch-link.ts`                     | Kinobox canonical URLs                                                                                                         |
| Env validation       | `backend/src/utils/enviroments.ts`                              | envalid; note the typo in filename                                                                                             |
| Media page factories | `frontend/src/composables/factories/`                           | `create-params-store.ts`, `create-records-store.ts`                                                                            |
| Архитектура          | `docs/architecture.md`                                          | Слои, жизненный цикл запроса, чек-лист нового домена                                                                           |
| API-справочник       | `docs/api.md`                                                   | Роуты, доступ, лимиты, WS-события (Swagger нет)                                                                                |

## CONVENTIONS

- **Package manager**: Bun only. `bun install`, `bun dev`, `bun build`
- **Linter/Formatter**: oxlint + `bun fmt` (встроенный форматтер Bun, читает `.oxfmtrc.json` и `.editorconfig`; пакет `oxfmt` не используется)
- **Quotes**: Single quotes (`singleQuote: true` в `.oxfmtrc.json`)
- **Imports**: Sorted by `sortImports` из `.oxfmtrc.json` — builtin → external → internal → parent/sibling/index → type → side-effect → unknown
- **Brace style**: `1tbs` — соглашение, конфигом не задано
- **Indent**: 2 spaces, max line 100 chars (`printWidth` + `.editorconfig`)
- **Vue blocks**: `<script setup lang="ts">` или `<template>` первым, `<style>` последним — соглашение
- **Vue file naming**: PascalCase для всех `.vue` (e.g., `AnimePage.vue`, `DataCards.vue`). Исключение — `app.vue`. `.ts` — kebab-case
- **Vue events**: kebab-case — соглашение (vue-плагина в oxlint нет)
- **Stores**: Pinia 4 stores in `frontend/src/stores/`, plain composables in `frontend/src/composables/`
- **Icons**: @lucide/vue primary, vue3-simple-icons for brands. No other icon libs
- **Path alias**: frontend uses `@/` → `frontend/src/`; backend uses `@backend/*` → `backend/src/*`. `@backend/*` во фронте — **только для типов** (tsconfig path, стирается компилятором); значения берутся из `@gmdb/contract` или из самого фронта
- **TypeScript**: Backend, database и contract type-check через `bun check -b` (Bun's built-in TS 7 checker, port of typescript-go). `-b` включает shared declaration parse и кэш резолва модулей, но у нас пока no-op — project references в `tsconfig` нет; сам 1.4.4 и так ускорил `bun check`. Frontend uses `vue-tsc` with `typescript` aliased to `typescript-native-bridge` (TS 6 API driving tsgo 7.0.2; ~2x faster typecheck). TNB needs glibc — the Alpine Docker image only runs `build:ci`, never typecheck
- **vue-tsc pinned to 3.3.11**: 3.3.12+ corrupts template codegen when a component prop value contains `//` (any URL) — see language-tools #6240/#6264. Bump only after the fix lands
- **API client**: `frontend/src/lib/api.ts` — Eden Treaty (`@elysia/eden`), `treaty<App>`, где `App` — `import type { App } from '@backend/gateway'`. Типы домена переэкспортируются из `@backend/api-types`, значения (enum'ы, WS-события) — из `@gmdb/contract`. Кодогена нет: ни `openapi.json`, ни `api-types.ts` не генерятся. Хелперы `unwrap()` / `assertOk()` достают данные или бросают `Response` с телом ошибки, поэтому `parseApiError` работает как раньше. `useApi()` — обычная функция, возвращающая клиент (не Pinia store)
- **Database**: Drizzle ORM. Schema lives in `database/src/schema/`, migrations are generated SQL committed under `database/migrations/`. Never edit `database/migrations/` by hand — use `bun db:generate`.

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use icon libraries other than @lucide/vue / vue3-simple-icons
- **NEVER** edit `database/migrations/` manually — it is generated from `database/src/schema` via `bun db:generate`; CI fails on drift
- **NEVER** use `unique()` where the Prisma-era DB has a unique index — it creates a unique constraint; use `uniqueIndex()`
- **NEVER** skip baseline on an existing Prisma-managed DB — `bun db:baseline` must run before the first deploy
- **NEVER** commit `backend/.env` (contains secrets; .gitignore should exclude it but the file exists locally)
- **NEVER** edit the prod `.env` on the server by hand — it is generated by `scripts/render-env.sh` and overwritten on every deploy
- **NEVER** import Pinia stores from `frontend/src/composables/` — they live in `frontend/src/stores/`
- **NEVER** добавлять `@nestjs/*` — Nest из проекта выпилен, зависимостей нет
- **NEVER** объявлять `t.Unsafe` в схемах ответа — ломает рантайм-валидацию TypeBox
- `suggesttion.dto.ts` has a typo (double t) — do not rename without updating all imports

## GIT

- **Коммитить и пушить можно только в ворктри на отдельной ветке.** На `master` — никогда.
- Ворктри создаётся через Herdr: `herdr worktree create --branch <branch> --base master --no-focus` → `~/.herdr/worktrees/<repo>/<branch>`.
- `commit` и `push` в ветку ворктри — без отдельного разрешения.
- **Требует явного подтверждения каждый раз:** merge/сквош PR в `master`, force-push, удаление ветки, всё, что попадает в задеплоенную ветку.
- Pre-commit хук (`bun run hooks:install`) форматирует застейдженное через `bun fmt --staged`.

## COMMANDS

```bash
# Development
bun install                    # Install all deps
bun infra:start                # Start dev infra: postgres + redis + rustfs + dbx
bun infra:stop                 # Stop dev infra
bun dev                        # Start frontend (5173) + backend (3000)

# Individual
bun dev:frontend               # Frontend only
bun dev:backend                # Backend only

# Build
bun build                      # Build both
bun lint                       # Lint check (oxlint)
bun lint:fix                   # Auto-fix (oxlint)
bun format                     # Format codebase (bun fmt)
bun format:check               # Check formatting (bun fmt --check)
bun typecheck                  # Type check: bun check -b (backend, database, contract) + vue-tsc (frontend)
bun hooks:install              # Enable .githooks (core.hooksPath): pre-commit runs bun fmt --staged

# Database
# Setup: cp database/.env.example database/.env (or export DATASOURCE_URL)
bun db:generate                # Generate SQL migration from schema changes
bun db:migrate                 # Apply pending migrations to DATASOURCE_URL
bun db:baseline                # One-time: mark 0000_init applied on an existing DB

# Tests
cd backend && bun test         # Backend unit tests (bun test)
bun --filter=./backend run test:integration   # Integration tests (RUN_DB_TESTS=1 + Postgres)
cd frontend && bun run test    # Frontend unit tests
cd frontend && bun run test:e2e               # Playwright E2E
bun run test:scripts           # render-env.sh + rollback.sh script tests

# Docker
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

## NOTES

- Backend serves built frontend сам (`server/static.ts`, frontend/dist с SPA-фолбэком). В проде один контейнер отдаёт всё
- Frontend dev не требует бэкенда: типы приходят из Eden (`import type { App }`), для запуска dev-сервера достаточно `bun dev:frontend`
- Vite proxies `/api` and `/ws` to `localhost:3000` in dev
- CI: push to master → Checks → Deploy (build → GHCR → SSH: scp compose + render-env.sh + rollback.sh, `render-env.sh` generates `.env` from the configured provider, `docker compose pull application migrations logs && up -d --remove-orphans`, then `docker image prune -f --filter until=168h`; health-check с авто-откатом через `rollback.sh`). Server has no git checkout and builds nothing. GitHub secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`; repo variable `DEPLOY_DIR`.
- Contract: `contract/` (`@gmdb/contract`) — enum'ы, карта WS-событий, каталог косметики (`customization.ts`: рамки аватара, бейджи), `parseWsMessage`. Потребляется как сырой TypeScript и Bun, и Vite, поэтому пакет обязан оставаться без зависимостей
- Production docker-compose expects external `traefik-public` network (Traefik reverse proxy, swarm overlay, attachable)
- Tests: backend has unit tests via `bun test` (see `backend/src/**/__tests__/`). Run from `backend/` — envalid needs `backend/.env` on import.
- Migrations run as a separate one-shot `migrations` compose service before `application` starts (`depends_on: service_completed_successfully`)
- Existing Prisma-era DBs must be baselined once (`docker compose run --rm --no-deps migrations bun run baseline`); `_prisma_migrations` is intentionally kept for rollback
- Rate limiting: `enforceRateLimit` в гейтвее поверх Redis (`Bun.redis`). Fixed window via Lua, пресеты в `backend/src/utils/rate-limits.ts` (public 1000/min, auth 5/min, write 20/min, like 60/min, suggestion 20/min, img 3000/min, twir 120/min, wordlePractice 120/min). Fail-open when Redis is down, но с таймаутом 250 мс — иначе первый запрос после падения Redis висит ~30 с на переподключении. Client tracked by first `X-Forwarded-For` hop. Порядок: лимит → auth → роли
- Production `REDIS_URL=redis://redis:6379` is set in docker-compose.yml; dev defaults to `redis://localhost:6379`
- Auth: JWT stored in httpOnly cookie named `token`. CORS allows localhost:3000, localhost:5173 и https://le-xot.dev
