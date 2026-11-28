# Ревью батча B-06 — `108ebfa` → **CHANGES REQUIRED**

|                  |                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                              |
| Коммит           | `108ebfa` (родитель — `a6837fa`)                                                                                                                                                                                                                                                                                                  |
| Ревьюер          | `review-batch6` (не автор коммита; только diff, изолированный worktree и прогоны)                                                                                                                                                                                                                                                 |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                        |
| Что сделано мной | исходники не менялись, коммитов нет; в основном дереве создан только этот отчёт. Все прогоны — в detached-worktree `/tmp/review-b6` на `108ebfa` (`bun install --frozen-lockfile`), `backend/.env` скопирован из основного чекаута. Worktree удалён в конце.                                                                      |
| Не запускалось   | backend integration (`RUN_DB_TESTS=1` + Postgres), Playwright e2e, docker build — нужны стенды, вне списка ревью                                                                                                                                                                                                                  |
| Важно            | пока шло ревью, ветка ушла вперёд (`409ff26`, `9042286`, `41ae5e6` — батчи 7/8 и ловушка конверта ошибок). Ревью — строго на `108ebfa`; все номера строк относятся к нему. Блокер по документации на момент ревью НЕ исправлен и в типе ветки: `docs/architecture.md:170` в `41ae5e6` всё ещё ссылается на `started`/`stoppable`. |

## Вердикт

**CHANGES REQUIRED — блокирует только документация, код чистый.**

Кодовая часть подтверждена полностью: все 8 классов с хуками зарегистрированы в `Lifecycle`
ровно по одному разу, ни один сервис не создан мимо реестра, изменения порядка хуков измерены
эмпирически и безопасны, `pool.end()` остался единственным и вызывается один раз, таймер погоды
действительно снимается, дубли экземпляров убраны без изменения поведения, `lint` / `format:check` /
`typecheck` / backend 681 / frontend 126 / frontend build — зелёные. Функциональных регрессий не
найдено.

Блокирует один пункт — **незавершённая миграция документации**: `docs/architecture.md:170` (чек-лист
«Как добавить домен») до сих пор предписывает «создать сервис, добавить в `started`/`stoppable` при
наличии хуков». Списков больше не существует, а тот же файл на строках 44–48 уже переписан на
`Lifecycle`. Правка — одна строка; после неё вердикт APPROVE.

## Что в коммите

7 файлов, +257/−112 (`git show --shortstat 108ebfa`):

- `backend/src/server/lifecycle.ts` (новый, 56 строк) — реестр `add/init/close`, хуки через
  `fn.call(service)`, ошибка логируется и не прерывает цикл (`lifecycle.ts:47-55`);
- `backend/src/server/container.ts` — ручные списки `started`/`stoppable` удалены, 29 созданий
  обёрнуты в `lifecycle.add(...)`, `close()` больше не вызывает `drizzle.pool.end()` вручную
  (`container.ts:193`, `:215`);
- `backend/src/modules/weather/weather.service.ts` — `this.timer` + `onModuleDestroy`
  (`weather.service.ts:40,48,62-67`);
- `backend/src/server/__tests__/lifecycle.spec.ts` (новый, 5 кейсов);
- документация: `backend/src/AGENTS.md`, `backend/src/server/AGENTS.md`, `docs/architecture.md`.

`contract/`, `database/`, `frontend/`, `gateway/`, lockfile, CI и Docker не тронуты — внешние
контракты (роуты, коды/конверт ошибок, WS, cookie `token`, схема БД, env, команды bun) механически
не затронуты. `git show --check 108ebfa` чисто, новых `any` / `as unknown as` / `@ts-` /
disable-комментариев нет.

## Прогоны (изолированный worktree на `108ebfa`)

| Проверка                       | Результат                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors`, 437 файлов, 95 правил, 94 ms        |
| `bun format:check`             | exit 0 — `All matched files use the correct format`, 614 файлов               |
| `bun typecheck`                | exit 0 — contract ok, database 41 файл, backend 271 файл, frontend 4.68 s     |
| `cd backend && bun test`       | exit 0 — **681 pass / 0 fail**, 82 файла, 36 227 `expect`, 2.06 s             |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect`                         |
| `cd frontend && bun run build` | exit 0 — `build:types` (vue-tsc) 2.68 s, `build:ci` (vite) `✓ built in 1.02s` |
| `git show --check 108ebfa`     | чисто (whitespace-ошибок нет)                                                 |

Число backend-тестов совпадает с заявленным в сообщении коммита (681).

## Пункт 1. Полнота реестра — подтверждено

