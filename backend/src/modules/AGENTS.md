# MODULES OVERVIEW

Доменные сервисы для медиатеки, авторизации и внешних интеграций.

Nest здесь больше нет: модуль — это папка с сервисом и репозиториями. HTTP-слой
живёт в `backend/src/gateway/{домен}.ts`, проводка — в `server/container.ts`.

## MODULE TEMPLATE

- `{name}.service.ts` — бизнес-логика, обычный класс без декораторов
- `repositories/drizzle-{name}.repository.ts` — доступ к БД через `DrizzleService`
- `{name}.dto.ts` / `{name}.entity.ts` — типы; схемы валидации и OpenAPI лежат
  в гейтвее (`gateway/<домен>.ts`), а не здесь
- хуки `onModuleInit` / `onApplicationBootstrap` / `onModuleDestroy` остались
  по имени с Nest-эпохи: их вызывает `container.init()` / `container.close()`

## MODULE INVENTORY

| Module                | Files | Purpose                                                             |
| :-------------------- | :---- | :------------------------------------------------------------------ |
| **auth**              | 3     | Twitch/Kick/Telegram OIDC, выпуск JWT                               |
| **user**              | 6     | User CRUD, profile management, account merging, update-users events |
| **record**            | 5     | Media entries (games/movies), provider integration                  |
| **rating**            | 5     | Оценки записей, средние и топ по пользователям                      |
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
| **limit**             | 4     | Suggestion quantity constraints                                     |
| **queue**             | 4     | General purpose item queue management                               |
| **twitch**            | 2     | Twitch API client for metadata and validation                       |
| **telegram**          | 5     | Telegram Login via OpenID Connect (PKCE, id_token/JWKS)             |
| **weather**           | 3     | Weather data fetcher (OpenWeatherMap)                               |
| **steam**             | 4     | Steam library sync and IGDB import (admin)                          |
| **wordle**            | 15    | Daily word game + unlimited practice mode (Redis, no stats)         |

## MODULE INTERACTIONS

- **Database**: `DrizzleService` создаётся один раз в `server/container.ts` и передаётся сервисам в конструктор; `DrizzleModule` больше нет.
- **Identity**: `resolveUser` достаёт пользователя из cookie `token`, `requireUser` / `requireRole` из `gateway/auth.ts` вызываются прямо в роутах — глобального `AuthGuard` нет.
- **Events**: `DomainEvents` (`backend/src/utils/domain-events.ts`) вместо `EventEmitter2`; сервисы эмитят `update-*`, подписки собирает composition root.
- **Broadcasting**: транспорт — `gateway/ws.ts` (нативный WebSocket на `/ws`); `bridgeWsEvents` подписывает эмиттер на `WsEvents` и пушит кадры клиентам.
- **Rate Limiting**: `enforceRateLimit` + пресеты `RATE_LIMITS` из `utils/rate-limits.ts`, вызов внутри роута; порядок — лимит → auth → роли.
- **Wiring**: граф зависимостей собирается руками в `createContainer()`:
  - `RecordService` -> `RecordsProviders`, `ImgService`, `DrizzleRatingRepository`, events
  - `LikeService` -> `DrizzleLikeRepository`, events
  - `SuggestionService` -> `RecordsProviders`, events
  - `TwirService` -> `UserService`, `SuggestionService`
  - `AvatarService` -> `S3Service`; `UserService` -> `AvatarService`
  - `ImgService` -> `S3Service`
  - `TelegramService` -> `oauth.telegram.org` (OpenID Connect, outbound)

## ANTI-PATTERNS

- **Manual Mapping**: маппинг доменных сущностей в DTO гейтвея живёт в `backend/src/server/adapters.ts` — не размазывайте его по роутам.
- **Direct Socket Calls**: сервисы эмитят события через `DomainEvents`, а не трогают WebSocket напрямую.
- **Guard Sprawl**: не переписывайте проверку доступа; используйте `requireUser` / `requireRole` из `gateway/auth.ts`.
- **Typo Fixes**: Do not rename `suggesttion.dto.ts` without a full project refactor.
- **Throttler**: `@nestjs/throttler` удалён — лимиты ставятся `enforceRateLimit` с пресетами `RATE_LIMITS` в роутах гейтвея.
- **Provider Leaks**: Keep external API keys in `.env` and validate via `EnviromentVariables`.
