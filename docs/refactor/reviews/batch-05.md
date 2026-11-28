# Ревью батча B-05 — auth-хелпер и `rateLimitGuard` (`604f866`, `b07e249`) → **CHANGES REQUIRED**

|                  |                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Коммиты          | `604f866` (requireAuthenticated), `b07e249` (rateLimitGuard); `a6837fa` — docs-only, проверен отдельно (`git show`), в диапазон `76d3fec..b07e249` не входит                                                                                                                                                                                                                                                                                         |
| Родитель         | `76d3fec` (единая модель ошибок)                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Ревьюер          | `review-batch5` (не автор коммитов; только diff, изолированный worktree, прогоны и A/B-скрипты)                                                                                                                                                                                                                                                                                                                                                      |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Что сделано мной | исходники не менялись, коммитов нет; в основном дереве создан только этот отчёт. Прогоны — в detached-worktree `/tmp/review-b5` на `b07e249` (`bun install --frozen-lockfile`, 450 пакетов). Для A/B — отдельная распаковка `git archive 76d3fec` в `/tmp/review-b5-parent` (не git-worktree, чтобы не плодить записи в основном `.git`). Обе директории удалены в конце; кодовый diff после мутационной проверки пуст (`git diff` в worktree чист). |
| Не запускалось   | backend integration (`RUN_DB_TESTS=1` + Postgres), Playwright e2e, docker build — нужны стенды, вне списка ревью                                                                                                                                                                                                                                                                                                                                     |
| Окружение        | `backend/.env` скопирован из `backend/.env.example` только в /tmp-worktree: без него `src/server/__tests__/container.spec.ts` останавливает прогон на envalid (`DATASOURCE_URL`/`JWT_SECRET`/`TWITCH_CALLBACK_URL`). В git файл не попадает (gitignored) — это задокументированное в AGENTS требование, не дефект батча                                                                                                                              |
| Важно            | пока шло ревью, ветка ушла вперёд (`108ebfa`, `409ff26`, `9042286`, `41ae5e6`, `f793bac` и далее — батчи 6–8). Ревью строго на `b07e249` (+docs `a6837fa`); все номера строк относятся к `b07e249`                                                                                                                                                                                                                                                   |

## Вердикт

**CHANGES REQUIRED — блокирует только отсутствие тестовой ловушки на `rateLimitGuard`; код чистый.**

Кодовая часть подтверждена полностью и состязательно: ни один из 72 роутов не потерял и не получил
лимит, пресеты родителя и HEAD совпадают 72/72; ключ лимита действительно строится из
зарегистрированного пути (`/records/:id`), параметры и query в ключ не попадают, методы и пути
различаются; порядок «лимит → auth → роли» сохранён на всех роутах (статически и на живых запросах);
роли совпадают по каждому роуту, `roles=undefined` — только 401; рекурсии и двойных проверок нет;
`lint` / `format:check` / `typecheck` / backend 676 / frontend 126 / frontend build — зелёные.
Функциональных регрессий и изменений внешних контрактов не найдено.

Блокирует один пункт — **у нового канона `rateLimitGuard` нет ни одного теста**. Единственный
добавленный спек (`auth-require.spec.ts`, 5 кейсов) покрывает только auth-половину батча. Ни один
существующий тест не проверяет ключ лимита: мутационная проверка «выкинуть `ctx.route`, считать по
URL» (`rate-limit.ts:71`) не уронила ни одного теста — `cd backend && bun test src/gateway` →
**151 pass / 0 fail**. То есть регрессия «каждый `/records/:id` получает свой счётчик, лимит
обходится перебором id» пройдёт незамеченной. Это прямо нарушает правило 5 кампании
(«каждая устранённая регрессия получает ловушку… уборка без защиты считается недоделанной») и
DoD-пункт «на новый канон есть тест»; прецедент — ревью батча 4 (`batch-04.md`), где CHANGES
REQUIRED был выставлен ровно за отсутствие теста на центральный канон. Лечится одним небольшим
спеком, правок прод-кода не требуется; после него — APPROVE.

## Что в коммитах

- **`604f866`** — 14 файлов, +109/−51: `requireAuthenticated` в `gateway/auth.ts:83-91`; 21 склейка
  `requireRole(requireUser(await resolveUser(...)))` и 10 голых `requireUser(await resolveUser(...))`
  заменены на `await requireAuthenticated(auth, request, roles?)`; локальные `requireSession` /
  `requireBarOwner` / `requirePlayer` / `requireAdmin` сведены к нему; новый
  `gateway/__tests__/auth-require.spec.ts` (5 кейсов).
