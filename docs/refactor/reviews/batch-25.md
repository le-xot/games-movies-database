# Ревью батча 25 (F-08: маршруты из одной таблицы) — `4e37e88` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`; ревью — detached `4e37e88` в `/tmp/review-b25`, основной чекаут занят параллельной разработкой                                                                                                                                                                                                                                                                                                    |
| Коммит           | `4e37e88` (родитель `97c5ebc`), 7 файлов, +314/−226                                                                                                                                                                                                                                                                                                                                                                     |
| Ревьюер          | `review-batch25` (не автор; только diff, изолированный worktree, собственные прогоны, мутации, браузерная проверка)                                                                                                                                                                                                                                                                                                     |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                              |
| Что сделано мной | `git worktree add --detach /tmp/review-b25 4e37e88`; `bun install --frozen-lockfile` (450 пакетов, lockfile не поехал); отдельно собран родитель `97c5ebc` (`/tmp/review-b25-parent`) для рантайм- и браузерного сравнения. Все мутации откачены (`git status` пуст, `git diff 4e37e88` пуст), оба временных дерева и preview-серверы удалены. В основном дереве создан только этот отчёт; код не менялся, коммитов нет |
| Не запускалось   | Playwright e2e (не входил в список; требует поднятых серверов и бэкенда) — вместо него deep-link проверен в живом Chromium на прод-сборке обоих коммитов (см. «Пункт 5»). `bun run build` для родителя гонялся только `build:ci` (сравнение поведения, не типов)                                                                                                                                                        |
| Важно            | на момент ревью основной чекаут — `4e37e88` с незакоммиченными правками `docs/refactor/progress.md`, `docs/refactor/tasks.md` и чужими отчётами `batch-24.md`, `batch-26.md` от параллельной разработки (не мои, не трогал)                                                                                                                                                                                             |

## Вердикт

**APPROVE. Блокеров нет.**

Батч делает заявленное: `ROUTE_TABLE` + реестр жанров стали источником для `RouteNamedMap`
и `EXPECTED_ROUTE_NAMES`, ручная карта 22 имён и ручной список удалены, `router.ts` стал
фабрикой, спека впервые даёт рантайм-проверку таблицы. Все ключевые инварианты проверены
независимо, а не по сообщению коммита:

- **Рантайм parent ↔ HEAD.** Временная копия родительского `router.ts` (только
  `createWebHistory()` → `createMemoryHistory()`) против `createAppRouter(createMemoryHistory())`:
  `getRoutes()` совпал элемент-в-элемент — 22 маршрута, те же имена, пути, `meta`, `redirect`,
  компоненты, порядок; `resolve()` даёт одинаковые `matched`-цепочки на 21 URL, включая
  вложенные и несуществующие.
- **Типы живы.** `router.push({name:'games'})`, `{name:'stats'}`, `{name:'user-ratings',
  params:{id}}` компилируются; `{name:'statz'}` — ошибка; `@ts-expect-error` в
  `router.check.ts:24` действительно используется (при подмене опечатки на существующее имя
  vue-tsc падает `TS2578: Unused '@ts-expect-error' directive`). Лишнее имя в `RouteNamedMap`
  ловится type-level проверкой (`router.check.ts:14`).
- **Спека не тавтологична и мутационно чувствительна.** Пропавшая запись таблицы, изменённый
  путь, маршрут без `meta.title`, маршрут в `router.ts` вне таблицы — все четыре мутации
  валят спеку.
- **Фабрика не ломает singleton.** По одному `afterEach`-хуку на экземпляр, экземпляры
  независимы, повторная навигация не дублирует хуки; guard (гость/логин/админ/hideForAdmin,
  Mini App) и `titleSuffix` ведут себя как раньше; `prefetchRouteChunks` и `main.ts` работают
  на прежнем singleton. Фабрика не «абстракция ради тестов»: родительский `router.ts` вообще
  нельзя импортировать вне браузера — `createWebHistory()` в Bun бросает
  `window is not defined` (проверено).
- **Поведение в браузере идентично.** Прод-сборки parent и HEAD на двух портах: 6 deep-link
  сценариев дали одинаковые итоговые URL и `document.title`.
- **Прогоны зелёные:** lint 0/0, format clean, холодный typecheck 0 ошибок, frontend 154 pass,
  build зелёный; dev-only предупреждения и `createMemoryHistory` в прод-бандл не попали.

