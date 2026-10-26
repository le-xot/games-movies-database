# API

Базовый путь — `/api`. Swagger/OpenAPI нет и не планируется: типы фронта выводятся из роутов
Elysia через Eden (`import type { App }`). Этот файл — справочник для ручной отладки и внешних
потребителей; источник правды всё равно в `backend/src/gateway/*.ts`.

## Соглашения

- Формат — JSON (`content-type: application/json`), кроме `/api/img` и `/api/avatar/:userId`
  (бинарные ответы)
- Даты — ISO-строки (`2026-10-26T12:00:00.000Z`), не Unix-время
- Аутентификация — httpOnly cookie `token` (JWT), выставляется OAuth-callback'ами
- Ошибки — единый конверт:

  ```json
  { "statusCode": 400, "message": "…", "error": "Bad Request" }
  ```

  `message` может быть строкой или массивом строк (ошибки валидации схемы).

### Доступ

| Метка     | Что значит                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `public`  | без авторизации; если cookie есть, ответ может быть персонализирован                                                   |
| `user`    | нужен валидный JWT (`requireUser` + роль из `USER_ROLES` / `RATER_ROLES`)                                              |
| `admin`   | нужен JWT с ролью `ADMIN`                                                                                              |
| `api-key` | заголовок `x-api-key` со значением `TWIR_API` (сравнение в постоянном времени)                                         |
| `secret`  | заголовок `x-telegram-bot-api-secret-token` со значением `TELEGRAM_BOT_WEBHOOK_SECRET`, сравнение в постоянном времени |

Нарушение доступа: `401` без cookie, `403` при недостаточной роли.

### Лимиты

Фикс-окно 60 секунд, ключ `rl:{route}:{ip}`, IP — первый хоп `X-Forwarded-For`.
При недоступном Redis лимит пропускается (fail-open, таймаут 250 мс).

| Пресет           | Запросов в минуту | Где                         |
| ---------------- | ----------------- | --------------------------- |
| `public`         | 1000              | чтение                      |
| `auth`           | 5                 | OAuth-редиректы и logout    |
| `write`          | 20                | создание/изменение/удаление |
| `like`           | 60                | лайки и оценки              |
| `suggestion`     | 20                | создание предложки          |
| `img`            | 3000              | `/api/img`                  |
| `twir`           | 120               | TWIR-вебхуки                |
| `wordlePractice` | 120               | тренировка Wordle           |

Превышение — `429` с конвертом ошибки и заголовком `retry-after`.

## Служебные

| Метод | Путь      | Доступ | Лимит  |
| ----- | --------- | ------ | ------ |
| `GET` | `/health` | public | public |

Ответ: `{ "status": "ok" }`. Используется health-check'ом деплоя.

## Сессия и аккаунт

| Метод    | Путь                       | Доступ | Лимит  | Описание                                |
| -------- | -------------------------- | ------ | ------ | --------------------------------------- |
| `GET`    | `/auth/me`                 | user   | public | текущий пользователь                    |
| `PATCH`  | `/auth/me`                 | user   | write  | смена ника                              |
| `DELETE` | `/auth/me`                 | user   | write  | удаление аккаунта                       |
| `POST`   | `/auth/logout`             | public | auth   | снять cookie `token`                    |
| `GET`    | `/auth/accounts`           | user   | public | привязанные провайдеры                  |
| `DELETE` | `/auth/accounts/:platform` | user   | write  | отвязать `TWITCH` / `KICK` / `TELEGRAM` |
| `POST`   | `/auth/me/avatar`          | user   | write  | загрузка аватара (multipart, до 5 МиБ)  |
| `DELETE` | `/auth/me/avatar`          | user   | write  | сброс на дефолтный аватар               |
| `GET`    | `/auth/me/customization`   | user   | public | выбор и открытые рамки-чекпоинты        |
| `PATCH`  | `/auth/me/customization`   | user   | write  | рамка (только открытая) и бейдж         |

## OAuth

