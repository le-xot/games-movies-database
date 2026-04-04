# Frontend Standardization & Unification

## TL;DR

> **Quick Summary**: Unify 5 near-identical media pages (anime, movie, cartoon, games, series) via 3 factory functions, fix all discovered bugs/typos, delete dead code, standardize patterns (localStorage keys, import extensions, filter components), and apply modern best practices across the frontend.
> 
> **Deliverables**:
> - 3 factory composables replacing 15 copy-paste files with thin wrappers
> - All bugs/typos fixed (filename, variable names, store IDs, isAdmin ref, image encoding)
> - Dead code removed, import extensions normalized
> - Router guard optimized, localStorage strategy improved
> - Filter components deduplicated via generic component
> - AGENTS.md updated with new conventions
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Bug fixes (Wave 1) -> Cleanup (Wave 2) -> Filter refactor (Wave 3a) + Factory migration (Wave 3b) -> Docs (Wave 4)

---

## Context

### Original Request
Standardize the entire frontend codebase to one consistent standard. Unify pages that follow similar patterns (anime, movie, games, cartoon, series). Apply modern best practices. Update AGENTS.md if conventions change.

### Interview Summary
**Key Discussions**:
- Factory pattern approved for 5 media pages (createParamsStore, createRecordsStore, createRecordsTableStore)
- defineModel confirmed as two-way binding standard (but audit revealed migration already complete for custom components)
- Per-genre localStorage keys for columnVisibility approved
- Full cleanup scope: factories + bugs + dead code + image.ts + router + localStorage + filter dedup + type fixes

**Research Findings**:
- 4 explore agents audited 13 page directories, 31 composables, 21 custom components, layout & lib
- 15 composable files across 5 pages are near-identical (differing only by genre enum, query key, column config, Russian delete titles)
- WebSocket composable tightly coupled — references specific refetch method names per store
- No test infrastructure exists — verification via TypeScript checking + lint + build
- cn() duplicated in 3 places (1 unused), filter toggle logic duplicated in 2 components
- Multiple bugs: filename typo, copy-paste variable, potentially broken isAdmin check, btoa on non-ASCII

### Metis Review
**Identified Gaps** (addressed):
- WebSocket contract preservation is critical — factories must expose exact same refetch method names
- defineModel migration can be SKIPPED (audit shows custom components already use it)
- localStorage.clear() in main.ts wipes loginReturnUrl mid-auth-flow — must use selective clearing
- table-page-size localStorage key is also shared — flagged but NOT changing (not discussed with user)
- Pinia store destructuring may auto-unwrap ComputedRef — isAdmin fix needs runtime verification
- Column visibility migration must run BEFORE useLocalStorage reads new keys
- Factory return property names (games vs videos vs items) need decision

---

## Work Objectives

### Core Objective
Eliminate code duplication across 5 media pages via factory functions, fix all discovered bugs, remove dead code, and standardize patterns to a single consistent convention.

### Concrete Deliverables
- `frontend/src/composables/factories/create-params-store.ts` — params factory
- `frontend/src/composables/factories/create-records-store.ts` — records data factory
- `frontend/src/composables/factories/create-table-store.ts` — table factory
- 15 thin wrapper composables (replacing 15 copy-paste files)
- Generic filter component `frontend/src/components/table/table-filter-generic.vue`
- Filter composable `frontend/src/components/table/composables/use-table-filter.ts`
- Bug fixes across 8+ files
- Updated AGENTS.md files

### Definition of Done
- [ ] `bun lint` passes with zero errors
- [ ] `bun build` succeeds
- [ ] `lsp_diagnostics` on `frontend/src/` shows no new errors (pre-existing vite.config.ts error excluded)
- [ ] All 5 media pages use factory-generated stores
- [ ] Zero references to old `columnsVisibility` key (non-prefixed)
- [ ] Zero references to `use-autions` (typo)
- [ ] Zero `.ts` extensions in import paths
- [ ] `frontend/src/lib/lib/utils.ts` does not exist

### Must Have
- Factory functions for media pages with exact WebSocket contract preservation
- All discovered bugs fixed
- Dead code removed
- Per-genre localStorage keys with migration
- Import extension standardization

### Must NOT Have (Guardrails)
- DO NOT touch `frontend/src/lib/api.ts` (auto-generated)
- DO NOT touch `frontend/src/components/ui/` (shadcn-generated)
- DO NOT refactor suggestion, auction, or queue pages into factories
- DO NOT add test infrastructure or test files
- DO NOT change Pinia store IDs (breaks HMR/devtools)
- DO NOT standardize returned items property names (keep `games`/`videos` per page for backward compat)
- DO NOT make `table-page-size` localStorage key per-genre (not discussed with user)
- DO NOT add i18n — keep Russian strings in delete confirmation dialogs as-is
- DO NOT refactor `use-websocket.ts` beyond import path updates and isAdmin fix
- DO NOT add loading spinners or skeleton screens
- DO NOT invent abstractions beyond the 3 factory functions + 1 generic filter
- DO NOT change composable function export names (useAnime, useMovie, etc. must stay)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (no test framework in project)
- **Framework**: N/A

### QA Policy
Every task MUST verify via:
1. `bun lint` — zero errors
2. `bun build` — successful compilation
3. `lsp_diagnostics` — no new TypeScript errors
4. Task-specific grep/search verification commands
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build verification**: Use Bash (`bun lint && bun build`)
- **Type checking**: Use `lsp_diagnostics` with `extension=".ts"` and `extension=".vue"`
- **Contract verification**: Use Bash (grep commands) to verify no stale references remain

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — independent bug fixes, MAX PARALLEL):
├── Task 1: Rename use-autions.ts → use-auctions.ts + fix store ID [quick]
├── Task 2: Fix series composable cartoonParams → seriesParams [quick]
├── Task 3: Fix isAdmin ref check in use-websocket.ts [quick]
├── Task 4: Fix image.ts btoa encoding for non-ASCII URLs [quick]
├── Task 5: Fix router guard — non-blocking for public routes [quick]
└── Task 6: Fix localStorage strategy (per-genre keys + selective clear + migration) [unspecified-high]

