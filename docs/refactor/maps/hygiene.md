# Гигиена кода — карта рекона

> **Снимок рекона (батчи 1–2).** Актуальное состояние — `tasks.md` и `progress.md`;
> часть находок уже закрыта (см. таблицу «Сделано»).

**Ветка / база:** `chore/code-cleanup` @ `e73dcfb` (master). **Дата:** 2026-11-28.
**Охват:** `backend/src` (241 модуль), `frontend/src` (274), `contract/src` (7), `database/src` (35) —
557 модулей, 1891 внутреннее ребро импорта; `.vue` — только `<script>`-блоки; комментарии вырезаны.
**Метод и оговорки** — §8. Репозиторий не менялся: создан только этот файл.

## 0. Сводка и приоритеты

| Метрика                                            | Значение                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Циклы импорта (SCC > 1)                            | **6**: 1 layout↔router (5 файлов), 1 store↔component, 4 shadcn-барреля                                     |
| Файлы без импортёров                               | **11** (10 реально мёртвых = 151 строка; 1 — manual-скрипт)                                                |
| Мёртвые frontend-файлы по reachability             | **+9** (7 баррелей + `ui/slider/*`)                                                                        |
| Экспорты без внешних потребителей                  | **237** в 104 файлах (211 «лишний export», 26 неиспользуемых символов)                                     |
| Дубли-ловушки                                      | **9 копий** rate-limit closure, **19** model-spread, **3** интерфейса Merge*, **3** карты жанровых лейблов |
| `as any` / `as unknown as` в prod                  | **0 / 1**; в тестах — **89 / 67**                                                                          |
| `@ts-ignore` / `@ts-expect-error` / eslint-disable | **0 / 3** (в type-check файлах) / **0**                                                                    |
| Файлы > 300 строк (без seed и тестов)              | **11**                                                                                                     |

**Топ-5 для параллельной разработки** (ранжировано по цене бездействия):

1. **Мёртвая Nest-era зона:** `backend/src/modules/*/{dto,entity}` и `auth/dto/*` — 10 файлов,
   151 строка, ноль импортов (§2.1). Агент, читающий `like.dto.ts`, не понимает, что это артефакт.
2. **Дубли-ловушки в гейтвее:** `limit`-closure копируется в каждый gateway (9 копий, две разные
   сигнатуры), 19 копий `...apiErrorModels`, 31 вызов `requireUser(await resolveUser(...))` (§3.1).
   Новая ручка = очередная копия; правка канона не доедет до 8 файлов.
3. **Типы-двойники между слоями:** `RecordEntity`, `UserEntity`, `RatingEntity`, `LikeEntity`,
   `SteamGameDto`, `QueueDto` определены по 2–3 раза с разными формами; `MergeResult` — три
   идентичных интерфейса (§3.3, §7.3). Это главный источник «поправил не тот тип».
4. **Фронт: карты отображения размазаны:** жанровые лейблы в 3 местах, статусы/оценки — в 2,
   route-names — в 2, пагинация стора — в 2 (§3.2). Плюс 237 «лишних export» — API-поверхность,
   по которой нельзя понять, что живое.
5. **Литералы вместо контракта:** `'USER'/'ADMIN'` в 9 gateway-файлах, значения enum'ов
   строкой в TypeBox (`gateway/models.ts:9–37` и др.), `maxMissing = 50` в двух местах (§6.3).
   Контракт есть, но 6 файлов его не используют.

## 1. Циклы импорта

| SCC | Цепочка (file:line → …)                                                                                                                                                       | Как рвать                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 5   | `components/layout/db/LayoutDatabase.vue:7` → `LayoutHeader.vue:5` → `NavItem.vue:6` → `router/router.ts:50` (dynamic `LayoutDatabase`) → (в SCC также `LayoutSidebar.vue:5`) | `NavItem` тащит `prefetchRouteChunks` из `router.ts:6`; вынести prefetch в `router/prefetch.ts` — цикл исчезает |
| 2   | `pages/suggestion/components/SuggestionForm.vue:9` → `composables/use-suggestion.ts:9` → (store кладёт `SuggestionForm` в `useDialog` на `:31`) → `SuggestionForm.vue`        | компонент передавать лениво (`markRaw` не нужен: достаточно `() => import` или регистрации в диалоге по имени)  |
| 2   | `ui/button/Button.vue:4` → `ui/button/index.ts:4` (`buttonVariants`/`ButtonVariants`) → `Button.vue`                                                                          | варианты вынести в `ui/button/variants.ts`, компонент импортирует его напрямую                                  |
| 2   | `ui/avatar/Avatar.vue:3` → `ui/avatar/index.ts:4` → `Avatar.vue`                                                                                                              | то же: `avatarVariants` из барреля → отдельный файл                                                             |
| 2   | `ui/badge/Badge.vue:2` → `ui/badge/index.ts:4` → `Badge.vue`                                                                                                                  | то же                                                                                                           |
| 2   | `ui/select/SelectContent.vue:4` → `ui/select/index.ts:2` (а также `:7,:8`) → `SelectContent.vue`                                                                              | импортировать соседние компоненты относительными путями, не через баррель                                       |

Задокументированный цикл в `contract` **не подтвердился**: комментарий-пример в `contract/src/enums.ts:9`
(`import … from '@gmdb/contract'`) ловился парсером до вырезания комментариев; реальных рёбер contract → index нет.
В `backend/src` и `database/src` циклов нет. Риск высокий только у №1 (layout↔router — инициализация/HMR),
shadcn-циклы механические, но их удобно снять одним батчем.

## 2. Граф: мёртвые файлы и экспорты

### 2.1 Файлы без импортёров (проверено `git grep` по имени и по пути — 0 ссылок)

