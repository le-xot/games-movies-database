# Frontend File Structure & Naming Restructure

## TL;DR

> **Quick Summary**: Полный рефакторинг файловой структуры и нейминга `frontend/src/` — все `.vue` файлы → PascalCase, разделение stores/composables, реорганизация lib/, перемещение layout/, удаление мёртвого кода, добавление barrel files.
> 
> **Deliverables**:
> - Единый стиль нейминга PascalCase для всех .vue файлов
> - Чёткое разделение Pinia stores и composables
> - Реорганизованная структура: router/, utils/ на верхнем уровне src/
> - layout/ перемещён в components/layout/
> - Barrel files для всех shared-директорий
> - Обновлённые AGENTS.md (frontend + root)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: T1 → T2-T7 (parallel) → T8-T9 (parallel) → T10-T12 (parallel)

---

## Context

### Original Request
Полный аудит и рефакторинг файловой структуры и нейминга фронтенда по современным best practices (Vue 3, 2024-2026).

### Interview Summary
**Key Discussions**:
- Структура: сохранить pages/ как есть, НЕ переходить на features/
- Нейминг: ВСЕ .vue файлы → PascalCase (единый стандарт)
- lib/: разнести по назначению — router/ и utils/ на верхний уровень
- layout/: переместить в components/layout/
- Разделить Pinia stores и plain composables в разные директории
- Misplaced files: переместить все найденные проблемы
- Barrel files: добавить во все shared-директории
- Верификация: tsc + bun build (тестов нет)

**Research Findings**:
- Vue Style Guide: PascalCase для SFC — официальная рекомендация
- VueUse: composables как use-xxx.ts (kebab-case) — стандарт
- shadcn-vue: components/ui/ с PascalCase + index.ts barrels — уже корректно, не трогаем
- Консенсус 2024-2026: feature-based или гибрид, co-located composables

### Metis Review
**Identified Gaps** (addressed):
- `lib/utils.ts` (cn helper): 84 импорта из shadcn-vue → ОСТАВИТЬ НА МЕСТЕ, не перемещать
- Мёртвый код: `spinner.vue` и `value-updater.ts` — 0 импортов → удалить
- `winner-selection-modal.vue` — не "misplaced", а page-local → переместить в auction/components/
- SVG в pages/pc/components/ — page-local assets → переместить в pages/pc/assets/
- `lib/utils.ts` + `lib/utils/` coexistence — lib/utils.ts остаётся, перемещаем только lib/utils/ (директорию)
- useWebSocket и useRecordCreate — plain composables, не stores → остаются в composables/
- Factories — factory functions, не stores → остаются в composables/factories/
- `.ts` файлы — оставить kebab-case (VueUse convention), PascalCase только для .vue
- `app.vue` → НЕ переименовывать (стандартная convention для root component)
- Case-sensitive FS: Linux — одношаговый git mv работает

---

## Work Objectives

### Core Objective
Привести файловую структуру и нейминг `frontend/src/` к единому стандарту: PascalCase для .vue, разделение ответственности директорий, barrel files для shared-модулей.

### Concrete Deliverables
- ~38 .vue файлов переименованы в PascalCase
- 5 Pinia stores → `src/stores/`
- `lib/router/` → `src/router/`
- `lib/utils/` (директория, НЕ файл) → `src/utils/`
- `layout/` → `components/layout/`
- Мёртвый код удалён
- Misplaced файлы перемещены
- Barrel files добавлены в ~8 директорий
- AGENTS.md обновлён

### Definition of Done
- [x] `cd frontend && bun run build` → exit code 0
- [x] `grep -rn "import.*from.*@/" frontend/src/ | grep -v node_modules | grep -v '/ui/' | grep -v 'app\.vue' | grep -oP "[^/]+\.vue" | grep -E '^[a-z]'` → 0 результатов (нет kebab-case .vue файлов в импортах вне ui/ и app.vue)
- [x] `grep -rn 'defineStore' frontend/src/composables/ --exclude-dir=factories` → 0 результатов (все stores в stores/, factories исключены)
- [x] `grep -rn '@/lib/router' frontend/src/` → 0 результатов
- [x] `grep -rn '@/lib/utils/' frontend/src/` → 0 результатов (с trailing slash)

### Must Have
- Единый PascalCase для всех .vue файлов (кроме app.vue и ui/)
- Pinia stores в отдельной директории stores/
- Router на верхнем уровне src/router/
- Все импорты обновлены и проект собирается
- AGENTS.md отражает новую структуру

### Must NOT Have (Guardrails)
- НЕ редактировать `lib/api.ts` (auto-generated)
- НЕ трогать файлы внутри `components/ui/` (shadcn-vue managed)
- НЕ перемещать `lib/utils.ts` (84 импорта из ui/, shadcn-vue CLI зависит от пути)
- НЕ переименовывать `.ts` файлы в PascalCase (только .vue)
- НЕ переименовывать директории pages/* (только файлы внутри)
- НЕ менять Vite aliases/tsconfig paths
- НЕ добавлять новые зависимости
- НЕ рефакторить бизнес-логику
- НЕ добавлять тесты
- НЕ обновлять consumer imports на barrel-стиль (barrels additive only)
- НЕ переименовывать app.vue (стандартная root component convention)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none
- **Verification method**: `bun run build` + `tsc --noEmit` (если поддерживается) + grep для проверки старых путей

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build verification**: `cd frontend && bun run build` — exit code 0
- **Import verification**: `grep` для проверки отсутствия старых путей
- **File existence**: `ls` / `test -f` для подтверждения перемещений

---

## Execution Strategy

### Parallel Execution Waves

> **File ownership rule**: No two tasks in the same wave may touch the same file.
> When tasks need to update shared files (e.g., `router.ts`), they run sequentially.

```
Wave 1 (Start Immediately — baseline + dead code):
├── Task 1: Baseline build verification + dead code removal [quick]

Wave 2A (After Wave 1 — independent directory moves, PARALLEL):
├── Task 3: Move lib/router/ → src/router/ (depends: 1) [quick]
├── Task 4: Move lib/utils/ → src/utils/ (depends: 1) [quick]
├── Task 7: Move SVGs to pages/pc/assets/ (depends: 1) [quick]

Wave 2B (After Wave 2A — tasks with shared files, SEQUENTIAL):
├── Task 6: Move winner-selection-modal to auction/components/ (depends: 1, 4) [quick]
│   (must run after T4, which updates @/lib/utils/image import in this file)
├── Task 2: Move layout/ → components/layout/ (depends: 1, 3) [quick]
│   (needs router.ts already at src/router/ from T3)
├── Task 5: Separate Pinia stores → src/stores/ (depends: 1, 2) [unspecified-high]
│   (needs layout files already at components/layout/ from T2)

Wave 3 (After Wave 2B — PascalCase renames, SEQUENTIAL):
├── Task 8: PascalCase rename — pages/**/*.vue (depends: 2-7) [unspecified-high]
│   (scope: rename ALL .vue files under pages/, update their relative imports)
├── Task 9: PascalCase rename — components/**/*.vue (depends: 8) [unspecified-high]
│   (scope: rename .vue files under components/ EXCLUDING ui/, update imports in ALL files including pages/ — runs AFTER T8 to avoid conflicts on page-local component files)

