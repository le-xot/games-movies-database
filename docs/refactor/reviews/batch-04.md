# Ревью батча B-04 — `76d3fec` → **CHANGES REQUIRED**

|                  |                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                    |
| Коммит           | `76d3fec` (родитель — `91d68c2`)                                                                                                                                                                        |
| Ревьюер          | `review-batch4` (не автор коммита; только diff, изолированные worktree и прогоны)                                                                                                                       |
| Дата             | 2026-11-28                                                                                                                                                                                              |
| Что сделано мной | исходники не менялись, коммитов нет; в основном дереве создан только этот отчёт. Проверки — в detached-worktree на `76d3fec`, плюс второй worktree на `91d68c2` для A/B-сравнения; оба удалены в конце. |
| Не запускалось   | backend integration (Postgres), Playwright e2e, docker build — нужны стенды, вне списка ревью                                                                                                           |
| Важно            | пока шло ревью, ветка ушла вперёд (`604f866`, `b07e249`, `a6837fa` — батчи 5/6). Ревью — строго на `76d3fec`; все номера строк относятся к нему.                                                        |

## Вердикт

**CHANGES REQUIRED.** Кодовая часть батча чистая и подтверждена: все 103 throw-сайта родителя
переведены 1:1 (статус, текст, заголовки), конверт `ApiErrorDto` на проводе не изменился (проверено
A/B на живом `createGateway`), `onError` ловит `HttpError` и не ловит generic `Error`, bugfix
500 → 409 подтверждён поведенчески, `lint` / `format` / `typecheck` / backend 671 / frontend 126 /
build — зелёные. Функциональных регрессий не найдено.

Блокирует один пункт — **тестовая защита центрального изменения**. Батч удаляет мост
`fromDomainError` и переносит решение «статус ошибки → HTTP» в `instanceof HttpError`, но ни один
тест не проверяет это поведение: переписанный `errors.spec.ts` заменил прежнюю поведенческую
проверку (`fromDomainError(new Error('boom')) → null`) на тавтологию про наследование JS-классов, у
`ConflictError` / `BadGatewayError` / `ServiceUnavailableError` вообще нет упоминаний в спеках, а
исправленный 500 → 409 не имеет регрессионного теста. Это прямо нарушает правило 5 кампании
(«каждая устранённая регрессия получает ловушку») и ловушку, обещанную в задаче B-04
(`tasks.md`: «ловушка — тест «каждый брошенный класс в таблице»»). Лечится одним небольшим
тестовым коммитом; кодовых правок не требуется, после тестов — APPROVE.

## Что в коммите

47 файлов, +300/−346 (`git show --shortstat 76d3fec`):

- gateway (11): `errors.ts` (−`ApiError`, −`fromDomainError`), `index.ts` (+`instanceof HttpError`),
  `auth.ts`, `auth-oauth.ts`, `auth-session.ts`, `rate-limit.ts`, `telegram.ts`, `twir.ts`,
  `users.ts` + 2 спека;
- modules (31): 17 прод-файлов (auth, telegram, user, avatar, cocktail, img, like, rating, record,
  records-providers, suggestion, twir, wordle ×3) + 14 спеков;
- utils (3): `errors.ts` (+2 класса, −`HttpStatus`, −`HttpException`), `image-limits.ts` + спек;
- docs (2): `docs/architecture.md`, `backend/src/AGENTS.md`.

`database/`, `frontend/`, `contract/`, lockfile, CI и Docker не тронуты — внешние контракты
(роуты, cookie `token`, WS, схема БД) механически не затронуты. `git show --check 76d3fec` чисто,
новых `any` / `as unknown as` / `@ts-` / disable-комментариев нет.

## Прогоны (изолированный worktree на `76d3fec`, `bun install --frozen-lockfile`)