- **`b07e249`** — 23 файла, +192/−367: 9 локальных closure `const limit = (...)` и 15 прямых
  `enforceRateLimit` сведены к `rateLimitGuard(rateLimit[, defaultConfig])`
  (`gateway/rate-limit.ts:53-75`): 19 фабрик на 19 роут-плагинов, 72 вызова `await limit(` (по одному
  на роут), 0 прямых `enforceRateLimit`; ключ вместо имени Nest-контроллера —
  `rl:${request.method} ${ctx.route || pathname}:${ip}`. Удалены все 72 вхождения
  `'*Controller.*'` (19 файлов). Правки `AGENTS.md` и `docs/architecture.md`.
- **`a6837fa`** — 1 файл, +11/−11: в `backend/src/AGENTS.md:37` строка Rate limits переписана на
  `gateway/rate-limit.ts` / `rateLimitGuard`. Содержимое проверено, коду соответствует.

`database/`, `contract/`, `frontend/`, `utils/` (кроме документации), lockfile, CI и Docker не
тронуты: `git diff --name-only 76d3fec..b07e249` → только `AGENTS.md`, 22 файла `backend/src/gateway/*`
и `docs/architecture.md`. Cookie `token`, WS, схема БД, env-контракт и формат ошибок механически не
затронуты. `git show --check` по трём коммитам чист; новых `any` / `as unknown as` / disable-комментариев
и новых `TODO` нет.

## Блокер

### B1. Нет теста на новый канон `rateLimitGuard` (ключ, fallback, default-пресет)

Правило 5 README и DoD «на новый канон есть тест» требуют ловушки; в батче её нет для второй
(самой рискованной) половины — ключа лимита. Проверка мутацией в изолированном worktree:

1. в `backend/src/gateway/rate-limit.ts:71` заменено
   `` route: `${ctx.request.method} ${ctx.route || new URL(ctx.request.url).pathname}` `` на
   `` route: `${ctx.request.method} ${new URL(ctx.request.url).pathname}` ``;
2. `cd backend && bun test src/gateway` → **151 pass / 0 fail**;
3. файл восстановлен, `git diff` пуст.

Регрессия безопасно проходит все 151 gateway-тест и меняет семантику лимита (параметры в ключе →
лимит на каждый id/пользователя), то есть это именно та ловушка, которую требует правило 5.
Достаточно одного спека (без прод-правок), например `backend/src/gateway/__tests__/rate-limit-key.spec.ts`:

| Кейс                                                                                   | Ожидание                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `createTestGateway` с записывающим `RateLimiter`; `GET /ratings/users/alice` и `…/bob` | один и тот же ключ, в нём `:id`, параметров нет |
| `GET /records/1` и `GET /records/2`                                                    | `rl:GET /records/:id:<ip>` у обоих              |
| `GET /records` vs `POST /records/link`                                                 | разные ключи (метод + путь)                     |
| прямой `rateLimitGuard(limiter)({ request })` без `route`                              | fallback — pathname URL (query отброшен)        |
| `rateLimitGuard(limiter)` vs `rateLimitGuard(limiter, RATE_LIMITS.auth)`               | default-пресет `public` / `auth`                |
| лимитер запрещает: `GET /auth/me` без cookie                                           | 429 + `retry-after`, а не 401 (порядок)         |

После добавления спека — APPROVE.

## Не блокеры

