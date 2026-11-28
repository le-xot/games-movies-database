# Contract, данные, конфиг — карта SSOT и дрейфа

> Снимок: 2026-11-28, worktree `chore/code-cleanup` (ветка от `master` @ `e73dcfb`). Область: `contract/src/*`,
> `database/src/{schema,seed}/*`, TypeBox-модели + `api-types.ts`/`enums/*`/`enviroments.ts` в `backend/src`,
> `docker-compose*.yml`, `.github/workflows/*`, `package.json` ×5, `scripts/*`, `README.md`, oxlint/oxfmt/tsconfig.
> Метод: чтение + grep + счётные скрипты на bun в `/tmp` + рантайм-пробы env; файлы репозитория не менялись.
> `[?]` — вывод только по коду. Пересечения с `backend.md` (B-_) и `frontend.md` (F-_) помечены и ценность не дублируют.

## 1. Обзор

`contract` — самая чистая часть репозитория: 4 модуля, 0 зависимостей (`contract/package.json:13-16`), 16 enum-констант,
7 WS-событий, `parseWsMessage`, каталог рамок; тесты стабильности значений на месте
(`contract/src/__tests__/cocktail-enums.spec.ts:4-24`). WS канонизирован: обе стороны берут `WsEvents` из контракта
(`gateway/ws.ts:2,64-67`), строк `'update-*'` в коде нет — 0 совпадений grep'ом. Каталог косметики тоже канон: пороги из
`AVATAR_FRAME_RULES`, id через `isAvatarFrameId` (`customization.achievements.ts:1-3,19-21`), фронт — `Record<AvatarFrameId,…>`,
расхождение ловит компилятор. Даты — `isoTimestamp` в 9 таблицах (`database/src/schema/timestamp.ts:11-15`);
`t.Date()`/`t.Transform`/`t.Unsafe` в гейтвее нет, nullable — `t.Nullable` (33) против одного `t.Null()`.

Энтропия в трёх местах. (1) **Граница contract↔БД**: pgEnum повторяет контракт руками, порядок `RecordStatus` уже
разъехался, имена enum'ов — два разных соглашения. (2) **Ручные слои типов**: 47 имён в `api-types.ts`, из которых 24 —
не вывод схемы, а `interface` рядом со схемой; 25 имён без потребителя. (3) **Конфиг без проверки**: dev-дефолты
попадают в прод, версия Bun зашита в 7 местах, CI не проверяет ни seed, ни границу enum'ов, ни `e2e`-типы.

Итог: 16 находок. **L** — C-01, C-02, C-03. **M** — C-04…C-12. **S** — C-13…C-16.

## 2. Карта владения истиной

| Правило / значение    | Канон                                 | Зеркала (сколько)                                                                                                      | Машинная проверка                                               |
| --------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Значения enum'ов (16) | `contract/src/enums.ts`               | 11 pgEnum (`database/src/schema/enums.ts`), 17 `t.Literal`-union'ов в 7 файлах гейтвея, entity-классы, литералы фронта | нет; тесты контракта — только 3 коктейльных enum'а              |
| Имена pgEnum          | `database/src/schema/enums.ts:30-97`  | `backend/src/enums/enums.names.ts:1-8` (мёртв)                                                                         | нет                                                             |
| Wire-форма ответа     | TypeBox в `gateway/*.ts`              | `interface` в тех же файлах (~54), `modules/*.dto.ts` (52 класса в 14 файлах)                                          | рантайм срезает лишние поля; интерфейсы со схемами не сверяются |
| Типы фронта           | Eden из `App`                         | `backend/src/api-types.ts` — 47 имён: 18 `.static`, 24 ручных `interface`, 5 производных                               | нет                                                             |
| WS-события            | `contract/src/ws.ts:12-84`            | `modules/websocket/websocket.events.ts:4` (pass-through), `README.md:218`                                              | мост итерирует `Object.values(WsEvents)` ✔                      |
| Каталог косметики     | `contract/src/customization.ts:19-62` | `achievements.ts` (пороги ✔, id литералами), `frontend/src/lib/user-customization.ts`                                  | TS: `AvatarFrameId` + exhaustive `Record` ✔                     |
| Конверт ошибок        | `gateway/errors.ts:7-77`              | `utils/errors.ts:9-72` (вторая иерархия)                                                                               | нет; для 502 текста нет (C-14)                                  |
| Rate limits (10)      | `utils/rate-limits.ts:3-18`           | `docs/api.md:38-49`, `docs/architecture.md:57`, `AGENTS.md:148`                                                        | нет, но таблица `api.md` совпадает с кодом                      |
| Env рантайма (36)     | `utils/enviroments.ts:5-58`           | `.env.example` (37), `README.md:96-137`, compose, workflows                                                            | нет: лишние ключи envalid не отвергает                          |
| Env деплоя (7)        | `docker-compose.yml`                  | `README.md:139-149`, `scripts/render-env.sh`                                                                           | частично, только `POSTGRES_PASSWORD` (C-05)                     |
| Каталог коктейлей     | прод-БД (`seed/seed.ts:8-13`)         | `database/src/seed/data/*` — снапшот 5554 строк                                                                        | `validateCatalog` только при сиде (C-01/C-10)                   |
| Команды и версии      | `package.json` (корень)               | `Dockerfile` ×4 + `database/Dockerfile` ×2 + `checks.yaml:37`                                                          | нет `engines`/`packageManager` (C-13)                           |

