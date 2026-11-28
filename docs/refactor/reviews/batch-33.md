# Ревью батча 33 — `2085870` «блок оценок друзей вынесен из MediaCard» → **APPROVE**

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка          | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Коммит         | `2085870` (родитель `9fba512`), 3 файла, **+123/−99**                                                                                                                                                                                                                                                                                                                                                                                                           |
| Ревьюер        | `review-batch33` (не автор; только diff, изолированные worktree, собственные прогоны, харнесс и живые клики)                                                                                                                                                                                                                                                                                                                                                    |
| Дата           | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Изоляция       | `git worktree add --detach /tmp/review-b33 2085870` (HEAD) и `/tmp/review-b33-parent 9fba512` (parent); `bun install --frozen-lockfile` в обоих; собственные docker-контейнеры `postgres:17` на `55432` и `redis:7` на `56379` (общий `5432` занят инфрой основного чекаута и **перезаписывается параллельной работой** — см. ниже); `backend/.env` скопирован из основного чекаута; оба worktree удалены `git worktree remove --force`, контейнеры остановлены |
| Важно          | на момент ревью основной чекаут уже ушёл вперёд — `e9cd522` (SuggestionItemCard) с незакоммиченными правками `docs/refactor/progress.md` и `docs/refactor/tasks.md` от параллельной разработки. Их не трогал; предмет ревью — ровно `2085870`. Параллельный ревьюер `review-batch34` работал на своих портах (`3299/5279/5280`, postgres `65432`) — его процессы/контейнеры не задевал                                                                          |
| Не запускалось | `docker build` (Dockerfile/CI не менялись), backend integration `RUN_DB_TESTS=1` (коммит строго frontend), `bun check` отдельно (входит в `bun typecheck`)                                                                                                                                                                                                                                                                                                      |

## Вердикт

**APPROVE. Блокеров нет.**

Вынос — механический и доказуемо эквивалентный: перемещённый код побайтово совпадает с удалённым
(40-строчный блок логики + 10-строчный `gradeButtons` + 29-строчный шаблон), а собственный харнесс
на живом стеке даёт **0 расхождений DOM и 0 отличающихся пикселей** на шести состояниях блока
(parent↔HEAD), включая подсветку `friendsTop`, `ring` для `myGrade`, счётчики и `profileVote`.
Живые клики под админом, гостем и обычным пользователем ведут себя одинаково: админ получает тот же
тост, гость — тот же логин-диалог, пользователь — тот же `PUT`/`DELETE /api/ratings/{id}`; в полёте
запроса все четыре кнопки `disabled` и второй клик игнорируется; обработка 500 даёт тот же тост и
тот же `console.error`. `MediaCard` больше не знает про friends-рейтинг (0 упоминаний), мёртвых
импортов нет, `MediaCardItem` — единственное определение на оба файла. Все обязательные прогоны
зелёные, полный Playwright — **44/44** (воспроизведено на изолированной инфре).

## Что в коммите

- `frontend/src/components/media/MediaCard.vue` — 6+/99−, **331 → 238 строк** (в теле коммита
  написано 239 — единственная неточность, см. N1). Ушли импорты `toast`, `useBadgeSelect`,
  `useRating`, `useLoginDialog`, `RecordEntity`, `GRADE_BUTTON_ORDER`, `GRADE_VOCABULARY`,
  friends-utils; `isLoggedIn`/`isRealAdmin` из `storeToRefs`; весь блок `handleFriendsRate`/
  `gradeButtons`/`friends*`/`myGrade`/`profileVote`. В шаблоне на месте блока —
  `<MediaCardFriendsRating :item="item" />`.
- `frontend/src/components/media/MediaCardFriendsRating.vue` — новый, **110 строк** (заявлено 110).
  Самодостаточен: `useRating`, `useBadgeSelect`, `useLoginDialog`, `useUser`, friends-utils и тосты
  внутри; единственный проп — `item: MediaCardItem`.
- `frontend/src/components/media/media-card.types.ts` — новый, **7 строк**: `MediaCardItem` =
  `RecordEntity & { userGrade?, userLogin? }`. Один тип на `MediaCard` и дочерний блок.