Wave 4 (After Wave 3 — barrels, docs, verification, SEQUENTIAL):
├── Task 10: Add barrel files (index.ts) (depends: 8, 9) [quick]
├── Task 11: Update AGENTS.md files (depends: 10) [writing]
├── Task 12: Final full build verification (depends: 11) [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright skill)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: T1 → T4 → T6 → T2 → T5 → T8 → T9 → T10 → T11 → T12 → F1-F4 → user okay
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 3 (Wave 2A)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1    | —         | 2,3,4,5,6,7 | 1 |
| 3    | 1         | 2,8,9 | 2A |
| 4    | 1         | 6,8,9 | 2A |
| 7    | 1         | 8 | 2A |
| 6    | 1,4       | 8 | 2B (sequential after 4) |
| 2    | 1,3       | 5,8,9 | 2B (sequential after 6) |
| 5    | 1,2       | 8,9 | 2B (sequential after 2) |
| 8    | 2,3,4,5,6,7 | 9,10,11 | 3 (first) |
| 9    | 8         | 10,11 | 3 (after 8) |
| 10   | 8,9       | 11 | 4 |
| 11   | 10        | 12 | 4 |
| 12   | 11        | F1-F4 | 4 |
| F1-F4| 12        | — | FINAL |

> **File ownership per wave**:
> - **Wave 2A** (parallel): T3 owns `lib/router/` + `main.ts`; T4 owns `lib/utils/` dir + image/watch-link importers; T7 owns `pages/pc/components/*.svg`
> - **Wave 2B** (sequential): T6 owns `winner-selection-modal.vue` move (after T4 updates its import); T2 owns `layout/` + `router.ts` layout imports; T5 owns store files + `router.ts` store imports + layout file store imports
> - **Wave 3** (sequential): T8 renames all `pages/**/*.vue` + updates relative imports within pages; T9 renames all `components/**/*.vue` (excl. ui/) + updates ALL imports across entire codebase (including pages/ files renamed by T8)

### Agent Dispatch Summary

- **Wave 1**: **1** — T1 → `quick`
- **Wave 2A**: **3** — T3,T4,T7 → `quick` (parallel)
- **Wave 2B**: **3** — T6 → `quick`, T2 → `quick`, T5 → `unspecified-high` (sequential: T6 → T2 → T5)
- **Wave 3**: **2** — T8 → `unspecified-high`, T9 → `unspecified-high` (sequential: T8 → T9)
- **Wave 4**: **3** — T10 → `quick`, T11 → `writing`, T12 → `quick` (sequential)
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

