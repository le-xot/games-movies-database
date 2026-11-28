# Ревью батча F-01 (batch 9) — `5346375` → **CHANGES REQUIRED**

|                  |                                                                                                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                |
| Коммит           | `5346375` (родитель — `f793bac`), 7 файлов, +261/−210                                                                                                                                                                                                                                               |
| Ревьюер          | `review-batch9` (не автор коммита; только diff, изолированный worktree и прогоны)                                                                                                                                                                                                                   |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                          |
| Что сделано мной | работал в `/tmp/review-b9` (detached `5346375`, `bun install --frozen-lockfile`), все прогоны там; исходники не менялись, коммитов нет; в основном дереве создан только этот отчёт; worktree после ревью удалён                                                                                     |
| Не запускалось   | Playwright e2e (по заданию), backend-тесты и интеграционные — в diff нет ни одного backend-файла                                                                                                                                                                                                    |
| Важно            | на старте ревью HEAD ветки = `5346375`, к концу — `b77235c` (параллельные `90c6c6c`, `4471595`, `df972f6`, `b77235c`). `df972f6` снял унаследованные мёртвые импорты `RotateCw` (блокер B1 ревью батча 8), поэтому гейт красный **на самом `5346375`, но не на ветке**. Номера строк — по `5346375` |

## Вердикт

**CHANGES REQUIRED.** Содержательная часть батча эквивалентна прежнему поведению и регрессий не несёт:
пагинация, ключи, запросы, мутации, `error`-семантика и покрытие `nextPageParam` перенесены точно,
старые копии удалены. Блокируют приёмку два **незакрытых пункта задачи F-01 / DoD** — оба чинятся 1–2
строками и без риска для поведения (см. проблемы B1, B2). После них — **APPROVE**.

### Блокер B1 — F-01 закрыт не полностью: `PAGE_SIZE` по-прежнему задан дважды

`docs/refactor/tasks.md:39` формулирует F-01 дословно: «…убрать `user-ratings-pagination`, **один `PAGE_SIZE`**»,
а `docs/refactor/maps/frontend.md:129` называет дубль энтропией: «`PAGE_SIZE = 50` задан в двух файлах».
Батч снял `user-ratings-pagination.ts`, но оба литерала остались:

```
frontend/src/composables/factories/create-records-store.ts:21: const DEFAULT_PAGE_SIZE = 50
frontend/src/pages/ratings/composables/use-user-ratings.ts:13: const PAGE_SIZE = 50
```

`useRecordsList` уже принимает `pageSize` (`records-list.ts:12`), так что единственного значения достаточно.
**Фикс:** экспортировать одну константу (например, `export const RECORDS_PAGE_SIZE = 50` из `records-list.ts`),
использовать её как `DEFAULT_PAGE_SIZE` в фабрике и передавать в `useUserRatings` (`use-user-ratings.ts:30`)
вместо локального `PAGE_SIZE`. Пока дубль жив, F-01 нельзя переводить в `done` по его же определению.

### Блокер B2 — батч осиротил два алиаса в `backend/src/api-types.ts`

Единственными потребителями `GetAllRecordsDTO` и `GetUserRatingsEntity` были ровно те файлы, которые
переписаны этим коммитом (`create-records-store.ts:4` и `use-user-ratings.ts:14` в родителе — по таблице
ревью батча 2). После `5346375` repo-wide поиск не находит ни одного импортёра (`git grep` по всему репозиторию,
кроме `docs/refactor`), т.е. оба алиаса мертвы:

```
backend/src/api-types.ts:14:  RecordsPage as GetAllRecordsDTO,
backend/src/api-types.ts:16: export type { RatingsPage as GetUserRatingsEntity } from '@backend/gateway/ratings'
```

Это прямо нарушает инвариант, записанный в шапке того же файла (`api-types.ts:8-9`): «только имена, которые
фронт реально импортирует из `@/lib/api`. Новый алиас добавляется вместе с потребителем», и правило
кампании 6 (deletion over accumulation). Прецедент: ревью батча 2 (`reviews/batch-02.md`, проблема 1) признало
такой же мёртвый алиас `UserCustomizationEntity` блокером. **Фикс:** удалить `RecordsPage as GetAllRecordsDTO`
и строку `GetUserRatingsEntity` — TypeBox-модели/типы гейтвея (`gateway/records.ts:66,123`,
`gateway/ratings.ts:51,73`) не затрагиваются.