| Файл                                                       | Строк | Что внутри                                                                                                                  |
| ---------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/modules/rating/rating.entity.ts`              | 70    | Nest-era классы `RatingEntity`, `UserRatedRecordEntity`, `GetUserRatingsEntity`, `FriendsMemberEntity`, `GetFriendsEntity`  |
| `backend/src/modules/user/entities/user-account.entity.ts` | 18    | класс `UserAccountEntity` (дубль `SelectRow<'userAccounts'>`)                                                               |
| `backend/src/modules/like/like.dto.ts`                     | 17    | `LikeCreateDTO`, `GetLikesByIdDTO`, `GetLikesDTO`                                                                           |
| `backend/src/modules/rating/rating.dto.ts`                 | 13    | `RatingUpsertDTO`, `GetUserRatingsQueryDTO`                                                                                 |
| `backend/src/modules/suggestion/suggesttion.dto.ts`        | 11    | `UserSuggestionDTO`, `UserSuggestionResponseDTO`                                                                            |
| `backend/src/enums/enums.names.ts`                         | 8     | строковые имена enum'ов (`export const UserRole = 'UserRole'` и т.д.) — дубль имён типов из БД/contract                     |
| `backend/src/modules/auth/dto/callback.dto.ts`             | 5     | `CallbackDto`                                                                                                               |
| `backend/src/modules/auth/dto/update-nickname.dto.ts`      | 3     | `UpdateNicknameDTO`                                                                                                         |
| `backend/src/modules/auth/dto/success-response.dto.ts`     | 3     | `SuccessResponseDTO` (живой — TypeBox-модель `gateway/models.ts:54`)                                                        |
| `backend/src/modules/user/user.dto.ts`                     | 3     | `MergeUsersDto`                                                                                                             |
| `backend/src/modules/wordle/scripts/build-dictionary.ts`   | —     | **не мёртвый**: manual-скрипт, задокументирован в `modules/wordle/data/README.md:51,59`; в графе без импортёров — это норма |

Итого мёртвых: **10 файлов, 151 строка**. Половина — пустые/декоративные DTO (`SuccessResponseDTO` в 3 строки),
которые ничего не валидируют. `suggesttion.dto.ts` — известная опечатка, файл мёртв: переименование безопасно
именно сейчас (импортов нет), вопреки заметке в `AGENTS.md:87`.

### 2.2 Мёртвые frontend-файлы (найдены reachability-обходом от entrypoints, не только по in-degree)

| Файл                                                        | Строк  | Содержимое                                                               |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `frontend/src/components/dialog/index.ts`                   | 1      | реэкспорт `Dialog`                                                       |
| `frontend/src/components/layout/index.ts`                   | 5      | 5 layout-компонентов                                                     |
| `frontend/src/components/media/index.ts`                    | 5      | `DataCards`, `Search`, `FilterStatus`, `FilterGrade`, `FilterPopover`    |
| `frontend/src/components/media/badge/index.ts`              | 2      | `BadgeSelect`, `BadgePopover`                                            |
| `frontend/src/composables/index.ts`                         | 1      | `useWebSocket`                                                           |
| `frontend/src/stores/index.ts`                              | 4      | `useApi`, `useUser`, `USER_QUERY_KEY`, `useNewRecords`, `useTitle`       |
| `frontend/src/utils/index.ts`                               | 2      | `getImageUrl`, `generateWatchLink`                                       |
| `frontend/src/components/ui/slider/index.ts` + `Slider.vue` | 1 + 42 | мёртвый shadcn-компонент целиком (нет ни одного `slider` вне этой папки) |

Проверка: `git grep "from '@/components/layout'"`, `.../media'`, `.../stores'`, `.../utils'`, `ui/slider` —
0 совпадений. Компоненты внутри баррелей живые и импортируются напрямую; удаляются только баррели.
`database/src/seed/index.ts` — единственный файл, живущий только тестом
(`modules/cocktail/__tests__/catalog-snapshot.spec.ts:2`): не мёртв, но его API-поверхность (`CATALOG`, `validateCatalog`)
держится одним снапшот-тестом.

### 2.3 Экспорты без внешних потребителей — топ по объёму

Всего **237 экспортов в 104 файлах**; из них 211 — символ используется в своём же файле, т.е. лишний `export`
(снять модификатор), 26 — не используется нигде (кандидат на удаление).
Метод: разрешение всех import/export (alias `@/`, `@backend/`, `@gmdb/contract`, `@gmd/database`), раскрытие
`export *`/`export {x as y}`, namespace-импорты (`import * as ns` → `ns.Prop`), fixpoint по реэкспортам.
Проверка выборки (12 имён) `git grep` — совпало; но эвристика не видит `obj[name]`, reflection и Eden-вывод
(`typeof App`), поэтому статус «нет потребителей» ≠ «можно удалить код» (для 211 — только `export`).

