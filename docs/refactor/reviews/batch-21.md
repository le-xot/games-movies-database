# Ревью батчей 21–22 (B-12, финал: wordle + `img-variant`) — `13221a9`, `90e4676` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`; ревью — detached `90e4676` в `/tmp/review-b21` (основной чекаут за время ревью ушёл на `38f9d6a`, closing-docs коммит в предмет ревью не входит)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Коммиты          | `13221a9` (родитель `a457e45`; 9 файлов, +166/−277) — wordle: доменные типы вместо class-DTO, гейтвей без ручных дублей портов; `90e4676` (родитель `13221a9`; 4 файла, +3/−3) — `img.dto.ts` → `img-variant.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Ревьюер          | `review-batch21` (не автор коммитов; только diff, изолированный worktree, собственные прогоны и мутации)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Что сделано мной | `git worktree add --detach /tmp/review-b21 90e4676`, `bun install --frozen-lockfile` (450 пакетов, lockfile не поехал), `backend/.env` скопирован из основного чекаута, `frontend/node_modules/.cache/vue-tsc` удалён перед typecheck. Для интеграции: отдельный одноразовый `postgres:17` на `127.0.0.1:5433` (`le_xot`/`abc`, та же БД `lists_test`) — порт 5432 был занят контейнером параллельного ревью `review-b20-postgres`; `setup-db.ts`, затем `RUN_DB_TESTS=1 bun test src/__integration__`. Все мутации откачены (`git status` пуст), worktree `review-b21` и `review-b21-base` удалены, контейнер БД удалён. В основном дереве создан только этот отчёт; код не менялся, коммитов нет |
| Не запускалось   | Playwright e2e (практика Wordle — известные падения F-11) и `docker build` — вне предмета батчей: HTTP-контракт, WS и домен wordle не менялись, `img` — только enum и импорты                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Важно            | «12 форм» из задачи на деле — 15 старых class-DTO (11 в `wordle.dto.ts` + 4 в `wordle-notification.dto.ts`) → 14 доменных интерфейсов: пятнадцатая форма, `WordleNotificationsDeleteDTO`, удалена как неиспользуемая (её проводную форму и дальше держит TypeBox-модель `WordleNotificationsDeleteDTO`, `gateway/wordle.ts:118`). Сверка — ниже, п. 1                                                                                                                                                                                                                                                                                                                                              |

## Вердикт

**APPROVE.** Блокеров нет.

Оба коммита делают ровно заявленное: class-DTO wordle исчезли, формы переехали в
`modules/wordle/entities/` **поле-в-поле** (включая `rank: number | null`, `answer: string | null`,
`avatarFrameId: string | null`, `history` и `today.entries[].guesses`), ручные интерфейсы портов из
гейтвея удалены (−80 строк), а порты остались байт-в-байт теми же по сигнатурам. Проводная форма не
изменилась: рантайм-дамп JSON-схем моделей wordle на родителе `a457e45` и на `90e4676` **побайтово
идентичен** (все `$ref` и имена моделей), маршруты/ссылки на схемы ответов совпадают, `api-types.ts`
не менялся, frontend-typecheck с холодным кешем зелёный. Type-level связка «домен → порт →
TypeBox-схема ответа» теперь реально ловит дрейф — доказано двумя мутациями (п. 6). Прогоны кампании
зелёные: lint 0/0, format clean, typecheck (frontend холодный) 4.82 s, backend unit **715**,
integration **62**, frontend unit **148**. Ниже — четыре не блокера: два гигиенических (дубли форм с
уже существовавшими типами `wordle.stats.ts` и мёртвый тип), один про отсутствие машинного запрета
на возврат class-DTO и один про док-хвосты.

### Блокеры

Нет.

### Не блокеры

