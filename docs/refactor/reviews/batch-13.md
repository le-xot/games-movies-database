# Ревью батча 13 (F-03) — `9737c78` + `a40fbfa` → **CHANGES REQUIRED**

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка       | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Предмет     | `9737c78` (fix после ревью батча 9, 4 файла, +8/−13) и `a40fbfa` (F-03 «реестр жанров», 21 файл, +412/−233); вместе 25 файлов, +420/−246                                                                                                                                                                                                                                                                                                                                                                                                       |
| Ревьюер     | `review-batch13` — не автор коммитов, обсуждения не видел; только diff, два изолированных detached-worktree и живые прогоны                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Дата        | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Что делал я | `/tmp/review-b13` (detached `a40fbfa`, `bun install --frozen-lockfile` → 450 пакетов, скопирован `backend/.env`) и `/tmp/review-b13-parent` (detached `9737c78`) для сравнения; дамп `router.getRoutes()` обоих деревьев временным спеком; production-сборка **обоих** деревьев и Playwright-проверка пяти жанровых страниц с моками `/api/*`; мутации обоих новых спеков с откатом; прогоны кампании. Временные спеки/скрипты жили только в `/tmp`, worktree удалены; в основном дереве создан только этот файл, код не менялся, коммитов нет |
| Не запускал | интеграционные тесты (`RUN_DB_TESTS=1`), `docker build`, штатный `bun run test:e2e` (вместо него — одноразовый Playwright-скрипт с моками бэкенда)                                                                                                                                                                                                                                                                                                                                                                                             |
| Важно       | Пока шло ревью, основной чекаут уехал вперёд (HEAD `75390c1`, раунды 14–17; в рабочем дереве — незакоммиченная правка `MediaPage.vue`). Номера строк ниже относятся к `a40fbfa`                                                                                                                                                                                                                                                                                                                                                                |

## Вердикт

**CHANGES REQUIRED.** `a40fbfa` переносит создание жанрового стора из `setup` в `computed` (строка 16–24 `MediaPage.vue`), а
`@pinia/colada` (1.4.8) вешает жизненный цикл запроса на `onMounted` компонента, которого в рендере нет. Итог: при
**прямом заходе** на любой жанровый URL (закладка, F5, новая вкладка, переход по внешней ссылке, back/forward) запрос
`GET /api/records` не уходит вообще, страница показывает «No results.», и стор остаётся мёртвым до перезагрузки —
переход на другой жанр и обратно его не оживляет. Через боковое меню баг маскируется hover-префетчем (префетч создаёт
стор вне рендера), поэтому вручную по сайдбару он не виден; ловится только прямым заходом. Всё остальное в батче
эквивалентно прежнему поведению: маршруты совпадают байт-в-байт, порядки/подписи/иконки, набор и ключи WS-обработчиков,
префетч, тесты и все обязательные прогоны — зелёные.

**Примечание к вердикту.** На момент завершения ревью в основном чекауте уже лежит ровно та правка, которую я вывел и
проверил: `media` снова `ref` + `watch(() => route.meta.genre, …, { immediate: true })` с комментарием про lifecycle-хуки
colada. В предмет ревью (`a40fbfa`) она не входит. Как только она закоммичена и рядом появляется ловушка (см. B1),
вердикт по батчу можно поднять до APPROVE без пересмотра остальных пунктов.

## Блокеры

### B1. Жанровый стор создаётся в `computed`, то есть во время рендера → colada не активирует запрос; прямые заходы на жанровые страницы пустые

**Где:** `frontend/src/pages/media/MediaPage.vue:16-24` — `computed`, в геттере которого вызываются
`GENRE_STORES[genre].useRecords()` / `.useParams()`. Механизм — `@pinia/colada@1.4.8` внутри `useInfiniteQuery`;
префетч и реестр ни при чём.

**Цепочка (по исходникам, версии из lockfile: Vue 3.5.44, colada 1.4.8):**

1. `media = computed(() => { … stores.useRecords() … })` — при первом рендере шаблона геттер вычисляется **в рендере**
   (`currentInstance === null`, `currentRenderingInstance === MediaPage`).
2. `useQuery` (а за ним `useInfiniteQuery`) читает `getCurrentInstance()`; в Vue 3.5 это
   `currentInstance || currentRenderingInstance` (`@vue/runtime-core…:8299`), то есть **truthy** — colada уверена, что
   вызвана в setup, и идёт в ветку «есть инстанс»: `onMounted(() => { isActive = true; … })`.
