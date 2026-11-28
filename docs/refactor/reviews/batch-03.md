# Ревью батча B-06 (batch 3) — `91d68c2` → **APPROVE**

|                  |                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                              |
| Коммит           | `91d68c2` (родитель — `bfff904`), 17 файлов, +222/−86                                             |
| Ревьюер          | `review-batch3` (не автор; только коммит, родитель, изолированные прогоны)                        |
| Дата             | 2026-11-28                                                                                        |
| Что сделано мной | работал в `/tmp/review-b3` (detached `91d68c2`), сравнение с `/tmp/review-b3-parent` (`bfff904`); |
|                  | в основном дереве создан только этот отчёт, код не менялся, коммитов нет                          |
| Не запускалось   | integration (Postgres), Playwright e2e — нужны стенды, вне списка ревью                           |

Строки файлов указаны по состоянию коммита `91d68c2`: ветка уже ушла вперёд (`a6837fa`),
позднейшие коммиты (`76d3fec`, `604f866`, `b07e249`, `a6837fa`) не ревьюились.

## Вердикт

**APPROVE.** Блокеров нет: значения всех 13 именованных схем и 4 inline-схем побайтово равны
значениям на родителе (включая порядок), `$ref`-имена не изменились, литеральные типы Eden
сохранились, ролевые константы эквивалентны строкам, удаление мёртвых регистраций `recordEnumModels`
ничего не сломало, инвариантный тест ловит дрейф литералов в TypeBox и в `pgEnum`, все прогоны
зелёные.

Замечания (все **не блокеры**): инвариантный тест не ловит правку самого контракта (источники
деривативны; риск закрыт CI-шагом сверки миграций), inline-сайты не покрыты инвариантом,
локальный дубль `ImageVariant` остался во фронте, карты/задачи/журнал ещё не обновлены.

## Что в коммите

- `backend/src/gateway/models.ts` — хелпер `enumUnion()` (`:18-28`) и 6 схем из контракта
  (`:35-43`); `auth.ts` — `UserRole` (`:10`); `cocktails.ts` — 3 схемы (`:15-17`); `wordle.ts` —
  3 схемы (`:16-18`); inline: `auth-session.ts` platform (`:119`), `media.ts` variant (`:58`),
  `records.ts` orderBy/direction (`:215-216`). Итого 13 именованных + 4 inline.
- 8 файлов гейтвея: ролевые константы → `UserRole.*` (9 констант).
- `users.ts`/`twir.ts` — убраны мёртвые `...recordEnumModels`; в `twir.ts` слит двойной импорт
  `models`.
- `gateway/__tests__/enum-sources.spec.ts` (130 строк, 25 тестов).
- `backend/src/AGENTS.md`, `docs/architecture.md` — по абзацу про enum'ы.

Полный diff просмотрен, посторонних правок нет, `git show --check 91d68c2` чист.

## Прогоны (в `/tmp/review-b3`, `bun install --frozen-lockfile` — exit 0)

| Проверка                       | Результат                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors`, 436 файлов, 95 правил.                                                         |
| `bun format:check`             | exit 0 — `All matched files use the correct format`, 611 файлов; дерево чистое, т.е. проверен сам коммит.                |
| `bun typecheck`                | exit 0 — contract 7 файлов, database 41, backend **268** (было 267 на батче 2 → +1 новый spec), frontend vue-tsc 5.09 s. |
| `cd backend && bun test`       | exit 0 — **671 pass / 0 fail**, 80 файлов, 36 213 `expect` (baseline 646/79 → ровно +25 тестов и +1 файл нового spec).   |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect` (baseline не изменился).                                           |
| `cd frontend && bun run build` | exit 0 — `build:types` (vue-tsc) Done 2.73 s, `build:ci` (vite 8.3.5) `✓ built in 1.55 s`, Done 2.53 s.                  |
| `git show --check 91d68c2`     | чисто (whitespace-ошибок нет).                                                                                           |
| Новый `enum-sources.spec.ts`   | изолированно: 25 pass / 0 fail, 26 `expect`, без БД и env — только импорты схем и `@gmd/database/schema`.                |

