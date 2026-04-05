# Convert All Relative Imports to `@/` Aliases

## TL;DR

> **Quick Summary**: Конвертировать все относительные импорты (`./`, `../`) в alias-импорты (`@/`) по всему проекту (frontend + backend). Чистый рефакторинг без изменения поведения.
> 
> **Deliverables**:
> - Ноль относительных импортов в `backend/src/` и `frontend/src/` (кроме auto-generated `api.ts`)
> - Исправленный `backend/tsconfig.json` (добавлен `baseUrl`, убран wildcard `*`)
> - Чистый `tsc --noEmit`, `bun build`, `bun lint`, `bun format:check`
> 
> **Estimated Effort**: Medium (~119 файлов, чисто механическая замена)
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (tsconfig fix) → Tasks 2-3 (backend + frontend barrels) → Tasks 4-6 (frontend pages/components) → Task 7 (final validation)

---

## Context

### Original Request
Перевести все импорты по всему проекту на alias `@/`. Конвертировать абсолютно все относительные импорты без исключений.

### Interview Summary
**Key Discussions**:
- Scope: абсолютно все `./` и `../` → `@/`, включая barrel re-exports, co-located composables, page components
- Проект: Bun monorepo — Vue 3 frontend (Vite) + NestJS backend (Prisma)
- Alias `@/` → `./src/*` уже настроен в обоих пакетах

**Research Findings**:
- Frontend: 76 файлов с relative imports, 154 уже на `@/`
- Backend: 43 файла с relative imports, 33 уже на `@/`
- Backend tsconfig имеет опасный wildcard `"*": ["./*"]` и отсутствует `baseUrl`
- Нет тестовой инфраструктуры — валидация через tsc + build + lint
- `frontend/src/lib/api.ts` — auto-generated, НЕЛЬЗЯ трогать
- `.vue` расширения ОБЯЗАТЕЛЬНО сохранять, `.ts` расширения НЕ добавлять
- Side-effect imports (`import './foo'`) тоже конвертируются
- `oxfmt` с `sortImports` переставит порядок импортов после конвертации — это ожидаемо

### Metis Review
**Identified Gaps** (addressed):
- Backend tsconfig нуждается в `baseUrl: "."` и удалении wildcard `"*": ["./*"]` — добавлено как Task 1 (prerequisite)
- Side-effect imports (e.g., `import './assets/index.css'`) не были упомянуты — включены в scope
- `bun format` должен запускаться после каждого батча для нормализации порядка импортов — добавлен в каждый task
- Нужна проверка что `api.ts` не модифицирован — добавлена в acceptance criteria

---

## Work Objectives

### Core Objective
Заменить все относительные импорты (`./`, `../`) на alias-импорты (`@/`) во всех `.ts` и `.vue` файлах в `frontend/src/` и `backend/src/`.

### Concrete Deliverables
- `backend/tsconfig.json` — добавлен `baseUrl: "."`, удалён `"*": ["./*"]`
- 43 файла в `backend/src/` — relative → `@/`
- 76 файлов в `frontend/src/` — relative → `@/`
- Все файлы отформатированы через `bun format`

### Definition of Done
- [x] `grep -rE "from ['\"]\\.\\.?/" backend/src/ | wc -l` → `0`
- [x] `grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l` → `0`
- [x] `grep -rE "^import ['\"]\\.\\.?/" frontend/src/ backend/src/ | wc -l` → `0` (side-effect imports)
- [x] `git diff frontend/src/lib/api.ts` → пусто
- [x] `bun lint` → exit 0
- [x] `bun format:check` → exit 0

### Must Have
- Все `./` и `../` импорты в backend/src/ конвертированы в `@/`
- Все `./` и `../` импорты в frontend/src/ конвертированы в `@/` (кроме api.ts)
- Все side-effect imports конвертированы (`import './foo'` → `import '@/foo'`)
- `.vue` расширения сохранены на всех Vue SFC импортах
- `.ts` расширения НЕ добавлены
- Backend tsconfig исправлен (baseUrl + убран wildcard)
- `bun format` запущен после каждого батча
- tsc/build валидация после каждого коммита

