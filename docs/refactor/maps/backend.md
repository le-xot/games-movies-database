# Backend — рекон архитектуры

> **Снимок рекона (батчи 1–2).** Актуальное состояние — `tasks.md` и `progress.md`;
> часть находок уже закрыта (см. таблицу «Сделано»).

> Снимок: 2026-11-28, ветка `chore/code-cleanup`, `backend/src`.
> 153 не-тестовых файла, 12 670 строк; 16 gateway-спек, 38 module-спек.
> Метод: чтение кода + граф импортов по всем `@backend/*` и относительным импортам.
> Каждая находка с evidence (`file:line`); всё, что не запускалось, помечено «не проверено».
> Код не менялся; это карта, а не план правок.

## 1. Обзор

Задуманное устройство (AGENTS.md, `docs/architecture.md`, `server/AGENTS.md`): `server → gateway → modules`,
гейтвей знает только порты, wiring маппит сущность→DTO, домен не знает про HTTP, у каждого правила один источник.
Реальность совпадает по **направлению** импортов, но расходится по **границам смысла**:

- Направление соблюдено: `modules → gateway` — **0 импортов**. Гейтвей в `modules/` заходит только в 3 файлах
  (из них 2 — не «чистые функции», см. B-12).
- Границы размыты дублями: каждый DTO существует дважды (класс в модуле + TypeBox-модель в гейтвее, B-02),
  две иерархии ошибок (B-01), три источника enum'ов (B-13), «порт» в wiring — переименование метода (B-05).
- Энтропия сконцентрирована в двух местах: `gateway/*.ts` (119 объявлений моделей, 72 роута, повторы обвязки — B-07)
  и Nest-наследие в `modules/` (17 `*.dto.ts`, 11 `*.entity.ts`, ~10 файлов без импортёров — B-03).

Сводка по ценности: **L** — B-01, B-02, B-05, B-07, B-13, B-09; **M** — B-03, B-06, B-08, B-10, B-11, B-12,
B-14, B-15; **S** — B-04, B-16, B-17. Всего 17 находок; приоритеты — в §5, нумерация B-xx — по темам, не по приоритету. Здоровые места (не находки): нет `t.Unsafe`, нет
`as unknown as`/`@ts-ignore` в продовом коде, нет `TODO/FIXME`; `pg.Pool` только в `DrizzleService`; `DomainEvents`
и лимитер — по одному экземпляру.

## 2. Граф зависимостей (реальный)

```
frontend ──(Eden, import type App)──► gateway/index.ts
main.ts ─► server/http.ts ─► gateway/*  (19 роут-плагинов + ws)
             │                 ├─ gateway/{errors,auth,rate-limit,models,query,cookies}
             │                 ├─ utils/{rate-limits,api-key,cors-origins,domain-events}
             │                 └─ modules/: auth.oauth-state, telegram.constants, telegram-bot.service,
             │                    cocktail.service (только тип)          ← 3 файла, B-12
             └─ server/{static,page-meta} ─► utils/{static-cache-headers,security-headers}

container.ts ─┬─ modules/<домен>/<домен>.service.ts
              │      └─► modules/<домен>/repositories/drizzle-*.repository.ts ─► DrizzleService ─► pg
              ├─ server/wiring/* (6 файлов) ──порты──► gateway/GatewayDeps (23 поля)
              └─ utils/{env,logger,domain-events,rate-limit}

modules/* ─► utils/* (61 импорт: errors, logger, enviroments, domain-events, image-limits, type-guards)
```

Измерено: `server` импортирует `gateway` (`http.ts:1-8`, `container.ts:2,54-55`) и `modules` — это норма;
`gateway` импортирует `utils` (rate-limits — 19 файлов) и **не** импортирует `DrizzleService`/`env`; `modules`
не импортирует `gateway`/`server`. Единственный модуль без сервиса — `modules/websocket` (реэкспорт контракта).

## 3. Инвентарь

### 3.1 modules — 22 каталога, 89 файлов, 7 309 строк, 26 сервисов, 13 репозиториев

