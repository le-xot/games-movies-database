# Games Movies Database

A full-stack web application for managing games and movies database with Twitch authentication, Spotify integration, and real-time features.

## Table of Contents

- [Development](#development)
  - [Dependencies](#dependencies)
  - [Setup](#setup)
  - [Project Structure](#project-structure)
  - [Available Scripts](#available-scripts)
- [Third-party Integrations](#third-party-integrations)
  - [Twitch Authentication](#twitch-authentication)
  - [Spotify Integration](#spotify-integration)
  - [OpenWeatherMap Integration](#openweathermap-integration)
  - [Kinopoisk API](#kinopoisk-api)
  - [TMDB Integration](#tmdb-integration)
  - [TWIR Integration](#twir-integration)
  - [Proxy Configuration](#proxy-configuration)
- [Environment Setup](#environment-setup)
- [Database Administration](#database-administration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Development

### Dependencies

* [Bun](https://bun.sh/) - JavaScript runtime and package manager
* [Docker](https://docs.docker.com/engine/)

### Setup

* Install dependencies

```bash
bun install
```

* Run needed services (postgres)

```bash
docker compose -f ./docker-compose-dev.yml up -d
```

* Generate prisma schema and migrate dev database

```bash
cd backend
bun prisma generate
bun prisma migrate dev
```

* Start development

```bash
bun dev
```

* Visit [http://localhost:5173](http://localhost:5173)

### Project Structure

* `frontend/` - Vue 3 application with TypeScript, Tailwind CSS, and Composition API
* `backend/` - NestJS API server with Prisma ORM and PostgreSQL
* `docker-compose-dev.yml` - Development environment configuration
* `Dockerfile` - Production build configuration

### Available Scripts

* `bun dev` - Start both frontend and backend in development mode
* `bun dev:frontend` - Start only the frontend development server
* `bun dev:backend` - Start only the backend development server
* `bun build` - Build both frontend and backend for production
* `bun build:frontend` - Build only the frontend
* `bun build:backend` - Build only the backend
* `bun start:backend` - Start the backend server in production mode
* `bun prisma` - Run Prisma migrations and generate client
* `bun lint` - Run ESLint on the entire project
* `bun lint:fix` - Fix ESLint issues automatically

## Third-party Integrations

### Twitch Authentication

To enable Twitch login functionality, fill in these environment variables in `backend/.env`:

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CALLBACK_URL=http://localhost:5173/auth/callback
TWITCH_ADMIN_ID=your_twitch_user_id
TWITCH_ADMIN_LOGIN=your_twitch_username
```

You can obtain these credentials by:

1. Going to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Creating a new application
3. Setting the OAuth Redirect URL to `http://localhost:5173/auth/callback`

### Spotify Integration

To enable Spotify functionality, add these environment variables to `backend/.env`:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_CALLBACK_URL=http://127.0.0.1:5173/auth/callback/spotify
```

You can obtain these credentials by:

1. Going to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Creating a new application
3. Setting the Redirect URI to `http://127.0.0.1:5173/auth/callback/spotify`

### OpenWeatherMap Integration

To enable weather functionality, fill in these environment variables in `backend/.env`:

```
WEATHER_API_KEY=your_api_key
WEATHER_LAT=your_latitude
WEATHER_LON=your_longitude
```

You can get your API key by:

1. Creating an account at [OpenWeatherMap](https://openweathermap.org/)
2. Going to API keys section
3. Generating a new API key

### Kinopoisk API

To enable movie data fetching, add your Kinopoisk API key to `backend/.env`:

```
KINOPOISK_API=your_api_key
```

### TMDB Integration

To enable additional movie data fetching, add your TMDB API key to `backend/.env`:

```
TMBD_API=your_api_key
```

You can get your API key by:

1. Creating an account at [The Movie Database](https://www.themoviedb.org/)
2. Going to Settings > API
3. Generating a new API key

### TWIR Integration

To enable TWIR API integration, add your TWIR API key to `backend/.env`:

```
TWIR_API=your_api_key
```

This API key is used for authenticating requests from TWIR to your application.

### Proxy Configuration

If you need to use a proxy for external API requests, add to `backend/.env`:

```
PROXY=socks5://your-proxy-url:port
```

## Environment Setup

Copy the example environment file and update it with your settings:

```bash
cp backend/.env.example backend/.env
```

Required environment variables:
- `DATASOURCE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `APP_PORT` - Backend server port (default: 3000)

## Database Administration

A web-based database admin interface is available at [http://localhost:54321](http://localhost:54321) when running the development environment.

## API Documentation

API documentation is available at:

* Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)
* Scalar API Reference: [http://localhost:3000/reference](http://localhost:3000/reference)

## Deployment

The application can be deployed using Docker:

```bash
docker build -t games-movies-database .
docker run -p 3000:3000 games-movies-database
```

Or use the provided GitHub Actions workflow for automated deployment.

## Contributing

* Please make sure that you pull request to new branch
* To become an ADMIN please change `backend/prisma/seed.js` with your actual Twitch login and ID
* Follow the ESLint configuration for code style
* Use TypeScript for all new code
* Follow Vue 3 Composition API patterns in the frontend

## Troubleshooting

* If you encounter database connection issues, make sure the PostgreSQL container is running
* For authentication problems, verify your Twitch API credentials
* Check the port configuration if services are not accessible (frontend: 5173, backend: 3000, database: 6543)
* If Bun is not available, you can use npm/pnpm as an alternative package manager
* For TypeScript errors, ensure all dependencies are installed and run `bun install`
