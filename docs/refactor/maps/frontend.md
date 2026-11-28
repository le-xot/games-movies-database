# Карта frontend

> **Снимок рекона (батчи 1–2).** Актуальное состояние — `tasks.md` и `progress.md`;
> часть находок уже закрыта (см. таблицу «Сделано»).

**Снимок:** 2026-11-28, worktree `chore/code-cleanup` (ветка от `master`), каталог `frontend/src`.
**Охват:** `pages/*`, `components/*` (вне `ui/`), `composables/*`, `stores/*`, `lib/api.ts`, `utils/`, `router/`, `types/`.
**Метод:** чтение кода + граф импортов (`@/` и относительные) + подсчёт повторов grep'ом. Файлы не менялись.
**Пометки:** `[?]` — вывод не проверен рантаймом (только по коду); каждая находка содержит `file:line`.

## 1. Обзор

Фронт — Vue 3 SPA на 13 маршрутных страницах (`media/MediaPage.vue` обслуживает 5 жанров), 28 компонентах вне
`ui/` (2774 строки), 19 примитивах shadcn (1736 строк) и 24 store-id (14 литеральных `defineStore` + 10 инстансов двух фабрик).

**Что уже сделано хорошо — не предлагать заново.** Единый рендер жанровых разделов (`pages/media/MediaPage.vue`

- `composables/factories/`), централизованный WS с догоняющим ресинком (`app.vue:5` → `use-websocket` →
  `websocket-resync`), Eden без кодогена с конвертом ошибок (`lib/api.ts:56-84`), единый словарь query-ключей
  (`composables/query-keys.ts`), нетронутые shadcn-примитивы, почти полное отсутствие типовых дыр
  (`as any` — 0, `@ts-ignore` — 0, `as unknown as` — 1 документированный), минимум мёртвых файлов.
  Проверено: `components/ui/**` не содержит прикладной логики; `type`-уровневые страховки
  (`factories.check.ts`, `badge.check.ts`, `router.check.ts`) на месте.

**Где сосредоточена энтропия.** (1) Дубли «ещё один такой же экран»: список записей (`createRecordsStore`
против `useUserRatings`), блоки ошибки/ретрая (7 копий), поиск (3 копии), пустые состояния (5 реализаций).
(2) Жанровая предметная область размазана по 10 существующим файлам: новый жанр = 11 правок в них + 2 новых файла,
часть правок тихо деградирует.
(3) Несколько владельцев одного состояния: заголовок документа (7 мест + SEO на бэкенде), диалоги (4 store-а),
«дождаться `/me`» (2 реализации), палитра домена (2 источника, синхронизируются комментарием).
(4) Дизайн-токен `--n-action-color` используется 20 раз и нигде не объявлен.

**Что проверили и не подтвердили** (чтобы не искать заново — эти подозрения из брифа сняты):

- «Пять одинаковых жанровых страниц» больше нет: каждый `pages/{genre}/` — это 2 файла-обёртки по 7 и 12 строк
  (`pages/anime/composables/*`), рендер общий `pages/media/MediaPage.vue`. Дубль жанра не в страницах, а в реестре (F-2).
- Prop-drilling глубже одного уровня отсутствует: единственная цепочка — `DataCards` → `MediaCard`
  (`components/media/DataCards.vue:141-150`); остальное — прямой байнд из стора в компонент.
- `components/ui/**` под приложение не патчился: 19 примитивов, 1736 строк, прикладных импортов внутри нет;
  единственное расширение — дополнительные `size` в `ui/button/index.ts:19-27`.
- Ручных типов «вместо Eden» почти нет: `pages/cocktails/types.ts:8-20` выводит типы из самих запросов; каст-точки —
  только `friendsCounts`/`counts` (F-11) и документированный `as unknown as` в фабрике.
- Мёртвых страниц и компонентов нет; неиспользованных экспортов — один тип (`MatchedIngredient`,
  `pages/cocktails/types.ts:18`) плюс намеренные type-check маркеры; мёртвые баррели — F-19.
- Дубли ниже порога батча: `getInitials` (`MediaCard.vue:176`) и `initials` (`CommandPalette.vue:120`);
  CSS-переменные вордли дословно продублированы в `WordleGame.vue:201-218` и `WordlePractice.vue:157-175`
  (комментарий-признание на `WordlePractice.vue:156`). Внесены сюда, чтобы не открывать повторно.

## 2. Карта страниц и компонентов

