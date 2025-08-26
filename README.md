# Games Movies Database

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
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

# Development

## Dependencies

* [Node.js: v22](https://nodejs.org/en)
* [Pnpm: v10](https://pnpm.io/)
* [Docker](https://docs.docker.com/engine/)

## Setup

* Install dependencies

```bash
pnpm i
```

* Run needed services (postgres)

```bash
docker compose -f ./docker-compose-dev.yml up -d
```

* Generate prisma schema and migrate dev database

```bash
cd backend
pnpm prisma generate
pnpm prisma migrate dev
```

* Start development

```bash
pnpm dev
```

* Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

* `frontend/` - Vue 3 application with Tailwind CSS
* `backend/` - NestJS API server with Prisma ORM
* `docker-compose-dev.yml` - Development environment configuration

## Available Scripts

* `pnpm dev` - Start both frontend and backend in development mode
* `pnpm build` - Build both frontend and backend for production
* `pnpm start:backend` - Start the backend server in production mode
* `pnpm lint` - Run ESLint on the entire project
* `pnpm lint:fix` - Fix ESLint issues automatically

## Third-party integrations

### Twitch Authentication

To enable Twitch login functionality, fill in these environment variables in `backend/.env`:

```bash
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CALLBACK_URL=http://localhost:5173/auth/callback
```

You can obtain these credentials by:

1. Going to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Creating a new application
3. Setting the OAuth Redirect URL to `http://localhost:5173/auth/callback`

### OpenWeatherMap Integration

To enable weather functionality, fill in these environment variables in `backend/.env`:

```bash
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

```bash
KINOPOISK_API=your_api_key
```

### TWIR Integration

To enable TWIR API integration, add your TWIR API key to `backend/.env`:

```bash
TWIR_API=your_api_key
```

This API key is used for authenticating requests from TWIR to your application.

### Spotify Integration

To enable Spotify functionality, add these environment variables to `backend/.env`:

```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_CALLBACK_URL=http://127.0.0.1:5173/auth/callback/spotify
```

You can obtain these credentials by:

1. Going to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Creating a new application
3. Setting the Redirect URI to `http://127.0.0.1:5173/auth/callback/spotify`

### TMDB Integration

To enable additional movie data fetching, add your TMDB API key to `backend/.env`:

```bash
TMBD_API=your_api_key
```

You can get your API key by:

1. Creating an account at [The Movie Database](https://www.themoviedb.org/)
2. Going to Settings > API
3. Generating a new API key

### Proxy Configuration

If you need to use a proxy for external API requests, add to `backend/.env`:

```bash
PROXY=socks5://your-proxy-url:port
```

## Environment Setup

Copy the example environment file and update it with your settings:

```bash
cp backend/.env.example backend/.env
```

## Database Administration

A web-based database admin interface is available at [http://localhost:54321](http://localhost:54321) when running the development environment.

## API Documentation

API documentation is available at:

* Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)
* Scalar API Reference: [http://localhost:3000/reference](http://localhost:3000/reference)

## Contributing

* Please make sure that you pull request to [dev](https://github.com/le-xot/games-movies-database/tree/dev) branch
* To become an ADMIN please change [seed.js](/backend/prisma/seed.js) with your actual twitch login and id

## Troubleshooting

* If you encounter database connection issues, make sure the PostgreSQL container is running
* For authentication problems, verify your Twitch API credentials
* Check the port configuration if services are not accessible (frontend: 5173, backend: 3000, database: 6543)
