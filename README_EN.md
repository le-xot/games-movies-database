# Games Movies Database

Full-stack web application for tracking media: games, anime, movies, cartoons, series, and PC games. Twitch and Kick authentication, Spotify integration, real-time updates via WebSocket.

## Features

- **Media tracking** — games, anime, movies, cartoons, series, and PC games with statuses and ratings
- **Authentication** — OAuth via Twitch and Kick, JWT in httpOnly cookies
- **Spotify** — Spotify API integration, track queue
- **Real-time** — instant UI updates via Socket.IO
- **Suggestion system** — users suggest new content for adding
- **Auction** — real-time auction management
- **Queue system** — item queue management
- **Likes** — favorites with cascade deletion
- **Profile** — account management, link/unlink providers, account deletion
- **Admin panel** — administration interface
- **Image proxy** — resizing via Sharp, proxying through `/api/img`
- **Watch links** — automatic Kinobox links for watching
- **Weather** — weather widget via OpenWeatherMap
- **TWIR** — webhooks from external bot with API key protection

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Vue 3, Vite, TypeScript, Tailwind CSS 4, shadcn-vue, Pinia, Socket.IO Client, @tanstack/vue-table, vee-validate + zod |
| Backend | NestJS, Prisma ORM, PostgreSQL, Socket.IO, Sharp, JWT |
| Infrastructure | Docker, Bun, Caddy (reverse proxy), GitHub Actions |

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

### 3. Start PostgreSQL

```bash
docker compose -f docker-compose-dev.yml up -d
```

