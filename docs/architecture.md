# Архитектура

Один контейнер отдаёт и API, и собранный фронт. Ниже — как устроен код и почему.

## Общая картина

```
┌─────────────────────┐        Eden Treaty (типы из `App`)        ┌──────────────────────────┐
│  Vue 3 SPA          │ ────────────────────────────────────────► │  Elysia gateway /api     │
│  frontend/src       │ ◄──────────── JSON по схемам ──────────── │  backend/src/gateway     │
└─────────┬───────────┘                                           └────────────┬─────────────┘
          │ ws://.../ws                                                        │ порты (интерфейсы)
          ▼                                                                    ▼
┌─────────────────────┐                                           ┌──────────────────────────┐
│  useWebSocket       │ ◄──── { event, payload } ──────────────── │  server/wiring + modules │
│  frontend/composables│                                          │  доменные сервисы        │
└─────────────────────┘                                           └────────────┬─────────────┘
                                                                               ▼
                                                                  ┌──────────────────────────┐
                                                                  │ DrizzleService → Postgres│
                                                                  └──────────────────────────┘
```

## Слои

| Слой      | Где                                            | Отвечает за                                                    | Не знает про         |
| --------- | ---------------------------------------------- | -------------------------------------------------------------- | -------------------- |
| Транспорт | `backend/src/server/http.ts`                   | префикс `/api`, CORS, security-заголовки, JSON-404, SPA-фолбэк | домен                |
| Гейтвей   | `backend/src/gateway/`                         | роуты, схемы TypeBox, коды ответов, лимиты, gard'ы             | как устроен сервис   |
| Проводка  | `backend/src/server/wiring/`                   | query/body → аргументы сервиса, маппинг сущностей в DTO        | бизнес-логику        |
| Домен     | `backend/src/modules/`                         | бизнес-логика, репозитории, события                            | HTTP, Elysia, cookie |
| Данные    | `backend/src/database/`, `database/src/schema` | пул соединений, схема, миграции                                | HTTP-формы           |
| Контракт  | `contract/` (`@gmdb/contract`)                 | enum'ы, WS-события, `parseWsMessage`                           | всё остальное        |

Направление зависимостей — `server → gateway → modules`. Единственное исключение: гейтвей может
импортировать из `modules/` чистые функции и константы (`assertOAuthState`, `TELEGRAM_OIDC_*`),
но не сервисы.

## Composition root

`createContainer()` (`backend/src/server/container.ts`) собирает всё руками: `new` сервисов,
`new` репозиториев, один `DrizzleService`, один `RedisClient`, один `DomainEvents`. DI-контейнера нет.

- Сервисы, которым нужен прогрев или таймер, реализуют `onModuleInit` / `onApplicationBootstrap` /
  `onModuleDestroy` (имена остались с Nest-эпохи) и **обязательно** попадают в списки
  `started` / `stoppable`. Забыть — значит молча не запустить погоду, расписание уведомлений
  или уборку в Wordle.
- Хуки вызывает `container.init()` / `container.close()`. Ошибка в хуке не роняет старт: пишем
  warning и живём дальше.
- `main.ts` на `SIGTERM`/`SIGINT` делает `app.stop()` (новые соединения не принимаются) и
  `container.close()` (закрываются пул Postgres и Redis).

## Жизненный цикл запроса

1. `onRequest` в `http.ts` ставит security-заголовки и CORS-origin, если он в списке `CORS_ORIGINS`
2. Запрос попадает в `/api` → роут гейтвея
3. `enforceRateLimit` — фикс-окно в Redis по ключу `rl:{route}:{ip}`; при недоступном Redis лимит
   пропускается (fail-open) с таймаутом 250 мс
4. Аутентификация: `resolveUser` читает JWT из cookie `token`; `requireUser` / `requireRole`
   бросают 401/403
5. Порт из `wiring/` превращает query/body в аргументы сервиса
6. Доменный сервис работает с репозиторием и эмитит событие в `DomainEvents`
7. Ответ проверяется схемой TypeBox; несоответствие — 500 и запись в лог (это баг сервера,
   а не клиента)
8. Ошибки собираются в одном месте — `onError` в `gateway/index.ts` — и превращаются в конверт
   `ApiErrorDto`

Порядок «лимит → auth → роли» зафиксирован тестами: сначала дешёвая проверка, потом работа.

## Форма данных

Схема TypeBox — единственный источник типов фронта: Eden выводит их из `export type App`.
Поэтому наружу уходит ровно то, что описано в схеме.

- **Даты — ISO-строки на всей глубине.** Колонки объявлены через `isoTimestamp`
  (`database/src/schema/timestamp.ts`), сущности уже несут `string`, конвертации на выходе нет.
- **`t.Date()` и `t.Transform` в ответах запрещены**: первый ломает контракт (`type: "Date"`),
  второй делает `static` типом `Date`, а по проводу придёт строка.
- **`t.Unsafe` в схемах ответа запрещён** — ломает рантайм-валидацию TypeBox.
- **`null` в ответе** Elysia отдаёт пустым телом; для nullable нужен явный `Response('null')`.
- **Числа в query**: если в схеме есть `t.Ref`, Elysia перестаёт приводить строки к числу —
  для этого есть `coerceQueryNumbers` (`gateway/query.ts`).