| Метод  | Путь                           | Доступ | Лимит | Описание                             |
| ------ | ------------------------------ | ------ | ----- | ------------------------------------ |
| `GET`  | `/auth/twitch`                 | public | auth  | 302 на Twitch                        |
| `GET`  | `/auth/twitch/link`            | user   | auth  | привязка Twitch к текущему аккаунту  |
| `POST` | `/auth/twitch/callback`        | public | auth  | обмен `code` на токен, ставит cookie |
| `POST` | `/auth/twitch/link`            | user   | auth  | завершение привязки                  |
| `GET`  | `/auth/kick`                   | public | auth  | 302 на Kick (PKCE)                   |
| `GET`  | `/auth/kick/link`              | user   | auth  | привязка Kick                        |
| `POST` | `/auth/kick/callback`          | public | auth  | обмен `code` + `code_verifier`       |
| `POST` | `/auth/kick/link`              | user   | auth  | завершение привязки                  |
| `GET`  | `/auth/telegram`               | public | auth  | 302 на Telegram OIDC (PKCE)          |
| `GET`  | `/auth/telegram/link`          | user   | auth  | привязка Telegram                    |
| `GET`  | `/auth/telegram/oidc/callback` | public | auth  | вход или привязка, редирект на фронт |

OAuth-callback'и провайдеров (`TWITCH_CALLBACK_URL`, `KICK_CALLBACK_URL`) указывают на
**фронтовые** страницы `/auth/callback/{twitch,kick}` — они забирают `code`/`state` из URL и
делают POST на бэкенд. `TELEGRAM_OIDC_REDIRECT_URI` — наоборот, бэкендовый
`/api/auth/telegram/oidc/callback`.

## Записи медиатеки