| ID  | Пункт                                                                                                                                                                                                                                                              | Почему не блокер                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | `docs/api.md:35` всё ещё описывает ключ как `rl:{route}:{ip}` (нет METHOD и разделителя; «route» неоднозначен). Код и `docs/architecture.md:57-58` — `rl:{METHOD} {path}:{ip}`.                                                                                    | Внутренняя деталь реализации, внешний контракт не меняется; файл не входит в дифф батча. Одна строка, входит в G-04 (docs-синк).                               |
| N2  | `docs/architecture.md:93-95` — «Глобального guard'а нет — каждый роут вызывает `requireRole` явно». После `604f866` роуты вызывают `requireAuthenticated`, а `requireRole` вызывается только внутри `gateway/auth.ts:90,94`.                                       | Документация, не код; тот же файл уже обновлён в части лимитов. G-04 явно числит `docs/architecture.md (B-01, B-05)`.                                          |
| N3  | `docs/api.md:26` легенда доступа: «нужен валидный JWT (`requireUser` + роль…)» — канон теперь `requireAuthenticated` (`auth.ts:83`).                                                                                                                               | Смысл не изменился (внутри те же `requireUser`/`requireRole`); docs-синк — G-04.                                                                               |
| N4  | `backend/src/AGENTS.md:39` (Auth row) и `AGENTS.md:40` (WHERE TO LOOK, Rate limiting) не упоминают новые `requireAuthenticated` / `rateLimitGuard`: `a6837fa` обновил только строку Rate limits, а корневая строка 40 осталась «Порт и `enforceRateLimit`».        | Оба факта не ложны (старые примитивы живы), новые имена описаны в других местах (AGENTS.md:147, architecture.md:57); docs-синк — G-04.                         |
| N5  | `AGENTS.md:147` перечисляет пресеты, но пропускает `cocktailBar` (120) и `telegramWebApp` (20); список идентичен родителю (`76d3fec`), т.е. пропуск пре-существующий, хотя строку батч правил.                                                                     | Пропуск был и до батча, на поведение не влияет; при желании — та же правка, что N1.                                                                            |
| N6  | `docs/api.md` описывает 71 из 72 роутов: нет `GET /weather` (в родителе тоже отсутствует).                                                                                                                                                                         | Пре-существующий docs-пробел, батч его не создавал и не трогал доки api.md; не относится к B-05.                                                               |
| N7  | Default-пресет `rateLimitGuard` (`RATE_LIMITS.public`, `rate-limit.ts:66`) нигде не задокументирован: забытый явный конфиг молча даёт 1000/мин. Сейчас все 72 вызова, кроме `auth-oauth` (`auth`, `auth-oauth.ts:141`), передают пресет явно, поведение корректно. | Риск будущих ошибок, а не текущий дефект; фиксируется одной фразой в docstring/AGENTS или тем же тестом (кейс default-пресета в B1).                           |
| N8  | Смена формата ключа означает сброс окон в Redis на деплое: старые ключи `rl:<Controller>.<method>:<ip>` больше не инкрементируются и истекают сами (TTL 60 с), новые окна начинаются с нуля.                                                                       | Внешний контракт не меняется; эффект ограничен 60 секундами, ограничения не ослабляются (у новых ключей тот же пресет). Стоит упомянуть в release-notes батча. |

Замечание про «удалены все ~50 ручных строк»: фактически в родителе **72** вхождения
`'*Controller.*'` в 19 файлах (15 прямых `route:`-аргументов + 57 внутри склейки `limit(...)`),
на HEAD — **0**. В задаче число было оценочным, расхождение не дефект.

## Пункт 1. Покрытие лимитами и пресеты — подтверждено

Методика (A/B на живом `app.handle`, не статикой): `createTestGateway` (полный `createGateway` со
стабами), `rateLimit` заменён записывающим `RateLimiter` (`hit(key, config)` пишет ключ и конфиг),
`auth.resolve` отдаёт `USER` / `ADMIN` по токену. Для каждого из 72 зарегистрированных путей собран
валидный по схемам запрос (body/query/params/multipart), по три варианта cookie: без cookie, `USER`,
`ADMIN` → **216 запросов**. Тот же скрипт прогнан на распакованном `76d3fec`.

Результат:

- зарегистрировано **72 роута** в обеих версиях, набор `(method, path)` совпадает 1:1;
- **216/216** запросов HEAD вызвали лимитер ровно один раз (ни одного 0-hit из-за валидации, ни
  одного двойного вызова); то же на родителе;
- **72/72** пресетов `parent == HEAD` (по идентичности объекта `RATE_LIMITS.*` и по значению);
- статический разбор: на каждый роут в обоих деревьях ровно один `limit(...)`/`enforceRateLimit(...)`;
  parent: 9 closure `const limit = (` + 15 прямых `enforceRateLimit` = 24 места; HEAD: 19
  `rateLimitGuard(...)`-фабрик + 72 вызова `await limit(` + 0 прямых;
- ни один роут не остался без лимита и ни один не получил лишний.

Полная таблица «роут → пресет → ключ» — в приложении A.

