# BACKEND SOURCE KNOWLEDGE BASE

## OVERVIEW

Elysia API на Bun. HTTP-слой — тонкий гейтвей (`gateway/`), домен — обычные классы в
`modules/` без DI-контейнера. Схемы TypeBox в гейтвее — единственный источник
валидации, OpenAPI и типов фронта (Eden выводит их из `export type App`).

## STRUCTURE

```
backend/src/
├── main.ts              # Точка входа: container.init() → http-сервер → listen
├── gateway/             # HTTP/WS-слой: роуты, схемы TypeBox, auth, лимит, ошибки
│   ├── index.ts         # createGateway(deps) + onError (конверт ApiErrorDto)
│   ├── openapi.ts       # документ через app.handle() — для контрактных тестов
│   ├── ws.ts            # native WebSocket на Bun + мост из доменных событий
│   └── <домен>.ts       # модели + роуты одного домена
├── server/              # обвязка: composition root, http-сервер, статика
├── database/            # DrizzleService (pg.Pool + drizzle)
├── enums/               # ре-экспорт констант из @gmdb/contract
├── utils/               # env, ошибки, логгер, лимиты, доменные события
└── modules/             # Доменные сервисы и репозитории (без Nest)
```

## WHERE TO LOOK

| Target      | File/Path                                  | Notes                                                      |
| ----------- | ------------------------------------------ | ---------------------------------------------------------- |
| Роут        | `gateway/<домен>.ts`                       | Модели + `.get/.post`, схемы ответов по кодам              |
| Сборка      | `gateway/index.ts`                         | `createGateway(deps)` — список портов и подключение роутов |
| Проводка    | `server/container.ts`                      | Composition root: сервисы создаются руками, хуки — явно    |
| Контракт    | `gateway/openapi.ts`                       | Документ для контрактных тестов и `openapi:golden`         |
| Rate limits | `utils/rate-limits.ts`                     | Пресеты; сам лимитер — `utils/rate-limit.ts` (Redis)       |
| Ошибки      | `utils/errors.ts`                          | Домен бросает `HttpError`, гейтвей превращает в конверт    |
| Auth        | `gateway/auth.ts` + `jwt-authenticator.ts` | cookie `token` → пользователь; `requireUser`/`requireRole` |
| Real-time   | `gateway/ws.ts`                            | `/ws`, одна комната, кадры `{ event, payload }`            |
| Env         | `utils/enviroments.ts`                     | envalid (в имени файла опечатка — так и надо)              |

## CONVENTIONS

- **Роут = модель + ответ по кодам.** Имена моделей в TypeBox повторяют имена схем
  контракта (`RecordEntity`, `ApiErrorDto`) — от них зависит `$ref` и типы фронта.
- **Модели регистрируются в том плагине, где объявлен роут.** Ссылка `200: 'X'`
  проверяется по реестру того `Elysia`, на котором висит роут.
- **Порядок middleware**: лимит → auth → роли. Тесты это фиксируют.
- **`onTransform` только на уровне плагина**: в опциях роута Elysia его игнорирует.
- **Числа в query**: если в схеме есть `t.Ref`, Elysia перестаёт приводить строки к
  числу — используйте `coerceQueryNumbers` (см. `gateway/query.ts`).
- **Домен не знает про HTTP-слой.** Гейтвей получает порты (`WeatherReader`,
  `LikesService`), а не классы Nest.
- **События**: `DomainEvents` (см. `utils/domain-events.ts`), мост в WS — `bridgeWsEvents`.

## ANTI-PATTERNS

- **Typo**: не «исправлять» `utils/enviroments.ts` без обновления всех импортов.
- **Drizzle**: не создавать `pg.Pool` вне `DrizzleService`.
- **`t.Unsafe` в схемах ответа**: ломает рантайм-валидацию TypeBox («Unknown type»),
  выглядит валидным в OpenAPI и падает 500 на живом запросе.
- **`null` в ответе**: Elysia отдаёт пустое тело — для nullable-ответов нужен явный
  `Response('null')`.
- **Сервисы не должны бросать Nest-исключения** — их больше нет; домен бросает
  `HttpError` из `utils/errors.ts`.