| Каталог           | Файлов | Сервисы | Спеков | Заметка                                         |
| ----------------- | ------ | ------- | ------ | ----------------------------------------------- |
| auth              | 5      | 1       | 2      | JWT + OAuth-state; `dto/` мёртв (B-03)          |
| avatar / s3 / img | 5      | 3       | 3      | S3+Sharp, proxy; `GetImageQueryDTO` мёртв       |
| kick / twitch     | 2      | 2       | 0      | внешние API, generic `Error` (B-01)             |
| cocktail          | 7      | 2       | 4      | бот + сервис; enum'ы в гейтвее (B-13)           |
| like              | 5      | 1       | 1      | два файла `like.entity.ts` (B-03)               |
| limit             | 4      | 1       | 1      | сервис-обёртка 13 строк (B-05)                  |
| queue             | 3      | 1       | 1      | форматирование даты в домене (B-05)             |
| rating            | 5      | 1       | 1      | прямой Drizzle (B-10), `rating.entity.ts` мёртв |
| record            | 5      | 1       | 2      | две модели записи (B-02/B-03)                   |
| records-providers | 2      | 1       | 1      | Kinopoisk/Shikimori/IGDB                        |
| stats             | 3      | 1       | 1      | 8 count-запросов                                |
| steam             | 2      | 1       | 1      | импорт библиотеки                               |
| suggestion        | 4      | 1       | 1      | `suggesttion.dto.ts` мёртв                      |
| telegram          | 7      | 2       | 4      | бот + OIDC/JWKS                                 |
| twir              | 2      | 1       | 0      | вебхук бота                                     |
| user              | 8      | 1       | 3      | 2 DTO-слоя + `dto/` мёртв                       |
| weather           | 2      | 1       | 0      | таймер без destroy (B-08)                       |
| websocket         | 1      | 0       | 0      | `export * from '@gmdb/contract'`                |
| wordle            | 17     | 4       | 12     | таймеры, hooks есть и проведены (B-08)          |

### 3.2 gateway — 28 файлов, 3 687 строк, 72 роута, 119 моделей, 23 поля `GatewayDeps` (19 доменных портов)

`auth-oauth`(12 роутов), `wordle`(11), `auth-session`(9), `records`(6), `likes`/`ratings`/`users`(5),
`cocktails`(4), `suggestions`(3), `media`/`steam`(2), `limits`/`queue`/`stats`/`telegram`/`twir`/`weather`/`me`/
`health`(1), `ws`(/ws). Инфраструктура: `index.ts` (сборка+`onError`), `errors.ts`, `models.ts`, `auth.ts`,
`jwt-authenticator.ts`, `cookies.ts`, `query.ts`, `rate-limit.ts`.

### 3.3 server / wiring / utils

| Файл                            | Строк | Роль                                                     |
| ------------------------------- | ----- | -------------------------------------------------------- |
| `server/container.ts`           | 239   | composition root + списки `started`/`stoppable`          |
| `server/http.ts`                | 113   | `/api`, CORS, security-заголовки, JSON-404, sitemap, SPA |
| `server/static.ts`              | 77    | отдача `frontend/dist`                                   |
| `server/page-meta.ts`           | 267   | `<head>`, canonical, sitemap.xml                         |
| `server/wiring/analytics.ts`    | 19    | 3 порта — pass-through (B-05)                            |
| `server/wiring/catalog.ts`      | 119   | records/ratings/likes/suggestions                        |
| `server/wiring/cocktails.ts`    | 11    | 1 порт — pass-through (B-05)                             |
| `server/wiring/integrations.ts` | 131   | 7 портов + 2 конфига (B-06)                              |
| `server/wiring/people.ts`       | 35    | users + authSession на одном `UserService`               |
| `server/wiring/wordle.ts`       | 39    | wordle/practice/notifications                            |

`utils/` — 13 файлов: `enviroments`, `errors`, `logger`, `domain-events`, `rate-limit(s)`, `api-key`,
`cors-origins`, `image-limits`, `security-headers`, `static-cache-headers`, `type-guards`, `assert-test-database`.

## 4. Находки

### B-01 · Две иерархии ошибок и третья — generic `Error` · ценность L · риск med

- **Симптом.** Домен бросает `HttpError`-подклассы из `utils/errors.ts`, гейтвей — `ApiError` из `gateway/errors.ts`;
  мост между ними — duck-typing по числовому `statusCode`. Часть домена бросает generic `Error` → 500.
- **Evidence.**
  - `backend/src/utils/errors.ts:9` — `export class HttpError extends Error { constructor(readonly statusCode: number, ...` (и Nest-имена: `BadRequestException`, `NotFoundException`, `HttpException`).
  - `backend/src/gateway/errors.ts:51` — `export class ApiError extends Error`; `:78` — `fromDomainError` берёт `(error as {statusCode?: unknown}).statusCode`.
  - `backend/src/modules/user/user.service.ts:189` — `throw new Error('This platform account is already linked to another user')` → 500, хотя это 409; `new HttpException(...)` — 7 бросаний в 3 сервисах (`auth.service.ts:124`, `telegram.service.ts:25,68,73,88,98`, `user.service.ts:200`).
  - Документация противоречива: `docs/architecture.md:103` — «Домен бросает `ApiError`», `backend/src/AGENTS.md:38` — «Домен бросает `HttpError`».
- **Энтропия.** Два владельца семантики «HTTP-статус ошибки» + третий путь без статуса. Новый сервис может выбрать любую
  из трёх и «получить 500 там, где ждали 409».
- **Лечение.** Один класс доменной ошибки с `code` (без HTTP-статуса) + таблица `code → status` в `gateway/errors.ts`;
  удалить `HttpException`/`HttpStatus` и generic `Error` в клиентских ветках. Ловушка: тест, что каждый бросаемый доменом класс есть в таблице.
