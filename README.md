# Development

## Dependencies

* [Node.js: v22](https://nodejs.org/en)
* [PNPM: v10](https://pnpm.io/)
* [Docker](https://docs.docker.com/engine/)

## Cli

* Install dependencies

```bash
pnpm i
```

* Run needed services (postgres)

```bash
docker compose up -d
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

## Contributing

* Please make sure that you pull request to [dev](https://github.com/le-xot/games-movies-database/tree/dev) branch.
* To become an ADMIN please change [seed.js](/backend/prisma/seed.js) with your actual twitch login and id
