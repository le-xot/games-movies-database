# MODULES OVERVIEW
NestJS feature modules for media tracking, auth, and external integrations.

## MODULE TEMPLATE
Standard file set for new features:
- `{name}.module.ts`: Dependency wiring
- `{name}.controller.ts`: HTTP endpoints (DTO validation)
- `{name}.service.ts`: Business logic (Prisma access)
- `{name}.dto.ts`: Input validation schemas
- `{name}.entity.ts`: Response shapes (optional)

## MODULE INVENTORY
| Module | Files | Purpose |
| :--- | :--- | :--- |
| **auth** | 8 | Twitch OAuth, JWT, @Global() guards, @User() decorator |
| **user** | 5 | User CRUD, profile management, update-users events |
| **record** | 5 | Media entries (games/movies), provider integration |
| **like** | 5 | User favorites, $transaction cascade deletes |
| **suggestion** | 4 | User-submitted content (note: `suggesttion.dto.ts` typo) |
| **auction** | 3 | Real-time auction management logic |
| **twir** | 4 | External bot webhooks, ApikeyGuard protection |
| **spotify** | 4 | Spotify API integration + background track queue |
| **websocket** | 2 | Socket.IO gateway for real-time frontend updates |
| **records-providers**| 2 | External metadata fetchers (Kinopoisk, etc.) |
| **img** | 3 | Image proxy and resizing via Sharp |
| **jwt** | 1 | CustomJwtModule wrapper for @nestjs/jwt |
| **limit** | 4 | Rate limiting and quantity constraints |
| **queue** | 4 | General purpose item queue management |
| **twitch** | 2 | Twitch API client for metadata and validation |
| **weather** | 3 | Weather data fetcher (currently inactive) |

## MODULE INTERACTIONS
- **Database**: Most modules import `PrismaModule` for direct DB access.
- **Identity**: `AuthModule` is global; `AuthGuard` provides user context.
- **Events**: `EventEmitter2` triggers `update-*` events for cross-module sync.
- **Broadcasting**: `WebsocketModule` listens for events to push UI updates.
- **Dependencies**:
  - `RecordModule` -> `User`, `RecordsProviders`, `Websocket`
  - `LikeModule` -> `Record`, `User`, `Websocket`
  - `SuggestionModule` -> `Prisma`, `User`, `RecordsProviders`, `Websocket`
  - `TwirModule` -> `Suggestion`, `User`

## ANTI-PATTERNS
- **Manual Mapping**: Avoid manual JSON mapping; use ClassSerializerInterceptor.
- **Direct Socket Calls**: Services should emit events via `EventEmitter2` instead of injecting the Gateway.
- **Guard Sprawl**: Don't rewrite auth logic; use the existing `AuthGuard` and `RolesGuard`.
- **Typo Fixes**: Do not rename `suggesttion.dto.ts` without a full project refactor.
- **Provider Leaks**: Keep external API keys in `.env` and validate via `EnviromentVariables`.