| Файл                                                           | Строк | N   | Примеры имён                                                                                                                          |
| -------------------------------------------------------------- | ----- | --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/gateway/auth-oauth.ts`                            | 489   | 2   | `oauthModels`, `OAuthRouteDeps`                                                                                                       |
| `backend/src/gateway/wordle.ts`                                | 401   | 3   | `wordleModels`, `wordleNotificationModels`, `WordleRouteDeps`                                                                         |
| `backend/src/modules/wordle/wordle-notification.service.ts`    | 368   | 6   | `DEDUP_TTL_SECONDS`, `DEDUP_KEY_PREFIX`, `LINK_KEY_PREFIX`, `LINK_TTL_SECONDS`, `START_PAYLOAD_PREFIX`, `WordleNotificationRecipient` |
| `frontend/src/pages/wordle/composables/use-wordle.ts`          | 335   | 3   | `WORDLE_STATE_KEY`, `WORDLE_STATS_KEY`, `WORDLE_PRACTICE_KEY`                                                                         |
| `frontend/src/pages/cocktails/composables/use-cocktail-bar.ts` | 318   | 2   | `GUEST_BAR_STORAGE_KEY`, `BAR_SAVE_DEBOUNCE_MS`                                                                                       |
| `backend/src/gateway/records.ts`                               | 283   | 4   | `SuggestionOwnershipEntity`, `RecordEntity`, `RecordsQuery`, `RecordRouteDeps`                                                        |
| `backend/src/server/page-meta.ts`                              | 267   | 5   | `SITE_NAME`, `OG_IMAGE_PATH`, `PageMeta`, `ResolvedPageMeta`, `renderPageMeta`                                                        |
| `backend/src/gateway/auth-session.ts`                          | 253   | 3   | `authSessionModels`, `CustomizationUpdateInput`, `AuthSessionRouteDeps`                                                               |
| `backend/src/modules/wordle/wordle.stats.ts`                   | 247   | 6   | `WORDLE_HISTORY_DAYS`, `WordleHistoryDay`, `WordleStats`                                                                              |
| `backend/src/gateway/ratings.ts`                               | 213   | 6   | `RatingEntity`, `UserRatedRecordEntity`, `FriendsMemberEntity`, `ratingModels`                                                        |
| `backend/src/gateway/steam.ts`                                 | 147   | 8   | `SteamGameDto`, `SteamImportGameDto`, `steamModels`                                                                                   |
| `frontend/src/lib/telegram-webapp.ts`                          | 181   | 7   | `TELEGRAM_WEBAPP_HASH_FIELD`, `loadTelegramSdk`, `getTelegramInitData`, `authenticateTelegramMiniApp`                                 |

Полный список воспроизводится скриптом §8 (`deadExports`). Отдельно: `enums.names.ts:1–8` — 8 экспортов,
весь файл мёртв; `gateway/models.ts` — 7 из 11 экспортов не импортируются (сами модели используются внутри).

## 3. Дубли

### 3.1 Backend: логика и шаблоны гейтвея

| #   | Что                                                                                     | Пары / места (file:line)                                                                                                                                                                                                                                                                                                                      | Размер          |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| D1  | `const limit = (…) => enforceRateLimit(rateLimit, { request, route, config, ip })`      | **9 копий:** `gateway/auth-oauth.ts:141`, `auth-session.ts:63`, `cocktails.ts:99`, `steam.ts:94`, `wordle.ts:229` (ctx-вариант) и `ratings.ts:97`, `records.ts:139`, `suggestions.ts:52`, `users.ts:90` (raw-вариант)                                                                                                                         | 12–13 строк ×9  |
| D2  | Ручки без `limit`-хелпера зовут `enforceRateLimit` напрямую — два параллельных паттерна | `likes.ts`, `limits.ts`, `media.ts`, `queue.ts`, `stats.ts`, `me.ts`, `twir.ts`, `telegram.ts`, `health.ts`, `weather.ts` (10 файлов)                                                                                                                                                                                                         | —               |
| D3  | `.model({ ...apiErrorModels, ...authModels, … })`                                       | **19 мест:** `auth-oauth.ts:178`, `auth-session.ts:82`, `cocktails.ts:117`, `health.ts:13`, `likes.ts:56`, `limits.ts:47`, `me.ts:20`, `media.ts:31`, `queue.ts:51`, `ratings.ts:118`, `records.ts:154`, `stats.ts:78`, `steam.ts:114`, `suggestions.ts:62`, `telegram.ts:32`, `twir.ts:35`, `users.ts:100`, `weather.ts:64`, `wordle.ts:247` | 1–6 строк       |
| D4  | `requireUser(await resolveUser(auth, request))` + `requireRole(..., ['USER','ADMIN'])`  | 31 вызов в 12 файлах; напр. `likes.ts:67,89,111,133,155`, `ratings.ts:133,154,170`, `records.ts:174,220`, `auth-oauth.ts:205,243,287`; локальные обёртки `auth-session.ts:78`, `cocktails.ts:114`                                                                                                                                             | 1 строка ×31    |
| D5  | OAuth-клиенты Kick и Twitch: fetch профиля + обмен code→token                           | `kick.service.ts:30` ↔ `twitch.service.ts:23`; `kick.service.ts:46` ↔ `twitch.service.ts:41`; `kick.service.ts:71` ↔ `twitch.service.ts:65`                                                                                                                                                                                                   | 15–22 строки ×2 |
| D6  | «Найти Telegram-пользователя, иначе отправить connect-text»                             | `cocktail/cocktail-bot.service.ts:63–70` ↔ `wordle/wordle-notification.service.ts:303–310`                                                                                                                                                                                                                                                    | 8 строк ×2      |
| D7  | Создание record + ownership внутри транзакции                                           | `record/repositories/drizzle-record.repository.ts:16–43` ↔ `suggestion/repositories/drizzle-suggestion.repository.ts:40–60` (отличаются статусом/типом и текстом ошибки)                                                                                                                                                                      | ~20 строк       |
| D8  | Интерфейс результата merge — **три идентичных определения**                             | `gateway/users.ts:57` (`MergeResult`), `modules/user/entities/user-domain.entity.ts:46` (`MergeUsersResult`), `modules/user/user.entity.ts:25` (`MergeUsersResultEntity`)                                                                                                                                                                     | 9 полей ×3      |
| D9  | `maxMissing` предел 50 — две константы                                                  | `gateway/cocktails.ts:72` (TypeBox `maximum: 50`) ↔ `modules/cocktail/cocktail.match.ts:15` (`MAX_MISSING_LIMIT = 50`)                                                                                                                                                                                                                        | 1 значение ×2   |
| D10 | Плашка «Открыть сайт»                                                                   | `wordle/wordle-notification.messages.ts:8` ↔ `cocktail/cocktail-bot.messages.ts:3` (`OPEN_SITE_BUTTON_TEXT`)                                                                                                                                                                                                                                  | 1 строка ×2     |

### 3.2 Frontend: отображение / форматирование

| #   | Что                                            | Пары (file:line)                                                                                                                                                                          | Комментарий                                                                                                               |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| F1  | Лейблы жанров                                  | `pages/stats/constants/stats-constants.ts:11–18` ↔ `components/layout/db/use-db-navigation.ts:42–46` ↔ `pages/suggestion/components/SuggestionCard.vue:113–119`                           | 5 значений ×3; иконки жанров — ещё 2 карты (`use-db-navigation.ts:42–46` ↔ `SuggestionCard.vue:121–127`)                  |
| F2  | Лейблы+цвета статусов/оценок                   | `components/media/badge/composables/use-badge-select.ts:30–87` ↔ `pages/stats/constants/stats-constants.ts:20–57`                                                                         | одни и те же `#6e3630`, `#28456c`, …; в stats — hex, в бейджах — `bg-[#…]`; при правке палитры разъедутся молча           |
| F3  | Пагинация «loadNextPage»                       | `composables/factories/create-records-store.ts:75–91` ↔ `pages/ratings/composables/use-user-ratings.ts:62–79`                                                                             | ~13 строк идентичны; `getNextPageParam` в фабрике (`:69–74`) инлайнит ту же логику, что `user-ratings-pagination.ts:4–11` |
| F4  | `pluralRu` / склонения                         | `utils/plural-ru.ts:2–10` (канон) ↔ `modules/wordle/wordle-notification.messages.ts:10–17` (`pluralizeDays`) ↔ `modules/cocktail/cocktail-bot.messages.ts:20–22` (`pluralizeIngredients`) | 3 реализации на бэке и фронте; канон только на фронте                                                                     |
| F5  | Список route-names                             | `router/router.ts:153–176` (`EXPECTED_ROUTE_NAMES`, 22 имени) ↔ `types/vue-router.d.ts:20–44` (`RouteNamedMap`, 22 имени)                                                                 | ручная синхронизация + dev-warn `router.ts:185`; добавление маршрута = 3 правки                                           |
| F6  | Лейблы/центрирование статусов в stats vs badge | `pages/stats/constants/stats-constants.ts:36–57` ↔ `use-badge-select.ts:30–87`                                                                                                            | см. F2; `GRADE_ORDER` (`:45–51`) дублирует порядок из `friends-rating.ts:8–13`                                            |

