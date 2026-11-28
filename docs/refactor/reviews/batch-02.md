# Ревью батча B-02 — `129d6e0` → **CHANGES REQUIRED**

|                  |                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                            |
| Коммит           | `129d6e0` (родитель — `a4ea142`)                                                |
| Ревьюер          | `review-batch2` (не автор коммита; только diff, репозиторий и прогоны)          |
| Дата             | 2026-11-28                                                                      |
| Что сделано мной | исходники не менялись, коммитов нет; единственный созданный файл — этот отчёт   |
| Не запускалось   | backend integration (Postgres), Playwright e2e — нужны стенды, вне списка ревью |

## Вердикт

**CHANGES REQUIRED.** Один дефект в заявленном пункте 4: `backend/src/api-types.ts`
сужен до **22** имён, а не 21, и одно из них — `UserCustomizationEntity`
(`backend/src/api-types.ts:12`) — не импортируется ниоткуда ни на HEAD, ни на родителе.
Это прямо противоречит новой шапке файла (строки 8-9: «только имена, которые фронт реально
импортирует») и числам в теле коммита («47 → 21», «удалены 26 имён»). Удаление одной строки
приводит счётчики в точное соответствие: 47 − 26 = 21. Второе (не блокирует код) — сообщение
коммита не упоминает удаление `ui/slider` (2 файла) и область `frontend`/`docs`.

Вся остальная часть батча чистая: 10 backend-файлов действительно не имели импортёров,
`GetImageQueryDTO`/`MergeUsersResultEntity` удалены безопасно, `UserEntity` цел, rename
дотянут, slider удалён без потребителей, docs-техдолг снят. Все прогоны зелёные, внешние
контракты не затронуты. После правки одной строки и уточнения сообщения — **APPROVE**.

## Что в коммите

20 файлов, +11/−262 (`git show --shortstat 129d6e0`):

- удалено 12 файлов: 10 backend (`enums/enums.names.ts`, `auth/dto/*.dto.ts` ×3,
  `like/like.dto.ts`, `rating/{rating.dto,rating.entity}.ts`, `suggestion/suggesttion.dto.ts`,
  `user/{user.dto.ts,entities/user-account.entity.ts}`) + `frontend/src/components/ui/slider/{Slider.vue,index.ts}`;
- частичные удаления: `modules/img/img.dto.ts` (`GetImageQueryDTO`), `modules/user/user.entity.ts`
  (`MergeUsersResultEntity`), `backend/src/api-types.ts` (25 алиасов);
- rename: `modules/like/entities/like.entity.ts` → `like-domain.entity.ts` + импорт в
  `drizzle-like.repository.ts`;
- docs: `AGENTS.md` (1 строка), `TODO.md` (2), `backend/src/modules/AGENTS.md` (2).

Полный diff просмотрен, посторонних правок нет, `git show --check 129d6e0` чист.

## Прогоны

| Проверка                       | Результат                                                                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors. Finished in 309ms on 436 files with 95 rules`. Было 448 файлов на батче 1: ровно −12 = число удалённых файлов.                |
| `bun format:check`             | exit 0 — `All matched files use the correct format`, 609 файлов. Рабочее дерево чистое (`git status` пуст), т.е. это результат на самом коммите, а не на грязных docs. |
| `bun typecheck`                | exit 0 — contract 7 файлов, database 41, backend **267** (было 277 → ровно −10 backend-файлов), frontend 2.86 s; ошибок нет.                                           |
| `cd backend && bun test`       | exit 0 — **646 pass / 0 fail**, 79 файлов, 36 187 `expect` (baseline из `progress.md`: 646/79).                                                                        |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect` (baseline: 126/21).                                                                                              |
| `cd frontend && bun run build` | exit 0 — `build:types` (vue-tsc) Done 2.83 s, `build:ci` (vite 8.3.5) `✓ built in 975ms`.                                                                              |
| `cd backend && bun run build`  | exit 0 — это `bun check -b`: `✓ No type errors in 267 files`; отдельного бандла у backend нет.                                                                         |
| `git show --check 129d6e0`     | чисто (whitespace-ошибок нет).                                                                                                                                         |

Интеграционные (Postgres) и e2e (Playwright) не поднимались — как и на батче 1, нужны стенды.