| Маршрут                                   | Страница (строк)                                 | Данные / владелец                                                                                       | Особенность                         |
| ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `/`                                       | `pages/home/HomePage.vue` (62)                   | `use-weather` (plain + модульный кэш), `constants/home-items.ts`                                        | свой `useTitle` из `@vueuse`        |
| `/pc`                                     | `pages/pc/PcPage.vue` (123)                      | статика `constants/parts-links.ts` (202)                                                                | свой `useTitle`                     |
| `/db/admin`                               | `pages/admin/AdminPage.vue` (127) + 3 компонента | `use-admin-users`, `use-merge-accounts`, `use-steam-sync` (plain, `ref`-состояние)                      | 3 параллельных loading/error        |
| `/db/suggestion`                          | `pages/suggestion/SuggestionPage.vue` (109)      | `use-suggestion` (Pinia 188) + `SuggestionCard.vue` (440)                                               | стор импортирует Vue-компоненты     |
| `/db/{games,anime,movie,cartoon,series}`  | `pages/media/MediaPage.vue` (112)                | `use-{genre}` + `use-{genre}-params` (5×19 строк, фабрики)                                              | `switch` в `MediaPage:22-62`        |
| `/db/stats`                               | `pages/stats/StatsPage.vue` (246) + 4 компонента | `use-stats` + `stats-aggregates` + `stats-constants`                                                    | 3 одинаковых построителя сегментов  |
| `/db/friends`                             | `pages/friends/FriendsPage.vue` (229)            | `use-friends` + `friends-members`                                                                       | свой sort/search в шаблоне          |
| `/db/ratings/my`, `/db/users/:id/ratings` | `pages/ratings/UserRatingsPage.vue` (63)         | `use-user-ratings` (Pinia 146, внутри `useRoute`)                                                       | дубль `createRecordsStore`          |
| `/db/wordle`                              | `WordlePage.vue` (13) → `WordlePlay`             | `use-wordle` (335) + 5 composables + 13 компонентов                                                     | 4 query + 3 mutation в одном сторе  |
| `/tg/wordle`                              | `WordleMiniAppPage.vue` (88)                     | `lib/telegram-webapp.ts`                                                                                | своя оболочка без сайтовой          |
| `/db/cocktails`                           | `CocktailsPage.vue` (276) + 6 компонентов        | `use-cocktail-bar` (318), `use-cocktail-match` (152), `use-cocktail-catalog`, `cocktail-filter` (plain) | самый аккуратный раздел             |
| `/auth/callback/{twitch,kick}`            | `pages/auth/OAuthCallback.vue` (130)             | `providers`-карта + `useUser`                                                                           | дублирует каркас `TelegramCallback` |
| `/auth/callback/telegram`                 | `pages/auth/TelegramCallback.vue` (63)           | `useUser`                                                                                               | —                                   |

**Компоненты (вне `ui/`).** `media/` 10 файлов / 1098 строк: `DataCards` (197) + `MediaCard` (326) — единственный
список карточек, используется двумя страницами; фильтры `Search`/`FilterStatus`/`FilterGrade`/`FilterPopover` —
тонкие и переиспользуемые. `layout/db/` 5 файлов + `use-db-navigation.ts` (120) — навигационная модель и там же
заголовки/иконки/лейблы жанров. `palette/` — `CommandPalette` (231) + 3 composable. `account/` 8 файлов,
`wordle/` 13, `cocktails/` 6, `stats/` 4, `home/` 2, `admin/` 3, `form/` 2, `dialog/` 2, `user/` 1.

**Мёртвые баррели (`index.ts` без потребителей).** `components/media/index.ts`, `components/media/badge/index.ts`,
`components/layout/index.ts`, `components/dialog/index.ts`, `composables/index.ts`, `stores/index.ts`,
`utils/index.ts`, `components/ui/slider/index.ts` — при этом `frontend/src/AGENTS.md:80` предписывает импорт
через баррели, а 45 импортов идут напрямую в `.vue`. Реально используются только
`components/{account,form,palette,ui/*}`.

## 3. Карта состояния и потоков данных

**Четыре уровня владения (смешаны без правила).**

| Уровень                | Где                                                                         | Состав                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Pinia в `stores/`   | 6 файлов                                                                    | `global/use-user`, `global/use-title`, `global/use-new-records`, три boolean-модалки                                                                              |
| B. Pinia вне `stores/` | 8 файлов                                                                    | `dialog`, `use-badge-select`, `friends/use-friends`, `queue/use-like`, `queue/use-suggestion`, `ratings/use-user-ratings`, `stats/use-stats`, `wordle/use-wordle` |
| C. Фабрики             | `composables/factories/`                                                    | 10 инстансов: `anime/use-anime{,-params}` … `movies/use-movie{,-params}`                                                                                          |
| D. Plain-функции       | cocktails (4), admin (3), home (1), nav (1), palette (1), `use-rating`      | свежее состояние на каждый вызов                                                                                                                                  |
| E. Модульные синглтоны | `use-wordle-settings.ts:5`, `use-wordle-drag.ts:20`, `use-weather.ts:34-51` | состояние без владельца, живёт между вызовами                                                                                                                     |

**Поток данных.** `lib/api.ts` (Eden) → `@pinia/colada` query с ключом из `composables/query-keys.ts` → store →
страница → `DataCards` → `MediaCard`. Мутации **записи** живут в пяти семьях: фабрика
(`create-records-store.ts:87-106`), `useUserRatings` (`:98-123`), `useSuggestion` (`:66-134`), плюс `useRating`
(голоса) и `useLike` (лайки советов) — единого «record mutation» слоя нет.
**WS-поток:** `app.vue:5` → `use-websocket.ts` (сокет + backoff) → `invalidationKeysFor` (`websocket-resync.ts:41`)
→ `createEventCoalescer` (150 мс) → `queryCache.invalidateQueries`. Повторный коннект догоняет через
`WEBSOCKET_RESYNC_KEYS` (`websocket-resync.ts:17-25`).
**Предзагрузка** разбросана по трём местам: `router.prefetchRouteChunks` (`router.ts:142-150`),
`pages/media/media-prefetch.ts:7-18` (только 5 жанров), `main.ts:61-65` (только «Советы»).
**Заголовок документа** ставится из семи мест (см. F-6), SEO-заголовки — отдельно на бэкенде
(`backend/src/server/page-meta.ts:41-101`), общего источника нет.