Wave 2 (After Wave 1 — cleanup, MAX PARALLEL):
├── Task 7: Delete dead code (lib/lib/utils.ts) + consolidate cn() [quick]
├── Task 8: Remove .ts extensions from all internal imports [quick]
└── Task 9: Fix implicit any types in all use-*-table.ts files [quick]

Wave 3 (After Wave 2 — refactoring, PARALLEL):
├── Task 10: Extract generic filter component + composable [unspecified-high]
└── Task 11: Create factory functions + convert all 5 media pages [deep]

Wave 4 (After Wave 3 — documentation):
└── Task 12: Update AGENTS.md files with new conventions [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Tasks 1-6 (parallel) → Tasks 7-9 (parallel) → Task 11 → Task 12 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 11 (factory needs correct filenames) |
| 2 | — | 11 (factory needs correct variable names) |
| 3 | — | 11 (WebSocket contract) |
| 4 | — | — |
| 5 | — | — |
| 6 | — | 11 (factory uses new localStorage keys) |
| 7 | — | — |
| 8 | — | 11 (factories should use correct import style) |
| 9 | — | 11 (factory will fix these types centrally) |
| 10 | — | — |
| 11 | 1,2,3,6,8,9 | 12 |
| 12 | 11 | — |
| F1-F4 | ALL | — |

### Agent Dispatch Summary

- **Wave 1**: **6** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `quick`, T5 → `quick`, T6 → `unspecified-high`
- **Wave 2**: **3** — T7 → `quick`, T8 → `quick`, T9 → `quick`
- **Wave 3**: **2** — T10 → `unspecified-high`, T11 → `deep`
- **Wave 4**: **1** — T12 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Rename use-autions.ts → use-auctions.ts and fix store ID

  **What to do**:
  - Rename file `frontend/src/pages/auction/composables/use-autions.ts` → `use-auctions.ts`
  - Update the Pinia store ID inside from `'queue/use-auction'` to `'auction/use-auction'`
  - Update ALL import paths that reference the old filename
  - Verify no references to old filename remain

  **Must NOT do**:
  - Do NOT change the exported function name `useAuctions` (it's already correct)
  - Do NOT refactor any auction logic beyond the rename and store ID fix

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file rename + import path updates, minimal logic change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: Task 11 (factory needs correct filenames)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/pages/auction/composables/use-autions.ts` — The file to rename. Note store ID `'queue/use-auction'` on line with `defineStore` — change to `'auction/use-auction'`
  - `frontend/src/pages/auction/auction.vue` — Imports useAuctions from the composable — update import path

  **API/Type References**:
  - `frontend/src/composables/use-websocket.ts` — May import from auction composable — check and update if needed

  **WHY Each Reference Matters**:
  - The auction.vue file is the primary consumer of this composable
  - use-websocket.ts may reference the auction store for refetch — verify import path

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify rename completed and no stale references
    Tool: Bash
    Preconditions: File renamed, imports updated
    Steps:
      1. Run: grep -rn 'use-autions' frontend/src/
      2. Assert: zero matches returned
      3. Run: ls frontend/src/pages/auction/composables/use-auctions.ts
      4. Assert: file exists
      5. Run: grep -n "defineStore" frontend/src/pages/auction/composables/use-auctions.ts
      6. Assert: contains 'auction/use-auction' (not 'queue/use-auction')
    Expected Result: Zero references to old filename, new file exists with correct store ID
    Failure Indicators: Any grep match for 'use-autions', missing file, or 'queue/' in store ID
    Evidence: .sisyphus/evidence/task-1-rename-verify.txt

  Scenario: Build succeeds after rename
    Tool: Bash
    Preconditions: All changes applied
    Steps:
      1. Run: bun lint
      2. Assert: exit code 0
      3. Run: bun build
      4. Assert: exit code 0
    Expected Result: Both commands succeed with zero errors
    Failure Indicators: Non-zero exit code, TypeScript errors about missing module
    Evidence: .sisyphus/evidence/task-1-build-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: rename use-autions.ts to use-auctions.ts and fix store ID`
  - Files: `frontend/src/pages/auction/composables/use-auctions.ts`, `frontend/src/pages/auction/auction.vue`, potentially `frontend/src/composables/use-websocket.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 2. Fix series composable cartoonParams → seriesParams

  **What to do**:
  - In `frontend/src/pages/series/composables/use-series.ts`: rename the destructured variable `cartoonParams` to `seriesParams` and update ALL references within the file
  - Check `use-series-params.ts` for the computed property name — it should export `seriesParams` (verify current name and rename if it says `cartoonParams`)
  - Search for any other copy-paste leftovers across series composables

  **Must NOT do**:
  - Do NOT change the composable function name `useSeries` or `useSeriesParams`
  - Do NOT refactor series logic beyond the variable rename

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple variable rename within 1-2 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: Task 11 (factory needs correct variable names)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/pages/series/composables/use-series.ts` — Contains `const { pagination, cartoonParams } = storeToRefs(useSeriesParams())` — rename `cartoonParams` to `seriesParams`
  - `frontend/src/pages/series/composables/use-series-params.ts` — Check the computed that produces the params object — verify its name matches what use-series.ts destructures

  **API/Type References**:
  - `frontend/src/pages/anime/composables/use-anime.ts` — Reference for correct pattern: uses `animeParams` variable name matching `useAnimeParams()` store

  **WHY Each Reference Matters**:
  - use-series.ts is the file with the bug — variable named after wrong genre
  - use-anime.ts shows the correct naming pattern to follow

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No cartoonParams references in series files
    Tool: Bash
    Preconditions: Variable renamed
    Steps:
      1. Run: grep -rn 'cartoonParams' frontend/src/pages/series/
      2. Assert: zero matches returned
      3. Run: grep -n 'seriesParams' frontend/src/pages/series/composables/use-series.ts
      4. Assert: at least 1 match found
    Expected Result: cartoonParams completely replaced with seriesParams in series directory
    Failure Indicators: Any remaining 'cartoonParams' reference
    Evidence: .sisyphus/evidence/task-2-rename-verify.txt

  Scenario: Build succeeds after rename
    Tool: Bash
    Preconditions: All changes applied
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: .sisyphus/evidence/task-2-build-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: resolve series composable naming bug (cartoonParams → seriesParams)`
  - Files: `frontend/src/pages/series/composables/use-series.ts`, potentially `frontend/src/pages/series/composables/use-series-params.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 3. Fix isAdmin ref check in use-websocket.ts

  **What to do**:
  - In `frontend/src/composables/use-websocket.ts`, find the `isAdmin` check (around line 37)
  - Investigate how `isAdmin` is obtained: `const { isAdmin } = useUser()` — determine if Pinia auto-unwraps the ComputedRef
  - If `isAdmin` is a ComputedRef (not auto-unwrapped), change `if (isAdmin)` to `if (isAdmin.value)`
  - If Pinia DOES auto-unwrap (making it a plain boolean), then `if (isAdmin)` is correct — document this finding and skip the change
  - Also type the `payload` parameter in the `on('update-records', (payload) => ...)` handler — add type `{ genre: string }` or appropriate type from api.ts

  **Must NOT do**:
  - Do NOT refactor the WebSocket handler logic
  - Do NOT change the WebSocket event names or handler structure
  - Do NOT add a registry/dispatch pattern — just fix the ref check

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, 1-2 line changes, but needs investigation of Pinia behavior
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: Task 11 (WebSocket contract)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/composables/use-websocket.ts:37` — The isAdmin check to investigate and potentially fix
  - `frontend/src/composables/use-user.ts` — Where `isAdmin` is defined — check if it's a `computed` (ComputedRef) or getter

  **External References**:
  - Pinia docs on store destructuring: when you do `const { computedProp } = useStore()`, Pinia returns the raw ref (NOT auto-unwrapped). You need `storeToRefs()` for reactivity OR access `.value`. However, if `isAdmin` is accessed directly from the store instance (not destructured), it IS auto-unwrapped.

  **WHY Each Reference Matters**:
  - use-websocket.ts contains the potentially broken check
  - use-user.ts defines isAdmin — need to verify if it's a computed getter or plain state
  - Pinia behavior determines if this is actually a bug

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: isAdmin check is correct (uses .value if needed)
    Tool: Bash
    Preconditions: File investigated and fixed if needed
    Steps:
      1. Run: grep -n 'isAdmin' frontend/src/composables/use-websocket.ts
      2. Assert: if destructured without storeToRefs, check uses .value; if using store instance directly, check is direct
      3. Run: bun lint && bun build
      4. Assert: exit code 0
    Expected Result: isAdmin check correctly accesses the boolean value, not the ref wrapper
    Failure Indicators: if (isAdmin) used on a ComputedRef without .value
    Evidence: .sisyphus/evidence/task-3-isadmin-verify.txt

  Scenario: payload parameter typed
    Tool: Bash
    Preconditions: Type added to payload
    Steps:
      1. Run: grep -n 'update-records' frontend/src/composables/use-websocket.ts
      2. Assert: payload parameter has explicit type annotation
    Expected Result: No implicit any on payload
    Evidence: .sisyphus/evidence/task-3-payload-type-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: correct isAdmin ref check in WebSocket composable`
  - Files: `frontend/src/composables/use-websocket.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 4. Fix image.ts btoa encoding for non-ASCII URLs

  **What to do**:
  - In `frontend/src/lib/utils/image.ts`, replace `btoa(originalUrl)` with a Unicode-safe encoding
  - Use `btoa(unescape(encodeURIComponent(originalUrl)))` for backward compatibility with backend `atob()` decoding
  - Add a try/catch fallback to `encodeURIComponent(originalUrl)` in case encoding still fails
  - Verify the backend `/api/img` endpoint expects base64 — check `backend/src/` for the image proxy handler to ensure encoding is symmetric

  **Must NOT do**:
  - Do NOT change the backend image proxy endpoint
  - Do NOT change the query parameter name (`urlEncoded`)
  - Do NOT add caching or other image optimization

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, small function change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/lib/utils/image.ts` — The file containing `getImageUrl()` with the broken `btoa()` call

  **API/Type References**:
  - `backend/src/modules/` — Search for image proxy handler to verify it uses `atob()` for decoding (ensures symmetric encoding)

  **WHY Each Reference Matters**:
  - image.ts is the file to fix
  - Backend handler verification ensures the fix doesn't break the proxy

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: image.ts uses Unicode-safe encoding
    Tool: Bash
    Preconditions: Encoding fixed
    Steps:
      1. Run: grep -n 'btoa' frontend/src/lib/utils/image.ts
      2. Assert: btoa call includes encodeURIComponent wrapper, NOT bare btoa(originalUrl)
      3. Run: grep -n 'try' frontend/src/lib/utils/image.ts
      4. Assert: try/catch exists for fallback
    Expected Result: btoa wrapped with encodeURIComponent for Unicode safety, with fallback
    Failure Indicators: Bare btoa(url) call without encoding wrapper
    Evidence: .sisyphus/evidence/task-4-encoding-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: .sisyphus/evidence/task-4-build-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: use encodeURIComponent in image.ts for non-ASCII URL support`
  - Files: `frontend/src/lib/utils/image.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 5. Fix router guard — non-blocking for public routes

  **What to do**:
  - In `frontend/src/lib/router/router.ts`, modify `router.beforeEach` to only `await fetchUser()` when `to.meta.requiresAuth || to.meta.requiresAdmin`
  - For public routes (no auth meta), call `fetchUser()` without await (fire-and-forget) if the store is not yet initialized
  - Preserve the `isInitialized` guard to prevent duplicate fetches
  - Preserve ALL existing auth redirect logic for protected routes

  **Must NOT do**:
  - Do NOT remove auth checks for protected routes
  - Do NOT add loading spinners or skeleton screens
  - Do NOT change route definitions or meta fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, small logic change in beforeEach
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/lib/router/router.ts:84-109` — The beforeEach guard containing the user fetch logic
  - `frontend/src/lib/router/router.ts` — Route definitions with `meta.requiresAuth` and `meta.requiresAdmin`

  **API/Type References**:
  - `frontend/src/composables/use-user.ts` — The `fetchUser()` method and `isInitialized` state

  **WHY Each Reference Matters**:
  - router.ts contains the guard to optimize
  - use-user.ts defines the fetch method and initialization flag

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Public routes don't await fetchUser
    Tool: Bash
    Preconditions: Guard modified
    Steps:
      1. Read router.ts beforeEach handler
      2. Assert: fetchUser() is only awaited inside a conditional checking requiresAuth/requiresAdmin
      3. Assert: non-protected routes call fetchUser() without await (or skip it)
      4. Run: bun lint && bun build
      5. Assert: exit code 0
    Expected Result: Protected routes still await user fetch, public routes proceed immediately
    Failure Indicators: Unconditional await fetchUser() for all routes
    Evidence: .sisyphus/evidence/task-5-router-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: make router guard non-blocking for public routes`
  - Files: `frontend/src/lib/router/router.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 6. Fix localStorage strategy — per-genre keys, selective clear, migration

  **What to do**:
  - In ALL 5 params stores (`use-anime-params.ts`, `use-cartoon-params.ts`, `use-movie-params.ts`, `use-games-params.ts`, `use-series-params.ts`): change `useLocalStorage('columnsVisibility', ...)` to `useLocalStorage('columnsVisibility:<genre>', ...)` where `<genre>` is `anime`, `cartoon`, `movie`, `games`, `series`
  - In `frontend/src/main.ts`: replace `localStorage.clear()` with selective removal of known app keys:
    - Remove: `columnsVisibility`, `columnsVisibility:anime`, `columnsVisibility:cartoon`, `columnsVisibility:movie`, `columnsVisibility:games`, `columnsVisibility:series`, `table-page-size`, `viewed-suggestions`, `suggestion-sort-by`
    - PRESERVE: `loginReturnUrl`, `bypassMaintenance`
  - In `frontend/src/main.ts`: add one-time migration BEFORE the version check — if old `columnsVisibility` key exists, copy its value to all 5 per-genre keys, then delete the old key
  - Ensure migration runs synchronously BEFORE Vue app mounts (before any `useLocalStorage` reads)

  **Must NOT do**:
  - Do NOT change `table-page-size` to per-genre (not discussed with user)
  - Do NOT add a UI for managing localStorage
  - Do NOT change the version bump logic (APP_VERSION check)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Touches 6 files, needs careful migration logic and ordering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 5)
  - **Blocks**: Task 11 (factory uses new localStorage keys)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/pages/anime/composables/use-anime-params.ts` — Example params store with `useLocalStorage('columnsVisibility', ...)` to change
  - `frontend/src/main.ts` — Contains `localStorage.clear()` and APP_VERSION logic

  **API/Type References**:
  - `@vueuse/core` `useLocalStorage` — Used by all params stores for reactive localStorage binding

  **WHY Each Reference Matters**:
  - All 5 params stores need key name changes
  - main.ts needs migration + selective clearing logic
  - useLocalStorage behavior determines migration ordering (must run before Vue mount)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No references to bare 'columnsVisibility' key
    Tool: Bash
    Preconditions: All keys migrated to per-genre
    Steps:
      1. Run: grep -rn "'columnsVisibility'" frontend/src/ | grep -v 'columnsVisibility:' | grep -v 'columnsVisibility,' 
      2. Assert: Only migration code in main.ts references the old key (for reading/deleting), not for writing
      3. Run: grep -rn "columnsVisibility:" frontend/src/pages/
      4. Assert: 5 matches (one per genre params store)
    Expected Result: Each params store uses its own genre-prefixed key
    Failure Indicators: Any params store still using bare 'columnsVisibility'
    Evidence: .sisyphus/evidence/task-6-keys-verify.txt

  Scenario: localStorage.clear() replaced with selective removal
    Tool: Bash
    Preconditions: main.ts updated
    Steps:
      1. Run: grep -n 'localStorage.clear' frontend/src/main.ts
      2. Assert: zero matches (no more nuclear clear)
      3. Run: grep -n 'localStorage.removeItem' frontend/src/main.ts
      4. Assert: selective removal present
    Expected Result: Selective key removal instead of full clear
    Failure Indicators: localStorage.clear() still present
    Evidence: .sisyphus/evidence/task-6-clear-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: .sisyphus/evidence/task-6-build-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: use per-genre localStorage keys for column visibility`
  - Files: 5 params stores + `frontend/src/main.ts`
  - Pre-commit: `bun lint && bun build`

- [ ] 7. Delete dead code — lib/lib/utils.ts + consolidate cn()

  **What to do**:
  - Delete `frontend/src/lib/lib/utils.ts` (duplicate cn() helper with zero imports)
  - Check if the parent directory `frontend/src/lib/lib/` is now empty — if so, delete it too
  - In `frontend/src/components/utils/value-updater.ts`: remove the duplicate `cn()` function definition; instead import cn from `@/lib/utils`
  - Verify `frontend/src/lib/utils.ts` is the single source of truth for `cn()`
  - Update AGENTS.md reference to lib/lib/utils.ts (remove the anti-pattern note since file will be gone)

  **Must NOT do**:
  - Do NOT delete `frontend/src/components/utils/value-updater.ts` entirely (it also exports `valueUpdater`)
  - Do NOT move `valueUpdater` — keep it in its current file

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Delete file, small edit in value-updater.ts
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9)
  - **Blocks**: None
  - **Blocked By**: None (Wave 1 tasks)

  **References**:

  **Pattern References**:
  - `frontend/src/lib/lib/utils.ts` — The file to delete (duplicate cn())
  - `frontend/src/lib/utils.ts` — The canonical cn() location (keep)
  - `frontend/src/components/utils/value-updater.ts` — Contains duplicate cn() + valueUpdater; remove cn() from here

  **WHY Each Reference Matters**:
  - lib/lib/utils.ts is confirmed unused (0 imports found by explore agent)
  - value-updater.ts has its own cn() that should import from the canonical location instead

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Duplicate files removed
    Tool: Bash
    Steps:
      1. Run: ls frontend/src/lib/lib/utils.ts 2>/dev/null
      2. Assert: file not found
      3. Run: grep -n 'function cn' frontend/src/components/utils/value-updater.ts
      4. Assert: zero matches (cn is now imported, not defined locally)
      5. Run: grep -n "import.*cn.*from.*@/lib/utils" frontend/src/components/utils/value-updater.ts
      6. Assert: cn is imported from @/lib/utils
    Expected Result: Single cn() definition in lib/utils.ts, imported everywhere else
    Evidence: .sisyphus/evidence/task-7-deadcode-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: No broken imports after deletion
    Evidence: .sisyphus/evidence/task-7-build-verify.txt
  ```

  **Commit**: YES
  - Message: `chore: delete unused lib/lib/utils.ts duplicate and consolidate cn()`
  - Files: delete `frontend/src/lib/lib/utils.ts`, edit `frontend/src/components/utils/value-updater.ts`
  - Pre-commit: `bun build`

- [ ] 8. Remove .ts extensions from all internal imports

  **What to do**:
  - Search ALL frontend source files (`.ts` and `.vue`) for imports using `.ts` extension: `from '@/...ts'` or `from '../...ts'` or `from './...ts'`
  - Remove the `.ts` extension from each import path
  - Do NOT touch `.vue` extensions (those must stay per project convention)
  - Do NOT touch imports from `node_modules` or external packages
  - Approximately 45 imports across ~27 files need updating

  **Must NOT do**:
  - Do NOT remove `.vue` extensions from Vue imports
  - Do NOT change any import logic, just remove the `.ts` suffix
  - Do NOT add extensions where none exist

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical search-and-replace across files, no logic changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9)
  - **Blocks**: Task 11 (factories should follow correct import style)
  - **Blocked By**: None (Wave 1 tasks)

  **References**:

  **Pattern References**:
  - `frontend/src/composables/use-websocket.ts` — Has 9 imports with `.ts` extensions (most in the project)
  - `frontend/src/pages/movie/components/movie-table.vue` — Example of import with `.ts` extension

  **WHY Each Reference Matters**:
  - use-websocket.ts is the file with the most .ts imports
  - Movie table shows the pattern in Vue SFCs

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No .ts extensions in imports
    Tool: Bash
    Steps:
      1. Run: grep -rn "from '.*\.ts'" frontend/src/ --include='*.ts' --include='*.vue' | grep -v node_modules | grep -v api.ts
      2. Assert: zero matches (excluding auto-generated api.ts references if any)
    Expected Result: All internal .ts imports use extensionless paths
    Failure Indicators: Any import with .ts extension
    Evidence: .sisyphus/evidence/task-8-extensions-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Vite resolves all imports correctly without .ts extensions
    Evidence: .sisyphus/evidence/task-8-build-verify.txt
  ```

  **Commit**: YES
  - Message: `chore: remove .ts extensions from internal imports`
  - Files: ~27 files across frontend/src/
  - Pre-commit: `bun lint && bun build`

- [ ] 9. Fix implicit any types in all use-*-table.ts files

  **What to do**:
  - In ALL 5 `use-*-table.ts` files, add explicit type annotations to `onUpdate` callback parameters:
    - `episode` parameter → `(episode: number)`
    - `userId` parameter → `(userId: number)`
    - `value` parameter → type based on column context: `(value: RecordStatus)`, `(value: RecordGrade)`, or `(value: string)` for title
  - Import necessary types from `@/lib/api` (RecordStatus, RecordGrade, etc.)
  - Files: `frontend/src/pages/anime/composables/use-anime-table.ts`, `frontend/src/pages/cartoon/composables/use-cartoon-table.ts`, `frontend/src/pages/series/composables/use-series-table.ts`, `frontend/src/pages/movie/composables/use-movie-table.ts`, `frontend/src/pages/games/composables/use-games-table.ts`

  **Must NOT do**:
  - Do NOT refactor the table logic, just add types
  - Do NOT change column definitions beyond adding types

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical type annotations across similar files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8)
  - **Blocks**: Task 11 (factory will centralize these types)
  - **Blocked By**: None (Wave 1 tasks)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/anime/composables/use-anime-table.ts` — Example file with implicit any errors at lines 59, 77, 91, 106, 124, 139
  - `frontend/src/pages/games/composables/use-games-table.ts` — Same pattern but without episode column (lines 57, 71, 86, 104, 119)

  **API/Type References**:
  - `frontend/src/lib/api.ts` — Exports `RecordStatus`, `RecordGrade`, `RecordEntity` types needed for annotations

  **WHY Each Reference Matters**:
  - All 5 table stores have the same implicit any errors (confirmed by LSP diagnostics)
  - api.ts provides the exact types to use

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No implicit any errors in table stores
    Tool: lsp_diagnostics
    Steps:
      1. Run lsp_diagnostics on frontend/src/pages/ with extension=".ts"
      2. Assert: zero "implicitly has an 'any' type" errors in use-*-table.ts files
    Expected Result: All callback parameters explicitly typed
    Failure Indicators: Any remaining implicit any diagnostic
    Evidence: .sisyphus/evidence/task-9-types-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Clean build with stricter types
    Evidence: .sisyphus/evidence/task-9-build-verify.txt
  ```

  **Commit**: YES
  - Message: `fix: add explicit types to table store callback parameters`
  - Files: 5 `use-*-table.ts` files
  - Pre-commit: `bun lint && bun build`

- [ ] 10. Extract shared filter toggle logic into generic component

  **What to do**:
  - Create `frontend/src/components/table/composables/use-table-filter.ts`:
    - Extract the `toggleItem(current, item)` and `resetFilter()` logic shared between status and grade filters
    - Export a composable `useTableFilter<T>(initialValue: T[] | null)` that returns `{ selected, toggle, reset }`
  - Create `frontend/src/components/table/table-filter-generic.vue`:
    - A generic dropdown filter component that accepts options as props
    - Props: `options: { label: string, value: T, variant?: string }[]`, `placeholder: string`
    - Slots or render function for custom option rendering (grade filter shows label column)
  - Refactor `table-filter-status.vue` to use the generic component + composable (thin wrapper)
  - Refactor `table-filter-grade.vue` to use the generic component + composable (thin wrapper)
  - Preserve the existing `@select` event behavior on `DropdownMenuItem`

  **Must NOT do**:
  - Do NOT change the external API of the filter components (they must still be usable the same way in table stores)
  - Do NOT touch shadcn UI components in components/ui/

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Creating new files + refactoring existing components, moderate complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 11)
  - **Blocks**: None
  - **Blocked By**: Wave 1, Wave 2

  **References**:

  **Pattern References**:
  - `frontend/src/components/table/table-filter-status.vue` — Current status filter with toggleStatus/resetFilter logic to extract
  - `frontend/src/components/table/table-filter-grade.vue` — Current grade filter with toggleGrade/resetFilter logic (nearly identical)
  - `frontend/src/components/table/composables/use-table-select.ts` — Provides the tag metadata (statusTags, gradeTags) used by both filters

  **WHY Each Reference Matters**:
  - Both filter files contain the duplicated toggle logic to extract
  - use-table-select provides the options data the filters consume

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New files created and old files refactored
    Tool: Bash
    Steps:
      1. Run: ls frontend/src/components/table/composables/use-table-filter.ts
      2. Assert: file exists
      3. Run: ls frontend/src/components/table/table-filter-generic.vue
      4. Assert: file exists
      5. Run: grep -c 'toggleStatus\|toggleGrade' frontend/src/components/table/table-filter-status.vue
      6. Assert: zero matches (logic moved to composable)
    Expected Result: Generic component + composable created, old filters are thin wrappers
    Evidence: .sisyphus/evidence/task-10-filter-verify.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
    Expected Result: Clean build with new generic components
    Evidence: .sisyphus/evidence/task-10-build-verify.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract shared filter toggle logic into generic component`
  - Files: new `use-table-filter.ts`, new `table-filter-generic.vue`, modified `table-filter-status.vue`, modified `table-filter-grade.vue`
  - Pre-commit: `bun lint && bun build`

- [ ] 11. Create factory functions + convert all 5 media pages

  **What to do**:
  - Create directory `frontend/src/composables/factories/`
  - Create `frontend/src/composables/factories/create-params-store.ts`:
    - Factory function that accepts config: `{ storeId: string, genre: RecordGenre, defaultColumnVisibility: VisibilityState }`
    - Returns a Pinia defineStore with: search, debouncedSearch, pagination (via usePagination), columnVisibility (via useLocalStorage with per-genre key), computed params, setGradeFilter, setStatusFilter
    - Follow exact pattern from `use-anime-params.ts` as reference implementation
  - Create `frontend/src/composables/factories/create-records-store.ts`:
    - Factory function that accepts config: `{ storeId: string, queryKey: string, paramsStoreFactory: () => ReturnType<typeof useXParams>, itemsName: string, refetchName: string, createName: string, updateName: string, deleteName: string }`
    - The `itemsName`, `refetchName`, etc. allow preserving per-page property names (`videos`/`games`, `refetchVideos`/`refetchGames`)
    - Returns a Pinia defineStore with: useQuery for records, useMutation for CRUD, computed totalRecords/totalPages
    - Follow exact pattern from `use-anime.ts` as reference implementation
  - Create `frontend/src/composables/factories/create-table-store.ts`:
    - Factory function that accepts config: `{ storeId: string, dataStore: ..., paramsStore: ..., hasEpisodeColumn: boolean, titleSizes: { admin: number, user: number }, episodeSize?: number, deleteConfirmTitle: string }`
    - Returns a Pinia defineStore with: tableColumns ColumnDef[] and useVueTable instance
    - All callback parameters must be explicitly typed (no implicit any)
    - Follow exact pattern from `use-anime-table.ts` as reference implementation
  - Convert ALL 5 media pages to use factories (ALL IN THE SAME COMMIT):
    - `use-anime-params.ts` → thin wrapper calling createParamsStore
    - `use-anime.ts` → thin wrapper calling createRecordsStore
    - `use-anime-table.ts` → thin wrapper calling createTableStore
    - Same for cartoon, movie, games, series
    - Each thin wrapper: ~5-15 lines, imports factory + passes config
    - MUST preserve exact exported function names (useAnime, useAnimeParams, useAnimeTable, etc.)
    - MUST preserve exact Pinia store IDs
    - MUST include `acceptHMRUpdate` for each wrapper store
  - Update `frontend/src/composables/use-websocket.ts` imports if any paths changed
  - Verify WebSocket contract: each factory-generated store MUST expose the same refetch method name as before:
    - anime/cartoon/series/movie: `refetchVideos`
    - games: `refetchGames`

  **Per-page factory config differences** (from Metis analysis):

  | Page | Genre | Query Key | Has Episode | Title Size (admin/user) | Episode Size | Delete Title | Items Name | Refetch Name |
  |------|-------|-----------|-------------|------------------------|--------------|--------------|------------|--------------|
  | anime | ANIME | 'anime' | YES | 45/50 | 10 | 'Удалить анимешку?' | videos | refetchVideos |
  | cartoon | CARTOON | 'cartoon' | YES | 47/52 | 8 | 'Удалить мультик?' | videos | refetchVideos |
  | series | SERIES | 'series' | YES | 47/52 | 8 | 'Удалить сирик?' | videos | refetchVideos |
  | movie | MOVIE | 'movie' | NO | 55/60 | — | 'Удалить кинчик?' | videos | refetchVideos |
  | games | GAME | 'games' | NO | 55/60 | — | 'Удалить игру?' | games | refetchGames |

  **Must NOT do**:
  - Do NOT change exported function names (useAnime, useMovie, etc.)
  - Do NOT change Pinia store IDs
  - Do NOT standardize items property names (keep `games`/`videos` per page)
  - Do NOT touch suggestion, auction, queue, or user stores
  - Do NOT refactor WebSocket beyond import path updates
  - Do NOT invent abstractions beyond the 3 factories

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Creates 3 new factory files + converts 15 existing files, high complexity, must preserve WebSocket contract, requires careful understanding of Pinia patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 10)
  - **Blocks**: Task 12 (docs need to reflect new pattern)
  - **Blocked By**: Tasks 1, 2, 3, 6, 8, 9

  **References**:

  **Pattern References**:
  - `frontend/src/pages/anime/composables/use-anime-params.ts` — Reference implementation for params factory (this is the "gold" pattern to extract)
  - `frontend/src/pages/anime/composables/use-anime.ts` — Reference implementation for records factory
  - `frontend/src/pages/anime/composables/use-anime-table.ts` — Reference implementation for table factory
  - `frontend/src/pages/games/composables/use-games.ts` — Shows different property names (`games` vs `videos`, `refetchGames` vs `refetchVideos`) that factory must handle
  - `frontend/src/composables/use-websocket.ts` — WebSocket handler that calls refetch methods — MUST remain compatible

  **API/Type References**:
  - `frontend/src/lib/api.ts` — RecordGenre enum, RecordEntity type, RecordStatus, RecordGrade types
  - `frontend/src/components/table/composables/use-pagination.ts` — usePagination used by params stores
  - `frontend/src/composables/use-record-create.ts` — useRecordCreate used by records stores
  - `frontend/src/composables/use-api.ts` — useApi used by records stores

  **External References**:
  - Pinia `defineStore` + `acceptHMRUpdate` pattern docs
  - @pinia/colada `useQuery`/`useMutation` API
  - @tanstack/vue-table `useVueTable` API

  **WHY Each Reference Matters**:
  - Anime composables are the cleanest "reference implementation" to base factories on
  - Games composable shows the naming differences the factory must accommodate
  - WebSocket is the critical contract — if refetch names don't match, real-time updates break silently
  - use-pagination and use-record-create are dependencies the factories must integrate with

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Factory files created
    Tool: Bash
    Steps:
      1. Run: ls frontend/src/composables/factories/
      2. Assert: contains create-params-store.ts, create-records-store.ts, create-table-store.ts
    Expected Result: All 3 factory files exist
    Evidence: .sisyphus/evidence/task-11-factories-exist.txt

  Scenario: All 15 wrapper files use factories
    Tool: Bash
    Steps:
      1. Run: grep -l 'createParamsStore\|createRecordsStore\|createTableStore' frontend/src/pages/*/composables/*.ts
      2. Assert: 15 files listed (3 per page × 5 pages)
      3. For each page (anime, cartoon, movie, games, series):
         Run: grep -c 'createParamsStore' frontend/src/pages/<page>/composables/use-<page>-params.ts
         Assert: >= 1 match
    Expected Result: All media page composables are thin wrappers calling factories
    Evidence: .sisyphus/evidence/task-11-wrappers-verify.txt

  Scenario: WebSocket contract preserved
    Tool: Bash
    Steps:
      1. Run: grep -n 'refetchVideos\|refetchGames\|refetchSuggestions\|refetchAuctions\|refetchQueue\|refetchUser' frontend/src/composables/use-websocket.ts
      2. For each refetch call, verify the target store exports that method:
         Run: grep -n 'refetchVideos\|refetchGames' frontend/src/pages/*/composables/use-*.ts
      3. Assert: each refetch method called in WebSocket exists as an export in the corresponding store
    Expected Result: All refetch methods are still accessible with the same names
    Failure Indicators: WebSocket calls a method that no longer exists on a store
    Evidence: .sisyphus/evidence/task-11-websocket-contract.txt

  Scenario: Pinia store IDs preserved
    Tool: Bash
    Steps:
      1. Run: grep -n "defineStore(" frontend/src/pages/*/composables/*.ts frontend/src/composables/factories/*.ts
      2. Assert: store IDs match original values (anime/use-anime, anime/use-anime-params, etc.)
    Expected Result: All store IDs unchanged from pre-refactor
    Failure Indicators: Changed store IDs break HMR and devtools
    Evidence: .sisyphus/evidence/task-11-store-ids.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun lint && bun build
      2. Assert: exit code 0
      3. Run lsp_diagnostics on frontend/src/ with extension=".ts"
      4. Assert: no new errors (pre-existing vite.config.ts error excluded)
    Expected Result: Clean build with factories
    Evidence: .sisyphus/evidence/task-11-build-verify.txt
  ```

  **Commit**: YES
  - Message: `refactor: create media page factory functions and convert all 5 pages`
  - Files: 3 new factory files + 15 modified wrapper files + potentially use-websocket.ts
  - Pre-commit: `bun lint && bun build`

- [ ] 12. Update AGENTS.md files with new conventions

  **What to do**:
  - Update `frontend/src/AGENTS.md`:
    - Add factory pattern documentation (location, usage)
    - Update import convention (`.vue` yes, `.ts` no)
    - Add per-genre localStorage key convention
    - Remove reference to `lib/lib/utils.ts` duplicate (it's deleted now)
    - Add note about defineModel as standard for two-way binding
    - Add note about generic filter component
  - Update root `AGENTS.md`:
    - Remove the `lib/lib/utils.ts` anti-pattern note
    - Update "WHERE TO LOOK" table if factory location is new
  - Review `backend/src/modules/AGENTS.md` and `backend/src/AGENTS.md` — no changes expected (backend not touched)

  **Must NOT do**:
  - Do NOT add speculative documentation about future features
  - Do NOT document the factory implementation details (just usage patterns)
  - Do NOT create new AGENTS.md files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation-only changes to existing files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after Wave 3)
  - **Blocks**: None
  - **Blocked By**: Task 11 (needs final file structure to document)

  **References**:

  **Pattern References**:
  - `frontend/src/AGENTS.md` — Current frontend conventions doc to update
  - `AGENTS.md` — Root project knowledge base to update

  **WHY Each Reference Matters**:
  - Both files need to reflect the new factory pattern and removed duplicates

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md files updated
    Tool: Bash
    Steps:
      1. Run: grep -c 'factory\|factories' frontend/src/AGENTS.md
      2. Assert: >= 1 match (factory pattern documented)
      3. Run: grep -c 'lib/lib/utils' AGENTS.md
      4. Assert: zero matches (duplicate reference removed)
      5. Run: grep -c 'lib/lib/utils' frontend/src/AGENTS.md
      6. Assert: zero matches
    Expected Result: New patterns documented, dead references removed
    Evidence: .sisyphus/evidence/task-12-docs-verify.txt
  ```

  **Commit**: YES
  - Message: `docs: update AGENTS.md with factory pattern and new conventions`
  - Files: `frontend/src/AGENTS.md`, `AGENTS.md`
  - Pre-commit: —

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for patterns). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun lint` + `bun build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Run `bun dev:frontend` and verify it starts without errors. Check browser console for runtime errors. Verify all 5 media pages load correctly (anime, movie, cartoon, games, series). Verify localStorage keys are genre-prefixed. Verify column visibility persists per-page.
  Output: `Dev Server [PASS/FAIL] | Pages [N/N load] | Console Errors [N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Commit | Message | Files | Pre-commit |
|--------|---------|-------|------------|
| 1 | `fix: rename use-autions.ts to use-auctions.ts and fix store ID` | auction composable + imports | `bun lint && bun build` |
| 2 | `fix: resolve series composable naming bug (cartoonParams → seriesParams)` | series composables | `bun lint && bun build` |
| 3 | `fix: correct isAdmin ref check in WebSocket composable` | use-websocket.ts | `bun lint && bun build` |
| 4 | `fix: use encodeURIComponent in image.ts for non-ASCII URL support` | image.ts | `bun lint && bun build` |
| 5 | `fix: make router guard non-blocking for public routes` | router.ts | `bun lint && bun build` |
| 6 | `fix: use per-genre localStorage keys for column visibility` | 5 params stores + main.ts | `bun lint && bun build` |
| 7 | `chore: delete unused lib/lib/utils.ts duplicate` | lib/lib/utils.ts | `bun build` |
| 8 | `chore: remove .ts extensions from internal imports` | ~27 files | `bun lint && bun build` |
| 9 | `fix: add explicit types to table store callback parameters` | 5 use-*-table.ts files | `bun lint && bun build` |
| 10 | `refactor: extract shared filter toggle logic into generic component` | table components | `bun lint && bun build` |
| 11 | `refactor: create media page factory functions and convert all 5 pages` | factories + 15 wrappers + websocket | `bun lint && bun build` |
| 12 | `docs: update AGENTS.md with factory pattern and new conventions` | AGENTS.md files | — |

---

## Success Criteria

### Verification Commands
```bash
bun lint                    # Expected: 0 errors
bun build                   # Expected: successful build
grep -rn 'use-autions' frontend/src/  # Expected: 0 matches
grep -rn "cartoonParams" frontend/src/pages/series/  # Expected: 0 matches
grep -rn "'columnsVisibility'" frontend/src/  # Expected: 0 matches (only prefixed keys)
grep -c "from '@/.*\.ts'" frontend/src/**/*.{ts,vue}  # Expected: 0 matches
ls frontend/src/lib/lib/utils.ts 2>/dev/null  # Expected: file not found
ls frontend/src/composables/factories/  # Expected: create-params-store.ts, create-records-store.ts, create-table-store.ts
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `bun lint` passes
- [ ] `bun build` succeeds
- [ ] All 5 media pages use factory stores
- [ ] WebSocket contract verified (refetch methods match)
- [ ] AGENTS.md reflects new patterns
