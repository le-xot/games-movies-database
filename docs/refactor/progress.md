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

## Финальный статус кампании (HEAD `20eb8a7`)

- **18 батчей**, каждый прошёл независимое ревью новым агентом; все блокеры исправлены
  отдельными коммитами (13 → `71521c0`, 15 → `0291448`, 14 → `20eb8a7`, 9 → `9737c78`,
  8 → `df972f6`, 4 → `9042286`, 5 → `b77235c`, 6 → `f793bac`).
- **Проверки на HEAD**: lint 0/0, format clean, typecheck с холодным кешем зелёный,
  backend unit **715**, backend integration **62** (Postgres `lists_test`),
  frontend unit **148**, `bun run build` зелёный.
- **E2E (Playwright)**: **40 pass / 4 fail**; все падения — практика Wordle и воспроизводятся
  на `master e73dcfb` (баг продукта, не кампании; задача F-11).
- **Осознанные изменения внешнего поведения**: 500→409 на уже привязанный аккаунт; удаление
  предложения с оценкой больше не падает; ключи rate-limit в Redis пересоздаются (пресеты те же).
- **Остаток пула** (`tasks.md`): B-12 (class-DTO → доменные типы), F-08 (router SSOT),
  F-09 (мелочи диалогов/ожиданий), F-10 (разрезание god-компонентов), F-11 (e2e практики Wordle),
  G-03 (тип-тесты полноты словарей), G-04 (полная синхронизация карт рекона).
- **Ревью 14**: CHANGES → двойной суффикс `/pc`, watcher оценок вне своих маршрутов — исправлено
  `20eb8a7`; админка сознательно «Админка Лешота».

## Раунд 19–22 — B-12: class-DTO исчезли из домена

- `6486c0f`: удалены weather/limit/stats/twir `*.dto.ts` → доменные типы в `entities/`;
  гейтвей больше не дублирует схемы (`WeatherResponse` из статических типов компонент,
  `ChangeLimitInput`/`Limit`/`TwirInput` из моделей).
- `a457e45`: record и steam — `CreateRecordFromLinkInput`, `UpdateRecordData`, `SteamGame`/
  `SteamImportGame` вместо Nest-классов.
- `13221a9`: wordle — последние class-DTO; в `gateway/wordle.ts` удалены ручные интерфейсы
  портов (~80 строк), типы берутся из `modules/wordle/entities` и реэкспортируются для
  `api-types`/тестов.