### Must NOT Have (Guardrails)
- НЕ трогать `frontend/src/lib/api.ts` (auto-generated)
- НЕ добавлять `.ts` расширения к импортам
- НЕ удалять `.vue` расширения из импортов
- НЕ менять export statements, только import/export-from пути
- НЕ переименовывать файлы или директории
- НЕ рефакторить barrel files (только менять пути)
- НЕ исправлять typo `suggesttion.dto.ts`
- НЕ удалять дублирование `CustomJwtModule` в `app.module.ts`
- НЕ добавлять новые alias маппинги
- НЕ трогать template `src` атрибуты (только JS/TS imports)
- НЕ менять динамические `import()` выражения (если есть)
- НЕ трогать `__dirname` / `path.resolve()` / `path.join()` — это runtime filesystem paths, не imports

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None

### QA Policy
Every task uses compilation + grep as verification. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **TypeScript check**: `bunx --bun tsc --noEmit` (backend), `bunx vue-tsc --noEmit` (frontend — verify installed first, fallback to `vite build`)
- **Build**: `bun build` (both)
- **Lint**: `bun lint`
- **Format**: `bun format:check`
- **Grep**: `grep -rE "from ['\"]\\.\\.?/"` to count remaining relative imports

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — prerequisite):
└── Task 1: Fix backend tsconfig.json [quick]

Wave 2 (After Wave 1 — backend + frontend barrels in parallel):
├── Task 2: Convert backend imports (all 43 files) [unspecified-high]
└── Task 3: Convert frontend barrel index.ts files (~24 files) [unspecified-high]

Wave 3 (After Wave 2 — frontend pages/composables/components, MAX PARALLEL):
├── Task 4: Convert frontend pages + composables (~30 files) [unspecified-high]
├── Task 5: Convert frontend shared components (table, layout, dialog, form, record) (~20 files) [unspecified-high]
└── Task 6: Convert frontend entry points + stores + router + remaining (~10 files) [quick]

Wave FINAL (After ALL tasks):
└── Task 7: Final validation + format + comprehensive grep [quick]

Critical Path: Task 1 → Task 2/3 → Task 4/5/6 → Task 7
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 3 (Wave 3)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2, 3 |
| 2 | 1 | 7 |
| 3 | 1 | 4, 5, 6 |
| 4 | 3 | 7 |
| 5 | 3 | 7 |
| 6 | 3 | 7 |
| 7 | 2, 4, 5, 6 | — |

### Agent Dispatch Summary

- **Wave 1**: **1 task** — T1 → `quick`
- **Wave 2**: **2 tasks** — T2 → `unspecified-high`, T3 → `unspecified-high`
- **Wave 3**: **3 tasks** — T4 → `unspecified-high`, T5 → `unspecified-high`, T6 → `quick`
- **FINAL**: **1 task** — T7 → `quick`

---

## TODOs

