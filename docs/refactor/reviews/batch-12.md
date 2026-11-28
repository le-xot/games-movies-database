# Ревью батча 12 (B-11 / G-02) — `1757fb7` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                     |
| Предмет          | `1757fb7` (родитель — `b77235c`), 14 файлов, +94/−77                                                                                                                                                                                                                                                                                                                     |
| Ревьюер          | `review-batch12` (не автор коммита; только diff, изолированный detached-worktree и прогоны)                                                                                                                                                                                                                                                                              |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                               |
| Что сделано мной | `/tmp/review-b12` (detached `1757fb7`, `bun install --frozen-lockfile` → 450 пакетов, `backend/.env` скопирован); сравнение старых функций с новыми на матрице из 120 случаев (пробник в `/tmp`, не в репозитории); мутационные проверки инварианта в worktree с откатом (`git status` чистый); в основном дереве создан только этот отчёт, код не менялся, коммитов нет |
| Не запускалось   | интеграционные тесты (`RUN_DB_TESTS=1`), Playwright e2e, `docker build` — предмет backend-юнит + прогоны кампании                                                                                                                                                                                                                                                        |
| Важно            | на старте ревью HEAD ветки = `1757fb7`, к концу — `d2e3a47` (docs-коммит ADR/журнала, вне предмета); в основном дереве параллельно правятся файлы фронта — к предмету не относятся. Номера строк ниже относятся к `1757fb7`                                                                                                                                              |

## Вердикт

**APPROVE.** Блокеров нет: `secretsMatch` эквивалентен обеим прежним функциям (120/120 случаев совпали, включая
пограничные), внешнее поведение `/twir` и Telegram-вебхука не изменилось, типы каталога перенесены байт-в-байт,
новый инвариант падает от канонической мутации, все обязательные прогоны зелёные, включая `bun typecheck` с
**холодным** кешем `vue-tsc`. Ниже — четыре не блокера (доки и ужесточение теста); код править не нужно.

### Блокеры

Нет.

### Не блокеры

- **N1. Устаревшие ссылки в документации проекта.** `README.md:420` («сверяется в `backend/src/utils/api-key.ts`») и `README.md:455`
  («`isApiKeyValid` из `backend/src/utils/api-key.ts`») указывают на удалённый файл; концептуально фраза («сравнение в
  постоянном времени») верна, путь — нет. В `docs/refactor/maps/backend.md:255-256` те же два упоминания — карты
  синхронизирует отдельная задача **G-04** (P2), поэтому для карт это ожидаемо; README под G-04 не подпадает.
  Фикс — две строки в closing-docs-коммите (или в этом батче): `utils/api-key.ts` / `isApiKeyValid` → `utils/secrets.ts` / `secretsMatch`.
- **N2. Инвариант уже своей формулировки в `backend/src/AGENTS.md:58`.** Док говорит «Из `modules/` гейтвею разрешены
  **только чистые функции и константы** — это проверяет `__tests__/architecture.spec.ts`», а спек проверяет ровно одно:
  отсутствие `from '@backend/modules/**/*.service'` (`architecture.spec.ts:100-104`). Мутационно подтверждено (см. п. 4),
  что это ловит канонический и type-only импорт сервиса, но проходят: относительный путь
  `../modules/cocktail/cocktail.service` (не ловится и `bun typecheck`), side-effect `import '@backend/…/x.service'`,
  динамический `import('@backend/…/x.service')`, а также импорт **не-`.service`** файла модуля (например, репозитория) —
  то есть «чистоту» спек не проверяет. Варианты: (а) переформулировать AGENTS в «не импортирует `*.service`» — одна строка;
  (б) дешёвое ужесточение теста — использовать уже существующие в этом же спеке `resolveSpecifier` и общий регэксп
  импортов (строки 69-82), резолвить спецификатор (`@backend/*` и относительные) и отбраковывать любой резолв в
  `modules/**/*.service.ts`; это закрывает P1–P4 сразу. Для текущего кода норма соблюдена — все три разрешённых импорта
  действительно чистые (`auth.oauth-state.ts:3-15`, `telegram.constants`, `cocktail.types` — только типы).
- **N3. В бэкенде остаются ещё две timing-safe склейки, commit-месседж говорит «единственное сравнение секретов».**
  `modules/telegram/telegram-webapp.ts:40-43` (`safeEqualHex` для HMAC-подписи initData) и
  `modules/auth/auth.oauth-state.ts:5-13` (сравнение state-хэшей) — другая семантика (хэши/подписи, а не заголовок-секрет),
  поэтому это не дубли `secretsMatch`; но `safeEqualHex` — тот же примитив «длина + `timingSafeEqual` по utf8» и
  кандидат на переиспользование `secretsMatch(right, left)`. Не блокер: батч заявлял scoped-задачу (две точки внешнего
  входа), и обе они закрыты.
