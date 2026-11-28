# Ревью батча B-10 (batch 11) — `4471595` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                       |
| Коммит           | `4471595` (родитель — `90c6c6c`), 16 файлов, +214/−40                                                                                                                                                                                                                                      |
| Ревьюер          | `review-batch11` (не автор коммита; только diff, изолированный worktree и прогоны)                                                                                                                                                                                                         |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                 |
| Что сделано мной | работал в `/tmp/review-b11` (detached `4471595`, `bun install --frozen-lockfile`, `backend/.env` скопирован, интеграция — на dev-postgres `lists_test`); мутации правил откачены, worktree удалён; в основном дереве создан только этот отчёт, код не менялся, коммитов нет                |
| Не запускалось   | Playwright e2e, `docker build` — вне предмета батча                                                                                                                                                                                                                                        |
| Важно            | на `4471595` `bun typecheck` и `cd frontend && bun run build` красные из-за трёх мёртвых `RotateCw` из `41ae5e6` (батч 8, блокер B1 в `reviews/batch-08.md`). Фронта в диффе нет, блобы этих трёх файлов на `4471595` и на родителе `90c6c6c` совпадают; в ветке позже есть фикс `df972f6` |

## Вердикт

**APPROVE.** Все заявленные пункты проверены на изолированном worktree, унаследованных
и внесённых регрессий в диффе не найдено.

- Logger действительно фильтрует уровни, сохраняет формат `[Context] message`, каналы
  `console.*` и хвостовые аргументы; `log` = `info`; `debug` по умолчанию скрыт.
- Уровень из env реально применяется: `configureLogger(env.LOG_LEVEL)` стоит в `main.ts:21`,
  до `createContainer()` (`:23`) и `container.init()` (`:34`); фильтр читает глобальный
  `minLevel` в момент записи (`logger.ts:44`), поэтому логгеры, созданные на уровне модуля
  при импорте, всё равно фильтруются правильно.
- Шесть `console.*` из пяти runtime-файлов переведены без потери контекста и аргументов
  (структурированный объект в `response schema violation` и `Error` в `unhandled error`
  сохранены); контексты переименованы, но не задвоены.
- `DrizzleService(DSN)` больше не читает env; единственный вызов — `container.ts:82`
  с `env.DATASOURCE_URL`; фолбэк `?? ''` был недостижим и раньше (env валидируется при
  импорте контейнера), поведение при отсутствии переменной не изменилось.
- Обе машинные ловушки проверены мутацией: временный `console.log` в `backend/src/**` валит
  oxlint (включая файлы в корне `backend/src`), временный `process.env` в модуле валит
  `architecture.spec.ts`. Текущий allowlist не маскирует ни одного реального нарушения.
- Прогоны: lint 0/0, format 0/0, backend 708 pass, frontend 128 pass, integration 61 pass,
  backend typecheck 274 файла без ошибок. Красный `bun typecheck`/`frontend build` —
  унаследованный дефект батча 8, не относящийся к диффу (см. «Замечания», F1).

Внешние контракты не затронуты: HTTP-роуты, коды и конверт ошибок, WS-события, cookie,
формат данных в БД — без изменений; env-контракт расширен аддитивно (`LOG_LEVEL`
необязателен, безопасный дефолт `info`, dev — `debug`).

## Что в коммите

16 файлов, +214/−40 (`git show --stat 4471595`):

- `backend/src/utils/logger.ts` (+36/−19): уровни `debug|info|warn|error` с приоритетами,
  `configureLogger(level)`, глобальный `minLevel`, фильтрация в `write()`, `log → info`;
  формат `[Context] message` и проброс `...params` сохранены.
- `backend/src/utils/__tests__/logger.spec.ts` (+66, новый): контекст, уровни,
  фильтрация, скрытый `debug`, нестроковые сообщения.
- `backend/src/main.ts` (+4): `configureLogger(env.LOG_LEVEL)` до `createContainer()`.
- `backend/src/utils/enviroments.ts` (+6): `LOG_LEVEL` с `choices`, `default: 'info'`,
  `devDefault: 'debug'`; `backend/.env.example` (+3): комментарий и `LOG_LEVEL=info`.
