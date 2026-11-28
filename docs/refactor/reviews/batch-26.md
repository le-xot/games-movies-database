# Ревью батча 26 (F-12: один скелетон карточки и константы DataCards) — `48356cf` → **APPROVE**

|          |                                                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ветка    | `chore/code-cleanup`; ревью — detached `48356cf` в `/tmp/review-b26`, основной чекаут занят параллельной разработкой                                                                                                                                                                                         |
| Коммит   | `48356cf` (родитель `4e37e88`), 4 файла, +46/−38                                                                                                                                                                                                                                                             |
| Ревьюер  | `review-batch26` (не автор; только diff, изолированный worktree, собственные прогоны, SSR-дамп разметки и мутации)                                                                                                                                                                                           |
| Дата     | 2026-11-28                                                                                                                                                                                                                                                                                                   |
| Изоляция | `git worktree add --detach /tmp/review-b26 48356cf`; `bun install --frozen-lockfile` (450 пакетов, lockfile не изменился); `backend/.env` скопирован из основного чекаута для e2e; worktree удалён (`git worktree remove --force`). В основном дереве создан только этот отчёт, код не менялся, коммитов нет |
| Важно    | на момент ревью основной чекаут — `48356cf` с незакоммиченными правками `docs/refactor/progress.md` и `docs/refactor/tasks.md` от параллельной разработки (не мои, не трогал); там же уже стоит строка F-12 → `review`                                                                                       |

## Вердикт

**APPROVE. Блокеров нет.**

Две копии скелетона действительно сведены к одному компоненту, и это не «почти» —
разметка попиксельно та же. SSR-дамп родительских копий и нового `RecordCardSkeleton`
совпадает **побайтово** для варианта с бейджами и **посимвольно, кроме невидимого
`<!---->`** (`v-if` в false) для варианта без бейджей: тот же `Card` с теми же классами,
тот же постер, те же строки текста, те же 4 бейджа в первичной загрузке и 0 в «догрузке»,
тот же `animate-pulse` на всех блоках, та же сетка и `data-fade-in`. Значения констант
(5; 640/520; 600) совпадают с прежними, применяются в тех же местах; переименование
`hasError` → `suppressEmptyState` семантически эквивалентно (`!suppressEmptyState && !isLoading`
≡ `!hasError && !isLoading`), оба потребителя обновлены, третьих нет. Виртуализация,
измерение строк, ключи `v-for` и автоподгрузка не тронуты — в диффе только подстановка
констант. Все прогоны зелёные: lint 0/0, format clean, холодный typecheck, 154 frontend
unit, build, e2e `records.spec.ts` 1/1. Мутации констант текущими тестами не ловятся —
это единственный содержательный нит (покрытие, не регрессия).

### Блокеры

Нет.

### Не блокеры

- **N1. На новый канон нет ловушки (покрытие, низкий приоритет).** Мутации
  `LOAD_MORE_THRESHOLD_PX 600→1000` и `INITIAL_SKELETON_COUNT 5→3` весь frontend-unit
  (154 теста) проходят: в `frontend/src` нет ни одного спека, импортирующего `.vue`
  (29 файлов, все — чистая логика), компоненты не монтируются. E2E тоже не трогает ни
  скелетоны, ни порог: в `e2e/*.spec.ts` нет `skeleton`/`animate-pulse`/пагинации
  (`grep` даёт только неотносящийся к делу скролл в `wordle.spec.ts`). README кампании,
  п. 5/DoD, требует «на новый канон есть тест», но здесь предмет — чистая визуальная
  дедупликация без исправления регрессии, поэтому это не блокер. Дешёвая ловушка —
  unit-тест на SSR-рендер (`@vue/server-renderer` уже в зависимостях `vue`), как в этом
  ревью: 15 строк проверяют, что с бейджами 4 блока `h-6 w-10`, без — 0; или e2e-ассерт
  «на первичной загрузке 5 скелетонов».
- **N2. Смешанный стиль констант в одном блоке (косметика).** `INITIAL_SKELETON_COUNT` и
  `LOAD_MORE_THRESHOLD_PX` — SCREAMING_CASE, `singleColumnRowHeight`/`multiColumnRowHeight` —
  camelCase. Прецедент проекта для вынесенной магии — SCREAMING (`DRAG_THRESHOLD_PX`,
  `LIKE_THROTTLE_MS`, `WEATHER_CACHE_TTL_MS`); но `gridClass`/`showSkeleton` рядом тоже
  camelCase, так что это вкусовщина.