- [x] 1. Fix backend tsconfig.json — add baseUrl, remove wildcard

  **What to do**:
  - Открыть `backend/tsconfig.json`
  - Добавить `"baseUrl": "."` в `compilerOptions` (сейчас отсутствует)
  - Удалить `"*": ["./*"]` из `paths` (опасный wildcard, может shadowing npm пакетов)
  - Оставить `"@/*": ["./src/*"]` без изменений
  - Запустить `bunx --bun tsc --noEmit` для валидации
  - Запустить `timeout 10 bun run ./src/main.ts` для smoke-теста (если нужен запущенный postgres — пропустить runtime test, положиться на tsc)

  **Must NOT do**:
  - НЕ менять другие опции compilerOptions
  - НЕ добавлять новые path mappings
  - НЕ трогать include/exclude

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Одно изменение в одном JSON файле
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `backend/tsconfig.json` — полный файл, нужно добавить `baseUrl` и убрать wildcard из `paths`

  **API/Type References**:
  - TypeScript `tsconfig.json` paths documentation — `baseUrl` is required for `paths` to work reliably

  **WHY Each Reference Matters**:
  - `backend/tsconfig.json` — это единственный файл для редактирования. Текущий `paths` содержит `"*": ["./*"]` на строке перед `"@/*"`. Нужно удалить только первый mapping, оставив второй.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Backend TypeScript compilation passes after tsconfig fix
    Tool: Bash
    Preconditions: backend/tsconfig.json has been modified
    Steps:
      1. cd backend && bunx --bun tsc --noEmit
      2. Check exit code is 0
    Expected Result: Exit code 0, no errors printed
    Failure Indicators: Non-zero exit code, "Cannot find module" errors
    Evidence: .sisyphus/evidence/task-1-tsc-backend.txt

  Scenario: Verify tsconfig.json structure is correct
    Tool: Bash
    Preconditions: File saved
    Steps:
      1. Read backend/tsconfig.json
      2. Assert "baseUrl" key exists with value "."
      3. Assert paths contains "@/*" mapping
      4. Assert paths does NOT contain "*" wildcard mapping
    Expected Result: baseUrl: ".", paths: { "@/*": ["./src/*"] } only
    Failure Indicators: Missing baseUrl, wildcard still present, or @/* mapping missing
    Evidence: .sisyphus/evidence/task-1-tsconfig-verify.txt
  ```

  **Commit**: YES
  - Message: `chore(backend): fix tsconfig paths — add baseUrl, remove wildcard`
  - Files: `backend/tsconfig.json`
  - Pre-commit: `cd backend && bunx --bun tsc --noEmit`

- [x] 2. Convert all backend relative imports to @/ aliases

  **What to do**:
  - Найти все файлы в `backend/src/` с относительными импортами (`./` или `../`)
  - Для каждого файла вычислить правильный `@/` путь на основе позиции файла в дереве `src/`
  - Заменить все `from './...'` и `from '../...'` на соответствующие `from '@/...'`
  - Также заменить side-effect imports: `import './...'` → `import '@/...'` (если есть)
  - НЕ добавлять `.ts` расширения
  - Запустить `bun format` из корня для нормализации порядка импортов
  - Валидировать: `bunx --bun tsc --noEmit` из `backend/`
  
  **Категории файлов для конвертации** (все в `backend/src/`):
  - `main.ts` — `./app.module`, `./utils/enviroments` → `@/app.module`, `@/utils/enviroments`
  - `app.module.ts` — `./modules/...`, `./database/...` → `@/modules/...`, `@/database/...`
  - `modules/auth/*` — `../twitch/...`, `../user/...`, `./auth.service` → `@/modules/twitch/...`, `@/modules/user/...`, `@/modules/auth/auth.service`
  - `modules/record/*` — `../records-providers/...` → `@/modules/records-providers/...`
  - Все остальные `modules/*/` файлы с относительными imports
  - `database/prisma.module.ts` — `./prisma.service` → `@/database/prisma.service`
  
  **Must NOT do**:
  - НЕ трогать npm-пакеты (`@nestjs/...`, `@prisma/...`)
  - НЕ переименовывать `suggesttion.dto.ts`
  - НЕ менять export statements
  - НЕ удалять дублирование `CustomJwtModule`
  - НЕ трогать `path.resolve(__dirname, ...)` и `join(__dirname, ...)` — это runtime paths

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: ~43 файла, нужна аккуратность в вычислении путей
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/spotify/spotify.service.ts` — пример файла уже использующего `@/` imports (`@/database/prisma.service`, `@/utils/enviroments`). Следовать этому стилю.
  - `backend/src/modules/auth/auth.service.ts` — пример файла с `../twitch/twitch.service`, `../user/user.service` — конвертировать в `@/modules/twitch/twitch.service`, `@/modules/user/user.service`
  - `backend/src/main.ts` — entry point с `./app.module`, `./utils/enviroments`
  - `backend/src/app.module.ts` — главный модуль, смешивает `@/` и `./` imports

  **WHY Each Reference Matters**:
  - `spotify.service.ts` показывает уже принятый стиль `@/` imports в backend — копировать эту конвенцию
  - `auth.service.ts` типичный пример `../` cross-module import — конвертировать в `@/modules/...`
  - `main.ts` и `app.module.ts` — корневые файлы с `./` imports в `src/` root level

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero relative imports remain in backend
    Tool: Bash
    Preconditions: All backend files converted
    Steps:
      1. grep -rE "from ['\"]\\.\\.?/" backend/src/ | wc -l
      2. Assert output is 0
    Expected Result: 0 (no relative imports found)
    Failure Indicators: Any number > 0
    Evidence: .sisyphus/evidence/task-2-grep-backend.txt

  Scenario: Backend compiles without errors
    Tool: Bash
    Preconditions: All imports converted, bun format run
    Steps:
      1. cd backend && bunx --bun tsc --noEmit
      2. Check exit code is 0
    Expected Result: Exit code 0
    Failure Indicators: "Cannot find module" or "Cannot resolve" errors
    Evidence: .sisyphus/evidence/task-2-tsc-backend.txt

  Scenario: Lint passes
    Tool: Bash
    Preconditions: All imports converted
    Steps:
      1. bun lint
      2. Check exit code
    Expected Result: Exit code 0, no lint errors
    Failure Indicators: Import-related lint failures
    Evidence: .sisyphus/evidence/task-2-lint.txt

  Scenario: Format is clean
    Tool: Bash
    Preconditions: bun format already run
    Steps:
      1. bun format:check
      2. Check exit code
    Expected Result: Exit code 0
    Failure Indicators: Formatting differences detected
    Evidence: .sisyphus/evidence/task-2-format.txt
  ```

  **Commit**: YES
  - Message: `refactor(backend): convert all relative imports to @/ aliases`
  - Files: all `backend/src/**/*.ts` with relative imports
  - Pre-commit: `cd backend && bunx --bun tsc --noEmit && bun lint && bun format:check`

- [x] 3. Convert frontend barrel index.ts files to @/ aliases

  **What to do**:
  - Найти все `index.ts` barrel-файлы в `frontend/src/` с relative imports
  - Это файлы с pattern `export { default as X } from './X.vue'` или `export { Y } from './y'`
  - Конвертировать `./X.vue` → `@/components/ui/{name}/X.vue` (сохранять `.vue` расширение!)
  - Конвертировать `./y` → `@/path/to/y` (БЕЗ `.ts` расширения)
  - Запустить `bun format` после конвертации
  
  **Файлы для конвертации** (~24 barrel files):
  - `components/ui/button/index.ts`
  - `components/ui/badge/index.ts`
  - `components/ui/card/index.ts` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
  - `components/ui/command/index.ts` (Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut)
  - `components/ui/context-menu/index.ts`
  - `components/ui/dialog/index.ts`
  - `components/ui/dropdown-menu/index.ts`
  - `components/ui/alert-dialog/index.ts`
  - `components/ui/form/index.ts` (включает `./useFormField` и `./injectionKeys` — .ts files, без расширения!)
  - `components/ui/input/index.ts`
  - `components/ui/label/index.ts`
  - `components/ui/popover/index.ts`
  - `components/ui/pagination/index.ts`
  - `components/ui/select/index.ts`
  - `components/ui/separator/index.ts`
  - `components/ui/sonner/index.ts`
  - `components/ui/table/index.ts`
  - `components/ui/tabs/index.ts`
  - `components/ui/tooltip/index.ts`
  - `components/ui/avatar/index.ts` (если есть)
  - `stores/index.ts`
  - `composables/index.ts`
  - `utils/index.ts`
  - `components/layout/index.ts`
  - `components/table/index.ts`
  - `components/table/table-col/index.ts`
  
  **Также конвертировать внутренние импорты в shadcn-vue компонентах:**
  - `components/ui/form/FormControl.vue` — `from './useFormField'` → `from '@/components/ui/form/useFormField'`
  - `components/ui/form/FormItem.vue` — `from './injectionKeys'` → `from '@/components/ui/form/injectionKeys'`
  - Все `form/*.vue` файлы импортирующие `./useFormField` или `./injectionKeys`
  - `components/ui/popover/PopoverContent.vue` — если импортирует sibling
  - Все shadcn-vue `.vue` файлы с `cn` import из `@/lib/utils` (уже `@/`, не трогать!)

  **Must NOT do**:
  - НЕ убирать `.vue` расширения
  - НЕ добавлять `.ts` расширения
  - НЕ менять структуру exports (только путь в `from '...'`)
  - НЕ менять `cn` import из `@/lib/utils` (уже alias)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: ~24 barrel файла + ~15 внутренних .vue файлов, нужна внимательность с расширениями
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/button/index.ts` — типичный barrel: `export { default as Button } from './Button.vue'`
  - `frontend/src/components/ui/form/index.ts` — сложный barrel с `.vue` и `.ts` re-exports + `./injectionKeys`
  - `frontend/src/stores/index.ts` — store barrel file
  - `frontend/src/components/ui/form/FormItem.vue` — пример `.vue` файла с `from './injectionKeys'` и `from '@/lib/utils'`

  **WHY Each Reference Matters**:
  - `button/index.ts` — минимальный barrel, один re-export. Паттерн для всех простых barrel'ов
  - `form/index.ts` — сложный barrel с mix `.vue`/`.ts`. Нужна осторожность: `.vue` расширения оставить, `.ts` не добавлять
  - `FormItem.vue` — показывает что `.vue` компоненты внутри UI папок тоже имеют `./` imports

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero relative imports in barrel files
    Tool: Bash
    Preconditions: All barrels converted
    Steps:
      1. Find all index.ts in frontend/src/: find frontend/src -name 'index.ts' -exec grep -l "from ['\"]\\.\\.?/" {} \;
      2. Assert output is empty
    Expected Result: No files listed (all barrels converted)
    Failure Indicators: Any index.ts file still containing relative imports
    Evidence: .sisyphus/evidence/task-3-grep-barrels.txt

  Scenario: .vue extensions preserved in all barrel re-exports
    Tool: Bash
    Preconditions: Barrels converted
    Steps:
      1. grep -rn "from '@/.*\\.vue'" frontend/src/**/index.ts | head -5 (spot check — should show .vue extension)
      2. grep -rn "from '@/.*[^e]'" frontend/src/components/ui/*/index.ts | grep -v node_modules (check for missing .vue on Vue imports)
    Expected Result: All Vue component re-exports have .vue extension
    Failure Indicators: A Vue component import path ending without .vue
    Evidence: .sisyphus/evidence/task-3-vue-extensions.txt

  Scenario: No .ts extensions added
    Tool: Bash
    Preconditions: Barrels converted
    Steps:
      1. grep -rn "\\.ts'" frontend/src/**/index.ts
      2. Assert output is empty (no .ts extensions in import paths)
    Expected Result: 0 matches
    Failure Indicators: Any import path ending with .ts
    Evidence: .sisyphus/evidence/task-3-ts-extensions.txt

  Scenario: Frontend builds successfully after barrel conversion
    Tool: Bash
    Preconditions: Barrels + internal shadcn imports converted, bun format run
    Steps:
      1. bun build
      2. Check exit code
    Expected Result: Exit code 0, frontend/dist produced
    Failure Indicators: Build errors, "Cannot resolve" errors
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES (groups with Tasks 4, 5, 6 into one frontend commit)
  - Message: `refactor(frontend): convert all relative imports to @/ aliases`
  - Files: all frontend barrel index.ts + shadcn-vue internal imports
  - Pre-commit: `bun build && bun lint && bun format:check`