## Что в коммите

- `frontend/src/composables/factories/records-list.ts` (новый, 117 строк): `RecordsListPage`/`RecordsListOptions`/
  `RecordsList`, `nextPageParam` (`:36-42`) и `useRecordsList` (`:49-117`) — один `useInfiniteQuery`
  (`initialPageParam: 1`, `placeholderData` под флагом `keepPreviousData`, `getNextPageParam` через
  `nextPageParam`, сброс `listError` в начале запроса, `loadNextPage` с защитой от двойного вызова).
- `frontend/src/composables/factories/record-mutations.ts` (новый, 54 строки): `useRecordMutations` —
  PATCH записи/постера, DELETE, тост на ошибку, `onChanged` на успех (`run`, `:28-35`).
- `create-records-store.ts`: `useInfiniteQuery`/`useMutation` удалены, осталась тонкая надстройка
  (`:50-72`); возвращаемая форма стора сохранена (`:77-88`).
- `use-user-ratings.ts`: `useInfiniteQuery`, `getNextRatingsPageParam`, три mutation-обёртки и `refetchAll`
  удалены; список (`:28-45`), мутации (`:47-54`), watcher'ы (`:56-68`), профиль-логин (`:60`) на месте.
- `records-list.spec.ts` (новый, 4 кейса) — перенос покрытия `nextPageParam`; `user-ratings-pagination.ts`
  и его спек удалены.
- Новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable` в diff нет; единственный `as unknown as`
  (`create-records-store.ts:88`) существовал в родителе с тем же комментарием. `git show --check 5346375` чист.

## Прогоны (в `/tmp/review-b9`, detached `5346375`, дерево после прогонов чистое)

| Проверка                        | Результат                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile` | exit 0 — `450 packages installed`                                                                                                                                                                                                                                                                                                                     |
| `bun lint`                      | exit 0 — `Found 0 warnings and 0 errors`, 439 файлов, 95 правил (родитель/батч 8 — 438; +3 новых −2 удалённых = +1)                                                                                                                                                                                                                                   |
| `bun format:check`              | exit 0 — `All matched files use the correct format`, 617 файлов (батч 8 — 616)                                                                                                                                                                                                                                                                        |
| `bun typecheck`                 | **exit 2** — frontend: `TS6133` ×3 в `MediaPage.vue:2`, `UserRatingsPage.vue:2`, `StatsPage.vue:2`; contract 7 / database 41 / backend 272 файла без ошибок. **Все три файла не тронуты этим коммитом** (`git diff 5346375^ 5346375 -- <они>` пуст), дефект унаследован от `41ae5e6` (блокер B1 ревью батча 8) и уже снят на ветке коммитом `df972f6` |
| `cd frontend && bun test src`   | exit 0 — **128 pass / 0 fail**, 21 файл, 200 `expect`. Ровно цифры батча 8 (128/21/200): −4 старых кейса пагинации +4 новых кейса `nextPageParam`, −1 файл +1 файл — потерь покрытия нет                                                                                                                                                              |
| `cd frontend && bun run build`  | **exit 1** — `build:ci` (vite 8.3.5) `✓ built in 946ms`, `build:types` (vue-tsc) падает теми же `TS6133`×3, `script "build" exited with code 1`; причина та же унаследованная, этим diff не вносится                                                                                                                                                  |
| `git show --check 5346375`      | чисто (whitespace-ошибок нет)                                                                                                                                                                                                                                                                                                                         |

Т.е. по собственному diff батч не добавляет ни одной диагностики; красный гейт на `5346375` — исторический
(батч 8) и на ветке уже закрыт `df972f6` (`3 files changed, 3 deletions` — ровно три импорта `RotateCw`).

## Пункт 1. Жанровые списки: поведение не изменилось

`create-records-store.ts` (родитель `:52-96` → HEAD `:50-72`):

