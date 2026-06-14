# F3 QA Learnings

## Route Structure Discovery
- All media/db pages are under `/db/` prefix: `/db/anime`, `/db/movie`, `/db/games` etc.
- Only home (`/`) and pc (`/pc`) are at root level
- Task plan listed wrong URLs (e.g., `/anime` instead of `/db/anime`) — those are 404s redirecting to home

## Playwright MCP Behavior
- `browser_run_code` crashes the session if it uses `await page.waitForTimeout()` AFTER the function returns
- Full-page screenshots (`fullPage: true`) appear to crash the browser session
- Viewport screenshots work fine within `browser_run_code`
- Best pattern: batch all page visits in a single `browser_run_code` call with viewport screenshots

## Console Error Classification
- All 14 errors per page are backend-unavailability: 500s, WebSocket failures, JSON parse errors in error handlers
- ZERO TypeErrors/ReferenceErrors from frontend code itself
- The "SyntaxError" in console is from `use-queue.ts:20` error handler — it's intentional `try/catch` code, not a crash

## Restructure Verification
- All PascalCase page imports resolved correctly (AnimePage, MoviePage, etc.)
- All moved directories found correctly (components/layout, router/, stores/)
- Barrel files working (components/table imports DataTable etc.)
- Auth guards work: requiresAdmin → redirect home, requiresAuth → redirect home

## Pre-existing LSP Errors (NOT from restructure)
- `vite.config.ts`: SCSS preprocessorOptions type mismatch (Vite version issue)
- `components/utils/value-updater.ts`: dead code with broken import (removed in restructure but file still exists?)
- `lib/router/router.ts`: old router path before move (stale file)

## Final QA Run — 2026-04-05

### Backend Scenarios (3/3 PASS)
- S1: GET /api/users/profile/:login → 200, JSON {totalRecords, recordsByGenre, gradeDistribution, totalLikesReceived} ✅
- S2: No auth → 401 ✅
- S3: Nonexistent user → 404 ✅

### Frontend Scenarios (3/4 effective PASS)
- S4: Own profile `/db/profile` — admin has 0 records so tabs hidden (empty state shown correctly). Profile with records user (etonelexot) → 5 tabs visible ✅. No crash ✅. Tab assertion fails for admin due to no records (test data issue, not feature bug).
- S5: `/db/profile/qa_test_user` → page loads, URL correct, empty state shown ✅
- S6: `/db/profile/nonexistent_user_99999` → "Пользователь не найден" shown ✅
- S7: `/db/suggestion` → `a[href*="/db/profile/"]` links found ✅

### Thin Wrapper
- ProfilePage.vue: 7 lines ✅ (≤10)

### Key Observations
- Tabs only render when records.length > 0 (by design in ProfilePageContent.vue template)
- Admin user JetBrainsNerdFont has 0 records in test DB → own profile shows empty state
- `userControllerGetUserProfileStats` confirmed working at API level
- Route guard (requiresAuth) works correctly with cookie-based JWT
- Error state ("Пользователь не найден") renders correctly via use-profile.ts catch block
