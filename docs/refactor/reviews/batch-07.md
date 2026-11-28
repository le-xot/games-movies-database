# Ревью батча B-03 (batch 7) — `409ff26` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                |
| Коммит           | `409ff26` (родитель — `108ebfa`), 6 файлов, +85/−48                                                                                                                                                                                                                                                 |
| Ревьюер          | `review-batch7` (не автор коммита; только diff, изолированный worktree и прогоны)                                                                                                                                                                                                                   |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                          |
| Что сделано мной | работал в `/tmp/review-b7` (detached `409ff26`, `bun install --frozen-lockfile`, копия `backend/.env`); в основном дереве создан только этот отчёт, код не менялся, коммитов нет; worktree удалён в конце                                                                                           |
| Не запускалось   | Playwright e2e и `docker build` — нужны стенды, вне списка ревью; backend integration — **запускался** на dev-postgres (`lists_test`)                                                                                                                                                               |
| Важно            | пока шло ревью, ветка ушла вперёд: `9042286`, `41ae5e6`, `f793bac` (батчи 8/9). Ревью — строго на `409ff26`, все номера строк относятся к нему; поздние коммиты ревьюируемые файлы не меняли (в diff с `409ff26` — только новые gateway-тесты, `user.service.spec`, `docs/architecture.md` и фронт) |

## Вердикт

**APPROVE.** Блокеров нет.

- **Латентный 500 воспроизведён и закрыт ловушкой.** Возврат старой реализации удаления (likes → ownerships → records) в изолированном worktree роняет новый integration-тест на реальном Postgres: `23503`, `violates foreign key constraint "record_ratings_recordId_fkey"`. На HEAD тот же сценарий (предложение с лайком **и** оценкой) проходит.
- **Каскад полон и в правильном порядке.** На `records` ссылаются ровно 3 таблицы; `likes`/`record_ratings` (`restrict`) чистятся явно **до** `records`, `suggestion_ownerships` (`cascade`) уходит сама. Других FK на `records` в схеме и миграциях нет.
- **`createSuggestion` эквивалентен старому.** Поля insert совпадают (включая `status QUEUE`/`type SUGGESTION`; `extra` → `NULL`), ownership создаётся, форма возврата (record + `suggestionOwnership` + `likes`, без `user`) та же — проверено эмпирически на тестовой БД.
- **Внешние контракты не тронуты.** Гейтвей и `docs/api.md` не в diff; `DELETE /suggestions/:id` сохраняет 400/403/404 и успех `200 t.Void()`, WS `UPDATE_SUGGESTIONS` c `action: 'deleted'` тот же, unit-тесты сервиса зелёные.
- **Все прогоны зелёные**, счётчики коммита сходятся: **681 unit + 61 integration**.

Замечания все **не блокеры** (разбор в конце): сообщение коммита переоценивает второй тест («оба падали бы на старом коде»); load-back вынесен из транзакции создания; карты/задачи/журнал ещё не обновлены (ожидаемо — closing docs-коммит).

## Что в коммите

- `backend/src/modules/suggestion/repositories/drizzle-suggestion.repository.ts` — `createSuggestion` делегирует `recordsRepository.create` (`:44-64`), `deleteSuggestion` → `recordsRepository.delete` (`:115-117`); собственная транзакция и метод `deleteSuggestionWithLikes` удалены, импорт `likes` снят.
- `backend/src/modules/record/repositories/drizzle-record.repository.ts` — **не менялся** (в родителе `delete` уже был likes → recordRatings → records, `:108-114`). Это ключевой факт для мутационной проверки ниже.
- `backend/src/modules/suggestion/suggestion.service.ts:84` — вызов переименован; WS-событие (`:86-89`) и порядок проверок не тронуты.
- `backend/src/server/container.ts:111-118` — `recordRepository` (создан выше, `:106`) прокинут в `DrizzleSuggestionRepository`.
- Integration: `backend/src/__integration__/records.repository.integration.spec.ts:87-114` (likes + ratings + ownership + record), `backend/src/__integration__/suggestion.repository.integration.spec.ts:94-121` (предложение с лайком и оценкой).
- Unit: `suggestion.service.spec.ts` — только переименование моков; число `it` не изменилось (9 было / 9 стало), как и в двух integration-файлах (9 и 8).

