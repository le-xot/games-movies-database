# Games Movies Database

Полнофункциональное веб-приложение для трекинга медиа: игры, аниме, фильмы, мультфильмы, сериалы и PC-игры. Авторизация через Twitch, Kick и Telegram, реал-тайм обновления через WebSocket.

## Возможности

- **Трекинг медиа** — учёт игр, аниме, фильмов, мультфильмов, сериалов и PC-игр со статусами и оценками
- **Авторизация** — OAuth через Twitch и Kick, Telegram Login (OpenID Connect), JWT в httpOnly cookie
- **Реал-тайм** — мгновенные обновления интерфейса через нативный WebSocket (Bun)
- **Система предложений** — пользователи предлагают новый контент для добавления
- **Система очередей** — управление очередью элементов
- **Статистика** — публичная сводка «Кладовки»: итоги, жанры, статусы, оценки и разрезы по жанрам
- **Лайки** — избранное с каскадным удалением
- **Аккаунт** — модальное окно: смена ника и аватара, привязка/отвязка провайдеров, удаление аккаунта
- **Навигация** — сворачиваемый сайдбар с разделами и мобильным меню
- **Админка** — панель администрирования: пользователи, склейка аккаунтов, Steam Sync
- **Прокси изображений** — ресайз через Sharp, проксирование через `/api/img`
- **Генерация watch-ссылок** — автоматические ссылки на Kinobox для просмотра
- **Погода** — виджет погоды через OpenWeatherMap
- **TWIR** — вебхуки от внешнего бота с защитой API-ключом

## Стек технологий

| Слой           | Технологии                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Vue 3, Vite, TypeScript, Tailwind CSS 4, shadcn-vue, Pinia, Eden Treaty (@elysia/eden), @tanstack/vue-virtual, vee-validate |
| Backend        | Elysia (Bun) 1.4, TypeBox, Drizzle ORM, PostgreSQL, Redis, нативный WebSocket (Bun), Sharp, JWT                             |
| Инфраструктура | Docker, Bun, Redis (rate limiting), RustFS (S3-хранилище), Traefik (reverse proxy), GitHub Actions                          |

## Быстрый старт

### 1. Зависимости