- [x] 4. Convert frontend pages + composables imports to @/ aliases

  **What to do**:
  - Конвертировать все relative imports в `frontend/src/pages/` (все page .vue файлы и их composables)
  - Паттерны для конвертации:
    - `import X from './components/X.vue'` → `import X from '@/pages/{page}/components/X.vue'`
    - `import { useX } from './use-x'` → `import { useX } from '@/pages/{page}/composables/use-x'`
    - `import { useXParams } from './use-x-params'` → `import { useXParams } from '@/pages/{page}/composables/use-x-params'`
    - `import { X } from '../constants/...'` → `import { X } from '@/pages/{page}/constants/...'`
  - Сохранять `.vue` расширения, НЕ добавлять `.ts`
  - Запустить `bun format` после конвертации
  
  **Страницы для обработки** (~30 files):
  - `pages/movie/` — MoviePage.vue, composables/use-movie.ts, use-movie-params.ts, use-movie-table.ts, components/MovieTable.vue
  - `pages/anime/` — AnimePage.vue, composables/use-anime.ts, use-anime-params.ts, use-anime-table.ts, components/AnimeTable.vue
  - `pages/series/` — SeriesPage.vue, composables/use-series.ts, use-series-params.ts, use-series-table.ts, components/SeriesTable.vue
  - `pages/cartoon/` — CartoonPage.vue, composables/use-cartoon.ts, use-cartoon-params.ts, use-cartoon-table.ts, components/CartoonTable.vue
  - `pages/games/` — GamesPage.vue, composables/use-games.ts, use-games-params.ts, use-games-table.ts, components/GamesTable.vue
  - `pages/auction/` — AuctionPage.vue, composables/use-auctions.ts, components/AuctionCard.vue, components/WinnerSelectionModal.vue
  - `pages/suggestion/` — SuggestionPage.vue, composables/use-suggestion.ts, use-like.ts, components/SuggestionForm.vue, components/SuggestionCard.vue
  - `pages/queue/` — QueuePage.vue, composables/use-queue.ts, components/QueueCard.vue
  - `pages/home/` — HomePage.vue, constants/home-items.ts
  - `pages/profile/` — ProfilePage.vue
  - `pages/admin/` — AdminPage.vue
  - `pages/pc/` — PcPage.vue, constants/parts-links.ts
  - `pages/auth/` — AuthCallback.vue

  **Must NOT do**:
  - НЕ менять imports из `@/` (уже alias)
  - НЕ менять npm package imports
  - НЕ рефакторить composable структуру

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: ~30 файлов, повторяющийся паттерн но разные пути
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/pages/movie/composables/use-movie.ts` — `from './use-movie-params'` → `from '@/pages/movie/composables/use-movie-params'`
  - `frontend/src/pages/auction/AuctionPage.vue` — `from './components/AuctionCard.vue'` → `from '@/pages/auction/components/AuctionCard.vue'`
  - `frontend/src/pages/anime/composables/use-anime.ts` — типичный composable с mix `@/` и `./` imports

  **WHY Each Reference Matters**:
  - `use-movie.ts` — показывает паттерн `./use-xxx` sibling import в composables
  - `AuctionPage.vue` — показывает паттерн `./components/X.vue` page-local component import
  - `use-anime.ts` — файл с обоими типами imports, наглядно видно что менять и что нет

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero relative imports in pages directory
    Tool: Bash
    Preconditions: All page files converted
    Steps:
      1. grep -rE "from ['\"]\\.\\.?/" frontend/src/pages/ --include='*.ts' --include='*.vue' | wc -l
      2. Assert output is 0
    Expected Result: 0
    Failure Indicators: Any number > 0
    Evidence: .sisyphus/evidence/task-4-grep-pages.txt

  Scenario: .vue extensions preserved
    Tool: Bash
    Preconditions: Converted
    Steps:
      1. Spot-check 3 page files: grep "from '@/" in MoviePage.vue, AnimePage.vue, AuctionPage.vue
      2. Verify all .vue component imports end with .vue
    Expected Result: All Vue imports have .vue extension
    Failure Indicators: Missing .vue on component imports
    Evidence: .sisyphus/evidence/task-4-vue-ext.txt
  ```

  **Commit**: YES (groups with Tasks 3, 5, 6)
  - Message: `refactor(frontend): convert all relative imports to @/ aliases`
  - Files: all `frontend/src/pages/**/*.{ts,vue}` with relative imports