## 3. Находки

### C-01 · Seed-каталог: 5554 строк ручных данных в трёх God-файлах, без генератора и без модели источника · L · low

**Симптом.** 302 коктейля и 121 ингредиент написаны руками; атрибуция рецепта — свободный текст, у 73% коктейлей нет
ссылки на источник.

**Evidence.** Файлы данных: `cocktails-classics.ts` (1705 строк), `cocktails-modern.ts` (1586), `cocktails-iba.ts` (1506),
`ingredients.ts` (757); сборка — `seed/catalog.ts:8-11`; генератора нет (в `scripts/` только `render-env.sh`, `rollback.sh`).
Атрибуция: 221 из 302 без `sourceUrl`; `sourceName` — ≥15 вариантов текста с годом внутри строки: `"IBA"` ×83,
`"Диффорд"` ×79, `"Джерри Томас, 1862"` ×19, `"Современная барная классика, 1970-е"` ×7 (подсчёт по `CATALOG`).
Один атрибут в двух кодировках: `iba: true` (86) против `sourceName === "IBA"` (83); 3 расхождения описаны как
исключение (`cocktails-classics.ts:8-13`), но `validate.ts` согласованность не проверяет. 11 засеянных ингредиентов не
используются ни в одном рецепте: `armagnac`, `sherry-brandy`, `cherry-juice`, `pomegranate-juice`, `ice`, `bay-leaf` и др.
(`ice` при этом описан как «есть всегда», `ingredients.ts:10-11`).

**Почему энтропия.** Новый коктейль = ручная правка 1.7k-строчного файла; источник нельзя отфильтровать или сгруппировать;
мёртвые ингредиенты тихо живут в прод-каталоге и в UI-полках. Дедупликация ids/имён сейчас идеальна (0 дублей), но держится
только аккуратностью автора.

**Лечение.** Типизировать атрибуцию: `source: { kind: 'iba'|'book'|'bar'; title: string; year?: number; url?: string }`
вместо `sourceName/sourceUrl/iba`; добавить в `validateCatalog` проверки «нет неиспользуемых ингредиентов» и
«`iba` ⟺ `source.kind==='iba'`»; при продолжении правок разбить файлы по 300–400 строк.

### C-02 · Contract ↔ pgEnum: ручное зеркало, разъехавшийся порядок, два соглашения имён · L · med

**Симптом.** 16 констант контракта, 11 pgEnum'ов: персистится 11, пять живут только на проводе. Порядок `RecordStatus`
в контракте и БД не совпадает (для Postgres порядок семантичен). Имена enum'ов — PascalCase для Prisma-наследия и
snake_case для коктейлей. Дубли литералов в гейтвее — уже B-13; здесь только граница с БД.

**Evidence.** `contract/src/enums.ts:20-28` — `QUEUE, PROGRESS, DROP, NOTINTERESTED, UNFINISHED, DONE`;
`database/src/schema/enums.ts:32-39` — `QUEUE, PROGRESS, DROP, UNFINISHED, DONE, NOTINTERESTED` (Postgres сортирует по
объявлению: `ORDER BY status` даст другой порядок, чем словарь фронта; пока никто так не сортирует — [?]).
Имена: `pgEnum('UserRole')`, `pgEnum('RecordStatus')`… (`enums.ts:30-74`) против `pgEnum('ingredient_category')`,
`pgEnum('cocktail_tier')`, `pgEnum('cocktail_method')` (`enums.ts:76-97`); `AccountPlatform` в БД — `Platform` (`:64`).
Не персистятся `WordleLetterState`, `WordleHistoryStatus`, `RecordOrderBy`, `RecordDirection`, `ImageVariant` (`:73-106`).