## Пункт 2. Ключ лимита — подтверждено

Ключ HEAD: `rl:{request.method} {ctx.route || pathname}:{ip}` (`rate-limit.ts:71`, IP — первый хоп
`X-Forwarded-For`, как и раньше, `clientIp` не менялся). Проверено на живом `app.handle`:

| Проверка                                                   | Фактический ключ                                |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `GET /ratings/users/alice`                                 | `rl:GET /ratings/users/:id:10.0.0.1`            |
| `GET /ratings/users/bob`                                   | `rl:GET /ratings/users/:id:10.0.0.1` (тот же)   |
| `GET /records/1` / `GET /records/2`                        | `rl:GET /records/:id:10.0.0.1` (один ключ)      |
| `GET /records`                                             | `rl:GET /records:10.0.0.1`                      |
| `POST /records/link`                                       | `rl:POST /records/link:10.0.0.1` (другой)       |
| `GET /records?page=1&limit=2`                              | `rl:GET /records:10.0.0.1` (query отброшен)     |
| `GET /records/42?x=1`                                      | `rl:GET /records/:id:10.0.0.1`                  |
| `GET /records` + `X-Forwarded-For: 203.0.113.7, 10.0.0.1`  | `rl:GET /records:203.0.113.7` (первый хоп)      |
| `GET /records` без XFF и без `server` (app.handle)         | `rl:GET /records:unknown`                       |
| прямой `rateLimitGuard(limiter)({ request })`, без `route` | `rl:GET /foo/bar:9.9.9.9` (fallback — pathname) |
| прямой guard с `route: '/foo/:id'`, `POST`                 | `rl:POST /foo/:id:9.9.9.9`                      |
| `rateLimitGuard(limiter)` / `(limiter, RATE_LIMITS.auth)`  | default `public` / `auth`                       |

Дополнительно: формула `rl:{METHOD} {route}:{ip}` проверена автоматически на всех 216 запросах —
расхождений 0. В обоих деревьях 72 роута дают 72 различных ключа; родитель — 72 различных
`<Controller>.<method>`-ключа. Т.е. смена ключа не меняет «один ключ на роут», а убирает зависимость
ключа от имени обработчика и гарантирует, что параметры пути в него не попадают.

## Пункт 3. Порядок «лимит → auth → роли» и статусы — подтверждено

Статически: во всех 72 обработчиках `limit(...)` стоит раньше первого `requireAuthenticated` /
локального auth-хелпера (скрипт: 0 нарушений). Динамически (`allowed=false` у лимитера; тела/заголовки
сверены с родителем — идентичны):

| Запрос                                             | Лимитер | HEAD                                                                              | parent |
| -------------------------------------------------- | ------- | --------------------------------------------------------------------------------- | ------ |
| `GET /auth/me` без cookie                          | allow   | 401 `{401,"Unauthorized","Unauthorized"}`                                         | same   |
| `GET /auth/me` без cookie                          | deny    | **429** + `retry-after: 7`, `{429,"Превышен лимит запросов","Too Many Requests"}` | same   |
| `GET /auth/me` `USER`                              | allow   | 200, пользователь                                                                 | same   |
| `POST /records/link` без cookie / `USER` / `ADMIN` | allow   | 401 / 403 / 500 (стаб домена)                                                     | same   |
| `POST /records/link` `USER`                        | deny    | **429** (а не 403)                                                                | same   |
| `POST /users/u1/merge` `USER`                      | allow   | 403                                                                               | same   |
| `PUT /ratings/1` `ADMIN` / `USER`                  | allow   | 403 / 500 (`RATER_ROLES` — только USER)                                           | same   |
| `GET /health` без cookie                           | deny    | 429                                                                               | same   |
| `GET /health` без cookie                           | allow   | 200 `{"status":"ok"}`                                                             | same   |

Ключевое: при запрещённом лимите и отсутствии cookie ответ **429, а не 401/403** — лимит считается
до auth. Существующий тест `auth-me.spec.ts` («rate limits before checking auth», 429 +
`auth.resolve` не вызван) продолжает это фиксировать для `/auth/me`; на всех 72 роутах статусы
HEAD и родителя совпали (216/216), 429-конверт и `retry-after` не изменились.

## Пункт 4. Эквивалентность auth — подтверждено