- **Риск.** med (трогает все сервисы и конверт, конверт на проводе не меняется). **Ценность.** L.

### B-02 · Каждый DTO существует дважды: class-DTO модуля и TypeBox-модель гейтвея · ценность L · риск med

- **Симптом.** `modules/*/*.dto.ts` (17 файлов) описывают те же поля, что TypeBox-модели гейтвея; классы DTO
  нигде не инстанциируются — только аннотации возврата сервисов.
- **Evidence.**
  - `backend/src/modules/weather/weather.dto.ts:31` `export class WeatherDTO` vs `backend/src/gateway/weather.ts:8-10` — комментарий «Имена моделей повторяют DTO из `modules/weather/weather.dto.ts`»; модели 11-41.
  - Пары: `modules/steam/steam.dto.ts:4` vs `gateway/steam.ts:20`; `modules/queue/queue.dto.ts:3` vs `gateway/queue.ts:10`; `modules/wordle/wordle.dto.ts:5-29` vs `gateway/wordle.ts:14-102`; `modules/limit/limit.dto.ts:3-13` vs `gateway/limits.ts:17-24`; `modules/stats/stats.dto.ts:3-53` vs `gateway/stats.ts:11-56`.
  - Внутри гейтвея то же раздвоение: `WeatherResponse` (`gateway/weather.ts:43-52`) дублирует модель 11-41; `SteamGame` (`gateway/steam.ts:56-62`) — модель 20-26; `Queue`/`QueueItem` (`gateway/queue.ts:26-38`) — модели 10-22, тогда как в `records.ts:115` тип выводится из схемы (`typeof RecordEntity.static`) — два стиля в одном слое.
- **Энтропия.** Изменение поля требует правки в 2–3 местах; фронт получает тип из TypeBox, домен — из класса,
  расхождение не видно ни typecheck'у (структуры пока совпадают), ни тестам. Дубль признан нормой в комментарии.
- **Лечение.** TypeBox — единственный источник формы; class-DTO, равные форме возврата, удалить, оставив доменные
  типы из `entities/*` (как уже сделано в `record/entities`, `rating/entities`). Ловушка: type-level тест на совпадение.
- **Риск.** med (сигнатуры сервисов и Eden-типы). **Ценность.** L.

### B-03 · Мёртвое Nest-наследие: 10 файлов без импортёров и entity-классы, которые никто не создаёт · ценность M · риск low

- **Симптом.** Без импортёров (проверено графом, ноль не-тестовых импортов): `modules/auth/dto/{callback,success-response,update-nickname}.dto.ts`,
  `modules/like/like.dto.ts`, `modules/rating/rating.dto.ts`, `modules/rating/rating.entity.ts`,
  `modules/suggestion/suggesttion.dto.ts` (опечатка), `modules/user/user.dto.ts`,
  `modules/user/entities/user-account.entity.ts`, `enums/enums.names.ts`; плюс `GetImageQueryDTO` (`modules/img/img.dto.ts:6-10`).
- **Evidence.** `export class UserSuggestionDTO` (`modules/suggestion/suggesttion.dto.ts:3`) — импортов нет;
  `export class MergeUsersResultEntity` (`modules/user/user.entity.ts:25-43`) дублирует `interface MergeUsersResult`
  (`modules/user/entities/user-domain.entity.ts:46-56`); `rating.entity.ts:70` — вся Nest-иерархия `RatingEntity`/`UserRatedRecordEntity`, заменённая `entities/rating-domain.entity.ts` + `gateway/ratings.ts`.
- **Энтропия.** Два имени одного домена (`suggesttion.dto.ts` vs `suggestion`), два `like.entity.ts` в одном модуле
  (`modules/like/like.entity.ts` — класс `LikeEntity`, `modules/like/entities/like.entity.ts` — `type LikeDomain`):
  мёртвые файлы выглядят как актуальный контракт и провоцируют правки «не туда».
- **Лечение.** Удалить перечисленное; `like/entities/like.entity.ts` → `like-domain.entity.ts`. Ловушка: CI-скрипт «нет .ts без импортёров» (кроме entrypoint).
- **Риск.** low (ноль импортёров). **Ценность.** M (~150 строк обманчивого кода).

### B-04 · `api-types.ts` — ручной слой переименований на ~48 имён с одним потребителем · ценность M · риск low

- **Симптом.** 70 строк алиасов «старое имя → тип гейтвея»; единственный потребитель — `frontend/src/lib/api.ts:7`
  `export type * from '@backend/api-types'`; часть алиасов не используется фронтом вовсе.
