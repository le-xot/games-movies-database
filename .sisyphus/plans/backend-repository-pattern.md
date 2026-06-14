# Backend Refactoring: Repository + Entity Pattern

## TL;DR

> **Quick Summary**: Декаплинг бизнес-логики NestJS бекенда от Prisma ORM через введение Repository + Entity паттерна. 9 сервисов переводятся на абстрактные репозитории с Prisma-адаптерами, $Enums заменяются на app-level enum-ы, добавляется тестовая инфраструктура (bun test).
> 
> **Deliverables**:
> - App-level enum-ы, полностью заменяющие @prisma/client $Enums во всём бекенде
> - Domain entities (plain TypeScript interfaces) для каждого агрегата
> - Repository абстрактные классы + Prisma-реализации для 9 модулей
> - Transaction callback механизм для 3 транзакционных сервисов
> - Тестовая инфраструктура (bun test) + unit-тесты для всех 9 сервисов
> - Все сервисы зависят от абстракций, не от PrismaService
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Tasks 4-6 → Tasks 7-9 → Tasks 10-12 → Task 13 → F1-F4

---

## Context

### Original Request
Переписать бекенд на Entity и Repository паттерн. Будущая цель — замена Prisma на TypeORM или Drizzle без изменения бизнес-логики. Сейчас менять ORM не нужно — нужна абстракция.

### Interview Summary
**Key Discussions**:
- **Уровень абстракции**: Repository + Entity (plain interfaces), не полный DDD/Clean Architecture
- **Транзакции**: Transaction callback — `repository.transaction(async (repos) => { ... })`
- **Enums**: Заменить $Enums из @prisma/client на свои enum-ы, расширив enums.names.ts
- **Тесты**: bun test, unit-тесты для каждого сервиса ПЕРЕД рефакторингом (test-first)
- **Структура файлов**: entities/ и repositories/ рядом с модулем
- **Тест-фреймворк**: bun test (встроенный, zero-config)

**Research Findings**:
- 9 сервисов напрямую зависят от PrismaService (limit, queue, like, spotify, records-providers, suggestion, record, user, auction)
- 3 транзакционные точки: auction (callback), suggestion и user (array-style → конвертировать в callback)
- ~22 файла импортируют $Enums или типы из @prisma/client
- Нет Prisma middleware, extensions или raw SQL — чистый декаплинг возможен
- Существующие *.entity.ts файлы — это Swagger response shapes, НЕ доменные сущности
- enums.names.ts содержит только строковые идентификаторы для Swagger, не сами enum-ы
- RecordService.deleteRecord() делает like.deleteMany + record.delete БЕЗ транзакции (латентный баг)

### Metis Review
**Identified Gaps (addressed)**:
- **Naming collision**: Существующие *.entity.ts (Swagger shapes) vs новые domain entities → domain interfaces в подпапке entities/, существующие файлы не переименовывать
- **DI strategy**: NestJS не рефлектит interfaces → использовать abstract classes для repository contracts
- **Enum values must match**: App-level enum-ы должны иметь идентичные строковые значения с Prisma enum-ами для сохранения Swagger контракта
- **ThirdPartService enum**: Отсутствует в enums.names.ts → добавить
- **User type from @prisma/client**: user.service.ts и user.controller.ts импортируют тип User → заменить на domain entity
- **Prisma.QueryMode + Prisma.RecordWhereInput**: Только в record.service.ts → абстрагировать через domain-level RecordFilterOptions + RecordSortOptions
- **AuthModule anomalия**: @Global() с прямым PrismaService в providers → исправить как часть cleanup

---

## Work Objectives

### Core Objective
Декаплинг бизнес-логики бекенда от Prisma ORM через Repository + Entity pattern, чтобы в будущем можно было заменить Prisma на другую ORM без изменения сервисов.

### Concrete Deliverables
- `backend/src/enums/*.enum.ts` — 7 enum файлов (UserRole, RecordStatus, RecordType, RecordGenre, RecordGrade, LimitType, ThirdPartService)
- `backend/src/modules/*/entities/*.entity.ts` — domain interfaces для каждого модуля
- `backend/src/modules/*/repositories/*.repository.ts` — abstract classes (контракты)
- `backend/src/modules/*/repositories/prisma-*.repository.ts` — Prisma-реализации
- `backend/src/modules/*/__tests__/*.service.spec.ts` — unit-тесты для каждого сервиса
- Рефакторинг 9 сервисов: зависимость от абстракций вместо PrismaService
- Обновление 9 модулей: DI wiring через `{ provide: XRepository, useClass: PrismaXRepository }`

### Definition of Done
- [ ] `bun run build` в backend проходит без ошибок
- [ ] `bun test` в backend — все тесты проходят
- [ ] Ни один сервис (из 9 целевых) не импортирует PrismaService напрямую
- [ ] Ни один файл за пределами repositories/ и prisma.service.ts не импортирует из @prisma/client
- [ ] Swagger `/docs-json` output идентичен до и после рефакторинга (enum values не изменились)

### Must Have
- Абстрактные классы репозиториев (не interfaces) для совместимости с NestJS DI
- App-level string enum-ы с идентичными значениями Prisma enum-ам
- Transaction callback для auction, suggestion, user сервисов
- Domain entities как plain TypeScript interfaces
- Unit-тесты для каждого сервиса ДО рефакторинга (test-first)
- Каждый коммит независимо деплоим (`bun run build` проходит)

### Must NOT Have (Guardrails)
- ❌ Изменение модулей без Prisma (img, twitch, jwt, twir, weather) — **исключения**: файлы auth и websocket модулей, которые используют $Enums, можно менять ТОЛЬКО для замены $Enums на app-level enum (Task 2) и для исправления DI аномалии в auth.module.ts (Task 13). Никакие другие изменения в auth/ws не допускаются.
- ❌ Изменение seed.js или миграций
- ❌ Изменение frontend кода или api.ts
- ❌ Добавление API endpoints, DTOs или изменение Swagger контракта
- ❌ Переименование существующих файлов (особенно suggesttion.dto.ts — известный тайпо)
- ❌ Создание generic/abstract base repository class — каждый репозиторий специфичен
- ❌ Unit of Work паттерн — transaction callback достаточен
- ❌ Использование `const enum` (не совместим с IsEnum() и includes())
- ❌ Добавление логирования, валидации или error handling сверх существующего
- ❌ Создание центрального RepositoriesModule — репозитории привязаны к своим модулям
- ❌ Переименование существующих *.entity.ts файлов (Swagger shapes)
- ❌ Использование @nestjs/testing Test.createTestingModule() — совместимость с bun не гарантирована

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO → будет создана в Task 1
- **Automated tests**: YES (Test-first: write tests BEFORE refactoring each service)
- **Framework**: bun test (built-in)
- **Approach**: Mock dependencies → test current behavior → refactor → same tests pass with mock repositories

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend/API**: Use Bash (bun run build, bun test) — compile check + test execution
- **Swagger contract**: Use Bash (curl + jq diff) — compare /docs-json before/after
- **Type safety**: Use Bash (bun run build) — TypeScript compilation gate

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — must complete first):
├── Task 1: Test infrastructure setup [quick]
├── Task 2: App-level enums + replace all $Enums imports [unspecified-high]
└── Task 3: Domain entities + base repository pattern [unspecified-high]

Wave 2 (Simple services — MAX PARALLEL after Wave 1):
├── Task 4: Limit — test + repository + refactor [quick]
├── Task 5: Queue — test + repository + refactor [quick]
└── Task 6: Like — test + repository + refactor [unspecified-high]

Wave 3 (Moderate + Heavy services — MAX PARALLEL after Wave 2):
├── Task 7: Spotify — test + repository + refactor [unspecified-high]
├── Task 8: Records-Providers — test + repository + refactor [unspecified-high]
├── Task 9: Suggestion — test + repository + transaction refactor [deep]
├── Task 10: Record — test + repository + filter abstraction [deep]
├── Task 11: User — test + repository + aggregation + transaction [deep]
└── Task 12: Auction — test + repository + callback transaction [deep]

Wave FINAL (After ALL tasks):
├── Task 13: Cleanup — remove PrismaModule imports, fix AuthModule [quick]
├── F1: Plan compliance audit [oracle]
├── F2: Code quality review [unspecified-high]
├── F3: Real manual QA [unspecified-high]
└── F4: Scope fidelity check [deep]
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4-12 | 1 |
| 2 | — | 3-12 | 1 |
| 3 | 2 | 4-12 | 1 |
| 4 | 1, 3 | 13 | 2 |
| 5 | 1, 3 | 13 | 2 |
| 6 | 1, 3 | 13 | 2 |
| 7 | 1, 3 | 13 | 3 |
| 8 | 1, 3 | 13 | 3 |
| 9 | 1, 3, 8 | 13 | 3 |
| 10 | 1, 3 | 13 | 3 |
| 11 | 1, 3 | 13 | 3 |
| 12 | 1, 3 | 13 | 3 |
| 13 | 4-12 | F1-F4 | Final |
| F1-F4 | 13 | — | Final |