**Почему энтропия.** Новый статус — правка в 2+ местах; забытое значение в pgEnum = ошибка вставки в рантайме, а не
в компиляции; порядок значений — скрытая семантика без владельца. Переименование pgEnum требует миграции, поэтому
дрейф имён накапливается.

**Лечение.** Тест-инвариант в `database/src/schema/__tests__`: для каждого `pgEnum` множество значений равно константе
контракта (где порядок значим — и порядок). Имена pgEnum'ов выравнивать только пакетной миграцией по решению владельца (§5).

### C-03 · `api-types.ts`: 24 из 47 имён — не вывод схемы, а ручные интерфейсы; 25 имён без потребителя · L · low

**Симптом.** Файл подаётся как «статические типы схем» (`api-types.ts:1-7`), `docs/architecture.md:72-73` обещает
«наружу уходит ровно то, что описано в схеме». Половина имён приходит из `interface`, которые никто не сверяет со
схемой, половина не используется. «DTO дважды» — B-02; здесь контрактная сторона и ложное обещание документации.

**Evidence.** `backend/src/api-types.ts:8-59` — 42 реэкспорта: 18 ведут на `export type X = typeof model.static`, 24 —
на `export interface` (`:22` `Queue/QueueItem`, `:33` `UserAccountEntity`, `:35` `WeatherResponse`, `:36-48` 11 wordle-имён
на 6 интерфейсов, `:49` `SteamGameDto`, `:51-59` все входы); плюс 5 производных (`:66-70`) = 47. Потребитель один:
`frontend/src/lib/api.ts:7`; 25 имён во `frontend/src` не встречаются ни разу, живых 22 (`RecordEntity` 8 файлов,
`UserEntity` 6). Три копии одной формы: `gateway/weather.ts:12-40` (6 схем) против `:43-51` (интерфейс) против
`modules/weather/weather.dto.ts:1-40` (класс); та же картина в `gateway/queue.ts:10-17` vs `:26-33`.

**Почему энтропия.** Фронт получает тип, который может быть шире или уже реального провода, и компилятор этого не видит:
удаление поля из схемы не ломает фронт, правка интерфейса не ломает сервер. `architecture.md:72` ложно, значит следующий
автор не заподозрит подвоха.

**Лечение.** Оставить только `.static`-алиасы (18) или удалить файл, переведя фронт на вывод Eden; интерфейсы в гейтвее
заменить на `Static<typeof schema>` там, где нет `t.Ref` (причина для `t.Ref` в `records.ts:80-84` остаётся валидной).

### C-04 · Dev-дефолты для prod-редиректов: Telegram-вход молча уводит на localhost · M · med

**Симптом.** Часть дефолтов оформлена через `devDefault` (правильно), два prod-критичных URL — через `default:` с localhost;
при отсутствии переменной в провайдере прод получает `http://localhost:5173/...`. Проверено рантаймом.

**Evidence.** `backend/src/utils/enviroments.ts:24-27`: `TELEGRAM_OIDC_REDIRECT_URI: str({ default: 'http://localhost:3000/api/auth/telegram/oidc/callback' })`,
`TELEGRAM_CALLBACK_URL: str({ default: 'http://localhost:5173/auth/callback/telegram' })` — против `:33`
`APP_PUBLIC_URL: str({ devDefault: 'http://localhost:5173', default: 'https://le-xot.dev' })` и `:57`
`WORDLE_ANSWERS_SALT: str({ devDefault: 'wordle-dev-insecure-salt' })`. Проба (cwd вне репо, `NODE_ENV=production`,
`TELEGRAM_CALLBACK_URL` не задан): `{"NODE_ENV":"production","APP_PUBLIC_URL":"https://le-xot.dev","TG":"http://localhost:5173/auth/callback/telegram"}`;
тот же прогон без `WORDLE_ANSWERS_SALT` падает — политика «в проде обязательно» применена выборочно. Третий режим:
`KICK_CALLBACK_URL: str({ default: undefined })` (`:20`) при заполненном значении в `.env.example:13`, а
`TWITCH_CALLBACK_URL: str({})` (`:16`) обязателен.

