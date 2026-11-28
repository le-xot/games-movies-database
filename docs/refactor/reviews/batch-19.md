# Ревью батча 19 (B-12, class-DTO листовых доменов) — `6486c0f` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                       |
| Предмет          | `6486c0f` (родитель — `d6bd0b0`), 14 файлов, +113/−145                                                                                                                                                                                                                                                                                                                     |
| Ревьюер          | `review-batch19` (не автор коммита; только diff, изолированный detached-worktree, прогоны, рантайм-дампы parent↔HEAD, type-level и мутационные проверки)                                                                                                                                                                                                                   |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                 |
| Что сделано мной | `/tmp/review-b19` (detached `6486c0f`, `bun install --frozen-lockfile` → 450 пакетов, `backend/.env` скопирован); второй detached-worktree `d6bd0b0` для дампов родителя; изолированный `postgres:17` на `127.0.0.1:55432`; временные скрипты/type-level файлы — только в /tmp-worktree, удалены. В основном дереве создан только этот отчёт, код не менялся, коммитов нет |
| Не запускалось   | e2e/Playwright (в кампании не поднимался, G-05), фронтовые unit-тесты (диф бэкендовый; Eden-типы фронта покрыты `frontend:typecheck`), `docker build`, `test:scripts` — вне предмета                                                                                                                                                                                       |
| Важно            | на момент ревью HEAD ветки = `38f9d6a` (батчи 20–22 уже впереди); предмет закреплён на `6486c0f`. Номера строк ниже — из `6486c0f`. Проверено: `6486c0f..38f9d6a` не меняет ни один файл предмета (`git diff --stat` пуст)                                                                                                                                                 |

## Вердикт

**APPROVE. Блокеров нет.** Class-DTO четырёх листовых доменов удалены, их формы перенесены в доменные типы;
гейтвей больше не дублирует поля руками, а собирает `WeatherResponse`/`ChangeLimitInput`/`Limit`/`TwirInput`
из статических типов TypeBox-моделей. Внешний контракт не сдвинулся: рантайм-дамп `$defs` и карты
`body`/`response` четырёх роутов совпал с родителем байт-в-байт, 8 HTTP-сценариев (200/400/401/503 и тела
ошибок валидации) идентичны, 35 type-level проверок `Equal` проходят (вложенные поля — конкретные типы, не
`unknown`), мутации домена и схемы ловятся `typecheck` в обе стороны. Прогоны зелёные: 715 unit, 62 integration.

### Сводка доказательств

- **Формы** — `WeatherSnapshot`/`ChangeLimitInput`/`LimitSnapshot`/`RecordsStats` и counts равны прежним
  class-DTO по каждому полю, тип и опциональность не изменились (строгое `Equal`, не assignability).
- **Wire** — 88 JSON-схем в `$defs` и 4 карты `body`/`response` (включая `$ref`-имена и `503`) совпадают с
  родителем; diff дампов пуст (по 5792 строки).
- **Типы** — `WeatherResponse` из `.static` компонентных моделей равен прежнему ручному интерфейсу;
  вложенные `temp`/`feels_like`/`sys.sunset`/`quantity`/`link` — `number`/`string`, не `unknown`;
  новых `any`/`as unknown as`/`@ts-ignore` нет.
- **Поведение** — логика сервисов не менялась (только сигнатуры/импорты), `isWeatherData` проверяет те же
  поля; ответы родителя и HEAD совпали во всех прогнанных сценариях.
- **Трапы** — 3 мутации (домен → порт, домен → схема, схема → домен) падают на `bun typecheck` (10/6/7 ошибок
  в 4/3/4 файлах); откаты `git checkout`, дерево чистое.

## Пункт 1. Эквивалентность форм (parent `d6bd0b0` ↔ HEAD `6486c0f`)

Сверка — type-level файл в ревью-worktree (`backend/src/__review__/`, в коммит не попал и удалён): копии
class-DTO родителя лежали рядом с новыми типами, проверка — строгое равенство типов
`(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)`, а не assignability (иначе лишние
поля/`unknown` прошли бы незамеченными). В контроле заведомо разные пары (`{a:number}` vs `{a:unknown}`,
`{a:number}` vs `{a?:number}`) дают `false` — детектор не вакуумный. Все 35 утверждений прошли.