## Аутентификация и роли

- JWT в httpOnly cookie `token`, подпись — `modules/auth/auth.service.ts`, проверка —
  `gateway/jwt-authenticator.ts`
- Провайдеры: Twitch (OAuth), Kick (OAuth + PKCE), Telegram (OpenID Connect + PKCE, cookie
  `tg_oidc_*`). Роуты — `gateway/auth-oauth.ts`, сессия — `gateway/auth-session.ts`
- Роли: `ADMIN`, `USER_ROLES` (обычный пользователь + админ), `RATER_ROLES`. Глобального
  guard'а нет — каждый роут вызывает `requireRole` явно
- Публичные роуты не вызывают `requireUser`, но могут звать `resolveUser` ради персонализации
  (например, `GET /records` отдаёт оценки зрителя, если он залогинен)

## Ошибки

Все ошибки — один конверт:

```json
{ "statusCode": 404, "message": "Not Found", "error": "Not Found" }
```

- Домен бросает `ApiError` из `gateway/errors.ts`; Nest-исключений в проекте нет
- `standardErrors()` — для защищённых роутов (400/401/403/404/409/429/500),
  `publicErrors()` — без 401/403
- Неизвестный путь под `/api` отдаёт JSON, а не SPA-фолбэк

## WebSocket

- Нативный WS на Bun, путь `/ws` (`gateway/ws.ts`), одна комната, Socket.IO нет
- Сервисы эмитят доменные события в `DomainEvents`; `bridgeWsEvents` подписывается на них и
  рассылает кадры `{ event, payload }` всем клиентам
- Клиент ничего не отправляет на сервер; после реконнекта фронт догоняет состояние
  (`websocket-resync`), а не полагается на пропущенные кадры
- Список событий и payload'ов — в `contract/src/ws.ts` (см. [api.md](api.md#websocket))

## Контракт с фронтом

- `backend/src/gateway/index.ts` экспортирует `export type App`; фронт берёт его через
  `import type { App } from '@backend/gateway'` — в бандл ничего не попадает
- `frontend/src/lib/api.ts` — `treaty<App>()`; `unwrap()` / `assertOk()` достают данные или
  бросают `Response` с телом ошибки
- Имена доменных типов для фронта — `backend/src/api-types.ts` (ручные алиасы, не кодоген)
- Enum'ы и WS-события — `@gmdb/contract`, общий пакет для бэкенда и фронта

## Данные

- Postgres 17, Drizzle ORM, схема в `database/src/schema/`, SQL-миграции в `database/migrations/`
- Миграции генерируются только `bun db:generate`; CI падает на drift
- В проде миграции применяет one-shot сервис `migrations` до старта `application`
- Enum'ы — `pgEnum`; в бэкенде они реэкспортируются из `@gmd/database` через `backend/src/enums/`

## Тесты по слоям

| Что                                     | Где                              | Чем поднимается                    |
| --------------------------------------- | -------------------------------- | ---------------------------------- |
| Гейтвей: коды, конверты, лимиты, gard'ы | `backend/src/gateway/__tests__/` | `bun test`, моки                   |
| Домен и утилиты                         | `backend/src/**/__tests__/`      | `bun test`                         |
| Репозитории на реальном Postgres        | `backend/src/__integration__/`   | `RUN_DB_TESTS=1`, БД `lists_test`  |
| Фронт                                   | `frontend/src/**/*.spec.ts`      | `bun --filter=./frontend run test` |
| Пользовательские сценарии               | `frontend/e2e/`                  | Playwright, свои порты 3100/5273   |
| Скрипты                                 | `scripts/__tests__/`             | `bun run test:scripts`             |

## Прод

- Один образ: собранный фронт + бэкенд (`Dockerfile`, стадии `deps → runtime-deps →
  frontend-builder → runtime`), `CMD bun run --cwd backend start`
- Compose: `postgres`, `rustfs`, `redis`, `migrations` (one-shot), `dbx`, `logs` (Dozzle),
  `application`; внешняя сеть `traefik-public`
- Секреты рендерит `scripts/render-env.sh` из Doppler или Infisical; руками `.env` не правится
- Деплой: GHCR-образы по SHA, на сервере ничего не собирается; health-check и авто-откат
  через `scripts/rollback.sh`

## Как добавить домен

1. `backend/src/modules/<домен>/` — сервис (обычный класс, зависимости в конструктор) и
   репозиторий через `DrizzleService`
2. `backend/src/gateway/<домен>.ts` — интерфейс порта, TypeBox-модели, `publicErrors()` /
   `standardErrors()`, роуты с лимитом и gard'ами
3. `backend/src/server/wiring/<группа>.ts` — реализация порта: query/body → аргументы сервиса,
   сущность → DTO
4. `backend/src/server/container.ts` — создать сервис, добавить в `started`/`stoppable` при
   наличии хуков, развернуть порт в `deps`
5. `backend/src/gateway/index.ts` — `.use(<домен>Routes(deps))`
6. Если нужен realtime — эмитить событие в `DomainEvents` и добавить его в `contract/src/ws.ts`
7. Тесты: юнит на сервис и роуты, при работе с БД — интеграционный спек
8. Если поменялся контракт, env или команды — обновить `README.md` и [api.md](api.md)