**Почему энтропия.** Один класс значения (redirect URL) имеет три контракта; отсутствие переменной не падает громко,
а деградирует в localhost — видно только в проде после входа через Telegram.

**Лечение.** `devDefault` для `TELEGRAM_*`; `KICK_CALLBACK_URL` обязателен, если Kick-вход включён; юнит-тест «в
`NODE_ENV=production` ни один `*_URL`-дефолт не содержит localhost».

### C-05 · Env-контракт деплоя не валидируется: `render-env.sh` проверяет 1 из 3 обязательных переменных · M · med

**Симптом.** В одном `.env` смешаны контракты приложения (envalid) и compose; проверка перед записью `.env` покрывает
только `POSTGRES_PASSWORD`. Лишние/мёртвые ключи живут незамеченными.

**Evidence.** `scripts/render-env.sh:59` — `if [ ! -s "$tmp" ] || ! grep -q '^POSTGRES_PASSWORD=' "$tmp"`; compose
требует без дефолта ещё `DBX_PASSWORD` (`docker-compose.yml:62`) и `ADMIN_ALLOWED_IPS` (`:74,107`) — `[?]` точный режим
отказа Traefik при пустом `sourcerange` не проверялся. `backend/.env.example` содержит только 37 ключей приложения, слой
compose документирован отдельно (`README.md:139-149`). Локальный `backend/.env` (gitignored) — 46 ключей, из них ≥12
мёртвых после выпиленных интеграций (`SPOTIFY_*`, `GRAFANA_*`, `METRICS_PREFIX`, `TWITCH_ADMIN_ID/LOGIN`,
`S3_BUCKET_BACKUPS`, `RUSTFS_*`); envalid лишние ключи не отвергает. Секреты S3 имеют хардкод-дефолт `rustfsadmin`
(`enviroments.ts:52-53`), совпадающий с дефолтом compose (`docker-compose.yml:28-29`) — ошибка конфигурации маскируется.

**Почему энтропия.** Провал деплоя из-за отсутствующей переменной виден в лучшем случае на health-check через SSH, а
мёртвые ключи создают иллюзию, что фича настраивается. Список обязательных переменных существует в трёх представлениях
(код, compose, shell), и ни одно не полно.

**Лечение.** Полный список обязательных ключей в `render-env.sh` + тот же список в документации; почистить dev-`.env`;
`devDefault` вместо дефолтных S3-кредов в проде.

### C-06 · CI: drift-проверка идёт мимо `bun db:generate`; seed и граница enum'ов не проверяются · M · low

**Симптом.** Шаги CI в целом соответствуют скриптам, но три инварианта не защищены: генерация миграций вызывается
другой командой, каталог сида не валидируется, соответствие contract↔pgEnum не проверяется. Дубли сборки образов
осознанные (`checks.yaml:96-98`) — их не трогаем.

**Evidence.** `.github/workflows/checks.yaml:50-57` — `bunx drizzle-kit generate --name ci-drift-check` с фиктивным
`DATASOURCE_URL`, тогда как документированная команда — `bun db:generate` → `database/package.json:13` через
`package.json:19`; любое изменение скрипта (флаги, `--name`) молча разводит локальную и CI-генерацию. `validateCatalog`
вызывается только из `seed/seed.ts:35`, `bun db:seed` в CI нет (`checks.yaml:59-94`). Нет теста, сверяющего pgEnum с
`contract/src/enums.ts`; `contract/src/__tests__/` покрывает 3 enum'а и разбор кадров. Что CI ловит: drift миграций, lint,
format, typecheck, unit backend/frontend, интеграционные и smoke прод-образа (`:129-149`).

**Почему энтропия.** «Зелёный CI» не означает, что данные и словари согласованы; расхождение обнаруживается на деплое
или в рантайме.

**Лечение.** Вызывать ровно `bun db:generate`; шаг «validate seed» без БД; инвариант-тест C-02.

### C-07 · `vue-tsc` без `--build`: `e2e/` и конфиги Vite/Playwright не типизируются ни локально, ни в CI · M · low

**Симптом.** `frontend/tsconfig.json` ссылается на `tsconfig.node.json` (там `vite.config.ts`, `playwright.config.ts`,
`e2e/**/*.ts`), но project references разрешаются только при `vue-tsc -b`, а скрипт вызывает `vue-tsc` без `-b`;
`include` корневого конфига эти файлы не содержит.