Проверено вручную по 8 кандидатам fuzzy-сканнера; отброшены ложные: `WeatherBadge.vue:7–18` ↔ `use-weather.ts:120–131`
и `SteamSyncPanel.vue:16–27` ↔ `use-steam-sync.ts:180–191` — это одинаковые **списки деструктуризации**, не логика.

### 3.3 Дубли типов / маппинга между слоями

| #   | Что                                                                                         | file:line                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | `RecordEntity`: TypeBox-схема / Nest-класс / алиас фронта                                   | `gateway/records.ts:35`, `modules/record/record.entity.ts:21`, `api-types.ts:4`                                                                    |
| T2  | `UserEntity`: TypeBox / Nest-класс / алиас                                                  | `gateway/auth.ts:10`, `modules/user/user.entity.ts:3`, `api-types.ts:2`                                                                            |
| T3  | `RatingEntity`, `LikeEntity`: TypeBox и Nest-класс                                          | `gateway/ratings.ts:22` ↔ `modules/rating/rating.entity.ts:5` (мёртв); `gateway/likes.ts:15` ↔ `modules/like/like.entity.ts:3`                     |
| T4  | `SteamGameDto`, `QueueDto`: TypeBox-модель и класс модуля с тем же именем, но другой формой | `gateway/steam.ts:20` ↔ `modules/steam/steam.dto.ts:4`; `gateway/queue.ts:19` ↔ `modules/queue/queue.dto.ts:17`                                    |
| T5  | `FriendsCounts`, `emptyFriendsCounts`, `getTopGrade` — «клиентское зеркало» бэкенда         | `modules/rating/entities/rating-domain.entity.ts:14,30,39` ↔ `frontend/src/utils/friends-rating.ts:15,17,26` (комментарий `:3–6` признаёт зеркало) |
| T6  | `ImageVariant = 'poster' \| 'avatar'` — тип продублирован                                   | `gateway/media.ts:7` ↔ `frontend/src/utils/image.ts:1` (место — `@gmdb/contract`)                                                                  |
| T7  | `UserAccount` — разные формы под одним именем                                               | `modules/user/entities/user-domain.entity.ts:44` (`SelectRow`) ↔ `pages/admin/composables/use-admin-users.ts:9` (алиас `UserAccountEntity`)        |
| T8  | `Merge*` — см. D8                                                                           | —                                                                                                                                                  |

## 4. Касты и глушилки

**Production — чисто.** `as any` — 0; `as never` — 0; `eslint-disable`/`oxlint-disable` — 0.