| Механика           | Родитель                                                                     | HEAD                                                            | Дельта                   |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| `key`              | `[config.queryKey, paramsStoreInstance.params]`                              | то же (`:51`)                                                   | нет                      |
| `initialPageParam` | `1`                                                                          | `1` (`records-list.ts:65`)                                      | нет                      |
| `placeholderData`  | `(previous) => previous` всегда                                              | `keepPreviousData: true` (`:53`) → тот же `previous` (`:66-72`) | нет                      |
| `pageSize`         | `config.pageSize ?? DEFAULT_PAGE_SIZE` (50)                                  | те же 50 (`:48,:52`)                                            | нет                      |
| запрос             | `api.records.get({ query: {...params, page: pageParam, limit: pageSize} })`  | тот же вызов, `page`/`limit` — аргументы `fetchPage` (`:55-67`) | нет                      |
| `getNextPageParam` | `loadedCount = allPages.reduce(+page.records.length)`, `loadedCount < total` | тот же reduce по `page.items` (`records-list.ts:82-90`)         | нет                      |
| `loadNextPage`     | guard `isLoadingNext                                                         |                                                                 | !hasNextPage`, `finally` | идентично (`records-list.ts:94-105`) | нет |
| `retry`            | `() => refetch()`                                                            | `() => list.retry()` → `refetch()` (`records-list.ts:115`)      | нет                      |
| `items`            | `data.pages.flatMap(page => page.records)`                                   | `flatMap(page => page.items)`, `items = data.records` (`:66`)   | нет                      |
| ошибка             | `error` из colada-энтри, `Error \| null`                                     | `listError` из `parseApiError`, `string \| null`                | см. N1                   |

Потребители `error` проверены все: `MediaPage.vue:79-83` рендерит **жёстко заданный** `message="Не удалось
загрузить записи"` (значение ошибки не читает), `:100` — `:has-error="!!media.records.error"`, `DataCards.vue:17,171`
использует только булево `hasError`. Других чтений `records.error` в репозитории нет. Поэтому смена
`Error|null` → `string|null` **не меняет ни одного отображаемого текста** для жанров; для «Моих оценок» текст и
раньше был строкой из `parseApiError` с тем же fallback. Заявление коммита корректно.

## Пункт 2. `use-user-ratings`: построчное соответствие

| Механика                                  | Родитель                                                             | HEAD                                                              | Дельта                                |
| ----------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| `key`                                     | `[USER_RATINGS_QUERY_KEY, profileUserId, gradeFilter]`               | то же (`:29`)                                                     | нет                                   |
| `initialPageParam`                        | `1`                                                                  | `1` (`records-list.ts:65`)                                        | нет                                   |
| запросы                                   | `isMine ? ratings.my.get : ratings.users({id}).get`                  | те же две ветки (`:41-43`)                                        | нет                                   |
| `params`                                  | `page, limit: PAGE_SIZE, ...(gradeFilter?.length ? {grade} : {})`    | `page, limit, ...(gradeFilter?.length ? {grade} : {})` (`:35-39`) | нет (limit = 50)                      |
| ранний выход                              | `if (!profileUserId) return {items: [], total: 0}`                   | то же (`:33`)                                                     | нет                                   |
| `error`                                   | `ref<string \| null>`, сброс в начале query, `parseApiError` в catch | `listError` в `useRecordsList` (`:52,:74,:78`), тот же fallback   | нет (см. N1 — поведение унаследовано) |
| `total`                                   | `pages[last]?.total ?? 0`                                            | то же (`records-list.ts:109`)                                     | нет                                   |
| `profileLogin`                            | `items[0]?.userLogin ?? null`                                        | `list.items.value[0]?.userLogin ?? null` (`:60`)                  | нет                                   |
| title-watcher                             | `watch([isMine, profileLogin], …)`                                   | идентично (`:62-68`)                                              | нет                                   |
| сброс `gradeFilter` при смене профиля     | `watch(profileUserId, …)`                                            | идентично (`:56-58`)                                              | нет                                   |
| `refetch`                                 | `void refetchRatings()`                                              | `() => list.retry()` (`:87`), теперь возвращает промис            | только тип (лучше)                    |
| `isLoading`/`hasNextPage`/`isLoadingNext` | из `useInfiniteQuery`                                                | из `useRecordsList` (те же refs colada)                           | нет                                   |