**Evidence.** `frontend/package.json:8` — `"typecheck": "vue-tsc"`; `:12` — `"build:types": "vue-tsc"`.
`frontend/tsconfig.json:25-30` — `include` только `src/**`, затем `references: [{ path: './tsconfig.node.json' }]`;
`frontend/tsconfig.node.json:14` — `"include": ["vite.config.ts", "playwright.config.ts", "e2e/**/*.ts"]`. Итого 11 файлов
`frontend/e2e/` + 2 конфига не проверяются; `bun typecheck` (`package.json:29`) их не достаёт.

**Почему энтропия.** «Typecheck зелёный» означает меньше, чем кажется: e2e-хелперы и конфиг Playwright — код, который
ломается при рефакторинге API, но узнают об этом при ручном запуске Playwright (в CI e2e намеренно нет, `README.md:311`).

**Лечение.** `vue-tsc -b` или отдельный `typecheck:node` (`-p tsconfig.node.json --noEmit`); проверить, что `-b` с
`composite`/`emitDeclarationOnly` не пишет `.d.ts` в репозиторий.

### C-08 · `bunfig.toml` подменяет `process.env.NODE_ENV` на `"development"` для backend-процесса · M · low

**Симптом.** `[define]` переписывает каждое чтение `process.env.NODE_ENV` в транспилируемом коде на литерал
`"development"`; envalid читает переменную через динамический ключ и видит настоящее значение. В одном процессе две
правды о режиме. Проверено.

**Evidence.** `backend/bunfig.toml:4-5` — `[define]` / `"process.env.NODE_ENV" = '"development"'`. Проба:
`cd backend && NODE_ENV=production bun -e 'console.log(process.env.NODE_ENV)'` → `development` (то же для `/tmp`-скрипта с
cwd=backend; `production` — при запуске из `/tmp`). Импорт реального `utils/enviroments.ts` печатает
`env.NODE_ENV: "production"` — envalid не задет. Следствие уже есть: `backend/src/__tests__/setup.ts:3-5`
(`if (process.env.NODE_ENV === 'test')`) — мёртвая ветка; `.env.example:5` и `README.md:104` описывают `NODE_ENV` как рычаг.

**Почему энтропия.** Конфиг, который молча врёт о состоянии окружения, обесценивает любой будущий `if
(process.env.NODE_ENV …)`. Прод стартует через `Dockerfile:47` (`bun run --cwd backend start`), т.е. подмена действует и
в контейнере.

**Лечение.** Убрать `[define]`, тестам передавать `NODE_ENV` через `[test]`/preload (`bunfig.toml:1-2` уже preload'ит
setup); добавить проверку `process.env.NODE_ENV` в тест, чтобы подмена не вернулась.

### C-09 · Документация расходится с кодом в шести конкретных местах · M · low

**Evidence.** `docs/api.md:234` — WS-кадр с `"genre": "GAMES"`; такого значения нет (`contract/src/enums.ts:37-44` — `GAME`).
`docs/api.md` не описывает `GET /weather` (0 упоминаний; роут — `gateway/weather.ts:65`; в гейтвее 72 роута, в документе 71).
`docs/architecture.md:103` — «Домен бросает `ApiError`…; Nest-исключений нет»; на деле 18 модулей импортируют
`@backend/utils/errors` (`HttpError` + `*Exception`), а `gateway/errors.ts:79-96` их мостит (B-01). `README.md:139-149` —
`VITE_BACKEND_TARGET` в разделе «Прод-переменные (`docker-compose.yml`)» с преамбулой «эти переменные не читает
приложение», хотя её читает `frontend/vite.config.ts:8` (dev-прокси). `README.md:218` — `modules/websocket/ … Типы
WS-событий`: файл `websocket.events.ts:4` лишь реэкспортирует контракт и держит `emitWs`, а `contract/src/ws.ts:6-10`
утверждает, что дубль удалён. `AGENTS.md:148` — 8 пресетов лимитов; `utils/rate-limits.ts:3-18` и `docs/api.md:38-49` — 10.

**Почему энтропия.** Два документа об одном (AGENTS vs api.md) противоречат друг другу; читатель выбирает один и получает
неверную картину. Дешёво в правке, дорого в доверии.

**Лечение.** 6 правок; защита — тест «все роуты гейтвея упомянуты в api.md» и «значения в примерах WS валидны по контракту».