```
 Eden api ──► colada query [ключ] ──► store ──► страница ──► DataCards ──► MediaCard
   ▲              ▲                    │            │            │
   │              │                    │            └─ props/emit (мутации вверх)
   │              └── invalidate ◄─────┴── WS: app.vue → use-websocket → coalescer (150 мс)
   └── mutations: factories | useUserRatings | useSuggestion | useRating | useLike (5 семей)
```

**Матрица «где живёт жанр»** (для батча F-2; номера строк — evidence):

| Слой       | Файл:строка                                                                       | Что именно                                              |
| ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| маршрут    | `router/router.ts:86-114`                                                         | 5 записей: `path`, `name`, `meta.genre`, `meta.pageKey` |
| путь       | `router/router-paths.ts:6-10`, `types/vue-router.d.ts:31-35`, `router.ts:164-168` | три копии строк                                         |
| поведение  | `pages/media/MediaPage.vue:22-62`                                                 | стор, `hasEpisodeColumn`, текст подтверждения           |
| префетч    | `pages/media/media-prefetch.ts:7-18`                                              | 5 динамических импортов                                 |
| кэш        | `composables/query-keys.ts:15-21`                                                 | 5 ключей                                                |
| WS         | `composables/use-websocket.ts:49-58`                                              | 5 обработчиков                                          |
| меню       | `components/layout/db/use-db-navigation.ts:42-46`                                 | 5 лейблов + иконок                                      |
| статистика | `pages/stats/constants/stats-constants.ts:3-26`                                   | порядок, лейблы, цвета                                  |
| советы     | `pages/suggestion/components/SuggestionCard.vue:88-94,113-119,121-127`            | порядок, лейблы, иконки                                 |
| данные     | `pages/{anime,cartoon,games,movie,series}/composables/*`                          | 10 файлов по 7 и 12 строк                               |

## 4. Находки

### F-1. Список записей реализован дважды: фабрика `createRecordsStore` и `useUserRatings`

**Симптом.** Один и тот же экран (`DataCards` + бесконечная пагинация + 3 mutation + фильтр оценки) написан дважды: жанровые разделы через фабрику, «Мои оценки»/«Оценки пользователя» — отдельным стором с копией всей механики.
**Evidence.** `composables/factories/create-records-store.ts:52-73` (`useInfiniteQuery`), `:69-72` (`getNextPageParam`), `:77-85` (`loadNextPage`/`isLoadingNext`), `:87-106` (`updateRecord`/`deleteRecord`/`updatePoster`), `:123` (`retry`) — против `pages/ratings/composables/use-user-ratings.ts:31-60`, `:62-72`, `:98-123`; `pages/ratings/composables/user-ratings-pagination.ts:9-10` повторяет `create-records-store.ts:69-72`; одинаковые байндинги `pages/media/MediaPage.vue:98-110` и `pages/ratings/UserRatingsPage.vue:48-60`.
**Энтропия.** Любая правка списка (лимит, retry, оптимистичное обновление) делается в двух местах; `PAGE_SIZE = 50` задан в двух файлах (`create-records-store.ts:21`, `use-user-ratings.ts:16`).
**Лечение.** Один `useRecordsList({ key, fetchPage, itemsName? })`, из него — фабрика для жанров и `useUserRatings`; фильтр оценки — параметр, а не отдельная копия. **Риск:** med (две страницы + e2e). **Ценность:** L.

### F-2. Жанр описан в 10 файлах: новый жанр — 11 правок в них плюс два новых файла

**Симптом.** Знание «какие есть жанры и чем они отличаются» размазано: маршруты, мета, `switch`, префетч, query-ключи, WS-обработчики, навигация, статистика, карточка советов, две файловые пары на жанр.
**Evidence.** `router/router.ts:86-114` (5 маршрутов + `meta.genre`/`pageKey`); `pages/media/MediaPage.vue:22-62` (`switch` + `hasEpisodeColumn` + `deleteConfirmTitle`); `pages/media/media-prefetch.ts:7-18`; `composables/query-keys.ts:15-21`; `composables/use-websocket.ts:49-58`; `components/layout/db/use-db-navigation.ts:42-46` (лейблы + иконки); `pages/stats/constants/stats-constants.ts:3-26` (порядок + цвета); `pages/suggestion/components/SuggestionCard.vue:88-94`, `:113-119`, `:121-127` (порядок + лейблы + иконки); `pages/{anime,cartoon,games,movie,series}/composables/*` (10 файлов); `components/palette/CommandPalette.vue:13` тянет `GENRE_LABELS` из **страничных** констант статистики.
**Энтропия.** Добавление жанра (`contract` + БД) даёт в лучшем случае пустую страницу: префетч и WS-инвалидация про новый жанр не знают, `switch` вернёт `null`, лейблы разойдутся. Лейблы жанров существуют в трёх словарях, иконки — в двух.
**Лечение.** Один `genre-registry.ts` (значение `RecordGenre` → `{ path, label, icon, hasEpisode, palette, prefetch }`), из него генерируются маршруты, навигация, мета и обработчики WS. **Риск:** med. **Ценность:** L.

### F-3. Палитра домена — в двух источниках, порядок оценок — в трёх списках