`UserRatingsPage.vue` не менялся; его ветки (`v-if="error"` → `v-else-if="!isLoading && total === 0"` →
`template v-else`) получают те же значения. Единственная семантическая разница — `error` теперь живёт в общем
composable, а не в сторе (для «Моих оценок» это поведенчески эквивалентно, т.к. он и раньше был стор-level ref).

## Пункт 3. Мутации: контракты те же, но у жанров появился локальный refetch

Эндпоинты и payload'ы совпадают с родителем дословно (`record-mutations.ts:37-53`):

- `updateRecord` → `api.records({ id }).patch(payload.data)` (родитель: `patch(body)`, `body = payload.data`);
- `updatePoster` → `api.records({ id }).poster.patch({ url })`;
- `deleteRecord` → `api.records({ id }).delete()`;
- тексты тостов — те же, что у «Моих оценок»: «Не удалось обновить запись / постер / удалить запись».

Потребители мутаций — только шаблонные обработчики (`MediaPage.vue:101-103`, `UserRatingsPage.vue:50-52`),
никто не читает промис, нет `.catch`/`await`/`try` вокруг вызовов стора (проверено repo-wide). Поэтому
`Promise<void>` вместо `Promise<unknown>` ничего у потребителя не отнимает: для жанров раньше rejection
`mutateAsync` оставался необработанным (unhandled rejection), теперь показывается тост; для «Моих оценок»
поведение идентично прежнему (там ошибка уже глоталась и тостилась).

**Что изменилось у жанров:** `onChanged: () => list.retry()` (`create-records-store.ts:70-72`). Раньше жанровые
мутации не перезапрашивали список вообще — обновление приходило по WS. Оценка последствий — см. N2.

## Пункт 4. Удаление `user-ratings-pagination`: покрытие перенесено, ссылок нет

- `git grep "user-ratings-pagination\|getNextRatingsPageParam" -- . ':!docs/refactor'` на HEAD — **пусто**;
  в `docs/refactor` остались только recon-карты/задача (это нормальная дрейф-история, см. N5).
- Старый спек: 4 кейса (`nextPageParam`: 24/50→2; 50/50→undefined; все страницы 24+24+2→undefined; 0/0→undefined).
  Новый: те же 4 кейса (`records-list.spec.ts:4-21`), третий разложен на два `expect` с той же суммой
  (48/50→3, 50/50→undefined). Семантика идентична: `loadedCount` считается по **всем** страницам,
  сравнивается с `lastPage.total`.
- Арифметика прогонов подтверждает нулевую потерю: на батче 8 было 128 тестов/21 файл/200 expect;
  на HEAD — ровно 128/21/200 (−4 старых кейса, +4 новых; −1 файл, +1 файл).
- Единственная реализация `useInfiniteQuery`/`getNextPageParam` в фронте теперь одна — `records-list.ts`;
  в остальных местах (`create-records-store.ts`, `use-user-ratings.ts`) их нет (grep пуст).

## Пункт 5. Типы: ослабления нет

- `EntryKey` (`readonly JSONValue[]`) и `UseInfiniteQueryData` — собственные типы `@pinia/colada` 1.4.8;
  key-массивы `[string, params]`/`[string, string, RecordGrade[]|null]` под них проходят (typecheck
  ошибок не даёт). `useRecordsList<TItem>` выводит `TItem` из `fetchPage`, поэтому `items` остаётся
  `RecordEntity[]` для жанров и типом элемента `RatingsPage.items` для оценок — не шире родителя.
- `items: ComputedRef<RecordEntity[]>` → `RecordEntity[]` (`RecordsStoreReturn:30,44`) потребителю не видно:
  обе формы — setup-сторы, Pinia разворачивает refs, тип `media.records.items` был и остался `RecordEntity[]`.
  Единственный потребитель — `MediaPage.vue:73-74`, других нет.
- `error: string | null` читается только на истинность (`MediaPage.vue:79,100`) и как текст в
  `UserRatingsPage.vue:35` — тексты совпадают с родителем (там строка уже была строкой).
- Новых `any`/`as unknown as` нет; `TError = Error` при фактическом `throw Response` из `unwrap` —
  унаследованная неточность (была в родителе, `parseApiError` обрабатывает оба случая).