## Пункт 1. 10 backend-файлов без импортёров

**Проверено.** На родителе `a4ea142` repo-wide поиск (без `docs/refactor`) по всем удалённым
путям не находит ни одного импорт-спецификатора:

```
git grep -nE "callback\.dto|success-response\.dto|update-nickname\.dto|like\.dto|\
rating\.dto|rating\.entity|suggesttion\.dto|user\.dto|user-account\.entity|enums\.names" \
  a4ea142 -- . ':!docs/refactor'
→ только AGENTS.md:87, TODO.md:32, backend/src/modules/AGENTS.md:29,70 (техдолг про suggesttion)
```

Т.е. ни `from '…/callback.dto'`, ни side-effect/dynamic-импортов, ни упоминаний в тестах
(`__tests__`, `__integration__`), e2e или конфигах. Дополнительно:

- `backend/src/modules/auth/dto/` содержал ровно эти 3 файла, barrel/`index.ts` не было —
  директория исчезла целиком (`git ls-tree a4ea142 backend/src/modules/auth/dto/`).
- `enums.names.ts` не ре-экспортировался из `backend/src/enums/index.ts` (там только 8
  `*.enum.ts`), так что surface барреля не изменился.
- Имена из удалённых классов (`CallbackDto`, `SuccessResponseDTO`, `UpdateNicknameDTO`,
  `LikeCreateDTO`, `RatingUpsertDTO`, `MergeUsersDto`, `UserSuggestionResponseDTO` …) остались
  только как **имена TypeBox-моделей** в гейтвеях — это независимые рантайм-схемы:
  `gateway/auth-oauth.ts:24`, `gateway/models.ts:54`, `gateway/auth-session.ts:23`,
  `gateway/ratings.ts:48`, `gateway/users.ts:31,34`, `gateway/suggestions.ts:24`. Удалённые
  Nest-классы их не импортировали и никем не импортировались.

**Риск: none.** Подтверждается `git grep` на родителе, зелёными typecheck/тестами и тем, что
`noUnusedLocals`/`include: src` у backend не нашли висячих ссылок.

## Пункт 2. `GetImageQueryDTO` и `MergeUsersResultEntity`

**Проверено.** `GetImageQueryDTO` на HEAD не встречается нигде, кроме recon-карт
(`docs/refactor/maps/*`); живой `ImgVariant` остался и используется
(`modules/img/img.service.ts:8,22-24`, `modules/img/__tests__/img.service.spec.ts`), тесты
backend зелёные.

`MergeUsersResultEntity` — это три разных сущности с совпавшим именем, и удалена ровно мёртвая:

| Где                                 | Что это                                                                                          | Статус                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `modules/user/user.entity.ts:25-43` | Nest-era класс с `Partial<>`-конструктором, 0 импортёров на `a4ea142`                            | **удалён**                                    |
| `gateway/users.ts:34` (и `:185`)    | TypeBox-модель `MergeUsersResultEntity` — рантайм-схема ответа `POST /users/:id/merge`           | живёт, к удалённому классу отношения не имеет |
| `api-types.ts:20`                   | алиас `MergeResult as MergeUsersResultEntity` — статический тип интерфейса `gateway/users.ts:57` | живёт, нужен фронту                           |

Потребитель фронта: `frontend/src/pages/admin/composables/use-merge-accounts.ts:6` импортирует
`MergeUsersResultEntity` из `@/lib/api`, использует в `:84` и читает ровно те же 9 полей
(`data.accountsDropped`, `likesDropped`, `ratingsDropped`, `wordleGamesDropped`, `:96-98`).
Интерфейс `MergeResult` (`gateway/users.ts:57-66`) по полям идентичен TypeBox-модели — гейтвей
возвращает `users.merge(...)` (тип `MergeResult`), схема ответа валидирует те же 9 чисел,
`vue-tsc` подтверждает совместимость.

`UserEntity` после удаления соседнего класса цел: `modules/user/user.entity.ts:3-23` — те же
9 полей и конструктор `Partial<UserEntity>` на месте; потребители
`modules/like/like.entity.ts:1` и `modules/record/record.entity.ts:3` типизируются (backend
typecheck 267 файлов, 0 ошибок; 646 тестов).

## Пункт 3. Rename `like.entity.ts` → `like-domain.entity.ts`