**Симптом.** Цвета и лейблы статусов/оценок заданы дважды — Tailwind-классами в бейджах и hex-литералами в статистике; порядок оценок — третьим списком в карточке.
**Evidence.** `components/media/badge/composables/use-badge-select.ts:30-60` (`bg-[#2b593f]` и т.п.), `:62-87` (`RecordGrade.*`), `:91` (`${tag.name} ${tag.label}`); `pages/stats/constants/stats-constants.ts:19` — комментарий «Цвета согласованы с палитрой бейджей (use-badge-select)», `:36-43`, `:52-57` — те же hex; `components/media/MediaCard.vue:180` — свой `gradeOrder`, `:184` — `bg.replace('bg-', 'border-')`; `utils/friends-rating.ts:8-13` — третий список `FRIENDS_GRADE_ORDER`; `pages/stats/StatsPage.vue:51-52` — повторная склейка `name + label`.
**Энтропия.** Переименование/смена цвета оценки = 3-4 правки в разных слоях, ломается молча (комментарий — не проверка). Дополнительно `STATUS_ORDER` (`stats-constants.ts:28-34`) не содержит `NOTINTERESTED` при полном `STATUS_COLORS` (`:36-43`) — статистика его скрывает; намеренно ли — не проверено `[?]`.
**Лечение.** Один `status/grade` словарь (лейбл, emoji, цвет в одном виде — hex или токен), из него и классы бейджей, и графики; тип-уровневая проверка на полноту `Record<RecordStatus, …>`. **Риск:** med (контракт `@gmdb/contract` не трогать — словарь фронтовый). **Ценность:** M.

### F-4. Токен `--n-action-color` используется 20 раз и нигде не объявлен

**Симптом.** Фон карточек/панелей задаётся `bg-[var(--n-action-color)]`, но такой CSS-переменной нет ни в `assets/index.css`, ни в `index.html`, ни в компонентах.
**Evidence.** 20 вхождений в 13 файлах, напр. `components/media/DataCards.vue:111`, `components/media/MediaCard.vue:189`, `pages/stats/StatsPage.vue` (5 раз), `pages/friends/FriendsPage.vue:132`, `pages/cocktails/CocktailsPage.vue:198`; `assets/index.css:161-200` (`@theme inline`) токена не содержит; `grep --n-action-color:` по репозиторию — 0 определений. `[?]` фактический вид (прозрачный фон vs наследование) рантаймом не проверялся.
**Энтропия.** Дизайн-решение «фон карточки» не имеет источника; любой, кто захочет поменять фон, будет править 20 arbitrary-values, а не токен.
**Лечение.** Объявить токен в `@theme inline` (`--color-action-surface: …`) и заменить `bg-[var(--n-action-color)]` на `bg-action-surface`. **Риск:** low. **Ценность:** M (дёшево, 20 мест одним батчем).

### F-5. Пять способов обработки ошибки и семь одинаковых блоков «Повторить»

**Симптом.** Ошибки обрабатываются: `parseApiError` → локальный `error` (6 файлов), самописный `extractErrorMessage` (wordle), только `console.error` (admin/account), `toast.error` с текстом на месте (карточки), тихий `catch` (`/me`).
**Evidence.** `utils/api-error.ts:10`; `pages/wordle/composables/use-wordle.ts:33-41` — синхронный дубль (не умеет `Response`-конверт); `pages/admin/composables/use-admin-users.ts:27-28`, `:56-58` — только `console.error` и проглатывание; `pages/stats/composables/use-stats.ts:26` — `'Failed to load stats'`, `pages/suggestion/composables/use-suggestion.ts:49` — `'Failed to load suggestions'` (в остальных местах русский fallback); `components/account/ConnectedAccounts.vue:34`, `:55`; `components/media/MediaCard.vue:169-170`; `stores/use-user.ts:22-27` — `catch → null`. Ретрай руками 7 раз: `pages/media/MediaPage.vue:79-88`, `pages/suggestion/SuggestionPage.vue:48-57`, `pages/cocktails/CocktailsPage.vue:196-213`, `pages/friends/FriendsPage.vue:120-126`, `pages/ratings/UserRatingsPage.vue:35-41`, `pages/stats/StatsPage.vue:157-163`, `pages/admin/AdminPage.vue:53-59` (+ wordle `WordlePractice.vue:90`).
**Энтропия.** Текст ошибки и поведение ретрая нельзя поменять централизованно; часть ошибок вообще не доходит до UI, часть — по-английски.
**Лечение.** Один `useAsyncState`/`toUiError` + компонент `<ErrorRetry :error @retry>`; `extractErrorMessage` удалить; fallback-строки — в одном словаре. **Риск:** low. **Ценность:** M/L (7-9 экранов одним батчем).

### F-6. Заголовок документа ставят семь мест, у жанровых страниц его нет

**Симптом.** `document.title` управляется стором `useTitle`, напрямую `@vueuse` `useTitle()` в страницах и императивно в навигации; для 5 жанровых маршрутов заголовок появляется только по клику в меню.
**Evidence.** `stores/use-title.ts:4-13`; `components/layout/db/use-db-navigation.ts:104-117` (`handleNavClick` + `syncTitleFromRoute`), вызывается один раз при монтировании — `components/layout/db/LayoutDatabase.vue:13`; `pages/home/HomePage.vue:9,16` (`useTitle` из `@vueuse`), `pages/pc/PcPage.vue:10`, `pages/admin/AdminPage.vue:15-16`; `pages/friends/FriendsPage.vue:30-31`; `pages/ratings/composables/use-user-ratings.ts:86-92`. SEO-заголовки — отдельно: `backend/src/server/page-meta.ts:41-101`.
**Энтропия.** Back/forward, палитра и прямой заход дают устаревший title; лейбл в меню («Игры») и SEO-заголовок («Игры Лешота — оценки и мнения») — разные словари без связи.
**Лечение.** `meta.title` в маршруте + один afterEach в роутере; страничные `useTitle` убрать; лейблы меню брать из того же registry (F-2). **Риск:** low (визуально; SEO не меняется). **Ценность:** M.

