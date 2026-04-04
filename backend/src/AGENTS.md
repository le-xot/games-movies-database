# BACKEND SOURCE KNOWLEDGE BASE

## OVERVIEW
NestJS API source directory. Boots Swagger, Prisma, and 16 feature modules.

## STRUCTURE
```
backend/src/
├── main.ts              # Swagger (/docs, /reference), cookieParser, CORS, prefix /api
├── app.module.ts        # Root. Imports modules, ServeStatic, Throttler, EventEmitter
├── app.controller.ts    # Health check. Reads package.json version via Bun.file()
├── database/            # PrismaModule + PrismaService ($connect on init)
├── enums/               # enums.names.ts: String constants for Prisma enum types
├── utils/               # enviroments.ts: envalid validation (note the filename typo)
└── modules/             # Feature modules (see modules/AGENTS.md for details)
```

## WHERE TO LOOK
| Target | File/Path | Notes |
|--------|-----------|-------|
| API Docs | `main.ts` | @nestjs/swagger + @scalar/nestjs-api-reference |
| App Config | `app.module.ts` | Global guards, EventEmitter2, Throttler (60req/60s) |
| Auth Logic | `modules/auth/` | @Global() AuthService, JWT cookie ('token') |
| DB Access | `database/` | Inject PrismaService into any provider |
| Env Schema | `utils/enviroments.ts` | Defines required vars for envalid |
| Real-time | `modules/websocket/` | Socket.io gateway for frontend updates |

## CONVENTIONS
- **Prefix**: All routes automatically prefixed with `/api` via `setGlobalPrefix`.
- **Validation**: Global `ValidationPipe` with `transform: true` and `whitelist: true`.
- **Auth**: Use `@User()` decorator to access `request.user`.
- **Guards**: `AuthGuard` (JWT), `ApikeyGuard` (TWIR header), `RolesGuard` (inline roles).
- **Events**: `EventEmitter2` for cross-module updates (users, likes, records).
- **CORS**: Restricted to `localhost:3000` and `:5173`.
- **Runtime**: Uses `Bun.file()` in `app.controller.ts` — requires Bun to run.

## ANTI-PATTERNS
- **Imports**: `WeatherModule` and `SpotifyModule` are commented out in `app.module.ts`.
- **Typo**: Do not "fix" `utils/enviroments.ts` without updating every import.
- **Duplicates**: `CustomJwtModule` is intentionally imported twice in `app.module.ts`.
- **Prisma**: Never instantiate `PrismaClient` directly; always inject `PrismaService`.
- **Auth**: Avoid manual JWT parsing. Use the provided guards and `@User()` decorator.