3. `onMounted` без `currentInstance` хук не регистрирует и пишет в консоль
   `[Vue warn]: onMounted is called when there is no active component instance to be associated with … at <MediaPage>`
   (в живом прогоне — три предупреждения: `onMounted`, `onUnmounted`, `onServerPrefetch`).
4. `isActive` навсегда остаётся `false`; `watchEntry(…, { immediate: true })` в colada начинается с `if (!isActive) return`
   — `refresh()` не вызывается ни сейчас, ни потом. Запроса нет.

**Живые доказательства (production-сборка обоих деревьев, API замокан, admin-пользователь):**

| Сценарий                                                              | parent `9737c78`                                          | HEAD `a40fbfa`                                                                |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Прямой заход `/db/games`                                              | `GET /api/records?genre=GAME…` → карточка «GAME ITEM»     | **0** запросов `/api/records`, в DOM «No results.»                            |
| Прямой заход → меню «Аниме» → назад «Игры»                            | —                                                         | «Аниме» грузится (`genre=ANIME`), «Игры» снова пусто, новых запросов — 0      |
| Меню (hover/клик) по всем пяти жанрам                                 | 5/5: запросы GAME→ANIME→MOVIE→SERIES→CARTOON, данные есть | 5/5 работает, но **только** потому, что hover-префетч создал стор вне рендера |
| Пять жанров через меню: стор/params/подпись удаления/episode-действие | совпадают                                                 | совпадают (пока стор создан префетчем)                                        |

**Проверка причинности:** в том же дереве `a40fbfa` я оставил реестр и `GENRE_STORES` нетронутыми и вернул только метод
создания стора в setup (`ref` + `watch(..., { immediate: true })`) → прямой заход сразу даёт
`GET /api/records?genre=GAME&type=WRITTEN&search=&orderBy=id&direction=desc&page=1&limit=50` и карточку. Правка откатана;
worktree удалён.

**Как чинить:** создавать сторы в setup, а не в рендере — `const media = ref<GenreMedia | null>(null)` +
`watch(() => route.meta.genre, (genre) => { … GENRE_STORES[genre].useRecords() … }, { immediate: true })`. Реестр жанров,
`GENRE_STORES` и контракты остаются; удаляется только «магия» с `computed`. Ровно это уже лежит в рабочем дереве
основного чекаута (см. примечание к вердикту).

**Ловушка (правило 5 кампании):** юнит-тест тут не поможет — в `bun:test` нет компонента, а префетч маскирует баг.
Нужен e2e «прямой заход» (`page.goto('/db/games')` без hover, ждём `GET /api/records` и карточку) на все пять путей;
инфраструктура `bun run test:e2e` в проекте уже есть. Без такой ловушки регрессия вернётся: `bun test src` (136 тестов)
и `typecheck` её не видят.

## Не блокеры

- **N1. Тесты реестра не проверяют соответствие `queryKey` ↔ `GENRE_QUERY_KEYS`.** Мутация `MOVIE.queryKey = 'films'`
  (значение уникальное, но неверное) — `genre-registry.spec` + `ws-handlers.spec` дают **8 pass / 0 fail**. Реальный
  эффект: `records:MOVIE` инвалидирует несуществующий ключ кэша, и страница фильмов не обновляется по сокету.
  Сейчас значения верны (runtime-дамп: у всех пяти `entry.queryKey === GENRE_QUERY_KEYS[g] === RECORDS_QUERY_KEYS[g]`),
  но машинной защиты нет, хотя именно `queryKey` — дубликат между `lib/genre-keys.ts` и реестром. Фикс: 2 строки в
  `genre-registry.spec` — `expect(GENRE_REGISTRY[genre].queryKey).toBe(GENRE_QUERY_KEYS[genre])` для всех жанров (или
  проверять аргументы **всех** `records:*` в `ws-handlers.spec`, а не только `ANIME`, как сейчас в `:24-30`).
- **N2. Порядки проверяются только как множество.** `genre-registry.spec:42-48` сравнивает `Set` жанров, поэтому
  дубликат при полном наборе проходит: `NAV_GENRES = [GAME, GAME, ANIME, MOVIE, SERIES, CARTOON]` → **8 pass**.
  Цена — пункт меню дважды. Фикс: `toHaveLength(GENRES.length)` + уникальность жанров в каждом порядке.