- **N3. `:suppress-empty-state` в `UserRatingsPage` недостижим (косметика).** `DataCards`
  живёт в `<template v-else>` под `v-if="error"` (`UserRatingsPage.vue:34,40`): при ошибке
  компонент не рендерится, и проп не читается. До коммита так же было с `has-error` —
  это перенос 1:1, не регрессия; можно было удалить проп именно здесь, чтобы не выглядел
  рабочим.
- **N4. Ещё одно магическое число — `overscan: 4` (`DataCards.vue:82`).** Оно не входило в
  перечисленный в сообщении коммита список (количество скелетонов, высота строки, порог) и
  в evidence карты F-12; поэтому не «забыли», а не входило в задачу. Микро-нит на будущее.
- **N5. Карта F-12 устарела.** `docs/refactor/maps/frontend.md:205-210` всё ещё описывает
  дубли и `hasError` и предлагает `<RecordGridSkeleton :count :class>`, а реализован
  per-card `RecordCardSkeleton` + `withBadges`. Карты — снимки рекона, обновляются при
  закрытии связанных задач (G-04); на коммит не влияет, но при закрытии F-12 раздел надо
  переписать под фактический интерфейс.

## Пункт 1. Попиксельная эквивалентность (SSR-дамп parent ↔ HEAD)

Метод: скопировал в worktree точные шаблоны обеих родительских копий
(`git show 48356cf^:frontend/src/components/media/DataCards.vue`, строки 111–127 и 154–164)
в два scratch-SFC, поднял Vite в SSR-режиме (`configFile: false`, alias `@`, только
`@vitejs/plugin-vue`) и отрендерил `@vue/server-renderer`'ом parent-копии против
`RecordCardSkeleton` с `{ withBadges: true }` / `{}`. Scratch-файлы жили только в
`/tmp/review-b26`, удалены вместе с worktree.

| Вариант                                    | parent                                  | HEAD                                   | Итог                                                    |
| ------------------------------------------ | --------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| Первичная загрузка (5 шт., с бейджами)     | `<Card>` + постер + 2 строки + 4 бейджа | `RecordCardSkeleton with-badges`       | **побайтово идентично** (`raw equal: true`)             |
| «Догрузка» (по числу колонок, без бейджей) | `<Card>` + постер + 2 строки            | `RecordCardSkeleton` (default `false`) | идентично, кроме вставленного `<!---->` на месте `v-if` |

Разбор счётчиков в отрендеренном HTML:

|                   | badge-блоки `h-6 w-10` | `animate-pulse` блоки            | корень `Card`                                               |
| ----------------- | ---------------------- | -------------------------------- | ----------------------------------------------------------- |
| HEAD `withBadges` | 4                      | 7 (постер + 2 строки + 4 бейджа) | 1 × `rounded-xl border bg-card text-card-foreground shadow` |
| parent первичный  | 4                      | 7                                | то же                                                       |
| HEAD default      | 0                      | 3 (постер + 2 строки)            | то же                                                       |
| parent «догрузка» | 0                      | 3                                | то же                                                       |

Дословно те же строки классов: постер
`w-[130px] sm:w-full flex-shrink-0 aspect-[2/3] bg-zinc-700 animate-pulse rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]`,
контейнер `flex flex-row sm:flex-col`, текстовая колонка `flex flex-col gap-2 p-3 flex-1 min-w-0`,
строки `h-4 w-3/4 …` / `h-3 w-1/2 …`, бейджи `flex gap-2 mt-1` + 4 × `h-6 w-10 bg-zinc-700 rounded animate-pulse`.
Сетка (`w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`)
и `data-fade-in` остались на тех же местах `DataCards.vue:115,119`; `gridClass` по-прежнему
определён один раз (`:28`) и используется дважды.

Единственное расхождение — `<!---->` от `v-if="withBadges"` в false. Комментарий не
рендерится, не является grid/flex-элементом (на `gap` не влияет), а `:empty`/`:has()`/
`:last-child`-селекторов в `frontend/src/assets` и `frontend/src/components` нет (`grep` —
пусто), так что на пиксели он не влияет. Для варианта с бейджами расхождения нет вообще.

## Пункт 2. Константы: значения и места применения

| Константа                | Значение | Где применяется                                                     | Было                                      |
| ------------------------ | -------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `INITIAL_SKELETON_COUNT` | `5`      | `v-for="n in INITIAL_SKELETON_COUNT"` в первом скелетон-гриде       | `skeletonCount = 5` там же                |
| `singleColumnRowHeight`  | `640`    | `estimateSize: () => (columns.value === 1 ? … : …)`                 | литерал `640` в том же тернарнике         |
| `multiColumnRowHeight`   | `520`    | там же                                                              | литерал `520`                             |
| `LOAD_MORE_THRESHOLD_PX` | `600`    | `scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD_PX` | `LOAD_MORE_THRESHOLD = 600`, та же строка |