`git show --check 409ff26` чист; новых `any`/`@ts-ignore`/`eslint-disable` в diff нет.

## Прогоны (в `/tmp/review-b7`, detached `409ff26`, дерево чистое)

| Проверка                                                                    | Результат                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `bun install --frozen-lockfile`                                             | exit 0 — `450 packages installed`                                                                                  |
| `bun lint`                                                                  | exit 0 — `Found 0 warnings and 0 errors`, 437 файлов, 95 правил                                                    |
| `bun format:check`                                                          | exit 0 — `All matched files use the correct format`, 614 файлов                                                    |
| `bun typecheck`                                                             | exit 0 — contract 7, database 41, backend **271** файл (0 ошибок), frontend Done 4.60 s                            |
| `cd backend && bun test`                                                    | exit 0 — **681 pass / 0 fail**, 82 файла, 36 227 expect                                                            |
| `cd backend && bun test src/__integration__` (RUN_DB_TESTS=1, `lists_test`) | exit 0 — **61 pass / 0 fail**, 13 файлов, 204 expect, 2.28 s; `setup-db.ts` → `✅ test database ready: lists_test` |
| `cd frontend && bun test src`                                               | exit 0 — **126 pass / 0 fail**, 21 файл, 199 expect                                                                |
| `cd frontend && bun run build`                                              | exit 0 — `build:types` (vue-tsc) Done 2.51 s, `build:ci` (vite) `✓ built in 974ms`                                 |

Команды integration — ровно из задания:
`RUN_DB_TESTS=1 TEST_DATASOURCE_URL='postgresql://le_xot:abc@127.0.0.1:5432/lists_test' bun run src/__integration__/setup-db.ts`,
затем `... bun test src/__integration__`.

## Пункт 1. Эквивалентность `createSuggestion`

Старый код (`108ebfa`) и новый путь:

| Аспект      | parent `createSuggestion`                                        | HEAD (делегирует `records.create`, `:15-38`)                         |
| ----------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| insert-поля | title, posterUrl, genre, link, status `QUEUE`, type `SUGGESTION` | те же + `extra: data.extra` (= `undefined`; drizzle колонку не шлёт) |
| дефолты БД  | grade/episode `NULL`, createdAt/updatedAt — БД                   | те же                                                                |
| ownership   | `insert` безусловно                                              | `insert` при `data.userId` (сервис всегда передаёт `user.id`)        |
| возврат     | `q.records.findFirst(..., with {suggestionOwnership, likes})`    | тот же запрос, но **вне** транзакции                                 |

Эмпирическая проба (временный spec в `/tmp/review-b7/backend/src/__integration__/`, удалён после прогона; БД `lists_test`):

```
KEYS = ["createdAt","episode","extra","genre","grade","id","likes","link","posterUrl",
        "status","suggestionOwnership","title","type","updatedAt"]
ROW  = title "T", posterUrl "P", genre "ANIME", link "L", status "QUEUE", type "SUGGESTION",
       extra null, grade null, episode null, likes [],
       suggestionOwnership {id, recordId, userId, createdAt}, hasUser=false
```

Совпадает с parent построчно: `extra` действительно `NULL` (как и при отсутствии колонки в insert), ownership без `user`, `likes` — пустой массив. Потерь нет.

Единственные отличия — не по полям, а по обвязке:

1. справочный `findFirst` теперь идёт после коммита `create`; если чтение упадёт, запись+ownership останутся (старый откатывал всё). На практике недостижимо: запись только что создана в этом же запросе; на внешний контракт не влияет.
2. внутренний текст `'Failed to create record'` вместо `'Failed to create suggestion'` — наружу не выходит: не-`HttpError` гейтвей отдаёт как `500 'Internal server error'` (`backend/src/gateway/index.ts:108-110`).

