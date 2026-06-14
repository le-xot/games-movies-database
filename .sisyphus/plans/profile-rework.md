# Переработка страницы профиля + Issue #195

## TL;DR

> **Quick Summary**: Полная переработка страницы профиля — рефакторинг монолитного ProfilePage.vue в модульную структуру (thin wrapper + composables + sub-components), добавление маршрутизации `/db/profile/:login`, шапки профиля со статистикой, 5 категорийных табов, и кликабельных аватарок по всему приложению.
>
> **Deliverables**:
> - Новый backend-эндпоинт статистики профиля (`GET /users/profile/:login`)
> - Переработанная страница профиля с модульной архитектурой
> - Маршруты `/db/profile` (свой) и `/db/profile/:login` (чужой)
> - Шапка профиля (аватар + логин) + блок статистики
> - 5 табов по категориям (фильмы, сериалы, аниме, мультфильмы, игры)
> - Кликабельные аватарки в AuctionCard, SuggestionCard, QueueCard, AdminPage
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 7 → Task 8 → F1-F4

---

## Context

### Original Request
Переработать страницу "Мой профиль" — и дизайн, и функциональность, и кодовую базу. Совместить с issue #195 (кликабельные аватарки → навигация в профиль пользователя).

### Interview Summary
**Key Discussions**:
- **Маршрутизация**: Отдельный URL `/db/profile/:login` для каждого пользователя; `/db/profile` без параметра = свой профиль
- **Селектор пользователей**: Убрать (заменяется маршрутизацией)
- **Контент**: То же содержимое (предложения), но красивее + статистика
- **Статистика**: Количество предложений по категориям, средняя оценка, количество лайков
- **Разделение**: 5 табов по жанрам (фильмы, сериалы, аниме, мультфильмы, игры) вместо 2 групп
- **Шапка**: Минималистичная — аватар + login, статистика отдельным блоком
- **Аватарки**: Везде кликабельные (кроме LoginForm — остаётся dropdown)
- **Доступ**: Только авторизованные пользователи

**Research Findings**:
- ProfilePage.vue — 352 строки, монолитный файл с дублированием карточек (~70 строк × 2)
- Все остальные страницы — thin wrappers (AnimePage.vue = 7 строк)
- Аватарки найдены в 5 местах: LoginForm (кликабельна), AuctionCard, SuggestionCard, QueueCard, AdminPage (все не кликабельны)
- Нет папок components/ и composables/ в profile/
- Backend getUserRecords возвращает ВСЕ записи пользователя (не только suggestions)
- genreTags в use-table-select.ts НЕ содержит GAME

### Metis Review
**Identified Gaps** (addressed):
- **Backend route conflict**: Существующие `@Get(':id')` и `@Get(':login')` в user.controller.ts конфликтуют. Решение: использовать путь `/users/profile/:login` для нового эндпоинта
- **RecordType vs RecordGenre семантика**: Профиль показывает ВСЕ записи пользователя (не только suggestions). Решение: статистика и карточки показывают все записи по жанрам
- **genreTags не содержит GAME**: Нужно добавить GAME в genreTags или создать отдельную структуру для табов. Решение: добавить GAME в genreTags
- **Профиль несуществующего пользователя**: Решение: 404 на бэке, «пользователь не найден» на фронте
- **LoginForm avatar**: Решение: НЕ менять на RouterLink, оставить dropdown (в нём уже есть пункт «Профиль»)
- **Grade enum без числового маппинга**: Для «средней оценки» показывать распределение (сколько DISLIKE/BEER/LIKE/RECOMMEND), не среднее число

---

## Work Objectives

### Core Objective
Переработать страницу профиля из монолитного компонента в модульную структуру, добавить персональные URL-маршруты, шапку со статистикой, категорийные табы, и сделать аватарки кликабельными по всему приложению.

### Concrete Deliverables
- `backend/src/modules/user/user.service.ts` — метод `getUserProfileStats(login)`
- `backend/src/modules/user/user.controller.ts` — эндпоинт `GET /users/profile/:login`
- `backend/src/modules/user/profile-stats.entity.ts` — response DTO
- `frontend/src/pages/profile/ProfilePage.vue` — thin wrapper (≤10 строк)
- `frontend/src/pages/profile/components/ProfilePageContent.vue` — основной контент
- `frontend/src/pages/profile/components/ProfileRecordCard.vue` — карточка записи
- `frontend/src/pages/profile/components/ProfileHeader.vue` — шапка профиля
- `frontend/src/pages/profile/components/ProfileStatsBlock.vue` — блок статистики
- `frontend/src/pages/profile/composables/use-profile.ts` — composable для данных
- `frontend/src/router/router-paths.ts` — обновлённые пути
- `frontend/src/router/router.ts` — маршрут с опциональным `:login`
- Обновлённые `AuctionCard.vue`, `SuggestionCard.vue`, `QueueCard.vue`, `AdminPage.vue` — кликабельные аватарки

### Definition of Done
- [ ] `bun build` (root) — успешная сборка без ошибок
- [ ] `bun lint` — 0 новых ошибок линтера
- [ ] `bun format:check` — форматирование соответствует стандарту
- [ ] `/db/profile` — отображает профиль текущего пользователя
- [ ] `/db/profile/:login` — отображает профиль указанного пользователя
- [ ] `/db/profile/nonexistent` — показывает состояние «пользователь не найден»
- [ ] Все аватарки (кроме LoginForm) кликабельны и ведут на профиль

### Must Have
- Thin wrapper ProfilePage.vue (≤10 строк), как AnimePage/GamesPage
- Composable use-profile.ts для логики загрузки данных
- Отдельный компонент ProfileRecordCard.vue (без дублирования)
- 5 табов по жанрам (MOVIE, SERIES, ANIME, CARTOON, GAME)
- Шапка профиля с аватаром и логином
- Блок статистики (количество по категориям, распределение оценок, лайки)
- Backend эндпоинт для статистики по отдельному пути `/users/profile/:login`
- Обработка 404 для несуществующих пользователей
- Кликабельные аватарки через RouterLink в 4 компонентах