- `git show --check` чист; продуктовых файлов вне трёх нет; новых `any`/`as unknown as`/
  `disable`-комментариев нет (единственный каст `props.item.friendsCounts as FriendsCounts | null |
  undefined` перемещён из parent дословно).

## Прогоны (изолированный worktree на `2085870`)

| Проверка                         | Результат                                                                                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`  | exit 0 — 450 пакетов, lockfile не изменился                                                                                                                                                                                 |
| `bun lint`                       | exit 0 — `Found 0 warnings and 0 errors`, 448 файлов, 96 правил                                                                                                                                                             |
| `bun format:check`               | exit 0 — `All matched files use the correct format`, 670 файлов                                                                                                                                                             |
| `bun typecheck` (холодный)       | exit 0 — contract 7 файлов, database 41, backend 274, frontend `vue-tsc` 5.05 s; кеш `frontend/node_modules/.cache/vue-tsc` предварительно удалён, повторный холодный прогон `cd frontend && bun run typecheck` тоже exit 0 |
| `cd backend && bun test`         | exit 0 — **716 pass / 0 fail**, 87 файлов, 36 303 `expect`                                                                                                                                                                  |
| `cd frontend && bun test src`    | exit 0 — **160 pass / 0 fail**, 30 файлов, 367 `expect`                                                                                                                                                                     |
| `cd frontend && bun run build`   | exit 0 — `build:ci` 1.52 s, `build:types` 3.83 s                                                                                                                                                                            |
| `playwright test` (полный набор) | **44 passed** (22.8 s), exit 0 — на моих postgres `55432` + redis `56379`; заявление коммита «44/44» подтверждено                                                                                                           |

## Пункт 1. Эквивалентность поведения (parent `9fba512` ↔ HEAD)

Код перемещён дословно — это проверено не глазами, а посимвольным сравнением извлечённых фрагментов:

| Фрагмент                            | parent                                                                          | child                                                                | Итог                   |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `friendsCounts`…`handleFriendsRate` | 40 строк (`MediaCard.vue` между `const friendsCounts` и `function getInitials`) | 40 строк, те же строки                                               | **идентично**          |
| `gradeButtons`                      | 10 строк (конец `<script>`, после `getInitials`)                                | 10 строк, те же строки                                               | **идентично**          |
| Шаблон блока                        | 29 строк (`<div class="flex flex-col gap-1">` … закрывающий `</div>`)           | 29 строк, тот же порядок/классы/`:title`/`:disabled`/`:class`/`v-if` | **идентично** (dedent) |

Порядок проверок внутри `handleFriendsRate` сохранён: `isRealAdmin` → `isLoggedIn` →
`ratingPending` → `myGrade === grade ? unrate : rate`; тосты и тексты совпадают; `catch` пишет то же
`console.error('Failed to save friends rating:', error)` и тот же `toast.error`. Формулы
`friendsCaption`/`friendsTop`/`profileVote` и зависимость от `friendsTotal ?? sum(friendsCounts)`
перенесены без изменений.

Живые клики (Playwright, реальный бэкенд, ADMIN/USER/GUEST через cookie `token`; parent и HEAD — по
разу каждый):

| Сценарий                         | parent                                                                                                                  | HEAD                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Админ (`e2e-admin`, isRealAdmin) | тост «Твоя оценка — плашка выше» + «Кнопки друзей — для пользователей», 0 запросов к `/api/ratings`                     | **то же** (текст тоста побайтово) |
| Гость                            | открывается логин-диалог («Вход», Twitch/Kick/Telegram), 0 запросов, классы кнопок не меняются                          | **то же**                         |
| Пользователь (`e2e-victim`)      | `PUT /api/ratings/1`, тело `{"grade":"BEER"}` → кнопка `bg-[#89632a] border-[#89632a] ring-2 ring-white/80 opacity-100` | **то же**                         |
| Повторный клик по той же оценке  | `DELETE /api/ratings/1`                                                                                                 | **то же**                         |
| In-flight (PUT задержан 1.5 s)   | все 4 кнопки `disabled=true`, второй клик игнорируется (ровно 1 запрос), после ответа `disabled=false`                  | **то же**                         |
| Ошибка (`PUT` → 500)             | тост «Не удалось сохранить оценку», `console.error: Failed to save friends rating: Response`, кнопки снова активны      | **то же**                         |

## Пункт 2. Разметка и визуал (DOM + скриншоты, parent ↔ HEAD)

Метод: два независимых dev-сервера (HEAD `5399`, parent `5398`) на одном бэкенде; реальные
данные — оценки созданы через API от `e2e-victim`, `e2e-wordle-player`, `e2e-wordle-rival`
(стабильные состояния, без моков payload). Каждый захват — новый контекст с `storageState`,
viewport 1440×900, после `networkidle` + `document.fonts.ready`; анимации погашены
(`reducedMotion` + `animation/transition:none` + `animations: 'disabled'` при скриншоте). Dump —
структурированное дерево `tag/attrs/text` плюс нормализованный `body.innerHTML` с вырезанными
`data-v-*` и HTML-комментариями. Сравнение PNG — Pillow (`sha256`, `ImageChops.difference`).

| Состояние / страница                                       | Что в блоке                                                                           | DOM                                      | Пиксели (1440×900, fullPage)  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| `empty` — `/db/games`, 0 оценок                            | «Оценок пока нет», 4 кнопки `bg-transparent opacity-60` с `title`/`border` из словаря | **идентично** (html equals, tree equals) | **0** отличий (sha256 совпал) |
| `rich` — `/db/games`, 1×RECOMMEND                          | «Друзья · 1», 🔥 `bg-[#28456c] border-[#28456c]`, счётчик `1`                         | **идентично**                            | **0**                         |
| `counts` — `/db/games`, RECOMMEND×2 + BEER×1, админ        | «Друзья · 3», +счётчики у 🍺/🔥, top 🔥 залит                                         | **идентично**                            | **0**                         |
| `mygrade` — тот же набор, viewer `e2e-victim` (BEER)       | у 🍺 `ring-2 ring-white/80 opacity-100` (myGrade), top по-прежнему 🔥                 | **идентично**                            | **0**                         |
| `profilevote` — `/db/users/e2e-victim/ratings` (RECOMMEND) | «🔥 от e2e-victim» + «Друзья · 1»                                                     | **идентично**                            | **0**                         |
| `profilevote2` — та же страница после BEER (3 голоса)      | «🍺 от e2e-victim» + «Друзья · 3»                                                     | **идентично**                            | **0**                         |

Итог: `body.innerHTML` (после снятия `data-v-*`/комментариев) побайтово равен, дерево узлов
равно, PNG — **побайтово равные файлы** (одинаковые `sha256`), diff-изображение пустое
(`bbox=None`, 0 отличающихся пикселей). Корневой `div` блока действительно стал корнем компонента:
лишней обёртки/атрибута нет — это и есть причина побайтового совпадения HTML.

## Пункт 3. Типы, мёртвый код, границы (проверка пунктов задания)

- **`MediaCard` ничего не потерял:** `grep` по `friends|useRating|useBadgeSelect|useLoginDialog|toast|GRADE_|RecordEntity` в `MediaCard.vue` — 0 совпадений; оставшиеся импорты (`computed`, `ref`, `useDialog`, `isAdmin`, `RecordGrade/RecordStatus/RecordUpdateDTO`) используются — подтверждено `oxlint` без `no-unused-vars` и `vue-tsc`.
- **Нет мёртвых типов/экспортов:** `MediaCardItem` импортируется ровно двумя потребителями и больше нигде не дублируется; `RecordEntity` по-прежнему жив в `@/lib/api` и используется типом.
- **Проп-цепочка не расширилась:** child получает только `item` (как и требовалось); `DataCards` передаёт `RecordEntity`, который assignable к `MediaCardItem` (опциональные поля) — `vue-tsc` зелёный; type-check `components/dialog/dialog.check.ts` продолжает компилироваться.
- **Нет циклов/побочных эффектов:** `media-card.types.ts` → только `@/lib/api`; `MediaCard → MediaCardFriendsRating → types`; composables-сторы вызываются в том же количестве экземпляров (1 карточка = 1 child), `useRating`-мутации с теми же ключами.
- **Новые `any`/касты/disable:** нет (каст `as FriendsCounts | null | undefined` перемещён дословно из parent).
- **Стиль:** `<script setup>` первым, `<template>` последним, PascalCase `.vue` / kebab-case `.ts` — по конвенциям; `bun format:check` подтверждает сортировку импортов (тип-импорт в конце, как требует `sortImports`).

## Не блокеры

- **N1. В теле коммита «MediaCard 331→239 строк», фактически 238** (`wc -l` и `awk 'END{print NR}'` — 238; parent — 331). Та же цифра 239 попала в незакоммиченный текст раунда 6 `progress.md`. Косметика, но кампания следит за точностью доков — поправить одной цифрой при коммите раунда.
- **N2. Харнесс эквивалентности не сохранён как ловушка.** В репозитории нет ни спека на компонент, ни визуального теста; во всём `frontend/src` нет монтирующих `.vue` unit-тестов (30 спеков — чистая логика). Для чистого выноса разметки без изменения поведения это допустимо и совпадает с прецедентом ревью 26; если хочется страховки на будущее — дешёвый вариант: SSR-рендер `MediaCardFriendsRating` с тремя наборами пропсов (проверка caption/счётчиков/классов) через уже имеющийся `@vue/server-renderer`.
- **N3. Заявление харнесса в теле коммита шире предмета: `/db/suggestion` MediaCard не рендерит** (там `SuggestionCard` → `SuggestionItemCard` из следующего коммита). Для этого батча доказательство даёт `/db/games` (+ страница оценок пользователя, где появляется `profileVote`); `/db/suggestion` относится к `e9cd522`. Не ложь, но охват стоит формулировать точнее.
- **N4. Карты рекона устарели по факту выноса (плановое G-04):** `maps/frontend.md:198` (F-11: «MediaCard.vue (326) — god-компонент…») и `maps/hygiene.md:204` («friends-rating — в composable») описывают снимок до разреза. `tasks.md`/`progress.md` раунда 6 в основном чекауте обновлены параллельной разработкой (незакоммичено), карты по правилам обновляются при закрытии связанных задач.
- **N5. Микро-нит: в child `RecordGrade` импортирован как value-импорт, хотя внутри файла используется только как тип** (`handleFriendsRate(grade: RecordGrade)`). Перемещено дословно из parent, `oxlint` не требует `import type` (правила `consistent-type-imports` в конфиге нет) — не регрессия, чисто вкусовое.

## Приложение: изоляция и воспроизводимость

- **Почему свои контейнеры.** Первый прогон на общем dev-postgres (`5432`) дал плавающий результат:
  засеянный `e2e-admin` исчез между `seed` и первой загрузкой страницы (`/api/auth/me` → 401,
  `/api/records` → `records: []`), в `lists_test` оказались фикстуры чужого интеграционного прогона
  (`rater-active`…). Причина — параллельная работа другого агента в том же `lists_test`. После
  переезда на `postgres:17` `127.0.0.1:55432` + `redis:7` `56379` все прогоны и захваты
  детерминированы.
- **Данные для харнесса:** `e2e-admin`/`e2e-victim`/`e2e-wordle-player`/`e2e-wordle-rival` из
  `backend/src/__e2e__/seed.ts`; storageState — cookie `token` (JWT `review-b33-secret`, как в
  прогонах e2e); оценки выставлялись реальными `PUT/DELETE /api/ratings/1`, а не подменой ответа.
- **Артефакты** (в репозиторий не попали, лежали в `/tmp/b33-harness`): 6 пар `*.json` (DOM-дампы) и
  `*.png`, `clicks.json`, `pending.json`, `error.json`; worktree удалены, контейнеры остановлены,
  `git status` основного чекаута не изменился этим ревью (только новый файл этого отчёта; чужие
  незакоммиченные `progress.md`/`tasks.md` не трогал).