- `Promise<void>` у мутаций: см. пункт 3 — потерь обработки у потребителей нет.

## Пункт 6. Мёртвые остатки

- `useMutation` в переписанных файлах не осталось (`create-records-store.ts`, `use-user-ratings.ts` — пусто);
  в остальном фронте он используется по назначению (user/wordle/suggestion/cocktails/like).
- `GetAllRecordsDTO` в коде фронта больше не встречается (grep пуст); сам алиас в `api-types.ts` остался —
  см. B2.
- Дубль `PAGE_SIZE` — см. B1.
- `refetchVideos`/`refetchGames`/`itemsName`-алиасы сторов (`[config.refetchName]`, `videos`) — без вызовов,
  но это **не** регрессия батча: так было и в родителе (grep по `refetchVideos|refetchGames` находит только
  объявления в 5 сторах). Замечание на будущее, не блокер.
- `errorMessage: 'Не удалось загрузить записи'` для жанров фактически нигде не рендерится (`MediaPage` держит
  свою строку) — безвредно, но параметр «на будущее»; в «Моих оценках» он реально используется.

## Найденные проблемы

### Блокер B1 — два `PAGE_SIZE` (F-01 требует один)

См. раздел «Блокер B1» в вердикте. Правка — 1 константа + 2 использования; поведение не меняется.

### Блокер B2 — мёртвые алиасы `GetAllRecordsDTO` / `GetUserRatingsEntity`

См. раздел «Блокер B2» в вердикте. Правка — 2 строки в `backend/src/api-types.ts`; `vue-tsc`/lint
подтвердят отсутствие потребителей.

### N1. MEDIUM / не блокер — стор-level `listError` не привязан к ключу (новое для жанров)

В родителе `error` жанрового стора был ошибкой colada-энтри (`useInfiniteQuery` → `useQuery` →
`error: computed(() => entry.value.state.value.error)`), т.е. при смене `key` показ ошибки переключался сам.
Теперь `listError` — один ref на стор (`records-list.ts:52`), сбрасывается **только** в начале запроса
(`:74`). Смена ключа не гарантирует запрос: `useQuery` на смену энтри зовёт `refresh()`, а `refresh`
делает запрос лишь если `entry.state.value.error || entry.stale` (colada 1.4.8), при глобальном
`staleTime: 30_000` (`main.ts:37`). Сценарий: запрос для одного фильтра/пользователя упал → пользователь
переключается на фильтр/профиль, чья энтри ещё свежа (<30 с) → запроса нет, `listError` остаётся от
предыдущего ключа. Следствия:

- жанры: `MediaPage.vue:79` показывает полосу ошибки над валидным списком (`hasError` при этом подавляет
  «No results» в `DataCards.vue:171`);
- «Мои оценки»: `UserRatingsPage.vue:35` по `v-if="error"` **подменяет весь список** блоком ошибки.

Дополняет картину то, что colada пишет состояние только от «выигравшего» запроса (`if (pendingCall === entry.pending)`
в `fetch`), а `listError` присваивается из любого query-фн, включая уже вытесненный/прерванный — т.е. ошибка
может «прилипнуть» после успешного refetch. Для «Моих оценок» такое поведение было и раньше (не регрессия),
для жанров — новое. **Рекомендация:** сбрасывать ошибку при смене ключа (`watch(() => options().key, () => { listError.value = null })`)
либо хранить ключ рядом с текстом и показывать ошибку только для текущего. Не блокер: сценарий редкий и
самолечится ретраем/истечением `staleTime`.

### N2. MEDIUM / не блокер — жанровая мутация теперь перезапрашивает список дважды (локально + WS)

