# Decisions

## [2026-04-04] Confirmed Decisions

1. **Factory pattern**: YES — create 3 factories for 5 media pages
2. **Two-way binding**: `defineModel` (already done in codebase, no migration needed)
3. **columnVisibility storage**: Per-genre keys `columnsVisibility:<genre>`
4. **Import extensions**: `.vue` always, `.ts` never
5. **Factory location**: `frontend/src/composables/factories/`
6. **items property names**: PRESERVE — `videos` for anime/cartoon/series/movie, `games` for games
7. **Pinia store IDs**: PRESERVE exactly — breaking change if changed
8. **Russian strings**: KEEP AS-IS in delete confirmation dialogs
9. **table-page-size localStorage key**: NOT changing to per-genre (not discussed with user)
10. **Cleanup scope**: FULL — factories + bugs + dead code + image.ts + router + localStorage + filter dedup + implicit any

## Pre-existing Issues (DO NOT FIX, NOT IN SCOPE)
- `frontend/vite.config.ts` LSP error (SCSS preprocessor options type mismatch) — pre-existing, ignore
