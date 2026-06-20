# Games Movies Database

Полнофункциональное веб-приложение для трекинга медиа: игры, аниме, фильмы, мультфильмы, сериалы и PC-игры. Авторизация через Twitch и Kick, интеграция со Spotify, реал-тайм обновления через WebSocket.

## Возможности

- **Трекинг медиа** — учёт игр, аниме, фильмов, мультфильмов, сериалов и PC-игр со статусами и оценками
- **Авторизация** — OAuth через Twitch и Kick, JWT в httpOnly cookie
- **Spotify** — интеграция с Spotify API, очередь треков
- **Реал-тайм** — мгновенные обновления интерфейса через Socket.IO
- **Система предложений** — пользователи предлагают новый контент для добавления
- **Аукцион** — управление аукционами в реальном времени
- **Система очередей** — управление очередью элементов
- **Лайки** — избранное с каскадным удалением
- **Профиль** — управление аккаунтом, привязка/отвязка провайдеров, удаление аккаунта
- **Админка** — панель администрирования
- **Прокси изображений** — ресайз через Sharp, проксирование через `/api/img`
- **Генерация watch-ссылок** — автоматические ссылки на Kinobox для просмотра
- **Погода** — виджет погоды через OpenWeatherMap
- **TWIR** — вебхуки от внешнего бота с защитой API-ключом

## Стек технологий

| Слой           | Технологии                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Vue 3, Vite, TypeScript, Tailwind CSS 4, shadcn-vue, Pinia, Socket.IO Client, @tanstack/vue-table, vee-validate + zod |
| Backend        | NestJS, Prisma ORM, PostgreSQL, Socket.IO, Sharp, JWT                                                                 |
| Инфраструктура | Docker, Bun, Caddy (reverse proxy), GitHub Actions                                                                    |

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

### 3. Запуск PostgreSQL

```bash
docker compose -f docker-compose-dev.yml up -d
```

Это поднимет PostgreSQL на порту `5432` и Adminer на порту `54321`.

### 4. Настройка окружения

```bash
cp backend/.env.example backend/.env
```