### C-10 · Идемпотентность сида = «только если обе таблицы пусты»; обновление каталога невозможно по замыслу · M · low

**Симптом.** Сид наполняет каталог один раз и навсегда; правка снапшота после первого запуска никуда не доедет, а
расхождение «код vs прод-БД» ничем не измеряется.

**Evidence.** `database/src/seed/seed.ts:21-33` — `select count(*)` по двум таблицам; при ненулевом счётчике
`console.log('Каталог уже наполнен, бутстрап пропущен')` и `return` с кодом 0; upsert'а нет. Комментарий `seed.ts:8-13`:
«Источник правды — прод-база… на непустом каталоге молча выходит с кодом 0». Выполняется на каждом деплое:
`database/Dockerfile:20` — `CMD ["bun","run","migrate-and-seed"]` (`database/package.json:15`); root-скрипта
`db:migrate-and-seed` нет (`package.json:22`). `validate.ts:12-79` дублирует ограничения таблиц и запускается только здесь —
после ревью данных инвариант не перепроверяется никогда.

**Почему энтропия.** Два источника правды (файл-снапшот и прод-БД) без сверки: правка файла выглядит как исправление,
но не применяется; проверить можно только SQL'ом на сервере.

**Лечение.** Решить судьбу снапшота: (а) first-run — тогда данные переносятся в миграцию и убираются из редактируемых
файлов, либо (б) upsert по id с diff-отчётом; в любом случае `validateCatalog` в CI (C-06).

### C-11 · Линт не видит тесты и единственный ручной адаптер Eden; `no-explicit-any` — warning при DoD «нет any» · M · low

**Симптом.** oxlint проверяет 456 файлов из 570; исключены все тесты и `frontend/src/lib/api.ts` — 84-строчный слой с
`as`/`as unknown` на границе ошибок. `no-explicit-any` не блокирует CI.

**Evidence.** `.oxlintrc.json:24-31` — `ignorePatterns`: `"frontend/src/lib/api.ts"`, `"**/__tests__/**"`, `"**/*.spec.ts"`.
Тестовых `*.spec.ts` — 100 (79 backend + 21 frontend) из 570 TS/Vue; прогон `oxlint .` печатает `Finished … on 456 files`
и `Found 1 warning` (`wordle.ts:247`). `.oxlintrc.json:20` — `"typescript/no-explicit-any": "warn"`, при этом DoD требует
«нет новых `any`» (`docs/refactor/README.md:48`). `frontend/src/lib/api.ts:39-41,63,67` — приведение `result.error as
EdenErrorEnvelope`, `result.data as T`: именно тот файл выведен из линта без обоснования. `.oxfmtrc.json:2` —
`"ignorePatterns": []`: форматтер, в отличие от линтера, не исключает ничего, и асимметрия не задокументирована.

**Почему энтропия.** «Линт зелёный» не покрывает 18% кода и все тесты; правило-запрет оформлено предупреждением и
превращается в шум; исключение `api.ts` закрепляет единственную стыковку типов с рантаймом вне контроля.

**Лечение.** Снять тест-паттерны из ignore (или оставить с комментарием-обоснованием); `no-explicit-any` → `error`;
для `api.ts` — точечный disable с комментарием вместо файла целиком.

### C-12 · Enum-топология: два пути импорта, цепочка через `@gmd/database`, мёртвый четвёртый список имён · M · low

**Симптом.** Значения импортируются из двух пакетов: `@backend/enums` (40 не-тестовых файлов) и `@gmdb/contract` (18);
два модуля используют оба пути в одном файле. `@backend/enums` — 8 однострочных реэкспортов через `@gmd/database`, т.е.
ради константы подтягивается пакет со схемой и drizzle. Плюс мёртвый четвёртый список имён. Имена пакетов расходятся:
`@gmdb/contract` vs `@gmd/database`.

**Evidence.** `backend/src/enums/index.ts:1-8` и 7 файлов вида `export { RecordStatus } from '@gmd/database'`
(`record-status.enum.ts:1`); источник — `database/src/schema/enums.ts:16-28`, сам реэкспорт `@gmdb/contract`. Смешанный
импорт: `modules/user/customization.achievements.ts:1-3`, `modules/wordle/wordle.stats.ts:1-3`. `enums.names.ts:1-8` —
четвёртая копия имён, 0 вхождений по репозиторию; она же единственная, где `AccountPlatform` назван своим именем, хотя
pgEnum — `Platform` (`database/src/schema/enums.ts:64`). `contract/package.json:2` — `@gmdb/contract`,
`database/package.json:2` — `@gmd/database`, оба в `backend/package.json:16-17`.