| file:line                                                                | Что                                                  | Причина / вердикт                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/composables/factories/create-records-store.ts:129`         | `as unknown as RecordsStoreReturn<TItems, TRefetch>` | computed-ключи `[config.itemsName]` + generics; комментарий `:118–120` честно объясняет. Точечно не убрать — нужен рефактор возвращаемого типа фабрики (mapped type/`satisfies`), отдельный батч |
| `backend/src/modules/records-providers/records-providers.service.ts:295` | `(await response.json()) as unknown`                 | идиоматично: `json()` уже `unknown`; не каст-глушилка                                                                                                                                            |
| `frontend/src/lib/api.ts:63`                                             | `(result.data as unknown) === ''`                    | сравнение `unknown` с `''`; заменяется `typeof result.data === 'string' && result.data === ''`                                                                                                   |
| `database/src/types.check.ts:37,39`                                      | `@ts-expect-error`                                   | type-level тесты (ожидаемая ошибка), файл включён в `tsconfig` — оставить                                                                                                                        |
| `frontend/src/router/router.check.ts:11`                                 | `@ts-expect-error`                                   | type-level тест `router.push({ name: 'games-typo' })` — оставить                                                                                                                                 |

**Тесты.** `as any` — **89 в 14 файлах**, `as unknown as` — **67 в 25 файлах**, `as never` — 23 (все тесты).
Файлы-концентраторы `as any`: `modules/user/__tests__/user.service.spec.ts:40`, `rating.service.spec.ts:12`,
`record.service.spec.ts:10`, `img.service.spec.ts:6`, `suggestion.service.spec.ts:5`, `drizzle-user.repository.spec.ts:3`,
`steam.service.spec.ts:3`, `img-url-safety.spec.ts:3`, `records-providers.service.spec.ts:2`, остальные по 1.
`as unknown as` — `telegram-bot.service.spec.ts:16`, `user.service.spec.ts:6`, `records-providers.service.spec.ts:6`,
`wordle-notification.service.spec.ts:5`, `wordle-practice.service.spec.ts:4`; типовой паттерн
`{} as unknown as DrizzleService` (12× в `__integration__/*`).
Причина концентрации — моки сервисов без общего фабричного типа (`__tests__/helpers/mock-factory.ts` есть, но
покрывает не всё) и `no-explicit-any` отключён для тестов: `.oxlintrc.json:24–30` исключает
`**/__tests__/**` и `**/*.spec.ts` из линта. `backend/tsconfig.json:10` — `strict: false` (флаги по отдельности),
`frontend/tsconfig.json:12` — `strict: true`: бэкенд терпимее к неявным типам.

## 5. Крупные файлы (> 300 строк, без seed-данных и тестов)

| Файл                                                                 | Строк | Что внутри                                                                                                                                                                     | Границы разреза                                                                                                                                      |
| -------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/gateway/auth-oauth.ts`                                  | 489   | TypeBox-модели (23–77), OAuth-роуты Twitch/Kick/Telegram (81–461), cookie-хелперы (462–489); 3 TTL-константы                                                                   | `auth-oauth.models.ts` (23–77), `auth-oauth.telegram.ts` (360–489), `auth-oauth.providers.ts` (188–359); TTL — в `utils/rate-limits`-подобный конфиг |
| `frontend/src/pages/suggestion/components/SuggestionCard.vue`        | 440   | script (1–208): лайки/троттлинг/админ-действия/сворачивание жанров; template (209–404): карточка + панель действий; style (405–440)                                            | `SuggestionLikeButton.vue` (45–60, 149–170), `SuggestionAdminActions.vue` (171–199), `SuggestionCardHeader.vue` (209–260)                            |
| `backend/src/modules/records-providers/records-providers.service.ts` | 425   | type-guards внешних API (39–95), класс: `prepareData` (189–377), `fetchShikimori` (237), `fetchKinopoisk` (261–298), `fetchIGDBGame` (339–377), `fetchIGDBFromSteam` (378–425) | по провайдеру: `providers/kinopoisk.ts`, `providers/igdb.ts`, `providers/shikimori.ts` — класс станет оркестратором                                  |
| `backend/src/modules/telegram/telegram-bot.service.ts`               | 409   | конфиг/regex-константы, регистрация команд (150–188), transport `sendMessage/setMenuButton/getBotUsername/ensureWebhook` (221–330), `handleUpdate`-роутинг (331–409)           | `telegram-api.client.ts` (221–330), остальное — реестр команд; сейчас класс = и реестр, и HTTP-клиент                                                |
| `backend/src/gateway/wordle.ts`                                      | 401   | TypeBox-модели (14–116), DTO-интерфейсы (117–225), порты (202–218), роуты (228–401)                                                                                            | `wordle.models.ts` (14–225); роуты оставить — станет ~180 строк                                                                                      |
| `backend/src/modules/wordle/wordle-notification.service.ts`          | 368   | расписание/таймер (59–100, 200–250), сбор получателей (108–200), link-token (250–298), bot-команды `handleSubscribe/handleStartToken` (298–368)                                | `wordle-notification.links.ts` (250–298) + `wordle-notification.commands.ts` (298–368); сервис — только расписание и рассылка                        |
| `frontend/src/pages/wordle/composables/use-wordle.ts`                | 335   | daily+practice в одном Pinia-store: ввод (160–209), submit (210–246), practice-round (247–258), оптимистичные stats (266–293)                                                  | `use-wordle-practice.ts` (247–258 + practice-состояние 58–122); стор останется daily-only                                                            |
| `frontend/src/components/media/MediaCard.vue`                        | 326   | script: редактирование постеров/эпизодов (62–95), статусы/оценки (96–151), friends-rating (152–175); template 188+                                                             | edit-диалоги (62–95) → `MediaCardEdit.vue`; friends-rating — в composable                                                                            |
| `backend/src/modules/user/repositories/drizzle-user.repository.ts`   | 321   | CRUD пользователя (25–99), accounts link/unlink (108–129), `mergeUsers` (130–321)                                                                                              | `drizzle-user-accounts.repository.ts` (108–129) + `drizzle-user-merge.repository.ts` (130+)                                                          |
| `frontend/src/pages/cocktails/composables/use-cocktail-bar.ts`       | 318   | guest-режим localStorage (17–58), server-mode (72–163), watchers/sync (130–200), dispose (297)                                                                                 | guest-хранилище (10–58) в `guest-bar.ts` — чистые функции уже выделены                                                                               |
| `backend/src/modules/user/user.service.ts`                           | 308   | upsert/merge/accounts (63–214), customization/avatar (215–307), зависимость от `AvatarService`+`DrizzleCustomizationStatsRepository`                                           | customization (215–307) → `user-customization.service.ts`; сервис станет CRUD+merge                                                                  |