### Must NOT Have (Guardrails)
- НЕ редактировать `frontend/src/lib/api.ts` — автогенерируемый файл
- НЕ исправлять существующий конфликт маршрутов `:id`/`:login` в user.controller.ts
- НЕ удалять `@UseGuards()` на `getAllUsers`
- НЕ добавлять пагинацию к записям профиля
- НЕ добавлять поиск/фильтрацию внутри табов профиля
- НЕ добавлять WebSocket-обновления для профиля
- НЕ добавлять редактирование профиля
- НЕ создавать общий компонент `UserAvatar` — RouterLink inline в каждом месте
- НЕ менять сигнатуру/поведение существующего `getUserRecords`
- НЕ создавать отдельный NestJS-модуль для статистики
- НЕ добавлять новые npm/bun-зависимости
- НЕ менять LoginForm.vue avatar на RouterLink (оставить dropdown)
- НЕ добавлять жанро-специфичную логику в ProfileRecordCard.vue

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (проект без тестовой инфраструктуры)
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Build**: Use Bash — Run build/lint/format commands, assert exit codes

### Auth Setup for QA (CRITICAL — used by Tasks 1, 7, 8, F3)

Auth requires a valid JWT cookie (`token`). Twitch OAuth cannot be faked via curl — you MUST craft a JWT directly.

**Step-by-step auth cookie creation:**

1. Read `JWT_SECRET` and `TWITCH_ADMIN_ID` from `backend/.env`:
   ```bash
   source backend/.env
   echo "JWT_SECRET=$JWT_SECRET"
   echo "TWITCH_ADMIN_ID=$TWITCH_ADMIN_ID"
   ```

2. Sign a JWT token using `bun` inline script:
   ```bash
   JWT_TOKEN=$(cd backend && bun -e "
     const jwt = require('jsonwebtoken');
     const token = jwt.sign({ id: process.env.TWITCH_ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
     console.log(token);
   ")
   echo "JWT_TOKEN=$JWT_TOKEN"
   ```

3. **For curl (backend QA)**: Use as cookie header:
   ```bash
   curl -b "token=$JWT_TOKEN" http://localhost:3000/api/users/profile/{login} -s
   ```

4. **For Playwright (frontend QA)**: Set cookie in browser context before navigating:
   ```javascript
   await context.addCookies([{
     name: 'token',
     value: JWT_TOKEN,
     domain: 'localhost',
     path: '/',
   }])
   ```

**Admin user login**: Read from `TWITCH_ADMIN_LOGIN` env var — this is the login to use for "own profile" QA.