- **N1. Новый канон не подхватил уже существовавшие доменные типы `wordle.stats.ts` — в модуле
  появились омонимы и четыре пары идентичных форм.** Старые class-DTO по смыслу дублировали
  вычислительные интерфейсы `wordle.stats.ts` ещё в родителе (`WordleHistoryDayDTO` vs
  `WordleHistoryDay` и т.п.), но суффикс `DTO` разводил имена. После переименования в модуле
  `modules/wordle/` два разных `WordleStats` (`entities/wordle.entity.ts:43` — 9 полей API-формы и
  `wordle.stats.ts:23` — 6 полей агрегата), а также четыре пары с совпадающей структурой:

  | entities                            | `wordle.stats.ts`                    | отличие                                          |
  | ----------------------------------- | ------------------------------------ | ------------------------------------------------ |
  | `WordleHistoryDay` (:38)            | `WordleHistoryDay` (:12)             | пусто                                            |
  | `WordleDailyGuess` (:67)            | `WordleDailyGuess` (:63)             | пусто                                            |
  | `WordleLeaderboardEntry` (:55)      | `WordleLeaderboardEntry` (:43)       | пусто                                            |
  | `WordleDailyLeaderboardEntry` (:71) | `WordleDailyLeaderboardRow` (:67)    | только имя                                       |
  | `WordleDailyLeaderboard` (:82)      | `WordleDailyLeaderboardResult` (:78) | только имя поля-массива                          |
  | `WordleStats` (:43)                 | `WordleStats` (:23)                  | entity = stats + `rank`/`totalPlayers`/`history` |

  Поведения это не ломает (структурная совместимость, typecheck и тесты зелёные), но правило 1
  «SSOT» и правило 6 «Deletion test» нарушены формой: новый `WordleStats` — буквально
  `extends WordleStats` из `wordle.stats.ts`, а четыре пары можно свести к одному объявлению
  (например, канон — в `entities/`, `wordle.stats.ts` импортирует их и берёт `WordleHistoryStatus`
  из `@gmdb/contract`; цикл не возникает). Это отчётный нит, не блокер: правка чисто механическая.

- **N2. `WordleGuess` — мёртвый тип, при этом в том же коммите удалён другой мёртвый DTO; правило
  удаления применено непоследовательно.** `entities/wordle.entity.ts:9` объявляет `WordleGuess`,
  но на `90e4676` на него нет ни одной ссылки (`grep -rn '\bWordleGuess\b'` — только объявление;
  ни `api-types.ts`, ни гейтвей, ни тесты его не используют; старый `WordleGuessDTO` тоже был
  мёртвым — ни одного `new …DTO`/импорта). Одновременно `WordleNotificationsDeleteDTO` из
  `wordle-notification.dto.ts` удалён как неиспользуемый — правильное решение, но по той же логике
  `WordleGuess` не должен был переезжать. Не блокер: 1 поле, ни на что не влияет, но по правилу 6
  позиция «оставить декоративный тип» последовательно не защищена.
- **N3. Запрет class-DTO в `modules/` ничем машинно не закреплён.** DoD батча требует «на новый
  канон есть тест», правило 5 — «уборка без ловушки недоделана». Что действительно появилось и
  работает как type-level ловушка — связка доменных типов с портами и схемами ответов (мутации,
  п. 6). Но сама норма «в `modules/` нет `*.dto.ts`/class-DTO» не проверяется ничем: если завтра
  кто-то добавит `modules/foo/foo.dto.ts` с классом, `architecture.spec.ts` (проверяет сирот,
  прямые импорты БД, импорты сервисов в гейтвей, `process.env`) останется зелёным, typecheck —
  тоже. Фикс — 3–5 строк в `backend/src/__tests__/architecture.spec.ts`: отбраковка
  `**/modules/**/*.dto.ts` и регэксп `class \w+DTO` в `modules/**`. Это не регрессия батча
  (прецедент: батчи 19–20 тоже без такого спека), поэтому не блокер, но DoD-пункт формально открыт.
