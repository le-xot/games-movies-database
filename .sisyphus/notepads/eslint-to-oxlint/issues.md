# Issues — eslint-to-oxlint

## [2026-04-04] Pre-execution known issues

### vite.config.ts LSP Error (PRE-EXISTING — NOT OUR ISSUE)
- File: `frontend/vite.config.ts:9:29`
- Error: SassPreprocessorOptions type mismatch
- Status: PRE-EXISTING before our migration — do NOT attempt to fix
- Action: Ignore in all verification checks

### oxfmt Vue SFC known issues
- Crash potential: https://github.com/oxc-project/oxc/issues/20525
- Non-idempotent formatting: https://github.com/oxc-project/oxc/issues/20084
- Mitigation: dry-run before mass reformat, idempotency check, exclude crashing files

### NestJS Decorators
- Decorators are supported by oxlint's TypeScript plugin
- Verify by running oxlint against auth.controller.ts
- If parse failures, consult configuration_schema.json for parserOptions

### oxlint repo-wide run
- `bunx oxlint .` reports existing lint findings but no config/parser errors.
- Empty decorated classes trigger `typescript-eslint(no-extraneous-class)` warnings unless explicitly allowed.