This starts PostgreSQL on port `5432` and Adminer on port `54321`.

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — at minimum set `JWT_SECRET`. See [Environment Variables](#environment-variables) for all options.

### 5. Database migration

```bash
cd backend
bun prisma generate
bun prisma migrate dev
```

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

| Variable | Description | Required |
|----------|-------------|----------|
| `DATASOURCE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `APP_PORT` | Backend server port (default: 3000) | No |
| `TWITCH_CLIENT_ID` | Twitch OAuth Client ID | No |
| `TWITCH_CLIENT_SECRET` | Twitch OAuth Client Secret | No |
| `TWITCH_CALLBACK_URL` | URL callback after Twitch authorization | No |
| `KICK_CLIENT_ID` | Kick OAuth Client ID | No |
| `KICK_CLIENT_SECRET` | Kick OAuth Client Secret | No |
| `KICK_CALLBACK_URL` | URL callback after Kick authorization | No |
| `SPOTIFY_CLIENT_ID` | Spotify Client ID | No |
| `SPOTIFY_CLIENT_SECRET` | Spotify Client Secret | No |
| `SPOTIFY_CALLBACK_URL` | URL callback after Spotify authorization | No |
| `KINOPOISK_API` | Kinopoisk API key | No |
| `TMBD_API` | TMDB API key | No |
| `WEATHER_API_KEY` | OpenWeatherMap API key | No |
| `WEATHER_LAT` | Latitude for weather | No |
| `WEATHER_LON` | Longitude for weather | No |
| `PROXY` | Proxy URL for external APIs | No |
| `TWIR_API` | API key for TWIR webhooks | No |

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
│   │   │   ├── record/        # Record creation form
│   │   │   ├── table/         # DataTable, filters, pagination, search
│   │   │   └── ui/            # shadcn-vue primitives (DO NOT EDIT)
│   │   ├── composables/       # Composables + factories for media pages
│   │   ├── lib/               # API client (auto-generated), cn() utility
│   │   ├── pages/             # Application pages
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── anime/         # Anime tracking
│   │   │   ├── auction/       # Auction
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
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                   # NestJS API server
│   ├── src/
│   │   ├── main.ts            # Entry point, Swagger, CORS, cookieParser
│   │   ├── app.module.ts      # Root module
│   │   ├── database/          # PrismaModule + PrismaService
│   │   ├── enums/             # Constants for Prisma enums
│   │   ├── utils/             # Environment validation (envalid)
│   │   └── modules/           # Feature modules
│   │       ├── auth/          # Twitch/Kick OAuth, JWT, guards
│   │       ├── user/          # User CRUD
│   │       ├── record/        # Media records
│   │       ├── like/          # Likes/favorites
│   │       ├── suggestion/    # Content suggestions
│   │       ├── auction/       # Auction
│   │       ├── queue/         # Item queue
│   │       ├── spotify/       # Spotify integration
│   │       ├── twitch/        # Twitch API client
│   │       ├── kick/          # Kick API client
│   │       ├── websocket/     # Socket.IO gateway
│   │       ├── records-providers/  # External metadata providers
│   │       ├── img/           # Image proxy and resizing (Sharp)
│   │       ├── twir/          # TWIR webhooks
│   │       ├── weather/       # Weather (OpenWeatherMap)
│   │       ├── jwt/           # CustomJwtModule wrapper
│   │       └── limit/         # Rate limiting
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Prisma migrations
│   └── package.json
├── docker-compose.yml         # Production config (PostgreSQL + app + Caddy)
├── docker-compose-dev.yml     # Dev environment (PostgreSQL + Adminer)
├── Dockerfile                 # Multi-stage build (frontend → backend → serve)
├── package.json               # Root package.json (workspaces)
├── .oxlintrc.json             # oxlint configuration
├── .oxfmtrc.json              # oxfmt configuration
└── .github/workflows/
    └── docker.yaml            # CI/CD: SSH deploy on push to master
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start frontend and backend in development mode |
| `bun dev:frontend` | Frontend only (port 5173) |
| `bun dev:backend` | Backend only (port 3000) |
| `bun build` | Build frontend and backend for production |
| `bun build:frontend` | Build frontend only |
| `bun build:backend` | Build backend only |
| `bun start:backend` | Start backend in production mode |
| `bun prisma` | Run migrations + generate Prisma client |
| `bun lint` | Run oxlint code check |
| `bun lint:fix` | Auto-fix oxlint issues |
| `bun format` | Format with oxfmt |
| `bun format:check` | Check formatting without changes |

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

### Spotify

Spotify API integration for tracks and queue management.

Getting credentials:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Set Redirect URI: `http://127.0.0.1:5173/auth/callback/spotify`
4. Copy Client ID and Client Secret to `.env`

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_CALLBACK_URL=http://127.0.0.1:5173/auth/callback/spotify
```

### Kinopoisk

API for fetching movie and series data from Kinopoisk.

```
KINOPOISK_API=your_api_key
```

### TMDB

API for fetching movie and series data from The Movie Database.

```
TMBD_API=your_api_key
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
- Prisma ORM with migrations
- Models use `@@map()` for table names
- Enum constants in `backend/src/enums/enums.names.ts`
- Adminer available on port `54321` in dev mode

### Guards and Authorization

- `AuthGuard` — JWT validation (cookie `token`)
- `ApikeyGuard` — TWIR endpoint protection via API key
- `RolesGuard` — role-based access
- `ThrottlerGuard` — rate limiting (60 requests / 60 seconds)

## Deployment

### Docker

```bash
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

### Docker Compose (production)

Production configuration in `docker-compose.yml` includes:
- **PostgreSQL 17** with persistent volume
- **Adminer** with Caddy reverse proxy (`adminer.le-xot.dev`)
- **Application** with Caddy reverse proxy (`le-xot.dev`)

Requires external `caddy` network for Caddy reverse proxy.

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
- Icons: only lucide-vue-next and vue3-simple-icons
- API client (`frontend/src/lib/api.ts`) is **auto-generated** — do not edit manually

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect to DB | Check that PostgreSQL container is running: `docker ps` |
| Authentication errors | Verify Twitch/Kick API credentials in `.env` |
| Services not accessible | Check ports: frontend 5173, backend 3000, DB 6543 (dev) / 5432 (prod) |
| Bun not installed | Use npm/pnpm as alternative package manager |
| TypeScript errors | Run `bun install` and ensure all dependencies are installed |
| Frontend doesn't generate API client | Ensure backend is running on port 3000 (generation uses `/docs-json`) |
| Prisma migration errors | Run `cd backend && bun prisma migrate dev` |