Все классы под `modules/` и `database/`, реализующие `onModuleInit` / `onApplicationBootstrap` /
`onModuleDestroy` (grep по всему `backend/src`, кроме тестов и самого `lifecycle.ts`), — восемь:

| Класс                       | Хуки            | Регистрация            |
| --------------------------- | --------------- | ---------------------- |
| `DrizzleService`            | init, destroy   | `container.ts:81`      |
| `WeatherService`            | init, destroy   | `container.ts:97`      |
| `TwitchService`             | init            | `container.ts:102`     |
| `WordleService`             | init, destroy   | `container.ts:122-129` |
| `KickService`               | init            | `container.ts:132`     |
| `TelegramBotService`        | init, bootstrap | `container.ts:134-144` |
| `WordleMiniAppService`      | bootstrap       | `container.ts:152-154` |
| `WordleNotificationService` | init, destroy   | `container.ts:155-167` |

Проверено машинно (разбор `container.ts` по позициям `new`, а не grep по именам, чтобы не спутать
вложенные конструкции):

- `lifecycle.add(...)` — **29** вызовов, и ровно **29** `new X(...)` являются прямым аргументом
  `lifecycle.add`, то есть зарегистрированы все 29;
- ещё 16 `new` созданы вне реестра намеренно: `Lifecycle`, `DomainEvents`, `RedisClient`,
  `WordleDictionary`, `WordleLeaderboardCache` и 11 Drizzle-репозиториев. Grep по их файлам
  подтверждает: **ни у одного нет хуков**;
- полнотекстовый grep по всему репозиторию (`backend/`, `contract/`, `frontend/`, `database/`) не
  находит ни одного хука вне `backend/src`, а `new [A-Z]...Service(` вне `container.ts` в
  прод-коде отсутствует (единственные совпадения — integration-спеки, создающие репозиторий поверх
  своего `db`).

Спорный список из задания закрыт: `CocktailBotService` (`container.ts:146-149`, раньше
`void new ...`), `WordleMiniAppService` (:152), `WordleNotificationService` (:155),
`TelegramBotService` (:134), `TwitchService` (:102), `KickService` (:132), `WordleService` (:122),
`WordlePracticeService` (:130 — хуков не имеет, но зарегистрирован), `WeatherService` (:97),
`DrizzleService` (:81). Дублей регистрации нет.

Таймеров без destroy-хука не осталось: `setInterval`/`setTimeout` в модулях есть только у
`WordleService` (`wordle.service.ts:53` → снимается `:58-60`), `WordleNotificationService`
(`:232` → `:210-215`) и `WeatherService` (`:48` → `:62-67`); остальные совпадения — `setTimeout`
в ретраях Telegram и в таймауте rate-limit, они не переживают shutdown.

## Пункт 2. Эквивалентность поведения: порядок хуков

Порядок в HEAD — порядок регистрации. Замерен не только по коду, но и эмпирически: временный спек
подменял прототипные хуки реальных классов и вызывал `createContainer().init()/close()`; результат:

```
HEAD:   drizzle:I, weather:I, twitch:I, wordle:I, kick:I,
        telegramBot:I, telegramBot:B, miniApp:B, notifications:I
parent: twitch:I, kick:I, telegramBot:I, telegramBot:B, weather:I,
        wordle:I, notifications:I, miniApp:B
```

Изменения порядка (I — `onModuleInit`, B — `onApplicationBootstrap`):

| Сервис                      | parent | HEAD | Сдвиг                                   |
| --------------------------- | ------ | ---- | --------------------------------------- |
| `DrizzleService`            | —      | 1    | новый: ping БД первым                   |
| `WeatherService`            | 5      | 2    | раньше twitch/wordle/kick/telegramBot   |
| `TwitchService`             | 1      | 3    | после weather                           |
| `WordleService`             | 6      | 4    | перед kick/telegramBot                  |
| `KickService`               | 2      | 5    | после weather/wordle                    |
| `TelegramBotService`        | 3–4    | 6–7  | позже weather/wordle; до miniApp/notify |
| `WordleMiniAppService`      | 8      | 8    | после telegramBot (как и было)          |
| `WordleNotificationService` | 7      | 9    | теперь после `miniApp:B`                |

Почему безопасно:

- **Команды регистрируются в конструкторах, а не в хуках.** `CocktailBotService`
  (`cocktail-bot.service.ts:51` — `bar`), `WordleMiniAppService` (`wordle-miniapp.service.ts:43` —
  `wordle`), `WordleNotificationService` (`:77`, `:80` — `wordle_notification`,
  `wordle_notification_off`). Все конструкторы выполняются внутри `createContainer()` до
  `container.init()`, поэтому `TelegramBotService.onApplicationBootstrap` (`setMyCommands`,
  `telegram-bot.service.ts:198-215`) всегда видит полный список команд независимо от порядка хуков.