## Пункт 2. Полнота и порядок каскада удаления

Аудит FK на `records` (схема + сгенерированные миграции — расхождений нет):

| Таблица                 | FK на `records`                                                       | ON DELETE  | Чистится на HEAD                         |
| ----------------------- | --------------------------------------------------------------------- | ---------- | ---------------------------------------- |
| `likes`                 | `likes_recordId_fkey` (`likes.ts:29`)                                 | `restrict` | явно, `drizzle-record.repository.ts:110` |
| `record_ratings`        | `record_ratings_recordId_fkey` (`record-ratings.ts:36`)               | `restrict` | явно, `:111`                             |
| `suggestion_ownerships` | `suggestion_ownerships_recordId_fkey` (`suggestion-ownerships.ts:29`) | `cascade`  | каскадом (проверено тестом)              |

Подтверждение по миграциям: `database/migrations/0000_init.sql:84` (likes restrict), `:85` (ownerships cascade), `0007_tough_ender_wiggin.sql:11` (record_ratings restrict). Других таблиц с FK на `records` нет: `grep foreignColumns: [records.id]` даёт ровно эти три; `wordle_games` ссылается только на `users`.

Порядок `likes → record_ratings → records` корректен: оба `restrict`-ребёнка сносятся до родителя, поэтому FK не срабатывает ни в каком из двух сценариев. Ownerships не удаляются вручную намеренно — каскад проверен integration-тестом (`records.repository.integration.spec.ts:87-114`): после `repository.delete` в `suggestion_ownerships` 0 строк.

Канонизация завершена: в прикладном коде остался ровно один `delete(records)` — `drizzle-record.repository.ts:112`; старый метод удалён, вызовов `deleteSuggestionWithLikes` в коде нет (единственное вхождение — устаревшая строка карты, см. пункт 7). Второй `delete(records)` — только в `backend/src/__e2e__/seed.ts:71` (чистка e2e-данных, не приложение).

## Пункт 3. Мутационная проверка

**A. Старая реализация удаления предложения** (тело `deleteSuggestionWithLikes` из `108ebfa` под новым именем `deleteSuggestion`; файл восстановлен `git checkout -- .`):

```
RUN_DB_TESTS=1 ... bun test src/__integration__/suggestion.repository.integration.spec.ts
→ (fail) deletes the suggestion with its likes, ownership and ratings
  5 pass / 1 fail
  error: update or delete on table "records" violates foreign key constraint
  "record_ratings_recordId_fkey" on table "record_ratings"
  detail: Key (id)=(1) is still referenced from table "record_ratings".  code: "23503"
```

Это в точности заявленный 500: тест-ловушка падает на старом коде и проходит на новом.

**B. Дополнительно — канонический delete без `recordRatings`** (убрал `tx.delete(recordRatings)` из `drizzle-record.repository.ts`): падают **оба** новых теста (`13 pass / 2 fail`) — и record-каскад, и suggestion-путь. То есть обе ловушки стерегут инвариант «удаляя запись, снеси и оценки».

После каждого прогона — `git checkout -- .`, `git status` чистый; финальный прогон на нетронутом HEAD: `6 pass / 0 fail` по suggestion-spec и `61 pass / 0 fail` по всему `src/__integration__`.

## Пункт 4. API-поведение и WS

- `backend/src/gateway/suggestions.ts` **не менялся** (не в diff): `DELETE /suggestions/:id` (`:90-105`) — `RATE_LIMITS.public`, `requireAuthenticated`, успех `200: t.Void()` (это 200 с пустым телом, **не 204**, — так было и в parent).
- Статусы ошибок — те же: `NotFoundError` → 404 (`suggestion.service.ts:69-71`), `ForbiddenError` → 403 (`:74-77`), `BadRequestError` → 400 (`:79-81`). Маппинг в `gateway/index.ts` не тронут.
- WS: `emitWs(UPDATE_SUGGESTIONS, { id, action: 'deleted' })` (`suggestion.service.ts:86-89`) — байт-в-байт как в parent; unit-тест `suggestion.service.spec.ts:121-140` проверяет и вызов репозитория, и payload, и зелёный.
- Форма ответа на удаление и тексты ошибок — часть внешнего контракта; diff их не касается. `docs/api.md:130` (`DELETE /suggestions/:id`, user, public) не требует правки.