Seed-данные (`database/src/seed/data/cocktails-*.ts` 1506–1705 строк, `ingredients.ts` 757) — не разрезать:
это данные, не логика.

## 6. console.* / process.env / магические значения

### 6.1 console вместо logger

Логгер есть: `backend/src/utils/logger.ts` (`Logger`), им пользуются 24 файла. Мимо него — **7 вызовов в 4 prod-файлах**:

| file:line                                     | Вызов                                                      | Куда                            |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `backend/src/gateway/index.ts:80`             | `console.error('[gateway] response schema violation', …)`  | `new Logger('gateway').error`   |
| `backend/src/gateway/index.ts:111`            | `console.error('[gateway] unhandled error', error)`        | то же                           |
| `backend/src/gateway/ws.ts:69`                | `console.warn('[gateway] не удалось отправить …')`         | `new Logger('gateway').warn`    |
| `backend/src/server/container.ts:177,203,231` | `console.warn('[gateway] Redis недоступен/init/shutdown')` | `Logger` (контекст `container`) |
| `backend/src/utils/domain-events.ts:35`       | `console.warn('[events] обработчик … упал')`               | `Logger` (`domain-events`)      |

`backend/src/main.ts:38,39,43` — startup/shutdown-логи; допустимо, но формат уже дублирует `Logger`.
Фронт: **15 `console.*` в 10 файлах**, логгера нет: `AccountDangerZone.vue:40`, `ConnectedAccounts.vue:34,55`,
`MediaCard.vue:169`, `use-websocket.ts:113,116`, `use-admin-users.ts:27,57`, `use-merge-accounts.ts:108`,
`use-steam-sync.ts:101,154`, `PcPage.vue:55`, `utils/api-error.ts:28`, `router.ts:185,186`. Паттерн один
(`console.error('Failed to …:', error)` в `catch`) — кандидат на `lib/logger.ts` с `toast`-фолбэком, но это не срочно.

### 6.2 process.env мимо envalid