- **N4. Док-хвосты (ожидаемые G-04 и closing-docs).** В коде ссылок на удалённые файлы нет; остались
  исторические описания: `maps/hygiene.md:264` (счётчик `*.dto.ts`, `modules/img/img.dto.ts`),
  `maps/hygiene.md:297` (`WordleHistoryDayDTO` → `modules/wordle/wordle.dto.ts:47`),
  `maps/backend.md:127` (пары `modules/wordle/wordle.dto.ts:5-29` vs `gateway/wordle.ts:14-102`),
  `maps/backend.md:140` (`GetImageQueryDTO`, `modules/img/img.dto.ts:6-10`) — это карты рекона, их
  полная синхронизация в пуле как G-04, так же фиксировали ревью 16–17. Отдельно:
  `docs/architecture.md:180` всё ещё обещает «сущность → DTO» в `server/wiring/`, что противоречит
  ADR-0007 и обновлённому `modules/AGENTS.md:68-69` (этот батч поправил AGENTS, но не architecture.md).
  `tasks.md` на `38f9d6a` добавил строку B-12 в закрытую таблицу, оставив строку в «В пуле» —
  ровно тот же паттерн, что исторически у B-13, то есть вопрос closing-docs, а не этих двух коммитов.
  Вне скоупа, для сведения: `gateway/steam.ts:50,56` всё ещё объявляет `SteamGame`/`SteamImportGame`
  дублями `modules/steam/steam.entity.ts` (это предмет ревью 20); формулировка B-12 «гейтвей без
  дублей портов» верна именно для wordle.

## Что в коммитах

`13221a9` (`+166/−277`):

- удалены `modules/wordle/wordle.dto.ts` (−131, 11 декоративных классов) и
  `wordle-notification.dto.ts` (−29, 4 класса);
- добавлены `modules/wordle/entities/wordle.entity.ts` (+93: `WordleGuess`, `WordleGuessState`,
  `WordlePracticeState`, `WordleState`, `WordleHistoryDay`, `WordleStats`, `WordleLeaderboardEntry`,
  `WordleDailyGuess`, `WordleDailyLeaderboardEntry`, `WordleDailyLeaderboard`, `WordleLeaderboard`) и
  `entities/wordle-notification.entity.ts` (+22: `WordleNotificationStatus`/`Link`/`Update`);
- `gateway/wordle.ts`: −80 строк ручных интерфейсов тех же форм; доменные типы импортируются
  (`import type`) и реэкспортируются (`export type`) для `api-types.ts` и тестов; в
  `WordleNotificationsPort` вход `WordleNotificationInput` → `WordleNotificationUpdate`; ручных дублей
  моделей/маршрутов не тронуто;
- `wordle.service.ts`, `wordle-practice.service.ts`, `wordle-notification.service.ts`: только
  аннотации возвратов/параметров и порядок импортов (логика не менялась — п. 4);
- `modules/AGENTS.md`: канон «class-DTO не заводим, wiring — адаптер (ADR-0007)».

`90e4676` (`+3/−3`): чистый rename `R100` `modules/img/img.dto.ts` → `img-variant.ts`
(`0 0` numstat — содержимое не менялось: один enum `ImgVariant { POSTER, AVATAR }`) + три строки
импортов (`img.service.ts:8`, `server/wiring/integrations.ts:1`, `img/__tests__/img.service.spec.ts:10`).

## Проверки

| Проверка                      | Команда / способ                                                                                 | Результат                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Lint                          | `bun lint`                                                                                       | 0 warnings, 0 errors (443 файла, 96 правил)                                                       |
| Формат                        | `bun format:check`                                                                               | clean (651 файл)                                                                                  |
| Typecheck (frontend холодный) | `rm -rf frontend/node_modules/.cache/vue-tsc && bun typecheck`                                   | contract 7 / db 41 / backend 274 файла, vue-tsc 4.82 s, exit 0                                    |
| Backend unit                  | `cd backend && bun test`                                                                         | **715 pass / 0 fail**, 87 файлов, 36 302 expect                                                   |
| Wordle-скоуп отдельно         | `bun test src/gateway/__tests__/wordle.spec.ts src/modules/wordle`                               | **176 pass / 0 fail**, 13 файлов (state/guess/stats/leaderboard/practice/notifications/miniapp/…) |
| Integration                   | `setup-db.ts` + `RUN_DB_TESTS=1 bun test src/__integration__` (postgres:17, `lists_test`, :5433) | **62 pass / 0 fail**, 13 файлов, 208 expect                                                       |
| Frontend unit                 | `cd frontend && bun test src`                                                                    | **148 pass / 0 fail**, 27 файлов                                                                  |
| Orphan-guard + архитектура    | `src/__tests__/architecture.spec.ts`                                                             | 4/4 pass (сироты, БД в сервисах, гейтвей без сервисов, `process.env`)                             |
| Рантайм-дамп схем parent↔HEAD | import `gateway/wordle.ts` в `bun -e`, `JSON.stringify(wordleModels/wordleNotificationModels)`   | **diff пуст** (`SCHEMAS_IDENTICAL`, 486 строк JSON)                                               |
| Маршруты/$ref/ключи моделей   | регэксп-извлечение из `git show a457e45:…/gateway/wordle.ts` и HEAD                              | 11 маршрутов, 9 `response.200`-refs и 14+4 ключа моделей идентичны                                |

