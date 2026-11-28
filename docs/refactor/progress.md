# Журнал раундов

Формат записи:

```
## Раунд N — YYYY-MM-DD
- Батчи: <ids> (<commit-ссылки>)
- Изменено: <файлы/модули>
- Удалено: <что и почему>
- Проверки: lint/format/typecheck/unit/integration/e2e
- Ревью: <агент>, вердикт
- Защита от регрессии: <тест/lint/тип>
- Осталось/дальше: <следующие кандидаты>
```

## Раунд 0 — 2026-11-28: рекон

- Ветка `chore/code-cleanup` от `master` @ `e73dcfb`.
- Baseline: typecheck зелёный, format зелёный, lint — 1 warning (`wordle.ts:247`,
  dangling `_`).
- Baseline тестов: backend unit 646 pass / 0 fail (79 файлов, 36k expect), frontend unit
  126 pass / 0 fail (21 файл). Интеграционные (Postgres) и e2e (Playwright) пока не
  поднимались — нужны infra/e2e-стенды.
- PR: [#264](https://github.com/le-xot/games-movies-database/pull/264) (draft, `chore/code-cleanup` → `master`).
- Собраны карты: backend, frontend, contract/data/config, hygiene.
- Пул задач сформирован: см. [tasks.md](tasks.md).

## Раунд 1 — 2026-11-28: рекон + батч 1

- **Рекон** (4 параллельных агента): `maps/backend.md` (17 находок), `maps/frontend.md` (19),
  `maps/contract-data-config.md` (16), `maps/hygiene.md` (сводка). Пул задач собран в `tasks.md`.
- **Батч 1** (`dc2c1a0`): удалён мёртвый CSS-токен `--n-action-color` (20 вхождений / 13 файлов),
  удалены 7 feature-баррелей без потребителей, `BadgeSelect` схлопнут в `BadgePopover`,
  `wordleModels_` → `wordleRouteModels` (baseline-warning oxlint снят).
- **Независимое ревью** (`review-batch1`, свежий контекст, `reviews/batch-01.md`): **CHANGES REQUIRED**
  — один docs-блокер: правило о баррелях в `frontend/src/AGENTS.md` было сформулировано неверно
  (`components/{form,account,palette}` импортируются через баррели). Исправлено follow-up коммитом.
  Код проверен: 0 остатков токена/имён, замена `BadgePopover` точная, build зелёный.
- **Уточнение к коммиту**: `cn()` — это `twMerge`, поэтому `bg-[var(--n-action-color)]` вытеснял
  `bg-card` у `Card`; эквивалентность держится на `--card == --background` в обеих темах и
  dark-only окружении, а не на «Card и так несёт `bg-card`». Формулировка в сообщении коммита неточная,
  исправлена здесь.
- **Проверки батча 1**: `bun lint` 0 warnings, `bun typecheck` зелёный, backend 646 pass / frontend
  126 pass, `frontend` vite build зелёный; в собранном CSS `--n-action-color` отсутствует.
- **Дальше**: батч 2 — удаление мёртвого Nest-наследия (B-02), затем B-04 (ошибки) и guard-тесты.

## Раунд 2 — 2026-11-28: мёртвое Nest-наследие (B-02)

- **Батч 2** (`129d6e0`): удалены 10 файлов Nest-эпохи без импортёров (151 строка),
  `GetImageQueryDTO` и `MergeUsersResultEntity`; `like/entities/like.entity.ts` →
  `like-domain.entity.ts`; `api-types.ts` сужен 47 → 21 имени; удалён неиспользуемый
  `ui/slider`; AGENTS.md/TODO.md/modules AGENTS.md синхронизированы.
- **Ревью** (`review-batch2`, `reviews/batch-02.md`): **CHANGES REQUIRED** — один алиас
  `UserCustomizationEntity` остался в `api-types.ts` (47→22 вместо 21). Исправлено
  follow-up коммитом; счётчики сходятся.
- **Проверки**: lint 0/0, typecheck зелёный, backend 646 / frontend 126 pass,
  frontend build зелёный.
- **Дальше**: батч 3 — enum SSOT (TypeBox из `@gmdb/contract` + инвариант-тест contract ↔ pgEnum).

## Раунд 3 — enum SSOT (`91d68c2`, ревью `reviews/batch-03.md`: APPROVE)

- TypeBox-модели 13 enum'ов и inline-схемы (platform, variant, orderBy, direction) собираются
  из `@gmdb/contract` через `enumUnion`; ролевые константы — `UserRole.*`.
- Инвариант `enum-sources.spec.ts` (TypeBox ↔ contract ↔ pgEnum); мутационно проверен ревьюером.
- Урок: `t.Union` нужен **tuple**, массив ломает вывод типов Elysia (ADR-0004).

## Раунд 4 — единая модель ошибок (`76d3fec` + ловушки `9042286`)

- Удалены `ApiError`, `fromDomainError` (duck-typing) и Nest-обёртка `HttpException/HttpStatus`;
  подклассы переименованы в `*Error`, добавлены `TooManyRequestsError`/`BadGatewayError`.
- Осознанный bugfix: уже привязанный аккаунт — 409 вместо 500 (ADR-0001).
- Ревью: CHANGES REQUIRED по тестовой защите → `on-error.spec.ts` (8 классов через реальный роут),
  таблица дефолтов, регресс 409. После фикса — APPROVE.

## Раунд 5 — auth и лимиты (`604f866`, `b07e249`, `a6837fa` + ловушка `b77235c`)

- `requireAuthenticated(auth, request, roles?)` заменил 21 склейку guard-цепочек и 10 голых вызовов.
- `rateLimitGuard` заменил 9 closure и 15 прямых вызовов; ключ — `rl:{METHOD} {ctx.route}:{ip}`,
  ~50 legacy-ключей `*Controller.*` удалены (ADR-0003).
- Ревью: CHANGES REQUIRED по тесту нового канона → `rate-limit-guard.spec.ts`
  (параметры не дробят ключ, метод/путь различаются, query игнорируется) — мутация «key из URL»
  валит тест.

## Раунд 6 — lifecycle (`108ebfa`, docs `f793bac`)

- `Lifecycle.add()` — регистрация там же, где создание; ручные списки `started`/`stoppable` удалены,
  `DrizzleService` получил ping и `pool.end()`, таймер погоды снимается, дубли сервисов убраны
  (ADR-0002). Ревью: CHANGES REQUIRED только по docs-строке чек-листа → исправлено `f793bac`.

## Раунд 7 — каскад удаления записи (`409ff26`, ревью: APPROVE)

- Латентный 500: удаление предложения с оценкой падало на FK `restrict`. Каскад теперь только в
  `DrizzleRecordRepository`; suggestion-репозиторий делегирует create/delete.
- Интеграционные тесты на живом Postgres (61 pass), ревью мутационно подтвердило падение старого кода.

## Раунд 8 — единый путь ошибки фронта (`41ae5e6`, fix `df972f6`)

- `ErrorRetry` (bar/block) заменил 7 копий; `parseApiError` — единственный разбор ошибки
  (локальный дубль в wordle удалён); русские fallback; админ больше не проглатывает ошибку удаления.
- Ревью: CHANGES REQUIRED — `vue-tsc` с холодным кешем падал на трёх неиспользуемых `RotateCw`
  (инкрементальный кеш `vue-tsc` это маскировал) → исправлено `df972f6`.

## Раунд 9 — один бесконечный список (`5346375`)

- `useRecordsList` + `useRecordMutations`: жанровые сторы и «Мои оценки» используют одну механику
  пагинации/ретрая/мутаций; `user-ratings-pagination.ts` удалён, покрытие `nextPageParam` перенесено.

## Раунд 10 — ловушка на мёртвый код (`90c6c6c`)

- `__tests__/architecture.spec.ts`: файл без импортёров валит тест (entrypoints — в явном allowlist);
  мутация проверена.

## Раунд 11 — Logger и env под запретом (`4471595`)

- `Logger` с уровнями и `LOG_LEVEL` (devDefault debug), `configureLogger` в `main.ts`;
  7 `console.*` из рантайма переведены; `DrizzleService(DSN)` больше не читает env.
- Ловушки: oxlint `no-console` для `backend/src` + тест «`process.env` только в `enviroments.ts`».

## Раунд 12 — secrets и граница гейтвея (`1757fb7`)

- `utils/secrets.ts::secretsMatch` — одна timing-safe проверка для /twir и Telegram webhook;
  `utils/api-key.ts` и локальный дубль удалены.
- Типы `CocktailCatalog` уехали в `cocktail.types.ts`; новый инвариант «gateway не импортирует
  `modules/**/*.service`».

## Известные ограничения процесса

- **`vue-tsc` инкрементальный кеш** (`frontend/node_modules/.cache/vue-tsc`) маскировал TS6133:
  перед финальной проверкой фронта кеш нужно чистить (`rm -rf frontend/node_modules/.cache/vue-tsc`).
- **E2E (Playwright) не запускались**: нужен собранный фронт + бэкенд на изолированных портах.
  Интеграционные тесты гоняются на dev-postgres (`RUN_DB_TESTS=1`, `lists_test`).
- Ревью 9, 11, 12 — на момент записи в работе; их вердикты фиксируются в `reviews/`.

## Раунд 13 — реестр жанров (`9737c78`, `a40fbfa`)

- `lib/genre-registry.ts` + `lib/genre-keys.ts` + `pages/media/genre-stores.ts`: жанр описан
  в одном месте; маршруты, меню, префетч, WS-инвалидация, статистика, советы и палитра команд
  читают реестр. `MediaPage` без `switch` (ADR-0005).
- `ws-handlers.ts` собирает обработчики из реестра; `COALESCER_KEYS` — единый список для ресинка.
- Ревью батча 9 (B1/B2): единый `RECORDS_PAGE_SIZE`, из `api-types` убраны осиротевшие алиасы.
- Ловушки: `genre-registry.spec.ts`, `ws-handlers.spec.ts`; review — в работе.

## Раунд 14 — заголовок документа (`5d999c7`)

- `useTitle` — единственный владелец title; `router.afterEach` берёт `meta.title`; удалены
  семь прежних писателей (ADR-0006). Главная — `titleSuffix: false`, dynamic «Оценки {login}»
  остался в `use-user-ratings`.

## Раунд 15 — словарь статусов и оценок (`0ded33d`, `0291448`)

- `lib/record-vocabulary.ts`: имя/подпись/описание/hex/классы + три порядка; бейджи, статистика,
  `MediaCard` и `friends-rating` читают словарь (ADR-0006).
- `NOTINTERESTED` временно получил серый фон — исправлено follow-up коммитом (сохранён прежний вид).

## Раунд 16 — SQL из сервиса в репозиторий (`13148e3`)

- `RatingService` без `DrizzleService`: `recordExists`/`findUserBrief` в `DrizzleRatingRepository`;
  новый инвариант architecture.spec «services не импортируют БД», мутационно проверен;
  интеграционные тесты методов.

## Раунд 17 — ключи хранилища (`934ffc5`)

- `lib/storage-keys.ts`: все ключи и `VERSIONED_STORAGE_KEYS`; `main.ts` больше не чистит чужие
  ключи по строкам; спек сканирует исходники на литералы и падает при обходе модуля.

## Процессные заметки

- Ревью 13–17 — в работе; вердикты дописываются в `reviews/`.
- `vue-tsc` с холодным кешем обязателен: инкрементальный кеш уже маскировал TS6133 в батчах 8 и 9.
- Ветка запушена и обновляется после каждого батча; draft-PR #264 остаётся черновиком до финала.

## Ревью-цикл 13–17 — итоги

| Батч  | Вердикт             | Что исправлено после ревью                                                                                                                                                               |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13    | CHANGES (блокер B1) | жанровый стор создавался в `computed` → colada не регистрировала `onMounted`, `/api/records` не уходил; сторы возвращены в `watch(immediate)` (`71521c0`), e2e прямого захода подтвердил |
| 14    | в работе            | —                                                                                                                                                                                        |
| 15    | CHANGES (блокер B1) | `NOTINTERESTED` получил фон бейджа, которого не было; `badgeClass` снова опционален (`0291448`)                                                                                          |
| 16–17 | APPROVE             | ужесточены ловушки: `@gmd/database` в сервисах запрещён, ключи хранилища зафиксированы тестом, `localStorage?.` ловится; `d52109d`/`71521c0`                                             |
| 9     | CHANGES (B1/B2)     | единый `RECORDS_PAGE_SIZE`, осиротевшие api-types удалены (`9737c78`)                                                                                                                    |
| 11    | APPROVE             | allowlist env-спека для вложенных `__tests__`, `.env.example` LOG_LEVEL=debug                                                                                                            |
| 12    | APPROVE             | — (README-ссылки на api-key обновлены отдельным docs-коммитом)                                                                                                                           |

## E2E baseline (первый прогон кампании)

- Полный Playwright: **40 pass / 4 fail**; падения — `wordle.spec.ts` (practice layout/result,
  authorized player) и **воспроизводятся на master `e73dcfb`** тем же прогоном, то есть это
  существующая проблема практики Wordle, а не регрессия кампании.
- `records.spec.ts` изначально падал из-за B1 батча 13 (запрос не уходил) — после фикса зелёный;
  это и есть ловушка на «стор создан вне setup».
- G-05: wordle-практику e2e стоит починить отдельной задачей (в пуле).

## Итоговые проверки на HEAD

- `bun lint` — 0/0; `bun format:check` — чисто.
- `bun typecheck` с холодным кешем `vue-tsc` — зелёный (contract/database/backend/frontend).
- backend unit — 713 pass; integration (lists_test, `setup-db --reset`) — 62 pass.
- frontend unit — 147 pass; `bun run build` — зелёный (types + vite).