### Agent Dispatch Summary

- **Wave 1**: **3** tasks — T1 → `quick`, T2 → `unspecified-high`, T3 → `unspecified-high`
- **Wave 2**: **3** tasks — T4 → `quick`, T5 → `quick`, T6 → `unspecified-high`
- **Wave 3**: **6** tasks — T7 → `unspecified-high`, T8 → `unspecified-high`, T9 → `deep`, T10 → `deep`, T11 → `deep`, T12 → `deep`
- **Final**: **5** tasks — T13 → `quick`, F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Set up bun test infrastructure

  **What to do**:
  - Add `"test"` script to `backend/package.json`: `"test": "bun test"`
  - Create `backend/src/__tests__/helpers/` directory with test utilities:
    - `mock-factory.ts` — generic helper to create typed mocks of abstract classes. For each method on the abstract class, create a mock function that returns `undefined` by default. Export a `createMock<T>(Type: abstract new (...args: any[]) => T): T` function.
  - Create `backend/src/__tests__/setup.ts` — any global test setup if needed (can be empty initially)
  - Verify bun test runner discovers and runs `.spec.ts` files in `backend/src/`
  - Create a minimal smoke test `backend/src/__tests__/smoke.spec.ts` that asserts `1 + 1 === 2` to verify the pipeline works

  **Must NOT do**:
  - Install any npm packages for testing — bun test is built-in
  - Use @nestjs/testing or Test.createTestingModule()
  - Create test configuration files (bun test is zero-config)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3 — but 2 and 3 don't depend on 1)
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4-12 (all service test+refactor tasks)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `backend/package.json` — existing scripts section, add "test" script here

  **External References**:
  - Bun test docs: https://bun.sh/docs/cli/test — bun test API, expect(), describe(), it(), mock()

  **WHY Each Reference Matters**:
  - `package.json` — need to add the test script following existing script naming conventions
  - Bun test docs — to understand bun's built-in test API (describe/it/expect/mock) which differs from jest

  **Acceptance Criteria**:

  - [ ] `backend/package.json` has `"test": "bun test"` script
  - [ ] `backend/src/__tests__/helpers/mock-factory.ts` exists with createMock function
  - [ ] `bun test` in backend directory → PASS (1 test, 0 failures)

  **QA Scenarios**:

  ```
  Scenario: Smoke test passes
    Tool: Bash
    Preconditions: backend dependencies installed (bun install)
    Steps:
      1. Run `cd backend && bun test`
      2. Assert exit code is 0
      3. Assert output contains "1 pass"
    Expected Result: bun test completes with 1 passing test
    Failure Indicators: Exit code non-zero, "0 pass" in output, "error" in output
    Evidence: .sisyphus/evidence/task-1-smoke-test.txt

  Scenario: Mock factory creates typed mock
    Tool: Bash
    Preconditions: smoke.spec.ts updated to import and use createMock
    Steps:
      1. Create a test that uses createMock with a simple abstract class
      2. Verify mock methods are callable and return undefined
      3. Run `cd backend && bun test`
    Expected Result: Test passes, mock methods are callable
    Failure Indicators: Import error, type error, test failure
    Evidence: .sisyphus/evidence/task-1-mock-factory.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add bun test infrastructure`
  - Files: `backend/package.json`, `backend/src/__tests__/helpers/mock-factory.ts`, `backend/src/__tests__/setup.ts`, `backend/src/__tests__/smoke.spec.ts`
  - Pre-commit: `cd backend && bun test`