- **N3. Полнота WS-обработчиков держится на касте.** `ws-handlers.ts:43` — `handlers as Record<CoalescerKey, () => void>`
  обещает компилятору все ключи, а `createEventCoalescer` вызывает `handlers[target]?.()` — отсутствующий обработчик
  молча no-op. Фактически полноту ловит `ws-handlers.spec` (мутация «убрать SERIES из `GENRES`» → fail), поэтому это
  не блокер, но норма защищена тестом, а не типом. Ужесточение: `satisfies Record<CoalescerKey, () => void>` на
  собираемом объекте или типизированный reduce без каста.
- **N4. `use-db-navigation.ts:32` — `entry.path as RouterPath`.** Единственный новый каст в навигации, причина —
  `GenreEntry.path: string` (строка 18 реестра). Можно сохранить и похожие типы, и поиск по произвольной строке:
  `path: RouterPath` в `GenreEntry`, а `GENRES_BY_PATH = new Map<string, GenreEntry>(…)`. Мелочь.
- **N5. `WEBSOCKET_RESYNC_KEYS` — тот же массив, что `COALESCER_KEYS`, по ссылке** (`websocket-resync.ts:17,28`).
  `enqueueResync` только читает, так что сейчас безопасно; но любой `sort/splice` по «ресинк-списку» поедет и по
  «каноническому». Дешевле `[...COALESCER_KEYS]`.

Мелочь без номера: `SuggestionCard.vue:101-103` и `stats-constants.ts:7-9` строят карты через `Object.fromEntries` + каст;
значения эквивалентны прежним (проверено), но каст скрывает полноту — при желании закрывается тем же `satisfies`, что и N3.

## Что в коммитах

| Файл                                                                              | Δ       | Суть                                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/lib/genre-registry.ts` (новый)                                      | +146    | `GenreEntry` (genre/path/routeName/label/icon/hasEpisodeColumn/deleteConfirmTitle/queryKey/prefetch), `GENRES`, `NAV_GENRES`, `SUGGESTION_GENRES`, `GENRES_BY_PATH`, `genreLabel`, контракты сторов |
| `frontend/src/lib/genre-keys.ts` (новый)                                          | +13     | листовой `GENRE_QUERY_KEYS` (только импорт `lib/api`), разрывает цикл registry ↔ стор                                                                                                               |
| `frontend/src/pages/media/genre-stores.ts` (новый)                                | +30     | `GENRE_STORES` — единственное место статического импорта пяти пар сторов                                                                                                                            |
| `frontend/src/lib/genre-registry.spec.ts` (новый)                                 | +56     | 5 тестов полноты/уникальности/порядков/поиска по пути                                                                                                                                               |
| `frontend/src/composables/ws-handlers.ts` (новый)                                 | +44     | `buildWsHandlers` — инвалидаторы из реестра + статические группы                                                                                                                                    |
| `frontend/src/composables/ws-handlers.spec.ts` (новый)                            | +43     | 3 теста: покрытие `COALESCER_KEYS`, ключ жанра, статические группы                                                                                                                                  |
| `frontend/src/router/router.ts`                                                   | ±41     | `GENRE_ROUTES` из `GENRES` (path/name/meta.genre/meta.pageKey)                                                                                                                                      |
| `frontend/src/pages/media/MediaPage.vue`                                          | +29/−81 | `switch` → реестр + `GENRE_STORES`; **создание стора уехало в `computed` — см. B1**                                                                                                                 |
| `frontend/src/pages/media/media-prefetch.ts`                                      | ±20     | `prefetchers`-карта → `GENRES_BY_PATH.get(path)?.prefetch()`                                                                                                                                        |
| `frontend/src/components/layout/db/use-db-navigation.ts`                          | +7/−28  | пункты меню из `NAV_GENRES`, пять своих иконок удалены                                                                                                                                              |
| `frontend/src/pages/suggestion/components/SuggestionCard.vue`                     | +13/−44 | порядок групп из `SUGGESTION_GENRES`, подписи/иконки из реестра; две карты удалены                                                                                                                  |
| `frontend/src/pages/stats/constants/stats-constants.ts`                           | +4/−16  | `GENRE_ORDER`/`GENRE_LABELS` — деривативы `GENRES`                                                                                                                                                  |
| `frontend/src/components/palette/CommandPalette.vue`                              | ±4      | `GENRE_LABELS` → `genreLabel`                                                                                                                                                                       |
| `frontend/src/composables/query-keys.ts`                                          | ±6      | `RECORDS_QUERY_KEYS = GENRE_QUERY_KEYS` (алиас, живой потребитель — `use-rating.ts:13`)                                                                                                             |
| `frontend/src/composables/use-websocket.ts`                                       | +14/−34 | 11 инлайн-обработчиков → `buildWsHandlers`                                                                                                                                                          |
| `frontend/src/composables/websocket-resync.ts`                                    | ±7      | `COALESCER_KEYS` — единый список, `WEBSOCKET_RESYNC_KEYS` — алиас                                                                                                                                   |
| пять `use-{genre}.ts`                                                             | ±2      | `RECORDS_QUERY_KEYS` → `GENRE_QUERY_KEYS`                                                                                                                                                           |
| `backend/src/api-types.ts` (`9737c78`)                                            | −6      | удалены `GetAllRecordsDTO`, `GetUserRatingsEntity`                                                                                                                                                  |
| `create-records-store.ts` / `records-list.ts` / `use-user-ratings.ts` (`9737c78`) | +8/−8   | `RECORDS_PAGE_SIZE = 50` вместо двух локальных констант                                                                                                                                             |

`git show --check` по обоим коммитам чистый; новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable`, `oxlint-disable`
нет (grep по добавленным строкам) — есть четыре обычных `as`-каста (см. N3/N4 и мелочь). Новых зависимостей нет.

