# Ревью батча 20 (B-12: record + steam) — `a457e45` → **APPROVE**

|                  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`; ревью — на detached `a457e45` (родитель `6486c0f`), основной чекаут за время ревью ушёл на `38f9d6a`                                                                                                                                                                                                                                                                                                                                                                         |
| Коммит           | `a457e45` — `refactor(backend): record и steam — доменные типы вместо class-DTO`; 6 файлов, +30/−100                                                                                                                                                                                                                                                                                                                                                                                               |
| Ревьюер          | `review-batch20` (не автор; только diff, изолированный worktree и собственные прогоны/мутации)                                                                                                                                                                                                                                                                                                                                                                                                     |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Что сделано мной | работал в `/tmp/review-b20` (`git worktree add --detach a457e45`, `bun install --frozen-lockfile`, `backend/.env` скопирован из основного чекаута). Dev-postgres на момент ревью был не поднят (порт 5432 закрыт), поэтому интеграция шла на одноразовом контейнере `postgres:17` (тот же `le_xot`/`abc`), БД `lists_test` создана `setup-db.ts`; контейнер после прогонов удалён. Все мутации откачены, worktree удалён. В основном дереве создан только этот отчёт; код не менялся, коммитов нет |
| Не запускалось   | Playwright e2e и `docker build` — вне предмета батча (типы и домен, HTTP не менялся)                                                                                                                                                                                                                                                                                                                                                                                                               |

## Вердикт

**APPROVE.** Блокеров нет.

Внешние контракты не тронуты: diff не касается `gateway/`, `server/`, `contract/`, `database/` и
`frontend/` — TypeBox-модели, роуты, ответы, WS-события и 404 остались байт-в-байт прежними.
Удалены ровно те декоративные классы, которые никто не инстанцировал; заменяющие доменные типы
структурно совпадают по полям и опциональности, а `UpdateRecordData` существовал и до батча и
является надмножеством старого `RecordUpdateDTO` без единого нового обязательного поля. Wiring
по-прежнему передаёт только те поля, которые потребитель ждёт (`catalog.ts:29-42`,
`integrations.ts:71-93`) — скрытого расширения нет. Канон защищён машинно: обе канонические
мутации (переименование поля во входном и выходном порте) ломают typecheck в wiring-адаптерах,
то есть порт не может разойтись с доменом. Прогоны кампании зелёные, включая интеграцию на
Postgres. Ниже — три не блокера (док-хвосты, микро-SSOT-нит, остаток B-12 в `record.entity.ts`).

### Блокеры

Нет.

### Не блокеры

- **N1. Док-хвосты и неточность сообщения коммита (не код).** Рекон-карты всё ещё ссылаются на
  удалённый файл: `docs/refactor/maps/backend.md:127`, `docs/refactor/maps/hygiene.md:163,295` —
  это ожидаемая усталость снимка (G-04 «полная синхронизация карт» в пуле), код не затронут.
  В сообщении коммита «остались `wordle/*.dto.ts` — следующий батч» пропущен
  `backend/src/modules/img/img.dto.ts`: на `a457e45` остаются ещё `img.dto.ts`,
  `wordle.dto.ts`, `wordle-notification.dto.ts` (img удалён позже в `90e4676`). Только текст
  коммита, на поведение не влияет.
- **N2. Микро-нит SSOT: `CreateRecordFromLinkInput` дублирует три поля `CreateRecordData`.**
  `record-domain.entity.ts:5-9` повторяет `link`/`status`/`type` из `CreateRecordData:11-20`.
  В кампании уже есть прецедент `Pick<…>` (`websocket.events.ts:7`,
  `drizzle-wordle.repository.ts:12`), так что `Pick<CreateRecordData, 'link' | 'status' | 'type'>`
  выразил бы «вход из ссылки — подмножество полного create» без второго списка полей. Сегодня
  расхождение невозможно молча: обе формы проверяются typecheck'ом на wiring. Это не дефект
  батча (старый DTO был отдельным классом точно так же), а кандидат на микро-уборку.
- **N3. Остаток B-12: `record.entity.ts` — Nest-эпоха, но вне диффа.** Сервис всё ещё
  аннотируется классом `RecordEntity` (`record.service.ts:12,76,99`), а `SuggestionOwnershipEntity`
  из того же файла вообще никем не импортируется, кроме самого файла (`grep` по `backend/src` —
  0 внешних ссылок). Ни `new RecordEntity(…)`, ни `new SuggestionOwnershipEntity(…)` в коде нет
  (`grep` — 0 совпадений), то есть это такие же декоративные классы, просто не `*.dto.ts`.
  Orphan-guard их не ловит: он проверяет файлы, а `record.entity.ts` импортируется.
  Задача B-12 в `tasks.md` описывает и `*.entity.ts` Nest-эпохи, поэтому это честный кандидат
  на следующий батч, а не регрессия этого диффа.

## Что в коммите

`a457e45` (6 файлов, +30/−100), родитель `6486c0f`:

- `modules/record/entities/record-domain.entity.ts` (+6): новый `CreateRecordFromLinkInput`
  (`link: string`, `status?`, `type?`), строки 5–9.
- `modules/record/record.dto.ts` (−50): удалён целиком — `RecordCreateFromLinkDTO`,
  `RecordUpdateDTO`, `RecordUpdatePosterDTO`, `RecordGetDTO`, `GetAllRecordsDTO`.
- `modules/record/record.service.ts` (−3/+4): только импорт и две аннотации —
  `createRecordFromLink(data: CreateRecordFromLinkInput)` (:76),
  `patchRecord(id, data: UpdateRecordData)` (:99). Тела методов не тронуты.
- `modules/steam/steam.dto.ts` (−44): удалён целиком — `SteamGameDto`, `SteamImportGameDto`,
  `SteamImportDTO`, `SteamGamesResponseDTO`, `SteamImportFailureDto`, `SteamImportResultDTO`.
- `modules/steam/steam.entity.ts` (новый, +17): `SteamGame` (:4-10), `SteamImportGame` (:13-17).
- `modules/steam/steam.service.ts` (−2/+2): импорт и две аннотации — `getOwnedGames(): Promise<SteamGame[]>`
  (:33), `importGames(games: SteamImportGame[], …)` (:92-95). Логика не тронута.

`git diff a457e45^..a457e45 -- backend/src/gateway backend/src/server contract database frontend`
— пусто.

## 1. Эквивалентность типов

Сверка с `git show a457e45^:backend/src/modules/record/record.dto.ts` и `…/steam/steam.dto.ts`:

| Старый DTO (родитель)                                                                | Новый доменный тип                       | Поля                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------- |
| `RecordCreateFromLinkDTO.link!: string`                                              | `CreateRecordFromLinkInput.link: string` | обязательно в обоих                                                     |
| `status?: RecordStatus = RecordStatus.QUEUE`                                         | `status?: RecordStatus`                  | опционально в обоих; тип чтения `RecordStatus \| undefined` одинаковый  |
| `type?: RecordType = RecordType.WRITTEN`                                             | `type?: RecordType`                      | опционально в обоих                                                     |
| `RecordUpdateDTO` (`status`, `grade?: \| null`, `episode`, `type`)                   | `UpdateRecordData` (строки 22–30)        | все 4 поля есть дословно, плюс опциональные `title`/`posterUrl`/`genre` |
| `SteamGameDto` (`appid`, `name`, `playtime_forever`, `header_image`, `img_icon_url`) | `SteamGame`                              | 1:1, все обязательные                                                   |
| `SteamImportGameDto` (`appId`, `status`, `grade?`)                                   | `SteamImportGame`                        | 1:1, `appId`/`status` обязательные, `grade?`                            |

Два важных доказательства, а не только глазами:

1. **Инициализаторы класса были мёртвым кодом.** `git grep -E 'new (RecordCreateFromLinkDTO|RecordUpdateDTO|RecordUpdatePosterDTO|RecordGetDTO|GetAllRecordsDTO|SteamGameDto|SteamImportGameDto|SteamImportDTO|SteamGamesResponseDTO|SteamImportResultDTO|SteamImportFailureDto)' a457e45^`
   — **0 совпадений**: ни один экземпляр не создавался, значит дефолты `QUEUE`/`WRITTEN` из полей
   класса в рантайме не применялись никогда. Дефолты жили в самом сервисе и остались там же:
   `record.service.ts:84-85` (`data.status || RecordStatus.QUEUE`, `data.type || RecordType.WRITTEN`)
   — эти строки в диффе отсутствуют.
2. **`UpdateRecordData` не расширялся этим коммитом и не требует ничего нового.** На родителе
   (`a457e45^`) интерфейс уже был точно таким же (`title?`, `posterUrl?`, `genre?`, `status?`,
   `type?`, `grade?: RecordGrade | null`, `episode?`) — коммит лишь добавил `CreateRecordFromLinkInput`
   выше по файлу. Старый `RecordUpdateDTO` — строгое подмножество: `{}`-совместимость в обе стороны
   для 4 общих полей, обязательных полей ноль, `grade` сохранил `| null`.

## 2. Совместимость с портами (скрытого расширения нет)

Порты гейтвея (`gateway/records.ts:91-106`, `gateway/steam.ts:50-77`) и wiring не менялись.
Адаптеры мапят явно и передают ровно ожидаемое:

- `wiring/catalog.ts:29-34` — `createFromLink`: `{ link, ...(status ? {status} : {}), ...(type ? {type} : {}) }`;
- `wiring/catalog.ts:36-42` — `patch`: только `status`/`grade`/`episode`/`type`;
- `wiring/integrations.ts:71-93` — Steam: `games` пробрасываются как есть (выходной порт),
  `importGames` мапит `appId`/`status`/`grade` и **отфильтровывает `null`** для `grade`
  (`game.grade !== undefined && game.grade !== null`), поэтому `SteamImportGame.grade?: RecordGrade`
  без `| null` не ломает `exactOptionalPropertyTypes: true`.

Скрытого расширения нет: `genre`/`title`/`posterUrl` из широкого `UpdateRecordData` в patch-порт
не попадают: адаптер собирает объект из четырёх полей, и repository.update получает ровно его. Обратное направление (порт → домен) проверено мутациями ниже.

## 3. Поведение

Тела `createRecordFromLink`/`patchRecord`/`getOwnedGames`/`importGames` в диффе отсутствуют —
изменились только сигнатуры. Как следствие сохраняются:

- дефолты `QUEUE`+`WRITTEN` и эмиты `update-queue`/`update-suggestions` при создании
  (`record.service.ts:84-92`);
- `NotFoundError('Record not found')` при отсутствии записи (`record.service.ts:103`) — строка и
  класс не менялись; прочие 404 в файле (:132, :151, :202, :205) тоже;
- условные эмиты `update-suggestions`/`update-queue`/`update-records` в `patchRecord`
  (`record.service.ts:107-123`) — не тронуты;
- импорт Steam: дубликаты, IGDB→Steam-фолбэк, `extra.steamAppId`, `grade`, `update-records` —
  `steam.service.ts:92-167` (тело `importGames`) не менялся.

Юнит-тесты на эти пути остались зелёными без правок (дифф спек не касается):
`record.service.spec.ts` — «creates a record and emits update-queue event for QUEUE+WRITTEN»,
«emits update-suggestions…», «throws NotFoundError…», «updates record and always emits
update-records»; `steam.service.spec.ts` — 7 сценариев импорта. Фокусный прогон
`bun test src/modules/record src/modules/steam src/gateway/__tests__/media-steam.spec.ts` — 77 pass.

## 4. Wire-форма

`git diff --stat a457e45^..a457e45` содержит только 6 перечисленных файлов. Значит:

- TypeBox-модели `RecordCreateFromLinkDTO`/`RecordUpdateDTO`/`SteamGamesResponseDTO`/
  `SteamImportDTO`/`SteamImportResultDTO` (`gateway/records.ts:63-84`, `gateway/steam.ts:14-48`)
  не менялись — серверная валидация и сериализация ответов прежние;
- `api-types.ts` не менялся, а фронт берёт `RecordUpdateDTO`/`SteamGameDto` именно оттуда
  (`frontend/src/lib/api.ts` → `@backend/api-types`), поэтому Eden-типы фронта не сдвинулись;
- `frontend:typecheck` зелёный — косвенное подтверждение, что форма ответов для клиента та же.

## 5. Мёртвый код

- Ссылок на удалённые файлы не осталось: `git grep 'record\.dto\|steam\.dto' HEAD` по
  `backend/src` — **0**; по репозиторию вне `docs/refactor/maps` — **0** (только рекон-карты, N1).
- Все имена из удалённых файлов имели либо только внутрифайловых потребителей, либо одноимённые
  **TypeBox**-модели в гейтвее (`recordModels`/`steamModels`) — это отдельные модели, не классы;
  `api-types.ts` реэкспортирует типы из гейтвея, а не из модулей.
- Orphan-guard (`backend/src/__tests__/architecture.spec.ts:66-85`) зелёный — 4 pass, включая
  «не содержит файлов без импортёров»; новый `steam.entity.ts` импортируется сервисом.
- Новых `any`, `as unknown`, `@ts-*`, `eslint-disable` в диффе нет (грепом по добавленным
  строкам — пусто). `CreateRecordFromLinkInput` импортируется обычным value-импортом, как уже
  импортировались соседние доменные типы в этом файле — это существующий стиль файла, не каст.

## 6. Прогоны

| Команда (в `/tmp/review-b20`)                                                                  | Результат                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `bun lint`                                                                                     | 0 warnings / 0 errors, 443 файла                                                |
| `bun format:check`                                                                             | All matched files use the correct format, 651 файл                              |
| `bun typecheck`                                                                                | contract 7, database 41, backend 274 файла — 0 ошибок; frontend зелёный (4.6 s) |
| `cd backend && bun test`                                                                       | **715 pass / 0 fail**, 87 файлов (совпадает с сообщением коммита)               |
| `bun test src/modules/record src/modules/steam src/gateway/__tests__/media-steam.spec.ts`      | 77 pass / 0 fail, 5 файлов                                                      |
| `bun test src/gateway`                                                                         | 173 pass / 0 fail, 20 файлов                                                    |
| `bun test src/__tests__/architecture.spec.ts`                                                  | 4 pass / 0 fail                                                                 |
| `setup-db.ts` + `RUN_DB_TESTS=1 TEST_DATASOURCE_URL=…/lists_test bun test src/__integration__` | setup-db ✅; **62 pass / 0 fail**, 13 файлов                                    |

## 7. Мутационные проверки (ловушка на канон)

Обе мутации внесены в `/tmp/review-b20`, прогнан `bun check -b` (backend), затем файл восстановлен
через `git checkout`/бэкап; `git status` после откатов чистый.

1. **Входной порт: `CreateRecordFromLinkInput.link` → `url`** (только строка 6, `CreateRecordData`
   не трогал). Typecheck падает **ровно в адаптере wiring**, то есть порт не может молча
   разойтись с доменом:

   ```
   src/modules/record/record.service.ts(77,60): error TS2339: Property 'link' does not exist on type 'CreateRecordFromLinkInput'.
   src/modules/record/record.service.ts(79,18): error TS2339: Property 'link' does not exist on type 'CreateRecordFromLinkInput'.
   src/server/wiring/catalog.ts(31,11): error TS2353: Object literal may only specify known properties, and 'link' does not exist in type 'CreateRecordFromLinkInput'.
   Found 3 errors in 2 files
   ```

2. **Выходной порт: `SteamGame.appid` → `appId`** (только interface, маппинг сервиса не трогал).
   Падает и сам сервис, и `SteamGamesPage`-порт в wiring:

   ```
   src/modules/steam/steam.service.ts(53,5): error TS2322: Type '{ appid: number; … }[]' is not assignable to type 'SteamGame[]'.
   src/server/wiring/integrations.ts(72,7): error TS2322: Type '() => Promise<{ games: SteamGame[]; … }>' is not assignable to type '() => Promise<SteamGamesPage>'.
   src/server/wiring/integrations.ts(81,49): error TS2741: Property 'appid' is missing …
   src/server/wiring/integrations.ts(82,40): error TS2551: Property 'appid' does not exist on type 'SteamGame'. Did you mean 'appId'?
   Found 4 errors in 2 files
   ```

Вывод: канонические мутации ловятся на границе «домен ↔ порт», отдельный type-level тест не
требуется; это и есть машинная ловушка для батча (DoD «на новый канон есть тест» выполнен
структурно — typecheck wiring-адаптеров).

## Итог

APPROVE. Заявленное удаление выполнено полностью и без остатков: `record.dto.ts`/`steam.dto.ts`
удалены, заменяющие доменные типы эквивалентны прежним DTO по полям/опциональности, runtime-дефолты
и раньше жили в сервисе, порты и wiring не расширялись, wire-форма не изменилась, все прогоны
кампании и интеграция на Postgres зелёные, мутации доказывают, что typecheck держит границу.
Остатки — только док-хвосты и соседний Nest-эпоха-код, вне предмета коммита.