Забытых использований нет: `grep -rn "640\|520\|600\b\|skeletonCount"` по `components/media`,
`pages/media`, `pages/ratings` даёт только сами объявления констант (и несвязанный
breakpoint `min-width: 640px` в `useMediaQuery`). Единственное оставшееся «магическое»
число в `DataCards` — `overscan: 4`, вне перечисленного в сообщении коммита объёма (N4).

## Пункт 3. `hasError` → `suppressEmptyState`

- Условие «No results.»: было `v-else-if="!hasError && !isLoading"`, стало
  `v-else-if="!suppressEmptyState && !isLoading"` — при одинаковых значениях булева
  выражения эквивалентны, и изменение ровно в этом (diff 1 строка в шаблоне + проп с
  JSDoc).
- Потребители: `MediaPage.vue:75` `:suppress-empty-state="!!media.records.error"` (было
  `:has-error`), `UserRatingsPage.vue:47` `:suppress-empty-state="!!error"` (было
  `:has-error`). Оба передают то же значение, что и раньше.
- Других потребителей `DataCards` нет: `grep -rn "DataCards" frontend/src frontend/e2e`
  даёт только эти две страницы и сам компонент. Остатков `has-error`/`hasError` в
  потребителях нет (`hasError` остался только в `WordlePractice.vue` — локальный computed,
  не связан).
- Семантика совпадает с намерением: на `MediaPage` `ErrorRetry` показывается над списком,
  и в этом состоянии `No results.` подавляется; без ошибки и без загрузки — показывается.
  В `UserRatingsPage` проп недостижим (N3), но и раньше был недостижим.

## Пункт 4. Поведение списка