- **Порядок создания, от которого зависит меню, не изменился**: telegramBot → cocktailBot →
  miniApp → notifications, как и в родителе.
- telegramBot init/bootstrap по-прежнему раньше `miniApp:B` и `notifications:I`, то есть кнопка меню
  и стартовый прогон уведомлений идут после инициализации бота.
- `weather` — изолированный HTTP-запрос, ошибки ловит внутри себя; `wordle` при init только
  трогает БД; ни один хук не читает состояние, созданное хуком другого сервиса (проверены все 7).

Побочное отличие, которого не было в родителе: ошибка изолируется **на каждый хук**, а не на сервис
(`lifecycle.ts:47-55`). Раньше падение `onModuleInit` отменяло `onApplicationBootstrap` того же
сервиса, теперь bootstrap всё равно выполнится. Сегодня ненаблюдаемо: единственный сервис с обоими
хуками — `TelegramBotService`, а его `onModuleInit` не бросает (внутри `ensureWebhook()` ловит сам,
`telegram-bot.service.ts:304-320`). См. не блокер N4.

## Пункт 3. Drizzle — подтверждено

- `pool.end()` в прод-коде вызывается ровно из одного места — `drizzle.service.ts:26`
  (`onModuleDestroy`). В `container.close()` ручного вызова нет; `drizzle.pool` в прод-коде больше
  нигде не используется (grep).
- **Ping при старте** (`drizzle.service.ts:18-22`) теперь действительно вызывается из
  `container.init()` → `lifecycle.init()`. Ошибка проглатывается: временный спек с заведомо мёртвым
  DSN (`postgres://…@127.0.0.1:1/none`) получил `Lifecycle.init()` без throw, ровно одну запись в
  лог с `onModuleInit`, после чего `close()` успешно закрыл пул.
- **`container.close()` без `init()` не падает**: `container.spec.ts` (createContainer → close в
  `finally`) зелёный, плюс отдельная временная проверка. Вызов `pg.Pool.end()` на никогда не
  использованном пуле резолвится.
- Двойного `end` при нормальном одиночном `close()` нет. Двойной `close()` тоже не бросает:
  второй `pool.end()` реджектится (`pg-pool` — «Called end on pool more than once»), но
  `Lifecycle.run` ловит и логирует. Это строго лучше родителя, где `await drizzle.pool.end()` в
  `close()` никто не ловил (unhandled rejection при повторном сигнале).

## Пункт 4. Weather: `clearInterval` действительно вызывается — подтверждено

Временный спек (затем удалён) с подменой `globalThis.setInterval/clearInterval` и `fetch`, падающим
на сеть:

- `onModuleInit()` ставит ровно один интервал, задержка ровно `5 * 60 * 1000` (`CACHE_DURATION`);
- `onModuleDestroy()` вызывает `clearInterval` ровно один раз и именно с сохранённым handle;
- повторный `onModuleDestroy()` не зовёт `clearInterval` второй раз (handle обнулён);
- `onModuleDestroy()` до `onModuleInit()` — no-op, не падает.

Утечка таймера, описанная в карте (`maps/backend.md:207`), устранена.

## Пункт 5. Дубли экземпляров — подтверждено

- `new DrizzleRecordRepository` и `new ImgService` в `container.ts` ровно по одному
  (`:106`, `:107`); `DrizzleRecordRepository` уходит и в `RecordService` (`:108-110`), и в
  `SteamService` (`:115`); `ImgService` — и в `RecordService`, и в media-порт
  (`integrationPorts({ images: imgService })`, `wiring/integrations.ts:22,61-63`).
- Классы без изменяемого состояния: `ImgService` держит только `logger` и `s3Service`,
  `DrizzleRecordRepository` — только `drizzle`; никаких кэшей/счётчиков, поэтому общий экземпляр
  поведенчески эквивалентен двум. `wiring/integrations.ts` коммитом не тронут — поведение
  media-порта не менялось (`RecordService` использует дефолтный вариант кадра, `record.service.ts:135`).

## Пункт 6. Тесты

`lifecycle.spec.ts` покрывает: порядок init+bootstrap в рамках одного сервиса и между сервисами,
`this`-биндинг (`fn.call(service)`), изоляцию ошибки init (следующий сервис выполняется, лог одна
строка с именем хука), вызов destroy только у объявивших, изоляцию ошибки destroy. Пробелы — в
не блокерах N3/N4.

