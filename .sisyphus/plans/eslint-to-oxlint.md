# Миграция ESLint → OxLint + Oxfmt

## TL;DR

> **Quick Summary**: Полная замена ESLint (@antfu/eslint-config) на oxlint + oxfmt в Bun monorepo. Удаление всех ESLint-зависимостей, создание конфигов oxlint/oxfmt, обновление скриптов, IDE-настроек и документации.
> 
> **Deliverables**:
> - `.oxlintrc.json` — конфиг линтера с эквивалентными правилами
> - `.oxfmtrc.json` — конфиг форматтера (single quotes, 2-space, 1tbs, printWidth 100, sortImports)
> - Обновлённый `package.json` (скрипты lint/format)
> - Обновлённый `.vscode/settings.json` и `.vscode/extensions.json`
> - Удалённый `eslint.config.js` и `@antfu/eslint-config`
> - Обновлённые `README.md` и `AGENTS.md`
> - Кодовая база переформатирована oxfmt
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 2 waves + final verification
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → F1-F4

---

## Context

### Original Request
Пользователь хочет полностью мигрировать с ESLint (@antfu/eslint-config) на oxlint + oxfmt. Мотивация: скорость, упрощение конфигурации, уход от Node-зависимостей.

### Interview Summary
**Key Discussions**:
- Vue `<template>` linting теряется — приемлемо, агент проверит конвенции вручную при QA
- Markdown/YAML linting — не нужно, убираем
- oxfmt beta — устраивает, ставим последние версии
- Type-aware linting — не нужен, базовый TS
- Import sorting переходит из lint-time в format-time — приемлемо
- Unused imports — warn достаточно, авто-удаление не обязательно
- Документация (README.md, AGENTS.md) — обновить в рамках миграции

**Research Findings**:
- oxlint v1.56.0: стабильный, 700+ правил, TypeScript + NestJS decorators поддерживаются
- oxfmt beta: все нужные опции форматирования есть, sortImports на базе perfectionist
- Vue SFC: `<script>` linting ✅, `<template>` linting ❌, formatting — экспериментально (возможные проблемы idempotency)
- Bun compatibility: работает через `bun add -d oxlint oxfmt`
- Migration tool: `@oxlint/migrate` конвертирует eslint flat config → .oxlintrc.json

### Metis Review
**Identified Gaps** (addressed):
- oxfmt может крашиться на Vue файлах (Issue #20525) → добавлен dry-run шаг проверки
- `frontend/src/lib/api.ts` содержит `/* eslint-disable */` → добавить в ignorePatterns oxlint
- `.augment-guidelines` в ESLint ignores → перенести в oxlint ignorePatterns
- NestJS decorators (113 usage across 51 files) → verify oxlint parses decorators correctly on `backend/src/modules/auth/auth.controller.ts`
- 159 Vue SFC файлов — высокий риск при массовом oxfmt → idempotency check обязателен
- 7 упоминаний ESLint в README.md и AGENTS.md → включено в scope

---

## Work Objectives

### Core Objective
Полностью заменить ESLint на oxlint (линтинг) + oxfmt (форматирование) во всём monorepo, сохраняя эквивалентное качество кода.

### Concrete Deliverables
- `.oxlintrc.json` — конфигурация линтера
- `.oxfmtrc.json` — конфигурация форматтера
- Обновлённые скрипты в `package.json`
- Обновлённые `.vscode/settings.json` и `.vscode/extensions.json`
- Переформатированная кодовая база
- Обновлённые `README.md` и `AGENTS.md`
- Удалённые: `eslint.config.js`, `@antfu/eslint-config` из devDependencies

### Definition of Done
- [x] `bun oxlint .` — выполняется без ошибок конфига (warnings допустимы)
- [x] `bun oxfmt --check .` — exit 0 (все файлы отформатированы)
- [x] `grep -ri "eslint" --include="*.json" --include="*.js" --include="*.md" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.sisyphus` — ноль упоминаний вне `frontend/src/lib/api.ts`
- [x] `eslint.config.js` не существует
- [x] `@antfu/eslint-config` отсутствует в package.json

### Must Have
- Конфиг oxlint с правилами: require-await (error), no-unused-vars (warn), unused imports detection (warn)
- Конфиг oxfmt: singleQuote, tabWidth 2, printWidth 100, sortImports с группами builtin→external→internal→parent/sibling→type→side-effect (опции должны соответствовать текущей документации oxfmt — проверить через `bunx oxfmt --help` и docs)
- NestJS decorator support — oxlint должен корректно парсить файлы с декораторами (проверить на `backend/src/modules/auth/auth.controller.ts`)
- Ignore patterns: `.augment-guidelines`, `frontend/src/lib/api.ts`, `dist`, `node_modules`
- Атомарный коммит для массового реформата (отдельный от конфигурационных изменений) — для сохранения `git blame`
- Idempotency check после реформата (oxfmt дважды → zero diff)

### Must NOT Have (Guardrails)
- НЕ редактировать `frontend/src/lib/api.ts` — авто-генерируемый файл
- НЕ добавлять новые правила линтинга, которых не было в ESLint конфиге
- НЕ включать type-aware linting (--type-aware)
- НЕ добавлять markdown/YAML/TOML linting
- НЕ создавать гибрид ESLint + oxlint
- НЕ добавлять ESLint в CI (его там не было)
- НЕ трогать application code logic — только tooling config, IDE settings, scripts, formatting
- НЕ трогать `vite.config.ts`, `tsconfig.json`, `prisma.schema`
- НЕ исправлять lint warnings, найденные oxlint — миграция инструмента, не fix warnings
- НЕ переименовывать `suggesttion.dto.ts` (известный тайп в проекте)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (нет тестов в проекте)
- **Automated tests**: NO
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Config validation**: Use Bash — JSON parse, command execution, exit code checks
- **Formatting verification**: Use Bash — oxfmt --check, diff, spot-check files
- **Codebase search**: Use Bash (grep) — verify no ESLint remnants

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — configs + installation):
├── Task 1: Install oxlint + oxfmt [quick]
├── Task 2: Create .oxlintrc.json [quick]
└── Task 3: Create .oxfmtrc.json [quick]

