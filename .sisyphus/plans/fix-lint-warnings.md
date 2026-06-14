# Fix All 30 Lint Warnings

## TL;DR

> **Quick Summary**: Устранить все 30 предупреждений oxlint — настроить правила для ложных срабатываний NestJS (18 `no-extraneous-class` + 1 `no-unassigned-import`) и исправить 11 реальных проблем в коде (unused Logger, variable shadowing, empty constructor).
> 
> **Deliverables**:
> - `bun run lint` → `Found 0 warnings and 0 errors`
> - Обновлённый `.oxlintrc.json` с 2 правилами
> - 9 файлов с fix'ами кода
> 
> **Estimated Effort**: Quick (~30 min, чисто механические правки)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Task 2 (commit)

---

## Context

### Original Request
Пользователь увидел 30 pre-existing warnings при `bun run lint` и захотел с ними разобраться. Стратегия: исправить реальные баги в коде + настроить правила для ложных срабатываний.

### Interview Summary
**Key Discussions**:
- Стратегия: "Исправить код + настроить правила" (recommended)
- Без тяжёлого планирования — быстро исправить

**Research Findings**:
- 18 `no-extraneous-class` — NestJS `@Module()` пустые классы, ложные срабатывания → `allowWithDecorator: true`
- 1 `no-unassigned-import` — CSS side-effect import `import '@/assets/index.css'` → `allow: ["**/*.css"]`
- 3 unused `Logger` imports — реальные unused imports в 3 файлах
- 6 `no-shadow` — переменные с одинаковыми именами во вложенных scope
- 1 `no-useless-constructor` — пустой конструктор

### Metis Review
**Identified Gaps** (addressed):
- Деструктуризация `{ data }` при rename требует синтаксис `{ data: response }`, а НЕ просто `{ response }` — учтено в инструкциях
- `Logger` в `auth.apikey.guard.ts` ИСПОЛЬЗУЕТСЯ (line 12, 21) — НЕ удалять оттуда! Только из 3 файлов где реально unused
- Mutation параметр `({ id, data }: ...)` — при rename нужно `({ id, data: body }: ...)`, тип `{ id: number; data: RecordUpdateDTO }` остаётся прежним
- Подсчёт: 18 `no-extraneous-class` (не 17, включая `AppModule`)

---

## Work Objectives

### Core Objective
Достичь `bun run lint` → `Found 0 warnings and 0 errors`.

### Concrete Deliverables
- `.oxlintrc.json` — 2 новых правила
- 3 backend файла — убран unused `Logger` import
- 1 backend файл — убран пустой конструктор
- 5 frontend файлов — исправлен variable shadowing

### Definition of Done
- [x] `bun run lint` → `Found 0 warnings and 0 errors`

### Must Have
- Все 30 warnings устранены
- Правила `no-extraneous-class` и `no-unassigned-import` настроены корректно
- Все rename используют деструктуризацию `{ data: response }`, а НЕ `{ response }`
- Тип `{ id: number; data: RecordUpdateDTO }` в mutation НЕ изменён (только локальное имя `data → body`)

### Must NOT Have (Guardrails)
- НЕ удалять `Logger` из `auth.apikey.guard.ts` — он там ИСПОЛЬЗУЕТСЯ
- НЕ менять поведение, API контракты или внешние интерфейсы
- НЕ рефакторить паттерны или реструктурировать код — только rename переменных и config
- НЕ трогать `frontend/src/lib/api.ts` (auto-generated)
- НЕ исправлять warning'и которых нет в текущих 30 (даже если появятся новые после правок)
- НЕ переименовывать файлы или менять экспорты

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None

### QA Policy
Verification through `bun run lint` + TypeScript compilation checks.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Fix all 30 lint warnings (config + code) [quick]

Wave 2 (After Wave 1):
└── Task 2: Commit all changes [quick]

Critical Path: Task 1 → Task 2
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2 |
| 2 | 1 | — |

### Agent Dispatch Summary

- **Wave 1**: **1 task** — T1 → `quick`
- **Wave 2**: **1 task** — T2 → `quick` + `git-master`

---

## TODOs