## Пункт 1. Маршруты — эквивалентны байт-в-байт

Временный спек поднимал настоящий `router` (с DOM-заглушкой, без `createWebHistory`-навигации) в обоих деревьях и
печатал жанровые записи. Вывод **идентичен** JSON-в-JSON:

```json
[
  { "path": "/db/anime", "name": "anime", "genre": "ANIME", "pageKey": "media" },
  { "path": "/db/cartoon", "name": "cartoon", "genre": "CARTOON", "pageKey": "media" },
  { "path": "/db/games", "name": "games", "genre": "GAME", "pageKey": "media" },
  { "path": "/db/movie", "name": "movie", "genre": "MOVIE", "pageKey": "media" },
  { "path": "/db/series", "name": "series", "genre": "SERIES", "pageKey": "media" }
]
```

`router.resolve({name})` в обоих деревьях даёт одинаковые `matched` (`/db` + жанровый путь). Порядок записей в
`children` изменился (было anime-first, стало games-first по `GENRES`) — на поведение не влияет: пути не пересекаются,
catch-all `/:pathMatch(.*)*` остался последним.

- `router.check.ts` не тронут; type-level проверки (`gamesPathCheck`, `@ts-expect-error` на неизвестном имени)
  компилируются — `bun typecheck` зелёный. `RouteNamedMap` по-прежнему объявлен вручную (`src/types/vue-router.d.ts:20-44`),
  поэтому генерация маршрутов из реестра его не рассинхронизирует; dev-проверка `EXPECTED_ROUTE_NAMES` в `router.ts:120-153`
  не менялась и все пять имён на месте.
- `prefetchRouteChunks` работает для жанровых путей: в production-сборке на hover пункта «Аниме» со страницы
  `/db/stats` запрашивается `MediaPage-*.js` — и в HEAD, и в parent.

## Пункт 2. MediaPage — матрица живого поведения

Production-сборки обоих деревьев, API замокан (пользователь-админ, на `/api/records?genre=X` — одна запись `X ITEM`),
переходы через сайдбар:

| Жанр (ссылка) | parent: запрос/данные | HEAD: запрос/данные | `hasEpisodeColumn` (действие «эпизод») parent / HEAD | Диалог удаления parent / HEAD |
| ------------- | --------------------- | ------------------- | ---------------------------------------------------- | ----------------------------- |
| Игры          | GAME / да             | GAME / да           | нет / нет                                            | «Удалить игру?» / то же       |
| Аниме         | ANIME / да            | ANIME / да          | да / да                                              | «Удалить анимешку?» / то же   |
| Фильмы        | MOVIE / да            | MOVIE / да          | нет / нет                                            | «Удалить кинчик?» / то же     |
| Сериалы       | SERIES / да           | SERIES / да         | да / да                                              | «Удалить сирик?» / то же      |
| Мультфильмы   | CARTOON / да          | CARTOON / да        | да / да                                              | «Удалить мультик?» / то же    |

