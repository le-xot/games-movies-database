# MODULES OVERVIEW

Доменные сервисы для медиатеки, авторизации и внешних интеграций.

Nest здесь больше нет: модуль — это папка с сервисом и репозиториями. HTTP-слой
живёт в `backend/src/gateway/{домен}.ts`, проводка — в `server/container.ts`.

## MODULE TEMPLATE

- `{name}.service.ts` — бизнес-логика, обычный класс без декораторов
- `repositories/drizzle-{name}.repository.ts` — доступ к БД через `DrizzleService`
- `{name}.dto.ts` / `{name}.entity.ts` — типы; схемы валидации и OpenAPI лежат
  в гейтвее (`gateway/<домен>.ts`), а не здесь

## MODULE INVENTORY

| Module                | Files | Purpose                                                             |
| :-------------------- | :---- | :------------------------------------------------------------------ |
| **auth**              | 3     | Twitch/Kick/Telegram OIDC, выпуск JWT                               |
| **user**              | 6     | User CRUD, profile management, account merging, update-users events |
| **record**            | 5     | Media entries (games/movies), provider integration                  |
| **stats**             | 5     | Public records stats (genre/status/grade breakdowns)                |
| **like**              | 5     | User favorites, cascade deletes                                     |
| **suggestion**        | 4     | User-submitted content (note: `suggesttion.dto.ts` typo)            |
| **avatar**            | 3     | Avatar upload/delete via S3, Sharp image processing                 |
| **s3**                | 2     | S3/RustFS storage abstraction (upload, delete, exists)              |
| **kick**              | 2     | Kick API client for user metadata                                   |
| **twir**              | 4     | External bot webhooks, проверка API-ключа                           |
| **websocket**         | 1     | Типы WS-событий (транспорт — `gateway/ws.ts`)                       |
| **records-providers** | 2     | External metadata fetchers (Kinopoisk, etc.)                        |
| **img**               | 3     | Image proxy and resizing via Sharp                                  |
| **jwt**               | 1     | CustomJwtModule wrapper for @nestjs/jwt                             |
| **limit**             | 4     | Suggestion quantity constraints                                     |
| **rate-limit**        | 5     | Redis rate limiter (guard, decorator, Lua fixed window)             |
| **queue**             | 4     | General purpose item queue management                               |
| **twitch**            | 2     | Twitch API client for metadata and validation                       |
| **telegram**          | 5     | Telegram Login via OpenID Connect (PKCE, id_token/JWKS)             |
| **weather**           | 3     | Weather data fetcher (OpenWeatherMap)                               |
| **steam**             | 4     | Steam library sync and IGDB import (admin)                          |
| **wordle**            | 15    | Daily word game + unlimited practice mode (Redis, no stats)         |

## MODULE INTERACTIONS

- **Database**: Most modules import `DrizzleModule` for direct DB access (inject `DrizzleService`).
- **Identity**: `AuthModule` is global; `AuthGuard` provides user context.
- **Events**: `EventEmitter2` triggers `update-*` events for cross-module sync.
- **Broadcasting**: `WebsocketModule` listens for events to push UI updates.
- **Rate Limiting**: `RateLimitModule` provides `RateLimitGuard` (global `APP_GUARD`) backed by Redis; per-route limits via `@RateLimit()`.
- **Dependencies**:
  - `RecordModule` -> `User`, `RecordsProviders`, `Websocket`
  - `LikeModule` -> `Record`, `User`, `Websocket`
  - `SuggestionModule` -> `Drizzle`, `User`, `RecordsProviders`, `Websocket`
  - `TwirModule` -> `Suggestion`, `User`
  - `AvatarModule` -> `S3`, `User`
  - `ImgModule` -> `S3`
  - `TelegramModule` -> `oauth.telegram.org` (OpenID Connect, outbound); exports `TelegramService` globally

## ANTI-PATTERNS

- **Manual Mapping**: Avoid manual JSON mapping; use ClassSerializerInterceptor.
- **Direct Socket Calls**: Services should emit events via `EventEmitter2` instead of injecting the Gateway.
- **Guard Sprawl**: Don't rewrite auth logic; use the existing `AuthGuard` and `RolesGuard`.
- **Typo Fixes**: Do not rename `suggesttion.dto.ts` without a full project refactor.
- **Throttler**: `@nestjs/throttler` is removed — apply limits with `@RateLimit()` from `modules/rate-limit/`.
- **Provider Leaks**: Keep external API keys in `.env` and validate via `EnviromentVariables`.