| Метод    | Путь                  | Доступ | Лимит  | Описание                                                                                                     |
| -------- | --------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/records`            | public | public | список с фильтрами `page`, `limit`, `orderBy`, `direction`, `status[]`, `type`, `genre`, `grade[]`, `search` |
| `GET`    | `/records/:id`        | admin  | public | одна запись                                                                                                  |
| `POST`   | `/records/link`       | admin  | write  | создать из ссылки (Кинопоиск, Shikimori, IMDb, IGDB, Steam, Kinobox)                                         |
| `PATCH`  | `/records/:id`        | admin  | write  | изменить запись                                                                                              |
| `PATCH`  | `/records/:id/poster` | admin  | write  | обновить постер                                                                                              |
| `DELETE` | `/records/:id`        | admin  | write  | удалить запись                                                                                               |

## Оценки и лайки

| Метод    | Путь                 | Доступ | Лимит  | Описание                 |
| -------- | -------------------- | ------ | ------ | ------------------------ |
| `PUT`    | `/ratings/:recordId` | user   | like   | поставить/сменить оценку |
| `DELETE` | `/ratings/:recordId` | user   | like   | снять оценку             |
| `GET`    | `/ratings/my`        | user   | public | свои оценки              |
| `GET`    | `/ratings/users/:id` | public | public | оценки пользователя      |
| `GET`    | `/ratings/friends`   | public | public | сводка по друзьям        |
| `POST`   | `/likes`             | user   | like   | лайкнуть запись          |
| `DELETE` | `/likes/:recordId`   | user   | like   | убрать лайк              |
| `GET`    | `/likes/records/:id` | user   | public | лайки записи             |
| `GET`    | `/likes/users/:id`   | user   | public | лайки пользователя       |
| `GET`    | `/likes/count`       | user   | public | счётчики                 |

## Предложения

| Метод    | Путь               | Доступ | Лимит      | Описание                     |
| -------- | ------------------ | ------ | ---------- | ---------------------------- |
| `GET`    | `/suggestions`     | public | public     | список предложек             |
| `POST`   | `/suggestions`     | user   | suggestion | предложить контент по ссылке |
| `DELETE` | `/suggestions/:id` | user   | public     | удалить предложку            |

## Пользователи

| Метод    | Путь                  | Доступ | Лимит  | Описание                       |
| -------- | --------------------- | ------ | ------ | ------------------------------ |
| `GET`    | `/users/users`        | public | public | публичный список пользователей |
| `GET`    | `/users/:id`          | admin  | public | карточка пользователя          |
| `GET`    | `/users/:id/accounts` | admin  | public | привязки пользователя          |
| `DELETE` | `/users/:id`          | admin  | write  | удалить пользователя           |
| `POST`   | `/users/:id/merge`    | admin  | write  | склеить аккаунты               |

## Статистика, очередь, лимиты

| Метод  | Путь             | Доступ | Лимит  | Описание                     |
| ------ | ---------------- | ------ | ------ | ---------------------------- |
| `GET`  | `/stats/records` | public | public | агрегаты кладовки            |
| `GET`  | `/queue`         | public | public | очередь: `{ games, videos }` |
| `POST` | `/limits`        | admin  | write  | изменить лимит предложек     |

## Steam (админ)

| Метод  | Путь            | Доступ | Лимит  | Описание                    |
| ------ | --------------- | ------ | ------ | --------------------------- |
| `GET`  | `/steam/games`  | admin  | public | библиотека Steam            |
| `POST` | `/steam/import` | admin  | write  | импорт выбранных игр (IGDB) |

## Wordle

| Метод    | Путь                         | Доступ | Лимит          | Описание                    |
| -------- | ---------------------------- | ------ | -------------- | --------------------------- |
| `GET`    | `/wordle/state`              | user   | public         | состояние дня               |
| `POST`   | `/wordle/guess`              | user   | write          | попытка                     |
| `GET`    | `/wordle/stats`              | user   | public         | личная статистика           |
| `GET`    | `/wordle/leaderboard`        | public | public         | лидерборд дня               |
| `GET`    | `/wordle/practice`           | user   | public         | состояние тренировки        |
| `POST`   | `/wordle/practice`           | user   | wordlePractice | начать тренировку           |
| `POST`   | `/wordle/practice/guess`     | user   | wordlePractice | попытка в тренировке        |
| `GET`    | `/wordle/notifications`      | user   | public         | статус подписки             |
| `PATCH`  | `/wordle/notifications`      | user   | public         | вкл/выкл и слоты            |
| `POST`   | `/wordle/notifications/link` | user   | write          | deep-link для привязки чата |
| `DELETE` | `/wordle/notifications`      | user   | public         | отписка                     |

> Входящий вебхук бота (`TELEGRAM_BOT_WEBHOOK_URL`) принимает `POST /telegram/webhook`:
> секрет приходит в заголовке `x-telegram-bot-api-secret-token`, при незаданном секрете
> роут закрыт (401). См. `backend/src/gateway/telegram.ts`.

## Медиа и TWIR

| Метод  | Путь                | Доступ  | Лимит  | Описание                                                |
| ------ | ------------------- | ------- | ------ | ------------------------------------------------------- |
| `GET`  | `/img`              | public  | img    | прокси и ресайз изображений (бинарный ответ)            |
| `GET`  | `/avatar/:userId`   | public  | public | аватар пользователя (бинарный ответ)                    |
| `POST` | `/twir/suggestion`  | api-key | twir   | вебхук внешнего бота                                    |
| `POST` | `/telegram/webhook` | secret  | public | апдейты бота Wordle (`x-telegram-bot-api-secret-token`) |

## WebSocket

`ws(s)://<host>/ws`. Клиент ничего не отправляет — только слушает. Кадры:

```json
{ "event": "update-records", "payload": { "id": 42, "action": "updated", "genre": "GAMES" } }
```

| Событие              | Payload                                                       |
| -------------------- | ------------------------------------------------------------- |
| `update-records`     | `{ id, action: 'created' \| 'updated' \| 'deleted', genre? }` |
| `update-suggestions` | `{ id, action }`                                              |
| `update-queue`       | `{ id, action }`                                              |
| `update-likes`       | `{ recordId, userId, action: 'created' \| 'deleted' }`        |
| `update-ratings`     | `{ recordId, userId, grade, action }`                         |
| `update-users`       | `{ userId, action }`                                          |
| `update-wordle`      | `{ date, userId, action: 'finished' }`                        |

Типы и `parseWsMessage` — `contract/src/ws.ts` и `contract/src/ws-message.ts`. После реконнекта
фронт догоняет состояние запросами, а не рассчитывает на пропущенные кадры.