Backend-тесты запускались с `cp backend/.env.example backend/.env`, как в CI (`checks.yaml`).
Integration/Postgres и Playwright не поднимались.

## Пункт 1. Типы Eden: литералы сохранены, `$ref`-имена не изменились

**Проверено, не деградировало.**

- Временный type-probe (`backend/src/__review_batch3_probe.ts`, не коммитился): для всех 13 моделей
  (`typeof Model.static`) положительные присваивания компилируются, а несуществующие значения
  (`'PODCAST'`, `'SOMEDAY'`, `'MEH'`, `'REVIEW'`, `'DISCORD'`, `'OTHER'`, `'MODERATOR'`, `'DRAW'`,
  `'GOOD'`, `'SKIPPED'`, `'HERB'`, `'PREMIUM'`, `'MUDDLE'`) закрыты
  `@ts-expect-error`. `bun check -b` прошёл, все директивы «использованы» — значит static каждого
  union'а именно литеральный, а не `string` (иначе директива была бы unused → проверка бы упала).
  Отдельно проверен `LimitType` (одиночный литерал) — TypeBox сворачивает его в `const`, тест это
  учитывает (`enum-sources.spec.ts:53-54`).
- Eden на уровне роутов: `api.records.get({ query: { orderBy: 'nope' } })`, `direction: 'sideways'`,
  `api.img.get({ query: { variant: 'gif' } })` — отклонены типами; валидные значения приняты.
  Единственное «широкое» место — path-параметр `api.auth.accounts({ platform })`: Eden типизирует
  его как `{ platform: string | number }`. Это **не регрессия коммита**: тот же probe на родителе
  `bfff904` даёт ту же самую единственную unused-директиву; рантайм-валидация при этом строгая —
  `DELETE /auth/accounts/DISCORD` → 400 `validation: params /platform`, `KICK`/`TELEGRAM` проходят
  схему и упираются в 401.
- Негативный контроль: временная замена tuple на массив (`as LiteralSchema<Value>[]`) в
  `models.ts` ломает и probe (`orderBy: 'nope'` стал допустим), и сам `bun typecheck` (Elysia
  перестаёт выводить типы роутов) — tuple-обёртка действительно несущая и защищена проверкой типов.
- `$ref`-имена: список `t.Ref('…')` в `backend/src/gateway` на родителе и на коммите идентичен
  (26 имён), ключи всех `*Models`/`wordleModels`/`cocktailModels`/`authModels` не менялись.
  Дополнительно собрал рантайм-дамп схем всех 72 роутов (`query/params/body/response/headers/cookie`)
  на родителе и на коммите и сравнил: diff — **одна строка** (см. пункт 2).

## Пункт 2. Значения 13 + 4 inline схем идентичны до/после

Сравнение с родителем `bfff904` (литералы из `git show bfff904:…` и рантайм-JSON схем, собранных
из того же кода родителя):