В `DataCards.vue` кроме подстановки констант и выноса скелетона не изменено ничего:
`columns`/`rows`/`rowCount` те же, `useVirtualizer` — те же `count`, `getScrollElement`,
`overscan: 4`, `scrollMargin`; `getVirtualItems`/`getTotalSize`/`measureElement`,
`updateScrollMargin` (onMounted + watch flush post + два `useResizeObserver`), `maybeLoadMore`
(те же guard'ы и `useEventListener('scroll', …, { passive: true })`, `watch` + `nextTick`) —
байт-в-байт как у родителя. Ключи: `:key="n"` в обоих скелетон-циклах, `:key="item.id"` у
`MediaCard`, `:key="String(virtualRow.key)"` у виртуальных строк — без изменений.
`showSkeleton` (`isLoading && items.length === 0`) и ветвление `v-if/v-else-if/v-else-if`
те же.

## Пункт 5. Мутации и покрытие

Мутации — по одной на чистом дереве, откат `git checkout --`, финальный `git status`
чист (кроме моего scratch-каталога, удалённого с worktree):

| Мутация                             | Прогон                        | Результат         | Вывод      |
| ----------------------------------- | ----------------------------- | ----------------- | ---------- |
| `LOAD_MORE_THRESHOLD_PX` 600 → 1000 | `cd frontend && bun test src` | 154 pass / 0 fail | не ловится |
| `INITIAL_SKELETON_COUNT` 5 → 3      | `cd frontend && bun test src` | 154 pass / 0 fail | не ловится |

Почему: ни один frontend-спек не импортирует `.vue` (`grep -rn "\.vue'" --include='*.spec.ts'`
— пусто), компоненты в unit-тестах не монтируются; e2e-спеки скелетоны/порог не проверяют
(см. N1). Для сравнения: e2e на HEAD `records.spec.ts` проходит — то есть существующее
покрытие регрессию «вёрстка/поведение поехали» не поймало бы. Нит, не блокер.

## Пункт 6. Прогоны (в `/tmp/review-b26`, если не указано иное)

| Команда                                                                   | Результат                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`                                           | 450 пакетов, lockfile не поехал                                                                                                                                                                                |
| `bun lint`                                                                | **0 warnings, 0 errors** (445 файлов, 96 правил)                                                                                                                                                               |
| `bun format:check`                                                        | **clean** (659 файлов)                                                                                                                                                                                         |
| `bun typecheck` (холодный, `rm -rf frontend/node_modules/.cache/vue-tsc`) | exit 0: contract 7 / database 41 / backend 274 файла — без ошибок; frontend `vue-tsc` 5.06 s — без ошибок                                                                                                      |
| `cd frontend && bun test src`                                             | **154 pass, 0 fail**, 356 expect, 29 файлов (137 ms)                                                                                                                                                           |
| `cd frontend && bun run build`                                            | exit 0: `build:ci ✓ built in 920ms` (vite 8.3.5), `build:types` (vue-tsc) — без ошибок                                                                                                                         |
| `cd frontend && bunx playwright test e2e/records.spec.ts`                 | **1 passed** (6.0 s, chromium 1440×900); стенд: dev-postgres `127.0.0.1:5432` (`le_xot`/`abc`, БД `lists_test`), backend на :3100, frontend на :5273 (свободны, конфликтов с параллельной разработкой не было) |
| `git show --check 48356cf`                                                | чисто (whitespace-ошибок нет)                                                                                                                                                                                  |

`e2e/media.spec.ts` в репозитории нет (есть `admin/auth/command-palette/customization/home/navigation/records/session/smoke/wordle`),
поэтому e2e-часть — только `records.spec.ts`. Перед e2e в worktree скопирован
`backend/.env` из основного чекаута (файл gitignored, в worktree не попадал); после
удаления worktree следов не осталось.

## Пункт 7. Мелочи

- **Мёртвых импортов/объявлений нет.** `Card` из `DataCards` убран (там он больше не
  используется), импортируется в новом компоненте; лишних/неиспользуемых импортов lint не
  нашёл. Обе константы-скелетоны используются, пустых объявлений нет.
- **Имя/раскладка файла** соответствует конвенции: PascalCase `.vue`, `components/media/`
  без барреля, импорт по файлу (`frontend/src/AGENTS.md:84-85`) — `@/components/media/RecordCardSkeleton.vue`.
- **`AGENTS.md` не врёт про media.** В корневом `AGENTS.md` и `frontend/src/AGENTS.md`
  media-раздел ссылается на `pages/media/MediaPage.vue`, `components/media/`
  (`DataCards`, filters, search, badge) и импорт по файлу — всё осталось правдой; новых
  ложных утверждений коммит не добавил. (Дерево `media/` в `frontend/src/AGENTS.md:22` можно
  было бы дополнить `RecordCardSkeleton`, но это перечисление примеров, а не полный список —
  не дефект.)
- Коммит один, сообщение честное («разметка/классы 1:1» подтверждено SSR-дампом),
  subject ≤ 100 символов, `git show --check` чистый.

## Внешние контракты

Диф — только `frontend/src`: `DataCards.vue` (−38/+18), новый `RecordCardSkeleton.vue` (+29),
по 1 строке в `MediaPage.vue` и `UserRatingsPage.vue`. HTTP/WS/DB/env/contract не тронуты,
бэкенд/докер/миграции не менялись. Поведение UI по разметке идентично (см. Пункт 1),
единственное наблюдаемое отличие — невидимый комментарий в DOM.

## Наблюдения вне предмета (действий не требуют)

- В проекте есть `components/ui/skeleton/Skeleton.vue` (`animate-pulse rounded-md bg-zinc-700/70`),
  но переиспользовать его в `RecordCardSkeleton` нельзя без изменения пикселей
  (`bg-zinc-700/70` vs `bg-zinc-700`, `rounded-md` vs `rounded`), поэтому дублирование
  pulse-стилей здесь — осознанная плата за «визуал не меняется».
- `docs/refactor/maps/frontend.md:205-210` (F-12) — устаревший снимок рекона (N5, G-04).
- Незакоммиченные правки `docs/refactor/progress.md` / `tasks.md` в основном чекауте —
  параллельная разработка (там уже F-12 → `review`); я их не трогал, в коммит не входят.

## Итог

APPROVE. Дедупликация скелетона выполнена без единого пиксельного расхождения (SSR-дамп
parent↔HEAD побайтово идентичен для первичной загрузки и отличается только `<!---->` для
«догрузки»); константы совпадают с прежними значениями и применяются в тех же местах;
переименование `hasError` → `suppressEmptyState` эквивалентно по семантике, оба потребителя
обновлены, третьих нет; виртуализация/автоподгрузка/измерение строк и ключи не тронуты;
lint/format/typecheck/154 unit/build/e2e `records.spec.ts` — зелёные. Блокеров нет.
Ниты: отсутствие ловушки на новый канон (N1), смешанный стиль констант (N2), недостижимый
проп в `UserRatingsPage` (N3), `overscan: 4` (N4), устаревшая карта F-12 (N5).