- [x] 5. Convert frontend shared components imports to @/ aliases

  **What to do**:
  - Конвертировать relative imports в shared-компонентах вне `pages/` и `ui/`:
    - `components/table/` — DataTable.vue, TableSearch.vue, TablePagination.vue, TableFilter*.vue, composables/use-table-*.ts, table-col/*.vue
    - `components/layout/` — db/LayoutDatabase.vue, db/LayoutBody.vue, db/LayoutHeader.vue
    - `components/dialog/` — Dialog.vue
    - `components/form/` — LoginForm.vue
    - `components/record/` — RecordCreateForm.vue
  - Сохранять `.vue` расширения, НЕ добавлять `.ts`
  - Запустить `bun format`

  **Must NOT do**:
  - НЕ менять существующие `@/` imports
  - НЕ менять структуру экспортов

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: ~20 файлов в нескольких директориях
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/components/table/DataTable.vue` — основной table компонент, импортирует sibling composables и sub-components
  - `frontend/src/components/table/composables/use-table-select.ts` — composable внутри components/table
  - `frontend/src/components/layout/db/LayoutDatabase.vue` — layout component с relative imports

  **WHY Each Reference Matters**:
  - `DataTable.vue` — ключевой компонент, много relative imports к table-col, composables
  - `use-table-select.ts` — composable в shared component (не page), тоже нужна конвертация
  - `LayoutDatabase.vue` — nested layout component, imports из `./LayoutBody.vue`, `./LayoutHeader.vue`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero relative imports in shared components
    Tool: Bash
    Preconditions: All shared component files converted
    Steps:
      1. grep -rE "from ['\"]\\.\\.?/" frontend/src/components/ --include='*.ts' --include='*.vue' | wc -l
      2. Assert output is 0
    Expected Result: 0
    Failure Indicators: Any number > 0
    Evidence: .sisyphus/evidence/task-5-grep-components.txt
  ```

  **Commit**: YES (groups with Tasks 3, 4, 6)
  - Message: `refactor(frontend): convert all relative imports to @/ aliases`
  - Files: all `frontend/src/components/**/*.{ts,vue}` with relative imports (excluding barrels done in Task 3)

- [x] 6. Convert frontend entry points, stores, router, remaining files

  **What to do**:
  - Конвертировать оставшиеся файлы с relative imports:
    - `frontend/src/main.ts` — `import App from './app.vue'` → `import App from '@/app.vue'`, `import './assets/index.css'` → `import '@/assets/index.css'`
    - `frontend/src/router/router.ts` — `import { ROUTER_PATHS } from './router-paths'` → `import { ROUTER_PATHS } from '@/router/router-paths'`
    - `frontend/src/stores/use-user.ts` — `import { useApi } from './use-api'` → `import { useApi } from '@/stores/use-api'`
    - Любые оставшиеся файлы найденные через `grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts'`
  - Сохранять `.vue` расширения (e.g., `@/app.vue`)
  - Запустить `bun format`
  - Запустить финальную проверку: `bun build && bun lint && bun format:check`

  **Must NOT do**:
  - НЕ трогать `frontend/src/lib/api.ts`
  - НЕ менять dynamic imports в router (они уже используют `@/`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: ~10 файлов, простые замены
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/main.ts` — entry point с `import './assets/index.css'` (side-effect import!) и `import App from './app.vue'`
  - `frontend/src/router/router.ts` — router config с `./router-paths`
  - `frontend/src/stores/use-user.ts` — store с `./use-api` sibling import

  **WHY Each Reference Matters**:
  - `main.ts` — содержит SIDE-EFFECT import (`import './assets/index.css'`), не `from`! Важно конвертировать оба типа
  - `router.ts` — sibling import `./router-paths`
  - `use-user.ts` — sibling store import

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero relative imports in entire frontend (except api.ts)
    Tool: Bash
    Preconditions: All frontend files converted
    Steps:
      1. grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l
      2. Assert output is 0
      3. grep -rE "^import ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l
      4. Assert output is 0 (side-effect imports too)
    Expected Result: Both counts are 0
    Failure Indicators: Any remaining relative imports
    Evidence: .sisyphus/evidence/task-6-grep-frontend-final.txt

  Scenario: api.ts is unmodified
    Tool: Bash
    Preconditions: All frontend work complete
    Steps:
      1. git diff frontend/src/lib/api.ts
      2. Assert output is empty
    Expected Result: No changes to api.ts
    Failure Indicators: Any diff output
    Evidence: .sisyphus/evidence/task-6-api-ts-check.txt

  Scenario: Full frontend build succeeds
    Tool: Bash
    Preconditions: All tasks 3-6 complete, bun format run
    Steps:
      1. bun build
      2. bun lint
      3. bun format:check
      4. All exit codes are 0
    Expected Result: All pass
    Failure Indicators: Build/lint/format failures
    Evidence: .sisyphus/evidence/task-6-full-build.txt
  ```

  **Commit**: YES (groups with Tasks 3, 4, 5)
  - Message: `refactor(frontend): convert all relative imports to @/ aliases`
  - Files: `frontend/src/main.ts`, `frontend/src/router/router.ts`, `frontend/src/stores/use-user.ts`, remaining
  - Pre-commit: `bun build && bun lint && bun format:check`

- [x] 7. Final comprehensive validation

  **What to do**:
  - Запустить полный набор проверок acceptance criteria:
    1. `grep -rE "from ['\"]\\.\\.?/" backend/src/ | wc -l` → 0
    2. `grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l` → 0
    3. `grep -rE "^import ['\"]\\.\\.?/" frontend/src/ backend/src/ | wc -l` → 0
    4. `git diff frontend/src/lib/api.ts` → пусто
    5. `cd backend && bunx --bun tsc --noEmit` → exit 0
    6. `bun build` → exit 0
    7. `bun lint` → exit 0
    8. `bun format:check` → exit 0
  - Сохранить результаты каждой проверки в evidence файлы
  - Если какая-то проверка не прошла — исправить и повторить

  **Must NOT do**:
  - НЕ пропускать ни одну проверку
  - НЕ коммитить если есть failures

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Только запуск команд и проверка результатов
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave FINAL (solo)
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 4, 5, 6

  **References**:

  **Pattern References**:
  - Plan's "Success Criteria" section — точные команды и ожидаемые результаты

  **WHY Each Reference Matters**:
  - Все acceptance criteria определены в самом плане, агент должен следовать им точно

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Complete acceptance criteria pass
    Tool: Bash
    Preconditions: All tasks 1-6 complete and committed
    Steps:
      1. grep -rE "from ['\"]\\.\\.?/" backend/src/ | wc -l → assert 0
      2. grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l → assert 0
      3. grep -rE "^import ['\"]\\.\\.?/" frontend/src/ backend/src/ | wc -l → assert 0
      4. git diff frontend/src/lib/api.ts → assert empty
      5. cd backend && bunx --bun tsc --noEmit → assert exit 0
      6. bun build → assert exit 0
      7. bun lint → assert exit 0
      8. bun format:check → assert exit 0
    Expected Result: All 8 checks pass
    Failure Indicators: Any check fails
    Evidence: .sisyphus/evidence/task-7-final-validation.txt
  ```

  **Commit**: NO (validation only)

---

## Final Verification Wave

- [x] F1. **Comprehensive Grep Check** — `quick`
  Run `grep -rE "from ['\"]\\.\\.?/" backend/src/ frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts'` — must return 0 results. Also check side-effect imports: `grep -rE "^import ['\"]\\.\\.?/" backend/src/ frontend/src/`. Verify `git diff frontend/src/lib/api.ts` is empty.
  Output: `Relative imports [0] | Side-effect relative [0] | api.ts [UNMODIFIED] | VERDICT: APPROVE/REJECT`

- [x] F2. **Full Build + Lint + Format Validation** — `quick`
  Run: `bun lint && bun format:check && bun build`. All must exit 0. Run `bunx --bun tsc --noEmit` from backend/. If `vue-tsc` available, run `bunx vue-tsc --noEmit` from frontend/.
  Output: `Lint [PASS/FAIL] | Format [PASS/FAIL] | Build [PASS/FAIL] | TSC Backend [PASS/FAIL] | TSC Frontend [PASS/FAIL] | VERDICT`

---

## Commit Strategy

| Commit | Scope | Message | Validation |
|--------|-------|---------|------------|
| 1 | Task 1 | `chore(backend): fix tsconfig paths — add baseUrl, remove wildcard` | `bunx --bun tsc --noEmit` |
| 2 | Task 2 | `refactor(backend): convert all relative imports to @/ aliases` | `bunx --bun tsc --noEmit` + `bun lint` |
| 3 | Tasks 3-6 | `refactor(frontend): convert all relative imports to @/ aliases` | `bun build` + `bun lint` + `bun format:check` |

---

## Success Criteria

### Verification Commands
```bash
# Zero relative imports in backend
grep -rE "from ['\"]\\.\\.?/" backend/src/ | wc -l  # Expected: 0

# Zero relative imports in frontend (excluding api.ts)
grep -rE "from ['\"]\\.\\.?/" frontend/src/ --include='*.ts' --include='*.vue' | grep -v 'lib/api.ts' | wc -l  # Expected: 0

# Zero side-effect relative imports
grep -rE "^import ['\"]\\.\\.?/" frontend/src/ backend/src/ | wc -l  # Expected: 0

# api.ts untouched
git diff frontend/src/lib/api.ts  # Expected: empty

# All checks pass
bun lint  # Expected: exit 0
bun format:check  # Expected: exit 0
bun build  # Expected: exit 0
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Backend compiles and starts
- [x] Frontend builds successfully
- [x] api.ts unmodified
