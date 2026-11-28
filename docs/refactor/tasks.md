# Пул задач

Статусы: `todo` → `doing` → `review` → `done`; `blocked` — ждёт решения владельца;
`dropped` — отвергнута (причина обязательна). Evidence — в `maps/`, правила — в `README.md`.

## Сделано

| ID   | Что сделано                                                                                           | Commit               | Ревью                       |
| ---- | ----------------------------------------------------------------------------------------------------- | -------------------- | --------------------------- |
| B-01 | Мёртвый токен `--n-action-color`, 7 баррелей, `BadgeSelect`; `wordleModels_`                          | `dc2c1a0`            | CHANGES → docs-фикс         |
| B-02 | Мёртвое Nest-наследие (10 файлов, 151 строка), `api-types` 47→21                                      | `129d6e0`, `b0537cf` | CHANGES → алиас-фикс        |
| B-03 | Один каскад удаления записи (фикс латентного 500 на оценённом предложении) + интеграционные тесты     | `409ff26`            | APPROVE                     |
| B-04 | Единая модель ошибок: `HttpError`-подклассы, удалён мост `fromDomainError`; 500→409 bugfix            | `76d3fec`, `9042286` | CHANGES → тесты, затем ok   |
| B-05 | `requireAuthenticated` и `rateLimitGuard`; 72 роута под одним способом; ключи из `ctx.route`          | `604f866`, `b07e249` | CHANGES → ловушка `b77235c` |
| B-06 | Enum SSOT: `enumUnion` из `@gmdb/contract` (17 схем) + инвариант contract ↔ pgEnum                    | `91d68c2`            | APPROVE                     |
| B-09 | Lifecycle-реестр вместо `started`/`stoppable`; ping БД, `pool.end`, таймер погоды                     | `108ebfa`, `f793bac` | CHANGES → docs-фикс         |
| B-10 | `Logger` с уровнями + `LOG_LEVEL`; `console`/`process.env` под машинным запретом                      | `4471595`            | review                      |
| B-11 | `api-types` сужен; `secretsMatch` — один timing-safe компаратор; граница gateway↔modules под тестом   | `129d6e0`, `1757fb7` | review                      |
| B-16 | Мёртвые `recordEnumModels` в users/twir убраны                                                        | `91d68c2`            | APPROVE                     |
| F-01 | `useRecordsList` + `useRecordMutations`: жанры и «Мои оценки» на одной механике                       | `5346375`            | review                      |
| F-02 | `ErrorRetry` + `parseApiError` — один путь ошибки на фронте                                           | `41ae5e6`, `df972f6` | CHANGES → фикс импортов     |
| G-01 | Ловушка «нет .ts без импортёров»                                                                      | `90c6c6c`            | —                           |
| G-02 | oxlint `no-console`; тест «`process.env` только в enviroments»; тест «gateway не импортирует сервисы» | `4471595`, `1757fb7` | review                      |

| F-03 | Реестр жанров: маршруты, меню, префетч, WS, статистика, советы из `lib/genre-registry.ts` | `a40fbfa`, `71521c0` | CHANGES → фикс B1 |
| F-04 | Словарь статусов/оценок: имена, цвета, классы и порядки в `lib/record-vocabulary.ts` | `0ded33d`, `0291448` | CHANGES → фикс B1 |
| F-05 | Заголовок документа из `route.meta.title` через `router.afterEach` | `5d999c7` | review (batches 14) |
| F-07 | Все ключи localStorage/sessionStorage в `lib/storage-keys.ts` + скан-ловушка | `934ffc5` | APPROVE |
| B-13 | `RatingService` без прямого SQL: запросы в `DrizzleRatingRepository` + инвариант «сервисы без БД» | `13148e3` | APPROVE |
| G-06 | E2E baseline: **44/44** при полной инфре (postgres + redis); wordle-практика без Redis падает — это не баг продукта | — | `bun infra:start` |

| B-12 | Class-DTO модулей удалены: доменные типы в `entities/`, гейтвей без дублей портов, `modules/*.dto.ts` нет; ловушка в architecture.spec | `6486c0f`…`223c17b` | APPROVE (19–21), ниты закрыты |

| F-08 | Router SSOT: `ROUTE_TABLE` → `RouteNamedMap` + маршруты; фабрика `createAppRouter`, `router.spec.ts` | `4e37e88`, `f0661b7` | APPROVE (25) |
| F-09 | Модалки, единое ожидание /me, погода на colada, диалог советов из страницы | `97c5ebc`, `436d132`, `1f4bfc3` | APPROVE (24, 28) |
| F-12 | Один скелетон карточки, константы DataCards, `suppressEmptyState` | `48356cf` | review |

## В пуле

### Backend