| Домен   | Было (parent)                                                                                                           | Стало (HEAD)                                                                                                                   | Поля                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| weather | `WeatherDTO` + `WeatherMainDTO`/`Condition`/`Wind`/`Clouds`/`Sys` (class)                                               | `WeatherSnapshot` + 5 интерфейсов, `modules/weather/entities/weather.entity.ts`                                                | `main{temp,feels_like,humidity,pressure}`, `weather[{main,description}]`, `wind{speed}`, `visibility`, `clouds{all}`, `sys{sunrise,sunset}`, `name` — = |
| limit   | `ChangeLimitDTO`, `LimitEntity` (class)                                                                                 | `ChangeLimitInput`, `LimitSnapshot` (interface), `modules/limit/limit.entity.ts`                                               | `name: LimitType`, `quantity: number` — =                                                                                                               |
| stats   | `RecordsStatsDTO` + `GenreCountDTO`/`StatusCountDTO`/`GradeCountDTO`/`GenreStatusCountDTO`/`GenreGradeCountDTO` (class) | `RecordsStats` + `GenreCount`/`StatusCount`/`GradeCount`/`GenreStatusCount`/`GenreGradeCount`, `modules/stats/stats.entity.ts` | `total`, `byGenre[]`, `byStatus[]`, `byGrade[]`, `byFriendsGrade[]`, `byGenreStatus[]`, `byGenreGrade[]`, `byFriendsGenreGrade[]` — =                   |
| twir    | `SuggestionCreateByTwirDTO` (class)                                                                                     | инлайн `{ userId: string; link: string }`, `modules/twir/twir.service.ts:13`                                                   | =                                                                                                                                                       |

Поле-в-поле сверка подтверждена `Equal` для: `WeatherSnapshot ≡ WeatherDTO`, `WeatherMain ≡ WeatherMainDTO`,
`WeatherCondition ≡ WeatherConditionDTO`, `WeatherWind ≡ WeatherWindDTO`, `WeatherClouds ≡ WeatherCloudsDTO`,
`WeatherSys ≡ WeatherSysDTO`, `ChangeLimitInput ≡ ChangeLimitDTO`, `LimitSnapshot ≡ LimitEntity`,
`RecordsStats ≡ RecordsStatsDTO` и пять counts-пар, а также параметр
`TwirService.createSuggestionWithTwir` ≡ прежний `SuggestionCreateByTwirDTO`.
`LimitsService.change` по-прежнему принимает ту же форму (`ChangeLimitInput` ≡ старый `Limit` гейтвея ≡
`ChangeLimitDTO`), менялось только имя типа.

## Пункт 2. Wire-контракт: `$ref`-имена и JSON-схемы

Метод: в двух detached-worktree (parent `d6bd0b0` и HEAD `6486c0f`) поднят `createTestGateway()` из
`backend/src/__tests__/helpers/gateway-stub.ts`; из рантайма снят дамп `app.routes[*].hooks` (строковые
`body`/`response`) и полного реестра `app.definitions.typebox.$defs` (все 88 схем, функции заменены маркером).
`diff` дампов — пустой (по 5792 строки, `$defs` идентичны по именам и содержимому).

| Роут                    | body                        | 200                         | остальные коды                                  |
| ----------------------- | --------------------------- | --------------------------- | ----------------------------------------------- |
| `GET /weather`          | —                           | `WeatherDTO`                | 400, 404, 409, 429, 500, 503 `ApiErrorDto`      |
| `GET /stats/records`    | —                           | `RecordsStatsDTO`           | 400, 404, 409, 429, 500 `ApiErrorDto`           |
| `POST /limits`          | `ChangeLimitDTO`            | `LimitEntity`               | 400, 401, 403, 404, 409, 429, 500 `ApiErrorDto` |
| `POST /twir/suggestion` | `SuggestionCreateByTwirDTO` | `UserSuggestionResponseDTO` | 400, 401, 403, 404, 409, 429, 500 `ApiErrorDto` |

`$ref`-имена зафиксированы контрактом и не тронуты: `WeatherMainDTO`, `WeatherConditionDTO`, `WeatherWindDTO`,
`WeatherCloudsDTO`, `WeatherSysDTO`, `WeatherDTO` (внутри — `{"$ref":"…"}`), `ChangeLimitDTO`, `LimitEntity`,
`GenreCountDTO`…`RecordsStatsDTO`, `SuggestionCreateByTwirDTO`. Ограничения валидации тоже прежние:
`ChangeLimitDTO.quantity` — `{"minimum":1,"multipleOf":1,"type":"number"}`, `LimitEntity.quantity` — просто
`number`; `SuggestionCreateByTwirDTO.link` — прежний `pattern`. В коммите нет правок моделей — только
типы/комментарии (`git diff` по `t.Object`/`t.Ref`-блокам пуст), дамп это подтверждает независимо от чтения
диффа.

## Пункт 3. Type-level: `WeatherResponse`, `ChangeLimitInput`/`Limit`/`TwirInput`, деградация