## 1. Эквивалентность форм (15 старых классов → 14 интерфейсов)

Сверка полей — скрипт-парсер: старые `class …DTO` из `git show a457e45:…/wordle*.dto.ts` против
новых `interface` в `entities/`; порядок полей игнорировался, типы нормализовались (вложенные формы).

| Старый class-DTO                 | Новый доменный тип                                       | Полей | Итог |
| -------------------------------- | -------------------------------------------------------- | ----- | ---- |
| `WordleGuessDTO`                 | `WordleGuess` (`wordle.entity.ts:9`)                     | 1     | OK   |
| `WordleGuessStateDTO`            | `WordleGuessState` (:13)                                 | 2     | OK   |
| `WordlePracticeStateDTO`         | `WordlePracticeState` (:18)                              | 6     | OK   |
| `WordleStateDTO`                 | `WordleState` (:27)                                      | 8     | OK   |
| `WordleHistoryDayDTO`            | `WordleHistoryDay` (:38)                                 | 2     | OK   |
| `WordleStatsDTO`                 | `WordleStats` (:43)                                      | 9     | OK   |
| `WordleLeaderboardEntryDTO`      | `WordleLeaderboardEntry` (:55)                           | 9     | OK   |
| `WordleDailyGuessDTO`            | `WordleDailyGuess` (:67)                                 | 1     | OK   |
| `WordleDailyLeaderboardEntryDTO` | `WordleDailyLeaderboardEntry` (:71)                      | 8     | OK   |
| `WordleDailyLeaderboardDTO`      | `WordleDailyLeaderboard` (:82)                           | 2     | OK   |
| `WordleLeaderboardDTO`           | `WordleLeaderboard` (:87)                                | 5     | OK   |
| `WordleNotificationsStatusDTO`   | `WordleNotificationStatus` (`…notification.entity.ts:5`) | 7     | OK   |
| `WordleNotificationsLinkDTO`     | `WordleNotificationLink` (:15)                           | 1     | OK   |
| `WordleNotificationsUpdateDTO`   | `WordleNotificationUpdate` (:19)                         | 2     | OK   |
| `WordleNotificationsDeleteDTO`   | — (класс удалён; не использовался)                       | 1     | OK   |

Точечно по рискованным полям (все совпали дословно):

- `WordleStats.rank: number | null` и `WordleStats.history: WordleHistoryDay[]` — есть, как в DTO
  (старый гейтвеевский дубль объявлял `history` инлайном `{ date; status }[]` — структурно то же);
- `WordleState.answer: string | null` и `WordlePracticeState.answer: string | null` — есть;
- `WordleLeaderboardEntry.avatarFrameId: string | null` и
  `WordleDailyLeaderboardEntry.avatarFrameId: string | null` — есть;
- `today.entries[].guesses: WordleDailyGuess[]`, `WordleDailyGuess.states: WordleLetterState[]` — есть;
- `WordleState.msUntilNextWord: number` — есть (`wordle.entity.ts:35`).

Порты (п. 3) сверены отдельно: `WordleServicePort` на `a457e45` и `90e4676` **идентичен посимвольно**
(diff пуст), `WordleNotificationsPort` отличается ровно именем типа входа `WordleNotificationInput` →
`WordleNotificationUpdate`; набор полей входа тот же (2/2). Тонкость `exactOptionalPropertyTypes`
(`backend/tsconfig.json:15`): старый дубль гейтвея объявлял `morningEnabled?: boolean | undefined`,
доменный тип — `morningEnabled?: boolean`. Это сужение только на явную передачу `undefined` в
литерале; единственный вызывающий (`server/wiring/wordle.ts:30-33`) уже собирает объект условным
спредом, поэтому рантайм-поведение не меняется, а расхождение типов не «скрытое расширение».