Wave 2 (After Wave 1 — sequential migration steps):
├── Task 4: Dry-run oxfmt on Vue SFC files + reformat codebase [deep]
├── Task 5: Replace ESLint with oxlint/oxfmt in scripts + IDE + remove ESLint [unspecified-high]
└── Task 6: Update documentation (README.md + AGENTS.md) [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | —         | 2, 3, 4, 5 |
| 2    | 1         | 4, 5   |
| 3    | 1         | 4      |
| 4    | 2, 3      | 5, 6   |
| 5    | 4         | 6      |
| 6    | 5         | F1-F4  |

### Agent Dispatch Summary

- **Wave 1**: **3 tasks** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 2**: **3 tasks** — T4 → `deep`, T5 → `unspecified-high`, T6 → `writing`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Install oxlint + oxfmt

  **What to do**:
  - Run `bun add -d oxlint oxfmt` in the project root
  - Verify binaries are accessible: `bunx oxlint --version` and `bunx oxfmt --version`
  - Add `oxlint` and `oxfmt` to `trustedDependencies` in `package.json` if installation requires it

  **Must NOT do**:
  - Do NOT remove `@antfu/eslint-config` yet — both tools coexist at this stage
  - Do NOT modify any scripts yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple package installation, single command
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - None needed for package installation

  **Parallelization**:
  - **Can Run In Parallel**: NO (Tasks 2, 3 depend on packages being installed)
  - **Parallel Group**: Wave 1 — runs first
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `package.json:24-27` — current devDependencies section where oxlint/oxfmt will be added
  - `package.json:28-34` — trustedDependencies array, may need oxlint/oxfmt if bun prompts

  **External References**:
  - oxlint npm: https://www.npmjs.com/package/oxlint
  - oxfmt npm: https://www.npmjs.com/package/oxfmt

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify oxlint installation
    Tool: Bash
    Preconditions: Project root directory
    Steps:
      1. Run `bunx oxlint --version`
      2. Assert exit code is 0
      3. Assert output contains a version number (e.g., "1." or "0.")
    Expected Result: oxlint version printed, exit 0
    Failure Indicators: "command not found", non-zero exit code
    Evidence: .sisyphus/evidence/task-1-oxlint-version.txt

  Scenario: Verify oxfmt installation
    Tool: Bash
    Preconditions: Project root directory
    Steps:
      1. Run `bunx oxfmt --version`
      2. Assert exit code is 0
      3. Assert output contains a version number
    Expected Result: oxfmt version printed, exit 0
    Failure Indicators: "command not found", non-zero exit code
    Evidence: .sisyphus/evidence/task-1-oxfmt-version.txt

  Scenario: Verify package.json updated correctly
    Tool: Bash
    Preconditions: After bun add
    Steps:
      1. Run `grep "oxlint" package.json`
      2. Run `grep "oxfmt" package.json`
      3. Assert both appear in devDependencies
    Expected Result: Both packages listed in devDependencies
    Failure Indicators: grep returns no matches
    Evidence: .sisyphus/evidence/task-1-package-json.txt
  ```

  **Commit**: YES (group 1)
  - Message: `chore: add oxlint and oxfmt configuration`
  - Files: `package.json`, `bun.lock`
  - Pre-commit: `bunx oxlint --version && bunx oxfmt --version`

- [x] 2. Create .oxlintrc.json

  **What to do**:
  - Create `.oxlintrc.json` in project root with the following configuration:
    - `$schema`: point to `./node_modules/oxlint/configuration_schema.json`
    - `plugins`: `["typescript", "import", "unicorn", "oxc"]`
    - `categories`: `correctness` → error, `suspicious` → warn, others off
    - `rules` mapping from ESLint config:
      - `eslint/require-await` → `"error"`
      - `eslint/no-unused-vars` → `"warn"`
      - `eslint/no-console` → `"off"` (was off in ESLint)
      - `eslint/no-alert` → `"off"` (was off in ESLint)
      - `typescript/no-unused-vars` → `"warn"`
    - `ignorePatterns`: `["dist", "node_modules", "coverage", ".augment-guidelines", "frontend/src/lib/api.ts"]`
  - Use `@oxlint/migrate` (`bunx @oxlint/migrate`) as a starting point, then manually adjust output against the rule mapping. Do NOT blindly trust migrate output — verify every rule.
  - **NestJS decorator support**: oxlint supports TypeScript decorators natively through its TypeScript plugin. Verify by running `bunx oxlint backend/src/modules/auth/auth.controller.ts` — if it parses without "unexpected token" or decorator-related errors, decorators are supported. If decorator parsing issues arise, check oxlint docs for the correct config option (the config schema may have changed since research was conducted — consult `./node_modules/oxlint/configuration_schema.json` for available `parserOptions` or equivalent fields).

  **Must NOT do**:
  - Do NOT enable categories beyond `correctness` and `suspicious` (match ESLint scope)
  - Do NOT add markdown/yaml/toml support
  - Do NOT enable type-aware linting (no `--type-aware`)
  - Do NOT add new rules that weren't in the original ESLint config

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single config file creation with clear specification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Task 3
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `eslint.config.js:1-53` — source of truth for all rules that must be mapped to oxlint equivalents
  - `eslint.config.js:8-37` — exact rules with severity levels and options

  **External References**:
  - oxlint config schema: `./node_modules/oxlint/configuration_schema.json`
  - @oxlint/migrate: https://www.npmjs.com/package/@oxlint/migrate
  - oxlint rules list: https://oxc.rs/docs/guide/usage/linter/rules

  **WHY Each Reference Matters**:
  - `eslint.config.js` contains every custom rule override — each must be mapped or explicitly dropped with rationale
  - The migration tool output should be diffed against manual mapping to catch any missed rules

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify .oxlintrc.json is valid and parseable
    Tool: Bash
    Preconditions: .oxlintrc.json exists in project root
    Steps:
      1. Run `bun -e "JSON.parse(require('fs').readFileSync('.oxlintrc.json','utf8')); console.log('valid JSON')"`
      2. Assert output is "valid JSON"
    Expected Result: File is valid JSON
    Failure Indicators: JSON parse error
    Evidence: .sisyphus/evidence/task-2-json-valid.txt

  Scenario: Verify oxlint runs with new config without parse errors
    Tool: Bash
    Preconditions: .oxlintrc.json and oxlint installed
    Steps:
      1. Run `bunx oxlint . 2>&1 | head -5`
      2. Assert no "config" or "parse error" in output
      3. Exit code may be non-zero due to lint warnings — that's OK
    Expected Result: oxlint runs, may report lint issues, but no config errors
    Failure Indicators: "Error reading config", "Invalid configuration", "unknown rule"
    Evidence: .sisyphus/evidence/task-2-oxlint-run.txt

  Scenario: Verify NestJS decorators parse correctly
    Tool: Bash
    Preconditions: .oxlintrc.json and oxlint installed
    Steps:
      1. Run `bunx oxlint backend/src/modules/auth/auth.controller.ts 2>&1`
      2. Assert no "unexpected token", "SyntaxError", or "decorator" parse errors in output
      3. Lint warnings/errors about code quality are OK — only parse failures are blockers
    Expected Result: oxlint parses the decorator-heavy file without syntax errors
    Failure Indicators: "unexpected token", "SyntaxError", "failed to parse"
    Evidence: .sisyphus/evidence/task-2-decorators.txt

  Scenario: Verify ignore patterns include required entries
    Tool: Bash
    Preconditions: .oxlintrc.json exists
    Steps:
      1. Run `grep "api.ts" .oxlintrc.json` — must match
      2. Run `grep "augment-guidelines" .oxlintrc.json` — must match
      3. Run `grep "node_modules" .oxlintrc.json` — must match
    Expected Result: All three ignore patterns present
    Failure Indicators: Any grep returns no match
    Evidence: .sisyphus/evidence/task-2-ignores.txt
  ```

  **Commit**: YES (group 1 — same commit as Task 1)
  - Message: `chore: add oxlint and oxfmt configuration`
  - Files: `.oxlintrc.json`

- [x] 3. Create .oxfmtrc.json

  **What to do**:
  - Create `.oxfmtrc.json` in project root. **IMPORTANT**: Before writing the config, consult the actual oxfmt documentation and `bunx oxfmt --help` to verify which options are supported. The options listed below reflect research findings but may not match the exact current API:
    - `printWidth`: 100
    - `tabWidth`: 2
    - `useTabs`: false
    - `singleQuote`: true
    - `trailingComma`: `"all"`
    - `semi`: true
    - `arrowParens`: `"avoid"` (style/arrow-parens was "off" in ESLint → oxfmt decides; "avoid" matches common single-param arrow style)
    - Brace style: Check oxfmt docs for the correct option name. If `braceStyle` is not supported, check for alternatives like `bracketSameLine` or similar. The target is 1TBS (opening brace on same line). If no such option exists, omit it — 1TBS is typically the default.
    - `sortImports` configuration: Check oxfmt sorting docs for the exact syntax. The goal is:
      - Groups order: builtin → external → internal (@/ alias) → parent/sibling/index → type → side-effect → unknown
      - `internalPattern`: `["@/**"]` — to classify `@/` path alias as internal
      - Newlines between groups: preserve current behavior (ESLint had `newlinesBetween: 'ignore'`). Check if oxfmt uses `newlinesBetween: false` (boolean) or a string value.
    - `ignorePatterns`: `["frontend/src/lib/api.ts"]` — auto-generated file, don't reformat
  - **Verify every option against docs**: Run `bunx oxfmt --init` to see the default generated config as a reference for valid option names. Cross-reference with https://oxc.rs/docs/guide/usage/formatter/configuration

  **Must NOT do**:
  - Do NOT enable options that weren't in ESLint config (e.g., jsxSingleQuote)
  - Do NOT change import sort groups from what was configured in perfectionist

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single config file creation with clear specification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Task 2
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `eslint.config.js:9` — `style/quotes`: single, avoidEscape: false → `singleQuote: true`
  - `eslint.config.js:49` — `style/brace-style`: 1tbs → `braceStyle: "1tbs"`
  - `eslint.config.js:50` — `style/arrow-parens`: off → `arrowParens: "avoid"` (sensible default)
  - `eslint.config.js:20-37` — perfectionist/sort-imports groups → `sortImports.groups`
  - `.editorconfig:8` — `indent_size = 2` → `tabWidth: 2`
  - `.editorconfig:9` — `max_line_length = 100` → `printWidth: 100`

  **External References**:
  - oxfmt config options: https://oxc.rs/docs/guide/usage/formatter/configuration
  - oxfmt sortImports: https://oxc.rs/docs/guide/usage/formatter/sorting

  **WHY Each Reference Matters**:
  - Each ESLint stylistic rule maps to a specific oxfmt option — the mapping must be exact
  - `.editorconfig` values must match oxfmt settings to avoid conflicts
  - perfectionist sort-imports groups must be faithfully translated to oxfmt sortImports format

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify .oxfmtrc.json is valid and parseable
    Tool: Bash
    Preconditions: .oxfmtrc.json exists in project root
    Steps:
      1. Run `bun -e "JSON.parse(require('fs').readFileSync('.oxfmtrc.json','utf8')); console.log('valid JSON')"`
      2. Assert output is "valid JSON"
    Expected Result: File is valid JSON
    Failure Indicators: JSON parse error
    Evidence: .sisyphus/evidence/task-3-json-valid.txt

  Scenario: Verify oxfmt runs with new config without parse errors
    Tool: Bash
    Preconditions: .oxfmtrc.json and oxfmt installed
    Steps:
      1. Run `bunx oxfmt --check frontend/src/app.vue 2>&1`
      2. Assert no "config" or "parse error" in output
      3. Non-zero exit code is OK (files not yet formatted)
    Expected Result: oxfmt runs, may report unformatted files, but no config errors
    Failure Indicators: "Error reading config", "Invalid option", "unknown field", "No such file"
    Evidence: .sisyphus/evidence/task-3-oxfmt-run.txt

  Scenario: Verify key formatting options are set
    Tool: Bash
    Preconditions: .oxfmtrc.json exists
    Steps:
      1. Run `grep "singleQuote" .oxfmtrc.json` — must match with "true"
      2. Run `grep "printWidth" .oxfmtrc.json` — must match with "100"
      3. Run `grep -i "sort" .oxfmtrc.json` — must match (sortImports or equivalent)
      4. Read the file and verify all configured options match oxfmt's supported syntax
    Expected Result: Key formatting options present and valid
    Failure Indicators: singleQuote or printWidth missing, no sort config found
    Evidence: .sisyphus/evidence/task-3-options.txt
  ```

  **Commit**: YES (group 1 — same commit as Tasks 1, 2)
  - Message: `chore: add oxlint and oxfmt configuration`
  - Files: `.oxfmtrc.json`

---

- [x] 4. Dry-run oxfmt on Vue SFC files + reformat entire codebase

  **What to do**:
  - **Step 1: Dry-run on Vue files** — Run `bunx oxfmt --check frontend/src/**/*.vue 2>&1` to verify oxfmt doesn't crash on any of the 159 Vue SFC files. If any file crashes, exclude it from formatting with a glob pattern in oxfmtrc.json ignorePatterns and document which files were excluded.
  - **Step 2: Mass reformat** — Run `bunx oxfmt --write .` to reformat the entire codebase
  - **Step 3: Idempotency check** — Run `bunx oxfmt --write .` again and verify `git diff --stat` shows zero changes. If non-zero, investigate which files are non-idempotent, file as a known issue, and exclude them if necessary.
  - **Step 4: Spot-check formatting** — Manually inspect 3 representative files:
    - A Vue SFC with `<script setup>` — verify single quotes, 2-space indent, 1tbs
    - A backend `.ts` with NestJS decorators — verify decorators preserved, formatting correct
    - A file with many imports — verify import order: builtin → external → internal → parent/sibling → type → side-effect
  - **Step 5: Commit** — Create an atomic commit containing ONLY formatting changes. No config changes in this commit.

  **Must NOT do**:
  - Do NOT include any config file changes in this commit — ONLY formatting changes
  - Do NOT modify `frontend/src/lib/api.ts` — it's auto-generated
  - Do NOT fix any code logic — only accept formatting changes
  - Do NOT skip the idempotency check — oxfmt is beta and may have non-idempotent bugs

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: High-risk operation (159 Vue files, beta formatter), requires careful verification and error handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — sequential, must happen after configs exist
  - **Parallel Group**: Wave 2 — sequential
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `.oxfmtrc.json` (created in Task 3) — the config oxfmt will use
  - `frontend/src/lib/api.ts:1` — has `/* eslint-disable */` comment, this file must NOT be touched (auto-generated)
  - `frontend/src/components/` — representative Vue SFC files for spot-checking
  - `backend/src/modules/` — representative NestJS files with decorators for spot-checking

  **External References**:
  - oxfmt known Vue issue: https://github.com/oxc-project/oxc/issues/20525 (crash on certain Vue files)
  - oxfmt idempotency issue: https://github.com/oxc-project/oxc/issues/20084 (non-idempotent Vue formatting)

  **WHY Each Reference Matters**:
  - The Vue crash issue means we MUST dry-run before mass-write to catch failures
  - The idempotency issue means we MUST verify formatting is stable after write
  - api.ts must be excluded to prevent modifying auto-generated code

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dry-run oxfmt on all Vue files without crashes
    Tool: Bash
    Preconditions: .oxfmtrc.json exists, oxfmt installed
    Steps:
      1. Run `find frontend/src -name "*.vue" | xargs bunx oxfmt --check 2>&1`
      2. Assert no "panic", "crash", "SIGSEGV" in output
      3. Non-zero exit code is expected (files not yet formatted)
    Expected Result: oxfmt processes all .vue files without crashing
    Failure Indicators: "panic", "crash", "thread panicked", segfault
    Evidence: .sisyphus/evidence/task-4-vue-dryrun.txt

  Scenario: Codebase reformatted and idempotent
    Tool: Bash
    Preconditions: After `bunx oxfmt --write .` completed
    Steps:
      1. Run `bunx oxfmt --write .`
      2. Run `git diff --stat`
      3. Assert zero files changed (empty diff)
    Expected Result: Running oxfmt twice produces identical output (idempotent)
    Failure Indicators: `git diff --stat` shows any changed files
    Evidence: .sisyphus/evidence/task-4-idempotency.txt

  Scenario: oxfmt --check passes after reformat
    Tool: Bash
    Preconditions: After reformat
    Steps:
      1. Run `bunx oxfmt --check .`
      2. Assert exit code is 0
    Expected Result: All files pass formatting check
    Failure Indicators: Non-zero exit code, files listed as needing formatting
    Evidence: .sisyphus/evidence/task-4-check-pass.txt

  Scenario: api.ts was NOT modified
    Tool: Bash
    Preconditions: After reformat
    Steps:
      1. Run `git diff frontend/src/lib/api.ts`
      2. Assert empty output (no changes)
    Expected Result: api.ts unchanged
    Failure Indicators: Any diff output for api.ts
    Evidence: .sisyphus/evidence/task-4-api-untouched.txt

  Scenario: Spot-check Vue SFC formatting
    Tool: Bash
    Preconditions: After reformat
    Steps:
      1. Pick a Vue SFC file with `<script setup>` — read first 30 lines
      2. Verify single quotes used (no double quotes except in template attributes)
      3. Verify 2-space indentation
      4. Verify 1tbs brace style on any if/else blocks
    Expected Result: Formatting matches configured options
    Failure Indicators: Double quotes in script block, wrong indentation, Allman braces
    Evidence: .sisyphus/evidence/task-4-vue-spotcheck.txt

  Scenario: Spot-check backend decorator file formatting
    Tool: Bash
    Preconditions: After reformat
    Steps:
      1. Pick a backend .ts file with NestJS decorators (e.g., a controller)
      2. Read file, verify decorators are intact and properly formatted
      3. Verify single quotes, 2-space indent
    Expected Result: Decorators preserved, formatting correct
    Failure Indicators: Broken decorators, missing annotations, wrong formatting
    Evidence: .sisyphus/evidence/task-4-backend-spotcheck.txt
  ```

  **Commit**: YES (group 2 — standalone commit)
  - Message: `chore: reformat codebase with oxfmt`
  - Files: All reformatted source files (except api.ts)
  - Pre-commit: `bunx oxfmt --check .`

- [x] 5. Replace ESLint with oxlint/oxfmt in scripts + IDE config + remove ESLint

  **What to do**:
  - **Update `package.json` scripts** (lines 18-19):
    - Replace `"lint": "eslint ."` → `"lint": "oxlint ."`
    - Replace `"lint:fix": "eslint . --fix"` → `"lint:fix": "oxlint --fix ."`
    - Add `"format": "oxfmt --write ."` — new script
    - Add `"format:check": "oxfmt --check ."` — new script
  - **Remove `@antfu/eslint-config`** from `devDependencies` (line 25)
  - **Delete `eslint.config.js`** — no longer needed
  - **Run `bun install`** to update lockfile (removes all ESLint transitive dependencies)
  - **Update `.vscode/settings.json`** — replace entire content:
    - Remove `"prettier.enable": false` (no longer relevant)
    - Replace `editor.codeActionsOnSave` → remove `source.fixAll.eslint`, add oxc equivalents
    - Remove `eslint.rules.customizations` block (lines 13-24)
    - Remove `eslint.validate` block (lines 27-49)
    - Add oxc-specific settings: `"oxc.enable": true`, `"oxc.lint.run": "onSave"`
    - Keep `typescript.tsdk` and `[prisma]` formatter settings
    - Keep `editor.formatOnSave: true`
  - **Update `.vscode/extensions.json`** — replace `dbaeumer.vscode-eslint` with `oxc.oxc-vscode`, keep `Vue.volar`

  **Must NOT do**:
  - Do NOT change any source code in this commit — only config/scripts/IDE
  - Do NOT add ESLint to CI (it wasn't there before)
  - Do NOT modify `vite.config.ts`, `tsconfig.json`, or any non-lint config

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files to update with precise edits, need careful verification of each change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 4 (reformat must be committed first)
  - **Parallel Group**: Wave 2 — sequential after Task 4
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `package.json:18-19` — current `lint` and `lint:fix` scripts to replace
  - `package.json:24-27` — devDependencies section, remove `@antfu/eslint-config`
  - `.vscode/settings.json:1-54` — entire file to rewrite (remove ESLint refs, add oxc)
  - `.vscode/extensions.json:1-6` — replace ESLint extension with oxc
  - `eslint.config.js` — file to delete

  **External References**:
  - oxc VSCode extension: https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode
  - oxc VSCode settings: check extension README for available settings

  **WHY Each Reference Matters**:
  - `package.json` scripts are the primary interface for running lint/format — must be correct
  - `.vscode/settings.json` controls format-on-save behavior — broken settings = broken DX
  - Extension recommendation ensures team members get prompted to install oxc extension

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: bun lint runs oxlint (not eslint)
    Tool: Bash
    Preconditions: After all changes
    Steps:
      1. Run `bun lint 2>&1 | head -20`
      2. Assert output does NOT contain "eslint"
      3. Assert oxlint is running (look for oxlint-style output or no "eslint" references)
    Expected Result: `bun lint` invokes oxlint
    Failure Indicators: "eslint" in output, command not found
    Evidence: .sisyphus/evidence/task-5-bun-lint.txt

  Scenario: eslint.config.js is deleted
    Tool: Bash
    Preconditions: After deletion
    Steps:
      1. Run `test ! -f eslint.config.js && echo "PASS" || echo "FAIL"`
      2. Assert output is "PASS"
    Expected Result: eslint.config.js does not exist
    Failure Indicators: Output is "FAIL"
    Evidence: .sisyphus/evidence/task-5-eslint-config-deleted.txt

  Scenario: No ESLint references in package.json
    Tool: Bash
    Preconditions: After updates
    Steps:
      1. Run `grep -i "eslint" package.json`
      2. Assert no output (no matches)
    Expected Result: Zero ESLint references in package.json
    Failure Indicators: Any match found
    Evidence: .sisyphus/evidence/task-5-no-eslint-packagejson.txt

  Scenario: No ESLint references in .vscode/settings.json
    Tool: Bash
    Preconditions: After updates
    Steps:
      1. Run `grep -i "eslint" .vscode/settings.json`
      2. Assert no output (no matches)
    Expected Result: Zero ESLint references in VSCode settings
    Failure Indicators: Any match found
    Evidence: .sisyphus/evidence/task-5-no-eslint-vscode.txt

  Scenario: oxc extension recommended in extensions.json
    Tool: Bash
    Preconditions: After updates
    Steps:
      1. Run `grep "oxc.oxc-vscode" .vscode/extensions.json`
      2. Assert match found
      3. Run `grep "dbaeumer.vscode-eslint" .vscode/extensions.json`
      4. Assert NO match (removed)
    Expected Result: oxc extension recommended, ESLint extension removed
    Failure Indicators: oxc not found or ESLint still present
    Evidence: .sisyphus/evidence/task-5-extensions.txt

  Scenario: bun install completes without ESLint deps
    Tool: Bash
    Preconditions: After removing @antfu/eslint-config
    Steps:
      1. Run `bun install`
      2. Assert exit code is 0
      3. Run `test ! -d node_modules/@antfu/eslint-config && echo "PASS" || echo "FAIL"`
    Expected Result: Clean install, no @antfu/eslint-config in node_modules
    Failure Indicators: Install failure, @antfu still present
    Evidence: .sisyphus/evidence/task-5-clean-install.txt
  ```

  **Commit**: YES (group 3)
  - Message: `chore: replace eslint with oxlint in scripts and IDE config`
  - Files: `package.json`, `bun.lock`, `.vscode/settings.json`, `.vscode/extensions.json`, deleted `eslint.config.js`
  - Pre-commit: `bun lint 2>&1 | head -5`

- [x] 6. Update documentation (README.md + AGENTS.md)

  **What to do**:
  - **Update `README.md`**:
    - Line 81-82: Replace `bun lint` / `bun lint:fix` descriptions to reference oxlint/oxfmt instead of ESLint
    - Line ~216: Replace "Follow the ESLint configuration for code style" → "Follow the oxlint/oxfmt configuration for code style"
    - Add `bun format` and `bun format:check` to Available Scripts section
  - **Update `AGENTS.md`**:
    - Line ~20: "Formatter" section — replace ESLint-only reference with "oxlint (linter) + oxfmt (formatter). Prettier disabled"
    - Line ~44: Replace `@antfu/eslint-config` reference → oxlint/oxfmt
    - Line ~81-82: "Quotes" / formatting convention references — update to reference oxfmt config
    - Any other ESLint mentions — replace with oxlint/oxfmt equivalents
    - Update "COMMANDS" section: replace `bun lint` description from "Lint check" to "Lint check (oxlint)", add `bun format` / `bun format:check`
    - Update "ANTI-PATTERNS" if any ESLint-specific entries exist

  **Must NOT do**:
  - Do NOT rewrite entire documentation — only update ESLint-related references
  - Do NOT add sections about features that don't exist (e.g., don't claim CI runs lint)
  - Do NOT change documentation style or structure

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation updates requiring accurate text replacement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 5 (need accurate final state to document)
  - **Parallel Group**: Wave 2 — after Task 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `README.md:81-82` — current lint script descriptions
  - `README.md:216` — "Follow the ESLint configuration" text
  - `AGENTS.md:20` — Formatter mention
  - `AGENTS.md:44` — @antfu/eslint-config reference
  - `AGENTS.md:81-82` — formatting conventions

  **WHY Each Reference Matters**:
  - Each reference is a specific location where "ESLint" text must be replaced with oxlint/oxfmt
  - Line numbers are approximate — use grep to find exact locations

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No ESLint references in README.md
    Tool: Bash
    Preconditions: After documentation updates
    Steps:
      1. Run `grep -i "eslint" README.md`
      2. Assert no output (no matches)
    Expected Result: Zero ESLint references in README
    Failure Indicators: Any match found
    Evidence: .sisyphus/evidence/task-6-readme-clean.txt

  Scenario: No ESLint references in AGENTS.md
    Tool: Bash
    Preconditions: After documentation updates
    Steps:
      1. Run `grep -i "eslint" AGENTS.md`
      2. Assert no output (no matches)
    Expected Result: Zero ESLint references in AGENTS.md
    Failure Indicators: Any match found
    Evidence: .sisyphus/evidence/task-6-agents-clean.txt

  Scenario: oxlint/oxfmt mentioned in README.md
    Tool: Bash
    Preconditions: After documentation updates
    Steps:
      1. Run `grep -i "oxlint\|oxfmt" README.md`
      2. Assert at least 2 matches
    Expected Result: oxlint and/or oxfmt referenced in README
    Failure Indicators: No matches
    Evidence: .sisyphus/evidence/task-6-readme-oxlint.txt

  Scenario: oxlint/oxfmt mentioned in AGENTS.md
    Tool: Bash
    Preconditions: After documentation updates
    Steps:
      1. Run `grep -i "oxlint\|oxfmt" AGENTS.md`
      2. Assert at least 2 matches
    Expected Result: oxlint and/or oxfmt referenced in AGENTS.md
    Failure Indicators: No matches
    Evidence: .sisyphus/evidence/task-6-agents-oxlint.txt
  ```

  **Commit**: YES (group 4)
  - Message: `docs: update documentation for oxlint/oxfmt migration`
  - Files: `README.md`, `AGENTS.md`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bun oxlint .` and `bun oxfmt --check .`. Verify configs are valid JSON. Check no `eslint` references remain outside `frontend/src/lib/api.ts`, `node_modules`, and `.sisyphus/` (plan files intentionally mention ESLint for documentation). Verify `.vscode/settings.json` has no ESLint references. Verify `.vscode/extensions.json` recommends `oxc.oxc-vscode`. Use: `grep -ri "eslint" --include="*.json" --include="*.js" --include="*.md" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.sisyphus`
  Output: `oxlint [PASS/FAIL] | oxfmt [PASS/FAIL] | ESLint remnants [CLEAN/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Spot-check 5 representative files for correct formatting: 1 Vue SFC with `<script setup>`, 1 backend .ts with decorators, 1 file with many imports, 1 deeply nested component, 1 Prisma-related file. Verify single quotes, 2-space indent, 1tbs braces, import order. Check idempotency: `bun oxfmt --write . && git diff --stat` — must show zero changes.
  Output: `Formatting [N/N correct] | Idempotency [PASS/FAIL] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Verify no application logic was changed — only config/tooling/docs/formatting.
  Output: `Tasks [N/N compliant] | Scope Creep [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

1. `chore: add oxlint and oxfmt configuration` — `.oxlintrc.json`, `.oxfmtrc.json`, `package.json` (new devDeps), `bun.lock`
2. `chore: reformat codebase with oxfmt` — массовый реформат ТОЛЬКО (никаких конфиг-изменений). Изолированный коммит для `git blame`
3. `chore: replace eslint with oxlint in scripts and IDE config` — `package.json` (scripts), `.vscode/settings.json`, `.vscode/extensions.json`, удаление `eslint.config.js`, удаление `@antfu/eslint-config`, `bun.lock`
4. `docs: update documentation for oxlint/oxfmt migration` — `README.md`, `AGENTS.md`

---

## Success Criteria

### Verification Commands
```bash
bun oxlint .              # Expected: runs without config errors (warnings OK)
bun oxfmt --check .       # Expected: exit 0 (all formatted)
test ! -f eslint.config.js && echo "PASS"  # Expected: PASS
grep -c "eslint" package.json  # Expected: 0
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] oxlint runs cleanly
- [x] oxfmt --check passes
- [x] No ESLint references outside api.ts (excluding .sisyphus/ and node_modules/)
- [x] Documentation updated
- [x] Git blame preserved (reformat in separate commit)
