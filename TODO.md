# TODO — что можно сделать дальше

Обновлено 2026-10-26. Стек: Elysia + Eden Treaty, нативный WebSocket на Bun. Nest, Socket.IO,
Swagger и сгенерированный клиент выпилены — пункты, которые на них ссылались, закрыты.

## Сделано

- Строгие типы: backend/database (`strict`, `noUnused*`, `exactOptionalPropertyTypes`),
  доменные типы из схемы Drizzle (`SelectRow`/`InsertRow`), `vue-tsc` на фронте, route-типы
  и `RouteNamedMap` в `frontend/src/types/vue-router.d.ts`.
- Runtime-валидация ответов внешних API (Кинопоиск, Shikimori, IGDB, Steam, погода) —
  type guards в `records-providers.service.ts` и `utils/type-guards.ts`; malformed → 400.
- Контракт: `@gmdb/contract` — enum'ы, карта WS-событий, `parseWsMessage`; типы фронта
  выводятся из `App` (Eden), кодогена и зеркал нет.
- Тесты: 67 unit-спеков backend, 17 unit-спеков frontend, 11 интеграционных спеков на
  реальном Postgres (`lists_test`, guard по суффиксу, `TRUNCATE ... RESTART IDENTITY CASCADE`),
  56 Playwright-тестов в 9 файлах (`frontend/e2e/`, изолированные порты 3100/5273).
- CI: drift миграций, lint, format, typecheck, unit/integration, сборка и smoke обоих образов.

## Осталось

- [ ] **Миграция тестовых `as any` на `mockOf<T>` [M]** — 74 вхождения в
      `backend/src/**/__tests__` (`as any` у моков, `as unknown as` у двойников). Тесты
      исключены из `no-explicit-any`, риска нет; чистое улучшение читаемости. Поможет хелпер
      `mockOf<T>(partial: Partial<T>): T` (пока не добавлен — добавить вместе с миграцией).
- [ ] **`as unknown as RecordsStoreReturn` в фабрике [M]** — один документированный каст на
      границе (`frontend/src/composables/factories/create-records-store.ts`). Нужно либо
      расширение типов Pinia для setup-стор с generic-ключами, либо официальный хелпер;
      сейчас это ограничение TS, а не лень.
- [ ] **Входящий Telegram-webhook [M]** — регрессия после переезда на Elysia:
      `TelegramBotService.setWebhook()` вызывается на `TELEGRAM_BOT_WEBHOOK_URL`, но роута,
      принимающего `/api/telegram/webhook`, в `backend/src/gateway/` нет. Из-за этого привязка
      чата через `/start` не завершается, а уведомления уходят только тем, у кого подписка уже
      есть в БД. Подписки, планировщик и UI (`AccountNotifications.vue`) на месте.
- [ ] **Дашборд покрытия [S]** — `bun test --coverage` для backend unit + integration,
      при желании — артефакт в CI.
- [ ] **`suggesttion.dto.ts` typo** — не переименовывать без полного рефактора импортов
      (см. `AGENTS.md`); оставлено как техдолг.
- [ ] **Типизированные params роутов [L]** — не нужно, пока нет маршрутов с параметрами;
      включить `vue-router/unplugin`/`RouteNamedMap` с params при появлении.

## Идеи (необязательное)

- `drizzle-zod` — ручная валидация границ уже покрывает текущие потребности; рассмотреть при
  расширении внешних API.
- Единый type-level контракт-тест «backend ↔ фронт» — сейчас расхождение ловится
  типизацией Eden при сборке фронта, отдельного теста нет.
- API-справочник без Swagger — конверт `ApiErrorDto` и список роутов описаны только в
  `backend/src/gateway/*.ts`; если появится внешний потребитель, понадобится `docs/api.md`.
