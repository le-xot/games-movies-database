# Ревью батчей 16–17 (B-13 / F-07) — `13148e3`, `934ffc5` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                     |
| Коммиты          | `13148e3` (родитель `0ded33d`, 7 файлов, +72/−37) — SQL из `RatingService`; `934ffc5` (родитель `13148e3`, 16 файлов, +121/−28) — `lib/storage-keys.ts`                                                                                                                                                                                                                  |
| Ревьюер          | `review-batch17` (не автор коммитов; только diff, изолированный worktree и собственные прогоны/мутации)                                                                                                                                                                                                                                                                  |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                               |
| Что сделано мной | работал в `/tmp/review-b17` (detached `934ffc5`, `git worktree add --detach`, `bun install --frozen-lockfile`, `backend/.env` скопирован, `frontend/node_modules/.cache/vue-tsc` удалён); интеграция — на dev-postgres `lists_test` через `setup-db.ts`. Все мутации откачены, worktree удалён. В основном дереве создан только этот отчёт; код не менялся, коммитов нет |
| Не запускалось   | Playwright e2e (G-05 — стенд не поднят), `docker build` — вне предмета батчей                                                                                                                                                                                                                                                                                            |
| Важно            | основной чекаут занят параллельной разработкой: во время ревью HEAD ветки оставался `934ffc5`, но `git status` основного дерева менялся под чужими правками. Номера строк ниже относятся к `13148e3` / `934ffc5`                                                                                                                                                         |

## Вердикт

**APPROVE.** Блокеров нет.

Оба батча сделаны как заявлено: SQL из `RatingService` перенесён в репозиторий **дословно**
(те же `where`/`columns`, то же `null`-поведение), сервис больше не знает про БД, 404-сообщения
сохранены; все 10 ключей хранилища совпали с прежними литералами байт в байт, `main.ts` сбрасывает
те же два ключа и пишет тот же `app_version`, семантика `useStorage`/`useLocalStorage` не изменилась.
Обе новые машинные ловушки реально падают от канонических мутаций. Прогоны кампании зелёные,
`typecheck` — с холодным кешем `vue-tsc`. Ниже — четыре не блокера: два о ширине ловушек,
один о незакреплённых значениях ключей и процессный.

### Блокеры

Нет.

### Не блокеры

- **N1. Инвариант `architecture.spec.ts` уже своей формулировки — есть доказанный обход через
  корневой `@gmd/database`.** Спек ищет две подстроки: `@backend/database/drizzle.service` и
  `@gmd/database/schema` (`architecture.spec.ts:101-102`). Но `database/src/index.ts:1` —
  `export * from './schema'`, то есть `import { records } from '@gmd/database'` тянет те же таблицы и
  **спек проходит** (мутация ниже, п. 2). Каноническая регрессия (ровно те импорты, что были у
  `RatingService`) ловится, сегодняшнее дерево обхода не использует: значение-импортов из
  `@gmd/database` в `modules/**/*.service.ts` нет, схему вне репозиториев импортирует только
  `database/drizzle.service.ts` (`grep -rln '@gmd/database/schema' backend/src` минус repositories/
  тесты). Но задача B-13 в `tasks.md` обещает норму «schema только в repositories» — она сейчас
  верна де-факто и не защищена. Дешёвый фикс: тем же `resolveSpecifier`/регэкспом из этого спека
  резолвить спецификаторы импортов и отбраковывать любой резолв в `@gmd/database(/schema)` или
  `database/drizzle.service` (плюс `import type` — типы тоже эрейзятся, но норма строгая).
- **N2. Значения ключей ничем не закреплены: переименование ключа внутри модуля проходит все тесты**
  и молча сбрасывает настройки пользователей (редактор, сайдбар, wordle, бар коктейлей, возврат
  после логина). Проверено мутацией: `wordleColorblind: 'wordle:colorblind-RENAMED'` — 24 теста
  (storage-keys + wordle) зелёные (п. 4). Спек проверяет уникальность, подмножество и отсутствие
  литералов, но не сами значения; e2e пиннит только `loginReturnUrl` (`frontend/e2e/auth.spec.ts:26`)
  и в кампании не запускается. Фикс на одну строку: `expect(STORAGE_KEYS).toEqual({ …десять пар… })`
  в `storage-keys.spec.ts` — тогда браузерный контракт ключей (единственное, что пользователь может
  потерять при ренейме) станет машинно проверяемым. В этом диффе значения сверены вручную (п. 3),
  регрессии нет; это про будущие правки.
