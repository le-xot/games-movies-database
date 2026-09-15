# BACKEND SOURCE KNOWLEDGE BASE

## OVERVIEW

NestJS 12 API source directory. Boots Swagger, Drizzle, Redis rate limiting, and 20 feature modules.

## STRUCTURE

```
backend/src/
├── main.ts              # Swagger (/docs, /reference), cookieParser, CORS, prefix /api
├── app.module.ts        # Root. Imports modules, ServeStatic, RateLimitGuard, EventEmitter
├── app.controller.ts    # Health check. Reads package.json version via Bun.file()
├── database/            # DrizzleModule + DrizzleService (pg.Pool + drizzle)
├── enums/               # enums.names.ts: String constants for database enum types
├── utils/               # enviroments.ts (envalid, typo in filename), rate-limits.ts (presets)
└── modules/             # Feature modules (see modules/AGENTS.md for details)
```

## WHERE TO LOOK

| Target      | File/Path              | Notes                                                         |
| ----------- | ---------------------- | ------------------------------------------------------------- |
| API Docs    | `main.ts`              | @nestjs/swagger + @scalar/nestjs-api-reference                |
| App Config  | `app.module.ts`        | Global guards, EventEmitter2, RateLimitGuard                  |
| Rate Limits | `modules/rate-limit/`  | Redis fixed-window limiter; presets in `utils/rate-limits.ts` |
| Auth Logic  | `modules/auth/`        | @Global() AuthService, JWT cookie ('token')                   |
| DB Access   | `database/`            | Inject DrizzleService, use `.db`                              |
| Env Schema  | `utils/enviroments.ts` | Defines required vars for envalid                             |
| Real-time   | `modules/websocket/`   | Socket.io gateway for frontend updates                        |

## CONVENTIONS

- **Prefix**: All routes automatically prefixed with `/api` via `setGlobalPrefix`.
- **Validation**: Global `ValidationPipe` with `transform: true` and `whitelist: true`.
- **Auth**: Use `@User()` decorator to access `request.user`.
- **Guards**: `AuthGuard` (JWT), `ApikeyGuard` (TWIR header), `RolesGuard` (inline roles), `RateLimitGuard` (global Redis limiter).
- **Events**: `EventEmitter2` for cross-module updates (users, likes, records).
- **CORS**: Restricted to `localhost:3000` and `:5173`.
- **Runtime**: Uses `Bun.file()` in `app.controller.ts` — requires Bun to run.

## ANTI-PATTERNS

- **Typo**: Do not "fix" `utils/enviroments.ts` without updating every import.
- **Drizzle**: Never instantiate a pg Pool outside `DrizzleService`; always inject it.
- **Throttler**: `@nestjs/throttler` was removed — use `@RateLimit()` from `modules/rate-limit/`.
- **Auth**: Avoid manual JWT parsing. Use the provided guards and `@User()` decorator.