Ниже — не блокеры: односторонность машиной защиты (N1), coupling `prefetchRouteChunks` с
singleton (N2), почти-тавтологичность жанрового кейса спеки (N3), косметика (N4–N5).

### Блокеры

Нет.

### Не блокеры

- **N1. Машинная защита «таблица ↔ router.ts» односторонняя.** Мутационно проверено:
  удаление `stats` из `ROUTE_TABLE` **не** валит typecheck (`TC=0`) и не даёт dev-warning
  (0 предупреждений при `DEV=1`); ловит только `router.spec.ts` (`SPEC=1`). Обратное
  направление закрыто: запись в таблице без регистрации → dev-warn
  «отсутствуют маршруты: ghost», лишнее имя в `RouteNamedMap` → ошибка типов. То есть
  фактически type-level проверка — про «в карте нет имён вне таблицы/реестра» (как и написано
  в комментарии `router.check.ts:13`), а двусторонний инвариант держит только спека (она
  гоняется в CI, `.github/workflows/checks.yaml` → `cd frontend && bun run test`), поэтому
  не блокер. Если хочется ожидания из брифа («typecheck падает при удалении из таблицы») —
  типизировать имена в `ROUTES`: `type AppRoute = Omit<RouteRecordRaw,'name'> & { name:
  RouteName }` (рекурсивно для `children`), тогда `name: 'stats'` в `router.ts` перестанет
  компилироваться без записи в таблице.
- **N2. `prefetchRouteChunks` по-прежнему замкнут на module-singleton `router`**
  (`router.ts:208`), а не на экземпляр фабрики. В приложении экземпляр один, поведение не
  меняется; но новый API «router собирается фабрикой» и старый prefetch теперь живут в разных
  мирах — второй экземпляр (тест/второе приложение) прогреет чанки по singleton. Лечится
  параметром `router` или выносом `prefetch` на экземпляр; на вердикт не влияет.
- **N3. Жанровый кейс спеки (`router.spec.ts:33`) почти тавтологичен:** `GENRE_ROUTES`
  строится из тех же `GENRES`, поэтому кейс ловит только ошибку в самом `GENRE_ROUTES`
  (перепутанные `pageKey`/`genre`), но не дрейф реестра. Дрейф реестра закрыт существующим
  `genre-registry.spec.ts` (проверено мутацией: удаление GAME из `GENRES` валит 5 тестов,
  включая «содержит все жанры в каждом порядке без дублей»), так что дыры нет — просто кейс
  слабее, чем выглядит.
- **N4. Косметика в сообщении коммита.** «d.ts больше не переписывает **23** маршрута
  руками» — на самом деле 22 (17 записей `ROUTE_TABLE` + 5 жанров), в старой ручной карте тоже
  было 22. На код не влияет; rewrite из-за одной цифры не нужен.
- **N5. Документация — минимум, но синхронна.** `frontend/src/AGENTS.md` обновлён верно
  («Add to `ROUTE_TABLE` … `RouteNamedMap` выводится сам»), `frontend/AGENTS.md` не существует,
  исторические упоминания в `TODO.md`/`docs/refactor/maps/*` — это снимки прошлого состояния.
  Строка в корневом `AGENTS.md` («Router paths → `ROUTER_PATHS constant`») осталась корректной,
  но про `ROUTE_TABLE` не знает — можно дописать при закрытии батча. `docs/refactor/tasks.md`
  и `progress.md` этот коммит не трогает — по регламенту это закрытие батча/лида, карты — G-04.

## Пункт 1. Эквивалентность рантайма parent ↔ HEAD

Метод: `git show 97c5ebc:frontend/src/router/router.ts` → временный `_parent-router.ts`, в нём
заменён только `createWebHistory()` → `createMemoryHistory()` (иначе модуль в Bun не
импортируется), затем временная спека сравнивает `getRoutes()` и `resolve()`.

Проверялось для каждого маршрута: `name`, `path`, `meta` (deep), `redirect`, наличие
`components`, `props`, `aliasOf`; плюс порядок в `getRoutes()` и `matched`-цепочки для 21 URL
(`/`, все внутренние, `/db/users/42/ratings`, auth-колбэки, `/:pathMatch`). Итог: **3/3 pass,
23 expect, 0 fail**. Совпавший набор (22):