### F-7. WS-инвалидация: два реестра ключей и тихий no-op для незарегистрированного жанра

**Симптом.** Группы кэша перечислены дважды: союз `CoalescerKey` + список ресинка (генерируется из `Object.values(RecordGenre)`) и словарь обработчиков (перечислен руками). Несовпадение не ломает типы и молча теряет обновления.
**Evidence.** `composables/websocket-resync.ts:4-12` (union), `:14` (`RECORD_GENRES = Object.values(RecordGenre)`), `:17-25` (`WEBSOCKET_RESYNC_KEYS`); `composables/use-websocket.ts:41-60` — обработчики только для 5 жанров и 6 групп; `composables/use-event-coalescer.ts:16` — `handlers[target]?.()` (undefined = тихий no-op).
**Энтропия.** Добавили жанр или группу кэша — ресинк после реконнекта «работает», но для новой группы ничего не делает; тест `websocket-resync.spec.ts` это не поймает.
**Лечение.** Один `QUERY_GROUPS: Record<CoalescerKey, () => void>` и union, выведенный из него (`satisfies`), ресинк — `Object.keys`. **Риск:** low/med (WS-протокол не меняется). **Ценность:** M.

### F-8. Четыре диалога-состояния одинаковой формы; стор импортирует Vue-компоненты

**Симптом.** Три boolean-модалки (`isOpen` + `open/close`) и общий `useDialog` с `title/description/component`; отдельно стор советов импортирует компоненты формы и справочника сервисов.
**Evidence.** `stores/use-account-dialog.ts:6-22`, `stores/use-login-dialog.ts:4-20`, `stores/use-command-palette.ts:4-25`, `components/dialog/composables/use-dialog.ts:14-46`; `pages/suggestion/composables/use-suggestion.ts:9-10` (`import SuggestionForm`, `SupportedServices`), `:21-33` (`openSuggestionDialog` из стора).
**Энтропия.** Состояние UI-оболочки размножено копипастой; логика данных знает о разметке (нельзя переиспользовать стор без Vue-компонентов, ломается слоистость).
**Лечение.** `createDialogState(id)` для трёх boolean-модалок; из `use-suggestion` вынести композицию диалога в страницу/компонент. **Риск:** low. **Ценность:** S.

### F-9. Pinia-сторы разъехались: 8 из 14 объявлены вне `stores/`, id без схемы

**Симптом.** `frontend/src/AGENTS.md:51-62` описывает 6 сторов в `stores/`, фактически `defineStore` вызывается в `pages/*/composables/` и `components/*/composables/`; идентификаторы в четырёх стилях.
**Evidence.** id: `dialog` (`components/dialog/composables/use-dialog.ts:14`), `use-badge-select` (`components/media/badge/composables/use-badge-select.ts:89`), `friends/use-friends`, `queue/use-like`, `queue/use-suggestion`, `ratings/use-user-ratings`, `stats/use-stats`, `wordle/use-wordle`; фабричные — `anime/use-anime-params` (`pages/anime/composables/use-anime-params.ts:5`) против `movies/use-movie-params` (`pages/movie/composables/use-movie-params.ts:5`).
**Энтропия.** Нет предсказуемого места, где искать состояние; «anime» в единственном числе, «movies» во множественном — один и тот же домен назван по-разному; docs расходятся с кодом.
**Лечение.** Зафиксировать правило («стор фичи живёт рядом с фичей, `stores/` — только глобальные») и обновить AGENTS.md; имена — `<domain>/<name>`. **Риск:** low. **Ценность:** S (но дёшево закрывает расхождение docs↔code).

### F-10. `SuggestionCard.vue` (440) + `use-suggestion` (188): смешаны слои, дублируется mutation-обвязка

**Симптом.** Карточка одновременно принимает данные пропсами, сама дергает 4 стора и открывает диалоги, аннулирует лайки с ручным throttle, анимирует через `querySelector` и хранит собственные словари жанров. Стор держит 5 мутаций с одинаковым try/catch и двумя мутациями с **одинаковым ключом**.
**Evidence.** `pages/suggestion/components/SuggestionCard.vue:30-39` (props + 4 стора), `:42-43` (`LIKE_THROTTLE_MS`, `likeThrottleTimestamps`), `:46` (`document.querySelector`), `:56-109` (группировка/сортировка), `:149-169` (лайк с throttle), `:171-196` (admin-действия из стора); `pages/suggestion/composables/use-suggestion.ts:80` и `:98` — `key: [SUGGESTION_QUERY_KEY, 'delete']` у двух разных мутаций, `:136-170` — 4 почти идентичных обработчика с toast.
**Энтропия.** Самый большой компонент — самый связанный; одинаковый mutation-key делает состояние мутаций недостоверным `[?]`; throttle продублирован рядом с `@vueuse` (`refDebounced` уже используется в `create-params-store.ts:33`).
**Лечение.** Разделить: `SuggestionGroup` (рендер) + `useSuggestionActions` (мутации) + группировка/сортировка в тестируемый `.ts`; уникальные mutation-keys; `useThrottleFn`. **Риск:** med (UI-поведение лайков). **Ценность:** M.

### F-11. `MediaCard.vue` (326) — god-компонент: мутация оценки, два диалога редактирования, admin-меню, парсинг серий