- [x] 1. Fix all 30 lint warnings — config + code

  **What to do**:

  **A. Обновить `.oxlintrc.json`** — добавить 2 правила в секцию `"rules"`:
  ```json
  "typescript/no-extraneous-class": ["warn", { "allowWithDecorator": true }],
  "import/no-unassigned-import": ["warn", { "allow": ["**/*.css"] }]
  ```
  Это устраняет 19 из 30 warnings (18 NestJS empty module classes + 1 CSS side-effect import).

  **B. Убрать unused `Logger` imports** (3 файла):
  1. `backend/src/modules/weather/weather.controller.ts:1` — убрать `Logger` из `import { Controller, Get, Logger } from '@nestjs/common'` → `import { Controller, Get } from '@nestjs/common'`
  2. `backend/src/modules/img/img.controller.ts:3` — убрать `Logger` из `import { Controller, Get, Logger, Query, Res } from '@nestjs/common'` → `import { Controller, Get, Query, Res } from '@nestjs/common'`
  3. `backend/src/app.controller.ts:2` — убрать `Logger` из `import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common'` → `import { Controller, Get, OnModuleInit } from '@nestjs/common'`

  **⚠️ НЕ трогать `Logger` в `backend/src/modules/auth/auth.apikey.guard.ts` — он там ИСПОЛЬЗУЕТСЯ на line 12 и 21!**

  **C. Убрать пустой конструктор** (1 файл):
  4. `backend/src/modules/auth/auth.apikey.guard.ts:14` — удалить строку `constructor() {}` (и пустую строку после неё). Класс имеет field initializer `private readonly logger = new Logger(...)`, конструктор не нужен.

  **D. Исправить variable shadowing** (5 файлов, 7 warnings):

  5. `frontend/src/composables/factories/create-records-store.ts` — 2 исправления:
     - **Line 45**: `const { data } = await api.records.recordControllerGetAllRecords(...)` → `const { data: response } = await api.records.recordControllerGetAllRecords(...)`
     - **Line 46**: `return data` → `return response`
     - **Line 62**: `({ id, data }: { id: number; data: RecordUpdateDTO })` → `({ id, data: body }: { id: number; data: RecordUpdateDTO })`
     - **Line 63**: `return api.records.recordControllerPatchRecord(id, data)` → `return api.records.recordControllerPatchRecord(id, body)`
     - **ВАЖНО**: Тип `{ id: number; data: RecordUpdateDTO }` НЕ МЕНЯТЬ — только локальное имя через деструктуризацию!

  6. `frontend/src/pages/auction/composables/use-auctions.ts` — 1 исправление:
     - **Line 29**: `const { data } = await api.auction.auctionControllerGetAuctions()` → `const { data: response } = await api.auction.auctionControllerGetAuctions()`
     - **Line 30**: `return data` → `return response`

  7. `frontend/src/pages/queue/composables/use-queue.ts` — 1 исправление:
     - **Line 18**: `const { data } = await api.queue.queueControllerGetQueue()` → `const { data: response } = await api.queue.queueControllerGetQueue()`
     - **Line 19**: `return data` → `return response`

  8. `frontend/src/pages/suggestion/components/SuggestionCard.vue` — 1 исправление:
     - **Line 126**: `.some((like) => like.userId === currentUserId.value)` → `.some((likeItem) => likeItem.userId === currentUserId.value)`

  9. `frontend/src/pages/profile/ProfilePage.vue` — 1 исправление:
     - **Line 111**: `.filter((user) =>` → `.filter((u) =>`
     - **Line 112**: `user.login.toLowerCase()...` → `u.login.toLowerCase()...`

  10. `frontend/src/composables/use-websocket.ts` — 1 исправление:
      - **Line 80**: УДАЛИТЬ строку `const userStore = useUser()` целиком — использовать outer `userStore` объявленный на line 25
      - Line 81 `userStore.refetchUser()` остаётся как есть — ссылается на outer variable

  **E. Запустить `bun run format`** после всех правок для нормализации.

  **Must NOT do**:
  - НЕ удалять Logger из `auth.apikey.guard.ts`
  - НЕ менять тип `{ id: number; data: RecordUpdateDTO }` в mutation
  - НЕ трогать api.ts
  - НЕ менять поведение кода

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Все правки механические — убрать импорт, переименовать переменную, добавить JSON правило
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.oxlintrc.json` — текущий конфиг, добавить правила в `"rules"` секцию
  - `backend/src/modules/auth/auth.apikey.guard.ts` — НЕ трогать Logger, только удалить `constructor() {}`
  - `frontend/src/composables/factories/create-records-store.ts:38-65` — useQuery + useMutation с shadowed `data`

  **WHY Each Reference Matters**:
  - `.oxlintrc.json` — единственный конфиг файл для lint правил
  - `auth.apikey.guard.ts` — КРИТИЧЕСКАЯ ОСТОРОЖНОСТЬ: Logger здесь используется, не удалять!
  - `create-records-store.ts` — самый сложный файл: 2 shadows с разными стратегиями rename

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero lint warnings after all fixes
    Tool: Bash
    Preconditions: All 10 files modified
    Steps:
      1. bun run lint 2>&1
      2. Assert output contains "Found 0 warnings and 0 errors"
    Expected Result: "Found 0 warnings and 0 errors"
    Failure Indicators: Any number > 0 for warnings or errors
    Evidence: .sisyphus/evidence/task-1-lint-zero.txt

  Scenario: Backend TypeScript compiles
    Tool: Bash
    Preconditions: Logger imports removed, constructor deleted
    Steps:
      1. cd backend && bunx --bun tsc --noEmit
      2. Assert exit code 0
    Expected Result: Exit code 0
    Failure Indicators: "Cannot find module" or type errors
    Evidence: .sisyphus/evidence/task-1-tsc-backend.txt

  Scenario: Frontend builds successfully
    Tool: Bash
    Preconditions: All frontend shadowing fixes applied
    Steps:
      1. bun run build
      2. Assert exit code 0
    Expected Result: Exit code 0
    Failure Indicators: Build errors from renamed variables
    Evidence: .sisyphus/evidence/task-1-build.txt

  Scenario: Logger NOT removed from auth.apikey.guard.ts
    Tool: Bash
    Preconditions: Fixes applied
    Steps:
      1. grep "Logger" backend/src/modules/auth/auth.apikey.guard.ts
      2. Assert matches found (Logger import + Logger usage)
    Expected Result: 2+ matches (import line + new Logger line)
    Failure Indicators: 0 matches — Logger was incorrectly removed
    Evidence: .sisyphus/evidence/task-1-logger-guard.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `fix: resolve all 30 lint warnings — config + code fixes`
  - Files: `.oxlintrc.json`, `backend/src/modules/weather/weather.controller.ts`, `backend/src/modules/img/img.controller.ts`, `backend/src/app.controller.ts`, `backend/src/modules/auth/auth.apikey.guard.ts`, `frontend/src/composables/factories/create-records-store.ts`, `frontend/src/pages/auction/composables/use-auctions.ts`, `frontend/src/pages/queue/composables/use-queue.ts`, `frontend/src/pages/suggestion/components/SuggestionCard.vue`, `frontend/src/pages/profile/ProfilePage.vue`, `frontend/src/composables/use-websocket.ts`
  - Pre-commit: `bun run lint && bun run build`

---

## Final Verification Wave

> Встроена в Task 1 — отдельная волна не нужна для задачи такого размера.
> Verification criteria включены в QA Scenarios Task 1.

---

## Commit Strategy

| Commit | Scope | Message | Validation |
|--------|-------|---------|------------|
| 1 | Tasks 1 | `fix: resolve all 30 lint warnings — config + code fixes` | `bun run lint` → 0 warnings |

---

## Success Criteria

### Verification Commands
```bash
bun run lint  # Expected: "Found 0 warnings and 0 errors"
cd backend && bunx --bun tsc --noEmit  # Expected: exit 0
bun run build  # Expected: exit 0
```

### Final Checklist
- [x] All 30 warnings eliminated
- [x] `bun run lint` → 0 warnings, 0 errors
- [x] No behavioral changes
- [x] Logger preserved in auth.apikey.guard.ts