- **N3. Ловушка на литералы не видит optional chaining и bracket-доступ.** `STORAGE_LITERAL`/`COMPOSABLE_LITERAL`
  (`storage-keys.spec.ts:24-25`) требуют точку сразу после `localStorage`; проверено, что дописанный
  `globalThis.localStorage?.getItem('zzz')` спек **не** валит (п. 4). Это не гипотетика: сырые вызовы,
  которые мигрировал этот же батч, написаны именно так — `use-cocktail-bar.ts:46,54`
  (`globalThis.localStorage?.getItem/setItem(GUEST_BAR_STORAGE_KEY)`); следующая правка там литералом
  пройдёт мимо теста. Фикс: `\.(?:\?\.)?` и вариант `['`-доступа в регэкспах. Сейчас в
  `frontend/src` литералов ключей нет (проверено grep'ом), ловушка канонический путь
  (`localStorage.getItem('…')`, `useStorage('…')`) держит.
- **N4. Процессные хвосты в `docs/refactor/`.** `tasks.md:33,44` — B-13 и F-07 всё ещё в «В пуле»
  (закрытие задач — closing-docs коммит, как в ревью 11/12); `maps/frontend.md:249-252,274` описывает
  литералы и планируемый `KEYS_TO_CLEAR ⊆ ключей` — это карта, её синхронизирует G-04 (P2), ожидаемо.
  `progress.md` (раунды 16–17) описывает оба батча корректно. `frontend/e2e/auth.spec.ts:26` сохраняет
  литерал `'loginReturnUrl'` — это тест, а не прод-код; удобно как независимая сверка, но вне скана
  (`SOURCE_ROOT = frontend/src`).

Мелочи без номера: 404-пути в юнит-спеке по-прежнему проверяются только по классу
(`rejects.toThrow(NotFoundError)`), а сообщения уходят клиенту в конверте ошибки — сами строки
`'Record not found'` / `'User not found'` сохранены дословно (`rating.service.ts:23,64`), но тестом
не закреплены (так было и в родителе). В юнит-спеку добавлены два `as any` (`recordExists`/`findUserBrief`
на моке) в стиле уже существующих там `as any`, при этом удалён `as unknown as DrizzleService` —
кастов стало меньше. В `architecture.spec.ts:94` фильтр `!file.endsWith('.spec.ts')` мёртв:
`*.spec.ts` не может оканчиваться на `.service.ts`.

## Что в коммитах

**A. `13148e3` — `RatingService` без прямого SQL** (7 файлов, +72/−37):

- `modules/rating/repositories/drizzle-rating.repository.ts` (+20): `recordExists(recordId)` и
  `findUserBrief(userId)` — те же запросы, что были в сервисе. Новых импортов не потребовалось:
  `records`, `users`, `eq` уже импортированы в репозитории (`drizzle-rating.repository.ts:4-5`).
- `modules/rating/rating.service.ts` (−12): убраны `DrizzleService`, `@gmd/database/schema`, `eq`;
  конструктор `(repo, events)`, два вызова репозитория, сообщения 404 без изменений.
- `server/container.ts:101`: `new RatingService(ratingRepository, events)` — единственный прод-call site
  (`grep -rn "new RatingService" backend/src` — только контейнер и спека).
- `__tests__/architecture.spec.ts` (+24): инвариант «сервисы домена не импортируют БД напрямую».
- `__integration__/rating.repository.integration.spec.ts` (+15): существование записи (true/false),
  краткая карточка пользователя (равенство `{id, login}` и `null`).
- `modules/rating/__tests__/rating.service.spec.ts` (−17/+14): мок `DrizzleService` заменён методами
  репозитория; helper `makeDrizzle` удалён.
- `backend/src/AGENTS.md` (+2): анти-паттерн «SQL в сервисах».

**B. `934ffc5` — ключи хранилища** (16 файлов, +121/−28):

- `lib/storage-keys.ts` (новый, 27 строк): `STORAGE_KEYS` из 10 пар + `StorageKey` + `VERSIONED_STORAGE_KEYS`
  (два ключа версии).
- `main.ts` (−9/+5): `KEYS_TO_CLEAR` и `STORAGE_VERSION_KEY` удалены; сброс по `VERSIONED_STORAGE_KEYS`,
  версия — `STORAGE_KEYS.appVersion`.
- Потребители (11 файлов): `main.ts`, `LoginDialog.vue`, `ConnectedAccounts.vue`, `OAuthCallback.vue`,
  `TelegramCallback.vue`, `LayoutSidebar.vue`, `use-steam-sync.ts`, `use-new-records.ts`,
  `SuggestionPage.vue`, `use-wordle-settings.ts`, `use-cocktail-bar.ts`, `use-user.ts`,
  `use-account-dialog.ts` — замена литералов на константы (в двух местах — через уже существующие
  именованные константы `ACCOUNT_DIALOG_ON_LOAD_KEY`, `GUEST_BAR_STORAGE_KEY`).
- `lib/storage-keys.spec.ts` (новый, 58 строк): уникальность/непустота, подмножество версионных,
  полный скан `frontend/src` на литералы.
- `frontend/src/AGENTS.md` (+1): строка Storage в «WHERE TO LOOK».

## Пункт 1. A: эквивалентность SQL и поведения

Родитель (`0ded33d:backend/src/modules/rating/rating.service.ts`):

```
26:    const record = await this.drizzle.db.query.records.findFirst({
27:      where: eq(records.id, recordId),
28:      columns: { id: true },
70:    const profile = await this.drizzle.db.query.users.findFirst({
71:      where: eq(users.id, profileUserId),
72:      columns: { id: true, login: true },
```

HEAD (`drizzle-rating.repository.ts:47-68`):

```
48:  async recordExists(recordId: number): Promise<boolean> {
49:    const record = await this.drizzle.db.query.records.findFirst({
50:      where: eq(records.id, recordId),
51:      columns: { id: true },
...
58:  async findUserBrief(userId: string): Promise<{ id: string; login: string } | null> {
60:      (await this.drizzle.db.query.users.findFirst({
61:        where: eq(users.id, userId),
62:        columns: { id: true, login: true },
```

- **Дословно.** Тот же табличный query-builder, то же условие, те же `columns`, тот же `?? null`.
  Разница только в обёртке: `if (!record)` → `Boolean(record)`; для вызывающего кода
  (`if (!(await …recordExists(id)))`) семантика идентична (`null`/`undefined` → `false`).
- **404 сохранены дословно**: `NotFoundError('Record not found')` (`rating.service.ts:22-23`) и
  `NotFoundError('User not found')` (`:62-64`). Порядок веток тот же: отсутствие записи падает до
  `findByUserAndRecord`/`upsert` (юнит-тест это фиксирует: `upsert` и `emit` не вызваны); отсутствие
  пользователя — до пагинации/агрегатов. `profile.login` по-прежнему уходит в `userLogin` элемента
  (`rating.service.ts:90`), т.е. ответ `GET /ratings/:user` не изменился.
- **Сервис без БД.** В `RatingService` нет `DrizzleService` и `@gmd/database/schema`; на `0ded33d`
  `git grep -l -E "drizzle\.service|@gmd/database/schema" 0ded33d -- backend/src/modules | grep service\.ts$`
  даёт ровно `modules/rating/rating.service.ts` (заявление коммита «единственный такой сервис» верно),
  на `934ffc5` — пусто. Прод-вызовы конструктора обновлены все (контейнер); спека переписана на моки
  репозитория, `beforeEach` пересоздаёт мок, поэтому мутации `recordExists=false`/`findUserBrief=null`
  не протекают в соседние тесты.
- **Покрытие не просело.** Было: 404 по записи и по пользователю; стало: те же два теста через методы
  репозитория + интеграционные тесты обоих новых методов (позитив/негатив), в изолированном suite
  (`helpers/suite.ts` делает `truncateAll` перед каждым тестом, тест сеет своего пользователя и запись).
  Интеграционный позитив на `findUserBrief` сравнивает `toEqual({ id, login })`, т.е. падает и от
  лишних колонок.
- **Внешние контракты** (HTTP-коды/конверт ошибок, WS `update-ratings`, cookie, формат БД) не затронуты:
  `emitWs`/события и `NotFoundError` не менялись.

## Пункт 2. Инвариант «services не импортируют БД» — мутационно

В `/tmp/review-b17` (detached `934ffc5`):

1. В `modules/rating/rating.service.ts` первой строкой добавлен
   `import { DrizzleService } from '@backend/database/drizzle.service'` →
   `bun test src/__tests__/architecture.spec.ts` → **fail**:
   `сервисы домена не импортируют БД напрямую`, offenders `["modules/rating/rating.service.ts"]`.
   Файл возвращён — 4 pass.
2. Проверка обхода (N1): в тот же сервис добавлен `import { records as __records } from '@gmd/database'`
   (+ `void __records`) → **4 pass, 0 fail** — корневой реэкспорт схемы спек не видит.
3. `git status --porcelain` после откатов пуст.

Ловушка видит и `import type`, и алиасы, и подкаталоги `modules/**` (рекурсивный сбор + подстрочный
поиск), т.е. каноническую регрессию закрывает. Обход из п. 2 — в N1.

## Пункт 3. B: сверка ключей с родителем

Родитель `934ffc5^` = `13148e3`; HEAD = `934ffc5`.

| Константа (`storage-keys.ts`) | Значение               | Родитель: место и литерал                                                                                                                              | HEAD: место                                                                                                       | Итог |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---- |
| `appVersion`                  | `app_version`          | `main.ts:12` `STORAGE_VERSION_KEY = 'app_version'`; `get/set` — `main.ts:22,27`                                                                        | `main.ts:19,24`                                                                                                   | =    |
| `loginReturnUrl`              | `loginReturnUrl`       | `LoginDialog.vue:21` (set); `ConnectedAccounts.vue:41` (set); `OAuthCallback.vue:97,102,107`; `TelegramCallback.vue:28,29,33,34`                       | те же места, `STORAGE_KEYS.loginReturnUrl`                                                                        | =    |
| `accountDialogOnLoad`         | `accountDialogOnLoad`  | `stores/use-account-dialog.ts:4` (константа); writer `ConnectedAccounts.vue:42` sessionStorage; reader/remove `AccountDialog.vue:26-27` sessionStorage | `use-account-dialog.ts:5` = `STORAGE_KEYS.accountDialogOnLoad`; писатель и читатель в `sessionStorage` не тронуты | =    |
| `dbSidebarCollapsed`          | `db-sidebar-collapsed` | `LayoutSidebar.vue:15` `useStorage('db-sidebar-collapsed', false)`                                                                                     | `LayoutSidebar.vue:16`, дефолт `false`                                                                            | =    |
| `steamHidden`                 | `steam-hidden`         | `use-steam-sync.ts:26` `useLocalStorage<number[]>('steam-hidden', [])`                                                                                 | то же, типы/дефолт сохранены                                                                                      | =    |
| `viewedSuggestions`           | `viewed-suggestions`   | `use-new-records.ts:5` `useLocalStorage<number[]>('viewed-suggestions', [])`; `main.ts:20` в `KEYS_TO_CLEAR`                                           | `use-new-records.ts:6`; в `VERSIONED_STORAGE_KEYS`                                                                | =    |
| `suggestionSortBy`            | `suggestion-sort-by`   | `SuggestionPage.vue:29` `useLocalStorage<'date' \| 'likes'>('suggestion-sort-by', 'date')`; `main.ts:20`                                               | `SuggestionPage.vue:30`; в `VERSIONED_STORAGE_KEYS`                                                               | =    |
| `editorEnabled`               | `editorEnabled`        | `use-user.ts:36` `localStorage.getItem('editorEnabled') !== 'false'`; `:42` set                                                                        | `use-user.ts:37,43`                                                                                               | =    |
| `wordleColorblind`            | `wordle:colorblind`    | `use-wordle-settings.ts:3` `STORAGE_KEY = 'wordle:colorblind'`; get/set `:5,10`                                                                        | `use-wordle-settings.ts:4,9` (чтение + запись `String(value)`)                                                    | =    |
| `cocktailBar`                 | `cocktails:guest-bar`  | `use-cocktail-bar.ts:10` `GUEST_BAR_STORAGE_KEY = 'cocktails:guest-bar'`; `getItem/setItem` `:45,53`                                                   | `use-cocktail-bar.ts:11` = `STORAGE_KEYS.cocktailBar`; вызовы `:46,54`                                            | =    |

- Все 10 значений совпали символ в символ; ни одного литерала ключа в `frontend/src` вне
  `lib/storage-keys.ts` не осталось (grep по всем 10 строкам пуст; общий grep
  `git grep -n -E "(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(|use(Local)?Storage"` на
  `934ffc5` показывает только обращения через константы/переменные).
- **`main.ts` — ровно те же два ключа и та же запись версии.** Родитель: `KEYS_TO_CLEAR =
  ['viewed-suggestions', 'suggestion-sort-by']` (`main.ts:20`), `if (storedVersion !== APP_VERSION)`
  → `removeItem` по списку, затем `setItem(STORAGE_VERSION_KEY, APP_VERSION)` (`:22-28`). HEAD:
  `VERSIONED_STORAGE_KEYS` = `[viewedSuggestions, suggestionSortBy]` (`storage-keys.ts:24-27`), гейт
  `storedVersion !== APP_VERSION` (`main.ts:20-25`), `APP_VERSION = '3.3.0'` не менялся. Порядок
  операций и момент выполнения (top-level до `bootstrap`) те же — до инициализации vueuse-хранилищ.
- **`loginReturnUrl`** пишется в двух точках (логин-диалог и «привязать аккаунт»), читается с дефолтом
  `ROUTER_PATHS.db` и удаляется в обеих ветках обоих колбэков (OAuth: link/login; Telegram: link/login) —
  один в один с родителем.
- **`accountDialogOnLoad`** остался `sessionStorage` и на записи (`ConnectedAccounts.vue:43`), и на
  чтении/удалении (`AccountDialog.vue:26-27`); константа `ACCOUNT_DIALOG_ON_LOAD_KEY` переэкспортируется
  и указывает на значение модуля, а не наоборот — второй источник ключа не появился.
- **Семантика `useStorage`/`useLocalStorage` не изменилась**: те же композаблы из `@vueuse/core`, те же
  дефолты (`false`, `[]`, `[]`, `'date'`) и те же generic-типы (`number[]`, `number[]`, `'date' | 'likes'`).
  `STORAGE_KEYS` — `as const`, поэтому ключ остаётся строковым литералом; `typecheck` зелёный.
- Дополнительно: `frontend/src/lib/storage-keys.ts` без импортов — циклических зависимостей с
  `main.ts`/стором аккаунта/`use-user` нет.
- **UX/внешние контракты**: значения ключей — де-факто браузерный контракт, они не изменились, значит
  настройки пользователей не сбрасываются; навигация и возврат после логина идентичны.

## Пункт 4. Мутации storage-спека

В `/tmp/review-b17`, каждый раз с откатом и проверкой `git status`:

| Мутация                                                                                                                  | Ожидание           | Результат                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------------------------------------------------- |
| `localStorage.getItem('x')` в `pages/suggestion/SuggestionPage.vue`                                                      | fail               | **fail**, offender `pages/suggestion/SuggestionPage.vue` |
| `useStorage(STORAGE_KEYS.dbSidebarCollapsed, false)` → `useStorage('db-sidebar-collapsed', false)` в `LayoutSidebar.vue` | fail               | **fail** (сработал `COMPOSABLE_LITERAL`)                 |
| `wordleColorblind: 'wordle:colorblind'` → `'wordle:colorblind-RENAMED'`                                                  | fail (по-хорошему) | **pass**, 24 теста зелёные → N2                          |
| `globalThis.localStorage?.getItem('zzz')` в компоненте                                                                   | fail (по-хорошему) | **pass** → N3                                            |
| откат всех правок                                                                                                        | дерево чистое      | `git status --porcelain` пуст                            |

Спек не тавтологичен: третий тест читает реальные `.ts`/`.vue` из `frontend/src` (кроме `*.spec.ts` и
самого модуля), собирает offenders и сравнивает с `[]`; уникальность проверяется по `Set`, подмножество
версионных — по `Set` значений. Второй тест статически избыточен (`VERSIONED_STORAGE_KEYS: readonly
StorageKey[]` уже гарантирует подмножество типом) — но не вреден и не маскирует дыр.

## Пункт 5. Прогоны (в `/tmp/review-b17`, detached `934ffc5`)

`bun install --frozen-lockfile` — 450 пакетов; `backend/.env` скопирован из основного чекаута;
`frontend/node_modules/.cache/vue-tsc` удалён до `typecheck` (холодный кеш).

| Команда                                                                                                                    | Результат                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `bun lint`                                                                                                                 | 0 warnings, 0 errors (445 файлов)                                                                  |
| `bun format:check`                                                                                                         | All matched files use the correct format (641 файл)                                                |
| `bun typecheck` (холодный кеш)                                                                                             | contract 7, database 41, backend 275 файлов — ошибок нет; `frontend:typecheck` done за 4.53s       |
| `cd backend && bun test`                                                                                                   | **713 pass**, 0 fail, 86 файлов (сюда входят 3 теста-гейта из `__integration__/helpers/__tests__`) |
| `cd backend && RUN_DB_TESTS=1 … bun test src/__integration__` (после `setup-db.ts` → `✅ test database ready: lists_test`) | **62 pass**, 0 fail, 13 файлов                                                                     |
| `cd frontend && bun test src`                                                                                              | **145 pass**, 0 fail, 26 файлов                                                                    |
| `cd frontend && bun run build`                                                                                             | `build:ci ✓ built in 1.53s`, `build:types` done — зелёный                                          |

- Заявленные в коммите «772 backend-теста и 62 интеграционных» сходятся: 713 юнит-прогон включает
  3 теста `src/__integration__/helpers/__tests__/db.spec.ts`, которые входят и в интеграционный прогон,
  поэтому уникальных backend-тестов 710 + 62 = **772**. `145 frontend-тестов` из commit message — точное
  совпадение.
- Интеграционные тесты новых методов реально исполнялись (не `skip`) на dev-postgres `lists_test`:
  в `rating.repository.integration.spec.ts` 6 тестов, новый — первый в файле.

## Пункт 6. Документация

- `backend/src/AGENTS.md:69-70` («ANTI-PATTERNS»): «доменный сервис не импортирует
  `DrizzleService`/`@gmd/database/schema` — только через репозиторий; проверяет
  `__tests__/architecture.spec.ts`» — соответствует и коду (HEAD: ни один `*.service.ts` не импортирует),
  и тексту проверки (две подстроки). Формулировка «только через репозиторий» шире проверки (N1), но
  про буквальные пути — точно.
- `frontend/src/AGENTS.md:44`: `Storage | lib/storage-keys.ts | Все ключи localStorage/sessionStorage;
  сброс по версии — из того же списка` — файл существует, `VERSIONED_STORAGE_KEYS` действительно живёт
  там и действительно единственный источник сброса по версии.
- `docs/refactor/tasks.md` / `maps/frontend.md` / `progress.md` — N4.

## Итог

Оба батча завершены как заявлено. A: единственный сервис с прямым доступом к БД переведён на
репозиторий без изменения SQL, веток и сообщений 404; машинная ловушка от канонической регрессии
падает. B: единый источник ключей хранилища, все 10 значений и обе точки записи `app_version`
совпадают с родителем, версия сбрасывает те же два ключа; ловушка на литералы падает от прямого и
композабл-литерала. Прогоны кампании зелёные, `typecheck` — с холодным кешем. Блокеров нет;
N1/N2/N3 — ужесточение новых ловушек (все три имеют доказанные мутации), N4 — closing-docs.