**Симптом.** Одна карточка отвечает за рейтинг друзей, редактирование серий/постера, admin-действия, отрисовку эпизодов посимвольно и форматирование — при том, что данные приходят пропсами.
**Evidence.** `components/media/MediaCard.vue:52-88` (EditState + диалог), `:110-116` (подтверждение удаления), `:135-150` (friends counts + касты), `:152-174` (rating mutation), `:178`/`:180-185` (инициалы, порядок оценок, вывод `border-` из `bg-`), `:250-258` (посимвольный regex по эпизоду), `:276-303` (вторая панель оценок), `:309-325` (диалог). Каст `props.item.friendsCounts as FriendsCounts` (`:136`) повторяет `pages/friends/friends-members.ts:13` — корень в схеме бэкенда `Record(t.String(), t.Number())` (`backend/src/gateway/records.ts:46`).
**Энтропия.** Любое изменение карточки трогает 4 несвязанных сценария; каст приходится повторять в каждом новом потребителе `friendsCounts`.
**Лечение.** `RecordRatingBar`, `RecordAdminActions`, `RecordEpisodeInput`, `RecordCardActions`; типизировать `friendsCounts` на контракте (осознанно, зона схемы). **Риск:** med (визуальные регрессии). **Ценность:** M.

### F-12. `DataCards` (197): два почти идентичных скелетона, магические числа, протёкший `hasError`

**Симптом.** Скелетон-сетка написана дважды (первичная загрузка и «догрузка»), размеры строк/порог автоподгрузки — числа в теле скрипта, а флагом «не показывать пустое состояние» управляет страница.
**Evidence.** `components/media/DataCards.vue:110-128` против `:153-165` (те же классы, разное число карточек), `:30` (`skeletonCount = 5`), `:74` (`estimateSize: () => (columns.value === 1 ? 640 : 520)`), `:92` (`LOAD_MORE_THRESHOLD = 600`), `:17` (`hasError?: boolean` — приходит из `MediaPage.vue:105`).
**Энтропия.** Правка скелетона — в двух местах; «пусто vs ошибка» решает страница, хотя знает это список.
**Лечение.** `<RecordGridSkeleton :count :class>`; порог и оценка высоты — константы модуля; `hasError` убрать, пустое состояние показывать только когда `!isLoading && !error` (внутри). **Риск:** low. **Ценность:** S.

### F-13. Поиск руками три раза, пустые состояния — пять реализаций

**Симптом.** Общий `Search.vue` есть, но три экрана рисуют поле с иконкой заново; «пусто» рисуется пятью способами, включая английский текст и инлайн-позиционирование.
**Evidence.** `components/media/Search.vue:28-38` — против `pages/friends/FriendsPage.vue:82-94`, `pages/cocktails/CocktailsPage.vue:224-235`, `pages/admin/components/MergeUserPicker.vue:66-76`. Пустые состояния: `components/media/DataCards.vue:170-175` (`No results.`), `pages/friends/FriendsPage.vue:145-151`, `pages/ratings/UserRatingsPage.vue:43-45`, `pages/stats/StatsPage.vue:165-167`, `pages/suggestion/SuggestionPage.vue:90-107` (+ инлайн `style="position:absolute;top:50%…"` на `:94`); при этом generic-компонент `pages/cocktails/components/CocktailEmptyState.vue:5-20` уже есть, но заперт в фиче.
**Энтропия.** Поведение поиска (очистка, `type=search`, ARIA) расходится; пустое состояние нельзя сделать единообразным.
**Лечение.** `Search` перенести в `components/ui`/`components/form` как generic-поле; `CocktailEmptyState` → `components/EmptyState.vue`; тексты — в словарь. **Риск:** low. **Ценность:** S.

### F-14. Router: пути, имена и guard-флаги существуют в четырёх копиях

**Симптом.** Один маршрут описан в `router-paths.ts`, литералом в `router.ts` (auth-колбэки), в `vue-router.d.ts` и в `EXPECTED_ROUTE_NAMES`; права доступа (`requiresAuth`/`hideForAdmin`) заданы и в мете маршрута, и в навигационной модели.
**Evidence.** `router/router.ts:14,20,26` — литеральные пути; `:51` — `redirect` на `ROUTER_PATHS.dbSuggestion`; `:88,94,100,106,112,118,123` — литеральные имена в `name:`; `:153-176` (`EXPECTED_ROUTE_NAMES`) + `:178-187` (dev-проверка); `types/vue-router.d.ts:19-43` — `RouteNamedMap` с путями; `router/router-paths.ts:1-19`; дубль флагов: `router.ts:78` (`meta: { requiresAuth: true, hideForAdmin: true }`) против `components/layout/db/use-db-navigation.ts:51-57` + `:87-90`.
**Энтропия.** Переименование маршрута — 4 правки, одна из которых (d.ts) ломает типы только при `vue-tsc`, другая (`EXPECTED`) — только warning в dev. Флаги видимости могут разойтись молча.
**Лечение.** Один массив `ROUTES` (path, name, meta) → генерация `ROUTER_PATHS` и `RouteNamedMap`; nav берёт права из `route.meta`, а не хранит свои. **Риск:** med (`vue-router` типы, e2e). **Ценность:** M.

### F-15. Auth-колбэки дублируют каркас; путь Mini App и ключ `loginReturnUrl` — литералами