- `WeatherResponse` (`gateway/weather.ts:42-50`) собран из `typeof weatherModels.<Model>.static`. Проверено
  утверждение комментария: `typeof weatherModels.WeatherDTO.static` = `{ main: unknown; weather: unknown[];
  wind: unknown; visibility: number; clouds: unknown; sys: unknown; name: string }` — `t.Ref` действительно даёт
  `unknown`, поэтому сборка по компонентам — вынужденная и корректная, а не лишний дубль.
- `Equal<WeatherResponse, прежний ручной интерфейс>` = true (структурно идентичны). Вложенность не
  деградировала: `equal(main.temp, number)`, `equal(main.feels_like, number)`, `equal(sys.sunset, number)`,
  `equal(weather, {main:string;description:string}[])`, `equal(wind.speed, number)`, `equal(clouds.all, number)`
  — все true. `WireLimit.quantity` = `number`, `TwirInput.link` = `string`.
- Скрепление домен ↔ гейтвей: `Equal<WeatherSnapshot, WeatherResponse>`, `Equal<LimitSnapshot, WireLimit>`,
  `Equal<ChangeLimitInput, WireChangeLimitInput>`, `Equal<RecordsStats, wire RecordsStatsDto>` — все true;
  `WeatherService extends WeatherReader` (порт) — true. Это же проверяет `bun typecheck` в проводке
  (`server/wiring/analytics.ts:35`, `server/wiring/integrations.ts:54-56`).
- Новых ослаблений нет: в добавленных строках `git diff` — 0 новых `any`, `as unknown as`, `@ts-ignore`,
  `oxlint-disable`; единственный `unknown` в диффе — прежний параметр `isWeatherData(value: unknown)` и
  комментарий про `unknown` у `Ref`.

## Пункт 4. Поведение

Диф сервисов — только сигнатуры/импорты, логика не тронута: `weather.service.ts` (тип кэша и возврата,
предикат guard), `limit.service.ts` (тип входа/выхода), `stats.service.ts` (тип возврата), `twir.service.ts`
(инлайн-тип параметра). `isWeatherData` проверяет те же группы полей (`name`, `visibility`, `main.*`,
`weather[0].*`, `wind.speed`, `clouds.all`, `sys.*`) — тело функции в диффе отсутствует.

Поведенческий дамп тем же способом (parent vs HEAD, один и тот же сценарий; сравнение статуса и JSON-тела):

| Сценарий                               | parent | HEAD | Тело                                                                                         |
| -------------------------------------- | ------ | ---- | -------------------------------------------------------------------------------------------- |
| `GET /weather`, данные есть            | 200    | 200  | погодный объект целиком                                                                      |
| `GET /weather`, данных нет             | 503    | 503  | `{statusCode:503, message:'Weather data is not available yet', error:'Service Unavailable'}` |
| `GET /stats/records`                   | 200    | 200  | пустые массивы + `total: 0`                                                                  |
| `POST /limits` без auth, валидное тело | 401    | 401  | `Unauthorized`                                                                               |
| `POST /limits`, `quantity: 0`          | 400    | 400  | прежний validation-envelope TypeBox                                                          |
| `POST /twir/suggestion`, неверный ключ | 401    | 401  | `Unauthorized`                                                                               |
| `POST /twir/suggestion`, `link` не URL | 400    | 400  | прежний validation-envelope TypeBox                                                          |
| `POST /twir/suggestion`, ок            | 200    | 200  | `{title:'', genre:'GAME'}`                                                                   |

`diff` — пустой. Дополнительно точечные спеки: `weather.spec.ts`, `misc-routes.spec.ts` (limits/twir),
`limit.service.spec.ts`, `stats.service.spec.ts` — 17 pass / 0 fail.

## Пункт 5. Мёртвый код и документация

- Все импортёры удалённых файлов на родителе найдены и обновлены: `modules/weather/weather.service.ts`,
  `modules/limit/limit.service.ts`, `modules/stats/stats.service.ts`, `modules/twir/twir.service.ts` +
  комментарий в `gateway/weather.ts`. На HEAD ссылок на `weather.dto`/`limit.dto`/`stats.dto`/`twir.dto` в коде
  нет (`grep` по `backend/`, `frontend/`, `contract/` — 0); остались только исторические упоминания в
  `docs/refactor/maps/` (см. N5) и в старых отчётах ревью.
- Новые файлы импортируются (`import type`), поэтому orphan-guard (`backend/src/__tests__/architecture.spec.ts`)
  зелёный: 4/4 pass, включая «не содержит файлов без импортёров» и «гейтвей не импортирует доменные сервисы».