| Схема                                          | Значения (родитель = коммит)                                    |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `AccountPlatform`                              | TWITCH, KICK, TELEGRAM                                          |
| `LimitType`                                    | SUGGESTION                                                      |
| `RecordGenre`                                  | GAME, MOVIE, ANIME, CARTOON, SERIES                             |
| `RecordStatus`                                 | QUEUE, PROGRESS, DROP, NOTINTERESTED, UNFINISHED, DONE          |
| `RecordGrade`                                  | DISLIKE, BEER, LIKE, RECOMMEND                                  |
| `RecordType`                                   | WRITTEN, SUGGESTION, ORDER                                      |
| `UserRole`                                     | USER, ADMIN                                                     |
| `WordleGameStatus`                             | IN_PROGRESS, WON, LOST                                          |
| `WordleLetterState`                            | CORRECT, PRESENT, ABSENT                                        |
| `WordleHistoryStatus`                          | WON, LOST, NONE                                                 |
| `IngredientCategory`                           | SPIRIT, LIQUEUR, WINE_BEER, MIXER, SYRUP, BITTER, FRESH, PANTRY |
| `CocktailTier`                                 | CORE, EXTRA, FREE                                               |
| `CocktailMethod`                               | SHAKE, STIR, BUILD, BLEND                                       |
| inline `platform` (`DELETE /auth/accounts/:p`) | TWITCH, KICK, TELEGRAM (теперь тот же объект модели)            |
| inline `variant` (`GET /img`)                  | poster, avatar                                                  |
| inline `orderBy` (`GET /records`)              | id, title                                                       |
| inline `direction` (`GET /records`)            | asc, desc                                                       |

Доказательства:

- `JSON.stringify` рантайм-схем всех 13 моделей на родителе и на коммите — **diff пуст**
  (идентчны не только множества, но и порядок `anyOf` и параметры `const/type`).
- 4 inline: собран JSON `t.Union([t.Literal(...)])` по литералам родителя и `enumUnion(<dict>)` на
  коммите — **diff пуст**; `auth-session` platform в родителе — те же три литерала, на коммите
  переиспользуется уже сверенный `AccountPlatform`.
- Дамп схем 72 роутов (родитель vs коммит) отличается **только** добавленным
  `"$id": "#/components/schemas/AccountPlatform"` внутри `params` у
  `DELETE /auth/accounts/:platform`. Причина: вместо inline-union подставлен зарегистрированный
  объект модели; значения те же, внешний контракт не меняется (это внутренняя якорная ссылка,
  как у `LimitType` в `ChangeLimitDTO` на родителе).

## Пункт 3. Мутационная проверка `enum-sources.spec.ts`

Baseline: 25 pass / 0 fail. Мутации — в `/tmp/review-b3`, после каждой `git checkout -- .`,
`git status` пуст.

| Мутация                                                                | Факт                                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A. `RecordStatus.DONE: 'COMPLETE_MUTATION'` в контракте                | 24 pass / 1 fail — падает закреплённый тест порядка (`enum-sources.spec.ts:112`) |
| B. лишний литерал `PODCAST` в `RecordGenre` (`models.ts`)              | 24 pass / 1 fail — `RecordGenre: TypeBox-модель повторяет contract`              |
| C. лишнее значение `LEGACY_GRADE` в `pgEnum('RecordGrade')` (database) | 24 pass / 1 fail — `RecordGrade: pgEnum повторяет contract`                      |
| D. удаление `RECOMMEND` из контракта (проверка слепой зоны)            | 25 pass / 0 fail — **не ловится**                                                |

Читается так: тест действительно ловит дрейф литералов в TypeBox и в `pgEnum` (B, C — это и есть
заявленный инвариант). Правки самого контракта (A, D) для остальных 12 схем не видны тесту, потому
что TypeBox-схема и `pgEnum` оба строятся из контракта в рантайме — «три места» уже не три, а одно
плюс сгенерированные SQL-миграции. Этот риск закрыт отдельным CI-шагом: при переименовании
значения контракта `drizzle-kit generate` создаёт миграцию (проверено: `migrations/0010_ci-drift-check.sql`

- snapshot), а `checks.yaml:50-57` (`git diff --exit-code -- database/migrations`) падает. Для
  `RecordStatus` дополнительно закреплён исторический порядок в БД (тест `:108-129`), совпадающий с
  `database/src/schema/enums.ts:32-39`.

**Не блокер**, но стоит одной строкой в комментарии теста зафиксировать: «правка значения в
contract требует миграции; это ловит CI-шаг, а не этот тест» — иначе комментарий `:44-45` («ловит
переименованное значение, забытое в одном из трёх мест») обещает больше, чем проверяет.