**Симптом.** Две страницы-колбэка повторяют один сценарий (loading/error/toast/возврат), ключ `loginReturnUrl` пишется/читается строкой в 4 файлах, путь `/tg/wordle` объявлен дважды.
**Evidence.** `pages/auth/OAuthCallback.vue:57-120` против `pages/auth/TelegramCallback.vue:13-44` (та же пара `error`/`isLoading`, те же тосты «Вход выполнен»/«Аккаунт привязан»); `'loginReturnUrl'` — `components/account/ConnectedAccounts.vue:41`, `components/form/LoginDialog.vue:21`, `OAuthCallback.vue:97,102,107`, `TelegramCallback.vue:28,29,33,34`; `lib/telegram-webapp.ts:11` (`TELEGRAM_MINI_APP_PATH = '/tg/wordle'`) против `router/router-paths.ts:18`.
**Энтропия.** Новый провайдер копирует 40 строк; опечатка в ключе хранилища = потерянный возврат без ошибки; правка пути Mini App требует двух файлов.
**Лечение.** `useAuthCallback()` (общий каркас) + `STORAGE_KEYS.loginReturnUrl`; `TELEGRAM_MINI_APP_PATH` брать из `ROUTER_PATHS`. **Риск:** med (auth-зона — менять без смены механики). **Ценность:** S.

### F-16. «Дождаться `/me`» реализовано дважды и по-разному

**Симптом.** Стор пользователя умеет ждать завершения запроса через `whenQuerySettled`, а guard роутера пишет собственный `Promise.race([watch…, timeout])` с тем же таймаутом 1500 мс.
**Evidence.** `stores/use-user.ts:45-58` (`whenQuerySettled`), `:60-69` (`fetchUser`); `router/router.ts:200-215` (watch + `setTimeout(1500)`); `main.ts:15` (`AUTH_BOOT_TIMEOUT_MS = 1500`) — третий экземпляр той же константы.
**Энтропия.** Изменение семантики ожидания (таймаут, «гость после 401») делается в трёх местах; guard не использует уже готовый API стора.
**Лечение.** `await userStore.whenQuerySettled()` в guard (с внутренним таймаутом) — удалить локальную копию и константу. **Риск:** low/med (маршрутизация). **Ценность:** S.

### F-17. Кэш погоды руками вместо colada

**Симптом.** Единственное место с собственным кэшем: модульный `cached` + TTL + 12 отдельных `ref`, инициализируемых из этого кэша; `@pinia/colada` с `gcTime`/`staleTime` уже настроен глобально.
**Evidence.** `pages/home/composables/use-weather.ts:34-51` (`let cached`, `cachedAt`, `WEATHER_CACHE_TTL_MS`), `:70-72` (проверка TTL в `onMounted`), `:82` (`* 0.750062` — магическое число), `:96-111` (пересборка кэша вручную).
**Энтропия.** Второй механизм кэширования в проекте; TTL не связан с общим `staleTime` (30 с, `main.ts:37`); тестировать это без компонента нельзя.
**Лечение.** `useQuery(['weather'], …, { staleTime })` в `pages/home/composables/`, состояние — один объект; конверсия hPa→мм рт. ст. — именованная константа. **Риск:** low. **Ценность:** S.

### F-18. Хранилище: три механизма, ключи литералами, `main.ts` владеет чужими ключами

**Симптом.** `useStorage`/`useLocalStorage` из `@vueuse`, сырой `localStorage` и `sessionStorage` используются одновременно; ключи — строки на местах; `main.ts` очищает ключи, объявленные в других модулях.
**Evidence.** `components/layout/db/LayoutSidebar.vue:15`, `stores/use-new-records.ts:5`, `pages/suggestion/SuggestionPage.vue:28`, `pages/admin/composables/use-steam-sync.ts:26` (vueuse) против `stores/use-user.ts:36,41-43`, `pages/wordle/composables/use-wordle-settings.ts:3-5`, `pages/cocktails/composables/use-cocktail-bar.ts:43-57` (сырой); `main.ts:20` — `KEYS_TO_CLEAR = ['viewed-suggestions', 'suggestion-sort-by']`, при этом `viewed-suggestions` объявлен в `use-new-records.ts:5`, а `suggestion-sort-by` — в `SuggestionPage.vue:28`; `stores/use-account-dialog.ts:4` + `AccountDialog.vue:26-27` (sessionStorage).
**Энтропия.** Сброс версии (`main.ts:22-28`) молча перестанет чистить ключ, если переименовать его в фиче; тест этого не увидит.
**Лечение.** `lib/storage-keys.ts` с константами (их импортируют и владельцы, и `KEYS_TO_CLEAR`); чтение/запись — через `useStorage`. **Риск:** low. **Ценность:** S.

### F-19. Мёртвые абстракции: 8 баррелей без потребителей, `BadgeSelect`-прослойка, неиспользуемый `ui/slider`

**Симптом.** Баррели-файлы созданы, но импортов через них нет (при этом AGENTS.md требует обратное); `BadgeSelect.vue` — 23 строки пересылки пропсов в `BadgePopover`; примитив `slider` нигде не используется.
**Evidence.** Список неиспользуемых `index.ts`: `components/media/index.ts`, `components/media/badge/index.ts`, `components/layout/index.ts`, `components/dialog/index.ts`, `composables/index.ts`, `stores/index.ts`, `utils/index.ts`, `components/ui/slider/index.ts`; `components/media/badge/BadgeSelect.vue:8-22` дословно повторяет `BadgePopover.vue:16-21`; `components/ui/slider/index.ts:1` — `grep Slider` вне `ui/slider` не находит потребителей.
**Энтропия.** 45 прямых импортов `.vue` против 0 импортов через эти 8 баррелей: формально «баррель есть», фактически канон — прямой импорт, и новый участник не понимает, какой способ правильный; плюс лишний слой в цепочке карточки.
**Лечение.** Удалить неиспользуемые баррели и `slider`; `BadgeSelect` схлопнуть в `BadgePopover`; AGENTS.md привести к факту. **Риск:** low (проверяется `vue-tsc`). **Ценность:** S.