- `90e4676`: `img.dto.ts` → `img-variant.ts` — в `modules/` не осталось ни одного `.dto.ts`.
- Wire-контракт не менялся: формы держат TypeBox-модели, доменные типы структурно совпадают
  (проверяется холодным typecheck'ом backend+frontend и unit/integration-тестами).

## Ревью 19–21 и закрытие B-12

- Все три ревью — **APPROVE**:
  - 19: рантайм-дамп схем 88 `$defs`/4 роутов parent↔HEAD пуст; 35 type-level Equal; мутации полей ловятся в проводке.
  - 20: diff 6 файлов, wiring передаёт только ожидаемые поля; мутации `link→url`, `appid→appId` валят typecheck.
  - 21: дамп wordle-моделей побайтово идентичен; 15 class-DTO ↔ 14 интерфейсов поле-в-поле; мутация поля в домене даёт 6 ошибок в 4 файлах.
- Ниты закрыты `223c17b`: инвариант «в домене нет class-DTO» (мутационно проверен), удалён мёртвый `WordleGuess`,
  точный каст тела лимита, чек-лист нового домена синхронизирован с ADR-0007.
- Осознанно оставлено: омонимы `WordleStats` в `wordle.stats.ts` (типы живут вместе с чистыми функциями —
  вынос создал бы type-cycle entities ↔ stats), раскладка `limit.entity.ts`/`stats.entity.ts` в корне
  модуля (прецедент `queue.entity.ts`), устаревшие карты рекона — G-04.
- **B-12 закрыт**: в `backend/src/modules` не осталось ни одного `*.dto.ts`; доменные формы — интерфейсы,
  проводную форму держат TypeBox-схемы, class-DTO запрещены тестом.

## Раунд 2 кампании: B-12 закрыт (`6486c0f`…`223c17b`)

- Четыре батча (19–22) и полировка (23): class-DTO исчезли из домена, гейтвей перестал дублировать
  формы портов, в `modules/` не осталось `.dto.ts`; инвариант «в домене нет class-DTO» добавлен
  в `architecture.spec.ts` и мутационно проверен ревьюером (все три ветки ловушки падают).
- Ревью 19, 20, 21, 23 — **APPROVE**. Ключевые доказательства: рантайм-дампы TypeBox-схем
  parent↔HEAD побайтово идентичны; 35 type-level Equal на формы; мутации полей валят typecheck
  в проводке/роутах.
- **E2E**: полный прогон под нагрузкой трёх параллельных ревьюеров — 38 pass / 6 fail;
  `wordle.spec.ts` отдельно — 12 pass / те же 4 fail, что на `master e73dcfb`. Две «лишние»
  пары (leaderboard hover) — флейк под нагрузкой, изолированно проходят; новых регрессий нет.
- **Проверки на HEAD `223c17b`**: lint 0/0, format clean; typecheck холодный зелёный;
  backend **716** unit, integration **62**; frontend **148**; build зелёный.
- Остаток пула: F-08 (router SSOT), F-09 (диалоги/ожидания), F-10 (god-компоненты),
  F-11 (практика Wordle в e2e), G-03 (тип-тесты фронт-словарей), G-04 (карты рекона).

## Раунд 3 — F-09 (модалки/ожидание /me), F-08 (SSOT маршрутов), F-12 (скелетон)

- `97c5ebc`: `createDialogStore` — один канон boolean-модалок (`isOpen` + `open/close/toggle`),
  три стора и девять потребителей переведены; `whenQuerySettled(timeoutMs)` сам ограничивает
  ожидание — гард роутера и `main.ts` используют одну константу, три копии 1500 мс исчезли.
- `4e37e88`: `ROUTE_TABLE` — единственный источник имён/путей обычных маршрутов; `RouteNamedMap`
  выводится mapped-типом из таблицы + реестра жанров, `EXPECTED_ROUTE_NAMES` — оттуда же;
  `router.ts` стал фабрикой `createAppRouter(history)`, новый `router.spec.ts` проверяет
  набор имён, пути, жанровые meta и title (мутации «пропала запись», «неверный путь» ловятся).
- `48356cf`: `RecordCardSkeleton.vue` заменил две копии скелетона; магические числа DataCards
  стали константами; проп `hasError` переименован в `suppressEmptyState` (семантика та же).
- Ревью 24–26 — в работе; вердикты фиксируются в `reviews/`.

## Ревью 24–26 — APPROVE

- 24 (модалки/ожидание /me): ид стора и on-load сценарий не менялись, все 9 потребителей переведены;
  один `1500` в `frontend/src`, гард эквивалентен; e2e 23/23 на отдельной БД. Ниты (HMR фабрики,
  TDZ, отсутствие теста таймаута) закрыты `f0661b7`.
- 25 (маршруты): дамп `getRoutes()` parent↔HEAD совпал (22 маршрута, meta/redirect/вложенность),
  deep-link в браузере идентичен, типы `router.push` живы; мутации таблицы ловятся спеком.
  Нит «односторонняя type-ловушка» закрыт в `f0661b7` — удаление записи из `ROUTE_TABLE`
  теперь валит `bun run typecheck` (проверено мутацией в ревью 27).
- 27 (ниты HMR/TDZ/маршруты): **APPROVE**. HMR модалок проверен живьём в Vite dev и вырезан из prod;
  мутация `ROUTE_TABLE` валит холодный `vue-tsc`, «ghost»-маршрут валит `router.spec`.
  Важная поправка: TDZ-нит ревью 24 **не** был закрыт в `f0661b7` (правка не попала в коммит);
  исправлено follow-up коммитом `ef335d9` — `stop`/`timer` объявлены до `finish`.
- 26 (скелетон): SSR-рендер скелетона байт-в-байт совпал с прежними копиями; константы и
  `suppressEmptyState` эквивалентны; e2e records зелёный.

## Раунд 4 — F-09 остаток и закрытие G-03/G-04

- `436d132`: погода переведена на colada (`WEATHER_QUERY_KEY`, `staleTime` 10 минут, отображение —
  computed), ручной модульный кэш удалён; `useSuggestion` перестал импортировать Vue-компоненты и
  `useDialog` — диалог советов собирается в `SuggestionPage`; стор остался данными и мутациями.
- G-03 закрыт без нового кода: полноту словарей уже держат `satisfies Record<…>` в реестре жанров,
  словаре статусов/оценок и ключах хранилища + рантайм-тесты полноты; contract ↔ TypeBox — в
  `enum-sources.spec`.
- G-04 закрыт `maps/README.md`: карты рекона официально объявлены снимком, источник правды —
  `tasks.md`/`progress.md`; таблица «что уже неактуально» связана с закрытыми батчами.
- Ревью батча 28 — в работе; вердикт фиксируется в `reviews/`.

## Ревью 28 — APPROVE, ниты закрыты

- Погода эквивалентна построчно (13 полей, округления, давление ×0.750062, время в `UFA_TIME_ZONE`,
  иконки, тихая ошибка); per-query `staleTime` 10 мин переопределяет глобальные 30 с — e2e-проба:
  ремоунт через 40 с даёт 1 запрос. Советы: стор без `.vue`/`useDialog`, модалка из страницы
  открывается и закрывается как раньше (живая e2e-проба со storageState).
- Ниты ревьюера закрыты `1f4bfc3`: `gcTime = staleTime` (иначе дефолтные 5 минут вытесняли кэш
  раньше TTL и виджет мигал), ошибка сети больше не превращается в успешный `null` — запрос
  ретраится при следующем монтировании, как до перехода на colada.
- Итог раунда: F-09 закрыт полностью, G-03/G-04 закрыты; открытая ловушка на перенос диалога
  советов — покрывается e2e `suggestion` в CI.

## F-11 закрыт: e2e-падения были инфраструктурными

- Практика Wordle хранит сессии в Redis. Раньше e2e гоняли только с Postgres, поэтому 4 теста
  падали на «Redis недоступен» (старт тренировки не выполнялся, кнопка «Другое слово» оставалась
  disabled), и это ошибочно было записано как продуктовый баг на master.
- Проверка: `docker compose -f docker-compose.dev.yml up -d postgres redis` →
  `wordle.spec.ts` **16/16**, весь Playwright — **44/44 passed**. Продуктовый код не менялся.
- Требование к прогону e2e: полная инфра (`bun infra:start`) либо явно postgres + redis.
  Кандидат на отдельное улучшение: e2e-job в CI с сервисами/Redis — пока не добавляли (CI не тронут).

## Раунд 5 — F-10 частично, F-11 закрыт, e2e 44/44

- `632d263`: группировка ленты советов вынесена из `SuggestionCard` в чистую
  `suggestion-groups.ts` (`groupSuggestions`, `isQueuedRecord`, `SuggestionSortBy`); поведение
  сохранено (очередь-first, порядок жанров из реестра, date/likes), 4 новых теста ловят мутации
  порядка/сортировки/фильтра.
- **F-11 закрыт как инфраструктурный**: практика Wordle хранит сессии в Redis, e2e гоняли
  только с Postgres. С `postgres + redis` весь Playwright — **44/44 passed**, `wordle.spec` 16/16;
  продуктовый код не менялся. `AGENTS.md`: `test:e2e` требует `bun infra:start`.
- F-10 остаётся частично: визуальное разрезание `MediaCard`/`SuggestionCard` — следующий батч
  с проверкой скриншотами (иначе это переписывание разметки вслепую, запрещённое правилами).

### Ревью 30: CHANGES REQUIRED → исправлено `ef6d4ef`

- Блокер: в режиме «Лайки» очередь сортировалась по лайкам, а parent сортировал её всегда по дате
  (харнесс 500 наборов: 154 расхождения, все в группе «В очереди»). Исправлено, добавлен тест,
  который валит именно эту мутацию.
- Ниты закрыты: `RecordType.WRITTEN` вместо литерала, `SuggestionSortBy` импортируется
  компонентом и страницей (union не дублируется), `SuggestionGroupKey` не экспортируется.
- Жанры вне `SUGGESTION_GENRES` не отбрасываются: fallback-группы идут в конце. Сегодня это
  недостижимо (все жанры enum'а есть в списке советов), а parent ставил такие группы первыми
  через `indexOf = -1`; поведение зафиксировано тестом с `'BOOK' as RecordGenre` (`c33761f`) —
  это узелок на случай нового жанра, а не действующая ветка.
- Повторная проверка ревью 30: **APPROVE**, харнесс 500 наборов — 0 расхождений с parent
  в обоих режимах; полный Playwright 44/44; backend 716, frontend 160.