## Пункт 4. Ролевые константы эквивалентны прежним строкам, тип не расширен

Родитель → коммит (8 файлов, 9 констант; в сообщении коммита — «9 файлов», но девятый,
`gateway/auth.ts:10`, — это `enumUnion(UserRole)` для схемы `UserRole`, а не ролевая константа):

| Файл                        | Константы                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| `gateway/likes.ts:53`       | `USER_ROLES` = `[UserRole.USER, UserRole.ADMIN] as const`        |
| `gateway/ratings.ts:93-94`  | `USER_ROLES` = те же; `RATER_ROLES` = `[UserRole.USER] as const` |
| `gateway/suggestions.ts:49` | `USER_ROLES` = `[UserRole.USER, UserRole.ADMIN] as const`        |
| `gateway/wordle.ts:227`     | `USER_ROLES` = `[UserRole.USER, UserRole.ADMIN] as const`        |
| `gateway/users.ts:87`       | `ADMIN` = `[UserRole.ADMIN] as const`                            |
| `gateway/steam.ts:91`       | `ADMIN` = `[UserRole.ADMIN] as const`                            |
| `gateway/records.ts:142`    | `ADMIN` = `[UserRole.ADMIN] as const`                            |
| `gateway/limits.ts:43`      | `ADMIN` = `[UserRole.ADMIN] as const`                            |

- Значения совпадают со строками родителя один-в-один (`USER`/`ADMIN`); `UserRole` в контракте —
  `as const`, поэтому `UserRole.USER` имеет тип `'USER'`, а не `string`.
- `as const` сохранён везде; `requireRole(user, allowed: readonly GatewayUser['role'][])`
  (`auth.ts:79-86`) принимает `readonly UserRole[]` — расширения до `string[]` нет и не могло
  появиться: `string[]` не присвоится (typecheck бы упал). В `backend/src/gateway` литералов
  `'USER'`/`'ADMIN'` не осталось — только фикстуры в `gateway/__tests__/*` (`role: 'USER'` в моках
  `GatewayUser`), это законно и типизировано.
- `UserRole` во фронт приходит из `@gmdb/contract`, там же значения; `@gmdb/contract` — без
  зависимостей, а импорт значения в `gateway/auth.ts` — это backend, на бандл фронта не влияет.

## Пункт 5. Удаление `recordEnumModels` в users/twir безопасно

- `backend/src/gateway/users.ts` на коммите не содержит слова `Record` вообще (grep: 0
  вхождений). Регистрация была мёртвой: в `.model()` остались `apiErrorModels`, `authModels`,
  `accountEnumModels`, `userModels` (`:98-104`), а в роутах используются только их модели.
- `backend/src/gateway/twir.ts:34` — `.model({ ...apiErrorModels, ...suggestionModels, ...twirModels })`;
  оба строковых ref'а роута (`SuggestionCreateByTwirDTO`, `UserSuggestionResponseDTO`) объявлены в
  этих наборах (`twir.ts:10`, `suggestions.ts:24`), `Record*` не используются.
- Рантайм: тестовый гейтвей собирается целиком (`createTestGateway` → `createGateway`, 72 роута);
  при неразрешённой строковой ссылке Elysia падает при компиляции роута. Все 671 backend-тест
  зелёные, включая кейсы `/users/*` и `/twir/suggestion` (`misc-routes.spec.ts:43,131-186`).
- Eden-типы фронта: `bun typecheck` (vue-tsc) зелёный; дамп схем `/users/*` и `/twir/suggestion`
  на родителе и коммите идентичен (пункт 2) — состав зарегистрированных моделей на контракт не
  повлиял.
- Удалённый `export type ImageVariant` из `media.ts` никем не импортировался (repo-wide grep по
  `backend/src` и `frontend/src`: остались только `import { ImageVariant } from '@gmdb/contract'`
  и локальный тип во фронте, см. замечание 3).