`onChanged → list.retry() → refetch()` (`records-list.ts:115`) для бесконечного запроса перезапрашивает **все**
загруженные страницы (`pagesToRefetch = data.pages.length` в colada). Параллельно backend на каждую мутацию
шлёт `UPDATE_RECORDS` (`record.service.ts:122` patch, `:139` poster, `:162` delete), мост публикует кадр в топик
всем подписчикам, включая автора (`gateway/ws.ts:61-70`), фронт инвалидирует ключ жанра
(`use-websocket.ts:50-58`) с coalescer'ом 150 мс (`use-event-coalescer.ts:7`), а `invalidateQueries` по
умолчанию рефетчит активные энтри (`refetchActive = true`, colada 1.4.8). Итог: до **2× полных перезапросов
списка** на одну мутацию (было: 0 локальных + один WS-перезапрос). Гонки при этом безопасны: второй `fetch`
абортит первый (`entry.pending?.abortController.abort()`), в стор пишет только последний, `keepPreviousData`
держит сетку и скелетон не мигает (`DataCards.vue:33` — скелетон только при пустых items). Т.е. «список
обновится дважды» сетевой ценой, а не видимым дублем. «Мои оценки» это поведение имели и раньше (локальный
refetch + WS-инвалидация), т.е. регрессия только жанровая и только по трафику. Варианты: (а) оставить как
осознанную унификацию; (б) для `records:*` инвалидировать без рефетча (`invalidateQueries(..., false)`), чтобы
источником истины остался локальный refetch; (в) для жанров не делать `onChanged`. Решение — за владельцем
кампании, в коде это 1 строка.

### N3. LOW / не блокер — у нового канона нет собственных тестов

Покрыт только чистый `nextPageParam` (4 кейса, перенос). У `useRecordsList` (сброс/формирование `error`,
`retry`, двойной вызов `loadNextPage`) и `useRecordMutations` (тост на ошибку, `onChanged` только на успех,
проброс payload'ов) тестов нет. DoD «на новый канон есть тест» выполнен частично. Не блокер: поведение
проверяемо только с моками colada/Pinia, а перенос покрытия формально не потерян.

### N4. LOW / не блокер — для жанров появился тост на ошибку мутации (UX-изменение)

Раньше жанровые мутации падали молча (только unhandled rejection), теперь показывают тост. Это осознанная
унификация (тексты — из «Моих оценок»), но по правилу кампании 2 «UX не меняется» это единственное видимое
изменение поведения; стоит зафиксировать в `progress.md`/раунде как намеренное.

### N5. LOW / не блокер — e2e-комментарии описывают старое поведение

`frontend/e2e/records.spec.ts:22` («локальная мутация обновляет список через WS-рефетч») и `:31`
(«у мутации нет локальной инвалидации… сквозная проверка сокета») после батча неверны: локальный refetch
теперь есть, поэтому тест на удаление больше не доказывает, что карточка исчезла именно по WS. Ассерты
остаются зелёными (карточка исчезает любым из двух путей), но смысл проверки размыт — комментарии/намерение
теста нужно обновить. Дрейф `docs/refactor/maps/*` (`maps/frontend.md:128-129`, `maps/hygiene.md:145,264`) и
`frontend/src/AGENTS.md:74` (список фабрик без `records-list`/`record-mutations`) закрывается отдельной
задачей G-04, не этим батчем.

### N6. LOW / не блокер — `messages` в `useRecordMutations` дублирует дефолты

`use-user-ratings.ts:49-53` передаёт ровно те же строки, что уже являются дефолтами `record-mutations.ts:41,46,51`.
Либо опция не нужна, либо строки должны отличаться. Безвредно, но это третья копия текстов в одном батче.

## Итог

Предмет батча — единый бесконечный список записей — реализован корректно: `key`, `initialPageParam`,
`placeholderData`/`keepPreviousData`, `pageSize`, `getNextPageParam`, `loadNextPage`-guard, `retry`, сборка
items, запросы my/users, ранний выход, `total`, `profileLogin`, title-watcher и сброс фильтра совпадают с
родителем; старые копии (`useInfiniteQuery`, `getNextPageParam`, три mutation-обёртки,
`user-ratings-pagination`) удалены без висячих ссылок, покрытие `nextPageParam` перенесено 4/4, тестовые
счётчики не изменились. Внешние контракты (HTTP/WS/БД/env) не затронуты; новых `any`/ассерций нет;
`lint`/`format`/unit-зелёные; `typecheck`/`build` красны только из-за унаследованного дефекта батча 8,
уже исправленного на ветке (`df972f6`). Блокируют приёмку два незакрытых пункта F-01 (B1 — дубль
`PAGE_SIZE`, B2 — два осиротевших алиаса `api-types`), оба — по 1–2 строки. После них и при зелёном гейте —
**APPROVE**.
