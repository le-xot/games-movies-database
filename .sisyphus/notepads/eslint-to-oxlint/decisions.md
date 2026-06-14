# Decisions — eslint-to-oxlint

## [2026-04-04] Planning Phase Decisions

### Migration Scope
- FULL replacement: no ESLint/oxlint hybrid
- Latest versions of both oxlint and oxfmt

### Formatting Decisions
- singleQuote: true (enforced by old ESLint)
- tabWidth: 2, printWidth: 100 (from .editorconfig)
- 1TBS brace style (from eslint.config.js)
- arrowParens: "avoid" (style/arrow-parens was off → sensible default)
- sortImports enabled with @/ alias as internal pattern
- trailingComma: "all" (TypeScript default)

### oxfmt File Scope
- `frontend/src/lib/api.ts` is excluded via `ignorePatterns` because it is auto-generated.

### Linting Decisions
- Categories: correctness (error), suspicious (warn) — match ESLint scope
- require-await: error
- no-unused-vars: warn (TypeScript variant too)
- no-console: off (was off in ESLint)
- no type-aware linting
- No markdown/YAML/TOML linting

### Ignore Decisions
- dist, node_modules, coverage, .augment-guidelines, frontend/src/lib/api.ts

### oxlint Config Shape
- Use the schema-backed `ignorePatterns` field; do not invent parser options for decorators unless parsing fails.
- Keep the config minimal: plugins, categories, rules, ignores.

### Dropped From ESLint
- @antfu/eslint-config specific rules with no oxlint equivalent: intentionally dropped (per user agreement — acceptability of losing Vue template linting)
- perfectionist/sort-imports: REPLACED by oxfmt's sortImports (moved from lint-time to format-time)
- Prettier-related settings: removed (Prettier already disabled)
