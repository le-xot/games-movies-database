# Learnings — eslint-to-oxlint

## [2026-04-04] Session Start

### Project Conventions
- Package manager: Bun ONLY (`bun install`, `bun add`, `bunx`)
- Single quotes enforced everywhere
- 2-space indent, max 100 chars line width
- 1TBS brace style
- Import sorting: builtin → external → internal (@/) → parent/sibling → type → side-effect
- Vue blocks: `<script setup lang="ts">` first or `<template>` first, `<style>` last
- Path alias `@/` → `./src/`

### Key File Locations
- `package.json` — root, has lint/lint:fix scripts on lines ~18-19, devDeps ~24-27
- `eslint.config.js` — 53 lines, antfu config with rules to migrate
- `.vscode/settings.json` — 54 lines, ESLint formatter-on-save config
- `.vscode/extensions.json` — recommends `dbaeumer.vscode-eslint`
- `.editorconfig` — indent 2, max_line 100
- `frontend/src/lib/api.ts` — AUTO-GENERATED, has `/* eslint-disable */`, MUST NOT TOUCH
- `frontend/src/app.vue` — lowercase, Vue SFC for QA testing
- `backend/src/modules/auth/auth.controller.ts` — NestJS with decorators for verification

### Research Findings
- oxlint v1.56.0: 700+ rules, TypeScript + NestJS decorators supported
- oxfmt beta: singleQuote, tabWidth, printWidth, sortImports available
- Vue SFC: `<script>` linting ✅, `<template>` linting ❌, formatting experimental
- Known issue: Vue crash https://github.com/oxc-project/oxc/issues/20525
- Known issue: idempotency https://github.com/oxc-project/oxc/issues/20084
- Migration tool: `@oxlint/migrate` converts eslint flat config → .oxlintrc.json
- 159 Vue SFC files in frontend, 113 decorator usages across 51 backend files

### oxfmt Config Observations
- `ignorePatterns` is supported in `.oxfmtrc.json`; add `frontend/src/lib/api.ts` there.
- `sortImports.groups` accepts predefined selectors like `builtin`, `external`, `internal`, `parent`, `sibling`, `index`, `type`, `side_effect`, `unknown`.
- `internalPattern` accepts `@/` for the project alias.
- `newlinesBetween` is a boolean in oxfmt config.

### oxlint Config Observations
- `ignorePatterns` is the correct field name in `.oxlintrc.json`.
- `categories` only accepts correctness, nursery, pedantic, perf, restriction, style, and suspicious.
- Decorator-heavy NestJS files parse fine with the default TypeScript plugin settings.

### Commit Strategy (ATOMIC — DO NOT MERGE)
1. `chore: add oxlint and oxfmt configuration` — .oxlintrc.json, .oxfmtrc.json, package.json (new devDeps), bun.lock
2. `chore: reformat codebase with oxfmt` — ONLY formatting changes, no config
3. `chore: replace eslint with oxlint in scripts and IDE config` — package.json scripts, .vscode/*, delete eslint.config.js
4. `docs: update documentation for oxlint/oxfmt migration` — README.md, AGENTS.md

### [2026-04-05] Lint cleanup session
- `typescript/no-extraneous-class` + `import/no-unassigned-import` are the two key oxlint config additions for NestJS empty decorators and CSS side-effect imports.
- For shadow warnings, alias destructured `data` to `response` and keep mutation DTO property names unchanged when only the local binding needs renaming.
- `bun run format` after fixes can reorder imports; verify with `bun run lint` afterward.