## Пункт 6. Доменных литералов в схемах гейтвея не осталось

```
grep -rn "t\.Literal(" backend/src/gateway
→ telegram.ts:8  TelegramWebhookAck: t.Object({ ok: t.Literal(true) })   # boolean, не домен
→ models.ts:22   t.Literal(value as Value)                                # сам хелпер
```

`t.Enum`/`Type.Enum` в `backend/src` — 0 вхождений. Доменные строки в схемах остались только как
значения, собранные из контракта (подтверждено дампом схем, пункт 2). Соответствует новому правилу
`backend/src/AGENTS.md:58-60`.

## Пункт 7. Документация соответствует коду

- `backend/src/AGENTS.md:58-60` — «значения только из `@gmdb/contract`, TypeBox-схемы собираются
  `enumUnion` (`gateway/models.ts`), инвариант держит `__tests__/enum-sources.spec.ts`»: всё три
  факта верны (хелпер `models.ts:18`, тест существует и запускается `bun test`).
- `docs/architecture.md:83-85` — «`pgEnum` — те же константы; порядок в БД исторический, порядок
  отображения задаёт контракт»: `database/src/schema/enums.ts:30-98` действительно собирает все
  `pgEnum` из констант контракта; исторический порядок `RecordStatus` (`:32-39`) отличается от
  порядка контракта и закреплён тестом.
- `docs/architecture.md:139` («Enum'ы — `pgEnum`; в бэкенде реэкспортируются из `@gmd/database`
  через `backend/src/enums/`») остаётся верным: `backend/src/enums/*.enum.ts` — реэкспорт из
  `@gmd/database` (8 файлов + `index.ts`), доменные модули по-прежнему импортируют через него.

## Замечания

Все — **не блокеры**.

1. **MINOR (тест).** Инвариант не проверяет правку самого контракта: удаление/переименование
   значения (`мутация D`) оставляет 25/25 зелёными, т.к. TypeBox-схема и `pgEnum` деривативны.
   Реальный дрейф ловится только при добавлении литералов (B, C) и CI-шагом сверки миграций.
   Достаточно одной строки-комментария в тесте либо сравнения с SQL-миграциями.
2. **MINOR (охват).** Inline-сайты (`media.ts:58`, `records.ts:215-216`; `auth-session.ts:119`
   переиспользует модель) не входят в `modelPairs`/`databasePairs`. Дрейф от контракта там
   невозможен по построению, но возврат к литералам поймает только grep/правило AGENTS, не тест.
3. **MINOR / follow-up.** Во фронте остался локальный дубль `frontend/src/utils/image.ts:1`
   (`export type ImageVariant = 'poster' | 'avatar'`); hygiene-карта (T6) называет местом
   `@gmdb/contract`. Батч убрал backend-дубль (`gateway/media.ts`), фронтовый — вне его области,
   SSOT-цель кампании закрыта не полностью. Риска нет (тип структурно тот же), это следующий
   фронтовый батч/одна строка.
4. **PROCESS.** `docs/refactor/maps/*`, `tasks.md`, `progress.md` ещё описывают старые литералы
   (`maps/backend.md:269`, `maps/hygiene.md:162`) и не содержат раунда 3. По `README.md:58` карты
   обновляются при закрытии батча отдельным docs-коммитом (прецедент — `a4ea142`), поэтому DoD-пункт
   «задачи, карты и ADR обновлены» открыт, но код не блокирует.
5. **NOTE (сообщение коммита).** Перечень схем в теле точен, но формулировка «Удалены 4 блока
   продублированных литералов и комментарии-признания о дублях» неточна: заменено 13 именованных
   схем (в 4 файлах) + 4 inline (в 3 файлах), а комментарий-признание удалён один
   (`cocktails.ts:11` на родителе). На код не влияет.