- **Evidence.** `backend/src/api-types.ts:8-59`; дубли в одном `export type`: `WordleLeaderboard as WordleLeaderboardDTO, WordleLeaderboard` (`:37-38`), `WordlePracticeState…` (`:39-40`), `WordleStats…` (`:42-43`), `WordleNotificationStatus…` (`:46-47`);
  ни разу не импортированы во `frontend/src`: `GetLikesByIdDTO`, `MergeUsersDto`, `Queue`, `RatingUpsertDTO`, `SuggestionOwnershipEntity`, `UserRatedRecordEntity`, `UserSuggestionDTO`, `WordleNotificationsUpdateDTO`;
  тёзки-коллизии: тип `RecordsStatsDTO` здесь (`:66`) и TypeBox-модель `RecordsStatsDTO` в `gateway/stats.ts:40`.
- **Энтропия.** Третий неймспейс между TypeBox и фронтом; имена совпадают с Nest-DTO и с моделями гейтвея, поэтому
  «какой `RecordEntity` имеется в виду» зависит от файла импорта.
- **Лечение.** Оставить реально импортируемые алиасы (≈11), остальные удалить. Ловушка: CI-проверка неиспользуемых экспортов.
- **Риск.** low (только типы). **Ценность.** M.

### B-05 · wiring не маппит: «порты» — переименование методов, форму держит рантайм-схема · ценность L · риск med

- **Симптом.** `docs/architecture.md:30` обещает «query/body → аргументы сервиса, маппинг сущностей в DTO».
  Фактически 2 из 6 файлов — чистый pass-through, в остальных маппинга нет — только имена методов.
- **Evidence.**
  - `backend/src/server/wiring/analytics.ts:13-19` — `return { weather, stats, queue }` (сервисы как есть); `wiring/cocktails.ts:9-10` — `return { cocktails }`.
  - `backend/src/server/wiring/catalog.ts:97-111` — `const page = await likes.getLikesByRecordId(recordId); return { likes: page.likes, total: page.total }` — тождественная переупаковка; `:70-90` — `ratings.getMy`/`getUser` идентичны.
  - `backend/src/server/wiring/people.ts:17-18` — `getAll: () => users.getAllUsers()`, при этом сервис отдаёт `Promise<UserDomain[]>` (`modules/user/user.service.ts:128` = `SelectRow<'users'>`), а порт ждёт `GatewayUser[]` (`gateway/users.ts:74`). Лишнее поле `unlockedAvatarFrameIds` (`database/src/schema/users.ts:20`) отсутствует в `UserEntity` (`gateway/auth.ts:10-20`) и не утекает только потому, что Elysia чистит ответ по схеме (`gateway/records.ts:44-45`).
  - Обратная аномалия: презентационное форматирование живёт в домене — `modules/queue/queue.service.ts:20-24` `toLocaleDateString('ru-RU', …)`, а wiring ничего не приводит.
- **Энтропия.** Слой, который по документации владеет формой ответа, формы не владеет; фактический маппер — рантайм-валидатор Elysia.
  Порт не инкапсулирует ничего (deletion test: удаление wiring не увеличит сложность вызывающих), но создаёт иллюзию границы
  и десятки строк `(...args) => service.method(...args)`.
- **Лечение.** Решить и зафиксировать одно: (а) порты остаются, в них появляется явный `toDto`; (б) портов нет, гейтвей типизируется
  доменными типами, `wiring/` удаляется. Даты/локаль вынести из `queue.service`. Ловушка: тест «нет лишних полей в ответе».
- **Риск.** med (граница с фронтом). **Ценность.** L.

### B-06 · `wiring/integrations.ts` — «мусорная группа»: 7 портов, 2 конфига и логика Steam · ценность M · риск med

- **Симптом.** Один файл владеет лимитами, TWIR, картинками, аватарами, Steam, OAuth-конфигом и Telegram-вебхуком.
- **Evidence.** `backend/src/server/wiring/integrations.ts:41-52` — `Pick<GatewayDeps, 'limits'|'twir'|'twirApiKey'|'images'|'avatars'|'steam'|'oauth'|'oauthConfig'|'telegramWebhook'>`;
  `:71-93` — в wiring вычисляется `existingAppIds` через `steam.isDuplicate(game, existing)` (бизнес-правило дублей — в проводке);
  `:112-116` — `verifyTelegramWebApp`; `:118-125` — снимок `env` в `oauthConfig`.
- **Энтропия.** Группа не по домену, а по слову «интеграции»: любая новая внешняя фича добавляется сюда, файл растёт без границы.
  Проводка содержит правило Steam и читает `env` в обход container.
- **Лечение.** Разрезать по доменам: `oauth.ts` (oauth+config), `media.ts` (images+avatars), `integrations.ts` (limits/twir/steam);
  цикл `isDuplicate` — в `steam.getGames()`, наружу готовый `existingAppIds`; `oauthConfig` — в `container.ts`.
- **Риск.** med (OAuth/Telegram — зона осторожности). **Ценность.** M.

### B-07 · Каждый роут пересобирает одну и ту же обвязку: limit ×9, guard-цепочка ×21, роли ×9, наборы моделей ×4 · ценность L · риск low