В обоих деревьях после переключения в DOM не остаётся карточек предыдущего жанра (проверял по тексту заголовков),
стор и params — те же, что у прежнего `switch`: `games/use-games`, `anime/use-anime`, `movie/use-movie`,
`series/use-series`, `cartoon/use-cartoon` (+ соответствующие `-params`); `hasEpisodeColumn` = true только у
anime/cartoon/series; `deleteConfirmTitle` дословно совпадают с прежними ветками `createMedia`. DataCards-байндинги и
обработчики (`retry`/`loadNextPage`/`updateRecord`/`updatePoster`/`deleteRecord`) не менялись, разошлись только имена
полей (`media.entry.*`).

**Единственная разница — B1:** прямой заход (без hover-префетча) в HEAD не создаёт запрос, и после перехода на другой
жанр и обратно «умерший» стор не оживает (`reqs: ["ANIME"]`, «Игры» пустые). В parent прямой заход работает.
Механизм самого `computed` при этом корректен: реплика кода MediaPage на реальных `GENRE_STORES`/`GENRE_REGISTRY`
показала, что при смене `route.meta.genre` возвращается стор нового жанра, возврат к первому даёт тот же экземпляр,
`genre: undefined` → `null` — ломается не выбор стора, а его инициализация в colada.

## Пункт 3. Порядки, подписи, иконки — эквивалентны

Runtime-дамп HEAD против parent (временные спеки в обоих деревьях):

| Что                                   | parent                                                                                                   | HEAD                                                | Совпало      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------ |
| Меню (порядок/подпись/путь)           | Игры `/db/games`, Аниме `/db/anime`, Фильмы `/db/movie`, Сериалы `/db/series`, Мультфильмы `/db/cartoon` | `NAV_GENRES` даёт тот же список                     | да           |
| Иконки меню (svg-класс в живом DOM)   | `lucide-gamepad-2`, `lucide-japanese-yen`, `lucide-film`, `lucide-popcorn`, `lucide-baby`                | то же                                               | да, поимённо |
| `GENRE_ORDER` статистики              | `GAME, MOVIE, ANIME, CARTOON, SERIES`                                                                    | то же (`GENRES` в этом порядке)                     | да           |
| `GENRE_LABELS` статистики             | Игры/Фильмы/Аниме/Мультфильмы/Сериалы                                                                    | те же значения (`Object.fromEntries(GENRES)`)       | да           |
| `SUGGESTION_GENRES` (порядок советов) | `MOVIE, GAME, ANIME, CARTOON, SERIES`                                                                    | то же                                               | да           |
| Подписи/иконки групп советов          | статические карты `genreTitles`/`genreIcons`                                                             | из реестра; значения те же                          | да           |
| CommandPalette                        | `GENRE_LABELS[genre]`                                                                                    | `genreLabel(genre)` = `GENRE_REGISTRY[genre].label` | да           |

Спец `описывает каждый жанр` плюс `GENRES.satisfies Record<RecordGenre, GenreEntry>` держат полноту: убрать жанр из
`GENRE_REGISTRY` нельзя (мутация M8 — падают тесты, typecheck тоже). `genreLabel(undefined)` = `''`, как прежняя
`genre ? GENRE_LABELS[genre] : ''` (тест `:32-40`).

## Пункт 4. WS — эквивалентно прежнему

Runtime-дамп `buildWsHandlers` (11/11 ключей, invalidation-аргументы) против прежнего инлайн-объекта из `9737c78`:

| Ключ              | parent (`9737c78:…/use-websocket.ts`)          | HEAD (`buildWsHandlers`) |
| ----------------- | ---------------------------------------------- | ------------------------ |
| `suggestions`     | `['suggestion']`                               | `['suggestion']`         |
| `stats`           | `['stats']`                                    | `['stats']`              |
| `user`            | `userStore.refetchUser()`                      | `refetchUser()`          |
| `wordle`          | `['wordle/leaderboard']`                       | `['wordle/leaderboard']` |
| `friends`         | `['friends']`                                  | `['friends']`            |
| `user-ratings`    | `['user-ratings']`                             | `['user-ratings']`       |
| `records:GAME`    | `[RECORDS_QUERY_KEYS.GAME]` = `['games']`      | `['games']`              |
| `records:MOVIE`   | `[RECORDS_QUERY_KEYS.MOVIE]` = `['movie']`     | `['movie']`              |
| `records:ANIME`   | `[RECORDS_QUERY_KEYS.ANIME]` = `['anime']`     | `['anime']`              |
| `records:CARTOON` | `[RECORDS_QUERY_KEYS.CARTOON]` = `['cartoon']` | `['cartoon']`            |
| `records:SERIES`  | `[RECORDS_QUERY_KEYS.SERIES]` = `['series']`   | `['series']`             |

