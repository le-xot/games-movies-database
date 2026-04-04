# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-04
**Commit:** f29cee6
**Branch:** master

## OVERVIEW

Full-stack personal media tracker (games, movies, anime, cartoons, series) with Twitch auth, Spotify integration, and real-time WebSocket updates. Bun monorepo: Vue 3 frontend + NestJS backend + PostgreSQL via Prisma.

## STRUCTURE

```
./
├── frontend/          # Vue 3 SPA (Vite, Tailwind 4, shadcn-vue)
├── backend/           # NestJS API (Prisma, JWT, Socket.IO)
├── docker-compose.yml # Production stack (dokploy-network)
├── docker-compose-dev.yml # Dev: postgres + adminer
├── Dockerfile         # Multi-stage bun build (frontend → backend → serve)
├── .oxlintrc.json     # oxlint configuration (linting rules)
├── .oxfmtrc.json      # oxfmt configuration (formatting + import sorting)
└── .github/workflows/ # Docker build + Dokploy deploy on push to master
```

## WHERE TO LOOK

| Task                 | Location                                        | Notes                                                                        |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Add backend feature  | `backend/src/modules/{name}/`                   | See `backend/src/modules/AGENTS.md` for template                             |
| Add frontend page    | `frontend/src/pages/{feature}/`                 | Each page = folder with .vue + composables/                                  |
| Add UI primitive     | `frontend/src/components/ui/{name}/`            | shadcn-vue pattern: .vue files + index.ts barrel                             |
| Modify auth flow     | `backend/src/modules/auth/`                     | JWT in cookie, Twitch OAuth, guards                                          |
| Database schema      | `backend/prisma/schema.prisma`                  | Run `bun prisma` after changes                                               |
| API types            | `frontend/src/lib/api.ts`                       | AUTO-GENERATED from Swagger. Never edit manually                             |
| Environment vars     | `backend/.env.example`                          | Copy to `backend/.env`                                                       |
| Router paths         | `frontend/src/lib/router/router-paths.ts`       | ROUTER_PATHS constant                                                        |
| Image proxy          | `frontend/src/lib/utils/image.ts`               | Routes through `/api/img`                                                    |
| Watch links          | `frontend/src/lib/utils/generate-watch-link.ts` | Kinobox canonical URLs                                                       |
| Env validation       | `backend/src/utils/enviroments.ts`              | envalid; note the typo in filename                                           |
| Media page factories | `frontend/src/composables/factories/`           | `create-params-store.ts`, `create-records-store.ts`, `create-table-store.ts` |

## CONVENTIONS

- **Package manager**: Bun only. `bun install`, `bun dev`, `bun build`
- **Formatter**: oxlint (linter) + oxfmt (formatter). Prettier disabled.
- **Quotes**: Single quotes enforced (`avoidEscape: false`)
- **Imports**: Sorted by oxfmt `sortImports` — builtin → external → internal → parent/sibling → type → side-effect
- **Brace style**: `1tbs`
- **Indent**: 2 spaces, max line 100 chars
- **Vue blocks**: `<script setup lang="ts">` or `<template>` first, `<style>` last
- **Vue events**: kebab-case enforced
- **Icons**: lucide-vue-next primary, vue3-simple-icons for brands. No other icon libs
- **Path alias**: `@/` → `./src/` in both frontend and backend
- **TypeScript**: Frontend strict, backend relaxed (decorators enabled)
- **API client**: Auto-generated via `swagger-typescript-api` from backend `/docs-json`. Regenerated on frontend dev start. Access via `useApi()` Pinia store
- **Database**: Prisma models use `@@map()` for table names. Enum names in `backend/src/enums/enums.names.ts`

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** edit `frontend/src/lib/api.ts` — it's auto-generated from Swagger
- **NEVER** use icon libraries other than lucide-vue-next / vue3-simple-icons
- **NEVER** edit `backend/prisma/migrations/migration_lock.toml`
- **NEVER** commit `backend/.env` (contains secrets; .gitignore should exclude it but the file exists locally)
- `CustomJwtModule` is imported twice in `app.module.ts` — harmless but known duplication
- `suggesttion.dto.ts` has a typo (double t) — do not rename without updating all imports

## COMMANDS

```bash
# Development
bun install                    # Install all deps
docker compose -f docker-compose-dev.yml up -d  # Start postgres + adminer
cd backend && bun prisma generate && bun prisma migrate dev  # DB setup
bun dev                        # Start frontend (5173) + backend (3000)

# Individual
bun dev:frontend               # Frontend only
bun dev:backend                # Backend only

# Build
bun build                      # Build both
bun lint                       # Lint check (oxlint)
bun lint:fix                   # Auto-fix (oxlint)
bun format                     # Format codebase (oxfmt)
bun format:check               # Check formatting (oxfmt)

# Database
bun prisma                     # Migrate + generate (root script)
cd backend && bun seed         # Seed DB

# Docker
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

## NOTES

- Backend serves built frontend via `ServeStaticModule` (frontend/dist). In production, single container serves everything
- Frontend dev requires backend running first — Vite config auto-generates API client from `localhost:3000/docs-json` (retries 10x on failure)
- Vite proxies `/api` and `/socket.io` to `localhost:3000` in dev
- CI: push to master → Docker Hub → Dokploy deploy (HTTP POST to external IP). Secrets: `DOCKER_REGISTRY_LOGIN`, `DOCKER_REGISTRY_TOKEN`, `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID`
- Production docker-compose expects external `dokploy-network`
- No tests exist. No test framework configured
- Prisma `prestart` hook runs migrations + seed automatically
- `predev` hook runs seed on every dev start
- Dockerfile copies node binary into bun image for frontend build compatibility
- ThrottlerGuard is globally applied (60 req/60s)
- Auth: JWT stored in httpOnly cookie named `token`. CORS allows localhost:3000 and :5173