**Почему энтропия.** Два канонических пути к одному значению → новый код выбирает случайный, «где живёт enum» перестаёт
быть ответом на один вопрос. Реэкспорт через пакет с БД тянет лишнюю зависимость в слои, которым схема не нужна.

**Лечение.** Один путь — `@gmdb/contract` (в БД `enums.ts` уже так); `backend/src/enums/` и `enums.names.ts` удалить
(deletion test: правка импортов в 40 файлах, семантика не меняется). Имя `@gmd/database` — только по решению владельца (§5).

### C-13 · Версия Bun зашита в 7 местах, TypeScript — в трёх версиях, `engines` отсутствует · S · low

**Evidence.** `1.4.4`: `Dockerfile:1,12,21,32`, `database/Dockerfile:1,11`, `.github/workflows/checks.yaml:37` (плюс
`@types/bun` в трёх пакетах) — 7 независимых пинов. `package.json:35-37` — `"dependencies": { "typescript": "6.0.2" }` (именно
в `dependencies`); `backend/package.json:30`, `database/package.json:30`, `contract/package.json:15` — `7.0.2`;
`frontend/package.json:49` — алиас `npm:typescript-native-bridge@6.0.3-bridge.18.tsgo.7.0.2`. `bun check -b`
(`backend/package.json:8`) — встроенный чекер Bun, установленный `typescript` не использует; потребителя корневого
`typescript@6.0.2` по коду не видно — `[?]`. `engines`/`packageManager` отсутствуют во всех пяти `package.json` (grep 0).

**Почему энтропия.** Обновление Bun — 7 правок; забытая даёт «CI на 1.4.4, образ на другой». Три версии TS усложняют диагностику.

**Лечение.** `"packageManager": "bun@1.4.4"` + `engines.bun`; единый `ARG BUN_VERSION` в Dockerfile; корневой
`typescript` удалить либо перенести в devDependencies с обоснованием.

### C-14 · Для 502 нет текста ошибки: `HttpStatus.BAD_GATEWAY` есть, `STATUS_TEXT` — нет · S · low

**Evidence.** `backend/src/utils/errors.ts:19-29` — `HttpStatus` с `BAD_GATEWAY: 502` и `SERVICE_UNAVAILABLE: 503`;
`backend/src/gateway/errors.ts:60-69` — `STATUS_TEXT` без 502; `:75,94` — `STATUS_TEXT[statusCode] ?? 'Error'`. Конверт —
внешний контракт (`docs/api.md:13-19`): для 502 поле `error` будет нестандартным. Само дублирование иерархий — B-01;
здесь фиксируется единственное фактическое расхождение значений.

**Лечение.** Один источник текстов (`node:http` `STATUS_CODES` или общий `STATUS_TEXT`), тест на все уходящие наружу статусы.

### C-15 · tsconfig: `strict: false` с ручным списком флагов, мёртвые опции, асимметрия пакетов · S · low

**Evidence.** `backend/tsconfig.json:10-25` — `"strict": false`, затем вручную `strictBindCallApply/strictFunctionTypes/
strictNullChecks/strictPropertyInitialization/noImplicitAny/noImplicitThis: true`; `:22` — `"noPropertyAccessFromIndexSignature":
false` (значение по умолчанию, шум); `:26-33` — `declaration: false`, `sourceMap: true`, `removeComments: true` при `noEmit:
true`. `database/tsconfig.json:13-14` и `contract/tsconfig.json:6-9` — `strict: true`; `frontend/tsconfig.json:12` — через
`@vue/tsconfig`. Корневого `tsconfig` нет: `.sh`-скрипты не типизируются ничем, `bun typecheck` фильтрует только пакеты (`:29`).

**Лечение.** `strict: true` + точечные исключения с комментарием; удалить `declaration/sourceMap/removeComments`; при
желании — корневой `tsconfig` с `references`.

### C-16 · `records.updatedAt`: колонка поддерживается БД, но не описана моделями и не читается запросами · S · high