- `COALESCER_KEYS` = 11 значений, ровно прежний `WEBSOCKET_RESYNC_KEYS` (диапазон `9737c78` — те же строки);
  `COALESCER_KEYS === WEBSOCKET_RESYNC_KEYS` по ссылке (см. N5). `enqueueResync` не менялся.
- Полнота `buildWsHandlers` покрыта: мутация «убрать `SERIES` из `GENRES`» → `ws-handlers.spec:16` падает;
  мутация `ANIME.queryKey = 'games'` → падают и уникальность, и `ws-handlers.spec:24`. Дыра — N1 (не-ANIME жанры).

## Пункт 5. Циклы и чанки

- `lib/genre-registry.ts:1-7` — статических импортов сторов **нет**: lucide, `lib/api`, `lib/genre-keys`, `router-paths`
  и типы (`create-params-store`, `lib/api`, `vue`); сторы — только в `import()` внутри `prefetch` (5 штук).
- `lib/genre-keys.ts:1` — единственный импорт `@/lib/api`, больше ничего (проверено grep по `^import`).
- `pages/media/genre-stores.ts:12` — реестр импортируется только как `import type`, то есть edge исчезает в рантайме.
  Цикла registry ↔ стора нет; `vite build` зелёный (см. п. 8).
- Чанки не потяжелели: entry `78.2 kB` против `87.7 kB` у parent, `LayoutDatabase` `42.5 kB` против `44.3 kB` — HEAD
  меньше (иконки уехали из чанка меню в общий реестр, дублей нет). На hover жанрового пункта в обоих деревьях грузится
  `MediaPage`-чанк + те же пять чанков сторов (`use-games`, `use-movie`, `use-anime`, `use-cartoon`, `use-series`) —
  поведение tree-shaking идентично, лишнего не тянет.

## Пункт 6. Тесты — мутации

Мутации в `/tmp/review-b13`, после каждой — `git checkout` (дерево чистое, проверено `git status`):

| #   | Мутация                                                    | Ожидание | Факт                                                    |
| --- | ---------------------------------------------------------- | -------- | ------------------------------------------------------- |
| M1  | `MOVIE.path = ROUTER_PATHS.dbGames` (дубликат пути)        | fail     | **2 fail** (уникальность + поиск по пути)               |
| M2  | убрать `CARTOON` из `NAV_GENRES`                           | fail     | **1 fail** (`содержит все жанры в каждом порядке`)      |
| M3  | `NAV_GENRES = [GAME, GAME, ANIME, MOVIE, SERIES, CARTOON]` | fail     | **8 pass** — дыра, N2                                   |
| M4  | убрать `SERIES` из `GENRES`                                | fail     | **3 fail**, в т.ч. `ws-handlers: покрывает каждый ключ` |
| M5  | `ANIME.queryKey = GENRE_QUERY_KEYS[GAME]`                  | fail     | **2 fail** (уникальность + ws-ключ ANIME)               |
| M6  | `MOVIE.queryKey = 'films'` (уникальный, но неверный)       | fail     | **8 pass** — дыра, N1                                   |
| M8  | удалить запись `CARTOON` из `GENRE_REGISTRY`               | fail     | **2 fail**                                              |

Тесты не тавтологичны: реестровый спек реально ловит дубликат пути, пропущенный жанр в реестре и в каждом порядке;
ws-спек ловит пропущенный обработчик и подмену ключа (кроме M6/N1).

## Пункт 7. Префетч