- [x] 2. Create app-level enums and replace all @prisma/client $Enums imports

  **What to do**:
  - Create TypeScript string enums in `backend/src/enums/` — one file per enum, kebab-case naming:
    - `user-role.enum.ts`: `export enum UserRole { USER = 'USER', ADMIN = 'ADMIN' }`
    - `record-status.enum.ts`: `export enum RecordStatus { ... }` — copy exact values from Prisma schema
    - `record-type.enum.ts`: `export enum RecordType { ... }`
    - `record-genre.enum.ts`: `export enum RecordGenre { ... }`
    - `record-grade.enum.ts`: `export enum RecordGrade { ... }`
    - `limit-type.enum.ts`: `export enum LimitType { ... }`
    - `third-part-service.enum.ts`: `export enum ThirdPartService { ... }`
  - Create barrel export `backend/src/enums/index.ts` that re-exports all enums
  - Update `backend/src/enums/enums.names.ts` to import from new enum files (keep string constants for Swagger enumName)
  - Replace ALL `import { $Enums } from '@prisma/client'` with imports from `@/enums` across all 22 files:
    - DTOs: `record.dto.ts`, `user.dto.ts`, `limit.dto.ts`, `queue.dto.ts`
    - Entities (Swagger): `record.entity.ts`, `user.entity.ts`
    - Controllers: `record.controller.ts`, `user.controller.ts`, `auction.controller.ts`, `suggestion.controller.ts`, `limit.controller.ts`, `like.controller.ts`, `spotify.controller.ts`
    - Guards: `auth.roles.guard.ts`
    - Services: `record.service.ts`, `user.service.ts`, `queue.service.ts`, `suggestion.service.ts`, `auction.service.ts`, `records-providers.service.ts`, `spotify.service.ts`
    - Events: `websocket.events.ts`
  - Replace `import { User } from '@prisma/client'` in `user.service.ts` and `user.controller.ts` — will be addressed fully in Task 11, but for now change import to keep `User` type from Prisma (only remove $Enums)
  - Replace `import { Prisma } from '@prisma/client'` usage in `record.service.ts` — will be fully addressed in Task 10, keep for now but remove $Enums part
  - Ensure all `@ApiProperty({ enum: ... })` decorators reference new app enums with same values
  - Verify Swagger `/docs-json` output is unchanged

  **Must NOT do**:
  - Change enum member VALUES — only change import source
  - Use `const enum` — not compatible with runtime checks
  - Rename any existing files
  - Change API endpoints or response shapes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Mechanical but wide-reaching change across 22 files, must be precise
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 3, Tasks 4-12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `backend/src/enums/enums.names.ts` — existing enum naming constants, extend this pattern
  - `backend/prisma/schema.prisma` — source of truth for all enum values (UserRole, RecordStatus, RecordType, RecordGenre, RecordGrade, LimitType, ThirdPartService)

  **API/Type References**:
  - All files importing `$Enums` — grep for `from '@prisma/client'` to find complete list

  **WHY Each Reference Matters**:
  - `schema.prisma` — exact enum values to mirror 1:1 in app-level enums
  - `enums.names.ts` — existing pattern for Swagger enum naming, must be consistent

  **Acceptance Criteria**:

  - [ ] 7 enum files created in `backend/src/enums/`
  - [ ] `backend/src/enums/index.ts` barrel export exists
  - [ ] `bun run build` in backend → no errors
  - [ ] Zero files import `$Enums` from `@prisma/client` (verify with grep)
  - [ ] Swagger `/docs-json` enum definitions unchanged (values identical)

  **QA Scenarios**:

  ```
  Scenario: Build passes after enum replacement
    Tool: Bash
    Preconditions: All enum files created and imports replaced
    Steps:
      1. Run `cd backend && bun run build`
      2. Assert exit code is 0
    Expected Result: TypeScript compilation succeeds with zero errors
    Failure Indicators: Type errors mentioning enum types, missing imports
    Evidence: .sisyphus/evidence/task-2-build.txt

  Scenario: No $Enums imports remain
    Tool: Bash
    Preconditions: All replacements done
    Steps:
      1. Run `grep -r '\$Enums' backend/src/ --include='*.ts'`
      2. Assert output is empty (exit code 1, no matches)
    Expected Result: Zero occurrences of $Enums in backend source
    Failure Indicators: Any grep match found
    Evidence: .sisyphus/evidence/task-2-no-enums.txt

  Scenario: Swagger contract preserved
    Tool: Bash
    Preconditions: Backend running with new enums
    Steps:
      1. Capture baseline BEFORE changes: start backend on current code, `curl -s http://localhost:3000/docs-json | jq '.components.schemas' > .sisyphus/evidence/swagger-baseline.json`
      2. After changes: `curl -s http://localhost:3000/docs-json | jq '.components.schemas' > /tmp/swagger-after.json`
      3. Run `diff .sisyphus/evidence/swagger-baseline.json /tmp/swagger-after.json`
      4. Assert diff is empty
    Expected Result: Swagger schema definitions identical before and after
    Failure Indicators: Any diff output (changed enum values, missing enums)
    Evidence: .sisyphus/evidence/task-2-swagger-diff.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): replace prisma $Enums with app-level enums`
  - Files: `backend/src/enums/*.enum.ts`, `backend/src/enums/index.ts`, `backend/src/enums/enums.names.ts`, ~22 files with updated imports
  - Pre-commit: `cd backend && bun run build`

- [x] 3. Create domain entities and establish base repository pattern

  **What to do**:
  - Create domain entity interfaces for each aggregate in `modules/{name}/entities/` subdirectories:
    - `modules/limit/entities/limit.entity.ts` — `LimitDomain` interface
    - `modules/queue/entities/` — uses RecordDomain (from record module), no own entity needed
    - `modules/like/entities/like.entity.ts` — `LikeDomain` interface
    - `modules/spotify/entities/spotify-token.entity.ts` — `SpotifyTokenDomain` interface
    - `modules/records-providers/entities/` — uses RecordDomain and SuggestionRulesDomain
    - `modules/suggestion/entities/suggestion-rules.entity.ts` — `SuggestionRulesDomain` interface
    - `modules/record/entities/record-domain.entity.ts` — `RecordDomain`, `RecordWithRelations`, `RecordFilterOptions` interfaces
    - `modules/user/entities/user-domain.entity.ts` — `UserDomain`, `ProfileStatsDomain` interfaces
    - `modules/auction/entities/auction-history.entity.ts` — `AuctionHistoryDomain` interface
  - All domain interfaces use app-level enums (from Task 2), NOT @prisma/client types
  - Field names and types must match Prisma schema 1:1 (same names, same optionality)
  - Create `RecordFilterOptions` in record entities — domain-level filter type to replace `Prisma.RecordWhereInput`:
    ```typescript
    export interface RecordFilterOptions {
      search?: string; // case-insensitive search on title and user login
      status?: RecordStatus;
      type?: RecordType;
      grade?: RecordGrade;
      genre?: RecordGenre;
      userId?: string;
    }

    export interface RecordSortOptions {
      orderBy?: 'title' | 'id';
      direction?: 'asc' | 'desc';
    }
    ```
  - Create `TransactionContext` interface in `backend/src/database/transaction.interface.ts`:
    ```typescript
    export interface TransactionManager {
      transaction<T>(fn: (ctx: TransactionContext) => Promise<T>): Promise<T>;
    }
    ```
    The concrete `TransactionContext` will provide access to transactional repository instances — exact shape defined per-module during Tasks 9-12.
  - Establish naming convention: domain entity files use `*-domain.entity.ts` suffix to avoid collision with existing Swagger `*.entity.ts` files. Exception: modules where no existing entity file exists (like, limit, spotify, suggestion, auction-history) can use plain `*.entity.ts`.

  **Must NOT do**:
  - Add @ApiProperty() decorators to domain interfaces
  - Rename or modify existing *.entity.ts files (Swagger response shapes)
  - Create repository implementations yet (those come in Tasks 4-12)
  - Create a base/generic repository class

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files across many modules, needs careful type alignment with Prisma schema
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1, after Task 2)
  - **Parallel Group**: Wave 1 (starts after Task 2 completes)
  - **Blocks**: Tasks 4-12
  - **Blocked By**: Task 2 (needs app-level enums)

  **References**:

  **Pattern References**:
  - `backend/src/modules/user/user.entity.ts` — existing Swagger entity pattern (DO NOT copy decorators, just understand field shapes)
  - `backend/src/modules/record/record.entity.ts` — existing Swagger entity with relations (user, likes)
  - `backend/src/modules/like/like.entity.ts` — simple entity example

  **API/Type References**:
  - `backend/prisma/schema.prisma` — source of truth for all model fields, types, relations, and optionality
  - `backend/src/enums/index.ts` (from Task 2) — app-level enums to use in domain interfaces

  **WHY Each Reference Matters**:
  - `schema.prisma` — domain entities must mirror model fields exactly (names, types, optionality)
  - Existing entity files — understand what already exists to avoid naming collisions
  - App enums — domain entities must use app enums, not Prisma types

  **Acceptance Criteria**:

  - [ ] Domain entity interfaces created for: Limit, Like, SpotifyToken, SuggestionRules, Record (+ RecordWithRelations + RecordFilterOptions + RecordSortOptions), User (+ ProfileStats), AuctionHistory
  - [ ] All domain entities use app-level enums from `@/enums`
  - [ ] `TransactionManager` interface created in `backend/src/database/transaction.interface.ts`
  - [ ] No `@ApiProperty()` decorators in domain entities
  - [ ] No imports from `@prisma/client` in domain entity files
  - [ ] `bun run build` passes

  **QA Scenarios**:

  ```
  Scenario: Build passes with domain entities
    Tool: Bash
    Preconditions: All entity files created
    Steps:
      1. Run `cd backend && bun run build`
      2. Assert exit code is 0
    Expected Result: TypeScript compilation succeeds
    Failure Indicators: Type errors in entity files, missing enum imports
    Evidence: .sisyphus/evidence/task-3-build.txt

  Scenario: No @prisma/client in domain entities
    Tool: Bash
    Preconditions: Entity files created
    Steps:
      1. Run `grep -r '@prisma/client' backend/src/modules/*/entities/ --include='*.ts'`
      2. Assert output is empty
    Expected Result: Zero Prisma imports in domain entity files
    Failure Indicators: Any grep match
    Evidence: .sisyphus/evidence/task-3-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add domain entities and transaction interface`
  - Files: `backend/src/modules/*/entities/*.entity.ts`, `backend/src/database/transaction.interface.ts`
  - Pre-commit: `cd backend && bun run build`

