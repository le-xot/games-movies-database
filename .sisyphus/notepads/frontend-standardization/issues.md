# Issues & Gotchas

## [2026-04-04] Pre-existing Issues

### vite.config.ts LSP Error (IGNORE — pre-existing)
- File: `frontend/vite.config.ts:9`
- Error: SCSS preprocessor options type mismatch (Vite 8 beta type issue)
- Action: DO NOT fix, not in scope, pre-dates this work

### LSP Errors in use-*-table.ts (Task 9 will fix)
- All 5 table composables have implicit `any` on callback parameters
- Pre-existing, will be fixed in Task 9

### anime-table.ts implicit any (lines 59, 77, 91, 106, 124, 139)
### cartoon-table.ts implicit any (lines 59, 77, 91, 106, 124, 139)
### series-table.ts implicit any (lines 59, 77, 91, 106, 124, 139)
### movie-table.ts implicit any (lines 58, 72, 87, 105, 120)
### games-table.ts implicit any (lines 57, 71, 86, 104, 119)