- Перевод console: `gateway/index.ts` (2 сайта, `const logger = new Logger('Gateway')`),
  `gateway/ws.ts` (1, `WS`), `utils/domain-events.ts` (1, `DomainEvents`),
  `server/lifecycle.ts` (дефолтный `LogFn`, `Lifecycle`), `server/container.ts`
  (rate-limit warn, `RateLimit`; плюс явная передача логгера в `Lifecycle`).
- `backend/src/database/drizzle.service.ts` (+2/−3): `constructor(connectionString: string)`,
  `new Pool({ connectionString })`, удалён `import process`.
- `.oxlintrc.json` (+27/−2): override `eslint/no-console: "error"` для `backend/src/**/*.ts`
  с `excludeFiles` (main, logger, `__e2e__`, `__integration__`, wordle scripts); остальное —
  переформатирование существующих правил.
- `backend/src/__tests__/architecture.spec.ts` (+33/−8): новый тест «process.env только через
  `utils/enviroments.ts`», перенос JSDoc внутрь `describe`, удаление мёртвой ветки `.vue`
  из `resolveSpecifier` (в backend `.vue` нет — безвредно).
- Docs: `docs/architecture.md` (§ «Логирование и конфигурация»), `backend/src/AGENTS.md`
  (строка таблицы + 2 anti-pattern), `AGENTS.md` (3 строки про логи и env).

Новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable` в диффе нет (добавленные
строки прогнаны через `grep -E "as unknown|: any|@ts-ignore|eslint-disable"` → пусто),
`git show --check` чист.

## Прогоны (в `/tmp/review-b11`, дерево чистое после откатов мутаций)

| Проверка                                     | Результат                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`              | exit 0 — `450 packages installed`                                                                                                                        |
| `bun lint`                                   | exit 0 — `Found 0 warnings and 0 errors`, 439 файлов, 96 правил                                                                                          |
| `bun format:check`                           | exit 0 — `All matched files use the correct format`, 619 файлов                                                                                          |
| `bun typecheck`                              | **exit 2** — frontend: 3× TS6133 `RotateCw` (F1, вне диффа); contract 7 / database 41 / backend **274** файла — ошибок нет                               |
| `cd backend && bun test`                     | exit 0 — **708 pass / 0 fail**, 85 файлов, 36 285 `expect` (сходится с телом коммита)                                                                    |
| `cd backend && bun run build`                | exit 0 — `bun check -b`: `✓ No type errors in 274 files`                                                                                                 |
| `integration` (dev-postgres `lists_test`)    | `setup-db` → `✅ test database ready: lists_test`; `RUN_DB_TESTS=1 bun test src/__integration__` → exit 0, **61 pass / 0 fail**, 13 файлов, 204 `expect` |
| `cd frontend && bun test src`                | exit 0 — **128 pass / 0 fail**, 21 файл, 200 `expect` (baseline 126 + 2 из батча 8)                                                                      |
| `cd frontend && bun run build`               | **exit 1** — `build:ci` (vite) `✓ built in 959ms`, `build:types` (vue-tsc) падает на тех же 3× `RotateCw` (F1)                                           |
| `logger.spec` / `architecture.spec` отдельно | 5 pass / 7 `expect`; 2 pass / 2 `expect`                                                                                                                 |
| `git show --check 4471595`                   | чисто (whitespace-ошибок нет)                                                                                                                            |

## Пункт 1. Поведение Logger

Проба (в worktree, `console.*` подменён на сбор аргументов, уровень менялся
`configureLogger`):

