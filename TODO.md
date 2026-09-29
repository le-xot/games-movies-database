# TODO — что можно сделать дальше

Собрано 2026-09-29 после трёх фаз: строгие типы backend/database → типы фронтенда → интеграционные тесты репозиториев.
Формат: `[ ]` пункт — `[S/M/L]` объём; `[x]` — сделано (с пометкой даты/коммита).

## Состояние на текущий момент

- Backend/database: `strict` (database), `noImplicitAny`, `noUnused*`, `strictNullChecks` включены; домены выводятся из схемы (`SelectRow`/`InsertRow`); Swagger-ответы типизированы, `ApiErrorDto`; Socket.IO-контракт типизирован; миграции drift-free.
- Frontend: фабрики params/records типизированы route-типами; socket-контракт зеркалится; роуты именованы + `RouteNamedMap`; dialog/badge обобщены; raw fetch по `/api` отсутствует.
- Тесты: 426 unit (backend) + 44 integration (7 групп репозиториев + smoke + guard на реальном Postgres `lists_test`); CI гоняет unit + integration (postgres service).
- 2026-09-30: wordle стал публичным (leaderboard без auth, guest-плейсхолдер); providers получили тест-seam'ы для Twitch/IGDB; включён `no-explicit-any`; публичный leaderboard больше не рекламирует 401/403; появился `setupIntegrationSuite`.

## 1. Строгая типизация backend

- [ ] **`strictPropertyInitialization` [M]** — 137 DTO/entity-полей без `!`/инициализаторов. Включить после фикса полей, затем можно рассмотреть umbrella `"strict": true`. (`backend/tsconfig.json`, `backend/src/modules/**/*.dto.ts|*.entity.ts`)
- [ ] **`exactOptionalPropertyTypes` [M]** — включать после предыдущего; проверить патч-DTO (`RecordUpdateDTO`) и `Object.fromEntries`-фильтры в репозиториях.
- [ ] **Почистить `ApiErrors()` на эндпоинтах, которые не могут падать [S]** — паттерн появился (`ApiErrors({ includeAuth: false })`, применён к leaderboard); применить к `img`/`avatar`/`health`, которые получают 7 error-схем. (`backend/src/utils/api-errors.ts`, контроллеры)
- [ ] **`mockOf<T>` helper для тестов [S]** — ~76 `as any` в спеках; типизировать моки без `as unknown as`. (`backend/src/__tests__/helpers/`)
- [ ] **Runtime-валидация внешних JSON [M]** — Shikimori уже типизирован интерфейсом `ShikimoriAnime` (2026-09-30), Kinopoisk — generic; остались `steam`/`weather` с `response.json()`-кастами — zod/valibot на границе. (`backend/src/modules/{steam,weather}`)
- [x] **Аудит скрытых `.env`-зависимостей unit-тестов [S]** — 2026-09-30: `cp .env.example .env && bun test` → 426 pass; IGDB-фикс закрыл единственный класс.
- [ ] **`suggesttion.dto.ts` typo** — не переименовывать без полного рефактора импортов (см. AGENTS.md), отметить как техдолг.

## 2. Фронтенд

- [ ] **Unit-раннер (Vitest/bun test для .ts) [M]** — покрыть `createEventCoalescer`, `parseApiError`, `query-keys`, `useBadgeCol`, `createParamsStore` (без DOM). Сейчас проверка только typecheck + e2e-смоук.
- [ ] **Убрать `as unknown as RecordsStoreReturn` [M]** — если появится typed-паттерн для setup-store с generic-ключами (или хелпер, разворачивающий refs). (`frontend/src/composables/factories/create-records-store.ts`)
- [ ] **`ComponentProps` вместо локального `ComponentPropsOf` [XS]** — когда выйдет Vue 3.6. (`frontend/src/components/dialog/composables/use-dialog.ts`)
- [ ] **E2E Playwright [L]** — логин-редиректы (twitch/kick/telegram), CRUD записи из админки, wordle-игра, гостевой wordle-флоу (публичный leaderboard + плейсхолдер), диалоги, аккаунт-модалка.
- [ ] **Обработка ошибок генератора `api.ts` [S]** — `generateSwagger` молча выходит после 10 ретраев; логировать/фейлить. (`frontend/vite.config.ts`)
- [ ] **CI drift-check `api.ts` [M]** — поднять backend с БД в CI, регенерировать и `git diff --exit-code` (ловит устаревший клиент при мерже).
- [ ] **Убрать `// @ts-nocheck` из `api.ts` пост-шагом [S]** — файл чисто проходит `tsc --strict`; пост-процесс в `generateSwagger` заставит регрессии генератора падать в typecheck.
- [ ] **Синхронизация socket-контракта [M]** — либо общий `packages/contracts` (WsEvents + payload-типы), либо CI-скрипт, сравнивающий `frontend/src/types/socket-events.ts` с `backend/src/modules/websocket/websocket.events.ts` (сейчас только внутренние assertions).
- [ ] **Типизированные params роутов [L]** — `vue-router/unplugin` или ручной `RouteNamedMap` с параметрами, если появятся параметрические маршруты.
- [ ] **Store IDs [XS]** — `globals/...` vs `global/...` привести к одному стилю. (`frontend/src/stores/`)
- [x] **Мёртвый `requiresAuth` [XS]** — 2026-09-30: удалён из `RouteMeta`, guard'а и `RouteItem` (коммит 5b70bba).
- [ ] **`use-weather` кэш [S]** — module-level `cached` не инвалидируется; добавить refresh/ttl. (`frontend/src/pages/home/composables/use-weather.ts`)
- [ ] **Dialog `props`-путь [XS]** — нет ни одного call-site с `component` + `props`; добавить пример или упростить тип.