| file:line                                                                                                                                                                            | Что                                                                | Вердикт                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/database/drizzle.service.ts:13`                                                                                                                                         | `new Pool({ connectionString: process.env.DATASOURCE_URL ?? '' })` | **единственный prod-байпас**: `env` из `utils/enviroments.ts:5` уже содержит валидированный `DATASOURCE_URL`; `?? ''` маскирует ошибку конфигурации пустым DSN |
| `database/src/lib/connection.ts:8`                                                                                                                                                   | `process.env.DATASOURCE_URL`                                       | другой пакет/CLI (`migrate.ts`, `baseline.ts`), envalid там нет — осознанно                                                                                    |
| `database/drizzle.config.ts:9`, `frontend/vite.config.ts:8`, `frontend/playwright.config.ts:13,22,43,61`, `frontend/e2e/helpers/env.ts:4,14,15`, `backend/src/__e2e__/seed.ts:19–21` | конфиги/e2e                                                        | допустимо (не рантайм приложения); e2e читает env напрямую — так и задумано                                                                                    |

### 6.3 Магические числа и повторяющиеся литералы

| Что                                              | Где                                                                                                                                                                                                              | Проблема                                                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Пагинация `page.max = 10_000`, `limit.max = 100` | `gateway/likes.ts:161–162`, `ratings.ts:112–113`, `records.ts:205–206`                                                                                                                                           | 6 копий одной схемы; канонический `t.Object` для query отсутствует                                                                                 |
| `maxMissing = 50`                                | `gateway/cocktails.ts:72` ↔ `cocktail/cocktail.match.ts:15`                                                                                                                                                      | два источника одного предела; в TypeBox и в валидаторе                                                                                             |
| `600` сек                                        | `auth-oauth.ts:78` (`OAUTH_COOKIE_TTL_SECONDS`) ↔ `wordle-notification.service.ts:38` (`LINK_TTL_SECONDS`)                                                                                                       | значение одно, смысл разный — не баг, но оба «голые»                                                                                               |
| `1500` мс                                        | `frontend/src/main.ts:15` (`AUTH_BOOT_TIMEOUT_MS`) ↔ `router/router.ts:213` (raw)                                                                                                                                | одна величина, два места, одно имя только в одном                                                                                                  |
| Голые `200`, `300` мс                            | `main.ts:100` (splash), `SuggestionForm.vue:40` (reset)                                                                                                                                                          | рядом есть именованные `*_DEBOUNCE_MS` (`use-cocktail-match.ts:22`, `use-cocktail-bar.ts:13`) — стиль непоследователен                             |
| `'USER'/'ADMIN'` строками                        | `gateway/auth.ts:8`, `likes.ts:52`, `limits.ts:43`, `ratings.ts:93–94`, `records.ts:134`, `steam.ts:91`, `suggestions.ts:49`, `users.ts:87`, `wordle.ts:226`; фронт `AdminPage.vue:77`, `MergeUserPicker.vue:98` | 12 мест (10 на бэке в 9 файлах + 2 на фронте) вместо `UserRole.USER/ADMIN` из `@gmdb/contract`; `const ADMIN = ['ADMIN'] as const` повторён 4 раза |
| Значения enum'ов строками в TypeBox              | `gateway/models.ts:9–37` (AccountPlatform, LimitType, RecordGenre/Status/Grade/Type), `gateway/wordle.ts:15–17`, `gateway/cocktails.ts:14–30`, `gateway/auth-session.ts:115`                                     | контракт даёт значения, но схемы хардкодят литералы; при добавлении значения enum TypeBox молча разъедется                                         |
| Платформа строками                               | `modules/auth/auth.service.ts:49,66,79,98,113,123,128`                                                                                                                                                           | то же для `AccountPlatform`                                                                                                                        |
| Enum-значения в SQL                              | `modules/wordle/repositories/drizzle-wordle.repository.ts:60–62` (`'WON'::"WordleGameStatus"`)                                                                                                                   | неизбежно для SQL, но стоит комментарий/линк на contract                                                                                           |
| Имя cookie `'token'`                             | `auth-oauth.ts:104,109`, `auth-session.ts:186,201`, `auth.ts:64`                                                                                                                                                 | 5 мест, константы нет (e2e seed не считаем)                                                                                                        |
| WS-события                                       | `contract/src/ws.ts`                                                                                                                                                                                             | **хорошо:** в prod только `WsEvents.*`; строки `'update-*'` встречаются лишь в тестах                                                              |
| Route-paths                                      | `router-paths.ts` + `router.ts`                                                                                                                                                                                  | **почти хорошо:** вне `ROUTER_PATHS` только 3 auth-callback пути (`router.ts:14,20,26`) и catch-all (`:134`)                                       |

## 7. Нейминг

### 7.1 Файлы и конвенции

| Находка                                                                                                                                                                                     | Evidence                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.vue` — PascalCase                                                                                                                                                                         | 100% (исключение `app.vue`, разрешено)                                                                                                                                                                                                                                             |
| `.ts` — не строго kebab-case: **99 файлов** с dot-suffix (`*.service.ts`, `*.dto.ts`, `*.repository.ts`, `*.entity.ts`, `*.enum.ts`…): service 27, dto 17, repository 13, entity 11, enum 8 | напр. `modules/auth/auth.service.ts`, `modules/img/img.dto.ts`; `AGENTS.md` декларирует «.ts — kebab-case» — конвенцию нужно либо узаконить, либо переименовать батчем                                                                                                             |
| Опечатки                                                                                                                                                                                    | `modules/suggestion/suggesttion.dto.ts` (мёртв — можно чинить бесплатно), `utils/enviroments.ts` (живой, 12 импортов; опечатка задокументирована — не трогать без батча)                                                                                                           |
| Entity-дубли имён файлов                                                                                                                                                                    | `modules/like/like.entity.ts` ↔ `modules/like/entities/like.entity.ts` (класс vs `SelectRow`); `record.entity.ts` ↔ `entities/record-domain.entity.ts`; `rating.entity.ts` (мёртв) ↔ `entities/rating-domain.entity.ts`; `user.entity.ts` ↔ `entities/user-domain.entity.ts`       |
| composables без `use-`                                                                                                                                                                      | `composables/query-keys.ts`, `composables/websocket-resync.ts`, `pages/cocktails/composables/cocktail-filter.ts`, `pages/ratings/composables/user-ratings-pagination.ts`, `composables/index.ts` (мёртв). Это утилиты/ключи, а не composables — либо `utils/`, либо переименование |
| Stores                                                                                                                                                                                      | все `use-*.ts` — чисто (`stores/index.ts` мёртв, см. §2.2)                                                                                                                                                                                                                         |

### 7.2 Расхождение имён между слоями

| Концепт    | модуль (singular)     | gateway (plural)                          |
| ---------- | --------------------- | ----------------------------------------- |
| record     | `modules/record/`     | `gateway/records.ts`                      |
| like       | `modules/like/`       | `gateway/likes.ts`                        |
| rating     | `modules/rating/`     | `gateway/ratings.ts`                      |
| suggestion | `modules/suggestion/` | `gateway/suggestions.ts`                  |
| user       | `modules/user/`       | `gateway/users.ts` + `me.ts` + `auth*.ts` |
| cocktail   | `modules/cocktail/`   | `gateway/cocktails.ts`                    |
| websocket  | `modules/websocket/`  | `gateway/ws.ts`                           |
| img        | `modules/img/`        | `gateway/media.ts`                        |

Плюс `records-providers` (домен-провайдеры) не имеет одноимённого gateway — его ручки живут в `gateway/steam.ts`.
Ещё: `cocktail/cocktail.catalogue.ts` (британская форма) против 25 frontend-файлов с `catalog` и роута
`/cocktails/catalog` (`gateway/cocktails.ts:119`); `enums.names.ts` vs `gateway/models.ts` — те же имена.

### 7.3 Коллизии идентификаторов (одно имя — разные формы в разных файлах)

| Имя                   | Определения                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `UserEntity`          | `gateway/auth.ts:10` (TypeBox) / `modules/user/user.entity.ts:3` (class) / `api-types.ts:2` (alias)                 |
| `RecordEntity`        | `gateway/records.ts:35` / `modules/record/record.entity.ts:21` / `api-types.ts:4`                                   |
| `RatingEntity`        | `gateway/ratings.ts:22` / `modules/rating/rating.entity.ts:5` (мёртв)                                               |
| `LikeEntity`          | `gateway/likes.ts:15` / `modules/like/like.entity.ts:3`                                                             |
| `SteamGameDto`        | `gateway/steam.ts:20` (TypeBox) / `modules/steam/steam.dto.ts:4` (class)                                            |
| `QueueDto`            | `gateway/queue.ts:19` / `modules/queue/queue.dto.ts:17`                                                             |
| `WordleHistoryDayDTO` | `gateway/wordle.ts:38` (ключ модели) / `modules/wordle/wordle.dto.ts:47` (class) / `api-types.ts:66` (derived type) |
| `UserAccount`         | `modules/user/entities/user-domain.entity.ts:44` / `pages/admin/composables/use-admin-users.ts:9`                   |
| `FriendsCounts`       | `modules/rating/entities/rating-domain.entity.ts:14` / `frontend/src/utils/friends-rating.ts:11`                    |
| `ImageVariant`        | `gateway/media.ts:7` / `frontend/src/utils/image.ts:1`                                                              |
| `ADMIN`               | `gateway/limits.ts:43`, `records.ts:130`, `steam.ts:91`, `users.ts:87` (4 раза)                                     |