| Сценарий                                              | Результат                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `new Logger('Ctx').log('m1')`                         | `console.log('[Ctx] m1')`                                                |
| `new Logger().log('noctx')`                           | `console.log('noctx')` — без префикса, как раньше                        |
| `warn` / `error`                                      | `console.warn('[Ctx] w')` / `console.error('[Ctx] e')`                   |
| `error('structured', { type, path }, 42)`             | `console.error('[Ctx] structured', { type, path }, 42)` — аргументы целы |
| default (модульный `minLevel = 'info'`), `debug('d')` | не печатается; `log`/`warn`/`error` печатаются                           |
| `configureLogger('debug')`                            | `debug` и `info` печатаются (оба через `console.log`)                    |
| `configureLogger('error')`                            | печатается только `error`; `debug`/`log`/`warn` отфильтрованы            |

Env-дефолты (проба `bun -e` с импортом `enviroments.ts`, `backend/.env` = `NODE_ENV=development`):

- без `LOG_LEVEL`, `NODE_ENV=development` → `debug` (devDefault);
- без `LOG_LEVEL`, `NODE_ENV=production` (+ `WORDLE_ANSWERS_SALT`) → `info`;
- явный `LOG_LEVEL=info` в dev → `info` (явное значение сильнее `devDefault`);
- `LOG_LEVEL=trace` → envalid: `Value "trace" not in choices [debug,info,warn,error]`, exit 1.

Отдельно проверена известная ловушка `bunfig.toml`: там `[define]` переписывает
`"process.env.NODE_ENV"` в транспилируемом коде на `"development"` (карта C-08), и в проде
`process.env.NODE_ENV` действительно читается как `development`. Но `envalid` валидирует
переданный объект `process.env` — `env.NODE_ENV = production`, `env.LOG_LEVEL = info`.
То есть devDefault не протекает в прод.

Поведенческое изменение сознательное и заявленное: раньше уровней не было (`debug`
печатался всегда, `log` печатался при любом уровне), теперь есть фильтр. Сайтов `debug`
в рантайме пока нет, поэтому на текущие логи это не влияет; при `LOG_LEVEL=warn|error`
`log`-записи глохнут — это и есть смысл уровня.

`main.ts:42,43,47` по-прежнему используют `console.log` для startup/shutdown — это
задокументированное исключение (main разрешён), но знать стоит: `LOG_LEVEL=warn` эти
три строки не заглушит.

## Пункт 2. Перевод `console.*` — ничего не потеряно