## Пункт 7. Документация

Соответствует коду:

- `backend/src/server/AGENTS.md` — таблица «КАК ДОБАВИТЬ ЧТО-ТО» и раздел «ХУКИ ЖИЗНЕННОГО ЦИКЛА»
  переписаны на `lifecycle.add(new X(...))`, порядок регистрации и «ошибка не валит старт» описаны
  верно;
- `backend/src/AGENTS.md:36` — «Composition root: `lifecycle.add(new X(...))` — хуки подхватятся»;
- `docs/architecture.md:44-48` — описание `Lifecycle` и отсутствия `started`/`stoppable` верное.

**Блокер.** `docs/architecture.md:170-171`, чек-лист «Как добавить домен», п. 4: «создать сервис,
**добавить в `started`/`stoppable` при наличии хуков**». Списков в коде нет — инструкция
невыполнима и противоречит §44-48 того же файла. Это остаток старого пути в единственном файле,
который коммит уже правил. Правка: заменить на `lifecycle.add(new X(...))` (хуки подхватятся сами).

## Не блокеры

| #   | Замечание                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | **Ping без таймаута.** `main.ts:30` ждёт `container.init()` до `listen()`, а у `pg.Pool` нет `connectionTimeoutMillis` (в backend такого конфига нет вовсе; дефолт 0 = без предела). При недоступной БД старт может висеть вместо мгновенного подъёма. Это противоречит явному принципу из `telegram-bot.service.ts:344-350`: «`container.init()` не должен ждать вечно — сайт обязан подняться». Рекомендация: таймаут/`Promise.race` на ping, как у Telegram `INIT_TIMEOUT_MS`. Не блокер: поведение осознанно добавлено коммитом, ошибка ловится. |
| N2  | **Порядок destroy = порядок init.** `DrizzleService` зарегистрирован первым, поэтому `pool.end()` выполняется ДО `clearInterval`/`clearTimeout` остальных сервисов (замерено). Сегодня безопасно — ни один destroy-хук не трогает БД, — но родитель закрывал пул последним, а Nest вызывает destroy в обратном порядке зависимостей. Рекомендация: идти по реестру в обратном порядке или хотя бы зафиксировать это комментарием/тестом.                                                                                                             |
| N3  | **Нет постоянной ловушки на «таймер снимается» и на «хук подключён».** `lifecycle.spec` проверяет механику реестра, но ни один тест не утверждает, что `WeatherService` снимает интервал и что `container` вообще проводит хуки (`container.spec.ts` не вызывает `init()`). Правило 5 кампании («каждая устранённая регрессия получает ловушку») формально закрыто тестом на новый канон, но фикс утечки погоды держится только на коде. Рекомендация: закоммитить компактный weather-спек (мой временный вариант — 20 строк).                       |
| N4  | **Изоляция ошибки стала по-хуковой, а не по-сервисной** (см. п. 2). Инвариант «bootstrap при упавшем init» теперь другой, но нигде не описан и не покрыт тестом. Либо строка в `server/AGENTS.md`, либо кейс в `lifecycle.spec`.                                                                                                                                                                                                                                                                                                                     |
| N5  | **Не по вине коммита, но в затронутом файле.** `WeatherService.fetchWeatherData` ловит собственные ошибки, поэтому `onModuleInit` печатает «Initial weather data fetched successfully» даже при упавшем fetch, а внешний `catch` с `throw` (`weather.service.ts:53-59`) — мёртвый код. Стоит завести тикет; на этот батч не влияет.                                                                                                                                                                                                                  |
| N6  | `Lifecycle` по умолчанию логирует через `console.warn`, а сервисы — через `Logger`. В родителе было так же, регрессии нет; нит.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| N7  | `docs/refactor/maps/backend.md:87,204-209` и `tasks.md` (B-09) по-прежнему описывают `started`/`stoppable` как текущее состояние, статус задачи не отмечен. Это соответствует практике батчей 2–5 (оба файла не менялись с `a4ea142`), поэтому — процессный нит, не блокер.                                                                                                                                                                                                                                                                          |

## Итог

Код батча соответствует правилам кампании: старый путь удалён из кода, состав реестра полный,
поведение эквивалентно (с перечисленными выше сдвигами порядка), дубли устранены, все прогоны
зелёные, тест на новый канон есть. Для APPROVE нужно поправить одну строку в
`docs/architecture.md:170`; N1–N4 — рекомендации, N5 — отдельный тикет.