- **N4. Пограничный случай UTF-8 — унаследован, не регрессия, но ловушки нет.** `secretsMatch` сравнивает
  `provided.length !== expected.length` в UTF-16 code units, а затем `timingSafeEqual` по utf8-байтам: если строка
  provided той же длины в code units, но другой в байтах, `timingSafeEqual` бросает `RangeError`
  («Input buffers must have the same byte length»). Проверено: `secretsMatch('secret-key-123', 'secret-key-12а')` и
  старый `isApiKeyValid` бросают **одинаково** (пробник `/tmp/eq/probe.ts`), т.е. поведение сохранено; триггер требует
  знать длину секрета в code units, даёт 500 вместо 401, а не обход. Если захочется закрыть — сравнивать
  `Buffer.byteLength(provided) !== Buffer.byteLength(expected)` и добавить кейс в спек; это hardening, вне DoD батча.

Мелочь без номера: в `gateway/__tests__/cocktails.spec.ts:5-6` остались два отдельных `import type` из одного
`cocktail.types` (можно слить в одну строку, как сделано в `gateway/cocktails.ts:8`) — форматтер это не запрещает.

## Что в коммите

| Файл                                                          | Δ      | Суть                                                                                                              |
| ------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `utils/secrets.ts` (новый)                                    | +14    | `secretsMatch(provided: unknown, expected: string\|null\|undefined)` — `timingSafeEqual` после проверок           |
| `utils/api-key.ts` (удалён)                                   | −13    | старый `isApiKeyValid` — та же логика, другой файл/имя                                                            |
| `utils/__tests__/secrets.spec.ts`                             | +30    | 5 тестов, 9 expect; кейсы родителя сохранены + новый «длиннее expected»                                           |
| `utils/__tests__/api-key.spec.ts` (удалён)                    | −29    | переехал в `secrets.spec.ts`                                                                                      |
| `modules/telegram/telegram-bot.service.ts`                    | −9     | удалён локальный `webhookSecretsMatch` (+ импорт `node:crypto`)                                                   |
| `modules/telegram/__tests__/telegram-bot.service.spec.ts`     | −8     | удалён дублирующий тест секрета (`:340-344` родителя)                                                             |
| `gateway/twir.ts`                                             | ±2     | `isApiKeyValid` → `secretsMatch`; порядок «лимит → секрет» не тронут (`:41`, `:43`)                               |
| `gateway/telegram.ts`                                         | ±2     | `webhookSecretsMatch` → `secretsMatch`; импорт сервиса бота снят; порядок/`!expected`-гвард не тронуты (`:39-44`) |
| `modules/cocktail/cocktail.types.ts`                          | +11    | `CocktailCatalogShelf`, `CocktailCatalog` (текст перенесён дословно)                                              |
| `modules/cocktail/cocktail.service.ts`                        | +7/−11 | интерфейсы сняты, импорт типов из `./cocktail.types`                                                              |
| `gateway/cocktails.ts`, `gateway/__tests__/cocktails.spec.ts` | ±1     | импорт типа каталога из `cocktail.types`                                                                          |
| `__tests__/architecture.spec.ts`                              | +24    | инвариант «гейтвей не импортирует доменные сервисы»                                                               |
| `backend/src/AGENTS.md`                                       | +2     | строка про границу (см. N2)                                                                                       |

`git show --check 1757fb7` — чисто; новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable`, `oxlint-disable`
в diff нет (grep по добавленным строкам — 0 совпадений). Новых зависимостей нет.

## Пункт 1. Эквивалентность секретов (главный пункт)

### Сравнение реализаций

Старый `isApiKeyValid` и старый `webhookSecretsMatch` — один и тот же алгоритм: ранний отказ на пустом
expected/нестроковом provided/разной длине, затем `timingSafeEqual(Buffer.from(…), Buffer.from(…))`. Новый
`secrets.ts` — дословно `isApiKeyValid` с новым именем и расширенной строкой JSDoc; аргументы в том же порядке
`(provided, expected)`, поэтому обе замены на местах вызова корректны, а не перепутаны (проверено построчным diff:
`twir.ts:43`, `telegram.ts:44`).

Формальная разница только в сортировке проверок старого вебхук-дубля: он начинал с `if (!header) return false`,
новый — с `!expected`, затем `typeof provided`, затем длина. Для всех реальных входов результат тот же, оракул
времени сохраняет прежнее свойство (ранний выход по несовпадению длины; сравнение байтов — только при равной длине).

### Матрица (пробник `/tmp/eq/run.ts`, старые файлы взяты `git show b77235c:…`)

| Ось         | Значения                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expected`  | `undefined`, `null`, `''`, `'short'`, `'super-secret-key'`, `'ключ'`                                                                                       |
| `provided`  | `undefined`, `null`, `''`, `'short'`, равный, тот же длины (последний символ другой), длиннее, массив, `123`, `{}`, `Buffer`, utf8-многобайтные, кириллица |
| Сравнений   | 120 (пары `isApiKeyValid`↔`secretsMatch` на всей матрице; `webhookSecretsMatch`↔`secretsMatch` для строковых provided)                                     |
| Расхождений | **0**                                                                                                                                                      |