- [Bun](https://bun.sh/) — JavaScript runtime и пакетный менеджер
- [Docker](https://docs.docker.com/engine/) — для PostgreSQL

### 2. Установка

```bash
# Клонировать репозиторий
git clone https://github.com/le-xot/games-movies-database.git
cd games-movies-database

# Установить зависимости
bun install
```

### 3. Запуск инфраструктуры

```bash
bun infra:start
```

Это поднимет PostgreSQL на порту `5432`, Redis на порту `6379`, RustFS на порту `127.0.0.1:9000` и DBX на порту `127.0.0.1:4224` (оба только loopback, наружу не публикуются; веб-пароль из `DBX_PASSWORD`, по умолчанию `dbx`).

Остановка: `bun infra:stop`.

### 4. Настройка окружения

```bash
cp backend/.env.example backend/.env
```

Отредактируйте `backend/.env` — как минимум заполните `JWT_SECRET`. Остальные переменные описаны в разделе [Переменные окружения](#переменные-окружения).

### 5. Миграция базы данных

```bash
cp database/.env.example database/.env
bun db:migrate
```

Воркспейс `database` не читает `backend/.env`, поэтому перед миграциями скопируйте `database/.env.example` в `database/.env` (или экспортируйте `DATASOURCE_URL`) — файл `database/.env` не коммитится.

Схема базы данных описана в `database/src/schema/`, миграции генерируются в `database/migrations/` командой `bun db:generate` после изменения схемы. Если база ранее управлялась Prisma, однократно выполните `bun db:baseline`.

### 6. Запуск

```bash
bun dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- DBX: http://localhost:4224

## Переменные окружения

Файл: `backend/.env` (скопируйте из `backend/.env.example`)

| Переменная                    | Описание                                               | Обязательна                                                   |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `DATASOURCE_URL`              | Строка подключения к PostgreSQL                        | Да                                                            |
| `JWT_SECRET`                  | Секрет для подписи JWT токенов                         | Да                                                            |
| `NODE_ENV`                    | Режим: `production` включает CSP и требует соль Wordle | Нет (`development`)                                           |
| `APP_PORT`                    | Порт backend сервера (по умолчанию: 3000)              | Нет                                                           |
| `CORS_ORIGINS`                | Список разрешённых origin через запятую                | Нет (dev: localhost)                                          |
| `WORDLE_ANSWERS_SALT`         | Соль для выбора слова дня                              | Да в проде (в dev есть небезопасный дефолт)                   |
| `REDIS_URL`                   | Строка подключения к Redis (rate limits)               | Нет (`redis://localhost:6379`)                                |
| `TWITCH_CLIENT_ID`            | Twitch OAuth Client ID                                 | Нет                                                           |
| `TWITCH_CLIENT_SECRET`        | Twitch OAuth Client Secret                             | Нет                                                           |
| `TWITCH_CALLBACK_URL`         | URL callback после Twitch авторизации                  | Да                                                            |
| `KICK_CLIENT_ID`              | Kick OAuth Client ID                                   | Нет                                                           |
| `KICK_CLIENT_SECRET`          | Kick OAuth Client Secret                               | Нет                                                           |
| `KICK_CALLBACK_URL`           | URL callback после Kick авторизации                    | Нет                                                           |
| `TELEGRAM_CLIENT_ID`          | Telegram Login Client ID (OpenID Connect)              | Нет                                                           |
| `TELEGRAM_CLIENT_SECRET`      | Telegram Login Client Secret                           | Нет                                                           |
| `TELEGRAM_OIDC_REDIRECT_URI`  | Backend callback для Telegram OIDC                     | Нет (`http://localhost:3000/api/auth/telegram/oidc/callback`) |
| `TELEGRAM_CALLBACK_URL`       | Frontend-страница после Telegram OIDC                  | Нет (`http://localhost:5173/auth/callback/telegram`)          |
| `TELEGRAM_BOT_TOKEN`          | Bot API token бота для уведомлений                     | Нет                                                           |
| `TELEGRAM_BOT_WEBHOOK_URL`    | Публичный URL вебхука бота                             | Нет                                                           |
| `TELEGRAM_BOT_WEBHOOK_SECRET` | Секрет вебхука (`[A-Za-z0-9_-]{1,256}`)                | Нет                                                           |
| `APP_PUBLIC_URL`              | Публичный URL фронтенда для ссылок в боте              | Нет (`https://le-xot.dev`, dev — `http://localhost:5173`)     |
| `WORDLE_NOTIFY_MORNING`       | Время утреннего напоминания (МСК)                      | Нет (`12:00`)                                                 |
| `WORDLE_NOTIFY_EVENING`       | Время вечернего напоминания (МСК)                      | Нет (`20:00`)                                                 |
| `KINOPOISK_API`               | API ключ Кинопоиска                                    | Нет                                                           |
| `STEAM_API_KEY`               | API ключ Steam                                         | Нет                                                           |
| `STEAM_ID`                    | Steam ID пользователя                                  | Нет                                                           |
| `WEATHER_API_KEY`             | OpenWeatherMap API ключ                                | Нет                                                           |
| `WEATHER_LAT`                 | Широта для погоды                                      | Нет                                                           |
| `WEATHER_LON`                 | Долгота для погоды                                     | Нет                                                           |
| `PROXY`                       | URL прокси для внешних API                             | Нет                                                           |
| `TWIR_API`                    | API ключ для TWIR вебхуков                             | Нет                                                           |
| `S3_ENDPOINT`                 | Endpoint S3-хранилища (RustFS)                         | Нет (default: `http://rustfs:9000`)                           |
| `S3_ACCESS_KEY_ID`            | S3 Access Key                                          | Нет (default: `rustfsadmin`)                                  |
| `S3_SECRET_ACCESS_KEY`        | S3 Secret Key                                          | Нет (default: `rustfsadmin`)                                  |
| `S3_BUCKET_IMAGES`            | Bucket для изображений (default: images)               | Нет                                                           |
| `S3_BUCKET_AVATARS`           | Bucket для аватаров (default: avatars)                 | Нет                                                           |

## Структура проекта

```
games-movies-database/
├── frontend/                  # Vue 3 SPA
│   ├── src/
│   │   ├── assets/            # Глобальные стили, цвета OKLCH, тёмная тема
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── account/       # Модалка «Аккаунт» (ник, аватар, привязки)
│   │   │   ├── dialog/        # Диалоги
│   │   │   ├── form/          # Формы и окно входа (LoginForm, LoginDialog)
│   │   │   ├── layout/        # Layout: сайдбар, мобильная шапка, тело
│   │   │   ├── media/         # DataCards, поиск и фильтры
│   │   │   └── ui/            # shadcn-vue примитивы (НЕ редактировать)
│   │   ├── composables/       # Composables + фабрики для медиа-страниц
│   │   ├── lib/               # Eden-клиент (api.ts), общие типы контракта, cn() утилита
│   │   ├── pages/             # Страницы приложения
│   │   │   ├── admin/         # Панель администратора
│   │   │   ├── anime/         # Трекинг аниме
│   │   │   ├── auth/          # Авторизация и callback
│   │   │   ├── cartoon/       # Трекинг мультфильмов
│   │   │   ├── games/         # Трекинг игр
│   │   │   ├── home/          # Домашняя страница
│   │   │   ├── movie/         # Трекинг фильмов
│   │   │   ├── pc/            # PC-игры
│   │   │   ├── series/        # Трекинг сериалов
│   │   │   ├── stats/         # Статистика кладовки
│   │   │   └── suggestion/    # Предложения контента
│   │   ├── router/            # Vue Router конфигурация
│   │   ├── stores/            # Pinia stores (useUser, модалки и др.) + хелпер useApi
│   │   └── utils/             # Прокси изображений, генерация watch-ссылок
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/                   # Elysia API сервер (Bun)
│   ├── src/
│   │   ├── main.ts            # Точка входа: container → http-сервер → listen
│   │   ├── gateway/           # HTTP/WS-слой: роуты, TypeBox-схемы, auth, лимит
│   │   │   ├── index.ts       # createGateway(deps) + export type App (для Eden)
│   │   │   ├── openapi.ts     # документ через app.handle() — только для контрактных тестов
│   │   │   └── ws.ts          # нативный WebSocket на /ws + мост доменных событий
│   │   ├── server/            # createHttpServer (/api, CORS, статика) + container.ts
│   │   ├── api-types.ts       # Имена доменных типов для фронта (только типы)
│   │   ├── database/          # DrizzleService (pg.Pool + drizzle)
│   │   ├── enums/             # Реэкспорт enum-констант из @gmdb/contract
│   │   ├── utils/             # Валидация окружения (envalid), ошибки, лимиты, DomainEvents
│   │   └── modules/           # Доменные сервисы и репозитории
│   │       ├── auth/          # Twitch/Kick/Telegram OAuth, JWT
│   │       ├── user/          # CRUD пользователей
│   │       ├── record/        # Медиа-записи
│   │       ├── rating/        # Оценки записей
│   │       ├── like/          # Лайки/избранное
│   │       ├── suggestion/    # Предложения контента
│   │       ├── stats/         # Публичная статистика кладовки
│   │       ├── queue/         # Очередь элементов
│   │       ├── twitch/        # Twitch API клиент
│   │       ├── kick/          # Kick API клиент
│   │       ├── telegram/      # Telegram Login (OpenID Connect: PKCE, JWKS)
│   │       ├── websocket/     # Типы WS-событий (транспорт — gateway/ws.ts)
│   │       ├── records-providers/  # Внешние источники метаданных
│   │       ├── img/           # Прокси и ресайз изображений (RustFS/S3)
│   │       ├── avatar/        # Загрузка и обработка аватаров
│   │       ├── s3/            # S3/RustFS хранилище
│   │       ├── twir/          # TWIR вебхуки
│   │       ├── weather/       # Погода (OpenWeatherMap)
│   │       ├── steam/         # Steam Sync
│   │       ├── wordle/        # Игра в слова
│   │       └── limit/         # Лимиты предложений
│   └── package.json
├── contract/                  # @gmdb/contract: enum'ы, WS-события, parseWsMessage
│   └── src/
├── database/                  # Drizzle схема и миграции
│   ├── src/
│   │   ├── schema/            # Схема базы данных (pgTable/pgEnum)
│   │   ├── migrate.ts         # Применение миграций
│   │   └── baseline.ts        # Однократный baseline существующей базы
│   └── migrations/            # Сгенерированные SQL миграции
├── docker-compose.yml         # Продакшен конфигурация (PostgreSQL + Redis + приложение + Traefik)
├── docker-compose.dev.yml     # Dev окружение (PostgreSQL + Redis + RustFS + DBX)
├── Dockerfile                 # Многостадийная сборка (frontend → backend → serve)
├── package.json               # Корневой package.json (workspaces)
├── .oxlintrc.json             # Конфигурация oxlint
├── .oxfmtrc.json              # Конфигурация bun fmt (форматирование и сортировка импортов)
└── .github/workflows/
    ├── checks.yaml            # CI: lint, format, typecheck, тесты + сборка образов
    └── docker.yaml            # CI/CD: сборка в GHCR + SSH-деплой (без git на сервере)
```

## Доступные скрипты

| Команда              | Описание                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| `bun dev`            | Запуск frontend и backend в режиме разработки                             |
| `bun dev:frontend`   | Только frontend (порт 5173)                                               |
| `bun dev:backend`    | Только backend (порт 3000)                                                |
| `bun build`          | Сборка frontend и backend для продакшена                                  |
| `bun build:frontend` | Сборка только frontend                                                    |
| `bun build:backend`  | Сборка только backend                                                     |
| `bun start:backend`  | Запуск backend в продакшене                                               |
| `bun infra:start`    | Dev-инфраструктура (postgres, redis, rustfs)                              |
| `bun infra:stop`     | Остановка dev-инфраструктуры                                              |
| `bun db:generate`    | Генерация SQL миграции из изменений схемы                                 |
| `bun db:migrate`     | Применение миграций к базе данных                                         |
| `bun db:baseline`    | Однократный baseline существующей базы                                    |
| `bun lint`           | Проверка кода oxlint                                                      |
| `bun lint:fix`       | Автоисправление oxlint                                                    |
| `bun format`         | Форматирование (`bun fmt`)                                                |
| `bun format:check`   | Проверка форматирования без изменений                                     |
| `bun typecheck`      | Проверка типов: `bun check -b` (backend, database) + `vue-tsc` (frontend) |
| `bun hooks:install`  | Включить git-хук `.githooks/pre-commit` (`bun fmt --staged`)              |
| `bun test:scripts`   | Тесты скрипта рендера `.env` (render-env.sh)                              |

## Тестирование

| Команда                    | Описание                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| `cd backend && bun test`   | Unit-тесты backend (без БД и внешних сервисов)                              |
| `cd frontend && bun test`  | Unit-тесты frontend (чистые `.ts`: coalescer, parseError, query-keys)       |
| `bun run test:e2e`         | E2E (Playwright, Chromium): гости + админ на изолированных портах 3100/5273 |
| `bun run test:integration` | Интеграционные тесты репозиториев на реальном Postgres (см. ниже)           |

Поведение роутов покрыто тестами в `backend/src/gateway/__tests__/`: конверты ошибок, авторизация, лимиты и коды ответов. Отдельного эталона OpenAPI нет — типы фронта выводятся из тех же схем через Eden, поэтому смена контракта ломает типизацию сама по себе.

Интеграционные тесты используют отдельную БД `lists_test` в dev-контейнере postgres и включаются только явным флагом:

```bash
bun infra:start
RUN_DB_TESTS=1 TEST_DATASOURCE_URL=postgresql://le_xot:abc@127.0.0.1:5432/lists_test \
  bun --filter=./backend run test:integration
```

- Рабочие данные (`lists`) не затрагиваются: guard разрешает только URL с суффиксом `_test`, между тестами таблицы очищаются (`TRUNCATE ... RESTART IDENTITY CASCADE`).
- Схема тестовой БД обновляется миграциями автоматически; при структурном рассинхроне поможет `bun --filter=./backend run test:integration:reset` (пересоздаёт `lists_test`).
- Без `RUN_DB_TESTS=1` интеграционные спеки скипаются, поэтому обычный `bun test` не требует БД.

E2E требует запущенной dev-инфраструктуры (`bun infra:start`): Playwright сам создаёт/мигрирует БД `lists_test`, сеет админа `e2e-admin` и демо-запись и поднимает backend на 3100 и frontend на 5273 (порты 3000/5173 не используются — `bun dev` можно не останавливать). Артефакты прогона — `frontend/test-results` и `frontend/playwright-report` (в `.gitignore`). Набор запускается локально — в GitHub Actions E2E намеренно не добавлен.

## Сторонние интеграции

### Twitch

Авторизация через Twitch OAuth. Позволяет пользователям входить через Twitch аккаунт.

Получение ключей:

1. Перейти в [Twitch Developer Console](https://dev.twitch.tv/console)
2. Создать новое приложение
3. Указать OAuth Redirect URL: `http://localhost:5173/auth/callback`
4. Скопировать Client ID и Client Secret в `.env`

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CALLBACK_URL=http://localhost:5173/auth/callback
```

### Kick

Авторизация через Kick OAuth.

Получение ключей:

1. Перейти в [Kick Developer Portal](https://developer.kick.com/)
2. Создать приложение
3. Указать redirect URL
4. Скопировать Client ID и Client Secret в `.env`

```
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_CALLBACK_URL=http://localhost:3000/api/auth/kick/callback
```

### Telegram

Авторизация через Telegram Login (OpenID Connect, Authorization Code + PKCE). Поддерживаются вход и привязка аккаунта из окна «Аккаунт».

Настройка:

1. Создайте бота в [@BotFather](https://t.me/botfather) и откройте мини-аппу BotFather (`https://t.me/botfather?startapp`).
2. В настройках бота перейдите в **Login Widget** и включите **OpenID Connect Login**.
3. В Redirect URIs (Allowed URLs) добавьте callback: `https://<домен>/api/auth/telegram/oidc/callback`.
4. Скопируйте **Client ID** и **Client Secret** в `.env`.

```
TELEGRAM_CLIENT_ID=your_client_id
TELEGRAM_CLIENT_SECRET=your_client_secret
TELEGRAM_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/telegram/oidc/callback
TELEGRAM_CALLBACK_URL=http://localhost:5173/auth/callback/telegram
```

> Telegram требует HTTPS для redirect URI, поэтому в локальной разработке вход не заработает без HTTPS-туннеля (ngrok, Cloudflare Tunnel или домен с сертификатом). В продакшене используйте `https://<домен>/api/auth/telegram/oidc/callback` и `https://<домен>/auth/callback/telegram`.

### Кинопоиск

API для получения данных о фильмах и сериалах с Кинопоиска.

```
KINOPOISK_API=your_api_key
```

### Steam

Интеграция для импорта библиотеки игр из Steam (админ-раздел).

```
STEAM_API_KEY=your_api_key
STEAM_ID=your_steam_id
```

### OpenWeatherMap

Виджет погоды на главной странице.

1. Создать аккаунт на [OpenWeatherMap](https://openweathermap.org/)
2. Перейти в раздел API keys
3. Сгенерировать новый ключ

```
WEATHER_API_KEY=your_api_key
WEATHER_LAT=your_latitude
WEATHER_LON=your_longitude
```

### Kinobox

Проект использует KinoHub/Kinobox как внешний сервис для просмотра контента по сгенерированным watch-ссылкам.

Поддерживаемые форматы парсера:

- `https://tv.kinohub.vip/movie/<id>`
- `https://tv.kinohub.vip/shikimori/<id>`
- `https://kinobox.in/movie/<id>`
- `https://kinobox.in/shikimori/<id>`

Генерация watch-ссылок возвращает каноничные URL Kinobox: `https://kinobox.in/movie/<id>` или `https://kinobox.in/shikimori/<id>`.

Для смены каноничного хоста обновите `frontend/src/utils/generate-watch-link.ts`.

### TWIR

Вебхуки от внешнего TWIR бота. Защищены API-ключом: `x-api-key` сверяется в `backend/src/utils/api-key.ts` (сравнение в постоянном времени).

```
TWIR_API=your_api_key
```

## Архитектура

### REST API

- Гейтвей монтируется под префиксом `/api` в `backend/src/server/http.ts`; неизвестный путь под `/api` отдаёт JSON-конверт `ApiErrorDto` с 404, а не SPA-фолбэк
- Валидация — TypeBox-схемы на роутах Elysia (`backend/src/gateway/*.ts`); ошибка схемы превращается в конверт ошибки с кодом 400
- Клиент на фронте — Eden Treaty в `frontend/src/lib/api.ts`: типы выводятся из `App` (`import type { App } from '@backend/gateway'`), кодогена нет

### WebSocket

- Нативный WebSocket на Bun по пути `/ws` (`backend/src/gateway/ws.ts`), без Socket.IO
- Серверные сервисы эмитят доменные события через `DomainEvents` (`backend/src/utils/domain-events.ts`)
- `bridgeWsEvents` подписывается на них и публикует кадры `{ event, payload }` всем клиентам одной комнаты
- Фронтенд подключается через `useWebSocket` composable (`frontend/src/composables/use-websocket.ts`) с реконнектом и экспоненциальным бэкоффом
- В dev Vite проксирует `/api` и `/ws` на `localhost:3000`

### База данных

- PostgreSQL 17
- Drizzle ORM: схема в `database/src/schema/`, сгенерированные SQL миграции в `database/migrations/`
- Генерация миграций из схемы — `bun db:generate`, применение — `bun db:migrate`
- В продакшене миграции применяет one-shot сервис `migrations` перед запуском `application`
- Для существующей базы однократно выполните `bun db:baseline` перед первым деплоем
- Enum-константы описаны через `pgEnum` в `database/src/schema/enums.ts`
- DBX доступен на порту `4224` в dev-режиме

### Guards и авторизация

- `requireUser` / `requireRole` — обычные функции-гарды в `backend/src/gateway/auth.ts`: JWT читается из cookie `token`
- API-ключ TWIR — `isApiKeyValid` из `backend/src/utils/api-key.ts` (сравнение в постоянном времени)
- `enforceRateLimit` — кастомный rate limiter на Redis, вызывается внутри роутов. Пресеты `RATE_LIMITS` в `backend/src/utils/rate-limits.ts` (public 1000/мин, auth 5/мин, write 20/мин, like 60/мин, suggestion 20/мин, img 3000/мин, twir 120/мин, wordlePractice 120/мин). Фикс-окно через Lua, ключ `rl:{route}:{ip}`, при недоступности Redis — fail-open. Порядок: лимит → auth → роли

## Деплой

### Docker

```bash
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

### Docker Compose (продакшен)

Продакшен конфигурация в `docker-compose.yml` включает:

- **PostgreSQL 17** с persistent volume
- **Redis** — rate limiting (внутренняя сеть, без внешних портов)
- **RustFS** — S3-совместимое хранилище для изображений
- **DBX** с Traefik reverse proxy (`dbx.le-xot.dev`) — база, Redis и RustFS из одного UI (плагин S3 Browser)
- **migrations** — one-shot сервис: применяет миграции перед запуском `application`
- **Приложение** с Traefik reverse proxy (`le-xot.dev`)

Образы приложения и миграций берутся из GHCR (`ghcr.io/le-xot/games-movies-database:latest`,
`ghcr.io/le-xot/games-movies-database-migrations:latest`) — на сервере ничего не собирается.

Требуется внешняя сеть `traefik-public` (attachable overlay) для Traefik reverse proxy.

### GitHub Actions

При пуше в `master` автоматически:

1. `Checks` — линт, формат, типы, тесты (backend/frontend/integration), drift миграций и job `images`: сборка обоих Docker-образов и smoke-тест приложения
2. `Deploy` (job `build`) — запускается после успешных `Checks` (`workflow_run`), собирает образы приложения и миграций, пушит в GHCR (теги `latest` и `sha-<commit>`, кэш `type=gha`)
3. `Deploy` (job `deploy`) — `docker-compose.yml`, `scripts/render-env.sh` и `scripts/rollback.sh` копируются на сервер по scp; на сервере запоминается id текущего образа в `.rollback-image`, генерируется `.env` из Doppler и выполняется `docker compose pull application migrations && docker compose up -d --remove-orphans`
4. Health check — если `https://le-xot.dev/api/health` не ответил за минуту, автоматически запускается `rollback.sh`: возвращает `:latest` на предыдущий образ и поднимает его заново

Сервер не делает `git pull` и не собирает образы.

### Откат

| Способ            | Как                                                                                                                                            | Время    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Автоматически     | Провал health-check в `Deploy` сам вызывает `scripts/rollback.sh`                                                                              | ~1 мин   |
| Руками на сервере | `cd <DEPLOY_DIR> && bash rollback.sh` — вернёт образ из `.rollback-image`                                                                      | секунды  |
| Через git         | `git revert <merge-commit>` в `master`, CI пересоберёт и выкатит                                                                               | ~5–8 мин |
| По тегу           | `docker tag ghcr.io/le-xot/games-movies-database:sha-<commit> ghcr.io/le-xot/games-movies-database:latest && docker compose up -d application` | минуты   |

Точку возврата можно сохранить заранее:

```bash
docker buildx imagetools inspect ghcr.io/le-xot/games-movies-database:latest | head -3
```

Ограничения: откатывается только `application`. Образ `migrations` — one-shot, и
если схема БД уже уехала вперёд, откат кода её не отменит: сначала откат
миграции, потом приложение. `rollback.sh` в этом случае честно сообщит, что
приложение не поднялось, вместо тихой поломки.

Для настройки CI/CD добавьте секреты в GitHub:

- `SERVER_HOST` — адрес сервера
- `SERVER_USER` — SSH пользователь
- `SERVER_SSH_KEY` — SSH приватный ключ

Прод-секреты живут в Doppler (проект `games-movies-database`, конфиг `prd`):

- на сервере установлен Doppler CLI, read-only service token лежит в `~/.config/gmd/secrets.env` (chmod 600)
- `bash render-env.sh` (запускать из директории compose) рендерит `.env`; руками `.env` не правится — следующий деплой перезапишет
- смена провайдера (например, на Infisical) — ветка `case` в `scripts/render-env.sh` + `INFISICAL_TOKEN`/`INFISICAL_PROJECT_ID`/`INFISICAL_ENV` в `secrets.env`
- деплой тянет образы из GHCR анонимно (на сервере нет `docker login`) — пакеты должны оставаться публично доступными; если закроешь, добавь `docker login ghcr.io` на сервер

Откат: коммит-реверт в `master` — CI пересоберёт и выкатит заново. Быстро на сервере: предыдущий образ ещё неделю остаётся в `docker image ls -a` (dangling) — `docker image tag <IMAGE_ID> ghcr.io/le-xot/games-movies-database:latest && docker compose up -d`.

## Контрибьютинг

- Все PR — в новую ветку
- Следуйте конфигурации oxlint/bun fmt для стиля кода
- Используйте TypeScript для всего нового кода
- На фронтенде — Vue 3 Composition API (`<script setup lang="ts">`)
- Именование: `.vue` файлы — PascalCase, `.ts` файлы — kebab-case
- Иконки: только @lucide/vue и vue3-simple-icons
- Типы API выводятся из Elysia-роутов (Eden) — отдельного файла с контрактом нет

## Troubleshooting

| Проблема                       | Решение                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Не подключается к БД           | Проверьте, что контейнер PostgreSQL запущен: `docker ps`                                                                 |
| Ошибки авторизации             | Проверьте Twitch/Kick API ключи в `.env`                                                                                 |
| Сервисы недоступны             | Проверьте порты: frontend 5173, backend 3000, БД 5432 (dev/prod)                                                         |
| Bun не установлен              | Используйте npm/pnpm как альтернативу                                                                                    |
| Ошибки TypeScript              | Выполните `bun install` и убедитесь, что все зависимости установлены                                                     |
| Ошибки миграций базы данных    | Выполните `bun db:migrate`, проверьте `database/migrations/`                                                             |
| Rate limits перестали работать | Проверьте, что Redis запущен (`bun infra:start`): при недоступном Redis лимиты отключаются (fail-open), но сайт работает |
| S3 ошибки (InvalidAccessKeyId) | Убедитесь что `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` совпадают с `RUSTFS_ACCESS_KEY`/`RUSTFS_SECRET_KEY` в `.env`     |
| Bucket не найден               | Создайте bucket через DBX: подключение `RustFS (dev)` (плагин S3 Browser)                                                |