**Second user for "other profile" QA**: The seed only creates the admin user. For Tasks 7 and 8 QA scenarios that need a second user, create one via Prisma before testing:
```bash
cd backend && bun -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.user.upsert({
    where: { id: 'test-user-qa-001' },
    update: {},
    create: {
      id: 'test-user-qa-001',
      login: 'qa_test_user',
      role: 'USER',
      profileImageUrl: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png'
    }
  });
  await prisma.\$disconnect();
  console.log('QA test user created: qa_test_user');
"
```
This user can be used for testing `/db/profile/qa_test_user` (other user's profile with empty records).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Backend — endpoint статистики профиля [unspecified-high]
├── Task 2: Frontend — утилиты и подготовка (date formatter, genreTags fix) [quick]

⚠️ BETWEEN WAVES: После завершения Task 1, ОБЯЗАТЕЛЬНО регенерировать frontend API-клиент:
   1. Убедиться что backend dev сервер запущен (bun dev:backend)
   2. Перезапустить frontend dev: остановить и запустить `bun dev:frontend`
      ИЛИ вызвать generateApi напрямую:
      ```bash
      cd frontend && bun -e "
        const { generateApi } = require('swagger-typescript-api');
        const { fileURLToPath } = require('url');
        const path = require('path');
        await generateApi({
          name: 'api.ts',
          url: 'http://localhost:3000/docs-json',
          output: path.resolve(__dirname, 'src/lib'),
          generateClient: true,
          httpClientType: 'fetch',
          singleHttpClient: true,
          extractEnums: true,
        });
        console.log('API client regenerated');
      "
      ```
   3. После регенерации в `frontend/src/lib/api.ts` появятся:
      - Тип `ProfileStatsEntity` (с полями totalRecords, recordsByGenre, gradeDistribution, totalLikesReceived)
      - Метод в Api.users: `userControllerGetUserProfileStats(login: string, ...)` (или аналог — точное имя зависит от swagger-typescript-api, проверить в сгенерированном файле по запросу grep "profile" frontend/src/lib/api.ts)
   4. Task 3 и Task 6 должны использовать ФАКТИЧЕСКОЕ имя сгенерированного метода из api.ts, а не захардкоженное

Wave 2 (After Wave 1 + API regeneration — core refactoring, MAX PARALLEL):
├── Task 3: Frontend — composable use-profile.ts [unspecified-high]
├── Task 4: Frontend — компонент ProfileRecordCard.vue [quick]
├── Task 5: Frontend — routing /db/profile/:login [quick]

Wave 3 (After Wave 2 — integration + features):
├── Task 6: Frontend — ProfileHeader + ProfileStatsBlock [visual-engineering]
├── Task 7: Frontend — ProfilePageContent + ProfilePage (сборка) [visual-engineering]
├── Task 8: Frontend — кликабельные аватарки по всему приложению [quick]
├── Task 9: Финальная проверка — lint, format, build [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 3, 6 | 1 |
| 2 | — | 3, 4, 6, 7 | 1 |
| 3 | 1, 2 | 7 | 2 |
| 4 | 2 | 7 | 2 |
| 5 | — | 7 | 2 |
| 6 | 1, 2 | 7 | 3 |
| 7 | 3, 4, 5, 6 | 8, 9 | 3 |
| 8 | 5 | 9 | 3 |
| 9 | 7, 8 | F1-F4 | 3 |

### Agent Dispatch Summary

- **Wave 1**: **2 tasks** — T1 → `unspecified-high`, T2 → `quick`
- **Wave 2**: **3 tasks** — T3 → `unspecified-high`, T4 → `quick`, T5 → `quick`
- **Wave 3**: **4 tasks** — T6 → `visual-engineering`, T7 → `visual-engineering`, T8 → `quick`, T9 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Backend — эндпоинт статистики профиля

  **What to do**:
  - Создать файл `backend/src/modules/user/profile-stats.entity.ts` — response DTO с декораторами `@ApiProperty`. Структура:
    ```
    ProfileStatsEntity {
      totalRecords: number
      recordsByGenre: { genre: string, count: number }[]
      gradeDistribution: { grade: string, count: number }[]
      totalLikesReceived: number
    }
    ```
  - В `backend/src/modules/user/user.service.ts` добавить метод `getUserProfileStats(login: string)`:
    - Prisma `findUnique` для проверки существования пользователя (throw NotFoundException если нет)
    - Prisma `groupBy` на records по genre с `where: { user: { login } }` для подсчёта по категориям
    - Prisma `groupBy` на records по grade с `where: { user: { login } }` для распределения оценок
    - Prisma `count` на likes с `where: { record: { user: { login } } }` для общего количества лайков
    - Prisma `count` на records с `where: { user: { login } }` для общего количества записей
  - В `backend/src/modules/user/user.controller.ts` добавить эндпоинт:
    - `@Get('profile/:login')` — ВАЖНО: разместить ВЫШЕ существующих `@Get(':id')` и `@Get(':login')` чтобы NestJS не перехватил маршрут
    - Декораторы: `@UseGuards(AuthGuard)`, `@ApiResponse({ type: ProfileStatsEntity })`
    - Вызывает `userService.getUserProfileStats(login)`

  **Must NOT do**:
  - НЕ менять существующие эндпоинты/маршруты
  - НЕ исправлять конфликт `:id`/`:login` маршрутов
  - НЕ создавать новый NestJS-модуль

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend бизнес-логика с Prisma-запросами и NestJS-контроллером
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: Не нужен — чисто серверная задача

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `backend/src/modules/user/user.controller.ts` — все существующие эндпоинты, декораторы, guards. ВАЖНО: новый `@Get('profile/:login')` должен быть ВЫШЕ `@Get(':id')` (строка ~70) чтобы NestJS не перехватил 'profile' как id
  - `backend/src/modules/user/user.service.ts:69-73` — существующий `getUserRecords` метод как паттерн для Prisma-запросов с `where: { user: { login } }`
  - `backend/src/modules/user/user.entity.ts` — паттерн response DTO с `@ApiProperty` декораторами
  - `backend/src/modules/user/user.dto.ts` — паттерн DTO-валидации

  **API/Type References**:
  - `backend/prisma/schema.prisma` — модели User, Record, Like и связи между ними. User.login — уникальное поле
  - `backend/src/modules/auth/auth.guard.ts` — AuthGuard который нужно использовать

  **External References**:
  - Prisma groupBy: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#groupby

  **WHY Each Reference Matters**:
  - user.controller.ts — нужно понять порядок маршрутов и где вставить новый, чтобы избежать конфликтов
  - user.service.ts getUserRecords — показывает как делать Prisma-запросы по login пользователя
  - schema.prisma — нужно для правильного составления groupBy/count запросов (знать названия моделей и полей)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Happy path — получение статистики существующего пользователя
    Tool: Bash (curl)
    Preconditions: Dev сервер запущен (bun dev:backend), admin user seeded
    Steps:
      1. Создать JWT-куку (см. раздел "Auth Setup for QA" выше):
         source backend/.env
         JWT_TOKEN=$(cd backend && bun -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: process.env.TWITCH_ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '1h' }));")
      2. ADMIN_LOGIN=$TWITCH_ADMIN_LOGIN
      3. curl -b "token=$JWT_TOKEN" http://localhost:3000/api/users/profile/$ADMIN_LOGIN -s -o response.json -w '%{http_code}'
      4. Проверить HTTP-код = 200
      5. jq '.totalRecords' response.json — число ≥ 0
      6. jq '.recordsByGenre | length' response.json — массив
      7. jq '.gradeDistribution | length' response.json — массив
      8. jq '.totalLikesReceived' response.json — число ≥ 0
    Expected Result: 200 OK, JSON с полями totalRecords, recordsByGenre, gradeDistribution, totalLikesReceived
    Failure Indicators: HTTP != 200, отсутствие полей в JSON, ошибка Prisma
    Evidence: .sisyphus/evidence/task-1-stats-happy-path.json

  Scenario: 401 — запрос без авторизации
    Tool: Bash (curl)
    Preconditions: Dev сервер запущен
    Steps:
      1. curl http://localhost:3000/api/users/profile/any_login -s -w '%{http_code}'
      2. Проверить HTTP-код = 401
    Expected Result: 401 Unauthorized
    Failure Indicators: HTTP = 200 или 500
    Evidence: .sisyphus/evidence/task-1-stats-401.txt

  Scenario: 404 — несуществующий пользователь
    Tool: Bash (curl)
    Preconditions: Dev сервер запущен, JWT_TOKEN создан (см. шаг 1 happy path)
    Steps:
      1. curl -b "token=$JWT_TOKEN" http://localhost:3000/api/users/profile/nonexistent_user_12345 -s -w '%{http_code}'
      2. Проверить HTTP-код = 404
    Expected Result: 404 Not Found
    Failure Indicators: HTTP = 200 или 500
    Evidence: .sisyphus/evidence/task-1-stats-404.txt

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. Проверить exit code = 0
    Expected Result: Сборка без ошибок
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add profile stats endpoint`
  - Files: `backend/src/modules/user/user.service.ts`, `backend/src/modules/user/user.controller.ts`, `backend/src/modules/user/profile-stats.entity.ts`
  - Pre-commit: `cd backend && bun run build`

- [x] 2. Frontend — утилиты и подготовка

  **What to do**:
  - Создать файл `frontend/src/utils/date.ts`:
    ```typescript
    export function formatDate(date: string | Date, locale = 'ru-RU'): string {
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
    ```
  - В `frontend/src/components/table/composables/use-table-select.ts` добавить запись `GAME` в `genreTags` (если её нет). Посмотреть существующую структуру genreTags и добавить по аналогии с MOVIE/SERIES/ANIME/CARTOON.

  **Must NOT do**:
  - НЕ менять логику существующих genreTags записей
  - НЕ добавлять новые зависимости

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Небольшие изменения в 2 файлах
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/components/table/composables/use-table-select.ts` — существующая структура genreTags с записями MOVIE, SERIES, ANIME, CARTOON. Нужно добавить GAME по тому же паттерну (name, label, class)
  - `frontend/src/pages/profile/ProfilePage.vue:231-236` — текущий inline date formatting который будет заменён на утилиту

  **API/Type References**:
  - `frontend/src/lib/api.ts` — enum RecordGenre содержит GAME. Проверить точное имя

  **WHY Each Reference Matters**:
  - use-table-select.ts — нужно знать точную структуру genreTags чтобы добавить GAME в том же формате
  - ProfilePage.vue — показывает какой формат даты используется сейчас, чтобы утилита воспроизвела его точно

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Lint and build check
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. bun lint
    Expected Result: exit code 0 для обоих
    Evidence: .sisyphus/evidence/task-2-build.txt

  Scenario: genreTags includes GAME
    Tool: Bash (bun/node REPL or grep)
    Steps:
      1. grep -n "GAME" frontend/src/components/table/composables/use-table-select.ts
      2. Убедиться что GAME присутствует в genreTags
    Expected Result: Строка с GAME найдена в genreTags
    Evidence: .sisyphus/evidence/task-2-genre-tags.txt
  ```

  **Commit**: YES (groups with Task 3/4)
  - Message: `refactor(frontend): extract date utility and add GAME to genreTags`
  - Files: `frontend/src/utils/date.ts`, `frontend/src/components/table/composables/use-table-select.ts`
  - Pre-commit: `bun lint`

- [x] 3. Frontend — composable use-profile.ts

  **What to do**:
  - Создать файл `frontend/src/pages/profile/composables/use-profile.ts`
  - Composable принимает `login: Ref<string | undefined>` (из route param)
  - Внутри:
    - `records: ref<RecordEntity[]>([])` — записи пользователя
    - `profileStats: ref<ProfileStatsEntity | null>(null)` — статистика
    - `profileUser: ref<UserEntity | null>(null)` — данные пользователя для шапки
    - `isLoading: ref(false)` — состояние загрузки
    - `error: ref<string | null>(null)` — ошибка (напр. «пользователь не найден»)
    - `fetchProfileData(login: string)` — загружает записи через `api.users.userControllerGetUserRecords({ login })` и статистику через новый эндпоинт `api.users.userControllerGetUserProfile({ login })`
    - `recordsByGenre: computed()` — группировка записей по genre (MOVIE, SERIES, ANIME, CARTOON, GAME)
    - `watch(login, ...)` — при смене login перезагрузить данные
    - Если login = undefined, использовать `useUser().user.login` (свой профиль)
  - Обработка ошибок: если 404 от бэкенда — установить error = 'Пользователь не найден'
  - Экспорт: `useProfile(login: Ref<string | undefined>)`

  **Must NOT do**:
  - НЕ создавать Pinia store (это page-level composable)
  - НЕ добавлять логику user selector (удалена)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Composable с несколькими API-вызовами, watch, computed — требует аккуратной работы с реактивностью
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `frontend/src/pages/profile/ProfilePage.vue:28-112` — текущая логика загрузки данных, watchers, computed. Нужно извлечь в composable и улучшить
  - `frontend/src/composables/factories/create-records-store.ts` — паттерн composable-фабрики в проекте, показывает стиль composables
  - `frontend/src/stores/use-user.ts` — паттерн useApi(), useUser() использования в composables

  **API/Type References**:
  - `frontend/src/lib/api.ts` — типы RecordEntity, UserEntity, RecordGenre, методы userControllerGetUserRecords, НОВЫЙ метод для статистики (после регенерации API — см. "BETWEEN WAVES" в Execution Strategy). ВАЖНО: использовать фактическое имя метода из регенерированного файла, а не захардкоженное. Найти через `grep "profile" frontend/src/lib/api.ts`
  - `frontend/src/stores/use-api.ts` — как получить экземпляр API-клиента через useApi()

  **WHY Each Reference Matters**:
  - ProfilePage.vue текущий код — нужно полностью понять логику чтобы правильно извлечь в composable без потери поведения
  - create-records-store.ts — показывает как другие composables в проекте структурированы (именование, экспорты)
  - use-user.ts — нужен для fallback'а на текущего пользователя когда login не указан

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build check with composable
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Проверить exit code = 0
    Expected Result: TypeScript-компиляция без ошибок, composable корректно типизирован
    Evidence: .sisyphus/evidence/task-3-build.txt

  Scenario: Composable exports correct interface
    Tool: Bash (grep)
    Steps:
      1. grep -n "export function useProfile" frontend/src/pages/profile/composables/use-profile.ts
      2. grep -n "records\|profileStats\|isLoading\|error\|recordsByGenre" frontend/src/pages/profile/composables/use-profile.ts
    Expected Result: Функция экспортирована, все ключевые поля присутствуют
    Evidence: .sisyphus/evidence/task-3-interface.txt
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `refactor(frontend): extract profile composable and record card component`
  - Files: `frontend/src/pages/profile/composables/use-profile.ts`
  - Pre-commit: `cd frontend && bun run build`

- [x] 4. Frontend — компонент ProfileRecordCard.vue

  **What to do**:
  - Создать файл `frontend/src/pages/profile/components/ProfileRecordCard.vue`
  - Props: `record: RecordEntity`
  - Компонент рендерит одну карточку записи (сейчас дублируется в ProfilePage.vue строки 185-250 и 260-325):
    - Постер (img через getImageUrl с @error handler на fallback) или текстовый fallback
    - CardHeader с CardTitle (название)
    - CardContent с ссылкой (если есть link)
    - CardFooter с датой (через formatDate из utils/date.ts) и Badge с оценкой (через gradeTags)
  - Использует: `getImageUrl` из `@/utils/image`, `formatDate` из `@/utils/date`, `gradeTags` из `@/components/table/composables/use-table-select`
  - Стилизация: перенести существующие Tailwind-классы из ProfilePage.vue

  **Must NOT do**:
  - НЕ добавлять жанро-специфичную логику
  - НЕ добавлять кликабельность на карточку (только отображение)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Извлечение существующего шаблона в компонент, без новой логики
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/pages/profile/ProfilePage.vue:185-250` — ТОЧНЫЙ шаблон карточки для видео, который нужно извлечь. Линии 260-325 — идентичный шаблон для игр
  - `frontend/src/pages/auction/components/AuctionCard.vue` — паттерн карточки-компонента в проекте (Card + CardHeader + props)
  - `frontend/src/pages/suggestion/components/SuggestionCard.vue` — ещё один паттерн компонента-карточки

  **API/Type References**:
  - `frontend/src/lib/api.ts` — тип RecordEntity (поля: id, title, posterUrl, link, createdAt, grade, genre)
  - `frontend/src/lib/api.ts` — enum RecordGrade (DISLIKE, BEER, LIKE, RECOMMEND)

  **External References**:
  - `frontend/src/utils/image.ts` — getImageUrl для проксирования постеров
  - `frontend/src/utils/date.ts` — formatDate (создаётся в Task 2)
  - `frontend/src/components/table/composables/use-table-select.ts` — gradeTags для отображения бейджа оценки

  **WHY Each Reference Matters**:
  - ProfilePage.vue строки 185-250 — ЕДИНСТВЕННЫЙ источник правды для текущего шаблона карточки. Нужно извлечь 1:1, потом можно улучшить
  - AuctionCard.vue — показывает как в проекте оформляют карточки-компоненты (props, imports, структура)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build check
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-4-build.txt

  Scenario: Component has correct props and imports
    Tool: Bash (grep)
    Steps:
      1. grep -n "defineProps" frontend/src/pages/profile/components/ProfileRecordCard.vue — должен содержать prop record
      2. grep -n "getImageUrl\|formatDate\|gradeTags" frontend/src/pages/profile/components/ProfileRecordCard.vue — все три утилиты импортированы
      3. grep -n "CardHeader\|CardTitle\|CardContent\|CardFooter\|Badge" frontend/src/pages/profile/components/ProfileRecordCard.vue — UI-компоненты используются
    Expected Result: Компонент содержит props, утилиты и UI-компоненты из карточки
    Evidence: .sisyphus/evidence/task-4-component-structure.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `refactor(frontend): extract profile composable and record card component`
  - Files: `frontend/src/pages/profile/components/ProfileRecordCard.vue`
  - Pre-commit: `cd frontend && bun run build`

- [x] 5. Frontend — routing /db/profile/:login

  **What to do**:
  - В `frontend/src/router/router-paths.ts`:
    - Оставить `ROUTER_PATHS.profile = '/db/profile'` как есть
  - В `frontend/src/router/router.ts`:
    - Изменить маршрут профиля: `path: ROUTER_PATHS.profile + '/:login?'` — login опциональный
    - Оставить `meta: { requiresAuth: true }`
    - Component import остаётся `() => import('@/pages/profile/ProfilePage.vue')`
  - Проверить что `ProfilePage.vue` / `ProfilePageContent.vue` читает `route.params.login` (но это задача Task 7)

  **Must NOT do**:
  - НЕ менять другие маршруты
  - НЕ удалять requiresAuth

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Изменение 1-2 строк в конфиг-файлах маршрутизации
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 7, Task 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/router/router-paths.ts` — константы путей
  - `frontend/src/router/router.ts` — текущий маршрут профиля, паттерн регистрации маршрутов

  **WHY Each Reference Matters**:
  - router-paths.ts — нужно знать точное имя константы (ROUTER_PATHS.profile) и формат
  - router.ts — нужно найти текущую регистрацию профиля и добавить `:login?` параметр

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build check
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-5-build.txt

  Scenario: Route config includes :login param
    Tool: Bash (grep)
    Steps:
      1. grep -n ":login" frontend/src/router/router.ts
    Expected Result: Найдена строка с `:login?` в маршруте профиля
    Evidence: .sisyphus/evidence/task-5-route.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add profile routing with :login param`
  - Files: `frontend/src/router/router.ts` (или `frontend/src/lib/router/router.ts`)
  - Pre-commit: `cd frontend && bun run build`

- [x] 6. Frontend — ProfileHeader + ProfileStatsBlock

  **What to do**:
  - Создать `frontend/src/pages/profile/components/ProfileHeader.vue`:
    - Props: `user: UserEntity` (или аналогичный тип с login и profileImageUrl)
    - Рендерит: аватар пользователя (Avatar + AvatarImage + AvatarFallback), login пользователя
    - Минималистичный стиль: аватар слева, login справа
    - Если это свой профиль (isOwnProfile) — показать визуальный индикатор (напр. текст «Мой профиль»)
  - Создать `frontend/src/pages/profile/components/ProfileStatsBlock.vue`:
    - Props: `stats: ProfileStatsEntity`  (тип из сгенерированного API после Task 1)
    - Рендерит блок статистики:
      - Общее количество записей (totalRecords)
      - Количество по категориям (recordsByGenre) — маленькие бейджи или числа с подписями
      - Распределение оценок (gradeDistribution) — бейджи с градациями и количеством (через gradeTags)
      - Общее количество полученных лайков (totalLikesReceived)
    - Использует компоненты: Badge, Card (для обёртки секции)
    - Стилизация: карточки или flex-блок с метриками

  **Must NOT do**:
  - НЕ добавлять возможность редактирования
  - НЕ добавлять графики/чарты — только числа и бейджи

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI-компоненты с визуальным дизайном, Tailwind-стилизация
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (partial — can start ProfileHeader immediately, ProfileStatsBlock needs Task 1 for types)
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/avatar/Avatar.vue` — Avatar primitive для шапки
  - `frontend/src/components/ui/avatar/AvatarImage.vue` — AvatarImage для src
  - `frontend/src/components/ui/avatar/AvatarFallback.vue` — AvatarFallback для initials
  - `frontend/src/pages/admin/AdminPage.vue:109-112` — пример использования Avatar с getImageUrl и AvatarFallback с инициалом
  - `frontend/src/components/ui/badge/Badge.vue` — Badge для отображения статистики
  - `frontend/src/components/ui/card/Card.vue` — Card для обёртки секций

  **API/Type References**:
  - `frontend/src/lib/api.ts` — UserEntity (login, profileImageUrl), НОВЫЙ ProfileStatsEntity (после регенерации)
  - `frontend/src/components/table/composables/use-table-select.ts` — gradeTags для маппинга grade → name/label/class

  **WHY Each Reference Matters**:
  - AdminPage.vue:109-112 — единственное место где Avatar используется с getImageUrl(); нужно скопировать паттерн
  - gradeTags — нужно для визуального отображения распределения оценок (grade → бейдж с цветом)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build check with new components
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-6-build.txt

  Scenario: Components exist and export correctly
    Tool: Bash (ls + grep)
    Steps:
      1. ls frontend/src/pages/profile/components/ProfileHeader.vue
      2. ls frontend/src/pages/profile/components/ProfileStatsBlock.vue
      3. grep -n "defineProps" frontend/src/pages/profile/components/ProfileHeader.vue
      4. grep -n "defineProps" frontend/src/pages/profile/components/ProfileStatsBlock.vue
    Expected Result: Оба файла существуют, оба имеют defineProps
    Evidence: .sisyphus/evidence/task-6-components.txt
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(frontend): add profile header, stats and genre tabs`
  - Files: `frontend/src/pages/profile/components/ProfileHeader.vue`, `frontend/src/pages/profile/components/ProfileStatsBlock.vue`
  - Pre-commit: `cd frontend && bun run build`

- [x] 7. Frontend — ProfilePageContent + ProfilePage (сборка)

  **What to do**:
  - Создать `frontend/src/pages/profile/components/ProfilePageContent.vue`:
    - Импортировать и использовать composable `useProfile` из Task 3
    - Читать `route.params.login` через `useRoute()` для определения чей профиль
    - Рендерить:
      1. Состояние загрузки (skeleton/spinner пока isLoading)
      2. Состояние ошибки (error — «Пользователь не найден» с иллюстрацией)
      3. ProfileHeader (из Task 6) — шапка с аватаром и логином
      4. ProfileStatsBlock (из Task 6) — блок статистики
      5. Табы по жанрам (shadcn-vue Tabs: MOVIE, SERIES, ANIME, CARTOON, GAME)
         - Каждый таб показывает список ProfileRecordCard (из Task 4) для записей этого жанра
         - Пустое состояние если нет записей в жанре
      6. Общее пустое состояние с иллюстрацией если нет записей вообще (сохранить текущие иллюстрации /images/muh.webp и /images/aga.webp)
    - Различать «свой профиль» vs «чужой» для текстов пустых состояний
  - Переписать `frontend/src/pages/profile/ProfilePage.vue` как thin wrapper:
    ```vue
    <script setup lang="ts">
    import ProfilePageContent from './components/ProfilePageContent.vue'
    </script>

    <template>
      <ProfilePageContent />
    </template>
    ```
  - Удалить всё старое содержимое ProfilePage.vue (весь текущий код)

  **Must NOT do**:
  - НЕ добавлять user selector/Popover/Command
  - НЕ добавлять поиск/фильтрацию в табах
  - НЕ добавлять пагинацию

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Сборка UI из компонентов, табы, пустые состояния, стилизация
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (needs all Wave 2 tasks + Task 6)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 3, 4, 5, 6

  **References**:

  **Pattern References**:
  - `frontend/src/pages/anime/AnimePage.vue` — ТОЧНЫЙ паттерн thin wrapper (3-7 строк: import + template)
  - `frontend/src/pages/profile/ProfilePage.vue:120-351` — текущий шаблон, пустые состояния, иллюстрации — нужно сохранить UX но с новой структурой
  - `frontend/src/pages/profile/ProfilePage.vue:329-349` — пустые состояния с иллюстрациями (muh.webp для своего, aga.webp для чужого) — сохранить

  **API/Type References**:
  - `frontend/src/lib/api.ts` — RecordGenre enum (MOVIE, SERIES, ANIME, CARTOON, GAME) для табов
  - `frontend/src/pages/profile/composables/use-profile.ts` — useProfile composable (Task 3)

  **External References**:
  - shadcn-vue Tabs: `frontend/src/components/ui/tabs/` — Tabs, TabsList, TabsTrigger, TabsContent (УЖЕ ЕСТЬ в проекте)

  **WHY Each Reference Matters**:
  - AnimePage.vue — точный образец для thin wrapper ProfilePage.vue
  - ProfilePage.vue текущий — нужно сохранить пустые состояния и иллюстрации (muh.webp, aga.webp)
  - RecordGenre — нужно для меток табов и фильтрации записей

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: ProfilePage.vue is thin wrapper
    Tool: Bash (wc)
    Steps:
      1. wc -l frontend/src/pages/profile/ProfilePage.vue
      2. Проверить что ≤ 10 строк
    Expected Result: ≤ 10 строк
    Evidence: .sisyphus/evidence/task-7-thin-wrapper.txt

  Scenario: Own profile renders with stats and tabs
    Tool: Playwright
    Preconditions: Dev сервер запущен (bun dev), JWT cookie создан по инструкции из "Auth Setup for QA"
    Steps:
      1. Создать JWT (см. "Auth Setup for QA"):
         source backend/.env && JWT_TOKEN=$(cd backend && bun -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: process.env.TWITCH_ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '1h' }));")
      2. Установить cookie в Playwright browser context:
         await context.addCookies([{ name: 'token', value: JWT_TOKEN, domain: 'localhost', path: '/' }])
      3. Перейти на http://localhost:5173/db/profile
      4. Дождаться загрузки (waitForSelector 'img[alt]' или текст логина, timeout: 10s)
      5. Проверить наличие аватара: selector `img[alt]` внутри шапки профиля
      6. Проверить наличие логина пользователя (текст $TWITCH_ADMIN_LOGIN присутствует на странице)
      7. Проверить наличие блока статистики с числами
      8. Проверить наличие 5 табов (5 элементов role="tab" или кнопок-вкладок)
      9. Кликнуть на каждый таб — проверить что контент меняется или показывается пустое состояние
      10. Screenshot
    Expected Result: Профиль отображается со шапкой, статистикой и 5 табами
    Failure Indicators: Пустая страница, ошибки в консоли, отсутствие табов
    Evidence: .sisyphus/evidence/task-7-own-profile.png

  Scenario: Other user's profile by login
    Tool: Playwright
    Preconditions: Dev сервер, JWT cookie установлен (как в предыдущем сценарии), QA test user создан (см. "Auth Setup for QA" — prisma upsert для qa_test_user)
    Steps:
      1. Создать тестового пользователя (если не создан): выполнить Prisma upsert из раздела "Auth Setup for QA" (login: qa_test_user)
      2. Перейти на http://localhost:5173/db/profile/qa_test_user
      3. Проверить что отображается логин "qa_test_user" (не $TWITCH_ADMIN_LOGIN)
      4. Проверить что страница не крашится (нет ошибок), показывается пустое состояние записей
      5. Screenshot
    Expected Result: Профиль другого пользователя с пустыми записями
    Evidence: .sisyphus/evidence/task-7-other-profile.png

  Scenario: Non-existent user shows error state
    Tool: Playwright
    Preconditions: JWT cookie установлен
    Steps:
      1. Перейти на http://localhost:5173/db/profile/nonexistent_user_99999
      2. Дождаться ответа (timeout: 10s)
      3. Проверить наличие текста «Пользователь не найден» или аналогичного сообщения об ошибке
      4. Проверить отсутствие crash/белой страницы
      5. Screenshot
    Expected Result: Страница ошибки с сообщением, не crash
    Evidence: .sisyphus/evidence/task-7-not-found.png

  Scenario: Build check
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-7-build.txt

  Scenario: No duplicated card markup in ProfilePage
    Tool: Bash (grep)
    Steps:
      1. grep -c "handleImageError\|@error=" frontend/src/pages/profile/ProfilePage.vue — должно быть 0 (старый код удалён)
      2. grep -c "handleImageError\|@error=" frontend/src/pages/profile/components/ProfileRecordCard.vue — должно быть > 0 (логика живёт тут)
      3. grep -c "ProfileRecordCard" frontend/src/pages/profile/components/ProfilePageContent.vue — должно быть > 0 (компонент используется)
    Expected Result: Карточечная разметка только в ProfileRecordCard, ProfilePage.vue — thin wrapper без старого кода
    Evidence: .sisyphus/evidence/task-7-no-duplication.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add profile header, stats and genre tabs`
  - Files: `frontend/src/pages/profile/components/ProfilePageContent.vue`, `frontend/src/pages/profile/ProfilePage.vue`
  - Pre-commit: `cd frontend && bun run build`

- [x] 8. Frontend — кликабельные аватарки по всему приложению

  **What to do**:
  - В каждом из 4 файлов обернуть Avatar + username в `<RouterLink>`:
  - **`frontend/src/pages/auction/components/AuctionCard.vue`** (строки ~60-63):
    - Обернуть Avatar и `{{ item.user.login }}` в `<RouterLink :to="'/db/profile/' + item.user?.login">`
    - Добавить import: `import { RouterLink } from 'vue-router'` (или убедиться что RouterLink доступен глобально)
    - Добавить стили: `class="flex items-center gap-2 hover:underline"` на RouterLink
  - **`frontend/src/pages/suggestion/components/SuggestionCard.vue`** (строки ~313-316):
    - Обернуть Avatar и `{{ item.user?.login }}` в `<RouterLink :to="'/db/profile/' + item.user?.login">`
    - Аналогичная стилизация
  - **`frontend/src/pages/queue/components/QueueCard.vue`** (строки ~63-66):
    - Обернуть Avatar и `{{ item.login }}` в `<RouterLink :to="'/db/profile/' + item.login">`
    - Примечание: здесь данные в item.login напрямую (не item.user.login)
  - **`frontend/src/pages/admin/AdminPage.vue`** (строки ~109-112):
    - Обернуть Avatar в `<RouterLink :to="'/db/profile/' + user.login">`
  - **`frontend/src/components/form/LoginForm.vue`** — НЕ ТРОГАТЬ. Оставить как dropdown.
  - Использовать `ROUTER_PATHS.profile` вместо хардкода '/db/profile/' если удобно

  **Must NOT do**:
  - НЕ менять LoginForm.vue
  - НЕ создавать отдельный компонент UserAvatarLink
  - НЕ менять существующую стилизацию карточек (кроме добавления hover на аватарку)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Однотипные изменения в 4 файлах — обернуть элемент в RouterLink
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (параллельно с Task 7 если Task 5 завершён)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 9
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `frontend/src/pages/auction/components/AuctionCard.vue:60-63` — текущая разметка Avatar в AuctionCard
  - `frontend/src/pages/suggestion/components/SuggestionCard.vue:313-316` — текущая разметка Avatar в SuggestionCard
  - `frontend/src/pages/queue/components/QueueCard.vue:63-66` — текущая разметка Avatar в QueueCard (item.profileImageUrl, item.login — НЕ вложенный user)
  - `frontend/src/pages/admin/AdminPage.vue:109-112` — текущая разметка Avatar в AdminPage
  - `frontend/src/components/form/LoginForm.vue:35-38` — НЕ МЕНЯТЬ, только для справки

  **API/Type References**:
  - `frontend/src/router/router-paths.ts` — ROUTER_PATHS.profile для построения ссылки

  **WHY Each Reference Matters**:
  - Каждый файл с аватаркой — нужно знать ТОЧНЫЕ строки и структуру данных (item.user.login vs item.login) чтобы правильно построить RouterLink
  - QueueCard — ВАЖНО: использует item.login и item.profileImageUrl напрямую, а не вложенный user объект

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AuctionCard avatar is wrapped in RouterLink
    Tool: Bash (grep)
    Preconditions: Task 8 код применён
    Steps:
      1. grep -n "RouterLink" frontend/src/pages/auction/components/AuctionCard.vue
      2. grep -n "/db/profile/" frontend/src/pages/auction/components/AuctionCard.vue
    Expected Result: RouterLink с путём /db/profile/ присутствует в AuctionCard
    Evidence: .sisyphus/evidence/task-8-auction-routerlink.txt

  Scenario: SuggestionCard avatar is wrapped in RouterLink
    Tool: Bash (grep)
    Steps:
      1. grep -n "RouterLink" frontend/src/pages/suggestion/components/SuggestionCard.vue
      2. grep -n "/db/profile/" frontend/src/pages/suggestion/components/SuggestionCard.vue
    Expected Result: RouterLink с путём /db/profile/ присутствует в SuggestionCard
    Evidence: .sisyphus/evidence/task-8-suggestion-routerlink.txt

  Scenario: QueueCard avatar is wrapped in RouterLink
    Tool: Bash (grep)
    Steps:
      1. grep -n "RouterLink" frontend/src/pages/queue/components/QueueCard.vue
      2. grep -n "/db/profile/" frontend/src/pages/queue/components/QueueCard.vue
    Expected Result: RouterLink с путём /db/profile/ присутствует в QueueCard
    Evidence: .sisyphus/evidence/task-8-queue-routerlink.txt

  Scenario: AdminPage avatar is wrapped in RouterLink
    Tool: Bash (grep)
    Steps:
      1. grep -n "RouterLink" frontend/src/pages/admin/AdminPage.vue
      2. grep -n "/db/profile/" frontend/src/pages/admin/AdminPage.vue
    Expected Result: RouterLink с путём /db/profile/ присутствует в AdminPage
    Evidence: .sisyphus/evidence/task-8-admin-routerlink.txt

  Scenario: LoginForm avatar NOT wrapped in profile RouterLink
    Tool: Bash (grep)
    Preconditions: LoginForm.vue уже содержит RouterLink для пунктов dropdown-меню (Admin, Profile) — это нормально
    Steps:
      1. grep -n "Avatar" frontend/src/components/form/LoginForm.vue
      2. Найти блок с Avatar/AvatarImage (строки ~35-38) — убедиться что он НЕ обёрнут в RouterLink, а остаётся внутри DropdownMenuTrigger
      3. Проверить что Avatar НЕ является child элементом тега <RouterLink> или <a href="/db/profile/...">
    Expected Result: Avatar в LoginForm остаётся внутри DropdownMenuTrigger, не обёрнут в RouterLink с /db/profile/
    Evidence: .sisyphus/evidence/task-8-loginform-avatar-unchanged.txt

  Scenario: Clickable avatars work in browser (integration)
    Tool: Playwright
    Preconditions: Dev сервер, JWT cookie установлен (см. "Auth Setup for QA"). Для отображения карточек нужны записи в БД — создать тестовую запись через модель Record (модели Suggestion нет — предложения хранятся как Record с type=SUGGESTION):
      ```bash
      cd backend && bun -e "
        const { PrismaClient, RecordGenre, RecordGrade, RecordType, RecordStatus } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findFirst();
        if (user) {
          await prisma.record.create({
            data: {
              title: 'QA Test Movie',
              link: '',
              posterUrl: '',
              genre: RecordGenre.MOVIE,
              grade: RecordGrade.LIKE,
              type: RecordType.SUGGESTION,
              status: RecordStatus.QUEUE,
              userId: user.id,
            }
          }).catch(() => {});
        }
        await prisma.\$disconnect();
        console.log('QA test record created');
      "
      ```
    Steps:
      1. Перейти на http://localhost:5173/db/suggestion (страница предложений)
      2. Дождаться загрузки карточек (timeout: 10s)
      3. Найти ссылку на профиль (селектор: `a[href*="/db/profile/"]` рядом с аватаркой)
      4. Кликнуть на ссылку
      5. Проверить что URL изменился на /db/profile/{login}
      6. Screenshot
    Expected Result: Клик на аватарку ведёт на страницу профиля
    Failure Indicators: Отсутствует ссылка, клик не работает, навигация не происходит
    Evidence: .sisyphus/evidence/task-8-clickable-avatar-integration.png

  Scenario: Build and lint check
    Tool: Bash
    Steps:
      1. bun lint
      2. cd frontend && bun run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): make avatars clickable across app (closes #195)`
  - Files: `frontend/src/pages/auction/components/AuctionCard.vue`, `frontend/src/pages/suggestion/components/SuggestionCard.vue`, `frontend/src/pages/queue/components/QueueCard.vue`, `frontend/src/pages/admin/AdminPage.vue`
  - Pre-commit: `bun lint`