| #   | Имя              | Путь                      | meta                                                  | redirect           |
| --- | ---------------- | ------------------------- | ----------------------------------------------------- | ------------------ |
| 1   | `home-layout`    | `/`                       | title «Лешот»                                         | —                  |
| 2   | `home`           | `/`                       | title «Лешот — сайт Лешота», `titleSuffix:false`      | —                  |
| 3   | `pc`             | `/pc`                     | title «Сетап Лешота», `titleSuffix:false`             | —                  |
| 4   | `db`             | `/db`                     | title «База»                                          | → `/db/suggestion` |
| 5   | `admin`          | `/db/admin`               | `requiresAdmin`, title «Админка»                      | —                  |
| 6   | `suggestion`     | `/db/suggestion`          | title «Советы»                                        | —                  |
| 7   | `stats`          | `/db/stats`               | title «Статистика»                                    | —                  |
| 8   | `friends`        | `/db/friends`             | title «Друзья»                                        | —                  |
| 9   | `my-ratings`     | `/db/ratings/my`          | `requiresAuth`, `hideForAdmin`, title «Мои оценки»    | —                  |
| 10  | `user-ratings`   | `/db/users/:id/ratings`   | title «Оценки пользователя»                           | —                  |
| 11  | `games`          | `/db/games`               | `genre:GAME`, `pageKey:media`, title «Игры»           | —                  |
| 12  | `movie`          | `/db/movie`               | `genre:MOVIE`, `pageKey:media`, title «Фильмы»        | —                  |
| 13  | `anime`          | `/db/anime`               | `genre:ANIME`, `pageKey:media`, title «Аниме»         | —                  |
| 14  | `cartoon`        | `/db/cartoon`             | `genre:CARTOON`, `pageKey:media`, title «Мультфильмы» | —                  |
| 15  | `series`         | `/db/series`              | `genre:SERIES`, `pageKey:media`, title «Сериалы»      | —                  |
| 16  | `wordle`         | `/db/wordle`              | title «Вордли»                                        | —                  |
| 17  | `cocktails`      | `/db/cocktails`           | title «Коктейли»                                      | —                  |
| 18  | `wordle-miniapp` | `/tg/wordle`              | title «Вордли»                                        | —                  |
| 19  | `auth-twitch`    | `/auth/callback/twitch`   | `provider:twitch`, title «Вход»                       | —                  |
| 20  | `auth-kick`      | `/auth/callback/kick`     | `provider:kick`, title «Вход»                         | —                  |
| 21  | `auth-telegram`  | `/auth/callback/telegram` | title «Вход»                                          | —                  |
| 22  | `not-found`      | `/:pathMatch(.*)*`        | —                                                     | → `/`              |

Вывод: auth/not-found переезд из литералов в `ROUTER_PATHS` (`router-paths.ts:19-22`)
поведение не изменил; порядок и вложенность (`db` → дети, `home-layout` → `home`/`pc`)
элемент-в-элемент те же. `redirect` `db` и `not-found` нормализуются одинаково.

## Пункт 2. Типы (`router.check.ts` + `vue-router.d.ts`)

| Мутация                                                                            | Ожидание                    | Факт                                                                                    |
| ---------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `push({name:'games'})`, `{name:'stats'}`, `{name:'user-ratings',params:{id:'42'}}` | компилируется               | **TC=0**                                                                                |
| `push({name:'statz'})`                                                             | ошибка                      | **TC=2** (`TS2345`, имя не входит в union маршрутов)                                    |
| `@ts-expect-error` подменён на существующее имя `db`                               | директива жива              | **TC=2** `TS2578: Unused '@ts-expect-error' directive`                                  |
| лишнее имя `zzz` добавлено в `RouteNamedMap`                                       | typecheck падает            | **TC=2** `router.check.ts(14,30) TS2344` + `(20,71) TS2322` — сработал `_NoOrphanNames` |
| `stats` удалён из `ROUTE_TABLE`                                                    | typecheck падает (по брифу) | **TC=0** — typecheck зелёный; ловит только спека (см. N1)                               |