**Проверено.** `git show 129d6e0` — rename 100% similarity, содержимое не менялось:
`export type LikeDomain = SelectRow<'likes'>`. На HEAD старый путь не упоминается нигде
(`git grep "entities/like.entity"` → пусто); новый путь — только
`modules/like/repositories/drizzle-like.repository.ts:5`, и `LikeDomain` используется в 5
сигнатурах репозитория (плюс импорт). Отдельный `modules/like/like.entity.ts` (класс `LikeEntity`) — другой
файл, не тронут и по-прежнему импортируется из `record.entity.ts:2`; путаницы нет, как и
заявлено в сообщении.

## Пункт 4. `api-types.ts`: 47 → 22 (заявлено 21)

Точный set-diff (`a4ea142` → HEAD, по именам, не по строкам):

- было **47**, стало **22**;
- удалено **25**, добавлено 0;
- ни один из 25 удалённых не импортируется из `@/lib/api` (парсер всех импорт-стейтментов
  `frontend/src` + `frontend/e2e`, 37 имён); в `frontend` лексически совпадает только имя
  Vue-компонента `WordleStats` (см. ниже), в `backend` — одноимённые TypeBox-модели/интерфейсы
  гейтвея, не связанные с алиасами.

Удалены: `SuggestionOwnershipEntity`, `Like`, `GetLikesByIdDTO`, `Friends`,
`UserRatedRecordEntity`, `Rating`, `Queue`, `QueueItem`, `GenreGradeCountDTO`,
`GenreStatusCountDTO`, `GradeCountDTO`, `RecordsStats`, `WeatherResponse`, `WordleLeaderboard`,
`WordlePracticeState`, `WordleState`, `WordleStats`, `WordleNotificationLink`,
`WordleNotificationsStatusDTO`, `RecordCreateFromLinkDTO`, `RecordUpdatePosterDTO`,
`RatingUpsertDTO`, `MergeUsersDto`, `UserSuggestionDTO`, `WordleNotificationsUpdateDTO`.

Одноимённые совпадения — не алиасы `api-types`: `Like`/`Rating`/`Friends`/`Queue` живут в
`gateway/*` (TypeBox-модели `Queue`/`QueueItem`, `Like`/`Rating`/`Friends` — производные от
моделей типы); `WordleStats` во фронте — это компонент
`frontend/src/pages/wordle/components/WordleSidePanel.vue:9`, импортируемый из `.vue`-пути, а не
из `@/lib/api`; `SuggestionOwnershipEntity` остался классом в `record.entity.ts:5` и TypeBox-моделью
`gateway/records.ts:27`.

Оставшиеся 22 имени и их реальные потребители (все — `import … from '@/lib/api'`; при
`noUnusedLocals: true` — `frontend/tsconfig.json:14` — импорт без использования не прошёл бы
typecheck):

| Имя                              | Потребитель (первое вхождение)                                              |
| -------------------------------- | --------------------------------------------------------------------------- |
| `UserEntity`                     | `frontend/src/components/account/AccountCustomization.vue:11`               |
| `UserCustomizationEntity`        | **нет потребителей** (repo-wide grep — только объявление `api-types.ts:12`) |
| `RecordEntity`                   | `frontend/src/components/media/DataCards.vue:8`                             |
| `GetAllRecordsDTO`               | `frontend/src/composables/factories/create-records-store.ts:4`              |
| `GetUserRatingsEntity`           | `frontend/src/pages/ratings/composables/use-user-ratings.ts:14`             |
| `GenreCountDTO`                  | `frontend/src/pages/stats/components/StatsGenreDonut.vue:12`                |
| `StatusCountDTO`                 | `frontend/src/pages/stats/components/StatsSummaryCards.vue:4`               |
| `MergeUsersResultEntity`         | `frontend/src/pages/admin/composables/use-merge-accounts.ts:6`              |
| `UserAccountEntity`              | `frontend/src/components/account/ConnectedAccounts.vue:12`                  |
| `SteamGameDto`                   | `frontend/src/pages/admin/composables/use-steam-sync.ts:7`                  |
| `FriendsMemberEntity`            | `frontend/src/pages/friends/FriendsPage.vue:24`                             |
| `RecordUpdateDTO`                | `frontend/src/components/media/DataCards.vue:8`                             |
| `WordleLeaderboardDTO`           | `frontend/src/pages/wordle/components/WordleLeaderboardList.vue:7`          |
| `WordlePracticeStateDTO`         | `frontend/src/pages/wordle/composables/use-wordle.ts:22`                    |
| `WordleNotificationStatus`       | `frontend/src/components/account/AccountNotifications.vue:9`                |
| `WordleStateDTO`                 | `frontend/src/pages/wordle/composables/use-wordle-share.ts:6`               |
| `WordleStatsDTO`                 | `frontend/src/pages/wordle/composables/use-wordle.ts:24`                    |
| `RecordsStatsDTO`                | `frontend/src/pages/stats/composables/use-stats.ts:8`                       |
| `WordleHistoryDayDTO`            | `frontend/src/pages/wordle/components/WordleActivityWeek.vue:3`             |
| `WordleGuessStateDTO`            | `frontend/src/pages/wordle/components/WordleBoard.vue:9`                    |
| `WordleLeaderboardEntryDTO`      | `frontend/src/pages/wordle/components/WordleLeaderboardList.vue:7`          |
| `WordleDailyLeaderboardEntryDTO` | `frontend/src/pages/wordle/components/WordleDailyLeaderboardRow.vue:8`      |

