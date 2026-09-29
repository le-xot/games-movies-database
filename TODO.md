# TODO — что можно сделать дальше

Обновлено 2026-09-30. Основной бэклог строгих типов и тестов выполнен; ниже — что осталось и почему.

## Сделано (2026-09-29 → 2026-09-30)

- Backend/database: `strict`, `noImplicitAny`, `noUnused*`, `strictNullChecks`, `strictPropertyInitialization`, `exactOptionalPropertyTypes`; домены из схемы (`SelectRow`/`InsertRow`); Swagger-ответы типизированы; `ApiErrors({ includeAuth: false })` на публичных контроллерах; runtime-валидация Shikimori/Steam/Weather; Socket.IO-контракт типизирован.
- Frontend: route-типы в фабриках; зеркало socket-контракта + CI-проверка; именованные роуты + `RouteNamedMap`; обобщённые dialog/badge; `parseApiError(unknown)`; raw fetch убран; генератор `api.ts` вынесен в скрипт (логирование, снятие `@ts-nocheck`, CI drift-check); unit-тесты (`bun test src`); store IDs, TTL кэша погоды.
- Тесты: 427 unit (backend) + 8 unit (frontend) + 48 integration (9 групп репозиториев + atomicity/конкурентность + smoke + guard); CI: lint, format, typecheck, unit backend/frontend, integration (postgres service), socket contract, api.ts drift.

## Осталось

- [x] **E2E Playwright [L]** — реализовано: 18 тестов (smoke, guest/home/navigation, auth-редиректы, wordle guest+admin, admin user delete, record update+delete, account dialog, logout) на изолированных портах 3100/5273 против `lists_test`; seed-скрипт с JWT-сессией; запуск локальный (`bun run test:e2e`), в CI намеренно не добавлен. План: `docs/superpowers/plans/2026-09-30-e2e-playwright.md`. Попутно нашлись и исправлены реальные баги: отсутствие `href` у внутренних карточек главной (`HomePage.vue`) и WS-handshake на нестандартном origin (CORS в E2E-конфиге).
- [ ] **Миграция тестовых `as any` на `mockOf<T>` [M]** — 82 вхождения в `backend/src/**/__tests__` (`as any` у моков, `as unknown as` у двойников). Тесты исключены из `no-explicit-any`, риска нет; чистое улучшение читаемости. Помогает helper `mockOf<T>(partial: Partial<T>): T` (пока не добавлен — добавить вместе с миграцией).
- [x] **Kinopoisk/IGDB runtime-валидация [M]** — type guards в `records-providers.service.ts` + общий `isRecord` (`backend/src/utils/type-guards.ts`); malformed-ответы Kinopoisk/Shikimori/IGDB дают явные `BadRequestException`, 6 новых тестов.
- [ ] **`as unknown as RecordsStoreReturn` в фабрике [M]** — нужно либо расширение типов Pinia для setup-стор с generic-ключами, либо официальный хелпер; сейчас один документированный каст на границе (ограничение TS, не лень). (`frontend/src/composables/factories/create-records-store.ts`)
- [ ] **`ComponentProps` вместо локального `ComponentPropsOf` [XS]** — заблокировано до Vue 3.6 (в 3.5.42 хелпер не экспортируется).
- [ ] **Binary-ответы `img`/`avatar` в generated-клиенте [S]** — если понадобится fetch через клиент, типизировать через `RequestParams.format='blob'`; сейчас фронт использует URL-ы.
- [ ] **Типизированные params роутов [L]** — не нужно, пока нет маршрутов с параметрами; включить `vue-router/unplugin`/`RouteNamedMap` с params при появлении.
- [ ] **`suggesttion.dto.ts` typo** — не переименовывать без полного рефактора импортов (см. AGENTS.md); оставлено как техдолг.
- [ ] **Дашборд покрытия [S]** — `bun test --coverage` для backend unit + integration, при желании — артефакт в CI.

## Идеи (необязательное)

- `packages/contracts` (WsEvents, enum-ы, DTO) — частично закрыто CI-проверкой зеркала; вернуться, если контрактов станет больше.
- `drizzle-zod` — ручная валидация границ уже покрывает текущие потребности; рассмотреть при расширении внешних API.
- Единый type-level контракт-тест «backend ↔ generated client» — базово покрыт `swagger-contract.spec.ts`; расширять по мере роста API.