| Проверка                       | Результат                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors. Finished in 125ms on 436 files with 95 rules`. |
| `bun format:check`             | exit 0 — `All matched files use the correct format`, 611 файлов.                        |
| `bun typecheck`                | exit 0 — contract 7 файлов, database 41, backend 268, frontend ~4.8 s; ошибок нет.      |
| `cd backend && bun test`       | exit 0 — **671 pass / 0 fail**, 80 файлов, 36 214 `expect`, 2.04 s.                     |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect`.                                  |
| `cd frontend && bun run build` | exit 0 — `build:types` (vue-tsc) done, `build:ci` (vite 8.3.5) `✓ built in 1.14s`.      |
| `git show --check 76d3fec`     | чисто (whitespace-ошибок нет).                                                          |

## Пункт 1. Эквивалентность throw-сайтов — подтверждено

Арифметика сходится точно: на родителе **103** throw-сайта в прод-коде (80 вызовов
`*Exception` + 16 `new ApiError(...)` + 7 `new HttpException(...)`), на HEAD **104** — ровно +1
исправленный (`linkPlatformAccount`). Ни один сайт не потерян и не сменил статус:

| Источник в `91d68c2`                             | HEAD                                             | Статус      | Кол-во | Сообщение                        |
| ------------------------------------------------ | ------------------------------------------------ | ----------- | ------ | -------------------------------- |
| `BadRequestException(msg)` ×55                   | `BadRequestError(msg)`                           | 400         | 55     | без изменений                    |
| `new ApiError(400, msg)` ×9                      | `BadRequestError(msg)`                           | 400         | 9      | без изменений                    |
| `HttpException(msg, BAD_REQUEST)` ×1             | `BadRequestError(msg)`                           | 400         | 1      | без изменений                    |
| `UnauthorizedException`                          | — (в прод-коде не бросался, класс удалён)        | 401         | 0      | —                                |
| `new ApiError(401, msg)` ×4                      | `UnauthorizedError(msg)` / `UnauthorizedError()` | 401         | 4      | без изменений, в т.ч. кириллица  |
| `HttpException(msg, UNAUTHORIZED)` ×1            | `UnauthorizedError(msg)`                         | 401         | 1      | без изменений                    |
| `ForbiddenException(msg)` ×2                     | `ForbiddenError(msg)`                            | 403         | 2      | без изменений                    |
| `new ApiError(403, 'Forbidden')` ×1              | `ForbiddenError()` (default)                     | 403         | 1      | `'Forbidden'` = прежний литерал  |
| `NotFoundException(msg)` ×19                     | `NotFoundError(msg)`                             | 404         | 19     | без изменений                    |
| `new ApiError(404, \`User ${id} not found\`)` ×1 | `NotFoundError(\`User ${id} not found\`)`        | 404         | 1      | без изменений                    |
| `ConflictException(msg)` ×1                      | `ConflictError(msg)`                             | 409         | 1      | без изменений                    |
| `HttpException(msg, CONFLICT)` ×1                | `ConflictError(msg)`                             | 409         | 1      | без изменений                    |
| `throw new Error(...)` ×1 (bugfix)               | `ConflictError(msg)`                             | **500→409** | 1      | текст тот же                     |
| `new ApiError(429, msg, {retry-after})` ×1       | `TooManyRequestsError(msg, {retry-after})`       | 429         | 1      | текст тот же, заголовок сохранён |
| `HttpException(msg, BAD_GATEWAY)` ×2             | `BadGatewayError(msg)`                           | 502         | 2      | без изменений                    |
| `ServiceUnavailableException(msg)` ×3            | `ServiceUnavailableError(msg)`                   | 503         | 3      | без изменений                    |
| `HttpException(msg, SERVICE_UNAVAILABLE)` ×2     | `ServiceUnavailableError(msg)`                   | 503         | 2      | без изменений                    |

Детали, которые проверялись отдельно:

- `HttpStatus.INTERNAL_SERVER_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `TOO_MANY_REQUESTS` в родителе не
  использовались ни разу (`git grep HttpStatus. 91d68c2` → только 7 перечисленных сайтов), поэтому
  отдельный класс для 500 не нужен.
- `requireUser` (`ApiError(401,'Unauthorized')`) и `requireRole` (`ApiError(403,'Forbidden')`)
  заменены на `UnauthorizedError()` / `ForbiddenError()` — дефолтные сообщения совпадают посимвольно,
  поведенческий тест `auth-me` (401 + `message: 'Unauthorized'`) зелёный.
- `headers` (единственное использование — `retry-after` в `gateway/rate-limit.ts:42`) перенесены в
  конструктор `HttpError`; остальные подклассы заголовков не передают.
- Единственное появившееся изменение `name` (`this.name = new.target.name`) наружу не уходит:
  `errorBody` берёт `STATUS_TEXT`, а не `name`; в спеку добавлена проверка имени класса.

## Пункт 2. Конверт на проводе — не изменился

`errorBody` и `STATUS_TEXT` диффом не тронуты (`backend/src/gateway/errors.ts:46-63`; из файла
удалены только `ApiError`/`fromDomainError` и добавлен комментарий). Состав полей тот же:
`statusCode` / `message` / `error`. Проверено A/B live-прогоном одного и того же скрипта против
`createGateway` на `76d3fec` и на `91d68c2` (порт `weather.getWeatherData` бросает ошибку):

| Брошено (HEAD / родитель)                                            | Родитель: status + тело                                        | HEAD: status + тело                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `NotFoundError` / `NotFoundException`                                | 404 `{404,"record 42 missing","Not Found"}`                    | идентично                                 |
| `BadRequestError` / `HttpException(...,BAD_REQUEST)`                 | 400 `{400,"bad input","Bad Request"}`                          | идентично                                 |
| `UnauthorizedError` / `ApiError(401,...)`                            | 401 `{401,…,"Unauthorized"}`                                   | идентично                                 |
| `ForbiddenError` / `HttpException(...,FORBIDDEN)`                    | 403 `{403,"no way","Forbidden"}`                               | идентично                                 |
| `ConflictError` / `HttpException(...,CONFLICT)`                      | 409 `{409,"already linked","Conflict"}`                        | идентично                                 |
| `TooManyRequestsError` / `ApiError(429,…)`                           | 429 `{429,"slow down","Too Many Requests"}` + `retry-after: 7` | идентично                                 |
| `BadGatewayError` / `HttpException(...,BAD_GATEWAY)`                 | 502 `{502,"upstream failed","Error"}`                          | идентично                                 |
| `ServiceUnavailableError` / `HttpException(...,SERVICE_UNAVAILABLE)` | 503 `{503,"down","Service Unavailable"}`                       | идентично                                 |
| generic `Error`                                                      | 500 `{500,"Internal server error","Internal Server Error"}`    | идентично                                 |
| `Error` + duck-typed `statusCode: 418`                               | 418 `{418,"teapot","Error"}`                                   | **500** `{500,"Internal server error",…}` |

Для 502 (`'Error'` вместо `'Bad Gateway'`, т.к. 502 нет в `STATUS_TEXT`) поведение сохранено:
раньше 502 тоже шёл через `errorBody` и получал `'Error'`. 429 сохраняет и текст, и `retry-after`
(подтверждено живым прогоном, а также `auth-me.spec.ts:77-89` и `likes.spec.ts:112-114`).

## Пункт 3. `onError` — соответствует заявленному

HEAD (`backend/src/gateway/index.ts:63-68`): `error instanceof HttpError → set.status/headers →
errorBody`. Generic `Error` до этой ветки не доходит и падает в хвост
(`index.ts:110-112`) — `console.error('[gateway] unhandled error', error)` + 500
`'Internal server error'`; live-прогон это подтверждает (строка generic `Error` в таблице выше).
Ветки Elysia-ошибок (`VALIDATION`/response-schema, `NOT_FOUND`, `PARSE`, «прочие 4xx по
`error.status`») диффом не тронуты — хунк затрагивает только строки 61-75. A/B на живом гейтвее:

| Случай                                         | Родитель                                           | HEAD      |
| ---------------------------------------------- | -------------------------------------------------- | --------- |
| неизвестный путь (`/nope`)                     | 404 `{404,"Not Found","Not Found"}`                | идентично |
| битый JSON в `POST /records/link`              | 400 `{400,"Malformed request body","Bad Request"}` | идентично |
| VALIDATION тела (`POST /likes` без `recordId`) | 400, в `message` — JSON Elysia                     | идентично |

Единственное фактическое изменение поведения — снятие duck-typing: любой **чужой** error с числовым
`statusCode` в 400…599 раньше отдавался этим статусом, теперь — 500 (таблица выше, 418 → 500). Это и
есть заявленная цель батча. В репозитории таких ошибок нет: `grep -rn "\.statusCode" backend/src`
даёт только два чтения в `gateway/index.ts:65,68`; сторонние библиотеки (sharp/jose/Bun.redis/S3)
`statusCode` не используют. См. N3.

## Пункт 4. Rename — чисто

- `grep -rn "Exception" backend/src` → **0 совпадений**; repo-wide единственное — английское
  «Exception: `app.vue`» в `frontend/src/AGENTS.md:79`, к ошибкам не относится.
- `HttpException`, `HttpStatus`, `fromDomainError`, `ApiError` как класс — **0 совпадений** в коде.
  `ApiError` остался только в именах внешнего контракта (`ApiErrorModel`/`ApiErrorDto`,
  `frontend/.../parseApiError`) — так и должно быть.
- `grep -n "Error"` по диффу просмотрен глазами: переименованы только конструкторы и импорты;
  не-классовые символы не затронуты (`STATUS_TEXT`, `errorBody`, `apiErrorModels`,
  `standardErrors`, `publicErrors`, `BASE_ERRORS` не менялись).
- Импорт `HttpError` в `gateway/index.ts` — единственный новый кросс-слойный импорт; typecheck
  зелёный, висячих импортов нет.

## Пункт 5. Тесты — **единственный блокер**

671 pass / 0 fail — цифра реальная, тесты не «подогнаны»: почти вся тестовая часть диффа — честные
rename'ы, а `auth-telegram.spec.ts` даже усилен (`toThrow(HttpException)` → `toThrow(ConflictError)`).

Поведенчески через провод новое ядро покрыто частично — и ровно там, где покрытие было и раньше:

| Код                        | Что проверяет                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------- |
| 400 `BadRequestError`      | `auth-session.spec.ts:230-235` (неизвестная рамка), records 400 — Elysia-валидация |
| 401 `UnauthorizedError`    | `auth-me.spec.ts:67-74` (точное тело), `telegram-webhook.spec.ts`, wordle, likes   |
| 403 `ForbiddenError`       | `auth-session.spec.ts:243-252`                                                     |
| 404 `NotFoundError`        | `misc-routes.spec.ts:42-46` (`/users/missing`)                                     |
| 429 `TooManyRequestsError` | `auth-me.spec.ts:77-89` (точное тело + `retry-after`), `likes.spec.ts:112-114`     |
| 500 fallthrough            | `records.spec.ts:137-152` — но это **VALIDATION(response)**, не generic `Error`    |

**Не покрыто вообще:** `ConflictError` (409), `BadGatewayError` (502), `ServiceUnavailableError`
(503) — `grep -rn "ServiceUnavailableError\|BadGatewayError\|ConflictError" backend/src --include=*.spec.ts`
даёт: `ServiceUnavailableError` и `BadGatewayError` — **0 упоминаний**, `ConflictError` — два точечных
`toThrow` (`auth-telegram.spec.ts`, `user.service.spec.ts`), оба юнит-уровня и не через `onError`; ни одного
теста на ветку `unhandled error` → 500 нет.

**Дефект переписанного `errors.spec.ts`** (`backend/src/gateway/__tests__/errors.spec.ts:1-21`): удалённая
проверка была поведенческой — `fromDomainError(new Error('boom'))` возвращал `null`, т.е. тест
фиксировал «generic Error не мапится в HTTP». Замена
`expect(new Error('boom')).not.toBeInstanceOf(HttpError)` проверяет наследование JS-классов и не имеет
отношения к `onError`; она пройдёт при любой реализации гейтвея. Плюс исчезла проверка маппинга 404 и
passthrough заголовков (теперь есть только у `TooManyRequestsError`).

По правилам кампании это блокер, а не «долг»:

- правило 5: «каждая устранённая регрессия получает ловушку — тест, lint-правило, type-level проверку
  или CI-шаг. Уборка без защиты считается недоделанной»;
- B-04 в `tasks.md` обещает ловушку: «конверт на проводе не меняется; ловушка — тест «каждый брошенный
  класс в таблице»»;
- DoD батча: «на новый канон есть тест».

Батч исправляет два регресса (двойная модель ошибок с duck-typing; 500 на уже привязанный аккаунт), и
ни один не защищён. При этом `user.service.spec.ts` в этом же коммите всё равно правился (rename'ы) —
добавить кейс стоило 4 строки.

**Минимальный фикс (тестовый коммит, кода не касается):**

1. в `gateway/__tests__/errors.spec.ts` (или отдельный `on-error.spec.ts`) — таблица
   `[[new BadRequestError(msg),400,'Bad Request'], [new UnauthorizedError(),401,'Unauthorized'],
   [new ForbiddenError(msg),403,'Forbidden'], [new NotFoundError(msg),404,'Not Found'],
   [new ConflictError(msg),409,'Conflict'],
   [new TooManyRequestsError(msg,{'retry-after':'5'}),429,'Too Many Requests'],
   [new BadGatewayError(msg),502,'Error'], [new ServiceUnavailableError(msg),503,'Service Unavailable']]`
   и по каждому: порт `weather.getWeatherData` бросает класс → status, тело, `error`-текст (для 429 —
   `retry-after`);
2. там же: `throw new Error('boom')` из порта → 500 `{500,'Internal server error',…}` и отсутствие
   утечки текста ошибки;
3. `user.service.spec.ts`: `linkPlatformAccount` при уже привязанном аккаунте → `rejects.toThrow(ConflictError)`
   (+ статус 409 можно проверить через `errorBody`/`ConflictError.statusCode`).

## Пункт 6. Поведенческое 500 → 409 — корректно

Родитель (`backend/src/modules/user/user.service.ts:189`) бросал `new Error('This platform account is
already linked to another user')` — `fromDomainError` такой объект не матчил (нет `statusCode`), и
клиент получал 500. HEAD (`user.service.ts:187`) бросает
`ConflictError('This platform account is already linked to another user')`. Live-проверка одного и
того же вызова `UserService.linkPlatformAccount` (репозиторий возвращает занятый аккаунт):

| Ревизия   | Брошено         | `statusCode` | Что было бы на проводе                                                           |
| --------- | --------------- | ------------ | -------------------------------------------------------------------------------- |
| `91d68c2` | `Error`         | `undefined`  | 500 `{500,'Internal server error',…}`                                            |
| `76d3fec` | `ConflictError` | 409          | 409 `{409,'This platform account is already linked to another user','Conflict'}` |

Текст сообщения не менялся; 409 уже объявлен в схеме ответов (`standardErrors()`), фронт не ветвится
по статусу (в `frontend/src` нет проверок `status === 500/409`, только `parseApiError` по
`message`) — UI не ломается. Это осознанная смена внешнего кода (по правилу 2 коды — часть
контракта), см. N2.

Остальные `throw new Error(` в прод-коде (33 строки, из них 30 в рантайме) — допустимые 500-кейсы:

- инварианты репозиториев (`Failed to create …`, `… not found` после `returning()`) — 12;
- отказы внешних API (`twitch` 5, `kick` 4, `weather` 3) — 12, прежнее поведение, вне scope B-04;
- startup-инварианты (`wordle.dictionary` ×2, пустая палитра аватара) — 3;
- `utils/rate-limit.ts:64` — внутри `hitRateLimit` есть `try/catch` fail-open, наружу не выходит;
- `telegram.utils.ts:40` — вызывается внутри `try/catch` в `verifyIdToken` и превращается в
  `UnauthorizedError` (401);
- 3 строки — `assert-test-database.ts` (защита интеграционных прогонов).

Ни одной клиентской ветки (валидация ввода, «уже существует», «нет прав») с generic `Error` не
осталось — bugfix был последним.

## Пункт 7. Документация — соответствует коду

- `docs/architecture.md:106-108` — «Домен и гейтвей бросают `HttpError`-подклассы из
  `utils/errors.ts`; `onError` … превращает их в конверт. Generic `Error` на клиентских ветках
  запрещён — он станет 500» — ровно то, что в коде.
- `backend/src/AGENTS.md` — `gateway/errors.ts` описан как «ApiErrorDto-модели и errorBody»,
  в таблице WHERE TO LOOK — «`HttpError`-подклассы; конверт — `onError`», CONVENTIONS: «Ошибки —
  только `HttpError`-подклассы… Generic `Error` на клиентских ветках станет 500». Соответствует.
- Вне этих двух файлов устаревших упоминаний нет (`Exception`/`HttpStatus`/`fromDomainError` — 0).
- `docs/refactor/maps/backend.md:105-115` всё ещё описывает состояние родителя (это снимок рекона;
  по README карта обновляется при закрытии батча отдельным `docs(refactor)`-коммитом, как закрывали
  B-01/B-02). См. N1 — заодно поправить формулировку «лечения».

## Замечания

### Блокер

**B1. Нет тестовой защиты центрального изменения и исправленного багфикса.** Ни один тест не
проверяет, что `onError` маппит `HttpError`-подкласс в его статус, а generic `Error` — в 500,
`ConflictError`/`BadGatewayError`/`ServiceUnavailableError` не упоминаются в спеках вовсе, а
`linkPlatformAccount` 500 → 409 не имеет регрессионного теста. Переписанный `errors.spec.ts` заменил
поведенческую проверку моста на тавтологию (`new Error` не является `HttpError`). Нарушены правило 5
кампании и обещанная в B-04 ловушка. Фикс — тестовый коммит (рецепт в п. 5), код не меняется.

### Не блокеры

**N1. Реализация разошлась с записью B-04 в `tasks.md`/карте.** В плане: «один доменный тип +
таблица `code → status` в гейтвее». Реализовано: статус зашит в подкласс `HttpError`, таблицы нет.
Решение выглядит лучше исходного (deletion test: таблица + доменный `code` — лишний слой, статус
живёт рядом с ошибкой) и совпадает с брифом ревью, но норму надо зафиксировать: при закрытии батча
поправить строку B-04 и раздел карты `maps/backend.md:105-115` (иначе следующая рекон-итерация
увидит «расхождение плана и кода»). Если считать это сменой границы — короткий ADR.

**N2. Bugfix меняет внешний HTTP-код** (500 → 409) для существующей клиентской ветки. Бриф называет
это осознанным, фронт не ветвится по статусу и продолжит показывать `message`, но по правилу 2 коды —
часть внешнего контракта. Стоит одной строкой записать в `progress.md` раунда (или ADR), а не только
в сообщении коммита.

**N3. Снятие duck-typing** расширяет поверхность изменения: сторонняя ошибка с числовым
`statusCode` теперь 500 (A/B: 418 → 500). В репозитории таких объектов нет (grep выше), так что риск
теоретический. Тест из B1 (generic `Error` → 500) фиксирует намерение и не даст случайно вернуть
угадывание.

## Итог

Код батча — **готов к приёму**: эквивалентность 103 throw-сайтов, конверт и Elysia-ветки подтверждены
A/B-прогонами, bugfix корректен, все проверки зелёные, документация синхронна. Единственное, что
мешает поставить APPROVE — отсутствие ловушки (B1), прямо требуемой правилом 5 и задачей B-04.
После тестового коммита по рецепту п. 5 — **APPROVE** без дополнительных кодовых правок.