Итого: **21 с потребителем, 1 без** (колонка `UserCustomizationEntity`). Разбор способов
доступа:

- `frontend/src/lib/api.ts:6-7` — `export * from '@gmdb/contract'` + `export type * from
  '@backend/api-types'`; конфликтов имён между пакетами нет (typecheck зелёный);
- других импортов `@backend/api-types` нет — только `frontend/src/lib/api.ts:7` (grep по
  `frontend`, `backend`, `e2e`; упоминания в `AGENTS.md`/`frontend/src/AGENTS.md` — текст правил);
- ре-экспортов `@/lib/api` нет (`frontend/src/stores/use-api.ts` возвращает клиент, ничего не
  ре-экспортирует), namespace/default-импортов и `import('@/lib/api')`/`require` нет;
  разбор всех импорт-стейтментов даёт 37 имён, среди них все 21 оставшийся алиас и ни одного
  удалённого.

**Проблема:** строка `backend/src/api-types.ts:12` противоречит шапке (`:8-9`) и телу коммита.
См. проблему №1.

## Пункт 5. `frontend/src/components/ui/slider/*`

**Проверено.** На родителе единственное упоминание — сам баррель
(`ui/slider/index.ts:1` → `Slider.vue`); вне этой папки потребителей нет (grep `Slider`:
только иконка `SlidersHorizontal` в `FilterStatus.vue:2,29`, не компонент). На HEAD —
ни одного `slider`-импорта, `frontend/src/components/ui` содержит 18 примитивов без `slider`.
`frontend/components.json` — только `$schema`/style/aliases (`:13-19`) и `registries` (`:20`),
списка компонентов там нет, так что shadcn-CLI/конфиг не завязан на наличие файла.
`reka-ui` по-прежнему используется 55 файлами, зависимость не стала мёртвой. `bun run build`
и `vue-tsc` зелёные.

## Пункт 6. Docs

- `AGENTS.md:87` (`suggesttion.dto.ts` typo) удалён; `TODO.md` — техдолг удалён;
  `backend/src/modules/AGENTS.md` — строка таблицы и bullet `Typo Fixes` удалены.
  В отслеживаемом коде/тестах/AGENTS/TODO (`git grep -- . ':!docs/refactor'`) слово
  `suggesttion` не встречается; остались только recon-карты и этот отчёт.
- Recon-карты теперь устарели (см. проблему №3): `maps/backend.md:57,63,68,135-141,318,340-341`,
  `maps/hygiene.md:14,60-69,87,119,159,262-263,282,290`, `maps/frontend.md:251-256`,
  `maps/contract-data-config.md:31,262` описывают удалённые файлы как существующие/мёртвые.
  По `docs/refactor/README.md:58` карты обновляются при закрытии батча — это отдельный docs-коммит
  после ревью (прецедент — `a4ea142` для батча 1), поэтому не блокер, но пункт DoD
  `README.md:52` пока не закрыт. Аналогично `tasks.md:23` (B-02 всё ещё в пуле, без строки «Батчи в работе»/done со ссылками)
  и `progress.md` (нет раунда 2).