Типы не деградировали: пути в `RouteNamedMap` остались литералами, ошибка на опечатку
по-прежнему показывает union путей (`... | "/db/games" | "/db/stats" | ...`), params у
`user-ratings` типизируются. Маппинг `StaticRouteMap & GenreRouteMap` (`vue-router.d.ts:7-38`)
корректен и для двух маршрутов с одинаковым путём (`home`/`home-layout`), и для динамических
параметров.

## Пункт 3. Фабрика, хуки, singleton

Временная спека с моками stores и страниц (`createMemoryHistory`, без window) — **13/13 pass**:

- ровно один `afterEach`-хук заголовка на экземпляр (две навигации → два вызова `setTitle`,
  не четыре);
- два экземпляра независимы: навигация по одному не дёргает другой;
- повторная навигация не дублирует хуки (3 вызова на 3 перехода);
- `titleSuffix:false` соблюдается (главная даёт полный заголовок);
- guard: гость → `/db/admin` → `/` и ровно один `whenQuerySettled`; залогиненный не-админ →
  `/`; реальный админ попадает в `/db/admin`, но `my-ratings` (`hideForAdmin`) выкидывает
  домой; залогиненный пользователь попадает в `my-ratings`; публичный маршрут не ждёт
  `whenQuerySettled`; `/tg/wordle` вне Telegram → `/db/wordle`; неизвестный путь → `/`;
  `scrollBehavior` → `{top:0}`;
- singleton: `router.getRoutes().length === EXPECTED_ROUTE_NAMES.length` (22),
  `prefetchRouteChunks('/db/stats')` не бросает.

Тела хуков сравнены текстом с родителем: `afterEach` и `beforeEach` **идентичны**
(нормализовано по пробелам), dev-проверка отличается только `import.meta.env?.DEV` вместо
`import.meta.env.DEV` — семантика в Vite та же (в Bun `import.meta.env` есть, `DEV` undefined).
Фабрика обоснована: `createWebHistory()` в Bun бросает `window is not defined`, то есть без
фабрики/fallback спека на `router.ts` невозможна; `defaultHistory()` выбирает memory только
без `window` (`router.ts:129`), прод-путь остался `createWebHistory()`.

## Пункт 4. Спека `router/router.spec.ts` (мутации)

| Мутация                                                    | Результат                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| (a) `stats` убран из `ROUTE_TABLE` (в `router.ts` остался) | **FAIL** кейса «регистрирует ровно ожидаемые имена» (received +1)                 |
| (b) в таблице `stats: '/db/statistics'`                    | **FAIL** кейса «пути совпадают с `ROUTE_TABLE`» (`Expected … Received /db/stats`) |
| (c) у `admin` убран `meta.title`                           | **FAIL** кейса «у каждого не-redirect маршрута есть title»                        |
| (d) в `ROUTES` добавлен маршрут `extra` вне таблицы        | **FAIL** кейса «регистрирует ровно ожидаемые имена» (typecheck при этом зелёный)  |
| нет мутаций                                                | **4/4 pass**                                                                      |

Кейсы 1, 2, 4 сравнивают независимые источники (`ROUTE_TABLE`/`GENRES` против реально
зарегистрированных `ROUTES`), поэтому не тавтологичны; кейс 3 — см. N3. Ни один кейс не
мутирует экспортируемые массивы (используются копии `[...]` перед `sort`).

## Пункт 5. Поведение в браузере (прод-сборка, parent ↔ HEAD)

Собраны обе ревизии (`vite build`) и розданы статикой на `4173` (HEAD) и `4174` (parent,
`97c5ebc`), бэкенда нет — `/api` падает, поэтому сценарии гостя честные. Deep-link после
гидратации:

| Deep-link             | HEAD `4173`                       | parent `4174`                     | Совпало |
| --------------------- | --------------------------------- | --------------------------------- | ------- |
| `/db/stats`           | `/db/stats`, «Статистика Лешота»  | `/db/stats`, «Статистика Лешота»  | да      |
| `/db`                 | `/db/suggestion`, «Советы Лешота» | `/db/suggestion`, «Советы Лешота» | да      |
| `/tg/wordle`          | `/db/wordle`, «Вордли Лешота»     | `/db/wordle`, «Вордли Лешота»     | да      |
| `/nope/nope`          | `/`, «Лешот — сайт Лешота»        | `/`, «Лешот — сайт Лешота»        | да      |
| `/db/admin` (гость)   | `/`, «Лешот — сайт Лешота»        | `/`, «Лешот — сайт Лешота»        | да      |
| `/auth/callback/kick` | тот же URL, «Вход Лешота»         | тот же URL, «Вход Лешота»         | да      |