**Evidence.** `database/src/schema/records.ts:19-22` — `updatedAt: isoTimestamp('updatedAt').default(currentTimestamp)
.notNull().$onUpdate(() => currentTimestamp)`. `gateway/records.ts:35-55` — `RecordEntity` без `updatedAt` (Elysia срезает
неописанные поля); `modules/record/record.entity.ts:21-58` — тоже без него. grep вне тестов даёт только `record-ratings`
(`gateway/ratings.ts:29`, `rating.entity.ts:18`, `drizzle-rating.repository.ts:40,103`) — у записей потребителя нет.

**Почему энтропия.** Поле выглядит как контракт («обновлено»), но им нельзя воспользоваться; удаление требует миграции,
т.е. решение дорогое. Это случай, когда «не трогать» — тоже вывод.

**Лечение.** Решение владельца: выставить наружу (добавить в `RecordEntity` + фронт) либо удалить колонку миграцией.

## 4. Кандидаты в пул задач

| Prio | ID   | Батч (один commit)                                                                                      | Deps       | Риск         |
| ---- | ---- | ------------------------------------------------------------------------------------------------------- | ---------- | ------------ |
| 1    | C-02 | Инвариант-тест `pgEnum` ≡ `contract/src/enums.ts`; зафиксировать порядок и имена комментарием           | —          | low          |
| 2    | C-03 | `api-types.ts` → только `.static`-алиасы (или удаление файла); удалить 25 мёртвых имён                  | —          | low          |
| 3    | C-01 | Типизированный `source` в seed-типах + расширение `validateCatalog` (неиспользуемые ингредиенты, `iba`) | C-10       | low          |
| 4    | C-04 | `devDefault` для `TELEGRAM_*`, обязательный `KICK_CALLBACK_URL`, тест «в prod нет localhost-дефолтов»   | —          | med (env)    |
| 5    | C-08 | Убрать `[define]` NODE_ENV, перенести в `[test]`; проверить прод-старт контейнера                       | —          | low          |
| 6    | C-06 | CI: drift через `bun db:generate`, шаг validate seed, тест инвариантов enum                             | C-01, C-02 | low (CI)     |
| 7    | C-07 | `vue-tsc -b` / отдельный `typecheck:node` для `e2e/` и конфигов                                         | —          | low          |
| 8    | C-10 | Решение о снапшоте: first-run или upsert + diff-отчёт                                                   | —          | low          |
| 9    | C-09 | Синхронизировать 6 точек документации; тест «роуты ⊂ api.md»                                            | —          | low          |
| 10   | C-12 | Один путь импорта enum'ов (`@gmdb/contract`); удалить `backend/src/enums/` и `enums.names.ts`           | —          | low          |
| 11   | C-11 | Линт на тесты и `lib/api.ts`; `no-explicit-any` → error                                                 | —          | low          |
| 12   | C-05 | Полный список обязательных ключей в `render-env.sh`; чистка dev-`.env`                                  | —          | med (деплой) |
| 13   | C-13 | `packageManager`/`engines` + `ARG BUN_VERSION`; ревизия трёх TypeScript                                 | —          | low          |
| 14   | C-14 | Единый `STATUS_TEXT`/`STATUS_CODES`, тест на 502                                                        | —          | low          |
| 15   | C-15 | `strict: true` в backend + чистка мёртвых опций tsconfig                                                | —          | low          |
| 16   | C-16 | Решение владельца по `records.updatedAt` (выставить / удалить миграцией)                                | —          | high (схема) |

## 5. Что не трогать

- **Схема БД и миграции** (`database/src/schema/*`, `database/migrations/*`): переименование pgEnum'ов, порядок значений,
  удаление `records.updatedAt` — только `bun db:generate` и с решением владельца; тест-инвариант (C-02) безопасен.
- **Деплой/CI/Docker**: `docker-compose*.yml`, `Dockerfile`, `docker.yaml`, `render-env.sh`, `rollback.sh` — механика не
  меняется, допустимы только аддитивные проверки (C-05/C-06).
- **WS-протокол** (`contract/src/ws.ts`, `gateway/ws.ts`) и **конверт ошибок** (`docs/api.md:13-19`): внешний контракт,
  дубля нет; менять можно только источник текстов (C-14).
- **Числа rate-limit** (`utils/rate-limits.ts:3-18`): совпадают с `docs/api.md:38-49`, менять только вместе с документацией.
- **Имена пакетов** `@gmdb/contract`/`@gmd/database` и публичные команды `bun db:*`, `bun dev*`: переименование — ломающее.
- **Seed-контент**: рецепты (названия, пропорции, `note`) — продуктовая ценность; рефакторинг формы (C-01) их не меняет.