## 3. Интеграционные тесты (Postgres)

- [x] **`DrizzleRecordsProvidersRepository` [S]** — 2026-09-30: link+genre и suggestion rules (коммит d6d7a26).
- [x] **`DrizzleStatsRepository` [S]** — 2026-09-30: scope (type/status), group by genre/status/grade (коммит d6d7a26).
- [ ] **Атомарность `mergeUsers` [M]** — падение в середине транзакции → полный откат (невалидные данные/конфликт FK) — сейчас проверен только happy-path + counters.
- [x] **`setupIntegrationSuite(name, fn)` helper [S]** — 2026-09-30: `helpers/suite.ts`, 7 suite'ов используют его (коммит d6d7a26).
- [ ] **Скрипт пересоздания `lists_test` [S]** — `DROP DATABASE` + setup-db при структурном рассинхроне схемы (сейчас вручную).
- [ ] **Тесты транзакционных репозиториев на конкурентность [M]** — `createGame` onConflict, `upsert` notification при параллельных вставках.

## 4. CI / инфраструктура

- [ ] **Секция Testing в README [S]** — `RUN_DB_TESTS=1 bun --filter=./backend run test:integration`, правило `*_test`, порт 5432 (у `DATASOURCE_URL` в `.env.example` устаревший 6543).
- [x] **`database/src/migrate.ts` [XS]** — 2026-09-30: переиспользует `runMigrations` (коммит 6d5e4ec).
- [x] **Линт-правила [S]** — 2026-09-30: `typescript/no-explicit-any: warn` (тесты и `lib/api.ts` в ignore); исправлены Shikimori-каст и `ComponentPropsOf` (коммит 6d5e4ec).
- [ ] **CI cache postgres-данных [XS]** — не нужен, но можно кэшировать `bun install` (уже есть) и vue-tsc state (уже есть).

## 5. Мелкие хвосты (deferred minors)

- [x] Suggestion `DELETE` — 2026-09-30: доки приведены к факту (200) (коммит 6d5e4ec).
- [x] Публичный wordle-leaderboard — 2026-09-30: `@ApiErrors({ includeAuth: false })` на leaderboard, 401/403 остались только на защищённых роутах (коммит 5c3d062).
- [ ] Binary-ответы `img`/`avatar` в generated-клиенте — типизировать через blob-параметр (`RequestParams.format`), если понадобится.
- [ ] `queue`-модуль без таблицы — проверить, не нужен ли ему интеграционный тест (сейчас очередь виртуальная).
- [x] `frontend/src/pages/media/MediaCard.vue` — 2026-09-30: все три `status as RecordStatus` убраны (коммит 6d5e4ec).

## Идеи на подумать

- Общий `packages/contracts` (WsEvents, enum-ы, DTO-типы) — уберёт зеркала и codegen-зависимость фронта от Swagger.
- `drizzle-zod` для валидации входов от внешних API и для Swagger-DTO из схемы.
- Единый type-level контракт-тест «backend ↔ generated client» в CI (сравнение схем docs-json с ожидаемыми `$ref`).
- Дашборд покрытия: `bun test --coverage` для backend unit + integration.