Отдельно проверены пограничные, которые нельзя получить «обычным» тестом: `null`/`undefined` provided и expected,
`''` expected (ранний отказ), нестроковые provided, `Buffer` (отвергается обеими), utf8-кейс с равной длиной code
units и разной длиной байт — **обе реализации бросают одинаковый `RangeError`** (см. N4). Тайминг-безопасность
сохранена: `timingSafeEqual` по-прежнему после проверки длины, `===` нигде не появился.

### Call sites и внешние контракты

| Точка                  | parent                                                                                                   | HEAD                                                                          | Вывод                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `/twir` `X-API-Key`    | `isApiKeyValid(get('x-api-key'), apiKey)`; лимит до проверки (`twir.ts:41-43` родителя — тот же порядок) | `secretsMatch(get('x-api-key'), apiKey)`; лимит до проверки (`twir.ts:41,43`) | поведение и порядок те же  |
| Telegram webhook       | `if (!expected \|\| !webhookSecretsMatch(header, expected))` (`telegram.ts:44` родителя)                 | `if (!expected \|\| !secretsMatch(header, expected))` (`telegram.ts:44`)      | гвард `!expected` сохранён |
| 401 и тело ответа      | `UnauthorizedError` → общий конверт `gateway/errors.ts`                                                  | то же; `errors.ts` в diff отсутствует                                         | без изменений              |
| Лимит до/после секрета | `await limit(...)` до сравнения в обоих роутах                                                           | то же (строки не менялись)                                                    | без изменений              |

Тесты маршрутов на HEAD (изолированный прогон): `/twir` — 401 без ключа, 200 с верным, 400 на невалидную ссылку,
401 при незаданном ключе (`gateway/__tests__/misc-routes.spec.ts:130-194`); Telegram webhook — 401 без заголовка,
401 с неверным, 401 при `getWebhookSecret() === null`, 200 и один `handleUpdate` с верным
(`gateway/__tests__/telegram-webhook.spec.ts:17-71`). Покрытие при переносе теста не потеряно: удалённый кейс
бота (`undefined` / короткий / неверный той же длины / верный) полностью покрыт `secrets.spec.ts:6-29`, плюс новый
кейс «длиннее expected».

## Пункт 2. Мёртвые ссылки

- По коду `1757fb7`: `git grep -n "isApiKeyValid\|webhookSecretsMatch" -- backend/src` → **0**; `utils/api-key.ts`
  в дереве отсутствует, `api-key.spec.ts` тоже; `secrets.ts` импортируется из `gateway/twir.ts` и
  `gateway/telegram.ts` (файл не «сирота» — это же проверяет orphan-инвариант `architecture.spec.ts:48-84`, он зелёный).
- По всему дереву `1757fb7` остались только документационные упоминания: `README.md:420,455` и
  `docs/refactor/maps/backend.md:255-256` — см. N1.
- `CocktailCatalog*` из старого модуля: `git grep` по `@backend/modules/cocktail/cocktail.service` в `gateway/**` и
  во всём `backend/src` → 0 (сервис остался только владельцем своего класса/порта). Импортёры типа — гейтвей,
  его тест и сам сервис, все из `cocktail.types.ts`.

## Пункт 3. Типы каталога

Блоки `CocktailCatalogShelf` и `CocktailCatalog` из `b77235c:backend/src/modules/cocktail/cocktail.service.ts`
и из `1757fb7:backend/src/modules/cocktail/cocktail.types.ts` извлечены и сравнены `diff` — **идентичны**
(`CATALOG_TYPES_IDENTICAL`), включая `id: IngredientCategory` (`IngredientCategory` уже импортировался в
`cocktail.types.ts:1`, новых импортов не потребовалось). Публичный тип сервиса `getCatalog(): Promise<CocktailCatalog>`
не изменился; Eden-типы фронта выводятся из `App`, поэтому перенос внутреннего пути типа их не задевает (`bun typecheck`
и `frontend build` зелёные).