## 2. Wire-контракт

- **Рантайм-дамп плагина, parent↔HEAD.** В обеих worktree (parent `a457e45` в
  `/tmp/review-b21-base`, HEAD `90e4676` в `/tmp/review-b21`) импортирован `gateway/wordle.ts` и
  сериализованы `wordleModels` + `wordleNotificationModels` (`JSON.stringify` — `$ref`, `anyOf`,
  `required`, `type`). `diff /tmp/base-schemas.json /tmp/head-schemas.json` — **пусто**
  (`SCHEMAS_IDENTICAL`, 486 строк). Имена моделей — это будущие `$ref`-имена, менять их нельзя:
  они не изменились.
- **Маршруты и схемы ответов.** 11 маршрутов `/wordle/*` и `/wordle/notifications/*` совпадают
  список-в-список (метод+путь); `response.200`-ссылки (`WordleStateDTO`, `WordleStatsDTO`,
  `WordleLeaderboardDTO`, `WordlePracticeStateDTO`, `WordleNotificationsStatusDTO`,
  `WordleNotificationsDeleteDTO`) — те же; 201-ответ `WordleNotificationsLinkDTO` не менялся (весь
  diff гейтвея — импорты, удаление интерфейсов, `export type` и один приведение
  `ctx.body as WordleNotificationUpdate`).
- **Типы фронта.** `git diff a457e45 90e4676 -- backend/src/api-types.ts` пуст: алиасы
  `WordleStateDTO`/`WordleStatsDTO`/`WordleLeaderboardDTO`/`WordlePracticeStateDTO`/
  `WordleNotificationStatus` и производные (`api-types.ts:32-38`) не поменялись. Потребитель фронта
  (`frontend/src/pages/wordle/constants/wordle-constants.ts:2`) компилируется; frontend typecheck с
  холодным кешем (`vue-tsc` пересоздал `tsconfig.tsbuildinfo`) зелёный за 4.82 s.
- **Рантайм-валидация.** Elysia возвращает ответы через те же TypeBox-модели; gateway-спека
  (`gateway/__tests__/wordle.spec.ts`, 7 тестов) гоняет реальные роуты с моками портов и проходит
  валидацию ответов. Обратная сторона — тип возврата хендлера ограничен схемой ответа; это доказано
  мутацией B (п. 6).

## 3. Порты, реэкспорт, циклы

- `WordleServicePort` (`gateway/wordle.ts:133-141`) — 7 сигнатур, посимвольно те же, что на `a457e45`.
  `WordleNotificationsPort` (:143-148) — 4 сигнатуры, отличие только имя типа входа (см. выше).
  Никакого скрытого расширения/сужения возвратов нет.
- Гейтвей тянет из `modules/` только **type-only** импорты/реэкспорты
  (`gateway/wordle.ts:8-19`, `:125-131`), сервисы — тоже `import type`
  (`wordle.service.ts:31-35`, `wordle-notification.service.ts:27-31`). Value-импортов entity-модулей
  нет ни одного (`grep` «entities/wordle» без `import type`/`export type` — пусто); `bun -e` импорт
  `gateway/wordle.ts` для рантайм-дампа схем отработал без ошибок. В обратную сторону импортов нет
  (`grep "from '@backend/gateway"` по `modules/` — пусто), цикла `gateway ↔ modules` не существует.
- `architecture.spec.ts` «гейтвей не импортирует доменные сервисы» — зелёный (новые импорты — не
  `.service`); «нет файлов без импортёров» — зелёный; обе новые entity-файлы имеют импортёров.

## 4. Поведение Wordle

- `git diff a457e45 90e4676` по трём сервисам — **только** импорты, аннотации типов и переформат
  сигнатуры `makeGuess` в одну строку (те же 3 параметра с теми же дефолтами). Строк логики
  (`if`/`return`/запросы) диф не касается.
- WS: `wordle.service.ts:117` — `emitWs(this.eventEmitter, WsEvents.UPDATE_WORDLE, payload)`;
  диф по `emit`/`DomainEvents`/`WsEvents` пуст, `contract/` не тронут. Событие и payload прежние.