- **Симптом.** Один и тот же код скопирован по роут-файлам; имена роутов в ключах лимита остались от Nest.
- **Evidence.**
  - Локальный `const limit = (...) => enforceRateLimit(...)` объявлен 9 раз: `auth-oauth.ts:141-155`, `auth-session.ts:63-74`, `cocktails.ts:99-110`, `ratings.ts:97-107`, `records.ts:139-150`, `steam.ts:94-104`, `suggestions.ts:52-58`, `users.ts:90-96`, `wordle.ts:229-243`; две разные сигнатуры (`ctx` vs `request, server`).
  - `requireRole(requireUser(await resolveUser(auth, ...)))` — 21 вхождение (`records.ts:174`, `ratings.ts:133`, `users.ts:124`, `steam.ts:110` и т.д.). Ролевые константы: `ADMIN` — `limits.ts:43`, `records.ts:134`, `steam.ts:91`, `users.ts:87`; `USER_ROLES` — `likes.ts:52`, `ratings.ts:93`, `suggestions.ts:49`, `wordle.ts:226`; `RATER_ROLES` — `ratings.ts:94`.
  - `.model({ ...apiErrorModels, ...authModels, ...recordEnumModels, ...recordModels, ...likeModels })` — 4 почти одинаковых блока: `records.ts:152-161`, `ratings.ts:117-124`, `steam.ts:113-121`, `suggestions.ts:61-69`.
  - Ключи лимита: `'RecordController.getAllRecords'` (`records.ts:190`), `'AuthController.me'` (`me.ts:25`), `'TelegramBotController.handleUpdate'` (`telegram.ts:38`) — контроллеров нет с эпохи Nest.
- **Энтропия.** Пропуск лимита/гарда в новом роуте не виден typecheck'у и не ловится тестом (тесты проверяют отдельные пути).
  Второй способ объявить то же самое → расхождения (см. B-16).
- **Лечение.** `withRateLimit(rateLimit, route, config)` в `gateway/rate-limit.ts` (один вызов из `onBeforeHandle`);
  guard-хелперы в `gateway/auth.ts`; `catalogModels()` — один набор для четырёх плагинов; ключи лимита — из реального пути.
  Ловушка: тест-таблица «у каждого роута есть лимит», ключ = path.
- **Риск.** low-med (порядок middleware зафиксирован тестами). **Ценность.** L.

### B-08 · Lifecycle: хуки `DrizzleService` не проводятся, таймер погоды без destroy, скрытый `void new` · ценность M · риск med

- **Симптом.** Документация: сервис с хуком обязан быть в `started`/`stoppable` (`server/AGENTS.md:43-48`). Списки расходятся с реальностью.
- **Evidence.**
  - `backend/src/database/drizzle.service.ts:18-27` — `onModuleInit` (ping `select 1`) и `onModuleDestroy` (`pool.end()`), но в `server/container.ts:186-191` `drizzle` в списках нет; вместо этого `container.ts:235` вручную делает `await drizzle.pool.end()`. Startup-ping никогда не выполняется.
  - `backend/src/modules/weather/weather.service.ts:86-90` — `setInterval(...)` внутри `onModuleInit`, `onModuleDestroy` нет; в `started` сервис есть (`container.ts:189`), в `stoppable` — нет (`:191`).
  - `server/container.ts:144-146` — `void new CocktailBotService(...)`: сервис создаётся ради побочного эффекта и не отслеживается (появится хук — молча не запустится); `new DrizzleRecordRepository` — `:104` и `:117`, `new ImgService` — `:107` и `:116` (созданы дважды).
- **Энтропия.** `started`/`stoppable` — ручной реестр без автоматической проверки; таймер погоды переживает `close()`
  (в тестах/перезапусках интервал утекает; на живом процессе не проверено) — тестов на lifecycle нет.
- **Лечение.** `Lifecycle`-интерфейс + регистрация один раз (`container.register(service)`), списки выводятся из объектов;
  `pool.end()` — только через `onModuleDestroy`; `WeatherService` получает `clearInterval`. Ловушка: тест «каждый класс с `onModuleInit` есть в списке».
- **Риск.** med (старт/стоп прода). **Ценность.** M.

### B-09 · Два пути create/delete записи; suggestion-delete пропускает `recordRatings` (FK `restrict`) · ценность L · риск med

- **Симптом.** Создание записи+ownership и каскадное удаление записи реализованы дважды, с разным набором таблиц.
- **Evidence.**
  - `backend/src/modules/record/repositories/drizzle-record.repository.ts:108-114` — `delete`: `likes`, `recordRatings`, `records`.
  - `backend/src/modules/suggestion/repositories/drizzle-suggestion.repository.ts:111-117` — `deleteSuggestionWithLikes`: `likes`, `suggestionOwnerships`, `records`; **`recordRatings` не удаляются**.
  - Схема: `recordRatings.recordId` — `onDelete('restrict')` (`database/src/schema/record-ratings.ts:31-37`), `likes.recordId` — `restrict` (`likes.ts:24-30`), `suggestionOwnerships.recordId` — `cascade` (`suggestion-ownerships.ts:56-62`).
  - Дубль создания: `drizzle-record.repository.ts:16-37` (insert records+ownership) vs `drizzle-suggestion.repository.ts:39-64` (то же с другими дефолтами).
