# Development

* [Node.js: v20](https://nodejs.org/en)
* [PNPM: v9](https://pnpm.io/)
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

* Generate prisma schema and migrate dev database in **backend** folder

```bash
pnpx prisma generate
pnpx prisma migrate dev
```

* Start development

```bash
pnpm dev
```

* Visit http://localhost:5173

## Contributing

* Please make sure that you pull request to [dev](https://github.com/le-xot/games-movies-database/tree/dev) branch.
* To become an ADMIN please change [seed.js](/backend/prisma/seed.js) with your actual twitch login and id
