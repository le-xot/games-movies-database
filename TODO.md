# TODO — что можно сделать дальше

Собрано 2026-09-29 после трёх фаз: строгие типы backend/database → типы фронтенда → интеграционные тесты репозиториев.
Формат: `[ ]` пункт — `[S/M/L]` объём; в скобках — файлы/контекст, откуда пришло.

## Состояние на текущий момент

- Backend/database: `strict` (database), `noImplicitAny`, `noUnused*`, `strictNullChecks` включены; домены выводятся из схемы (`SelectRow`/`InsertRow`); Swagger-ответы типизированы, `ApiErrorDto`; Socket.IO-контракт типизирован; миграции drift-free.
- Frontend: фабрики params/records типизированы route-типами; socket-контракт зеркалится; роуты именованы + `RouteNamedMap`; dialog/badge обобщены; raw fetch по `/api` отсутствует.
- Тесты: 419 unit (backend) + 39 integration (5 репозиториев + smoke + guard на реальном Postgres `lists_test`); CI гоняет unit + integration (postgres service).

## 1. Строгая типизация backend

- [ ] **`strictPropertyInitialization` [M]** — 137 DTO/entity-полей без `!`/инициализаторов. Включить после фикса полей, затем можно рассмотреть umbrella `"strict": true`. (`backend/tsconfig.json`, `backend/src/modules/**/*.dto.ts|*.entity.ts`)
- [ ] **`exactOptionalPropertyTypes` [M]** — включать после предыдущего; проверить патч-DTO (`RecordUpdateDTO`) и `Object.fromEntries`-фильтры в репозиториях.
- [ ] **Почистить `ApiErrors()` на эндпоинтах, которые не могут падать [S]** — img/avatar/health получают 7 error-схем; на фронте `E` шире, чем нужно. (`backend/src/utils/api-errors.ts`, контроллеры)
- [ ] **`mockOf<T>` helper для тестов [S]** — ~76 `as any` в спеках; типизировать моки без `as unknown as`. (`backend/src/__tests__/helpers/`)
- [ ] **Runtime-валидация внешних JSON [M]** — `records-providers`/`steam`/`weather` кастуют `response.json()`; zod/valibot-схемы на границе. (`backend/src/modules/{records-providers,steam,weather}`)
- [ ] **`suggesttion.dto.ts` typo** — не переименовывать без полного рефактора импортов (см. AGENTS.md), отметить как техдолг.

## 2. Фронтенд

- [ ] **Unit-раннер (Vitest/bun test для .ts) [M]** — покрыть `createEventCoalescer`, `parseApiError`, `query-keys`, `useBadgeCol`, `createParamsStore` (без DOM). Сейчас проверка только typecheck + e2e-смоук.
- [ ] **Убрать `as unknown as RecordsStoreReturn` [M]** — если появится typed-паттерн для setup-store с generic-ключами (или хелпер, разворачивающий refs). (`frontend/src/composables/factories/create-records-store.ts`)
- [ ] **`ComponentProps` вместо локального `ComponentPropsOf` [XS]** — когда выйдет Vue 3.6. (`frontend/src/components/dialog/composables/use-dialog.ts`)
- [ ] **E2E Playwright [L]** — логин-редиректы (twitch/kick/telegram), CRUD записи из админки, wordle-игра, диалоги, аккаунт-модалка.
- [ ] **Обработка ошибок генератора `api.ts` [S]** — `generateSwagger` молча выходит после 10 ретраев; логировать/фейлить. (`frontend/vite.config.ts`)
- [ ] **CI drift-check `api.ts` [M]** — поднять backend с БД в CI, регенерировать и `git diff --exit-code` (ловит устаревший клиент при мерже).
- [ ] **Убрать `// @ts-nocheck` из `api.ts` пост-шагом [S]** — файл чисто проходит `tsc --strict`; пост-процесс в `generateSwagger` заставит регрессии генератора падать в typecheck.
- [ ] **Синхронизация socket-контракта [M]** — либо общий `packages/contracts` (WsEvents + payload-типы), либо CI-скрипт, сравнивающий `frontend/src/types/socket-events.ts` с `backend/src/modules/websocket/websocket.events.ts` (сейчас только внутренние assertions).
- [ ] **Типизированные params роутов [L]** — `vue-router/unplugin` или ручной `RouteNamedMap` с параметрами, если появятся параметрические маршруты.
- [ ] **Store IDs [XS]** — `globals/...` vs `global/...` привести к одному стилю. (`frontend/src/stores/`)
- [ ] **`use-weather` кэш [S]** — module-level `cached` не инвалидируется; добавить refresh/ttl. (`frontend/src/pages/home/composables/use-weather.ts`)
- [ ] **Dialog `props`-путь [XS]** — нет ни одного call-site с `component` + `props`; добавить пример или упростить тип.