- **Энтропия.** Инвариант «удаляя запись, снеси всё, что её держит» записан дважды и уже разъехался: удаление предложения
  с оценкой упрётся в `restrict` → 500. На живой БД не проверено (нужен интеграционный тест: suggestion → rating → DELETE).
- **Лечение.** Один `RecordRepository.deleteWithRelations(id)`, вызываемый обоими путями; suggestion-специфика — до каскада.
  Ловушка: интеграционный тест «delete suggestion с рейтингом и лайком».
- **Риск.** med (данные/500). **Ценность.** L (латентный баг + удаление дубля).

### B-10 · `RatingService` ходит в БД напрямую — единственный сервис с `DrizzleService` · ценность M · риск med

- **Симптом.** Сервис инжектит `DrizzleService` и сам запрашивает `records`/`users`, минуя репозитории.
- **Evidence.** `backend/src/modules/rating/rating.service.ts:1` импорт `DrizzleService`, `:11` импорт таблиц из `@gmd/database/schema`,
  `:18-22` конструктор, `:26-32` `this.drizzle.db.query.records.findFirst(...)`, `:70-76` `...query.users.findFirst(...)`;
  ни один из остальных 25 сервисов не получает `DrizzleService` (`server/container.ts:79-119`).
- **Энтропия.** Второй путь доступа к тем же таблицам; проверка существования записи дублирует `DrizzleRecordRepository.findById`
  и проверку в `record.service`, но с другим сообщением; репозиторный слой перестаёт быть единственным местом SQL.
- **Лечение.** Перенести оба запроса в `DrizzleRatingRepository` (`recordExists`, `findUserBrief`) или использовать существующие методы;
  ловушка: lint «`@gmd/database/schema` только в `repositories/`».
- **Риск.** med (поведение 404). **Ценность.** M.

### B-11 · «Друзья-агрегат» объявлен и собирается в 5 местах · ценность M · риск low

- **Симптом.** Одна форма (`friendsCounts/friendsTotal/friendsTop/myGrade`) описана в домене дважды, собирается двумя копиями кода и описана ещё в двух схемах.
- **Evidence.** `modules/rating/entities/rating-domain.entity.ts:23-28` (`RecordFriendsView`); `modules/record/record.entity.ts:38-44` (поля класса);
  `modules/record/record.service.ts:36-64` (`attachFriends`); `modules/rating/rating.service.ts:84-103` (тот же цикл `aggregateByRecords`+`findMyGrades`);
  `gateway/records.ts:46-49` (схема); `gateway/ratings.ts:38` (`...RecordEntity.properties`).
- **Энтропия.** Правка одного поля — шесть мест; две копии маппинга уже расходятся мелочью (в `record.service` `row.id`, в `rating.service` `record.id`).
- **Лечение.** Один `toFriendsView(record, aggregate, myGrade)` рядом с `RecordFriendsView`; оба сервиса вызывают его.
- **Риск.** low. **Ценность.** M.

### B-12 · Константное сравнение секретов дважды; гейтвей импортирует функцию из service-файла · ценность M · риск low

- **Симптом.** «Timing-safe сравнение секрета» — две реализации; одна приезжает в гейтвей из сервиса.
- **Evidence.**
  - `backend/src/utils/api-key.ts:7-13` — `isApiKeyValid` (длина + `timingSafeEqual`), используется `gateway/twir.ts:46`.
  - `backend/src/modules/telegram/telegram-bot.service.ts:77-83` — `webhookSecretsMatch` (та же логика); импортируется гейтвеем: `gateway/telegram.ts:3`.
  - Правило нарушено: `server/AGENTS.md:55-56`, `docs/architecture.md:35-37` разрешают гейтвею только «чистые функции и константы», а `telegram-bot.service.ts` — сервис на grammY (импорт тянет bot-модуль в граф гейтвея). Второй случай — `gateway/cocktails.ts:6` (тип `CocktailCatalog` из `cocktail.service.ts`, а не из `cocktail.types.ts`).