| Файл:родитель               | Было                                                                   | Стало (HEAD)                                                                        |
| --------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gateway/index.ts:79`       | `console.error('[gateway] response schema violation', { type, path })` | `gateway/index.ts:82` — `logger.error('response schema violation', { type, path })` |
| `gateway/index.ts:110`      | `console.error('[gateway] unhandled error', error)`                    | `gateway/index.ts:113` — `logger.error('unhandled error', error)`                   |
| `gateway/ws.ts:69`          | `console.warn('[gateway] не удалось отправить …')`                     | `gateway/ws.ts:72` — `wsLogger.warn('не удалось отправить …')` → `[WS] …`           |
| `utils/domain-events.ts:35` | `console.warn('[events] обработчик … упал')`                           | `utils/domain-events.ts:38` → `[DomainEvents] …`                                    |
| `server/lifecycle.ts:23`    | `default log = (m) => console.warn(m)`                                 | `server/lifecycle.ts:25` — `new Logger('Lifecycle').warn(m)`                        |
| `server/container.ts:185`   | `console.warn('[gateway] Redis недоступен…')`                          | `server/container.ts:186` → `[RateLimit] Redis недоступен…`                         |

**Проверено:** структурированный объект `{ type, path }` в первом сайте сохранён ровно
как второй аргумент (не превращён в строку), `Error` во втором — тоже (стек не теряется).
Контекст не задвоен: сообщения очищены от старого `[gateway]`/`[events]`, префикс даёт
Logger. Контексты переименованы (`gateway` → `Gateway`/`WS`/`RateLimit`, `events` →
`DomainEvents`) — это не потеря, но если в Dozzle/алертах ищут по `[gateway]`, grep
изменится; внешним контрактом логи не являются.

Остаток `console.*` на HEAD (`git grep`): `main.ts` (3), `utils/logger.ts` (3, сам фасад),
`modules/wordle/scripts/build-dictionary.ts` (4), `__integration__/setup-db.ts` (2),
`__e2e__/seed.ts` (2) — все в разрешённых категориях, runtime-модулей среди них нет.

Оговорка к телу коммита: там сказано «7 `console.*`», фактически переведено **6** в 5
файлах (карта `maps/hygiene.md` §6.1 считала `container.ts` как 3 сайта — устарела ещё
до батча). На код это не влияет, см. N4.

## Пункт 3. `DrizzleService(DSN)`

- `backend/src/database/drizzle.service.ts:11-13`: `constructor(connectionString: string)`,
  `new Pool({ connectionString })`; `import process from 'node:process'` удалён; других
  чтений env в файле нет.
- `backend/src/server/container.ts:82`: `lifecycle.add(new DrizzleService(env.DATASOURCE_URL))`.
  Других конструкторов нет: `git grep "new DrizzleService"` → только container.
  Интеграционные хелперы создают `pg.Pool` сами (карта фиксирует
  `{} as unknown as DrizzleService`), поэтому смена сигнатуры их не задевает.
- Отсутствие `DATASOURCE_URL`: и раньше `?? ''` был недостижим — `container` импортирует
  `env`, а envalid падает на отсутствующей обязательной переменной при импорте, до
  создания сервиса. Поведение не изменилось (ошибка конфигурации на старте).
- Явно пустое значение (`DATASOURCE_URL=`) envalid принимает как `''` (проверено:
  `env.DATASOURCE_URL === ""`), и тогда `Pool('')` ведёт себя как раньше — поздняя ошибка
  pg теоретически остаётся. Это не регрессия (фолбэк `?? ''` был мёртв, а `str({})` без
  `choices` пустые строки не отвергает), но формулировка коммита «пустой DSN больше не
  превращается в позднюю ошибку pg» точна только для отсутствующей переменной, см. N4.
- Интеграционные тесты: 61 pass на `lists_test` (13 файлов); сборка/типы: backend 274 файла
  без ошибок; `container.spec.ts` создаёт контейнер с реальным `env.DATASOURCE_URL` — зелёный
  (Pool ленивый, соединений не открывает).

## Пункт 4. Машинные ловушки (мутации)

**oxlint `no-console`.** В `backend/src/gateway/index.ts` временно добавлен `console.log`:

```
x eslint(no-console): Unexpected console statement.
  ,-[backend/src/gateway/index.ts:149:1]
