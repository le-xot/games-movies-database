# Контрибьютинг

Проект личный, но правила простые и соблюдаются железно.

## Требования

- [Bun](https://bun.sh/) — рантайм, пакетный менеджер, тест-раннер и форматтер. **npm/pnpm не поддерживаются**
- [Docker](https://docs.docker.com/engine/) — dev-инфраструктура (PostgreSQL, Redis, RustFS, DBX)

Установка и первый запуск — в [README](README.md#быстрый-старт).

## Ветки и рабочая копия

- `master` — задеплоенная ветка. **Коммитить и пушить в неё нельзя**, её трогает только merge PR.
- Работа идёт в отдельном ворктри на отдельной ветке. Ворктри создаётся через Herdr:

  ```bash
  herdr worktree create --branch feat/кратко-о-чём --base master --no-focus
  ```

  Каталог появляется в `~/.herdr/worktrees/games-movies-database/<branch>`, после создания там же выполняется `bun install`.

- Имя ветки: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Внутри ветки коммитить и пушить можно свободно. **Отдельного подтверждения требуют:**
  merge/сквош PR в `master`, force-push, удаление ветки — всё, что попадает в задеплоенную ветку.

## Коммиты

Формат: `type(scope): что сделано`, по-русски, в императиве.

```
feat(api): Eden Treaty вместо кодогена контракта
fix(auth): OAuth-callback отвечает JSON, а не текстом
docs: описать Elysia-стек в AGENTS
chore(deploy): парашют — авто-откат, SHA-теги и runbook
```

`scope` необязателен; полезен, когда изменение касается одного домена (`auth`, `wordle`, `deploy`, `api`).

Pre-commit хук (`bun run hooks:install`) прогоняет `bun fmt --staged`. Один раз на клон:

```bash
bun hooks:install
```

## Перед PR

```bash
bun fmt --check        # форматирование (bun fmt)
bun lint               # oxlint
bun typecheck          # bun check -b (backend, database, contract) + vue-tsc
```

Тесты — по тому, что затронуто:

```bash
cd backend && bun test                      # unit backend (БД не нужна)
bun --filter=./frontend run test            # unit frontend
bun infra:start && bun run test:integration # интеграционные, Postgres + lists_test
bun run test:e2e                            # Playwright, поднимает свой стенд
bun run test:scripts                        # тесты render-env.sh и rollback.sh
```

Интеграционные тесты по умолчанию скипаются (нужен `RUN_DB_TESTS=1`) и работают только с БД, имя которой оканчивается на `_test` — продовые данные они не тронут.

Подробности по слоям тестов — [README](README.md#тестирование).

## Стиль

Полные правила — в [AGENTS.md](AGENTS.md). Самое важное:

- 2 пробела, одинарные кавычки, `printWidth: 100`, без точек с запятой — всё это делает `bun fmt`
- `.vue` — PascalCase, `.ts` — kebab-case; события — kebab-case
- Иконки: только `@lucide/vue` и `vue3-simple-icons`
- `<script setup lang="ts">`, Composition API, Pinia для состояния
- Импорты на фронте — через `@/`, на бэкенде — через `@backend/`

## Чего нельзя

- **Править `database/migrations/` руками** — только `bun db:generate`; CI падает на drift
- **Коммитить `backend/.env` и `database/.env`** — там секреты
- **Править продовый `.env` на сервере** — он генерируется `scripts/render-env.sh` и перезаписывается при каждом деплое
- **Добавлять `@nestjs/*`** — Nest выпилен, домен собирается вручную в `server/container.ts`
- **Заводить кодоген контракта** — типы идут из Eden (`import type { App }`), `@backend/*` во фронте только для типов
- **Объявлять `t.Unsafe` в схемах ответа** — ломает рантайм-валидацию TypeBox
- **Использовать `unique()` вместо `uniqueIndex()`** там, где в Prisma-эпохе был индекс

## Чек-лист PR

- [ ] Ветка от `master`, не из неё же
- [ ] `bun fmt --check`, `bun lint`, `bun typecheck` — зелёные
- [ ] Тесты, покрывающие изменение, добавлены или обновлены
- [ ] Миграция сгенерирована через `bun db:generate`, а не написана руками
- [ ] Документация обновлена, если поменялось поведение, env или команды (`README.md`, профильный `AGENTS.md`)
- [ ] В описании PR: что изменилось, как проверено, что осталось за скобками