## 5. Кандидаты в пул задач

| #   | Задача                                       | Находки                                         | Канонизировать                                                 | Ловушка (защита)                                                                   | Риск |
| --- | -------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---- |
| 1   | `useRecordsList` — один список записей       | F-1, F-12, часть F-5                            | фабрика + `useUserRatings` на одном composable                 | unit на `getNextPageParam`/retry; e2e «Мои оценки» и жанр                          | med  |
| 2   | `genre-registry.ts`                          | F-2, часть F-3/F-6/F-14                         | один реестр: path, label, icon, meta, prefetch, WS             | `satisfies Record<RecordGenre, …>`; тест, что у каждого `RecordGenre` есть маршрут | med  |
| 3   | Доменный словарь status/grade                | F-3                                             | один источник лейбла/emoji/цвета/порядка                       | `Record<RecordStatus, …>` + тест палитры                                           | med  |
| 4   | Токены вместо arbitrary values               | F-4 (+ инлайн-цвета в `MediaCard`, `DataCards`) | `@theme` токены `action-surface`, `skeleton`                   | визуальная проверка тёмной темы                                                    | low  |
| 5   | `<ErrorRetry>` + `toUiError`                 | F-5                                             | один путь ошибки для query и mutation                          | unit на `parseApiError`, удалить `extractErrorMessage`                             | low  |
| 6   | Заголовок из `route.meta`                    | F-6                                             | `meta.title` + `afterEach`                                     | тест `document.title` на 3 маршрутах; SEO не трогать                               | low  |
| 7   | WS-группы из одного словаря                  | F-7                                             | `QUERY_GROUPS` как источник union                              | тест «каждый ключ из union имеет обработчик»                                       | low  |
| 8   | Диалоги                                      | F-8                                             | `createDialogState` + вынести UI из `use-suggestion`           | e2e открытия трёх модалок                                                          | low  |
| 9   | Router SSOT                                  | F-14                                            | один массив `ROUTES` → paths + d.ts                            | `router.check.ts` остаётся; e2e deep-link                                          | med  |
| 10  | `STORAGE_KEYS`                               | F-18, часть F-15                                | константы ключей в одном файле                                 | тест: `KEYS_TO_CLEAR` ⊆ ключей модуля                                              | low  |
| 11  | Auth-каркас колбэков                         | F-15                                            | `useAuthCallback` + `TELEGRAM_MINI_APP_PATH` из `ROUTER_PATHS` | e2e OAuth-возврата (если есть)                                                     | med  |
| 12  | Удалить мёртвое                              | F-19                                            | без баррелей, `BadgePopover` вместо `BadgeSelect`              | `bun typecheck` + `bun lint`                                                       | low  |
| 13  | Погода на colada                             | F-17                                            | `useQuery` вместо модульного кэша                              | unit на конверсию давления                                                         | low  |
| 14  | `await userStore.whenQuerySettled()` в guard | F-16                                            | одна реализация ожидания                                       | тест guard на «гость»                                                              | low  |

## 6. Что не трогать

- `components/ui/**` (1736 строк, 19 примитивов) — shadcn-vue, прикладной логики нет. Расширения — только через
  обёртки (`components/user/UserAvatar.vue` — правильный пример) или варианты в `index.ts` (`ui/button/index.ts:19-27`).
- `composables/websocket-resync.ts` (маппинг событий → ключи) и `use-event-coalescer.ts` — покрыты спеками
  (`websocket-resync.spec.ts`, 131 строка); менять только вместе с тестами и без изменения WS-протокола.
- `lib/api.ts:56-84` (`unwrap`/`assertOk`) — конверт ошибок является внешним контрактом; переписывать нельзя.
- `contract/` — пакет без зависимостей; «удобные» словари фронта туда не переносить (см. F-3: словарь — фронтовый).
- `pages/wordle/composables/use-wordle*.ts`, `wordle-constants.ts` — игровая логика с тестами; в уборке не участвуют.
- `lib/telegram-webapp.ts` (auth/Mini App) — зона повышенной осторожности, менять только по F-15 (дубль константы).
- `pages/pc/constants/parts-links.ts` — данные, не логика; `pages/home/constants/home-items.ts` — тоже (но его
  инлайн-цвета `:style="{ backgroundColor: item.color }"`, `HomePage.vue:47` — кандидат в батч токенов, не в рефакторинг).
- Типовые страховки `factories.check.ts`, `badge.check.ts`, `router.check.ts` и `as unknown as` в
  `create-records-store.ts:129` (документирован комментарием `:113-115`) — это намеренные механизмы, не «касты».
- `assets/index.css:202-210` (autofill hack) — не удалять. Светлая тема (`index.css:90-124`) недостижима, так как
  `frontend/index.html:2` жёстко ставит `class="dark"`: это отдельное решение о теме, а не уборка `[?]`.
- Не перевозить все сторы в `stores/` ради буквы AGENTS.md: выгода меньше цены переноса 8 файлов с импортами
  (F-9 закрывается правилом + правкой документации).