- **Энтропия.** Секретная логика в двух местах; граница «гейтвей не знает про сервисы» обходится, `telegram-webhook` связан с внутренностями бота.
- **Лечение.** Один `secretsMatch` в `utils/` или в чистом `telegram.webhook-secret.ts`; `CocktailCatalog` — в `cocktail.types.ts`.
  Ловушка: lint «gateway/* не импортирует modules/*.service».
- **Риск.** low. **Ценность.** M.

### B-13 · Enum'ы живут в трёх источниках, гейтвей хардкодит литералы · ценность L · риск med

- **Симптом.** Одно значение (`GAME`, `WON`, `SPIRIT`…) определено в `@gmdb/contract`, в `pgEnum` database и литералами в TypeBox-моделях.
- **Evidence.**
  - `contract/src/enums.ts:20-63` — `RecordStatus`, `RecordType`, `RecordGenre`, `RecordGrade`, `LimitType`, `AccountPlatform` (`as const`); `database/src/schema/enums.ts:32-62` — `pgEnum` с теми же значениями; `backend/src/enums/index.ts` реэкспортирует их 8 однострочными файлами (`record-genre.enum.ts:1` и т.п.).
  - `backend/src/gateway/models.ts:8-42` — `AccountPlatform`, `LimitType`, `RecordGenre`, `RecordStatus`, `RecordGrade`, `RecordType` заново перечислены `t.Literal`.
  - `backend/src/gateway/wordle.ts:15-17` — три `t.Union` со статусами; `backend/src/gateway/cocktails.ts:14-33` — категории/тиры/методы (комментарий `:8-12` прямо признаёт: «продублированы литералами»).
- **Энтропия.** Новый жанр требует ≥3 правок; забытая TypeBox-строка отдаёт 500 на валидном доменном значении
  (схема ответа не пропустит новое значение). `t.Union(Object.values(RecordGenre).map(v => t.Literal(v)))` — рабочая замена.
- **Лечение.** `enumUnion()` в `gateway/models.ts` из `@gmdb/contract` + type-level сверка с `pgEnum`. Ловушка: тест на совпадение множеств.
- **Риск.** med (контракт с фронтом, имена `$ref` сохранить). **Ценность.** L.

### B-14 · Логирование раздвоено: `Logger` (24 экземпляра) vs `console.*` (7 мест в рантайм-слоях), без уровней · ценность M · риск low

- **Симптом.** В домене — `Logger` с контекстом, в гейтвее/container/событиях — голый `console` с ручным префиксом.
- **Evidence.** `backend/src/utils/logger.ts:10-18` — любая запись идёт в `console.log/warn/error` без уровня/времени; `:30-32` — `debug()` тоже пишет через `console.log` и нигде не используется.
  `console.error` — `gateway/index.ts:80,111`; `console.warn` — `gateway/ws.ts:69`, `server/container.ts:177,203,231`, `utils/domain-events.ts:35`; в `main.ts:38-43` — только старт/сигналы, это норма.
- **Энтропия.** Нельзя выключить debug в проде и фильтровать по контексту; сообщения в двух форматах (`[gateway]` vs `[Class]`),
  часть ошибок без уровня. Наблюдаемость зависит от того, в каком слое писали строку.
- **Лечение.** `Logger` — единственный фасад, `level` из env и структурированный вывод; `console` только в `main.ts`.
  Ловушка: lint «no-console вне main.ts».
- **Риск.** low. **Ценность.** M.

### B-15 · `DrizzleService` читает `process.env` мимо envalid · ценность M · риск low

- **Симптом.** Единственное место в продовом коде, где env читается напрямую, — подключение к БД.
- **Evidence.** `backend/src/database/drizzle.service.ts:1` `import process from 'node:process'`; `:13` — `new Pool({ connectionString: process.env.DATASOURCE_URL ?? '' })`;
  схема валидации `backend/src/utils/enviroments.ts:5-6` (`cleanEnv(... DATASOURCE_URL: str({})`); остальные 40+ ключей читаются через `env.*`.
- **Энтропия.** Два контракта конфигурации; `?? ''` превращает отсутствие переменной в позднюю невнятную ошибку pg вместо падения на старте с именем ключа.
- **Лечение.** `DrizzleService` получает `connectionString` из `container.ts` (`env.DATASOURCE_URL`); прямое чтение env запрещено.
  Ловушка: lint «process.env только в utils/enviroments.ts».
- **Риск.** low. **Ценность.** M.

### B-16 · Мёртвые регистрации моделей и двойной импорт · ценность S · риск low

- **Симптом.** Плагины регистрируют наборы моделей, которые не используют; один файл импортирует `models.ts` дважды.
- **Evidence.** `backend/src/gateway/users.ts:11` импортирует `recordEnumModels`, `:103` регистрирует — в файле нет ни одной ссылки на `RecordGenre/Status/Grade/Type`;
  `backend/src/gateway/twir.ts:2` и `:3` — два импорта из `@gateway/models`, `:35` регистрирует `recordEnumModels`, не используя его.
- **Энтропия.** Лишние `$ref`-записи в реестре плагина (влияют на имена схем Eden) и ложный сигнал «этот роут про записи».
- **Лечение.** Убрать `recordEnumModels` из `users`/`twir`, слить импорты; покрывается lint'ом на неиспользуемые импорты (сейчас не ловит из-за spread).
- **Риск.** low (проверить, что Eden-типы не меняются). **Ценность.** S.

### B-17 · Непоследовательные preset'ы лимита на write-роутах Wordle · ценность S · риск low

- **Симптом.** Два мутирующих роута уведомлений используют `public` (1000/мин), третий — `write` (20/мин).
- **Evidence.** `backend/src/gateway/wordle.ts:363` — `'WordleNotificationController.update', RATE_LIMITS.public` (PATCH); `:390` — `remove`, `RATE_LIMITS.public` (DELETE); `:378` — `createLink`, `RATE_LIMITS.write`.
  Остальные мутации гейтвея — `write` (`records.ts:235,252,269`, `users.ts:158,175`).
- **Энтропия.** Пресет выбирается на глаз в каждом роуте; нет правила «метод → preset». Ослабление лимита не видно в тестах.
- **Лечение.** Пресет по умолчанию от метода в хелпере из B-07, исключения — с комментарием.
- **Риск.** low (меняет поведение лимитов). **Ценность.** S.

## 5. Кандидаты в пул задач (по порядку)

| Prio | Задача                                                                                                                                            | Находки          | Область                                                 | Риск    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------- | ------- |
| P1   | Удалить мёртвое Nest-наследие (10 файлов, `MergeUsersResultEntity`, `GetImageQueryDTO`) + переименовать `like/entities/like.entity.ts`            | B-03             | `modules/`, `enums/`                                    | low     |
| P1   | Один путь удаления записи + интеграционный тест «suggestion с рейтингом»                                                                          | B-09             | `modules/{record,suggestion}`                           | med     |
| P2   | Канонизировать ошибки: доменный код + таблица статусов; убить `HttpException`/`HttpStatus` и generic `Error` на клиентских ветках                 | B-01             | `utils/errors.ts`, `gateway/errors.ts`, `modules/`      | med     |
| P2   | Хелперы обвязки роутов: `withRateLimit`, `requireAdmin`, `catalogModels`, ключи лимита из path; preset по методу; убрать мёртвые recordEnumModels | B-07, B-16, B-17 | `gateway/*`                                             | low-med |
| P3   | Enum'ы из `@gmdb/contract` в TypeBox (`enumUnion`) + type-level сверка с `pgEnum`                                                                 | B-13             | `gateway/models.ts`, `gateway/{wordle,cocktails}.ts`    | med     |
| P3   | `RatingService` без прямого SQL: методы в `DrizzleRatingRepository`                                                                               | B-10             | `modules/rating`                                        | med     |
| P4   | Решить судьбу wiring (явный `toDto` или удаление `wiring/`), вынести форматирование дат из `queue.service`                                        | B-05, B-06       | `server/wiring/`, `gateway/`                            | med     |
| P5   | Lifecycle-реестр: `register(service)`, `DrizzleService` через хуки, `clearInterval` в погоде                                                      | B-08             | `server/container.ts`, `modules/weather`                | med     |
| P5   | `Logger`-фасад с уровнями, запрет `console.*` вне `main.ts`; env только через `utils/enviroments.ts`                                              | B-14, B-15       | `utils/`, `gateway/`, `server/`                         | low     |
| P6   | Вычистить `api-types.ts`; один `secretsMatch`; `CocktailCatalog` — в `cocktail.types.ts`                                                          | B-04, B-12       | `api-types.ts`, `utils/`, `modules/{telegram,cocktail}` | low     |
| P7   | Свести class-DTO модулей к доменным типам из `entities/*` (по домену, батчами)                                                                    | B-02, B-11       | `modules/`                                              | med     |

## 6. Что не трогать

- **`gateway/index.ts` (`onError`) и `server/http.ts` (`apiNotFound`, sitemap, SPA-фолбэк)** — внешний контракт ошибок и
  раздачи; менять только вместе с фронтом/`parseApiError`.
- **`server/page-meta.ts`** — дублирует пути фронт-роутера осознанно (SPA-оболочка + `index.html` для Vite);
  реестр `PAGES` — единственный источник canonical/JSON-LD. Не «оптимизировать» в общий роутер.
- **`gateway/auth*` (JWT, cookie `token`, OAuth-state/PKCE, Telegram Mini App)** — зона осторожности из README кампании.
- **`gateway/ws.ts` + `utils/domain-events.ts` + `contract/src/ws.ts`** — WS-протокол (`{event,payload}`, одна комната);
  реэкспорт контракта в `modules/websocket` — намеренный фасад.
- **`utils/rate-limit.ts`** (Lua fixed-window, fail-open, 250 мс) и `utils/security-headers.ts` — механизмы с тестами.
- **Имена `enviroments.ts` / `suggesttion.dto.ts`** — не переименовывать без полного обновления импортов
  (для `suggesttion` файл уходит по B-03, но не отдельным переименованием).
- **`__integration__/**` с `as unknown as DrizzleService`** — тестовый каркас, не продовый код.