## Сообщение коммита

- Заголовок `refactor(backend): удалить мёртвое Nest-наследие и сузить api-types` и 5 bullet'ов
  точно описывают 18 из 20 файлов; `git show --check` чист, случайных правок нет.
- **Неточно:** «сужен с 47 до 21 имени… удалены 26 имён» — фактически 22 имени и 25 удалённых
  (лишнее — `UserCustomizationEntity`, см. проблему №1). Счётчики в теле согласованы между собой
  (47 − 26 = 21) и становятся верными после удаления этой строки — похоже на забытую правку,
  а не на осознанное решение.
- **Не упомянуто:** удаление `frontend/src/components/ui/slider/{Slider.vue,index.ts}` (2 файла)
  в теле отсутствует, хотя входит в diff; область `backend` в заголовке при этом не покрывает
  `frontend` и `docs` (та же стилевая мелочь, что отмечалась на батче 1).

## Найденные проблемы

### 1. MEDIUM / блокирует пункт 4 — мёртвый алиас `UserCustomizationEntity`

`backend/src/api-types.ts:12`:

```ts
export type { GatewayCustomization as UserCustomizationEntity } from '@backend/gateway/auth-session'
```

Repo-wide grep: единственное вхождение — само объявление; ни на HEAD, ни на `a4ea142` нет
импортёров (фронт берёт `state.unlockedAvatarFrameIds` из `api.auth.me.customization.get()` и
`props.user: UserEntity` — всё выводится Eden'ом, имя-алиас не используется). Шапка файла (`:8-9`) заявляет «только имена, которые фронт реально импортирует», тело
коммита — «47 → 21 / 26 удалённых», правило кампании 6 (deletion test) — «оставлять на всякий
случай запрещено». **Фикс:** удалить строку 12; после этого set-diff = 26 удалённых / 21
оставшееся, числа в сообщении станут верными. (Альтернатива — если алиас зачем-то нужен:
обновить шапку и тело коммита, обосновав исключение; но потребителя нет.)

### 2. MINOR — сообщение коммита не покрывает frontend-часть

Тело не упоминает удаление `ui/slider` (2 файла из 20), заголовок — `refactor(backend)`, хотя
затронуты `frontend` и три docs-файла. **Фикс:** если ветку ещё можно переписать — добавить
bullet «удалён мёртвый `ui/slider` (нет потребителей)» и области `frontend/docs`; иначе
зафиксировать факт в `progress.md` (раунд 2), чтобы `git log` не терял удаление.

### 3. PROCESS / follow-up — карты, задачи и журнал не обновлены

DoD (`docs/refactor/README.md:49-52`) требует «задачи, карты и ADR обновлены», карты
обновляются при закрытии батча (`:58`). Сейчас `maps/*` (строки выше) и `tasks.md:23` описывают
удалённое как живое, `progress.md` заканчивается раундом 1. **Фикс:** отдельным docs-коммитом
(как `a4ea142` после батча 1) перенести B-02 в done со ссылкой на `129d6e0`/этот отчёт,
поправить разделы карт и добавить раунд 2; затем `bun fmt` + `bun format:check`.

### 4. PROCESS / follow-up — ловушка от регрессии ещё не поставлена

Правило 5 требует enforceable-защиту; для удаления мёртвого кода это G-01 («CI: нет `.ts` без
импортёров», `tasks.md:54`, Deps — как раз B-02). В батче её нет, и вернуть мёртвый файл/алиас
по-прежнему ничто не мешает. Не блокер (G-01 — отдельная задача P2), но после B-02 она
разблокирована и должна быть следующей в очереди.

## Итог

Удаления, rename, `UserEntity`, slider и docs-часть подтверждены; внешние контракты
(HTTP/WS/cookie/схема БД/env) не затронуты — менялись только внутренние типы/импорты.
`lint`, `format:check`, `typecheck`, backend/frontend unit, frontend build и backend typecheck —
все зелёные; на родителе у удалённых файлов ноль импортёров. Блокирует приёмку один мёртвый
алиас (правка — одна строка) и неточность сообщения коммита. После удаления
`api-types.ts:12` и фикса bullet'а вердикт может быть поднят до **APPROVE**.