### 7.4 api-types: дрейф имён фронтового API (47 экспортов, `backend/src/api-types.ts`)

`GetAllRecordsDTO` (= page `RecordsPage`), `GetLikesByIdDTO` (= page), `GetUserRatingsEntity` (= page),
`UserSuggestionDTO` (= `CreateSuggestionInput`), `MergeUsersResultEntity` (= gateway `MergeResult`),
`WordleNotificationsStatusDTO`/`WordleNotificationsUpdateDTO` (plural против backend `WordleNotification*`),
`SteamGameDto` (camel `Dto` против 56 имён `DTO`), `WordleLeaderboard`/`WordleState`/`WordleStats` экспортируются
дважды — и как «DTO», и как «сырое» имя. Плюс 9 имён с `Dto`: `ApiErrorDto` (18 упоминаний), `SteamGameDto`,
`QueueDto`, `QueueItemDto`, `SteamImportGameDto`, `SteamImportFailureDto`, `CallbackDto`, `MergeUsersDto`, `TelegramWebAppAuthDto`.

### 7.5 Двойной путь к enum-значениям

62 backend-файла импортируют `@backend/enums`, 26 — `@gmdb/contract` напрямую. При этом
`backend/src/enums/*.enum.ts` — однострочные реэкспорты через `@gmd/database` (который сам реэкспортирует contract):
`record-genre.enum.ts:1` → `@gmd/database` → `contract/src/enums.ts`. Цепочка `contract → database → backend/enums`
тянет database-пакет тем, кому нужны только значения; `AGENTS.md` же говорит брать значения из `@gmdb/contract`.
Плюс мёртвый `enums.names.ts` дублирует имена типов.

## 8. Метод и оговорки

Скрипты (вне репо, `/tmp/hygiene/`; в git не попадают):

- `graph4.ts` — парсер import/export (alias `@/`→`frontend/src`, `@backend/`→`backend/src`, workspace-пакеты
  `@gmdb/contract`/`@gmd/database` по `exports`), SCC Тарьяна, in-degree, reachability от entrypoints,
  liveness экспортов с раскрытием `export *`/`export {x as y}` и `ns.Prop`.
- `dups.ts` — окна 8/11 строк: exact (нормализованные строки) и fuzzy (идентификаторы → `ID`, литералы сохранены);
  шум деструктуризации отфильтрован вручную.
- `funs.ts` — сравнение тел функций ≥10 строк по нормализованным токенам (нашёл `getTopGrade`, дубликаты
  шаблонных тел с другим именованием не ловит — поэтому в §3 сведены ручные пары по окнам).
- `magic.ts`, `strings.ts`, `collisions.ts` — числовые/строковые повторы, коллизии идентификаторов.

Ограничения и как проверял:

- **«Мёртвые экспорты»** — эвристика: не видит `obj[name]`, рефлексию, Eden `typeof App`. 12 имён проверены
  `git grep` вручную; для 211 «лишний export» риск нулевой (символ используется в своём файле), для 26 —
  проверять перед удалением. Namespace-импорты обработаны (`schema.Foo`), баррели раскрыты.
- **Дубли** — exact-окна достоверны; fuzzy-сканнер даёт ложные срабатывания на map-литералах и
  списках деструктуризации (примеры отброшены). `funs.ts` не ловит копии с переименованными полями —
  пары D5–D7 подтверждены чтением кода.
- **Циклы** — после вырезания комментариев (первый прогон дал ложный цикл `contract/enums.ts` из-за примера
  в JSDoc). Dynamic `import()` учтён.
- **Крупные файлы** — `wc -l`; тесты/seed исключены; «строка» — конец файла, не число строк логики.

## 9. С чего начать (батчи в порядке ценности)

1. **Удалить мёртвое** (§2.1 + §2.2): 10 файлов Nest-era + 7 баррелей + `ui/slider/*`. Риск нулевой,
   `bun check`/`vue-tsc` подтвердят. Эффект: минус 19 файлов-ловушек.
2. **Канонизировать rate-limit/gateway-каркас** (D1–D4): один `gateway/limit.ts` с `ctx`/`request` сигнатурой,
   один `authModels`-хелпер для `.model(...)`, один `requireAuth`-хелпер. 9+19+31 копий → 1+1+1.
3. **Свести типы-двойники** (T1–T4, D8): один источник на концепт (TypeBox в gateway, `SelectRow`-типы в domain,
   без Nest-классов); `MergeResult` — один интерфейс. Это снимает §7.3.
4. **Фронт: карты отображения** (F1–F2): `GENRE_LABELS`/`STATUS_COLORS`/`GRADE_COLORS` — в `lib/api`-домен или
   `composables`, бейджи и stats читают оттуда; route-names (F5) — генерировать `EXPECTED_ROUTE_NAMES` из
   `RouteNamedMap` (или наоборот) + тест.
5. **Литералы → контракт** (роли, enum-литералы TypeBox, `maxMissing`, пагинация): механически, но требует
   `bun typecheck` после каждого файла; начинать с `'USER'/'ADMIN'` (12 мест в 9 файлах) и `gateway/models.ts`.

Пагинация/таймеры/console — после первых пяти: низкий риск, но и низкая отдача.