`document.title` после гидратации совпадает побайтово; до исполнения JS в `<title>` стоит
статический заголовок главной из `index.html` — это не регресс, одинаково на parent.
`/db/stats` отрендерил db-оболочку (сайдбар: Советы/Игры/Аниме/…/Статистика/Вордли), т.е.
deep-link на внутренний маршрут работает через `createWebHistory()` в реальном Chromium.

## Пункт 6. Прогоны

| Команда                                                                   | Результат                                                                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile` (/tmp/review-b25)                         | 450 пакетов, 113 ms, lockfile не изменился                                                                                  |
| `bun lint`                                                                | **0 warnings, 0 errors** (444 файла, 96 правил, 87 ms)                                                                      |
| `bun format:check`                                                        | **clean** (658 файлов, 11 ms)                                                                                               |
| `bun typecheck` (холодный: `rm -rf frontend/node_modules/.cache/vue-tsc`) | contract 7 / database 41 / backend 274 файла — 0 ошибок; frontend (vue-tsc) 4.78 s — 0 ошибок                               |
| `cd frontend && bun test src`                                             | **154 pass, 0 fail** (29 файлов, 356 expect, 136 ms)                                                                        |
| `cd frontend && bun run build`                                            | `build:ci` — ✓ built in 949 ms; `build:types` (vue-tsc) — зелёный; итог 0                                                   |
| прод-бандл `frontend/dist`                                                | 83 js-ассета; строк dev-предупреждений `[router] отсутствуют маршруты` — **0**, `createMemoryHistory` — **0** (tree-shaken) |

## Пункт 7. Мёртвый код, документация, мелочи

- Удалены: ручной список `EXPECTED_ROUTE_NAMES` (~22 строки), ручная карта `RouteNamedMap`
  (~19 строк), экспорт `gamesPathCheck`; ссылок на удалённое не осталось (`grep` пуст).
- Мёртвых импортов нет: `RouteName` используется в касте `Object.keys(ROUTE_TABLE)`
  (`router.ts:135`), `RouteRecordRaw`/`RouterHistory` — в фабрике, `GENRES`/`ROUTE_TABLE` —
  в d.ts, `router.check.ts` и спеке. `createRouter(` в `src/` вызывается ровно один раз.
- `GENRES` стал `as const satisfies readonly GenreEntry[]` — только типы; все потребители
  (`router.ts`, `stats-constants.ts`, `genre-registry.spec.ts`, `GENRES_BY_PATH`) читают его
  через `map`, мутаций/присваиваний в mutable-массив нет, `GENRES_BY_PATH` сужен до
  `ReadonlyMap<string, GenreEntry>` — typecheck чист.
- Новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable` нет; `git show --check`
  ошибок пробелов/конфликтов не даёт.
- Сообщение коммита: фактически 22 маршрута, а не 23 (N4); остальные утверждения точны,
  включая честное «мутационно проверено: пропавшая запись и неверный путь ломают тест».

## Внешние контракты

Диф `4e37e88` — только `frontend/src` (router, типы, реестр жанров, спека, AGENTS.md).
HTTP-роуты, WS, БД, env, публичные команды не тронуты. Урлы остались теми же (проверено
рантайм-дэйв-дампом и браузером), формы типов `router.push` не сузились.

## Итог

APPROVE. Единственный источник имён и путей для типов и проверок теперь `ROUTE_TABLE` +
реестр жанров; рантайм-регистрация совпадает с ними элемент-в-элемент, спека ловит все
заявленные мутации, фабрика не меняет поведение singleton, брендинг/guard/заголовки и
Mini App redirect идентичны родителю в живом браузере. Ручной список и ручная карта удалены
без потери типов. Не блокеры: односторонний type-level трап (N1), coupling `prefetchRouteChunks`
с singleton (N2), слабый жанровый кейс спеки при наличии внешней защиты (N3), «23» вместо
«22» в сообщении (N4), строка про `ROUTE_TABLE` в корневом `AGENTS.md` (N5). Рекомендация
на будущее: типизировать `name` в `ROUTES` через `RouteName` — тогда удаление записи из
таблицы будет ловить и typecheck, а не только спека.