- [x] 4. Limit service — test + repository + refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/limit/__tests__/limit.service.spec.ts`):
    - Test `changeLimit()` — verify it calls prisma.limit.update with correct params and returns result
    - Mock PrismaService, assert exact call shape
  - **Create repository** (`backend/src/modules/limit/repositories/`):
    - `limit.repository.ts` — abstract class `LimitRepository` with method: `update(name: LimitType, value: number): Promise<LimitDomain>`
    - `prisma-limit.repository.ts` — `PrismaLimitRepository extends LimitRepository` injects PrismaService and implements `update()`
  - **Refactor LimitService**:
    - Replace `PrismaService` injection with `LimitRepository` injection
    - `changeLimit()` calls `this.limitRepository.update(...)` instead of `this.prisma.limit.update(...)`
  - **Update LimitModule**:
    - Remove `PrismaModule` import (will be imported by PrismaLimitRepository internally or via providers)
    - Add provider: `{ provide: LimitRepository, useClass: PrismaLimitRepository }`
    - Import `PrismaModule` for PrismaLimitRepository to receive PrismaService
  - **Update tests**: Change mock from PrismaService to LimitRepository, verify same assertions pass

  **Must NOT do**:
  - Change limit.controller.ts logic (only enum imports if needed)
  - Change limit.dto.ts beyond enum imports
  - Add new endpoints or validation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simplest service — single method, no transactions, no relations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/limit/limit.service.ts` — current implementation (single `changeLimit` method calling `this.prisma.limit.update`)
  - `backend/src/modules/limit/limit.module.ts` — current module wiring
  - `backend/src/modules/limit/limit.dto.ts` — ChangeLimitDTO shape
  - `backend/src/__tests__/helpers/mock-factory.ts` (from Task 1) — use for creating mock repository

  **API/Type References**:
  - `backend/src/modules/limit/entities/limit.entity.ts` (from Task 3) — LimitDomain interface
  - `backend/src/enums/limit-type.enum.ts` (from Task 2) — LimitType enum

  **WHY Each Reference Matters**:
  - `limit.service.ts` — understand exact Prisma call to replicate in repository
  - `mock-factory.ts` — create typed mocks for tests

  **Acceptance Criteria**:

  - [ ] `limit.service.spec.ts` exists with tests for changeLimit()
  - [ ] `LimitRepository` abstract class with `update()` method
  - [ ] `PrismaLimitRepository` implements LimitRepository
  - [ ] `LimitService` depends on `LimitRepository` (not PrismaService)
  - [ ] `bun test backend/src/modules/limit/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Limit service tests pass
    Tool: Bash
    Preconditions: Test file and repository created
    Steps:
      1. Run `cd backend && bun test src/modules/limit/`
      2. Assert exit code is 0
      3. Assert output contains "pass"
    Expected Result: All limit service tests pass
    Failure Indicators: Test failures, import errors
    Evidence: .sisyphus/evidence/task-4-limit-tests.txt

  Scenario: LimitService no longer imports PrismaService
    Tool: Bash
    Preconditions: Refactoring complete
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/limit/limit.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references in limit.service.ts
    Failure Indicators: Any grep match
    Evidence: .sisyphus/evidence/task-4-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract LimitRepository and decouple limit service`
  - Files: `backend/src/modules/limit/` (all new + modified files)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 5. Queue service — test + repository + refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/queue/__tests__/queue.service.spec.ts`):
    - Test `getQueue()` — verify it calls prisma.record.findMany with correct filters (status, type) and include: { user: true }
    - Test response mapping to QueueDto
    - Mock PrismaService
  - **Create repository** (`backend/src/modules/queue/repositories/`):
    - `queue.repository.ts` — abstract class `QueueRepository` with methods: `findQueueRecords(type: RecordType): Promise<RecordWithRelations[]>` (type-filtered queue items with user relation)
    - `prisma-queue.repository.ts` — implements with PrismaService
  - **Refactor QueueService**:
    - Replace PrismaService with QueueRepository
    - Service handles mapping to QueueDto, repository handles data access
  - **Update QueueModule**: Add repository provider, keep PrismaModule for repository

  **Must NOT do**:
  - Change queue.controller.ts logic
  - Modify QueueDto mapping logic (it stays in service)
  - Change response shape

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Read-only service, no writes, no transactions, just findMany + mapping
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/queue/queue.service.ts` — current implementation with prisma.record.findMany and QueueDto mapping
  - `backend/src/modules/queue/queue.dto.ts` — QueueDto shape (output format)
  - `backend/src/modules/limit/repositories/limit.repository.ts` (from Task 4) — repository pattern to follow

  **API/Type References**:
  - `backend/src/modules/record/entities/record-domain.entity.ts` (from Task 3) — RecordWithRelations interface
  - `backend/src/enums/record-status.enum.ts` (from Task 2) — RecordStatus.QUEUE

  **WHY Each Reference Matters**:
  - `queue.service.ts` — understand findMany filters and response mapping
  - `record-domain.entity.ts` — repository returns RecordWithRelations (includes user)
  - Task 4 repository — follow the established pattern

  **Acceptance Criteria**:

  - [ ] `queue.service.spec.ts` exists with tests for getQueue()
  - [ ] `QueueRepository` abstract class with findQueueRecords()
  - [ ] `PrismaQueueRepository` implements QueueRepository
  - [ ] `QueueService` depends on QueueRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/queue/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Queue service tests pass
    Tool: Bash
    Preconditions: Test file and repository created
    Steps:
      1. Run `cd backend && bun test src/modules/queue/`
      2. Assert exit code is 0
    Expected Result: All queue service tests pass
    Failure Indicators: Test failures
    Evidence: .sisyphus/evidence/task-5-queue-tests.txt

  Scenario: QueueService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/queue/queue.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-5-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract QueueRepository and decouple queue service`
  - Files: `backend/src/modules/queue/` (all new + modified files)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 6. Like service — test + repository + refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/like/__tests__/like.service.spec.ts`):
    - Test `createLike()` — verify uniqueness check (findFirst), create, and EventEmitter2 emit('update-likes')
    - Test `deleteLike()` — verify deleteMany and event emission
    - Test `getLikes()` — verify findMany with pagination (skip/take) and count
    - Test `getLikesCount()` — verify count call
    - Mock PrismaService and EventEmitter2
  - **Create repository** (`backend/src/modules/like/repositories/`):
    - `like.repository.ts` — abstract class `LikeRepository`:
      - `findByUserAndRecord(userId: string, recordId: number): Promise<LikeDomain | null>`
      - `create(userId: string, recordId: number): Promise<LikeDomain>`
      - `deleteByUserAndRecord(userId: string, recordId: number): Promise<number>` (returns deleted count)
      - `findByRecord(recordId: number, skip: number, take: number): Promise<LikeDomain[]>`
      - `findByUser(userId: string): Promise<LikeDomain[]>`
      - `countAll(): Promise<number>`
    - `prisma-like.repository.ts` — PrismaLikeRepository implements above
  - **Refactor LikeService**: Replace PrismaService with LikeRepository. Keep EventEmitter2 emissions unchanged.
  - **Update LikeModule**: Add repository provider

  **Must NOT do**:
  - Change EventEmitter2 event names or payloads
  - Modify like.controller.ts beyond enum imports
  - Change uniqueness check logic (just move to repository method)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple CRUD methods + event emission verification in tests
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/like/like.service.ts` — current implementation with findFirst/create/deleteMany/findMany/count
  - `backend/src/modules/websocket/websocket.events.ts` — event payload types for 'update-likes'
  - `backend/src/modules/limit/repositories/limit.repository.ts` (from Task 4) — repository pattern

  **API/Type References**:
  - `backend/src/modules/like/entities/like.entity.ts` (from Task 3) — LikeDomain interface
  - `backend/src/modules/like/like.dto.ts` — Like DTO shapes

  **WHY Each Reference Matters**:
  - `like.service.ts` — 5 different Prisma operations to wrap, plus event emission logic
  - `websocket.events.ts` — event names and payloads must remain identical after refactoring

  **Acceptance Criteria**:

  - [ ] `like.service.spec.ts` with tests for createLike, deleteLike, getLikes, getLikesCount
  - [ ] `LikeRepository` abstract class with 6 methods
  - [ ] `PrismaLikeRepository` implements LikeRepository
  - [ ] LikeService depends on LikeRepository (not PrismaService)
  - [ ] EventEmitter2 emissions preserved (tested)
  - [ ] `bun test backend/src/modules/like/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Like service tests pass with event verification
    Tool: Bash
    Preconditions: Test and repository files created
    Steps:
      1. Run `cd backend && bun test src/modules/like/`
      2. Assert exit code is 0
      3. Assert output shows tests for createLike, deleteLike, getLikes
    Expected Result: All like service tests pass including event emission assertions
    Failure Indicators: Test failures, missing event assertions
    Evidence: .sisyphus/evidence/task-6-like-tests.txt

  Scenario: LikeService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/like/like.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-6-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract LikeRepository and decouple like service`
  - Files: `backend/src/modules/like/` (all new + modified files)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 7. Spotify service — test + repository + refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/spotify/__tests__/spotify.service.spec.ts`):
    - Test `onApplicationBootstrap()` — verify it calls findUnique to load existing token
    - Test `callback()` — verify it exchanges code for token and calls upsert
    - Test `refreshToken()` — verify it reads token, calls Spotify API, updates DB
    - Mock PrismaService and HTTP calls (fetch/Spotify client)
  - **Create repository** (`backend/src/modules/spotify/repositories/`):
    - `spotify-token.repository.ts` — abstract class `SpotifyTokenRepository`:
      - `findByService(service: ThirdPartService): Promise<SpotifyTokenDomain | null>`
      - `upsert(service: ThirdPartService, data: { accessToken: string; refreshToken: string }): Promise<SpotifyTokenDomain>`
      - `update(service: ThirdPartService, data: Partial<{ accessToken: string; refreshToken: string }>): Promise<SpotifyTokenDomain>`
    - `prisma-spotify-token.repository.ts` — PrismaSpotifyTokenRepository
  - **Refactor SpotifyService**: Replace PrismaService with SpotifyTokenRepository
  - **Update SpotifyModule**: Add repository provider

  **Must NOT do**:
  - Change Spotify API integration logic
  - Modify onApplicationBootstrap lifecycle behavior
  - Change OAuth flow

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: OAuth token lifecycle + upsert semantics + lifecycle hooks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8-12)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/spotify/spotify.service.ts` — token storage/refresh flow with thirdPartyOauthServiceToken model
  - `backend/src/modules/spotify/spotify-queue.service.ts` — separate service (doesn't use Prisma, no changes needed)
  - `backend/src/modules/limit/repositories/` (from Task 4) — established repository pattern

  **API/Type References**:
  - `backend/src/modules/spotify/entities/spotify-token.entity.ts` (from Task 3) — SpotifyTokenDomain
  - `backend/src/enums/third-part-service.enum.ts` (from Task 2) — ThirdPartService enum

  **WHY Each Reference Matters**:
  - `spotify.service.ts` — understand upsert vs update patterns, onApplicationBootstrap init
  - `spotify-queue.service.ts` — confirm it doesn't need changes (no Prisma)

  **Acceptance Criteria**:

  - [ ] `spotify.service.spec.ts` with tests for bootstrap, callback, refreshToken
  - [ ] `SpotifyTokenRepository` abstract class with findByService/upsert/update
  - [ ] SpotifyService depends on SpotifyTokenRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/spotify/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Spotify service tests pass
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/spotify/`
      2. Assert exit code is 0
    Expected Result: All spotify service tests pass
    Evidence: .sisyphus/evidence/task-7-spotify-tests.txt

  Scenario: SpotifyService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/spotify/spotify.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-7-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract SpotifyTokenRepository and decouple spotify service`
  - Files: `backend/src/modules/spotify/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 8. Records-Providers service — test + repository + refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/records-providers/__tests__/records-providers.service.spec.ts`):
    - Test `prepareData()` for different link types (IGDB, Kinopoisk, Shikimori)
    - Test duplicate record check (findFirst)
    - Test suggestion rules validation (findUnique on suggestionRules)
    - Mock PrismaService, TwitchService, and HTTP calls
  - **Create repository** (`backend/src/modules/records-providers/repositories/`):
    - `records-providers.repository.ts` — abstract class `RecordsProvidersRepository`:
      - `findRecordByLinkAndGenre(link: string, genre: RecordGenre): Promise<RecordDomain | null>` — check duplicate by `link` + `genre` (maps to `prisma.record.findFirst({ where: { link, genre } })`)
      - `findSuggestionRulesByGenre(genre: RecordGenre): Promise<SuggestionRulesDomain | null>` — permission check by `genre` (maps to `prisma.suggestionRules.findUnique({ where: { genre } })`)
    - `prisma-records-providers.repository.ts` — implements with PrismaService
  - **Refactor RecordsProvidersService**: Replace PrismaService with RecordsProvidersRepository
  - **Update RecordsProvidersModule**: Add repository provider

  **Must NOT do**:
  - Change external API integration logic (IGDB, Kinopoisk, Shikimori)
  - Modify link parsing logic
  - Change validation rules

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: External API interactions + validation logic, moderate complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9-12)
  - **Blocks**: Task 9 (SuggestionService uses RecordsProvidersService), Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/records-providers/records-providers.service.ts` — prepareData() with link parsing, external API calls, duplicate checks, suggestion rules
  - `backend/src/modules/twitch/twitch.service.ts` — TwitchService used for IGDB token

  **API/Type References**:
  - `backend/src/modules/record/entities/record-domain.entity.ts` (from Task 3) — RecordDomain
  - `backend/src/modules/suggestion/entities/suggestion-rules.entity.ts` (from Task 3) — SuggestionRulesDomain

  **WHY Each Reference Matters**:
  - `records-providers.service.ts` — understand the two DB calls (findFirst, findUnique) among extensive business logic
  - External API calls are NOT being changed — only DB access layer

  **Acceptance Criteria**:

  - [ ] `records-providers.service.spec.ts` with tests for duplicate check and rules validation
  - [ ] `RecordsProvidersRepository` abstract class with findRecordByLinkAndGenre/findSuggestionRulesByGenre
  - [ ] RecordsProvidersService depends on RecordsProvidersRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/records-providers/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Records-providers service tests pass
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/records-providers/`
      2. Assert exit code is 0
    Expected Result: All records-providers tests pass
    Evidence: .sisyphus/evidence/task-8-records-providers-tests.txt

  Scenario: RecordsProvidersService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/records-providers/records-providers.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-8-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract RecordsProvidersRepository and decouple service`
  - Files: `backend/src/modules/records-providers/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 9. Suggestion service — test + repository + transaction refactor

  **What to do**:
  - **Write tests first** (`backend/src/modules/suggestion/__tests__/suggestion.service.spec.ts`):
    - Test `createSuggestion()` — verify limit check (limit.findUnique), count check, prepareData call, record.create, event emission
    - Test `getUserSuggestions()` — verify findMany with filters and include
    - Test `deleteUserSuggestion()` — verify ownership check, transactional delete (like.deleteMany + record.delete), event emission
    - Mock PrismaService, RecordsProvidersService, EventEmitter2
  - **Create repository** (`backend/src/modules/suggestion/repositories/`):
    - `suggestion.repository.ts` — abstract class `SuggestionRepository`:
      - `findLimit(userId: string, type: LimitType): Promise<LimitDomain | null>`
      - `countUserSuggestions(userId: string, type: RecordType): Promise<number>`
      - `createSuggestion(data: CreateSuggestionData): Promise<RecordWithRelations>`
      - `findSuggestions(filters: SuggestionFilters): Promise<RecordWithRelations[]>`
      - `findSuggestionById(id: number): Promise<RecordWithRelations | null>`
      - `deleteSuggestionWithLikes(recordId: number): Promise<void>` — transaction: deleteMany likes + delete record
    - `prisma-suggestion.repository.ts` — PrismaSuggestionRepository
      - `deleteSuggestionWithLikes` implements using `this.prisma.$transaction()` callback to replace array-style
  - **Refactor SuggestionService**: Replace PrismaService with SuggestionRepository. Convert array-style transaction to callback-style via repository method.
  - **Update SuggestionModule**: Add repository provider

  **Must NOT do**:
  - Change RecordsProvidersService interaction
  - Modify event emission logic
  - Change limit validation rules
  - Rename suggesttion.dto.ts (known typo)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Transaction conversion (array → callback), cross-model operations, limit checks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 8 completes)
  - **Parallel Group**: Wave 3 (with Tasks 7-8, 10-12)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3, 8 (uses RecordsProvidersService)

  **References**:

  **Pattern References**:
  - `backend/src/modules/suggestion/suggestion.service.ts` — limit checks, create, transactional delete, event emissions
  - `backend/src/modules/suggestion/suggesttion.dto.ts` — DTO shapes (note typo in filename)
  - `backend/src/modules/like/repositories/` (from Task 6) — repository pattern with multiple methods

  **API/Type References**:
  - `backend/src/modules/record/entities/record-domain.entity.ts` (from Task 3) — RecordWithRelations
  - `backend/src/modules/limit/entities/limit.entity.ts` (from Task 3) — LimitDomain
  - `backend/src/database/transaction.interface.ts` (from Task 3) — TransactionManager

  **WHY Each Reference Matters**:
  - `suggestion.service.ts` — understand the array-style $transaction pattern to convert to callback
  - Transaction interface — follow established pattern for transactional repository methods

  **Acceptance Criteria**:

  - [ ] `suggestion.service.spec.ts` with tests for create, list, delete (including transaction verification)
  - [ ] `SuggestionRepository` abstract class with 6 methods including transactional deleteSuggestionWithLikes
  - [ ] Array-style $transaction converted to callback-style in PrismaSuggestionRepository
  - [ ] SuggestionService depends on SuggestionRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/suggestion/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Suggestion service tests pass including transaction
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/suggestion/`
      2. Assert exit code is 0
      3. Assert tests cover deleteSuggestionWithLikes (transactional delete)
    Expected Result: All tests pass, transaction logic verified
    Evidence: .sisyphus/evidence/task-9-suggestion-tests.txt

  Scenario: SuggestionService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/suggestion/suggestion.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-9-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract SuggestionRepository with transaction support`
  - Files: `backend/src/modules/suggestion/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 10. Record service — test + repository + filter abstraction

  **What to do**:
  - **Write tests first** (`backend/src/modules/record/__tests__/record.service.spec.ts`):
    - Test `createRecord()` — verify prepareData, record.create with user connect, event emission based on status/type
    - Test `getAllRecords()` — verify filter building (search, status, type, grade, genre, userId), sorting (orderBy, direction), pagination (skip/take), include, count
    - Test `updateRecord()` — verify record.update with include, conditional event emission
    - Test `deleteRecord()` — verify like.deleteMany + record.delete (note: currently non-transactional)
    - Test `getRecordById()` — verify findUnique with include
    - Mock PrismaService, RecordsProvidersService, EventEmitter2
  - **Create repository** (`backend/src/modules/record/repositories/`):
    - `record.repository.ts` — abstract class `RecordRepository`:
      - `create(data: CreateRecordData): Promise<RecordWithRelations>`
      - `findById(id: number): Promise<RecordWithRelations | null>`
      - `findAll(filters: RecordFilterOptions, sort: RecordSortOptions, pagination: { skip: number; take: number }): Promise<RecordWithRelations[]>`
      - `count(filters: RecordFilterOptions): Promise<number>`
      - `update(id: number, data: UpdateRecordData): Promise<RecordWithRelations>`
      - `delete(id: number): Promise<void>` — includes deleting related likes (wrap in transaction to fix the latent bug)
    - `prisma-record.repository.ts` — PrismaRecordRepository:
      - Translate `RecordFilterOptions` to `Prisma.RecordWhereInput` and `RecordSortOptions` to `Prisma.RecordOrderByWithRelationInput` internally
      - Use `Prisma.QueryMode.insensitive` for search filter internally
      - Handle `include: { user: true, likes: true }` internally
      - `delete()` wraps like.deleteMany + record.delete in $transaction (fixing latent bug)
  - **Refactor RecordService**: Replace PrismaService with RecordRepository. Remove Prisma.RecordWhereInput, Prisma.QueryMode, and Prisma.RecordOrderByWithRelationInput imports. Use RecordFilterOptions + RecordSortOptions from domain entities.
  - **Update RecordModule**: Add repository provider

  **Must NOT do**:
  - Change RecordsProvidersService interaction
  - Modify event emission conditions
  - Change pagination logic
  - Change API response shapes

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex filters, Prisma.QueryMode abstraction, multiple CRUD operations, event conditions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7-9, 11-12)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/record/record.service.ts` — all CRUD operations, filter building with Prisma.RecordWhereInput, event emission conditions
  - `backend/src/modules/record/record.dto.ts` — RecordCreateFromLinkDTO, RecordUpdateDTO
  - `backend/src/modules/websocket/websocket.events.ts` — event types and payload shapes

  **API/Type References**:
  - `backend/src/modules/record/entities/record-domain.entity.ts` (from Task 3) — RecordDomain, RecordWithRelations, RecordFilterOptions
  - `backend/src/enums/` (from Task 2) — RecordStatus, RecordType, RecordGenre, RecordGrade

  **WHY Each Reference Matters**:
  - `record.service.ts` — heaviest service file, understand dynamic where building with Prisma types to abstract properly
  - `RecordFilterOptions` — the domain-level replacement for Prisma.RecordWhereInput
  - Event types — many different events emitted based on status/type transitions

  **Acceptance Criteria**:

  - [ ] `record.service.spec.ts` with tests for all CRUD operations
  - [ ] `RecordRepository` abstract class with 6 methods
  - [ ] `PrismaRecordRepository` translates RecordFilterOptions → Prisma.RecordWhereInput internally
  - [ ] No imports from `Prisma` namespace in `record.service.ts`
  - [ ] Delete operation now uses transaction (fixing latent bug)
  - [ ] `bun test backend/src/modules/record/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Record service tests pass
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/record/`
      2. Assert exit code is 0
    Expected Result: All record service tests pass
    Evidence: .sisyphus/evidence/task-10-record-tests.txt

  Scenario: No Prisma namespace imports in record.service.ts
    Tool: Bash
    Steps:
      1. Run `grep -n "from '@prisma/client'" backend/src/modules/record/record.service.ts`
      2. Assert no matches
    Expected Result: Zero @prisma/client imports in record service
    Evidence: .sisyphus/evidence/task-10-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract RecordRepository with filter abstraction`
  - Files: `backend/src/modules/record/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 11. User service — test + repository + aggregation + transaction

  **What to do**:
  - **Write tests first** (`backend/src/modules/user/__tests__/user.service.spec.ts`):
    - Test `upsertUser()` — verify findFirst, create or update logic
    - Test `createUserByLogin()` / `createUserById()` — verify Twitch API call + user.create
    - Test `deleteUserByLogin()` / `deleteUserById()` — verify transactional cascade: like.deleteMany, record.updateMany (set userId null), user.delete, event emission
    - Test `getUsers()` — verify findMany
    - Test `getProfileStats()` — verify groupBy (genre + grade), record.count, like.count, and response mapping
    - Test `patchUser()` — verify update
    - Mock PrismaService, TwitchService, EventEmitter2
  - **Create repository** (`backend/src/modules/user/repositories/`):
    - `user.repository.ts` — abstract class `UserRepository`:
      - `findByTwitchId(twitchId: string): Promise<UserDomain | null>`
      - `findByLogin(login: string): Promise<UserDomain | null>`
      - `findById(id: string): Promise<UserDomain | null>`
      - `create(data: CreateUserData): Promise<UserDomain>`
      - `update(id: string, data: UpdateUserData): Promise<UserDomain>`
      - `findAll(): Promise<UserDomain[]>`
      - `deleteWithCascade(userId: string): Promise<void>` — transaction: delete likes, nullify records, delete user
      - `getProfileStats(userId: string): Promise<ProfileStatsDomain>` — encapsulate groupBy/count aggregations
    - `prisma-user.repository.ts` — PrismaUserRepository:
      - `deleteWithCascade` converts array-style $transaction to callback-style
      - `getProfileStats` encapsulates groupBy(genre), groupBy(grade), record.count, like.count
  - **Refactor UserService**: Replace PrismaService with UserRepository. Remove `User` type import from @prisma/client — use `UserDomain` interface instead.
  - **Update UserModule**: Add repository provider. Keep TwitchModule import.
  - **Update user.controller.ts**: Replace `User` type from @prisma/client with `UserDomain` in method return types (if used)

  **Must NOT do**:
  - Change TwitchService interaction
  - Modify event emission logic
  - Change profile stats response shape
  - Change user roles logic

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: GroupBy aggregations, cascading transactional deletes, User type replacement, multiple methods
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7-10, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/user/user.service.ts` — upsert, create, delete cascade (transaction), getProfileStats (groupBy + counts)
  - `backend/src/modules/user/profile-stats.entity.ts` — profile stats Swagger shape
  - `backend/src/modules/user/user.controller.ts` — uses `User` type from @prisma/client in return types

  **API/Type References**:
  - `backend/src/modules/user/entities/user-domain.entity.ts` (from Task 3) — UserDomain, ProfileStatsDomain
  - `backend/src/database/transaction.interface.ts` (from Task 3) — TransactionManager

  **WHY Each Reference Matters**:
  - `user.service.ts` — most complex service: groupBy aggregations and array-style transactions
  - `user.controller.ts` — imports `User` type from Prisma, must be replaced with UserDomain
  - `profile-stats.entity.ts` — existing Swagger shape that ProfileStatsDomain must mirror

  **Acceptance Criteria**:

  - [ ] `user.service.spec.ts` with tests for upsert, create, delete (cascade + transaction), getProfileStats (aggregation)
  - [ ] `UserRepository` abstract class with 8 methods including deleteWithCascade and getProfileStats
  - [ ] Array-style $transaction converted to callback-style in PrismaUserRepository
  - [ ] `User` type from @prisma/client removed from user.service.ts and user.controller.ts
  - [ ] UserService depends on UserRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/user/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: User service tests pass with aggregation and transaction
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/user/`
      2. Assert exit code is 0
    Expected Result: All user service tests pass including groupBy and transaction
    Evidence: .sisyphus/evidence/task-11-user-tests.txt

  Scenario: No @prisma/client imports in user service/controller
    Tool: Bash
    Steps:
      1. Run `grep -n "from '@prisma/client'" backend/src/modules/user/user.service.ts backend/src/modules/user/user.controller.ts`
      2. Assert no matches
    Expected Result: Zero @prisma/client imports
    Evidence: .sisyphus/evidence/task-11-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract UserRepository with aggregation and transaction`
  - Files: `backend/src/modules/user/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 12. Auction service — test + repository + callback transaction

  **What to do**:
  - **Write tests first** (`backend/src/modules/auction/__tests__/auction.service.spec.ts`):
    - Test `getAuctions()` — verify findMany with `RecordType.AUCTION` filter + user include
    - Test `getWinner(id)` — verify transactional winner selection by explicit ID:
      1. `tx.record.findUnique({ where: { id } })` — find the specific record by ID, throw if not found
      2. `tx.record.update({ where: { id }, data: { type: WRITTEN } })` — mark winner as WRITTEN
      3. `tx.auctionsHistory.create({ data: { winnerId: id } })` — record winner in history
      4. `tx.like.deleteMany(...)` — delete likes for all OTHER auction records (id: { not: id })
      5. `tx.record.deleteMany(...)` — delete all OTHER auction records (id: { not: id })
    - Test error case: `getWinner(id)` throws when record not found
    - Test event emissions: `update-auction` (id, action: 'ended') and `update-records` (genre, id, action: 'updated')
    - Mock PrismaService, EventEmitter2
  - **Create repository** (`backend/src/modules/auction/repositories/`):
    - `auction.repository.ts` — abstract class `AuctionRepository`:
      - `findAuctions(): Promise<RecordWithRelations[]>` — find all records with type AUCTION, include user
      - `selectWinner(id: number): Promise<RecordWithRelations>` — encapsulates the entire transactional flow: find record by id (throw if not found), update type to WRITTEN, create AuctionsHistory entry, delete likes for other auction records, delete other auction records. Returns the updated winner record with user included.
    - `prisma-auction.repository.ts` — PrismaAuctionRepository:
      - `selectWinner(id)` implements using `this.prisma.$transaction(async (tx) => { ... })` preserving callback-style transaction
      - Inside tx: tx.record.findUnique(id), tx.record.update(id → WRITTEN), tx.auctionsHistory.create(winnerId: id), tx.like.deleteMany(auction records where id ≠ winner), tx.record.deleteMany(auction records where id ≠ winner)
  - **Refactor AuctionService**: Replace PrismaService with AuctionRepository. The complex transaction logic moves inside the repository. `getWinner(id)` calls `this.auctionRepository.selectWinner(id)` then emits events.
  - **Update AuctionModule**: Add repository provider

  **Must NOT do**:
  - Change winner selection behavior — winner is chosen by explicit `id` parameter from the controller query param, NOT randomly
  - Modify event emission logic
  - Change AuctionsHistory creation
  - Change controller endpoints or their signatures

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Most complex transaction — callback-style with 5 operations across 3 models
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7-11)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/modules/auction/auction.service.ts` — getAuctions() + getWinner() with $transaction(async tx => ...) containing 5 operations
  - `backend/src/modules/auction/auction.controller.ts` — endpoint shapes
  - `backend/src/modules/suggestion/repositories/` (from Task 9) — transaction pattern in repository

  **API/Type References**:
  - `backend/src/modules/record/entities/record-domain.entity.ts` (from Task 3) — RecordWithRelations
  - `backend/src/modules/auction/entities/auction-history.entity.ts` (from Task 3) — AuctionHistoryDomain

  **WHY Each Reference Matters**:
  - `auction.service.ts` — understand the callback-style transaction: order of operations matters (find → update → create → delete × 2)
  - Task 9 repository — follow established transaction-in-repository pattern

  **Acceptance Criteria**:

  - [ ] `auction.service.spec.ts` with tests for getAuctions and getWinner (transaction)
  - [ ] `AuctionRepository` abstract class with findAuctions/selectWinner
  - [ ] Callback-style transaction preserved in PrismaAuctionRepository.selectWinner
  - [ ] AuctionService depends on AuctionRepository (not PrismaService)
  - [ ] `bun test backend/src/modules/auction/` → PASS
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Auction service tests pass with transaction
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test src/modules/auction/`
      2. Assert exit code is 0
    Expected Result: All auction service tests pass including winner selection transaction
    Evidence: .sisyphus/evidence/task-12-auction-tests.txt

  Scenario: AuctionService no longer imports PrismaService
    Tool: Bash
    Steps:
      1. Run `grep -n 'PrismaService' backend/src/modules/auction/auction.service.ts`
      2. Assert no matches
    Expected Result: Zero PrismaService references
    Evidence: .sisyphus/evidence/task-12-no-prisma.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): extract AuctionRepository with callback transaction`
  - Files: `backend/src/modules/auction/` (new + modified)
  - Pre-commit: `cd backend && bun test && bun run build`