- [x] 1. Baseline Build Verification + Dead Code Removal

  **What to do**:
  - Run `cd frontend && bun run build` to establish baseline — must pass before ANY changes
  - Delete `frontend/src/components/utils/spinner.vue` (zero imports found in codebase)
  - Delete `frontend/src/components/utils/value-updater.ts` (zero imports found in codebase)
  - Remove empty `frontend/src/components/utils/` directory if no other files remain
  - Verify build still passes after deletion

  **Must NOT do**:
  - Do NOT delete any file that has imports (verify with grep first)
  - Do NOT delete the `components/utils/` directory if other files exist inside

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file deletion + build check, minimal complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (first task)

  **References**:

  **Pattern References**:
  - `frontend/src/components/utils/spinner.vue` — file to delete (0 imports confirmed by Metis audit)
  - `frontend/src/components/utils/value-updater.ts` — file to delete (0 imports confirmed by Metis audit)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Baseline build passes before changes
    Tool: Bash
    Preconditions: No changes made yet
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds with exit code 0
    Failure Indicators: Non-zero exit code, error messages in stderr
    Evidence: .sisyphus/evidence/task-1-baseline-build.txt

  Scenario: Dead code files have zero imports
    Tool: Bash
    Preconditions: Files still exist
    Steps:
      1. Run `grep -rn 'spinner' frontend/src/ --include='*.vue' --include='*.ts' | grep -v 'components/utils/spinner.vue'`
      2. Run `grep -rn 'value-updater\|valueUpdater' frontend/src/ --include='*.vue' --include='*.ts' | grep -v 'components/utils/value-updater.ts'`
      3. Assert both return 0 results
    Expected Result: Zero imports of either file
    Failure Indicators: Any grep match means the file IS used — abort deletion
    Evidence: .sisyphus/evidence/task-1-dead-code-check.txt

  Scenario: Build passes after dead code removal
    Tool: Bash
    Preconditions: spinner.vue and value-updater.ts deleted
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds — confirms files were truly dead code
    Failure Indicators: Import errors referencing deleted files
    Evidence: .sisyphus/evidence/task-1-post-delete-build.txt
  ```

  **Commit**: YES
  - Message: `chore: remove dead code (spinner, value-updater)`
  - Files: `frontend/src/components/utils/spinner.vue`, `frontend/src/components/utils/value-updater.ts`
  - Pre-commit: `cd frontend && bun run build`

- [x] 2. Move layout/ → components/layout/

  **What to do**:
  - `git mv frontend/src/layout/db/ frontend/src/components/layout/db/`
  - `git mv frontend/src/layout/home/ frontend/src/components/layout/home/`
  - Remove empty `frontend/src/layout/` directory
  - Update ALL import paths referencing `@/layout/` → `@/components/layout/`
  - Key files to update:
    - `frontend/src/router/router.ts` — dynamic imports of layout components (router already moved from lib/router/ by Task 3)
    - Any files importing from `@/layout/`
  - Use `grep -rn '@/layout/' frontend/src/` to find all imports needing update

  **Must NOT do**:
  - Do NOT rename .vue files yet (PascalCase rename is Task 8/9)
  - Do NOT change component logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple directory move + import path updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (shares router.ts with T3 and T5)
  - **Parallel Group**: Wave 2B (sequential: after T3)
  - **Blocks**: Task 5, Tasks 8, 9
  - **Blocked By**: Task 1, Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/layout/db/layout-header.vue` — layout file to move
  - `frontend/src/layout/db/layout-body.vue` — layout file to move
  - `frontend/src/layout/db/layout-database.vue` — layout file to move
  - `frontend/src/layout/home/layout-home.vue` — layout file to move
  - `frontend/src/router/router.ts` — contains dynamic imports of layout components (already at src/router/ after Task 3)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Layout files moved successfully
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run `test -d frontend/src/components/layout/db && echo "EXISTS"` — assert "EXISTS"
      2. Run `test -d frontend/src/components/layout/home && echo "EXISTS"` — assert "EXISTS"
      3. Run `test -d frontend/src/layout && echo "EXISTS" || echo "REMOVED"` — assert "REMOVED"
    Expected Result: Layout dirs exist under components/layout/, old layout/ dir removed
    Failure Indicators: Old directory still exists, new directory missing
    Evidence: .sisyphus/evidence/task-2-layout-moved.txt

  Scenario: No remaining old layout imports
    Tool: Bash
    Preconditions: Imports updated
    Steps:
      1. Run `grep -rn '@/layout/' frontend/src/`
      2. Assert 0 results
    Expected Result: Zero references to old @/layout/ path
    Failure Indicators: Any remaining @/layout/ import
    Evidence: .sisyphus/evidence/task-2-import-check.txt

  Scenario: Build passes after layout move
    Tool: Bash
    Preconditions: All moves and import updates done
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds
    Failure Indicators: Import resolution errors for layout components
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: move layout/ to components/layout/`
  - Files: `frontend/src/layout/**`, `frontend/src/components/layout/**`, router imports
  - Pre-commit: `cd frontend && bun run build`

- [x] 3. Move lib/router/ → src/router/

  **What to do**:
  - `git mv frontend/src/lib/router/ frontend/src/router/`
  - Update ALL import paths referencing `@/lib/router/` → `@/router/`
  - Key files to update:
    - `frontend/src/main.ts` — imports router
    - Any files importing from `@/lib/router/router-paths` (search with grep)
  - Verify router.ts internal relative import of `./router-paths` still works (relative, so no change needed)

  **Must NOT do**:
  - Do NOT modify router logic or routes
  - Do NOT rename router.ts or router-paths.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple directory move + ~5 import path updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2A (with Tasks 4, 7)
  - **Blocks**: Task 2, Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/lib/router/router.ts` — main router config with dynamic page imports
  - `frontend/src/lib/router/router-paths.ts` — ROUTER_PATHS constant
  - `frontend/src/main.ts` — imports router

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Router files moved, no old imports remain
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run `test -f frontend/src/router/router.ts && echo "EXISTS"` — assert "EXISTS"
      2. Run `test -f frontend/src/router/router-paths.ts && echo "EXISTS"` — assert "EXISTS"
      3. Run `grep -rn '@/lib/router' frontend/src/` — assert 0 results
    Expected Result: Router files at new location, zero old path references
    Failure Indicators: Files missing or old @/lib/router imports remain
    Evidence: .sisyphus/evidence/task-3-router-moved.txt

  Scenario: Build passes after router move
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: move router/ from lib/ to src/`
  - Files: `frontend/src/lib/router/**` → `frontend/src/router/**`, main.ts, importers
  - Pre-commit: `cd frontend && bun run build`

- [x] 4. Move lib/utils/ (directory) → src/utils/

  **What to do**:
  - Create `frontend/src/utils/` directory
  - `git mv frontend/src/lib/utils/image.ts frontend/src/utils/image.ts`
  - `git mv frontend/src/lib/utils/generate-watch-link.ts frontend/src/utils/generate-watch-link.ts`
  - Remove empty `frontend/src/lib/utils/` directory
  - Update all import paths from `@/lib/utils/image` → `@/utils/image` (~10 files)
  - Update all import paths from `@/lib/utils/generate-watch-link` → `@/utils/generate-watch-link` (~4 files)
  - **CRITICAL**: Do NOT touch `frontend/src/lib/utils.ts` (the file, not directory!) — it contains `cn()` helper with 84 imports from shadcn-vue ui/ components

  **Must NOT do**:
  - Do NOT move or modify `lib/utils.ts` (cn helper file)
  - Do NOT touch `components/ui/` imports

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file moves + import updates, but requires careful attention to utils.ts vs utils/ distinction
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2A (with Tasks 3, 7)
  - **Blocks**: Task 6, Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/lib/utils/image.ts` — image proxy utility
  - `frontend/src/lib/utils/generate-watch-link.ts` — Kinobox URL generator
  - `frontend/src/lib/utils.ts` — cn() helper — DO NOT MOVE THIS FILE

  **WHY Each Reference Matters**:
  - `lib/utils.ts` (FILE) stays because 84 shadcn-vue components import `cn` from `'@/lib/utils'`. Moving it would require editing all ui/ files (forbidden) or adding Vite alias (out of scope)
  - `lib/utils/` (DIRECTORY) contains app-specific utilities that belong at top-level

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Utils directory moved, cn helper untouched
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run `test -f frontend/src/utils/image.ts && echo "EXISTS"` — assert "EXISTS"
      2. Run `test -f frontend/src/utils/generate-watch-link.ts && echo "EXISTS"` — assert "EXISTS"
      3. Run `test -f frontend/src/lib/utils.ts && echo "EXISTS"` — assert "EXISTS" (cn helper stayed)
      4. Run `test -d frontend/src/lib/utils && echo "EXISTS" || echo "REMOVED"` — assert "REMOVED"
      5. Run `grep -rn '@/lib/utils/' frontend/src/` — assert 0 results (trailing slash = directory imports)
    Expected Result: New utils/ has files, old lib/utils/ dir removed, lib/utils.ts untouched
    Failure Indicators: lib/utils.ts missing (accidentally moved), old directory path imports remain
    Evidence: .sisyphus/evidence/task-4-utils-moved.txt

  Scenario: Build passes after utils move
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds, cn() imports from ui/ still resolve
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: move lib/utils/ to src/utils/`
  - Files: `frontend/src/lib/utils/*.ts` → `frontend/src/utils/*.ts`, ~14 import updates
  - Pre-commit: `cd frontend && bun run build`

- [x] 5. Separate Pinia Stores → src/stores/

  **What to do**:
  - Create `frontend/src/stores/` directory
  - Move these Pinia stores (files with `defineStore`):
    - `git mv frontend/src/composables/use-api.ts frontend/src/stores/use-api.ts`
    - `git mv frontend/src/composables/use-user.ts frontend/src/stores/use-user.ts`
    - `git mv frontend/src/composables/use-breakpoints.ts frontend/src/stores/use-breakpoints.ts`
    - `git mv frontend/src/composables/use-new-records.ts frontend/src/stores/use-new-records.ts`
    - `git mv frontend/src/composables/use-title.ts frontend/src/stores/use-title.ts`
  - Update ALL import paths from `@/composables/use-api` → `@/stores/use-api` (and similar for each)
  - **KEEP in composables/** (plain composables, NOT Pinia stores):
    - `use-websocket.ts` — uses lifecycle hooks, no defineStore
    - `use-record-create.ts` — takes parameters, no defineStore
  - **KEEP in composables/factories/** — factory functions stay:
    - `create-params-store.ts`
    - `create-records-store.ts`
    - `create-table-store.ts`
  - Use `grep -rn '@/composables/use-api' frontend/src/` (for each store) to find all imports to update
  - **IMPORTANT**: `use-websocket.ts` imports from page-level composables (`@/pages/anime/composables/use-anime`, etc.) — those page-level composable paths don't change in this task
  - **NOTE**: By this point, Task 2 has already moved layout/ to components/layout/, and Task 3 has moved router to src/router/. When updating `@/composables/use-user` → `@/stores/use-user` in layout files, they are already at `frontend/src/components/layout/db/layout-header.vue`. Similarly, `router.ts` is at `frontend/src/router/router.ts`.

  **Must NOT do**:
  - Do NOT move `use-websocket.ts` or `use-record-create.ts` (plain composables)
  - Do NOT move factories
  - Do NOT rename any files
  - Do NOT change store logic or IDs

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Many files to move + many import updates across the codebase (stores are widely imported)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (shares router.ts and layout files with T2 and T3)
  - **Parallel Group**: Wave 2B (sequential: after T2)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/composables/use-api.ts` — Pinia store (defineStore), most widely imported store
  - `frontend/src/composables/use-user.ts` — Pinia store (defineStore)
  - `frontend/src/composables/use-breakpoints.ts` — Pinia store (defineStore)
  - `frontend/src/composables/use-new-records.ts` — Pinia store (defineStore)
  - `frontend/src/composables/use-title.ts` — Pinia store (defineStore)
  - `frontend/src/composables/use-websocket.ts` — PLAIN composable (onMounted/onUnmounted, no defineStore) — DO NOT MOVE
  - `frontend/src/composables/use-record-create.ts` — PLAIN composable (takes params, no defineStore) — DO NOT MOVE

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Stores moved, composables stay
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run `ls frontend/src/stores/` — assert contains: use-api.ts, use-user.ts, use-breakpoints.ts, use-new-records.ts, use-title.ts
      2. Run `ls frontend/src/composables/` — assert contains: use-websocket.ts, use-record-create.ts, factories/
      3. Run `grep -rn 'defineStore' frontend/src/composables/ --exclude-dir=factories` — assert 0 results (factories excluded — they stay in composables/)
      4. Run `ls frontend/src/stores/*.ts | wc -l` — assert 5 (five store files moved)
    Expected Result: All Pinia stores in stores/, plain composables remain in composables/
    Failure Indicators: defineStore found in composables/, missing files in stores/
    Evidence: .sisyphus/evidence/task-5-stores-separated.txt

  Scenario: No old import paths remain
    Tool: Bash
    Steps:
      1. Run `grep -rn '@/composables/use-api\b' frontend/src/` — assert 0 results
      2. Run `grep -rn '@/composables/use-user\b' frontend/src/` — assert 0 results
      3. Run `grep -rn '@/composables/use-breakpoints\b' frontend/src/` — assert 0 results
      4. Run `grep -rn '@/composables/use-new-records\b' frontend/src/` — assert 0 results
      5. Run `grep -rn '@/composables/use-title\b' frontend/src/` — assert 0 results
    Expected Result: Zero remaining references to old store paths
    Evidence: .sisyphus/evidence/task-5-import-check.txt

  Scenario: Build passes after store separation
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-5-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: separate Pinia stores into src/stores/`
  - Files: 5 store files moved + all their import paths updated
  - Pre-commit: `cd frontend && bun run build`

- [x] 6. Move winner-selection-modal.vue to auction/components/

  **What to do**:
  - `git mv frontend/src/pages/auction/winner-selection-modal.vue frontend/src/pages/auction/components/winner-selection-modal.vue`
  - Update import in `frontend/src/pages/auction/auction.vue` — change relative path from `'./winner-selection-modal.vue'` to `'./components/winner-selection-modal.vue'` (or similar relative path)
  - This aligns with the pattern used by ALL other pages (components in components/ subfolder)

  **Must NOT do**:
  - Do NOT rename the file yet (PascalCase is Task 8)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file move + one import update
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (shares winner-selection-modal.vue with T4's import update)
  - **Parallel Group**: Wave 2B (sequential: after T4, before T2)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1, Task 4

  **References**:

  **Pattern References**:
  - `frontend/src/pages/auction/auction.vue` — imports winner-selection-modal via relative path
  - `frontend/src/pages/anime/components/anime-table.vue` — example of correct page component placement

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Modal moved to components/
    Tool: Bash
    Steps:
      1. Run `test -f frontend/src/pages/auction/components/winner-selection-modal.vue && echo "EXISTS"` — assert "EXISTS"
      2. Run `test -f frontend/src/pages/auction/winner-selection-modal.vue && echo "EXISTS" || echo "MOVED"` — assert "MOVED"
      3. Run `cd frontend && bun run build` — assert exit code 0
    Expected Result: File at new location, build passes
    Evidence: .sisyphus/evidence/task-6-modal-moved.txt
  ```

  **Commit**: YES
  - Message: `refactor: move winner-selection-modal to auction/components/`
  - Files: `pages/auction/winner-selection-modal.vue`, `pages/auction/auction.vue`
  - Pre-commit: `cd frontend && bun run build`

- [x] 7. Move SVGs to pages/pc/assets/

  **What to do**:
  - Create `frontend/src/pages/pc/assets/` directory
  - `git mv frontend/src/pages/pc/components/atlasos.svg frontend/src/pages/pc/assets/atlasos.svg`
  - `git mv frontend/src/pages/pc/components/archlinux.svg frontend/src/pages/pc/assets/archlinux.svg`
  - Update import in `frontend/src/pages/pc/constants/parts-links.ts` — change relative path from `'../components/archlinux.svg'` to `'../assets/archlinux.svg'` (and similar for atlasos)
  - Check if SVGs are imported elsewhere with `grep -rn 'atlasos\|archlinux' frontend/src/`

  **Must NOT do**:
  - Do NOT modify SVG content

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Two file moves + import update
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2A (with Tasks 3, 4)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/pages/pc/constants/parts-links.ts` — imports SVGs via relative path `'../components/archlinux.svg'`
  - `frontend/src/pages/pc/components/atlasos.svg` — SVG file to move
  - `frontend/src/pages/pc/components/archlinux.svg` — SVG file to move

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: SVGs moved to assets/
    Tool: Bash
    Steps:
      1. Run `test -f frontend/src/pages/pc/assets/atlasos.svg && echo "EXISTS"` — assert "EXISTS"
      2. Run `test -f frontend/src/pages/pc/assets/archlinux.svg && echo "EXISTS"` — assert "EXISTS"
      3. Run `test -f frontend/src/pages/pc/components/atlasos.svg && echo "EXISTS" || echo "MOVED"` — assert "MOVED"
      4. Run `cd frontend && bun run build` — assert exit code 0
    Expected Result: SVGs at new location, build passes
    Evidence: .sisyphus/evidence/task-7-svgs-moved.txt
  ```

  **Commit**: YES
  - Message: `refactor: move SVGs to pages/pc/assets/`
  - Files: `pages/pc/components/*.svg` → `pages/pc/assets/`, `pages/pc/constants/parts-links.ts`
  - Pre-commit: `cd frontend && bun run build`

- [x] 8. PascalCase Rename — pages/**/*.vue

  **What to do**:
  This is the LARGEST task — rename ALL .vue files inside `pages/` to PascalCase.
  
  **Page entry points** (13 files):
  - `pages/admin/admin.vue` → `pages/admin/AdminPage.vue`
  - `pages/anime/anime.vue` → `pages/anime/AnimePage.vue`
  - `pages/auction/auction.vue` → `pages/auction/AuctionPage.vue`
  - `pages/auth/callback.vue` → `pages/auth/AuthCallback.vue`
  - `pages/cartoon/cartoon.vue` → `pages/cartoon/CartoonPage.vue`
  - `pages/games/games.vue` → `pages/games/GamesPage.vue`
  - `pages/home/home.vue` → `pages/home/HomePage.vue`
  - `pages/movie/movie.vue` → `pages/movie/MoviePage.vue`
  - `pages/pc/pc.vue` → `pages/pc/PcPage.vue`
  - `pages/profile/profile.vue` → `pages/profile/ProfilePage.vue`
  - `pages/queue/queue.vue` → `pages/queue/QueuePage.vue`
  - `pages/series/series.vue` → `pages/series/SeriesPage.vue`
  - `pages/suggestion/suggestion.vue` → `pages/suggestion/SuggestionPage.vue`

  **Page-local components** (~10 files):
  - `pages/anime/components/anime-table.vue` → `AnimeTable.vue`
  - `pages/auction/components/auction-card.vue` → `AuctionCard.vue`
  - `pages/auction/components/winner-selection-modal.vue` → `WinnerSelectionModal.vue`
  - `pages/cartoon/components/cartoon-table.vue` → `CartoonTable.vue`
  - `pages/games/components/games-table.vue` → `GamesTable.vue`
  - `pages/movie/components/movie-table.vue` → `MovieTable.vue`
  - `pages/queue/components/queue-card.vue` → `QueueCard.vue`
  - `pages/series/components/series-table.vue` → `SeriesTable.vue`
  - `pages/suggestion/components/suggestion-card.vue` → `SuggestionCard.vue`
  - `pages/suggestion/components/suggestion-form.vue` → `SuggestionForm.vue`
  - `pages/suggestion/components/supported-services.vue` → `SupportedServices.vue`

  **Import updates**:
  - **CRITICAL**: Update ALL dynamic `import()` calls in `router.ts` (now at `src/router/router.ts` after Task 3)
    - Example: `() => import('@/pages/anime/anime.vue')` → `() => import('@/pages/anime/AnimePage.vue')`
  - Update all relative imports between page files and their components
  - Use `grep -rn "\.vue'" frontend/src/ | grep -v node_modules | grep -v '/ui/'` to find all .vue imports
  - **NOTE**: `composables/use-websocket.ts` may import from page composables — those are .ts files, NOT affected

  **Must NOT do**:
  - Do NOT rename page directories (pages/anime/ stays as pages/anime/)
  - Do NOT rename .ts files (composables, constants stay kebab-case)
  - Do NOT rename app.vue (root component convention)
  - Do NOT touch components/ui/ files

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Largest batch rename (~23 files) + router.ts update + many import path updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 9)
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Tasks 2, 3, 4, 5, 6, 7

  **References**:

  **Pattern References**:
  - `frontend/src/router/router.ts` (after Task 3 move) — ALL dynamic import() paths for pages must be updated here
  - `frontend/src/components/ui/button/Button.vue` — PascalCase naming example to follow
  - `frontend/src/pages/anime/composables/use-anime.ts` — example of .ts file that stays kebab-case

  **API/Type References**:
  - `frontend/src/router/router-paths.ts` — ROUTER_PATHS constant (paths don't change, only import file names)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All page .vue files are PascalCase
    Tool: Bash
    Preconditions: All Wave 2 tasks completed
    Steps:
      1. Run `find frontend/src/pages -name '*.vue' -exec basename {} \; | grep -E '^[a-z]'` — assert 0 results (all .vue basenames start with uppercase)
      2. Run `test -f frontend/src/pages/anime/AnimePage.vue && echo "OK"` — assert "OK"
      3. Run `test -f frontend/src/pages/auction/components/WinnerSelectionModal.vue && echo "OK"` — assert "OK"
    Expected Result: All .vue file basenames under pages/ start with uppercase (PascalCase)
    Failure Indicators: Any basename starting with lowercase
    Evidence: .sisyphus/evidence/task-8-pages-renamed.txt

  Scenario: Router imports updated
    Tool: Bash
    Steps:
      1. Run `grep -n "import(" frontend/src/router/router.ts | grep -E '/[a-z-]+\.vue'`
      2. Assert 0 results (no kebab-case .vue in router dynamic imports)
    Expected Result: All router dynamic imports reference PascalCase .vue files
    Evidence: .sisyphus/evidence/task-8-router-imports.txt

  Scenario: No remaining kebab-case .vue imports (outside ui/ and app.vue)
    Tool: Bash
    Steps:
      1. Run `grep -rn "from.*'.*\.vue'" frontend/src/ | grep -v node_modules | grep -v '/ui/' | grep -v 'app\.vue' | grep -oP "[^/]+\.vue'" | grep -E "^[a-z]"`
      2. Assert 0 results
    Expected Result: Zero kebab-case .vue filenames in import paths (excluding ui/ and app.vue)
    Evidence: .sisyphus/evidence/task-8-no-old-imports.txt

  Scenario: Build passes after page renames
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds with all renamed files
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: rename page .vue files to PascalCase`
  - Files: ~23 .vue files + router.ts + relative imports
  - Pre-commit: `cd frontend && bun run build`

- [x] 9. PascalCase Rename — components/**/*.vue (non-ui)

  **What to do**:
  Rename ALL .vue files inside `components/` (EXCEPT `components/ui/`) to PascalCase.

  **components/dialog/** (2 files):
  - `dialog.vue` → `Dialog.vue`
  - `dialog-button.vue` → `DialogButton.vue`

  **components/form/** (1 file):
  - `login-form.vue` → `LoginForm.vue`

  **components/record/** (1 file):
  - `record-create-form.vue` → `RecordCreateForm.vue`

  **components/table/** (6 files):
  - `table.vue` → `DataTable.vue` (note: NOT `Table.vue` to avoid collision with ui/table/Table.vue)
  - `table-search.vue` → `TableSearch.vue`
  - `table-pagination.vue` → `TablePagination.vue`
  - `table-filter-status.vue` → `TableFilterStatus.vue`
  - `table-filter-grade.vue` → `TableFilterGrade.vue`
  - `table-filter-generic.vue` → `TableFilterGeneric.vue`

  **components/table/table-col/** (4 files):
  - `table-col-episode.vue` → `TableColEpisode.vue`
  - `table-col-select.vue` → `TableColSelect.vue`
  - `table-col-title.vue` → `TableColTitle.vue`
  - `table-col-user.vue` → `TableColUser.vue`

  **components/layout/** (4 files, already moved in Task 2):
  - `layout-header.vue` → `LayoutHeader.vue`
  - `layout-body.vue` → `LayoutBody.vue`
  - `layout-database.vue` → `LayoutDatabase.vue`
  - `layout-home.vue` → `LayoutHome.vue`

  **Import updates**:
  - Update all imports referencing these files (both absolute `@/components/...` and relative `'./...'`)
  - **IMPORTANT**: `components/table/table.vue` → `DataTable.vue` — search for ALL imports of this file carefully, as it's widely used across page tables
  - Use `grep -rn "table\.vue\|table/table" frontend/src/` to find all references to the table component

  **Must NOT do**:
  - Do NOT rename anything inside `components/ui/` (already PascalCase, shadcn-vue managed)
  - Do NOT rename .ts files (composables, injection keys stay kebab-case)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: ~18 file renames + many import updates, including widely-used DataTable component
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (touches page-local component files renamed by T8)
  - **Parallel Group**: Wave 3 (sequential: after T8)
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/button/Button.vue` — PascalCase naming standard to follow
  - `frontend/src/components/table/table.vue` — most critical rename (widely imported as data table base)
  - `frontend/src/components/table/table-injection-key.ts` — .ts file that stays kebab-case, but imports .vue files that are renamed

  **WHY Each Reference Matters**:
  - `table.vue` → `DataTable.vue` avoids collision with shadcn-vue's `ui/table/Table.vue`
  - `table-injection-key.ts` may import from table components — verify its imports are updated

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All non-ui component .vue files are PascalCase
    Tool: Bash
    Steps:
      1. Run `find frontend/src/components -path '*/ui/*' -prune -o -name '*.vue' -print0 | xargs -0 -I {} basename {} | grep -E '^[a-z]'`
      2. Assert 0 results (all .vue basenames outside ui/ start with uppercase)
    Expected Result: All .vue file basenames outside ui/ are PascalCase
    Evidence: .sisyphus/evidence/task-9-components-renamed.txt

  Scenario: DataTable rename — no references to old table.vue filename
    Tool: Bash
    Steps:
      1. Run `grep -rn "from.*['\"].*table\.vue['\"]" frontend/src/ | grep -v node_modules | grep -v '/ui/'`
      2. Assert 0 results (all imports now reference DataTable.vue, not table.vue)
    Expected Result: No remaining import of the old `table.vue` filename — all updated to `DataTable.vue`
    Evidence: .sisyphus/evidence/task-9-datatable-check.txt

  Scenario: Build passes after component renames
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-9-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: rename component .vue files to PascalCase`
  - Files: ~18 .vue files + their imports
  - Pre-commit: `cd frontend && bun run build`

- [x] 10. Add Barrel Files (index.ts)

  **What to do**:
  Add `index.ts` barrel files to shared directories for clean import paths.
  Follow the pattern from `components/ui/button/index.ts` — explicit named exports.

  **Directories needing barrels**:
  - `frontend/src/components/table/index.ts` — export DataTable, TableSearch, TablePagination, filters, table-col components
  - `frontend/src/components/layout/index.ts` — export LayoutHeader, LayoutBody, LayoutDatabase, LayoutHome (both db/ and home/)
  - `frontend/src/components/dialog/index.ts` — export Dialog, DialogButton
  - `frontend/src/components/form/index.ts` — export LoginForm
  - `frontend/src/components/record/index.ts` — export RecordCreateForm
  - `frontend/src/composables/index.ts` — export useWebSocket, useRecordCreate
  - `frontend/src/stores/index.ts` — export useApi, useUser, useBreakpoints, useNewRecords, useTitle
  - `frontend/src/utils/index.ts` — export image utilities, generate-watch-link

  **Barrel file pattern** (follow existing shadcn-vue convention):
  ```typescript
  // Example: components/table/index.ts
  export { default as DataTable } from './DataTable.vue'
  export { default as TableSearch } from './TableSearch.vue'
  // etc.
  ```

  **For .ts composables/stores** (named exports, not default):
  ```typescript
  // Example: stores/index.ts
  export { useApi } from './use-api'
  export { useUser } from './use-user'
  // etc.
  ```

  **Must NOT do**:
  - Do NOT use wildcard re-exports (`export * from`)
  - Do NOT update existing consumer imports to use barrels (barrels are additive, not mandatory)
  - Do NOT add barrels to page-local components/ directories

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Creating ~8 small index.ts files with explicit exports
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential first)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 8, 9

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/button/index.ts` — barrel file pattern to follow (explicit named exports of default Vue component exports)
  - `frontend/src/components/ui/card/index.ts` — another barrel example with multiple component exports

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All barrel files created
    Tool: Bash
    Steps:
      1. Run `test -f frontend/src/components/table/index.ts && echo "OK"` — assert "OK"
      2. Run `test -f frontend/src/components/layout/index.ts && echo "OK"` — assert "OK"
      3. Run `test -f frontend/src/components/dialog/index.ts && echo "OK"` — assert "OK"
      4. Run `test -f frontend/src/stores/index.ts && echo "OK"` — assert "OK"
      5. Run `test -f frontend/src/composables/index.ts && echo "OK"` — assert "OK"
      6. Run `test -f frontend/src/utils/index.ts && echo "OK"` — assert "OK"
    Expected Result: All barrel files exist
    Evidence: .sisyphus/evidence/task-10-barrels-created.txt

  Scenario: No wildcard exports in barrels
    Tool: Bash
    Steps:
      1. Run `grep -rn 'export \*' frontend/src/components/table/index.ts frontend/src/components/layout/index.ts frontend/src/stores/index.ts frontend/src/composables/index.ts frontend/src/utils/index.ts`
      2. Assert 0 results
    Expected Result: No wildcard re-exports
    Evidence: .sisyphus/evidence/task-10-no-wildcards.txt

  Scenario: Build passes with barrel files
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds (barrels don't break anything)
    Evidence: .sisyphus/evidence/task-10-build.txt
  ```

  **Commit**: YES
  - Message: `refactor: add barrel files for shared directories`
  - Files: ~8 new index.ts files
  - Pre-commit: `cd frontend && bun run build`

- [x] 11. Update AGENTS.md Files

  **What to do**:
  Update BOTH AGENTS.md files to reflect the new structure:

  **`frontend/src/AGENTS.md`**:
  - Update all file path references to new locations
  - Document new naming convention: PascalCase for .vue, kebab-case for .ts
  - Document new directory structure (stores/, router/, utils/, components/layout/)
  - Document barrel file convention
  - Keep existing "do not edit" rules (lib/api.ts, ui/)

  **Root `AGENTS.md`**:
  - Update the "WHERE TO LOOK" table with new paths
  - Update the "CONVENTIONS" section with PascalCase rule
  - Update the "STRUCTURE" tree diagram
  - Update any file path references (router-paths location, etc.)

  **Must NOT do**:
  - Do NOT change non-frontend sections of root AGENTS.md
  - Do NOT remove existing rules that are still valid

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation update requiring careful path reference accuracy
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after T10)
  - **Blocks**: Task 12
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `frontend/src/AGENTS.md` — current frontend conventions doc
  - `AGENTS.md` (root) — project-wide knowledge base with "WHERE TO LOOK" table and structure diagram

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md references new paths
    Tool: Bash
    Steps:
      1. Run `grep -n '@/lib/router' frontend/src/AGENTS.md` — assert 0 results (should reference @/router/)
      2. Run `grep -n 'layout/' AGENTS.md | grep -v 'components/layout'` — assert 0 results in the frontend section
      3. Run `grep -n 'composables/use-api' AGENTS.md` — assert 0 results (should reference stores/)
      4. Run `grep -c 'PascalCase' frontend/src/AGENTS.md` — assert ≥1 result (convention documented)
    Expected Result: All path references updated, PascalCase convention documented
    Evidence: .sisyphus/evidence/task-11-agents-updated.txt

  Scenario: Build passes (sanity check)
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Build succeeds (docs changes don't break anything)
    Evidence: .sisyphus/evidence/task-11-build.txt
  ```

  **Commit**: YES
  - Message: `docs: update AGENTS.md for new frontend structure`
  - Files: `AGENTS.md`, `frontend/src/AGENTS.md`
  - Pre-commit: `cd frontend && bun run build`

- [x] 12. Final Full Build Verification

  **What to do**:
  - Run comprehensive verification after ALL changes:
    1. `cd frontend && bun run build` — full build
    2. `grep -rn "import.*from.*@/" frontend/src/ | grep -v node_modules | grep -v '/ui/' | grep -v 'app\.vue' | grep -oP "[^/]+\.vue" | grep -E '^[a-z]'` — verify no kebab-case .vue filenames in imports outside ui/ (app.vue excluded)
    3. `grep -rn 'defineStore' frontend/src/composables/ --exclude-dir=factories` — verify all non-factory stores moved (0 results)
    4. `grep -rn '@/lib/router' frontend/src/` — verify router moved (0 results)
    5. `grep -rn '@/lib/utils/' frontend/src/` — verify utils dir moved (0 results, trailing slash)
    6. `grep -rn '@/layout/' frontend/src/` — verify layout moved (0 results)
    7. Verify directory structure matches target:
       ```
       src/
       ├── app.vue (unchanged)
       ├── components/
       │   ├── dialog/ (PascalCase .vue)
       │   ├── form/ (PascalCase .vue)
       │   ├── layout/ (NEW - moved from src/layout/)
       │   ├── record/ (PascalCase .vue)
       │   ├── table/ (PascalCase .vue)
       │   └── ui/ (UNTOUCHED)
       ├── composables/ (only plain composables + factories)
       ├── router/ (NEW - moved from lib/router/)
       ├── stores/ (NEW - Pinia stores)
       ├── utils/ (NEW - moved from lib/utils/)
       ├── lib/
       │   ├── api.ts (UNTOUCHED)
       │   └── utils.ts (UNTOUCHED - cn helper)
       └── pages/ (PascalCase .vue, structure unchanged)
       ```

  **Must NOT do**:
  - This is verification only — do NOT make changes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Running verification commands only
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after T11)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 11

  **References**: All previous task evidence files

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full build passes
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build`
      2. Assert exit code = 0
    Expected Result: Clean build with zero errors
    Evidence: .sisyphus/evidence/task-12-final-build.txt

  Scenario: All migration checks pass
    Tool: Bash
    Steps:
      1. Run `grep -rn "import.*from.*@/" frontend/src/ | grep -v node_modules | grep -v '/ui/' | grep -v 'app\.vue' | grep -oP "[^/]+\.vue" | grep -E '^[a-z]'` — assert 0 (no kebab-case .vue filenames in imports, excluding app.vue)
      2. Run `grep -rn 'defineStore' frontend/src/composables/ --exclude-dir=factories` — assert 0 (non-factory stores all moved)
      3. Run `grep -rn '@/lib/router' frontend/src/` — assert 0
      4. Run `grep -rn '@/lib/utils/' frontend/src/` — assert 0
      5. Run `grep -rn '@/layout/' frontend/src/` — assert 0
    Expected Result: All checks return 0 results — migration complete
    Evidence: .sisyphus/evidence/task-12-migration-checks.txt

  Scenario: Target directory structure achieved
    Tool: Bash
    Steps:
      1. Run `test -d frontend/src/stores` — assert exists
      2. Run `test -d frontend/src/router` — assert exists
      3. Run `test -d frontend/src/utils` — assert exists
      4. Run `test -d frontend/src/components/layout` — assert exists
      5. Run `test ! -d frontend/src/layout` — assert doesn't exist
      6. Run `test ! -d frontend/src/lib/router` — assert doesn't exist
      7. Run `test ! -d frontend/src/lib/utils` — assert doesn't exist (directory, NOT file)
      8. Run `test -f frontend/src/lib/utils.ts` — assert exists (cn helper stayed)
      9. Run `test -f frontend/src/lib/api.ts` — assert exists (auto-gen stayed)
    Expected Result: All new dirs exist, old dirs removed, protected files untouched
    Evidence: .sisyphus/evidence/task-12-structure-check.txt
  ```

  **Commit**: NO (verification only)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (check file locations, run grep). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

  **QA Scenarios:**

  ```
  Scenario: Must Have verification
    Tool: Bash
    Steps:
      1. Run `find frontend/src/pages frontend/src/components -name '*.vue' -exec basename {} \; | grep -E '^[a-z]' | grep -v '^app.vue$'` — assert 0 results (PascalCase enforced)
      2. Run `test -d frontend/src/stores && echo "OK"` — assert "OK" (stores directory exists)
      3. Run `test -d frontend/src/router && echo "OK"` — assert "OK" (router at top level)
      4. Run `test -d frontend/src/components/layout && echo "OK"` — assert "OK" (layout in components)
      5. Run `ls frontend/src/components/table/index.ts frontend/src/stores/index.ts frontend/src/composables/index.ts 2>/dev/null | wc -l` — assert ≥3 (barrel files exist)
      6. Run `grep -c 'PascalCase' frontend/src/AGENTS.md` — assert ≥1 (AGENTS.md updated)
    Expected Result: All "Must Have" items verified present
    Evidence: .sisyphus/evidence/final-qa/f1-must-have.txt

  Scenario: Must NOT Have verification
    Tool: Bash
    Steps:
      1. Run `git diff HEAD~11..HEAD --name-only | grep 'lib/api.ts'` — assert 0 results (api.ts never touched)
      2. Run `git diff HEAD~11..HEAD --name-only | grep 'components/ui/'` — assert 0 results (ui/ never touched)
      3. Run `git diff HEAD~11..HEAD --name-only | grep -E '\.ts$' | xargs -I {} sh -c 'old="{}"; base=$(basename "$old"); echo "$base"' | grep -E '^[A-Z]'` — assert 0 results (no .ts files renamed to PascalCase)
      4. Run `test -f frontend/src/lib/utils.ts && echo "OK"` — assert "OK" (cn helper not moved)
    Expected Result: All "Must NOT Have" guardrails respected
    Evidence: .sisyphus/evidence/final-qa/f1-must-not-have.txt

  Scenario: Evidence files exist
    Tool: Bash
    Steps:
      1. Run `ls .sisyphus/evidence/task-*.txt 2>/dev/null | wc -l` — assert ≥20 (evidence from all 12 tasks)
    Expected Result: Evidence trail complete
    Evidence: .sisyphus/evidence/final-qa/f1-evidence-audit.txt
  ```

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` in frontend/. Review all changed files for: broken imports, missing files, case mismatches. Check that barrel files use explicit named exports (not wildcard). Verify no `@/lib/router`, `@/lib/utils/` (with slash) paths remain.
  Output: `Build [PASS/FAIL] | Imports [N clean/N issues] | Barrels [N valid] | VERDICT`

  **QA Scenarios:**

  ```
  Scenario: Build passes clean
    Tool: Bash
    Steps:
      1. Run `cd frontend && bun run build 2>&1`
      2. Assert exit code = 0
      3. Assert output does NOT contain "error" (case-insensitive)
    Expected Result: Zero build errors
    Evidence: .sisyphus/evidence/final-qa/f2-build.txt

  Scenario: No stale import paths
    Tool: Bash
    Steps:
      1. Run `grep -rn '@/lib/router' frontend/src/` — assert 0 results
      2. Run `grep -rn '@/lib/utils/' frontend/src/` — assert 0 results
      3. Run `grep -rn '@/layout/' frontend/src/` — assert 0 results
      4. Run `grep -rn '@/composables/use-api\b' frontend/src/` — assert 0 results
    Expected Result: All old paths migrated
    Evidence: .sisyphus/evidence/final-qa/f2-stale-imports.txt

  Scenario: Barrel files use explicit exports
    Tool: Bash
    Steps:
      1. Run `grep -rn 'export \*' frontend/src/components/table/index.ts frontend/src/stores/index.ts frontend/src/composables/index.ts frontend/src/utils/index.ts 2>/dev/null`
      2. Assert 0 results (no wildcard re-exports)
    Expected Result: All barrel files use named exports only
    Evidence: .sisyphus/evidence/final-qa/f2-barrel-quality.txt
  ```

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server and navigate to every page to verify no runtime errors after restructuring.
  Output: `Pages [N/N load] | Console Errors [N] | Navigation [PASS/FAIL] | VERDICT`

  **QA Scenarios:**

  ```
  Scenario: Public pages load without errors
    Tool: Playwright (via playwright skill)
    Preconditions: Dev server running (`bun dev` started in tmux session), backend available at localhost:3000
    Steps:
      1. Start dev server: `interactive_bash("new-session -d -s dev-server")` then `interactive_bash("send-keys -t dev-server 'bun dev' Enter")`
      2. Wait 15 seconds for server startup
      3. Navigate to each PUBLIC page URL and verify load:
         - http://localhost:5173/ (home)
         - http://localhost:5173/anime
         - http://localhost:5173/movie
         - http://localhost:5173/games
         - http://localhost:5173/cartoon
         - http://localhost:5173/series
         - http://localhost:5173/queue
         - http://localhost:5173/suggestion
         - http://localhost:5173/pc
      4. For each page: assert HTTP 200, assert no "TypeError" or "ReferenceError" in console
      5. Take screenshot of each page
    Expected Result: All 9 public pages load with HTTP 200, zero JS errors in console
    Failure Indicators: HTTP non-200, console TypeError/ReferenceError, blank page
    Evidence: .sisyphus/evidence/final-qa/f3-page-{name}.png (9 screenshots)

  Scenario: Auth-protected routes redirect gracefully (not crash)
    Tool: Playwright
    Preconditions: No authenticated session (no JWT cookie)
    Steps:
      1. Navigate to http://localhost:5173/admin — assert redirect to home page (route guard redirects non-admin users)
      2. Navigate to http://localhost:5173/auction — assert redirect to home page
      3. Navigate to http://localhost:5173/profile — assert redirect to home page
      4. Assert NO JavaScript errors in console during redirects (TypeError, ReferenceError, etc.)
    Expected Result: All 3 protected routes redirect to home without JS errors — proves route guards and page component imports are intact
    Failure Indicators: JS error during redirect (broken import), 404, blank page
    Evidence: .sisyphus/evidence/final-qa/f3-auth-redirects.png

  Scenario: Cross-page navigation works
    Tool: Playwright
    Steps:
      1. Start at http://localhost:5173/
      2. Navigate from home → anime → movie → games (via sidebar/nav links)
      3. Assert each transition loads correct page content
      4. Stop dev server: `interactive_bash("send-keys -t dev-server C-c")`
    Expected Result: Navigation between pages works without errors
    Evidence: .sisyphus/evidence/final-qa/f3-navigation.png
  ```

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance: no lib/api.ts edits, no ui/ changes, no .ts renames, no business logic changes. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Scope Violations [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

  **QA Scenarios:**

  ```
  Scenario: Each task matches its spec exactly
    Tool: Bash
    Steps:
      1. Run `git log --oneline HEAD~11..HEAD` — assert 11 commits matching plan commit strategy
      2. For each commit, run `git diff <commit>~1..<commit> --stat` — verify files changed match plan's "Files" list
      3. Run `git diff HEAD~11..HEAD --name-only | sort` — compare against expected changed files list from plan
    Expected Result: 11 commits, each matching planned scope, no unaccounted files
    Evidence: .sisyphus/evidence/final-qa/f4-commit-audit.txt

  Scenario: No scope creep beyond plan
    Tool: Bash
    Steps:
      1. Run `git diff HEAD~11..HEAD --name-only | grep -v '^frontend/src/' | grep -v 'AGENTS.md'` — assert 0 results (only frontend/src/ and AGENTS.md touched)
      2. Run `git diff HEAD~11..HEAD -- frontend/src/lib/api.ts` — assert empty (api.ts untouched)
      3. Run `git diff HEAD~11..HEAD -- frontend/src/components/ui/` — assert empty (ui/ untouched)
    Expected Result: Zero scope violations — only planned files touched
    Failure Indicators: Changes to files outside scope
    Evidence: .sisyphus/evidence/final-qa/f4-scope-check.txt
  ```

---

## Commit Strategy

| Commit | Message | Files | Pre-commit check |
|--------|---------|-------|-----------------|
| 1 | `chore: remove dead code (spinner, value-updater)` | components/utils/ | `bun run build` |
| 2 | `refactor: move router/ from lib/ to src/` | lib/router/*, main.ts | `bun run build` |
| 3 | `refactor: move lib/utils/ to src/utils/` | lib/utils/*, 10 imports | `bun run build` |
| 4 | `refactor: move winner-selection-modal to components/` | auction/* | `bun run build` |
| 5 | `refactor: move SVGs to pages/pc/assets/` | pages/pc/* | `bun run build` |
| 6 | `refactor: move layout/ to components/layout/` | layout/*, router.ts | `bun run build` |
| 7 | `refactor: separate Pinia stores into src/stores/` | composables/*, stores/* | `bun run build` |
| 8 | `refactor: rename page .vue files to PascalCase` | pages/**/*.vue, router.ts | `bun run build` |
| 9 | `refactor: rename component .vue files to PascalCase` | components/**/*.vue | `bun run build` |
| 10 | `refactor: add barrel files for shared directories` | */index.ts | `bun run build` |
| 11 | `docs: update AGENTS.md for new structure` | AGENTS.md, frontend/src/AGENTS.md | `bun run build` |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && bun run build      # Expected: exit code 0, no errors
grep -rn '@/lib/router' frontend/src/  # Expected: 0 results
grep -rn '@/lib/utils/' frontend/src/  # Expected: 0 results (trailing slash!)
grep -rn 'defineStore' frontend/src/composables/ --exclude-dir=factories  # Expected: 0 results (factories excluded)
grep -rn "import.*from.*@/" frontend/src/ | grep -v node_modules | grep -v '/ui/' | grep -v 'app\.vue' | grep -oP "[^/]+\.vue" | grep -E '^[a-z]'  # Expected: 0 results
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Build passes
- [x] All pages load in dev server
- [x] AGENTS.md reflects new structure