- `backend/src/modules/AGENTS.md:12` («`{name}.dto.ts` / `{name}.entity.ts` — типы; схемы валидации лежат в
  гейтвее») этому коммиту не противоречит: на `6486c0f` .dto-файлы ещё есть (record/wordle/steam/img), а
  гейтвей действительно остаётся местом схем. После закрытия B-12 целиком шаблон придётся обновить — это G-04,
  не этот коммит.

## Пункт 6. Прогоны (HEAD `6486c0f`)

| Команда                       | Результат                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun lint`                    | 0 warnings, 0 errors (444 файла, 96 правил)                                                                                                          |
| `bun format:check`            | «All matched files use the correct format» (652 файла)                                                                                               |
| `bun typecheck`               | contract 7, database 41, backend 275 файлов — 0 ошибок; frontend (`vue-tsc`) — 0 ошибок                                                              |
| `cd backend && bun test`      | **715 pass / 0 fail**, 36 302 expect, 87 файлов, 2.06 s — совпадает с заявленным в коммите                                                           |
| интеграция (`RUN_DB_TESTS=1`) | изолированный `postgres:17` на `127.0.0.1:55432`; `setup-db.ts` создал `lists_test` и применил миграции; **62 pass / 0 fail**, 208 expect, 13 файлов |
| `git show --check 6486c0f`    | чисто (пробелы/EOF)                                                                                                                                  |

После мутационных проб и удаления временных файлов прогоны повторены: lint/format:check/typecheck зелёные,
`git status` в ревью-worktree чистый. Integration запускалась на отдельном контейнере (порт 5432 был занят
другим ревьюером) и удалена после прогона.

## Пункт 7. Мутации: держится ли связь типов

Каждая мутация — одна правка, `bun typecheck`, затем откат `git checkout` (дерево чистое):

| Мутация                                               | Ошибки typecheck | Где поймано                                                                                         | Направление                    |
| ----------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| домен `limit.entity.ts`: `quantity` → `qty`           | 10 в 4 файлах    | `modules/limit/limit.service.ts:10`, `limit.service.spec.ts:23`, `server/wiring/integrations.ts:55` | домен → порт/схема             |
| домен `weather.entity.ts`: `feels_like` → `feelsLike` | 6 в 3 файлах     | `server/wiring/analytics.ts:35`, `server/__tests__/wiring-analytics.spec.ts:51`                     | домен → `WeatherResponse`/порт |
| схема `limitModels.LimitEntity`: `quantity` → `qty`   | 7 в 4 файлах     | `gateway/limits.ts:49`, `server/wiring/integrations.ts:55`, `__tests__/helpers/gateway-stub.ts:86`  | схема → домен/port             |

То есть типовая связь держится в обе стороны и не «схлопывается»: переименование поля в новой entity ломает
совместимость с TypeBox-моделью через проводку, а правка схемы — совместимость с доменом. Это и есть ловушка
батча (B-12: «type-level совпадение с TypeBox»), отдельный тест не требуется — компилятор проверяет её на
`bun typecheck` в CI.

## Не блокеры

- **N1. Неконсистентное размещение entity.** `weather` уехал в `modules/weather/entities/weather.entity.ts`,
  а `limit`/`stats` — в корень модуля (`modules/limit/limit.entity.ts`, `modules/stats/stats.entity.ts`).
  Прецедент для чистых доменных форм — `modules/queue/queue.entity.ts` (корень), а каталоги `entities/` в
  остальных модулях держат DB-row типы (`SelectRow<…>`: `entities/limit.entity.ts`, `record-domain`, …).
  Стоит выбрать одно место (по прецеденту `queue` — корень) и применять одинаково во всех доменах B-12;
  на поведение/типы не влияет.
- **N2. Приведение `as Limit` вместо `as ChangeLimitInput`.** `gateway/limits.ts:49`:
  `limits.change(ctx.body as Limit)`, хотя порт принимает `ChangeLimitInput`. Сейчас типы структурно равны,
  поэтому компилируется и поведение не меняется (старая строка, коммит её не трогал), но каст называет
  выходной тип там, где на входе — входной; дешевле `as ChangeLimitInput` (или убрать, если `ctx.body`
  выводится). Косметика.
- **N3. Сообщение коммита неполно перечисляет остаток B-12.** «остались `record.dto.ts` и `wordle/*.dto.ts`» —
  но `modules/steam/steam.dto.ts` тоже декоративный class-DTO: все 6 классов нигде не инстанцируются
  (`grep "new Steam…"` — 0), в сервисе только `import type`. `img.dto.ts` — enum, оно законно остаётся.
  Фактически остаток на этом коммите: record + steam + wordle (+ enum img); это подтверждает и последующий
  батч `a457e45` «record и steam» (вне предмета ревью). На код не влияет — правится сообщением/статусом B-12.
- **N4. `WeatherResponse` остаётся ручным списком полей, и направление «схема → тип ответа» не проверяется
  компилятором.** Так нельзя иначе: `.static` у `t.Ref` — `unknown` (проверено), а `t.Unsafe` запрещён
  правилами. Связь `WeatherResponse` → `WeatherSnapshot` зафиксирована проводкой (мутация M2 ловится), но если
  в `WeatherDTO`/компонентные модели добавят обязательное поле, `typecheck` промолчит — поймает только
  рантайм-валидация ответа и `weather.spec.ts` (который гоняет полный объект). Пре-существующее ограничение;
  на будущее — smoke-тест формы ответа OpenWeatherMap или type-level тест на `$defs`, если захочется.
- **N5. Карты кампании не обновлены в коммите (ожидаемо).** `docs/refactor/maps/backend.md:121,126,127` и
  `docs/refactor/maps/contract-data-config.md:101` всё ещё ссылаются на удалённые `*.dto.ts`. По README
  карты — снимок и обновляются при закрытии батча (G-04), как в предыдущих ревью; отмечаю, чтобы не
  потерялось при закрытии B-12.

## Что в коммите

| Файл                                                             | Δ     | Суть                                                                                                                                |
| ---------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/gateway/limits.ts`                                  | +4/−6 | `ChangeLimitInput`/`Limit` — из `limitModels.<Model>.static`; порт типизирован ими; импорт `LimitType` из контракта больше не нужен |
| `backend/src/gateway/twir.ts`                                    | +1/−4 | `TwirInput` — из `twirModels.SuggestionCreateByTwirDTO.static`                                                                      |
| `backend/src/gateway/weather.ts`                                 | +9/−9 | `WeatherResponse` собран из `.static` компонентных моделей; комментарий про `$ref` обновлён                                         |
| `backend/src/modules/weather/weather.dto.ts` (удалён)            | −45   | 6 декоративных классов, никто не инстанцировал                                                                                      |
| `backend/src/modules/weather/entities/weather.entity.ts` (новый) | +38   | `WeatherSnapshot` + 5 интерфейсов компонент                                                                                         |
| `backend/src/modules/weather/weather.service.ts`                 | +4/−4 | тип кэша/возврата и предикат — `WeatherSnapshot`                                                                                    |
| `backend/src/modules/limit/limit.dto.ts` (удалён)                | −13   | 2 класса                                                                                                                            |
| `backend/src/modules/limit/limit.entity.ts` (новый)              | +13   | `ChangeLimitInput`, `LimitSnapshot`                                                                                                 |
| `backend/src/modules/limit/limit.service.ts`                     | +2/−2 | типы входа/возврата — доменные                                                                                                      |
| `backend/src/modules/stats/stats.dto.ts` (удалён)                | −53   | `RecordsStatsDTO` + 5 counts-классов                                                                                                |
| `backend/src/modules/stats/stats.entity.ts` (новый)              | +39   | `RecordsStats` + 5 counts-интерфейсов                                                                                               |
| `backend/src/modules/stats/stats.service.ts`                     | +2/−2 | тип возврата — `RecordsStats`                                                                                                       |
| `backend/src/modules/twir/twir.dto.ts` (удалён)                  | −5    | 1 класс                                                                                                                             |
| `backend/src/modules/twir/twir.service.ts`                       | +1/−2 | инлайн `{userId, link}` вместо класса                                                                                               |

`git show --check 6486c0f` — чисто; новых зависимостей нет; внешние контракты (API/WS/БД/env/фронт) не
тронуты — дифф чисто бэкендовый, `frontend:typecheck` подтверждает, что Eden-типы фронта не деградировали.

## Ограничения ревью

- Живой сервер не поднимался: wire/поведение снимались через `app.handle()` на собранном `createTestGateway()`,
  что для schema/статусов/тел эквивалентно HTTP, но не покрывает транспорт/proxy/статика.
- e2e и визуального baseline нет (G-05) — для этого батча не требуется: внешние формы доказаны дампом и
  тестами, UI не тронут.
- Integration прогнана на временном `postgres:17` (порт 55432): общая dev-БД на 5432 была занята параллельным
  ревьюером, брать её в совместное пользование ради `DROP/CREATE lists_test` не стал. Контейнер удалён.
- Второй worktree родителя (`d6bd0b0`) и оба ревью-worktree удалены (`git worktree remove --force`), в основном
  дереве — только этот файл.