- [x] 13. Cleanup — remove PrismaModule imports and fix AuthModule DI

  **What to do**:
  - **Remove unnecessary PrismaModule imports** from modules that no longer need it directly:
    - Check each of the 9 refactored modules: if PrismaModule is only imported for PrismaService injection into the service (now replaced by repository), but the repository's module still needs PrismaModule, then PrismaModule should remain in the module that provides the repository. Verify each case.
    - In practice: each module still imports PrismaModule because the PrismaXRepository needs PrismaService. This is correct — the module imports PrismaModule so its PrismaXRepository provider can receive PrismaService.
  - **Fix AuthModule DI anomaly**: AuthModule directly provides PrismaService in its providers array instead of importing PrismaModule. Since AuthService doesn't use Prisma directly (uses UserService), remove PrismaService from AuthModule's providers. If AuthModule imported PrismaModule, remove that import too (not needed).
  - **Verify all imports**: Run a final check that no service file (outside repositories/) imports PrismaService
  - **Verify all @prisma/client imports**: Only files in `repositories/` and `database/` should import from @prisma/client
  - **Full test suite**: Run `bun test` for all tests
  - **Full build**: Run `bun run build`

  **Must NOT do**:
  - Change any business logic
  - Modify API endpoints
  - Touch modules not involved in the refactoring (img, twitch, ws, jwt, twir, weather)
  - Modify seed.js

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Cleanup task — remove/fix DI wiring, no new logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — must wait for all Tasks 4-12
  - **Parallel Group**: Sequential (after Wave 3)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4-12

  **References**:

  **Pattern References**:
  - `backend/src/modules/auth/auth.module.ts` — @Global() module with direct PrismaService in providers (anomaly to fix)
  - `backend/src/app.module.ts` — verify module registration is intact

  **WHY Each Reference Matters**:
  - `auth.module.ts` — fix the DI anomaly: remove PrismaService from providers
  - `app.module.ts` — verify nothing is broken in root module

  **Acceptance Criteria**:

  - [ ] AuthModule no longer provides PrismaService directly
  - [ ] No service file (outside repositories/ and database/) imports PrismaService
  - [ ] No file outside repositories/ and database/ imports from @prisma/client (except seed.js)
  - [ ] `bun test` → ALL tests pass
  - [ ] `bun run build` → no errors

  **QA Scenarios**:

  ```
  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. Run `cd backend && bun test`
      2. Assert exit code is 0
      3. Assert all tests pass (count total)
    Expected Result: All unit tests across all modules pass
    Evidence: .sisyphus/evidence/task-13-full-tests.txt

  Scenario: No PrismaService in service files
    Tool: Bash
    Steps:
      1. Run `grep -rn 'PrismaService' backend/src/modules/*/  --include='*.service.ts'`
      2. Assert no matches
    Expected Result: Zero PrismaService references in any service file
    Evidence: .sisyphus/evidence/task-13-no-prisma-services.txt

  Scenario: @prisma/client only in allowed locations
    Tool: Bash
    Steps:
      1. Run `grep -rn "from '@prisma/client'" backend/src/ --include='*.ts' | grep -v 'repositories/' | grep -v 'database/'`
      2. Assert no matches
    Expected Result: @prisma/client imports only exist in repositories/ and database/ directories
    Failure Indicators: Any match outside allowed directories
    Evidence: .sisyphus/evidence/task-13-prisma-isolation.txt
  ```

  **Commit**: YES
  - Message: `chore(backend): cleanup PrismaModule imports and fix AuthModule DI`
  - Files: Module files across refactored modules, auth.module.ts
  - Pre-commit: `cd backend && bun test && bun run build`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`

  ```
  Scenario: Must Have verification
    Tool: Bash (grep, read)
    Steps:
      1. For each Must Have item in the plan, locate the implementing file via grep/read
      2. Verify the implementation matches the requirement (e.g., abstract class exists, method signatures correct)
      3. Check .sisyphus/evidence/ directory — verify evidence files exist for Tasks 1-13
    Expected Result: All Must Have items have corresponding implementations; all evidence files present
    Evidence: .sisyphus/evidence/final-qa/f1-must-have.txt

  Scenario: Must NOT Have verification
    Tool: Bash (grep)
    Steps:
      1. grep -rn 'PrismaService' backend/src/modules/*/  --include='*.service.ts' → expect 0 matches
      2. grep -rn "from '@prisma/client'" backend/src/ --include='*.ts' | grep -v 'repositories/' | grep -v 'database/' | grep -v 'seed' → expect 0 matches
      3. Check for over-abstraction: no generic BaseRepository with 10+ methods
      4. Check for new endpoints not in original controller files
    Expected Result: Zero forbidden patterns found in codebase
    Evidence: .sisyphus/evidence/final-qa/f1-must-not-have.txt
  ```

  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`

  ```
  Scenario: Build and tests pass
    Tool: Bash
    Steps:
      1. cd backend && bun run build → expect exit code 0
      2. cd backend && bun test → expect exit code 0, count pass/fail
    Expected Result: Zero build errors, zero test failures
    Evidence: .sisyphus/evidence/final-qa/f2-build-tests.txt

  Scenario: No code quality violations
    Tool: Bash (grep)
    Steps:
      1. grep -rn 'as any' backend/src/modules/ --include='*.ts' | grep -v 'node_modules' → count matches
      2. grep -rn '@ts-ignore' backend/src/modules/ --include='*.ts' → expect 0 matches
      3. grep -rn 'console.log' backend/src/modules/ --include='*.ts' | grep -v '.spec.ts' → expect 0 new matches (compare to baseline)
      4. Check for empty catch blocks, unused imports, commented-out code in changed files
    Expected Result: No new quality violations introduced by refactoring
    Evidence: .sisyphus/evidence/final-qa/f2-quality.txt

  Scenario: AI slop detection
    Tool: Bash (grep, read)
    Steps:
      1. Review all new repository files for excessive JSDoc comments (> 3 lines per method)
      2. Check for over-abstracted base classes (BaseRepository with > 5 generic methods)
      3. Check for generic variable names (data, result, item, temp) in new files
    Expected Result: Clean, minimal code following existing codebase style
    Evidence: .sisyphus/evidence/final-qa/f2-slop.txt
  ```

  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`

  Start backend with `cd backend && bun dev:backend`. Ensure DB is seeded (admin user from `TWITCH_ADMIN_ID` / `TWITCH_ADMIN_LOGIN` env vars).

  **Authentication setup**: Generate a JWT token deterministically using `bun` and the backend's `JWT_SECRET` env var. The JWT payload must be `{ id: "<TWITCH_ADMIN_ID>" }` (matching the seeded admin user). Use `jsonwebtoken` or the backend's own JwtService:
  ```bash
  # Generate JWT for the seeded admin user using bun
  TOKEN=$(cd backend && bun -e "
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: process.env.TWITCH_ADMIN_ID }, process.env.JWT_SECRET);
    console.log(token);
  ")
  # Use in subsequent requests: curl -b "token=$TOKEN" ...
  ```

  **QA Scenarios:**

  ```
  Scenario: Swagger contract unchanged after refactoring
    Tool: Bash (curl)
    Preconditions: Backend running on localhost:3000
    Steps:
      1. curl -s http://localhost:3000/docs-json | jq '.components.schemas' > /tmp/swagger-current.json
      2. Compare with baseline saved in .sisyphus/evidence/swagger-baseline.json (created during Task 2)
      3. diff .sisyphus/evidence/swagger-baseline.json /tmp/swagger-current.json
      4. Assert diff is empty
    Expected Result: No differences in Swagger schema definitions — enum values, model shapes unchanged
    Failure Indicators: Any diff between baseline and current schemas
    Evidence: .sisyphus/evidence/final-qa/swagger-comparison.txt

  Scenario: Health check endpoint returns 200
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health → expect 200
    Expected Result: Health check returns 200 with version info
    Evidence: .sisyphus/evidence/final-qa/health-check.txt

  Scenario: Protected endpoints reject unauthenticated requests
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auction → expect 401 (GET, AuthGuard + RolesGuard ADMIN)
      2. curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/limits → expect 401 (POST only, AuthGuard + RolesGuard ADMIN)
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/likes/count → expect 401 (GET, AuthGuard + RolesGuard USER/ADMIN)
      4. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/users → expect 200 (GET, UseGuards() empty = no guard)
    Expected Result: Auth-protected endpoints return 401 without cookie; unguarded endpoints return 200
    Failure Indicators: Protected endpoint returns 200 without auth, or unguarded returns 401
    Evidence: .sisyphus/evidence/final-qa/auth-endpoints.txt

  Scenario: Authenticated endpoints work with seeded admin
    Tool: Bash (curl)
    Preconditions: Backend running, DB seeded, JWT token generated for seeded admin (see auth setup above)
    Steps:
      1. Get all users: curl -s -b "token=$TOKEN" http://localhost:3000/api/users/users → expect 200 + JSON array
      2. Get admin profile: curl -s -b "token=$TOKEN" "http://localhost:3000/api/users/profile/$TWITCH_ADMIN_LOGIN" → expect 200 + JSON with stats
      3. Get likes count: curl -s -b "token=$TOKEN" "http://localhost:3000/api/likes/count?page=1&limit=10" → expect 200 + JSON
      4. Get auctions (admin): curl -s -b "token=$TOKEN" http://localhost:3000/api/auction → expect 200 + JSON array (may be empty)
    Expected Result: All authenticated endpoints return correct JSON shapes matching pre-refactoring behavior
    Failure Indicators: 500 errors, missing fields in response, incorrect data types
    Evidence: .sisyphus/evidence/final-qa/authenticated-endpoints.txt

  Scenario: Build and full test suite pass
    Tool: Bash
    Preconditions: None
    Steps:
      1. cd backend && bun run build → expect exit code 0
      2. cd backend && bun test → expect exit code 0, all tests pass
    Expected Result: Zero build errors, zero test failures
    Evidence: .sisyphus/evidence/final-qa/build-tests.txt
  ```

  Output: `Endpoints [N/N pass] | Swagger [MATCH/DIFF] | Auth [N/N] | Build [PASS/FAIL] | Tests [PASS/FAIL] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`

  ```
  Scenario: Task-by-task diff compliance
    Tool: Bash (git diff, read)
    Steps:
      1. For each task (1-13): run git log --oneline to find corresponding commit
      2. Run git diff for that commit — list all changed files
      3. Compare changed files against task's "Files" list — flag any file not in scope
      4. Read each changed file's diff — verify changes match "What to do" specification
    Expected Result: Every task's commit contains only the specified changes, nothing more
    Evidence: .sisyphus/evidence/final-qa/f4-task-diffs.txt

  Scenario: No cross-task contamination
    Tool: Bash (git log)
    Steps:
      1. For each pair of adjacent tasks, check if any file was modified by both commits
      2. Flag cases where Task N modifies files listed under Task M
      3. Verify no changes to: frontend/, backend/prisma/seed.js, backend/prisma/migrations/, modules not in scope (img, twitch, websocket, jwt, twir, weather)
    Expected Result: Zero contamination, zero out-of-scope changes
    Failure Indicators: Files modified outside task scope, changes to excluded directories
    Evidence: .sisyphus/evidence/final-qa/f4-contamination.txt

  Scenario: No unaccounted changes
    Tool: Bash (git diff)
    Steps:
      1. Run full git diff from start to end of all task commits
      2. Verify every changed file is accounted for in at least one task
      3. Flag any file changed that doesn't appear in any task specification
    Expected Result: Zero unaccounted file changes
    Evidence: .sisyphus/evidence/final-qa/f4-unaccounted.txt
  ```

  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Task | Commit Message | Files | Pre-commit Check |
|------|---------------|-------|-----------------|
| 1 | `feat(backend): add bun test infrastructure` | package.json, test helpers | `bun test` runs |
| 2 | `refactor(backend): replace prisma $Enums with app-level enums` | enums/*.enum.ts, ~22 files | `bun run build` |
| 3 | `feat(backend): add domain entities and base repository pattern` | entities/, repositories/ | `bun run build` |
| 4 | `refactor(backend): extract LimitRepository and decouple limit service` | limit module | `bun test && bun run build` |
| 5 | `refactor(backend): extract QueueRepository and decouple queue service` | queue module | `bun test && bun run build` |
| 6 | `refactor(backend): extract LikeRepository and decouple like service` | like module | `bun test && bun run build` |
| 7 | `refactor(backend): extract SpotifyTokenRepository and decouple spotify service` | spotify module | `bun test && bun run build` |
| 8 | `refactor(backend): extract RecordsProvidersRepository and decouple service` | records-providers module | `bun test && bun run build` |
| 9 | `refactor(backend): extract SuggestionRepository with transaction support` | suggestion module | `bun test && bun run build` |
| 10 | `refactor(backend): extract RecordRepository with filter abstraction` | record module | `bun test && bun run build` |
| 11 | `refactor(backend): extract UserRepository with aggregation and transaction` | user module | `bun test && bun run build` |
| 12 | `refactor(backend): extract AuctionRepository with callback transaction` | auction module | `bun test && bun run build` |
| 13 | `chore(backend): cleanup PrismaModule imports and fix AuthModule DI` | module files | `bun test && bun run build` |

---

## Success Criteria

### Verification Commands
```bash
cd backend && bun run build    # Expected: no errors
cd backend && bun test         # Expected: all tests pass
# Swagger contract check:
curl -s http://localhost:3000/docs-json | jq '.components.schemas' > /tmp/swagger-after.json
diff .sisyphus/evidence/swagger-baseline.json /tmp/swagger-after.json  # Expected: no diff
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `bun run build` passes
- [ ] `bun test` — all tests pass
- [ ] No PrismaService imports in any service file
- [ ] No @prisma/client imports outside repositories/ and database/
- [ ] Swagger /docs-json enum values identical to pre-refactoring baseline