## Пункт 5. Чистота suggestion-репозитория и зависимости

- Импорты: `likes` снят; `records`, `suggestionOwnerships`, `limits`, `RecordStatus`, `RecordType`, `LimitDomain`, `RecordWithRelations` — все используются (подтверждено `bun lint` 0/0 и `bun typecheck`).
- Мёртвых методов/полей не осталось: `recordsRepository` используется в `createSuggestion`/`deleteSuggestion`; собственный `drizzle` по-прежнему нужен для limit/count/read-запросов — лишней зависимости нет.
- Цикла нет: направление `suggestion → record`, обратного импорта нет; `DrizzleRecordRepository` про suggestion ничего не знает. В composition root `recordRepository` создаётся раньше `DrizzleSuggestionRepository` (`container.ts:106`, `:113`).
- Конструктор suggestion-репозитория получил второй аргумент; все места конструирования обновлены (container + integration spec), в родителе их было ровно два.
- `as unknown as DrizzleService` в integration-spec — не новый паттерн: идиома была там же до правки (`new DrizzleSuggestionRepository({ db } as unknown as ...)`), теперь просто вынесена в `const drizzle`. В прикладном коде — нет.

## Пункт 6. Документация / карты

Коммит docs не трогает (docs-коммит по конвенции кампании идёт после ревью). На HEAD отстают:

- `docs/refactor/maps/backend.md:215-226` (B-09) — описывает дубль путей и `deleteSuggestionWithLikes:111-117`; после батча неактуально (строка `:220` — единственное оставшееся в репозитории упоминание старого имени).
- `docs/refactor/tasks.md:24` (B-03) — статус не проставлен (`commit 409ff26; ревью — reviews/batch-07.md`).
- `docs/refactor/progress.md` — журнал ведётся только до раунда 2; раунд с батчем 7 не добавлен.

Это ожидаемая работа closing docs-коммита (так же сформулировано в ревью батчей 3 и 4), код не блокирует.

## Замечания

1. **Не блокер — неточность сообщения коммита.** «…и удаление предложения с оценкой; **оба** падали бы на старом коде» верно только для suggestion-теста. Record-тест на parent (`108ebfa`) **проходит**: `drizzle-record.repository.ts` в этом коммите не менялся и ratings там удалялись уже тогда — это характеризующий тест канонического пути, а не ловушка старого бага. Ловушка ровно одна — `suggestion.repository.integration.spec.ts:94-121`, и она настоящая (пункт 3A). Commit message не правится без rebase; уточнить формулировку в `progress.md` при закрытии батча.
2. **Не блокер — атомарность `createSuggestion`.** Справочный `findFirst` вынесен из транзакции `create`: сбой чтения оставит созданные запись+ownership (старый вариант откатывал всё). Вероятность нулевая (запись только что создана этим же запросом), внешний контракт не страдает. Если хочется строгости — вернуть relations из `records.create` или обернуть create+read в одну транзакцию отдельным батчем.
3. **Не блокер — покрытие.** Оба теста сеют лайк **и** оценку одновременно; отдельного кейса «оценка без лайка» нет, хотя именно он даёт `restrict` по ratings. Канонический delete чистит обе таблицы независимо, так что регрессия этим не маскируется (мутация 3B падает и без правки likes-части). Опционально — параметризовать.

**Итог: APPROVE.** Старый путь удалён, дубль схлопнут в `DrizzleRecordRepository`, латентный 500 закрыт воспроизводимой ловушкой, внешние контракты неизменны, все прогоны и счётчики сходятся. Блокеров нет.