- 404: единственный 404-путь wordle — `NotFoundError('Подписка не найдена')` в
  `wordle-notification.service.ts:294` (`PATCH /wordle/notifications`); маршруты, `standardErrors()`
  и маппинг ошибок (`gateway/errors.ts:19,46-50`, `utils/errors.ts:38-40`) не менялись — статусы те же.
- Спеки зелёные: 176 тестов в 13 wordle-файлах (включая gateway-спеку с 404-путём через
  `standardErrors`), 715 backend-тестов суммарно; интеграционные спеки репозиториев wordle — 10
  тестов внутри 62-pass прогона.

## 5. `img-variant` и мёртвый код

- Rename `R100`, numstat `0 0` — содержимое `enum ImgVariant { POSTER='poster', AVATAR='avatar' }`
  не изменилось; импорты обновлены в 3 местах + тест (`../img-variant`).
- В `backend/src/modules/` не осталось `*.dto.ts` (`find` — 0), нет `class …DTO` (`grep` — 0) и нет
  `new …DTO` (`grep` по backend/frontend — 0). Ссылок на `wordle.dto`/`wordle-notification.dto`/
  `img.dto` в коде нет — только исторические `docs/refactor/maps/*` (N4).
- Новых `any`, `as unknown as`, `@ts-…`, `eslint-disable` дифы не добавляют (grep по `+`-строкам —
  0); единственный `as` — существовавшее приведение `ctx.body` с переименованным типом.

## 6. Мутации (доказательство ловушек)

**A. Переименовал поле только в домене** — `entities/wordle.entity.ts:35` `msUntilNextWord` → `ms`,
`bun run typecheck` (`bun check -b`) — **exit 1, 6 ошибок в 4 файлах**, все про новую форму:

```
src/modules/wordle/wordle.service.ts(208,7): error TS2353: 'msUntilNextWord' does not exist in type 'WordleState'
src/gateway/wordle.ts(171,7): error TS2345: handler not assignable (GET /wordle/state, response WordleStateDTO)
src/gateway/wordle.ts(182,7): error TS2345: handler not assignable (POST /wordle/guess, response WordleStateDTO)
src/gateway/__tests__/wordle.spec.ts(38,29): error TS2322: mock не отдаёт 'ms'
src/gateway/__tests__/wordle.spec.ts(39,18): error TS2352
src/modules/wordle/__tests__/wordle.service.spec.ts(74,20): Property 'msUntilNextWord' does not exist
```

**B. Переименовал согласованно везде, кроме TypeBox-схемы** (entity + `wordle.service.ts:208` +
оба спека, `gateway/wordle.ts:42` оставил `msUntilNextWord: t.Number()`) — `typecheck` дал **exit 1,
ровно 2 ошибки**: `gateway/wordle.ts(171,7)` и `(182,7)` — типы возврата двух хендлеров, чей
`response.200` — `WordleStateDTO`, перестали совпадать со схемой. Это доказывает, что проводная форма
схемы **машинно связана** с доменными типами на уровне typecheck, а не только рантайм-валидации.

Обе мутации откачены; после отката `git status` пуст, `bun run typecheck` — «No type errors in 274
files», целевой прогон wordle — 176 pass.

## Ограничения ревью

- Интеграция шла на изолированном `postgres:17` (`127.0.0.1:5433`), потому что 5432 занял контейнер
  параллельного ревью (`review-b20-postgres`, запущен 08:24:53). Креды/БД те же, `setup-db.ts`;
  на 5432 не ходил, чтобы не пересечься с `truncateAll` чужого прогона.
- Основной чекаут за время ревью ушёл с `90e4676` на `38f9d6a` (closing-docs: `progress.md`,
  `tasks.md`); номера строк в отчёте — по `90e4676`, closing-docs в предмет ревью не входит.
- Не запускались e2e (Playwright) и `docker build` — вне предмета батчей (HTTP/WS/домен не менялись,
  `img` — enum + импорты); `bun install --frozen-lockfile` прошёл, зависимости не менялись.
- `docs/refactor/maps/*`, `docs/architecture.md:180` и строка B-12 в «В пуле» — известные хвосты
  кампании (G-04/closing-docs), зафиксированы в N4, а не как регрессия этих коммитов.