`prefetchMediaRecords` → `GENRES_BY_PATH.get(path)?.prefetch()`; карта построена из `GENRES`, а пути — те же
`ROUTER_PATHS.db*`, поэтому ключи карты совпадают с прежними. Живой прогон HEAD: hover пункта «Игры» → тот же
`GET /api/records?genre=GAME&type=WRITTEN&search=&orderBy=id&direction=desc&page=1&limit=50`, что и в parent, и тот же
стор (`use-games`-чанк), после клика данные берутся из уже прогретого запроса. `prefetchRouteChunks` дополнительно
грузит `MediaPage`-чанк (см. п. 1). Так что «тот же стор, что у прежних prefetchers» — подтверждено.

## Пункт 8. Прогоны (чистое дерево `/tmp/review-b13`, detached `a40fbfa`, временные спеки удалены)

| Проверка                                                         | Результат                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun install --frozen-lockfile`                                  | exit 0 — `450 packages installed [112.00ms]`                                                                                               |
| `bun lint`                                                       | exit 0 — `0 warnings and 0 errors`, 443 файла, 96 правил                                                                                   |
| `bun format:check`                                               | exit 0 — `All matched files use the correct format`, 636 файлов                                                                            |
| `bun typecheck` (кеш `vue-tsc` **удалён** перед прогоном)        | exit 0 — contract 7 / database 41 / backend 275 файлов, `frontend:typecheck Done in 5.61s` (холодный старт)                                |
| `cd frontend && bun test src`                                    | exit 0 — **136 pass / 0 fail**, 23 файла, 256 expect                                                                                       |
| `cd frontend && bun run build`                                   | exit 0 — `build:types Done in 3.42s`, `build:ci ✓ built in 1.39s` (первый прогон упал только из-за моего временного спека — перепроверено) |
| `cd backend && bun test`                                         | exit 0 — **712 pass / 0 fail**, 86 файлов, 36296 expect                                                                                    |
| Production-сборка parent + Playwright (моки API)                 | 5/5 жанров: запрос, данные, подпись удаления, episode-действие                                                                             |
| Production-сборка HEAD + Playwright, прямой заход на `/db/games` | **0 запросов `/api/records`, «No results.»** — B1                                                                                          |

## Пункт 9. Мелочи и `9737c78`

- Мёртвых импортов/удалённых карт нет: `createMedia`, `genreTitles`, `prefetchers` — grep 0; `Baby/Film/Gamepad2/
  JapaneseYen/Popcorn` больше не импортируются в `use-db-navigation.ts` и `SuggestionCard.vue` (иконки живут в реестре);
  oxlint — 0 предупреждений.
- `RECORDS_QUERY_KEYS` не удалён, а сделан алиасом `GENRE_QUERY_KEYS` — у него живой потребитель `use-rating.ts:13`
  (`Object.values`), это не параллельный источник, а имя. `GENRE_LABELS`/`GENRE_ORDER` в stats остались экспортами,
  но стали деривативами реестра (эквивалентность проверена).
- **`9737c78` чистый.** `RECORDS_PAGE_SIZE = 50` (`records-list.ts:6`) совпадает с прежними `DEFAULT_PAGE_SIZE` и
  `PAGE_SIZE`; все потребители переведены, других литералов размера страницы в `frontend/src` нет. Удалённые из
  `backend/src/api-types.ts` алиасы `GetAllRecordsDTO`/`GetUserRatingsEntity` не имеют ссылок ни во `frontend/`, ни в
  `contract/`; одноимённые идентификаторы в `gateway/records.ts:66` и `gateway/ratings.ts:51` — это **имена Elysia-моделей**
  (`t.Object`-ключи), не тип-алиасы, к удалению отношения не имеют. `bun typecheck`/тесты/сборка зелёные.

## Итог

Реестр жанров как идея и как миграция — состоялся: маршруты, меню, порядки, подписи, иконки, WS-ключи и префетч
эквивалентны прежнему коду (проверено дампами, мутациями и живым браузером, а не чтением diff), старые карты и
`switch` удалены, два новых спека реально ловят канонические мутации. Но `a40fbfa` меняет момент создания жанрового
стора, и это ломает загрузку данных на прямом заходе в жанровый раздел — то есть UX, который батч обязывался не
менять. Блокер один (B1), чинится возвратом создания стора в setup — ровно эта правка уже лежит в основном дереве
незакоммиченной; к ней нужна e2e-ловушка «прямой заход». N1 (защита `queryKey`) и N2 (дубликаты в порядках) стоит
закрыть двумя-тремя строками в `genre-registry.spec`, N3–N5 — на усмотрение владельца.
