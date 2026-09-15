# Games Movies Database

Full-stack web application for tracking media: games, anime, movies, cartoons, series, and PC games. Twitch and Kick authentication, real-time updates via WebSocket.

## Features

- **Media tracking** — games, anime, movies, cartoons, series, and PC games with statuses and ratings
- **Authentication** — OAuth via Twitch and Kick, JWT in httpOnly cookies
- **Real-time** — instant UI updates via Socket.IO
- **Suggestion system** — users suggest new content for adding
- **Queue system** — item queue management
- **Likes** — favorites with cascade deletion
- **Profile** — account management, link/unlink providers, account deletion
- **Admin panel** — administration interface
- **Image proxy** — resizing via Sharp, proxying through `/api/img`
- **Watch links** — automatic Kinobox links for watching
- **Weather** — weather widget via OpenWeatherMap
- **TWIR** — webhooks from external bot with API key protection

## Tech Stack

| Layer          | Technologies                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Vue 3, Vite, TypeScript, Tailwind CSS 4, shadcn-vue, Pinia, Socket.IO Client, @tanstack/vue-table, vee-validate + zod |
| Backend        | NestJS 12, Drizzle ORM, PostgreSQL, Redis, Socket.IO, Sharp, JWT                                                      |
| Infrastructure | Docker, Bun, Redis (rate limiting), Traefik (reverse proxy), GitHub Actions                                           |

## Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh/) — JavaScript runtime and package manager
- [Docker](https://docs.docker.com/engine/) — for PostgreSQL

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/le-xot/games-movies-database.git
cd games-movies-database

# Install dependencies
bun install
```

### 3. Start infrastructure

```bash
bun infra:start
```

This starts PostgreSQL on port `5432`, Redis on port `6379`, and Adminer on port `54321`.

To stop: `bun infra:stop`.

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — at minimum set `JWT_SECRET`. See [Environment Variables](#environment-variables) for all options.

### 5. Database migration

```bash
cp database/.env.example database/.env
bun db:migrate
```

The `database` workspace does not read `backend/.env`, so copy `database/.env.example` to `database/.env` (or export `DATASOURCE_URL`) before running migrations — `database/.env` is not committed.

The database schema lives in `database/src/schema/`, migrations are generated into `database/migrations/` with `bun db:generate` after schema changes. If the database was previously managed by Prisma, run `bun db:baseline` once.

### 6. Start development

```bash
bun dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/docs
- Scalar API Reference: http://localhost:3000/reference
- Adminer: http://localhost:54321

## Environment Variables

File: `backend/.env` (copy from `backend/.env.example`)

| Variable               | Description                             | Required                      |
| ---------------------- | --------------------------------------- | ----------------------------- |
| `DATASOURCE_URL`       | PostgreSQL connection string            | Yes                           |
| `JWT_SECRET`           | Secret for JWT token signing            | Yes                           |
| `APP_PORT`             | Backend server port (default: 3000)     | No                            |
| `REDIS_URL`            | Redis connection string (rate limits)   | No (`redis://localhost:6379`) |
| `TWITCH_CLIENT_ID`     | Twitch OAuth Client ID                  | No                            |
| `TWITCH_CLIENT_SECRET` | Twitch OAuth Client Secret              | No                            |
| `TWITCH_CALLBACK_URL`  | URL callback after Twitch authorization | No                            |
| `KICK_CLIENT_ID`       | Kick OAuth Client ID                    | No                            |
| `KICK_CLIENT_SECRET`   | Kick OAuth Client Secret                | No                            |
| `KICK_CALLBACK_URL`    | URL callback after Kick authorization   | No                            |
| `KINOPOISK_API`        | Kinopoisk API key                       | No                            |
| `STEAM_API_KEY`        | Steam API key                           | No                            |
| `STEAM_ID`             | Steam user ID                           | No                            |
| `WEATHER_API_KEY`      | OpenWeatherMap API key                  | No                            |
| `WEATHER_LAT`          | Latitude for weather                    | No                            |
| `WEATHER_LON`          | Longitude for weather                   | No                            |
| `PROXY`                | Proxy URL for external APIs             | No                            |
| `TWIR_API`             | API key for TWIR webhooks               | No                            |

## Project Structure

```
games-movies-database/
├── frontend/                  # Vue 3 SPA
│   ├── src/
│   │   ├── assets/            # Global styles, OKLCH colors, dark mode
│   │   ├── components/        # Reusable components
│   │   │   ├── dialog/        # Dialogs
│   │   │   ├── form/          # Forms
│   │   │   ├── layout/        # Layout components (header, body, DB)
│   │   │   ├── media/         # DataCards, search and filters
│   │   │   └── ui/            # shadcn-vue primitives (DO NOT EDIT)
│   │   ├── composables/       # Composables + factories for media pages
│   │   ├── lib/               # API client (auto-generated), cn() utility
│   │   ├── pages/             # Application pages
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── anime/         # Anime tracking
│   │   │   ├── auth/          # Authorization and callback
│   │   │   ├── cartoon/       # Cartoon tracking
│   │   │   ├── games/         # Games tracking
│   │   │   ├── home/          # Home page
│   │   │   ├── movie/         # Movie tracking
│   │   │   ├── pc/            # PC games
│   │   │   ├── profile/       # User profile
│   │   │   ├── series/        # Series tracking
│   │   │   └── suggestion/    # Content suggestions
│   │   ├── router/            # Vue Router configuration
│   │   ├── stores/            # Pinia stores (useApi, useUser, etc.)
│   │   └── utils/             # Image proxy, watch link generation
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/                   # NestJS API server
│   ├── src/
│   │   ├── main.ts            # Entry point, Swagger, CORS, cookieParser
│   │   ├── app.module.ts      # Root module
│   │   ├── database/          # DrizzleModule + DrizzleService
│   │   ├── enums/             # Re-exports of enum constants from @gmd/database
│   │   ├── utils/             # Environment validation (envalid)
│   │   └── modules/           # Feature modules
│   │       ├── auth/          # Twitch/Kick OAuth, JWT, guards
│   │       ├── user/          # User CRUD
│   │       ├── record/        # Media records
│   │       ├── like/          # Likes/favorites
│   │       ├── suggestion/    # Content suggestions
│   │       ├── queue/         # Item queue
│   │       ├── twitch/        # Twitch API client
│   │       ├── kick/          # Kick API client
│   │       ├── websocket/     # Socket.IO gateway
│   │       ├── records-providers/  # External metadata providers
│   │       ├── img/           # Image proxy and resizing (Sharp)
│   │       ├── rate-limit/    # Custom Redis-backed rate limiter
│   │       ├── twir/          # TWIR webhooks
│   │       ├── weather/       # Weather (OpenWeatherMap)
│   │       ├── jwt/           # CustomJwtModule wrapper
│   │       └── limit/         # Suggestion limits
│   └── package.json
├── database/                  # Drizzle schema and migrations
│   ├── src/
│   │   ├── schema/            # Database schema (pgTable/pgEnum)
│   │   ├── migrate.ts         # Applies migrations
│   │   └── baseline.ts        # One-time baseline of an existing database
│   └── migrations/            # Generated SQL migrations
├── docker-compose.yml         # Production config (PostgreSQL + Redis + app + Traefik)
├── docker-compose.dev.yml     # Dev environment (PostgreSQL + Redis + RustFS + Adminer)
├── Dockerfile                 # Multi-stage build (frontend → backend → serve)
├── package.json               # Root package.json (workspaces)
├── .oxlintrc.json             # oxlint configuration
├── .oxfmtrc.json              # oxfmt configuration
└── .github/workflows/
    └── docker.yaml            # CI/CD: SSH deploy on push to master
```

## Available Scripts

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `bun dev`            | Start frontend and backend in development mode |
| `bun dev:frontend`   | Frontend only (port 5173)                      |
| `bun dev:backend`    | Backend only (port 3000)                       |
| `bun build`          | Build frontend and backend for production      |
| `bun build:frontend` | Build frontend only                            |
| `bun build:backend`  | Build backend only                             |
| `bun start:backend`  | Start backend in production mode               |
| `bun infra:start`    | Dev infrastructure (postgres, redis, rustfs)   |
| `bun infra:stop`     | Stop dev infrastructure                        |
| `bun db:generate`    | Generate SQL migration from schema changes     |
| `bun db:migrate`     | Apply migrations to the database               |
| `bun db:baseline`    | One-time baseline of an existing database      |
| `bun lint`           | Run oxlint code check                          |
| `bun lint:fix`       | Auto-fix oxlint issues                         |
| `bun format`         | Format with oxfmt                              |
| `bun format:check`   | Check formatting without changes               |

## Third-party Integrations

### Twitch

Authentication via Twitch OAuth. Allows users to log in with their Twitch account.

Getting credentials:

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Set OAuth Redirect URL: `http://localhost:5173/auth/callback`
4. Copy Client ID and Client Secret to `.env`

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CALLBACK_URL=http://localhost:5173/auth/callback
```

### Kick

Authentication via Kick OAuth.

Getting credentials:

1. Go to [Kick Developer Portal](https://developer.kick.com/)
2. Create an application
3. Set redirect URL
4. Copy Client ID and Client Secret to `.env`

```
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_CALLBACK_URL=http://localhost:3000/api/auth/kick/callback
```

### Kinopoisk

API for fetching movie and series data from Kinopoisk.

```
KINOPOISK_API=your_api_key
```

### Steam

Integration to import a Steam game library (admin panel).

```
STEAM_API_KEY=your_api_key
STEAM_ID=your_steam_id
```

### OpenWeatherMap

Weather widget on the home page.

1. Create an account at [OpenWeatherMap](https://openweathermap.org/)
2. Go to API keys section
3. Generate a new API key

```
WEATHER_API_KEY=your_api_key
WEATHER_LAT=your_latitude
WEATHER_LON=your_longitude
```

### Kinobox

This project uses KinoHub/Kinobox as the external service for watching content via generated watch links.

Supported parser input formats:

- `https://tv.kinohub.vip/movie/<id>`
- `https://tv.kinohub.vip/shikimori/<id>`
- `https://kinobox.in/movie/<id>`
- `https://kinobox.in/shikimori/<id>`

Watch link generation returns canonical Kinobox URLs: `https://kinobox.in/movie/<id>` or `https://kinobox.in/shikimori/<id>`.

To change the canonical host, update `frontend/src/utils/generate-watch-link.ts`.

### TWIR

Webhooks from external TWIR bot. Protected by API key via `ApikeyGuard`.

```
TWIR_API=your_api_key
```

## Architecture

### REST API

- All routes are automatically prefixed with `/api`
- Global validation via `ValidationPipe` with `transform: true` and `whitelist: true`
- Swagger UI: http://localhost:3000/docs
- Scalar API Reference: http://localhost:3000/reference
- Frontend API client is **auto-generated** from Swagger spec on dev server start (DO NOT edit `frontend/src/lib/api.ts`)

### WebSocket

- Socket.IO for real-time updates
- Server modules emit events via `EventEmitter2`
- `WebsocketModule` listens for events and pushes updates to clients
- Frontend connects via `useWebSocket` composable

### Database

- PostgreSQL 17
- Drizzle ORM: schema in `database/src/schema/`, generated SQL migrations in `database/migrations/`
- Migrations are generated from the schema with `bun db:generate` and applied with `bun db:migrate`
- In production a one-shot `migrations` service applies migrations before `application` starts
- An existing database requires a one-time `bun db:baseline` before the first deploy
- Enum constants are defined via `pgEnum` in `database/src/schema/enums.ts`
- Adminer available on port `54321` in dev mode

### Guards and Authorization

- `AuthGuard` — JWT validation (cookie `token`)
- `ApikeyGuard` — TWIR endpoint protection via API key
- `RolesGuard` — role-based access
- `RateLimitGuard` — custom Redis-backed rate limiter (global). Presets in `backend/src/utils/rate-limits.ts` (public 1000/min, auth 5/min, etc.), per-route override via the `@RateLimit` decorator. Fixed window via Lua, key `rl:{route}:{ip}`, fail-open when Redis is unavailable

## Deployment

### Docker

```bash
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

### Docker Compose (production)

Production configuration in `docker-compose.yml` includes:

- **PostgreSQL 17** with persistent volume
- **Redis** — rate limiting (internal network, no exposed ports)
- **RustFS** — S3-compatible storage for images
- **Adminer** with Traefik reverse proxy (`adminer.le-xot.dev`)
- **migrations** — one-shot service: applies migrations before `application` starts
- **Application** with Traefik reverse proxy (`le-xot.dev`)

Requires external `traefik-public` network (attachable overlay) for Traefik reverse proxy.

### GitHub Actions

On push to `master`, automatically:

1. SSH connection to server
2. `git fetch` and `git reset --hard origin/master`
3. `docker compose up -d --build --remove-orphans`

To set up CI/CD, add secrets to GitHub:

- `SERVER_HOST` — server address
- `SERVER_USER` — SSH user
- `SERVER_SSH_KEY` — SSH private key

## Contributing

- All PRs to a new branch
- Follow oxlint/oxfmt configuration for code style
- Use TypeScript for all new code
- Frontend: Vue 3 Composition API (`<script setup lang="ts">`)
- Naming: `.vue` files — PascalCase, `.ts` files — kebab-case
- Icons: only @lucide/vue and vue3-simple-icons
- API client (`frontend/src/lib/api.ts`) is **auto-generated** — do not edit manually

## Troubleshooting

| Problem                              | Solution                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Cannot connect to DB                 | Check that PostgreSQL container is running: `docker ps`                                                                         |
| Authentication errors                | Verify Twitch/Kick API credentials in `.env`                                                                                    |
| Services not accessible              | Check ports: frontend 5173, backend 3000, DB 6543 (dev) / 5432 (prod)                                                           |
| Bun not installed                    | Use npm/pnpm as alternative package manager                                                                                     |
| TypeScript errors                    | Run `bun install` and ensure all dependencies are installed                                                                     |
| Frontend doesn't generate API client | Ensure backend is running on port 3000 (generation uses `/docs-json`)                                                           |
| Database migration errors            | Run `bun db:migrate` and check `database/migrations/`                                                                           |
| Rate limits stopped working          | Check that Redis is running (`bun infra:start`): when Redis is down limits are disabled (fail-open), but the site keeps working |