Отредактируйте `backend/.env` — как минимум заполните `JWT_SECRET`. Остальные переменные описаны в разделе [Переменные окружения](#переменные-окружения).

### 5. Миграция базы данных

```bash
cd backend
bun prisma generate
bun prisma migrate dev
```

### 6. Запуск

```bash
bun dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/docs
- Scalar API Reference: http://localhost:3000/reference
- Adminer: http://localhost:54321

## Переменные окружения

Файл: `backend/.env` (скопируйте из `backend/.env.example`)

| Переменная              | Описание                                  | Обязательна |
| ----------------------- | ----------------------------------------- | ----------- |
| `DATASOURCE_URL`        | Строка подключения к PostgreSQL           | Да          |
| `JWT_SECRET`            | Секрет для подписи JWT токенов            | Да          |
| `APP_PORT`              | Порт backend сервера (по умолчанию: 3000) | Нет         |
| `TWITCH_CLIENT_ID`      | Twitch OAuth Client ID                    | Нет         |
| `TWITCH_CLIENT_SECRET`  | Twitch OAuth Client Secret                | Нет         |
| `TWITCH_CALLBACK_URL`   | URL callback после Twitch авторизации     | Нет         |
| `KICK_CLIENT_ID`        | Kick OAuth Client ID                      | Нет         |
| `KICK_CLIENT_SECRET`    | Kick OAuth Client Secret                  | Нет         |
| `KICK_CALLBACK_URL`     | URL callback после Kick авторизации       | Нет         |
| `SPOTIFY_CLIENT_ID`     | Spotify Client ID                         | Нет         |
| `SPOTIFY_CLIENT_SECRET` | Spotify Client Secret                     | Нет         |
| `SPOTIFY_CALLBACK_URL`  | URL callback после Spotify авторизации    | Нет         |
| `KINOPOISK_API`         | API ключ Кинопоиска                       | Нет         |
| `TMBD_API`              | API ключ TMDB                             | Нет         |
| `WEATHER_API_KEY`       | OpenWeatherMap API ключ                   | Нет         |
| `WEATHER_LAT`           | Широта для погоды                         | Нет         |
| `WEATHER_LON`           | Долгота для погоды                        | Нет         |
| `PROXY`                 | URL прокси для внешних API                | Нет         |
| `TWIR_API`              | API ключ для TWIR вебхуков                | Нет         |

## Структура проекта

```
games-movies-database/
├── frontend/                  # Vue 3 SPA
│   ├── src/
│   │   ├── assets/            # Глобальные стили, цвета OKLCH, тёмная тема
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── dialog/        # Диалоги
│   │   │   ├── form/          # Формы
│   │   │   ├── layout/        # Layout компоненты (шапка, тело, БД)
│   │   │   ├── record/        # Форма создания записи
│   │   │   ├── table/         # DataTable, фильтры, пагинация, поиск
│   │   │   └── ui/            # shadcn-vue примитивы (НЕ редактировать)
│   │   ├── composables/       # Composables + фабрики для медиа-страниц
│   │   ├── lib/               # API клиент (авто-генерируется), cn() утилита
│   │   ├── pages/             # Страницы приложения
│   │   │   ├── admin/         # Панель администратора
│   │   │   ├── anime/         # Трекинг аниме
│   │   │   ├── auction/       # Аукцион
│   │   │   ├── auth/          # Авторизация и callback
│   │   │   ├── cartoon/       # Трекинг мультфильмов
│   │   │   ├── games/         # Трекинг игр
│   │   │   ├── home/          # Домашняя страница
│   │   │   ├── movie/         # Трекинг фильмов
│   │   │   ├── pc/            # PC-игры
│   │   │   ├── profile/       # Профиль пользователя
│   │   │   ├── series/        # Трекинг сериалов
│   │   │   └── suggestion/    # Предложения контента
│   │   ├── router/            # Vue Router конфигурация
│   │   ├── stores/            # Pinia stores (useApi, useUser, и др.)
│   │   └── utils/             # Прокси изображений, генерация watch-ссылок
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                   # NestJS API сервер
│   ├── src/
│   │   ├── main.ts            # Точка входа, Swagger, CORS, cookieParser
│   │   ├── app.module.ts      # Корневой модуль
│   │   ├── database/          # PrismaModule + PrismaService
│   │   ├── enums/             # Константы для Prisma enum
│   │   ├── utils/             # Валидация окружения (envalid)
│   │   └── modules/           # Фича-модули
│   │       ├── auth/          # Twitch/Kick OAuth, JWT, guards
│   │       ├── user/          # CRUD пользователей
│   │       ├── record/        # Медиа-записи
│   │       ├── like/          # Лайки/избранное
│   │       ├── suggestion/    # Предложения контента
│   │       ├── auction/       # Аукцион
│   │       ├── queue/         # Очередь элементов
│   │       ├── spotify/       # Spotify интеграция
│   │       ├── twitch/        # Twitch API клиент
│   │       ├── kick/          # Kick API клиент
│   │       ├── websocket/     # Socket.IO gateway
│   │       ├── records-providers/  # Внешние источники метаданных
│   │       ├── img/           # Прокси и ресайз изображений (Sharp)
│   │       ├── twir/          # TWIR вебхуки
│   │       ├── weather/       # Погода (OpenWeatherMap)
│   │       ├── jwt/           # CustomJwtModule обёртка
│   │       └── limit/         # Rate limiting
│   ├── prisma/
│   │   ├── schema.prisma      # Схема базы данных
│   │   └── migrations/        # Миграции Prisma
│   └── package.json
├── docker-compose.yml         # Продакшен конфигурация (PostgreSQL + приложение + Caddy)
├── docker-compose-dev.yml     # Dev окружение (PostgreSQL + Adminer)
├── Dockerfile                 # Многостадийная сборка (frontend → backend → serve)
├── package.json               # Корневой package.json (workspaces)
├── .oxlintrc.json             # Конфигурация oxlint
├── .oxfmtrc.json              # Конфигурация oxfmt
└── .github/workflows/
    └── docker.yaml            # CI/CD: SSH deploy на push в master
```

## Доступные скрипты

| Команда              | Описание                                      |
| -------------------- | --------------------------------------------- |
| `bun dev`            | Запуск frontend и backend в режиме разработки |
| `bun dev:frontend`   | Только frontend (порт 5173)                   |
| `bun dev:backend`    | Только backend (порт 3000)                    |
| `bun build`          | Сборка frontend и backend для продакшена      |
| `bun build:frontend` | Сборка только frontend                        |
| `bun build:backend`  | Сборка только backend                         |
| `bun start:backend`  | Запуск backend в продакшене                   |
| `bun prisma`         | Миграции + генерация Prisma клиента           |
| `bun lint`           | Проверка кода oxlint                          |
| `bun lint:fix`       | Автоисправление oxlint                        |
| `bun format`         | Форматирование oxfmt                          |
| `bun format:check`   | Проверка форматирования без изменений         |

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

### Spotify

Интеграция со Spotify API для работы с треками и очередью.

Получение ключей:

1. Перейти в [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создать новое приложение
3. Указать Redirect URI: `http://127.0.0.1:5173/auth/callback/spotify`
4. Скопировать Client ID и Client Secret в `.env`

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_CALLBACK_URL=http://127.0.0.1:5173/auth/callback/spotify
```

### Кинопоиск

API для получения данных о фильмах и сериалах с Кинопоиска.

```
KINOPOISK_API=your_api_key
```

### TMDB

API для получения данных о фильмах и сериалах с The Movie Database.

```
TMBD_API=your_api_key
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

Вебхуки от внешнего TWIR бота. Защищены API-ключом через `ApikeyGuard`.

```
TWIR_API=your_api_key
```

## Архитектура

### REST API

- Все маршруты автоматически префиксуются `/api`
- Глобальная валидация через `ValidationPipe` с `transform: true` и `whitelist: true`
- Swagger UI: http://localhost:3000/docs
- Scalar API Reference: http://localhost:3000/reference
- API клиент на фронте **авто-генерируется** из Swagger спецификации при запуске dev-сервера (НЕ редактировать `frontend/src/lib/api.ts`)

### WebSocket

- Socket.IO для реал-тайм обновлений
- Серверные модули отправляют события через `EventEmitter2`
- `WebsocketModule` слушает события и пушит обновления на клиент
- Фронтенд подключается через `useWebSocket` composable

### База данных

- PostgreSQL 17
- Prisma ORM с миграциями
- Модели используют `@@map()` для имён таблиц
- Enum константы в `backend/src/enums/enums.names.ts`
- Adminer доступен на порту `54321` в dev-режиме

### Guards и авторизация

- `AuthGuard` — JWT валидация (cookie `token`)
- `ApikeyGuard` — защита TWIR эндпоинтов по API-ключу
- `RolesGuard` — ролевой доступ
- `ThrottlerGuard` — rate limiting (60 запросов / 60 секунд)

## Деплой

### Docker

```bash
docker build -t games-movies-database .
docker run -p 3000:3000 --env-file .env games-movies-database
```

### Docker Compose (продакшен)

Продакшен конфигурация в `docker-compose.yml` включает:

- **PostgreSQL 17** с persistent volume
- **Adminer** с Caddy reverse proxy (`adminer.le-xot.dev`)
- **Приложение** с Caddy reverse proxy (`le-xot.dev`)

Требуется внешняя сеть `caddy` для Caddy reverse proxy.

### GitHub Actions

При пуше в `master` автоматически:

1. SSH подключение к серверу
2. `git fetch` и `git reset --hard origin/master`
3. `docker compose up -d --build --remove-orphans`

Для настройки CI/CD добавьте секреты в GitHub:

- `SERVER_HOST` — адрес сервера
- `SERVER_USER` — SSH пользователь
- `SERVER_SSH_KEY` — SSH приватный ключ

## Контрибьютинг

- Все PR — в новую ветку
- Следуйте конфигурации oxlint/oxfmt для стиля кода
- Используйте TypeScript для всего нового кода
- На фронтенде — Vue 3 Composition API (`<script setup lang="ts">`)
- Именование: `.vue` файлы — PascalCase, `.ts` файлы — kebab-case
- Иконки: только lucide-vue-next и vue3-simple-icons
- API клиент (`frontend/src/lib/api.ts`) **авто-генерируется** — не редактировать вручную

## Troubleshooting

| Проблема                          | Решение                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- |
| Не подключается к БД              | Проверьте, что контейнер PostgreSQL запущен: `docker ps`                      |
| Ошибки авторизации                | Проверьте Twitch/Kick API ключи в `.env`                                      |
| Сервисы недоступны                | Проверьте порты: frontend 5173, backend 3000, БД 6543 (dev) / 5432 (prod)     |
| Bun не установлен                 | Используйте npm/pnpm как альтернативу                                         |
| Ошибки TypeScript                 | Выполните `bun install` и убедитесь, что все зависимости установлены          |
| Фронтенд не генерирует API клиент | Убедитесь, что backend запущен на порту 3000 (генерация идёт из `/docs-json`) |
| Prisma ошибки миграций            | Выполните `cd backend && bun prisma migrate dev`                              |