Found 0 warnings and 1 error.        (exit 1)
```

Дополнительно проверено, что глоб покрывает файлы в корне `backend/src`:
`console.log` в `backend/src/api-types.ts` → `1 error` (окно `backend/src/**/*.ts` матчит
и нулевую глубину). Контрольные случаи: `backend/src/main.ts` с существующими
`console.log` → `0 errors` (excludeFiles), `console.log` во фронтовом пробнике →
`0 errors` (правило включено только для backend). После откатов дерево чистое.

Allowlist не маскирует нарушения: на HEAD «запрещённых» `console.*` вне разрешённых путей
нет (полный список выше в п. 2), а разрешённые каталоги содержат только скрипт словаря,
`setup-db.ts`, `seed.ts` и `__tests__`/`__integration__`/`__e2e__` харнессы (`find` по этим
каталогам — только скрипты и тестовые хелперы).

**`architecture.spec.ts`: `process.env` только в `enviroments.ts`.** Мутация
`const mutant = process.env.MUTANT` в `backend/src/utils/cors-origins.ts`:

```
error: expect(received).toEqual(expected)
+   "utils/cors-origins.ts",
(fail) архитектура backend > читает process.env только через utils/enviroments.ts
```

Тест не тавтологичен (читает все `.ts` под `backend/src`, включая вложенные каталоги);
на чистом дереве — `2 pass`. Текущие чтения env: `utils/enviroments.ts` + top-level
харнессы (`__tests__/setup.ts`, `__integration__/setup-db.ts`, `helpers/db.ts`,
`__e2e__/seed.ts`), т.е. allowlist обоснован и не скрывает prod-код.

Обнаруженные ограничения обеих ловушек (не блокеры, сейчас не срабатывают):
`Bun.env.MUTANT` в модуле спек не валит (мутация → `2 pass`), `globalThis.console.log`
oxlint не валит (`0 errors`), `process['env']` тоже не ловится. Ловушки защищают обычное
написание, а не любой обход; в дереве таких обходов нет. Подробнее N1/N2.

## Пункт 5. Тесты, моки консоли и глобальный `configureLogger`

- Ни один существующий спек не мокает `console.*` и не мокает `@backend/utils/logger`
  (`grep mock.module`, `spyOn(console` → только новый `logger.spec.ts`). `lifecycle.spec.ts`
  по-прежнему передаёт свой `log`-мок, тесты на дефолтный путь (`new Lifecycle()`) зелёные.
- Спеки, которые раньше полагались на старые тексты (`[gateway]`, `[events]`,
  «Redis недоступен», `unhandled error`), отсутствуют — `grep` по `*.spec.ts` пуст.
- Глобальное состояние `configureLogger`: `logger.spec.ts` восстанавливает `info` в
  top-level `afterEach` (строка 8), а `info` — это и есть стартовое значение `minLevel`,
  так что утечки между файлами нет; буновские файлы идут последовательно, уровень меняет
  только этот спек. Полный прогон 708 pass это подтверждает.
- Мелкие пробелы теста (N5): `mockRestore()` вызывается в конце тела теста, а не в
  `afterEach`, поэтому упавший assert оставит `console`-шпион активным до конца прогона;
  нет теста на проброс `...params` (структурный аргумент) и на то, что уровень `error`
  глушит `warn`.

## Пункт 6. Документация

- `docs/architecture.md:114-123` — раздел «Логирование и конфигурация» соответствует коду:
  фасад `Logger`, уровень из `LOG_LEVEL` (devDefault `debug`), `configureLogger` в `main.ts`,
  `console.*` только в main/скриптах/харнессах (совпадает с `.oxlintrc.json:44-53`),
  `process.env` только в `utils/enviroments.ts` (совпадает с `architecture.spec.ts:92`),
  `DrizzleService(env.DATASOURCE_URL)`. Строки ≤ 100 символов, предложения не разорваны.
- `backend/src/AGENTS.md:42` (строка «Логи» в таблице), `:67-68` (anti-pattern) —
  соответствуют коду; таблица не поехала.
- Корневой `AGENTS.md:150-152` — соответствует, но в перечне исключений для `console.*`
  нет тестовых харнессов (`__e2e__`, `__integration__`), которые тоже в allowlist (N6);
  `docs/architecture.md` в этом месте точнее.
- `backend/.env.example:63-64`: комментарий «devDefault — debug» и значение
  `LOG_LEVEL=info` в одном блоке — см. N3.

## Замечания

### F1 (унаследованный блокер ветки, не диффа)

На `4471595` `bun typecheck` exit 2 и `frontend build` exit 1 из-за трёх неиспользуемых
импортов `RotateCw` (`MediaPage.vue:2`, `UserRatingsPage.vue:2`, `StatsPage.vue:2`).
Причина — `41ae5e6` (батч 8, там это уже блокер B1). Доказательство непричастности батча 11:
`git diff --stat 90c6c6c 4471595` не содержит `frontend`, блобы трёх файлов на обоих
коммитах идентичны. В ветке есть фикс `df972f6`; на момент ревью основной чекаут уже
содержит его и более поздние коммиты. До мержа PR красный `typecheck` недопустим (DoD),
но чинить его должен не этот батч.

### Не блокеры

- **N1. Allowlist enviroments-спека не покрывает вложенные тесты.** Условие пропуска —
  `rel.startsWith('__tests__/')`, т.е. только `backend/src/__tests__/`; тест, лежащий в
  `backend/src/modules|gateway|server|utils/__tests__/`, считается prod-кодом. Мутация
  `process.env.NESTED_TEST_MUTANT` в `modules/auth/__tests__/auth-telegram.spec.ts` →
  спек падает с `"modules/auth/__tests__/auth-telegram.spec.ts"`, хотя комментарий в самом
  тесте объявляет тестовые харнессы исключением (и oxlint через `**/__tests__/**` их
  игнорирует). Сейчас таких чтений нет — зелено; но будущий спек, читающий env, получит
  ложное падение. Фикс: проверять сегмент пути (`/(^|\/)__tests__\//`) и/или пропускать
  `rel.endsWith('.spec.ts')`.
- **N2. Ловушки защищают только каноничное написание.** `Bun.env.X` проходит и lint, и
  architecture.spec (проверено мутацией); `globalThis.console.log` проходит oxlint
  (проверено); `process['env']` спека не ловит по построению (regex `\bprocess\.env\b`).
  Обходов в дереве нет, поэтому не блокер; если нужна жёсткость — добавить `Bun.env` в regex
  и рассмотреть `no-restricted-globals`-вариант.
- **N3. `.env.example` противоречит собственному комментарию.** `LOG_LEVEL=info` —
  явное значение, оно сильнее `devDefault` (проба: `NODE_ENV=development` + `LOG_LEVEL=info`
  → `info`). Скопировавший пример разработчик получит `info`, хотя комментарий и
  `docs/architecture.md` обещают `debug`. Либо закомментировать строку/поставить `debug`,
  либо в комментарии сказать, что пример задаёт `info` явно.
- **N4. Неточности в теле коммита.** «7 `console.*`» — фактически 6 (см. п. 2);
  «пустой DSN больше не превращается в позднюю ошибку pg» — отсутствующая переменная и
  раньше падала на envalid (фолбэк был мёртв), а явно пустая строка envalid пропускает как
  `''`, т.е. поздний путь pg для неё остаётся. Код при этом корректен.
- **N5. Гигиена `logger.spec.ts`.** `mockRestore()` в теле тестов (при падении assert
  шпион остаётся), нет кейсов на проброс аргументов и на порог `error`; тест «hides debug by
  default» явно вызывает `configureLogger('info')`, т.е. проверяет конфигурируемое значение,
  а не стартовое. Всё это мелочи, на зелёность не влияет.
- **N6. Документация про исключения `console.*`.** `backend/src/AGENTS.md:67` и корневой
  `AGENTS.md:151` перечисляют logger/main/скрипты, но не `__e2e__/` и `__integration__/`,
  которые тоже в allowlist; `docs/architecture.md:119` формулирует точнее («тестовые
  харнессы»). Расхождение безвредное, но формально документы разошлись с конфигом.
- **N7. Лишняя обвязка в `container.ts:81`.** `new Lifecycle((message) => new Logger('Lifecycle').warn(message))`
  дословно дублирует новый дефолт `Lifecycle` (`lifecycle.ts:25`) — достаточно
  `new Lifecycle()`; это ровно та «single source», которую батч наводит. Туда же — стиль
  импортов: `ws.ts:1-3` и `domain-events.ts:1-3` объявляют `const` между импортами, а
  `lifecycle.ts:18` держит `import` после интерфейсов. Синтаксис легален, `format:check`
  зелёный (oxfmt не переставляет импорты через операторы), но «импорты сверху» соблюдено
  не везде.
- **N8. Карта `maps/hygiene.md` §6.1–6.2 не обновлена** под закрытие батча: там всё ещё
  «7 вызовов» и «единственный prod-байпас» как открытые находки. По правилам кампании
  раздел карты обновляется при закрытии батча; на дифф это не влияет, отметить для
  bookkeeping (tasks.md/`progress.md` уже актуализированы вне коммита).

### Внешние контракты

Не менялись: роуты/коды/конверт ошибок, WS-события и payload, cookie `token`, схема и
формат данных в БД. Env-контракт расширен аддитивно и безопасно: `LOG_LEVEL` необязателен,
дефолт `info` (prod) / `devDefault: debug`, невалидное значение валит старт (envalid),
`render-env.sh` + `env_file: .env` в прод-компоузе пропускают переменную как есть.
`DrizzleService` — внутренняя сигнатура, не публичный контракт.