- [x] 9. Финальная проверка — lint, format, build

  **What to do**:
  - Запустить `bun lint:fix` — автоисправление ошибок линтера
  - Запустить `bun format` — форматирование кода
  - Запустить `bun build` — полная сборка (frontend + backend)
  - Проверить что Swagger docs (`/docs` — Swagger UI, `/docs-json` — JSON) содержат новый эндпоинт `GET /api/users/profile/{login}`
  - Убедиться что нет unused imports, dead code, console.log в новых файлах

  **Must NOT do**:
  - НЕ менять логику — только lint/format фиксы

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Запуск команд и минимальные автофиксы
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Tasks 7, 8)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 7, 8

  **References**:

  **Pattern References**:
  - `.oxlintrc.json` — конфигурация oxlint
  - `.oxfmtrc.json` — конфигурация oxfmt

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full build passes
    Tool: Bash
    Steps:
      1. bun build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: Lint passes
    Tool: Bash
    Steps:
      1. bun lint
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-9-lint.txt

  Scenario: Format check passes
    Tool: Bash
    Steps:
      1. bun format:check
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-9-format.txt

  Scenario: Swagger contains new endpoint
    Tool: Bash (curl + jq)
    Preconditions: Dev backend запущен (bun dev:backend)
    Steps:
      1. curl -s http://localhost:3000/docs-json | jq '.paths["/users/profile/{login}"]'
      2. Проверить что результат не null — эндпоинт присутствует в Swagger JSON
      3. Проверить наличие метода GET: jq '.paths["/users/profile/{login}"].get' !== null
    Expected Result: Эндпоинт GET /users/profile/{login} присутствует в Swagger
    Failure Indicators: null результат, эндпоинт отсутствует
    Evidence: .sisyphus/evidence/task-9-swagger.json
  ```

  **Commit**: YES
  - Message: `chore: lint and format`
  - Files: все файлы с автофиксами
  - Pre-commit: `bun build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bun build` + `bun lint` + `bun format:check`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify ProfilePage.vue is ≤10 lines. Verify no duplicated card markup.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Format [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Create JWT cookie using "Auth Setup for QA" instructions from Verification Strategy section. Create QA test user via Prisma upsert (see same section). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (navigation avatar → profile → tabs → stats). Test edge cases: non-existent user, empty profile, all tabs empty. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| # | Message | Files | Pre-commit check |
|---|---------|-------|-----------------|
| 1 | `feat(backend): add profile stats endpoint` | user.service.ts, user.controller.ts, profile-stats.entity.ts | `cd backend && bun run build` |
| 2 | `refactor(frontend): extract profile utilities` | utils/date.ts, use-table-select.ts | `bun lint` |
| 3 | `refactor(frontend): extract profile composable and components` | use-profile.ts, ProfileRecordCard.vue, ProfilePageContent.vue, ProfilePage.vue | `cd frontend && bun run build` |
| 4 | `feat(frontend): add profile routing with :login param` | router-paths.ts, router.ts | `cd frontend && bun run build` |
| 5 | `feat(frontend): add profile header, stats and genre tabs` | ProfileHeader.vue, ProfileStatsBlock.vue, ProfilePageContent.vue | `cd frontend && bun run build` |
| 6 | `feat(frontend): make avatars clickable across app (closes #195)` | AuctionCard.vue, SuggestionCard.vue, QueueCard.vue, AdminPage.vue | `bun lint && bun format:check` |
| 7 | `chore: lint and format` | * | `bun build` |

---

## Success Criteria

### Verification Commands
```bash
bun build                    # Expected: exits 0
bun lint                     # Expected: exits 0
bun format:check             # Expected: exits 0
cd backend && bun run build  # Expected: exits 0
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] ProfilePage.vue ≤10 строк
- [ ] 0 дублированных карточек в шаблоне
- [ ] Backend Swagger docs содержат новый эндпоинт
- [ ] 5 табов по жанрам работают
- [ ] Аватарки кликабельны в 4 компонентах
- [ ] Несуществующий пользователь → корректное состояние ошибки