Родитель: 21 склейка `requireRole(requireUser(await resolveUser(...)))` + 10 голых
`requireUser(await resolveUser(...))` + 4 локальных хелпера. HEAD: 27 прямых `requireAuthenticated`
в обработчиках + 4 хелпера, делегирующих в него (`auth-session.ts:69`, `cocktails.ts:86`,
`steam.ts:90`, `wordle.ts:226`). Семантика хелперов сверена построчно: `requireSession` /
`requireBarOwner` — только auth (в обеих версиях), `requirePlayer` — `USER_ROLES` (USER+ADMIN),
`requireAdmin` — `ADMIN`.

Автоматическое сравнение «роут → требуемая роль» (parent-цепочки ↔ HEAD-вызовы, с раскрытием
хелперов) — **72/72 совпадений, 0 расхождений**. Группы (одинаковые в parent и HEAD):

- **auth, без роли (18):** `GET /auth/me`, `PATCH /auth/me`, `DELETE /auth/me`, `GET|PATCH /auth/me/customization`, `POST|DELETE /auth/me/avatar`, `GET|DELETE /auth/accounts[/:platform]`, `GET /auth/{twitch,kick,telegram}/link`, `POST /auth/{twitch,kick}/link`, `GET /auth/telegram/oidc/callback` (ветка link), `GET|PUT /cocktails/bar`, `DELETE /suggestions/:id`.
- **`USER_ROLES` (USER+ADMIN, 17):** все `POST|DELETE /likes*`, `GET /likes/{count,records/:id,users/:id}`, `GET /ratings/my`, `POST /suggestions`, все wordle-роуты игрока (`state`, `guess`, `stats`, `practice` GET/POST, `practice/guess`, `notifications` GET/PATCH/POST link/DELETE).
- **`RATER_ROLES` (только USER, 2):** `PUT|DELETE /ratings/:recordId` (ADMIN получает 403 — так было и в parent, странность сохранена намеренно).
- **`ADMIN` (12):** `POST /records/link`, `GET|PATCH|DELETE /records/:id`, `PATCH /records/:id/poster`, `POST /limits`, `GET|DELETE /users/:id`, `GET /users/:id/accounts`, `POST /users/:id/merge`, `GET /steam/games`, `POST /steam/import`.
- **public (23):** всё остальное (`/records` GET, `/suggestions` GET, `/users/users`, `/health`, `/img`, `/avatar`, `/weather`, `/queue`, `/stats/records`, `/auth/logout`, OAuth-редиректы и callback'и и т.д.).

«Где не было — не появилось» подтверждено и поведенчески: на 216 живых запросах (3 варианта
cookie × 72 роута) **статусы HEAD и parent совпали полностью**; добавленная проверка роли дала бы
403 у `USER` там, где parent отдавал 200/500, — таких расхождений нет. `roles=undefined` — только
401: `GET /auth/me` без cookie → 401, `USER`/`ADMIN` → 200 (роль не проверяется). Публичные роуты не
получили 401: например, `GET /records` для anon/user/admin — 200 в обеих версиях.

## Пункт 5. Рекурсия и двойные проверки — подтверждено

- `requireAuthenticated` (`auth.ts:83-91`) вызывает только `requireUser(await resolveUser(...))` и
  `requireRole(...)`; сам себя не вызывает.
- `grep requireRole(` вне `gateway/auth.ts` → **0**; `requireUser(await resolveUser(...))` вне
  `gateway/auth.ts` → **0**; `requireAuthenticated(...requireAuthenticated...)` → **0**.
- Двойной проверки `requireRole(await requireAuthenticated(...))` не осталось: `requireRole` в
  прод-коде вызывается ровно в двух местах — определение (`auth.ts:94`) и вызов внутри
  `requireAuthenticated` (`auth.ts:90`).
- Локальные хелперы не дублируют логику, а делегируют: `const requireX = async (request) => await requireAuthenticated(...)`, по одному вызову на обработчик.

## Пункт 6. Прогоны (изолированный worktree `b07e249`, `bun install --frozen-lockfile`)

| Проверка                       | Результат                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors. Finished in 98ms on 436 files with 95 rules`.                                           |
| `bun format:check`             | exit 0 — `All matched files use the correct format`, 612 файлов.                                                                 |
| `bun typecheck`                | exit 0 — contract 7 файлов, database 41, backend 269, frontend — ошибок нет.                                                     |
| `cd backend && bun test`       | exit 0 — **676 pass / 0 fail**, 81 файл, 36 219 `expect`, 1.96 s (parent `76d3fec`: 671 / 0, 80 файлов — ровно +5 новых кейсов). |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect`, 91 ms.                                                                    |
| `cd frontend && bun run build` | exit 0 — `build:types` (vue-tsc) done 2.48 s, `build:ci` (vite) `✓ built in 851ms`.                                              |
| `git show --check`             | чисто по всем трём коммитам (whitespace-ошибок нет).                                                                             |

Примечание: первый прогон backend без `backend/.env` останавливается на envalid в
`container.spec.ts` — это известное требование AGENTS, а не регрессия; с `.env` из `.env.example`
всё зелёное. Никаких правок в /tmp-worktree, влияющих на результат, не осталось (`git diff` пуст).

## Пункт 7. Документация — в основном соответствует коду

Проверенные утверждения (совпадают с измеренным поведением):

- `AGENTS.md:147` — «Порядок: лимит → auth → роли. Роут закрывается `rateLimitGuard(rateLimit)`; ключ
  — `rl:{METHOD} {path}:{ip}` (путь из `ctx.route`)» — подтверждено пунктами 2–3.
- `docs/architecture.md:57-59` — «`rateLimitGuard(rateLimit)` в каждом роут-плагине… ключ
  `rl:{METHOD} {path}:{ip}`, путь из `ctx.route`, параметры в ключ не попадают» — подтверждено.
- `a6837fa` (`backend/src/AGENTS.md:37`) — «Rate limits → `gateway/rate-limit.ts`, `rateLimitGuard`
  закрывает роут, пресеты — `utils/rate-limits.ts`» — соответствует коду (19 фабрик, 72 вызова).

Расхождения — только документация, не блокеры: N1–N6 выше (`docs/api.md:35,26`,
`docs/architecture.md:93-95`, `backend/src/AGENTS.md:39`, `AGENTS.md:40` и неполный список пресетов
в `AGENTS.md:147`, отсутствующий `GET /weather` в `docs/api.md`). `docs/refactor/tasks.md`
(G-04) уже числит синхронизацию `AGENTS.md` и `docs/architecture.md` по B-05 отдельной задачей,
поэтому в этом батче они не блокируют.

## Приложение A. Роут → пресет → ключ (измерено на `b07e249`; `10.0.0.1` — тестовый IP)

| Роут (METHOD path)                 | Пресет parent  | Пресет HEAD    | Ключ HEAD (пример)                             |
| ---------------------------------- | -------------- | -------------- | ---------------------------------------------- |
| `GET /auth/me`                     | public         | public         | `rl:GET /auth/me:10.0.0.1`                     |
| `GET /auth/accounts`               | public         | public         | `rl:GET /auth/accounts:10.0.0.1`               |
| `DELETE /auth/accounts/:platform`  | write          | write          | `rl:DELETE /auth/accounts/:platform:10.0.0.1`  |
| `PATCH /auth/me`                   | write          | write          | `rl:PATCH /auth/me:10.0.0.1`                   |
| `GET /auth/me/customization`       | public         | public         | `rl:GET /auth/me/customization:10.0.0.1`       |
| `PATCH /auth/me/customization`     | write          | write          | `rl:PATCH /auth/me/customization:10.0.0.1`     |
| `DELETE /auth/me`                  | write          | write          | `rl:DELETE /auth/me:10.0.0.1`                  |
| `POST /auth/logout`                | auth           | auth           | `rl:POST /auth/logout:10.0.0.1`                |
| `POST /auth/me/avatar`             | write          | write          | `rl:POST /auth/me/avatar:10.0.0.1`             |
| `DELETE /auth/me/avatar`           | write          | write          | `rl:DELETE /auth/me/avatar:10.0.0.1`           |
| `GET /auth/twitch`                 | auth           | auth           | `rl:GET /auth/twitch:10.0.0.1`                 |
| `GET /auth/twitch/link`            | auth           | auth           | `rl:GET /auth/twitch/link:10.0.0.1`            |
| `POST /auth/twitch/callback`       | auth           | auth           | `rl:POST /auth/twitch/callback:10.0.0.1`       |
| `POST /auth/twitch/link`           | auth           | auth           | `rl:POST /auth/twitch/link:10.0.0.1`           |
| `GET /auth/kick`                   | auth           | auth           | `rl:GET /auth/kick:10.0.0.1`                   |
| `GET /auth/kick/link`              | auth           | auth           | `rl:GET /auth/kick/link:10.0.0.1`              |
| `POST /auth/kick/callback`         | auth           | auth           | `rl:POST /auth/kick/callback:10.0.0.1`         |
| `POST /auth/kick/link`             | auth           | auth           | `rl:POST /auth/kick/link:10.0.0.1`             |
| `GET /auth/telegram`               | auth           | auth           | `rl:GET /auth/telegram:10.0.0.1`               |
| `GET /auth/telegram/link`          | auth           | auth           | `rl:GET /auth/telegram/link:10.0.0.1`          |
| `GET /auth/telegram/oidc/callback` | auth           | auth           | `rl:GET /auth/telegram/oidc/callback:10.0.0.1` |
| `POST /auth/telegram/webapp`       | telegramWebApp | telegramWebApp | `rl:POST /auth/telegram/webapp:10.0.0.1`       |
| `GET /weather`                     | public         | public         | `rl:GET /weather:10.0.0.1`                     |
| `GET /stats/records`               | public         | public         | `rl:GET /stats/records:10.0.0.1`               |
| `GET /queue`                       | public         | public         | `rl:GET /queue:10.0.0.1`                       |
| `POST /likes`                      | like           | like           | `rl:POST /likes:10.0.0.1`                      |
| `DELETE /likes/:recordId`          | like           | like           | `rl:DELETE /likes/:recordId:10.0.0.1`          |
| `GET /likes/records/:id`           | public         | public         | `rl:GET /likes/records/:id:10.0.0.1`           |
| `GET /likes/users/:id`             | public         | public         | `rl:GET /likes/users/:id:10.0.0.1`             |
| `GET /likes/count`                 | public         | public         | `rl:GET /likes/count:10.0.0.1`                 |
| `POST /records/link`               | write          | write          | `rl:POST /records/link:10.0.0.1`               |
| `GET /records`                     | public         | public         | `rl:GET /records:10.0.0.1`                     |
| `GET /records/:id`                 | public         | public         | `rl:GET /records/:id:10.0.0.1`                 |
| `PATCH /records/:id`               | write          | write          | `rl:PATCH /records/:id:10.0.0.1`               |
| `PATCH /records/:id/poster`        | write          | write          | `rl:PATCH /records/:id/poster:10.0.0.1`        |
| `DELETE /records/:id`              | write          | write          | `rl:DELETE /records/:id:10.0.0.1`              |
| `PUT /ratings/:recordId`           | like           | like           | `rl:PUT /ratings/:recordId:10.0.0.1`           |
| `DELETE /ratings/:recordId`        | like           | like           | `rl:DELETE /ratings/:recordId:10.0.0.1`        |
| `GET /ratings/my`                  | public         | public         | `rl:GET /ratings/my:10.0.0.1`                  |
| `GET /ratings/users/:id`           | public         | public         | `rl:GET /ratings/users/:id:10.0.0.1`           |
| `GET /ratings/friends`             | public         | public         | `rl:GET /ratings/friends:10.0.0.1`             |
| `GET /users/users`                 | public         | public         | `rl:GET /users/users:10.0.0.1`                 |
| `GET /users/:id/accounts`          | public         | public         | `rl:GET /users/:id/accounts:10.0.0.1`          |
| `GET /users/:id`                   | public         | public         | `rl:GET /users/:id:10.0.0.1`                   |
| `DELETE /users/:id`                | write          | write          | `rl:DELETE /users/:id:10.0.0.1`                |
| `POST /users/:id/merge`            | write          | write          | `rl:POST /users/:id/merge:10.0.0.1`            |
| `GET /suggestions`                 | public         | public         | `rl:GET /suggestions:10.0.0.1`                 |
| `POST /suggestions`                | suggestion     | suggestion     | `rl:POST /suggestions:10.0.0.1`                |
| `DELETE /suggestions/:id`          | public         | public         | `rl:DELETE /suggestions/:id:10.0.0.1`          |
| `POST /limits`                     | write          | write          | `rl:POST /limits:10.0.0.1`                     |
| `POST /twir/suggestion`            | twir           | twir           | `rl:POST /twir/suggestion:10.0.0.1`            |
| `POST /telegram/webhook`           | public         | public         | `rl:POST /telegram/webhook:10.0.0.1`           |
| `GET /health`                      | public         | public         | `rl:GET /health:10.0.0.1`                      |
| `GET /wordle/state`                | public         | public         | `rl:GET /wordle/state:10.0.0.1`                |
| `POST /wordle/guess`               | write          | write          | `rl:POST /wordle/guess:10.0.0.1`               |
| `GET /wordle/stats`                | public         | public         | `rl:GET /wordle/stats:10.0.0.1`                |
| `GET /wordle/leaderboard`          | public         | public         | `rl:GET /wordle/leaderboard:10.0.0.1`          |
| `GET /wordle/practice`             | public         | public         | `rl:GET /wordle/practice:10.0.0.1`             |
| `POST /wordle/practice`            | wordlePractice | wordlePractice | `rl:POST /wordle/practice:10.0.0.1`            |
| `POST /wordle/practice/guess`      | wordlePractice | wordlePractice | `rl:POST /wordle/practice/guess:10.0.0.1`      |
| `GET /wordle/notifications`        | public         | public         | `rl:GET /wordle/notifications:10.0.0.1`        |
| `PATCH /wordle/notifications`      | public         | public         | `rl:PATCH /wordle/notifications:10.0.0.1`      |
| `POST /wordle/notifications/link`  | write          | write          | `rl:POST /wordle/notifications/link:10.0.0.1`  |
| `DELETE /wordle/notifications`     | public         | public         | `rl:DELETE /wordle/notifications:10.0.0.1`     |
| `GET /cocktails/catalog`           | public         | public         | `rl:GET /cocktails/catalog:10.0.0.1`           |
| `POST /cocktails/match`            | public         | public         | `rl:POST /cocktails/match:10.0.0.1`            |
| `GET /cocktails/bar`               | public         | public         | `rl:GET /cocktails/bar:10.0.0.1`               |
| `PUT /cocktails/bar`               | cocktailBar    | cocktailBar    | `rl:PUT /cocktails/bar:10.0.0.1`               |
| `GET /img`                         | img            | img            | `rl:GET /img:10.0.0.1`                         |
| `GET /avatar/:userId`              | public         | public         | `rl:GET /avatar/:userId:10.0.0.1`              |
| `GET /steam/games`                 | public         | public         | `rl:GET /steam/games:10.0.0.1`                 |
| `POST /steam/import`               | write          | write          | `rl:POST /steam/import:10.0.0.1`               |

## Приложение B. Методика и изоляция

- `git worktree add --detach /tmp/review-b5 b07e249`, `bun install --frozen-lockfile` (450 пакетов);
  все прогоны и скрипты — там. Основной чекаут в это время шёл вперёд и не трогался.
- A/B-база: `git archive 76d3fec | tar -x -C /tmp/review-b5-parent` + `bun install --frozen-lockfile`
  (lockfile между коммитами не менялся — `git diff` по `bun.lock*`/`package.json` пуст). Второй
  git-worktree не создавался, чтобы не оставлять записей в `.git` основного дерева.
- Динамический harness: `createTestGateway` (`@backend/__tests__/helpers/gateway-stub`) — реальный
  `createGateway` со стабами; записывающий `RateLimiter`, `auth.resolve` → USER/ADMIN; по одному
  валидному запросу на каждый из 72 зарегистрированных путей (тела/query/params/multipart сверены со
  схемами), три варианта cookie; матрица запускалась на обоих деревьях, JSON-результаты сравнивались
  скриптом (статусы, пресеты по идентичности `RATE_LIMITS.*`, ключи, count хитов).
- Статический разбор (Python, регулярные выражения + учёт границ роутов и раскрытие локальных
  хелперов) — отдельно для маршрутов/лимитов и для auth-цепочек; расхождения с динамикой
  перепроверялись чтением исходников (например, `steam.ts` использует `requireAdmin`, который тоже
  сведён к `requireAuthenticated`).
- Мутационная проверка B1 выполнялась в /tmp-worktree с последующим восстановлением файла
  (`git diff` пуст, `git status` — только удалённые в конце временные файлы).
- Временные скрипты, `backend/.env` и результаты прогонов не оставлены в репозитории; worktree
  `/tmp/review-b5` удалён (`git worktree remove --force`), `/tmp/review-b5-parent` удалён. В основном
  дереве — только этот файл; коммитов нет.