Тесты каталога: `bun test src/modules/cocktail` → **31 pass / 0 fail** (4 файла); плюс гейтвейные
`cocktails.spec.ts` в общем прогоне — зелёные.

## Пункт 4. Инвариант «гейтвей не импортирует сервисы» — мутационно

В `/tmp/review-b12` (дерево `git status` чистое до и после):

| Мутация в `gateway/`                                                                                          | Результат спека                                                                   |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| baseline (без правок)                                                                                         | 3 pass — все три архитектурных теста                                              |
| A. `import { CocktailService } from '@backend/modules/cocktail/cocktail.service'` в `twir.ts`                 | **fail**: `gateway/twir.ts -> @backend/modules/cocktail/cocktail.service`         |
| B. `import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'` в `telegram.ts` | **fail**: `gateway/telegram.ts -> @backend/modules/telegram/telegram-bot.service` |
| Разрешённые (уже в коде): `auth.oauth-state`, `telegram.constants`, `cocktail.types`                          | pass — allowlist не ловит разрешённое                                             |

Мутации откатаны (`git checkout --`), `git status` пуст; `bun --filter backend typecheck` после отката зелёный.

Обходы, которые спек **не** ловит (подробно в N2): относительный путь (`../modules/…/x.service` — проходит и
спек, и typecheck), side-effect `import '…x.service'`, динамический `import(…)`. Импорт с явным `.ts`-расширением
спек пропускает, но его валит typecheck: `TS5097: An import path can only end with a '.ts' extension when
'allowImportingTsExtensions' is enabled` — то есть второй рубеж есть. Кавычки-двойные не пройдут `bun format:check`.
Для нормы, заявленной в коммите и AGENTS («гейтвей не тянет сервис домена»), защита рабочая; для расширенной
формулировки «только чистые функции» — нет (N2).

## Пункт 5. Прогоны (в `/tmp/review-b12`, detached `1757fb7`, дерево чистое)

| Проверка                                                                       | Результат                                                                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`                                                | exit 0 — `450 packages installed [113.00ms]`                                                                                                   |
| `bun lint`                                                                     | exit 0 — `0 warnings and 0 errors`, 439 файлов, 96 правил                                                                                      |
| `bun format:check`                                                             | exit 0 — `All matched files use the correct format`, 620 файлов                                                                                |
| `bun typecheck` (кеш `vue-tsc` **удалён** перед прогоном)                      | exit 0 — contract 7 / database 41 / backend 275 файлов, `frontend:typecheck Done in 4.31s`; кеш-каталог пересоздан в 07:51:11 (холодный старт) |
| `cd backend && bun test`                                                       | exit 0 — **712 pass / 0 fail**, 86 файлов, 36296 expect (цифра коммита подтверждена)                                                           |
| `cd frontend && bun test src`                                                  | exit 0 — **128 pass / 0 fail**, 21 файл, 200 expect (как на baseline `b904…`/batch-08 — без дельты)                                            |
| `cd frontend && bun run build`                                                 | exit 0 — `build:types Done 2.52s`, `build:ci ✓ built in 959ms`                                                                                 |
| Точечно: `secrets.spec.ts`                                                     | 5 pass, 9 expect                                                                                                                               |
| Точечно: secrets + оба route-спека + cocktails + `modules/cocktail` + bot-spec | 79 pass / 0 fail, 9 файлов                                                                                                                     |

## Пункт 6. Документация

- `backend/src/AGENTS.md:57-59` — строка добавлена в раздел про порты гейтвея: «Из `modules/` гейтвею разрешены только
  чистые функции и константы — это проверяет `__tests__/architecture.spec.ts`». Для текущего кода верно (три
  разрешённых импорта действительно чистые/константные), формулировка шире фактической проверки — N2.
- `tasks.md`: B-11 и G-02 стоят в статусе `review` — соответствует моменту; `progress.md` (раунд 12) описывает батч
  корректно, включая оставшийся B-14 (`isValidWebhookSecret` — дублей нет: функция осталась одна и выполняет
  валидацию формата, а не сравнение, так что со `secretsMatch` не дублируется).
- `README.md` — N1 (две устаревшие ссылки на удалённый файл), `maps/backend.md` — N1 + G-04.

## Итог

Батч завершён как заявлено: одна каноническая timing-safe проверка на обе точки внешнего входа, старые реализации и
их тесты удалены без потери покрытия, тип каталога вынесен дословно, граница гейтвея получила машинную защиту,
которая реально падает от мутации. Обязательные прогоны кампании зелёные, `typecheck` — с холодным кешем.
Блокеров нет; N1 (README) и N2 (формулировка AGENTS / ужесточение теста) стоит закрыть в closing-docs-коммите
кампании, N3/N4 — на усмотрение владельца.