| ID   | Задача                                                                                                | Prio | Заметки                                                                      |
| ---- | ----------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| B-12 | Свести class-DTO модулей (`*.dto.ts`, `*.entity.ts` Nest-эпохи) к доменным типам `entities/*`         | P4   | По домену, отдельными батчами; ловушка — type-level совпадение с TypeBox.    |
| B-13 | `RatingService` без прямого SQL: `recordExists`/`findUserBrief` в `DrizzleRatingRepository`           | P3   | Единственный сервис с `DrizzleService`; lint «schema только в repositories». |
| B-14 | `webhookSecretsMatch`→`secretsMatch` сделано; осталось: `isValidWebhookSecret`-дублей нет — проверить | P5   | —                                                                            |

### Frontend

| ID   | Задача                                                                                              | Prio | Заметки                                                                    |
| ---- | --------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| F-03 | `genre-registry.ts`: `RecordGenre` → path/label/icon/meta/prefetch/WS; маршруты и навигация из него | P2   | Новый жанр сейчас = 11 правок; после F-01 и enum-батча поле стало ровнее.  |
| F-04 | Доменный словарь status/grade (лейбл+emoji+цвет+порядок) — один источник для бейджей и графиков     | P3   | Палитра в двух местах, порядок в трёх; `NOTINTERESTED` в статистике скрыт. |
| F-05 | Заголовок документа из `route.meta.title` + `afterEach`                                             | P3   | Сейчас семь мест ставят title; back/forward даёт устаревший.               |
| F-06 | WS: `QUERY_GROUPS: Record<CoalescerKey, …>` как источник union и ресинка                            | P3   | Незарегистрированный жанр — тихий no-op.                                   |
| F-07 | `lib/storage-keys.ts`: константы ключей; `KEYS_TO_CLEAR` ⊆ ключей                                   | P3   | Три механизма хранилища, ключи литералами.                                 |
| F-08 | Router SSOT: массив `ROUTES` → `ROUTER_PATHS` + `RouteNamedMap`; права из `route.meta`              | P4   | Четыре копии пути/имени; нужен e2e deep-link.                              |
| F-09 | Мелочи: диалоги через `createDialogState`; guard использует `whenQuerySettled`; погода на colada    | P5   | —                                                                          |
| F-10 | Разрезать god-компоненты `MediaCard` (326) и `SuggestionCard` (440) + `use-suggestion`              | P4   | Нужна визуальная проверка; самый большой риск регрессий.                   |

### Защита (enforceable architecture)

| ID   | Задача                                                                                                | Prio   | Заметки                                                   |
| ---- | ----------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| G-03 | Тип-тесты полноты `Record<RecordGenre                                                                 | Status | Grade, …>`-словарей (фронт) и contract ↔ TypeBox          | P3  | Часть уже есть (enum-sources.spec); фронт ждёт F-03/F-04. |
| G-04 | Синхронизировать карты рекона с кодом после батчей (backend.md B-01/B-05, frontend.md F-4 без токена) | P2     | Карты — снимки; обновляем при закрытии связанных задач.   |
| G-05 | Прогнать e2e (Playwright) на собранном стеке и зафиксировать baseline                                 | P3     | Не запускались ни разу в кампании; нужен отдельный стенд. |

| B-08 | ~~Судьба `wiring/`~~ — решено ADR-0007: порт = граница, wiring = адаптер и presentation-конверсии; дата очереди вынесена из домена | `7496e76` | APPROVE (16–17) |

## Открытые вопросы к владельцу

1. **Латентный баг исправлен** (B-03): удаление предложения с оценкой теперь работает. Если это
   меняет ожидаемое продуктовое поведение — откатить каскад.
2. **`NOTINTERESTED` скрыт из статистики** (`STATUS_ORDER` не содержит статус при полном
   `STATUS_COLORS`). Намеренно или забыли? До ответа поведение сохранено.
3. **B-08 (wiring):** оставляем порты с явным `toDto` или удаляем `server/wiring/` и типизируем
   гейтвей доменными типами? Решение — отдельный ADR.
4. **Пресеты лимитов на мутациях Wordle** (B-17): `PATCH/DELETE` уведомлений используют `public`,
   остальные мутации — `write`. Меняем на `write` (поведение лимитов изменится) или оставляем?

## Не делать

- `server/page-meta.ts` не «оптимизировать» в общий роутер — дублирование путей осознанное.
- `components/ui/**` не патчить под приложение — только обёртки и варианты.
- `utils/enviroments.ts` и `suggesttion.dto.ts` не переименовывать «по букве» (первый жив,
  второй удалён) — имена закреплены в AGENTS.md.
- `websocket-resync.ts`/`use-event-coalescer.ts` — менять только вместе со спеками; WS-протокол
  неизменен.