## 3. Интеграционные тесты (Postgres)

- [ ] **`DrizzleRecordsProvidersRepository` [S]** — `findRecordByLinkAndGenre`, `findSuggestionRulesByGenre`. (`backend/src/modules/records-providers/repositories/`)
- [ ] **`DrizzleStatsRepository` [S]** — агрегаты genre/status/grade на реальных строках. (`backend/src/modules/stats/repositories/`)
- [ ] **Атомарность `mergeUsers` [M]** — падение в середине транзакции → полный откат (невалидные данные/конфликт FK) — сейчас проверен только happy-path + counters.
- [ ] **`setupIntegrationSuite(name, fn)` helper [S]** — вынести 6 копий boilerplate (pool/db/truncate/afterAll) при следующем (7-м) spec-файле.
- [ ] **Скрипт пересоздания `lists_test` [S]** — `DROP DATABASE` + setup-db при структурном рассинхроне схемы (сейчас вручную).
- [ ] **Тесты транзакционных репозиториев на конкурентность [M]** — `createGame` onConflict, `upsert` notification при параллельных вставках.

## 4. CI / инфраструктура

- [ ] **Секция Testing в README [S]** — `RUN_DB_TESTS=1 bun --filter=./backend run test:integration`, правило `*_test`, порт 5432 (у `DATASOURCE_URL` в `.env.example` устаревший 6543).
- [ ] **`database/src/migrate.ts` [XS]** — переиспользовать `runMigrations` из `database/src/lib/migrations.ts` (сейчас дублирует вызов).
- [ ] **Линт-правила [S]** — включить `typescript/no-explicit-any` как `warn` (кроме тестов и `lib/api.ts`); проверить, что новые `any` не проходят ревью.
- [ ] **CI cache postgres-данных [XS]** — не нужен, но можно кэшировать `bun install` (уже есть) и vue-tsc state (уже есть).

## 5. Мелкие хвосты (deferred minors)

- [ ] Suggestion `DELETE` — Swagger 204, фактически 200; привести доки к реальности. (`backend/src/modules/suggestion/suggestion.controller.ts`)
- [ ] Binary-ответы `img`/`avatar` в generated-клиенте — типизировать через blob-параметр (`RequestParams.format`), если понадобится.
- [ ] `queue`-модуль без таблицы — проверить, не нужен ли ему интеграционный тест (сейчас очередь виртуальная).
- [ ] `frontend/src/pages/media/MediaCard.vue` — оставшиеся касты `status as RecordStatus` после `as const`-улучшений можно убрать (нужен узкий guard).

## Идеи на подумать

- Общий `packages/contracts` (WsEvents, enum-ы, DTO-типы) — уберёт зеркала и codegen-зависимость фронта от Swagger.
- `drizzle-zod` для валидации входов от внешних API и для Swagger-DTO из схемы.
- Единый type-level контракт-тест «backend ↔ generated client» в CI (сравнение схем docs-json с ожидаемыми `$ref`).
- Дашборд покрытия: `bun test --coverage` для backend unit + integration.
