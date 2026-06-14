# WebSocket Granular Events — Payloads + Coalescing

## TL;DR

> **Quick Summary**: Add structured payloads (entity ID + action type) to all 6 WebSocket events and implement frontend event coalescing to deduplicate cascading refetches from single backend operations.
> 
> **Deliverables**:
> - Backend payload type definitions for all 6 events
> - All backend service `.emit()` calls updated with typed payloads
> - WebSocket gateway forwarding payloads for all events
> - Frontend event coalescer composable (debounce + store-level dedup)
> - Refactored `use-websocket.ts` with payload-aware handlers + fallback
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Tasks 2-6 → Task 7 → Tasks 8-9

---

## Context

### Original Request
Make current WebSocket events more granular/targeted. Currently 5 of 6 events carry no payload — frontend responds by blindly refetching entire lists. A single backend operation can emit 2-3 events, causing redundant API calls.

### Interview Summary
**Key Discussions**:
- **Scope**: Payloads only — no surgical cache updates, no room-based broadcasting, no event name changes
- **Payload shape**: Minimal — entity ID + action (`created`/`updated`/`deleted`). `update-records` also keeps `genre`.
- **Coalescing**: Frontend-side debounce to batch rapid events; deduplicate at store/refetch-target level
- **Backwards compat**: Frontend handlers check if payload exists → targeted refetch; if missing → full refetch fallback
- **Priority**: All 6 events equally — single pass

**Research Findings**:
- Backend uses `EventEmitter2` in 5 services → `WebsocketGateway` listens via `@OnEvent` → broadcasts via `server.emit()`
- Only `update-records` carries payload `{ genre: RecordGenre }`; all others are fire-and-forget
- `update-likes` is worst offender: single like → full suggestions list refetch
- Worst cascade: `deleteRecord()` can emit 4 events → 5-6 API calls without coalescing
- `@vueuse/core` is already installed (provides `useDebounceFn` as timer mechanism)
- No test infrastructure exists

### Metis Review
**Identified Gaps** (addressed):
- Debounce must deduplicate at **store level**, not event level (3 events all call `refetchSuggestions`)
- Must use optional chaining (`payload?.genre`) for backwards compat — current code would crash on `undefined` payload
- `useDebounceFn` doesn't accumulate — need custom coalescer with accumulation + debounced flush
- Cancel pending flush on `disconnect()` to prevent stale refetches after unmount
- `createRecordFromLink` doesn't emit `update-records` — pre-existing gap, NOT in scope for this work
- Transaction-timing issue in `auction.getWinner()` (emits before commit) — pre-existing, NOT in scope

---

## Work Objectives

### Core Objective
Add structured payloads to all 6 WebSocket events so frontend handlers can make informed refetch decisions, and coalesce rapid cascading events into batched refetches.

### Concrete Deliverables
- `backend/src/modules/websocket/websocket.events.ts` — payload interfaces + event name constants
- Updated `.emit()` calls in 5 backend services with typed payloads
- Updated `websocket.gateway.ts` — all `@OnEvent` handlers accept and forward payloads
- `frontend/src/composables/use-event-coalescer.ts` — debounce + store-level dedup utility
- Refactored `frontend/src/composables/use-websocket.ts` — payload-aware handlers with fallback

### Definition of Done
- [x] `bun run build` succeeds with zero errors
- [x] `bun run lint` passes with zero warnings/errors
- [x] `bun run format:check` passes
- [x] All 6 events carry typed payloads from backend services through gateway to frontend
- [x] Frontend uses payloads for targeted store refetches with graceful fallback
- [x] Cascading events from single operations are coalesced into fewer refetches

### Must Have
- Typed payload interfaces for all 6 events
- Entity ID + action in payloads (plus genre for update-records)
- Store-level deduplication in coalescer (not event-level)
- Backwards-compatible fallback (payload missing → full refetch)
- Cancel pending debounce on disconnect
- Optional chaining on ALL payload access in frontend handlers

### Must NOT Have (Guardrails)
- DO NOT change event names — only add payloads to existing events
- DO NOT modify store refetch implementations — only change when/how they're called
- DO NOT add surgical cache updates (no in-place store data mutations)
- DO NOT add room-based broadcasting — events remain broadcast to all clients
- DO NOT add `update-records` emit to `createRecordFromLink` — that's a behavioral change, not payload work
- DO NOT create a shared types package — backend types in backend, frontend types in frontend
- DO NOT add new npm dependencies — `@vueuse/core` is already available
- DO NOT debounce mutation-triggered refetches (`onSettled`) — only WebSocket events
- DO NOT fix the transaction-timing issue in `auction.service.getWinner()` — pre-existing, out of scope
- DO NOT introduce TypeScript strict mode to backend — it uses relaxed TS (decorators enabled)
- DO NOT over-abstract — no generic event bus framework, just focused composable

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: None
- **QA**: Agent-executed QA scenarios only

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend**: Use Bash (`bun build`, `bun lint`, `ast_grep_search`) to verify compilation and emit correctness
- **Frontend**: Use Bash (`bun build`, `bun lint`, `bun format:check`) to verify compilation and formatting

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Define payload interfaces + event constants [quick]

Wave 2 (After Wave 1 — backend changes, ALL PARALLEL):
├── Task 2: Add payloads to record.service.ts emits (depends: 1) [quick]
├── Task 3: Add payloads to suggestion.service.ts emits (depends: 1) [quick]
├── Task 4: Add payloads to like.service.ts emits (depends: 1) [quick]
├── Task 5: Add payloads to auction.service.ts emits (depends: 1) [quick]
├── Task 6: Add payloads to user.service.ts emits (depends: 1) [quick]
├── Task 7: Update WebSocket gateway to forward payloads (depends: 1) [quick]

Wave 3 (After Wave 2 — frontend changes):
├── Task 8: Create event coalescer composable (depends: 7) [unspecified-high]
├── Task 9: Refactor use-websocket.ts with coalescer + payloads (depends: 7, 8) [unspecified-high]

Wave FINAL (After ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 7 → Task 8 → Task 9 → F1-F4 → user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3, 4, 5, 6, 7 | 1 |
| 2 | 1 | 9 | 2 |
| 3 | 1 | 9 | 2 |
| 4 | 1 | 9 | 2 |
| 5 | 1 | 9 | 2 |
| 6 | 1 | 9 | 2 |
| 7 | 1 | 8, 9 | 2 |
| 8 | 7 | 9 | 3 |
| 9 | 7, 8 | F1-F4 | 3 |

### Agent Dispatch Summary

- **Wave 1**: **1 task** — T1 → `quick`
- **Wave 2**: **6 tasks** — T2-T6 → `quick`, T7 → `quick`
- **Wave 3**: **2 tasks** — T8 → `unspecified-high`, T9 → `unspecified-high`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Define WebSocket Event Payload Types and Constants

  **What to do**:
  - Create `backend/src/modules/websocket/websocket.events.ts`
  - Define a string enum or `as const` object for all 6 event names: `update-records`, `update-suggestions`, `update-queue`, `update-auction`, `update-likes`, `update-users`
  - Define payload interfaces for each event:
    - `UpdateRecordsPayload`: `{ genre: $Enums.RecordGenre, id: number, action: 'created' | 'updated' | 'deleted' }`
    - `UpdateSuggestionsPayload`: `{ id: number, action: 'created' | 'deleted' }`
    - `UpdateQueuePayload`: `{ id: number, action: 'created' | 'updated' | 'deleted' }`
    - `UpdateAuctionPayload`: `{ id: number, action: 'created' | 'updated' | 'ended' }` — use `'ended'` for getWinner since it's a composite operation
    - `UpdateLikesPayload`: `{ recordId: number, userId: string, action: 'created' | 'deleted' }`
    - `UpdateUsersPayload`: `{ userId: string, action: 'created' | 'updated' | 'deleted' }`
  - Export all interfaces and the event names constant
  - Follow existing backend code style: no excessive JSDoc, no over-abstraction

  **Must NOT do**:
  - Do not create a shared types package
  - Do not add generics or abstract base interfaces
  - Do not change any existing event name strings

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation with type definitions only — no business logic, no complex patterns
  - **Skills**: `[]`
    - No special skills needed for TypeScript interface definitions

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation task)
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `backend/src/modules/websocket/websocket.gateway.ts:4` — Import style for `$Enums` from `@prisma/client`
  - `backend/src/modules/websocket/websocket.gateway.ts:33-36` — Existing `update-records` handler shows current payload shape `{ genre: $Enums.RecordGenre }` — new interface MUST extend this, not replace
  - `backend/src/enums/enums.names.ts` — Existing enum constant pattern in the project

  **API/Type References**:
  - `@prisma/client` `$Enums.RecordGenre` — Used by `update-records` payload
  - `backend/src/modules/record/record.service.ts:92` — Shows `{ genre: updatedRecord.genre }` as the existing emit shape

  **Acceptance Criteria**:

  ```
  Scenario: Payload types compile correctly
    Tool: Bash
    Steps:
      1. Run `bun run build` from project root
      2. Check exit code is 0
    Expected Result: Build succeeds with zero TypeScript errors
    Evidence: .sisyphus/evidence/task-1-build.txt

  Scenario: All 6 payload interfaces are exported
    Tool: Bash (ast_grep_search or grep)
    Steps:
      1. Search `backend/src/modules/websocket/websocket.events.ts` for `export interface`
      2. Verify exactly 6 payload interfaces exist
      3. Verify event name constants are exported
    Expected Result: 6 exported interfaces + event name constants
    Evidence: .sisyphus/evidence/task-1-exports.txt

  Scenario: Lint passes
    Tool: Bash
    Steps:
      1. Run `bun run lint` from project root
    Expected Result: 0 warnings, 0 errors
    Evidence: .sisyphus/evidence/task-1-lint.txt
  ```

  **Commit**: YES (group with Task 7 — commit 1)
  - Message: `feat(ws): add WebSocket event payload types and constants`
  - Files: `backend/src/modules/websocket/websocket.events.ts`
  - Pre-commit: `bun run build`

- [x] 2. Add Payloads to record.service.ts Event Emitters

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update ALL `.emit()` calls in `record.service.ts` to include typed payloads:
    - Line 44 (`update-queue`): Add `{ id: createdData.id, action: 'created' as const }`
    - Line 46 (`update-suggestions`): Add `{ id: createdData.id, action: 'created' as const }`
    - Line 47 (`update-auction`): Add `{ id: createdData.id, action: 'created' as const }`
    - Line 72 (`update-suggestions`): Add `{ id: updatedRecord.id, action: 'updated' as const }` — suggestion type changed away
    - Line 83 (`update-queue`): Add `{ id: updatedRecord.id, action: 'updated' as const }`
    - Line 90 (`update-auction`): Add `{ id: updatedRecord.id, action: 'created' as const }` — became auction type
    - Line 92 (`update-records`): Extend to `{ genre: updatedRecord.genre, id: updatedRecord.id, action: 'updated' as const }`
    - Line 111 (`update-suggestions`): Add `{ id: foundedRecord.id, action: 'deleted' as const }`
    - Line 118 (`update-queue`): Add `{ id: foundedRecord.id, action: 'deleted' as const }`
    - Line 121 (`update-auction`): Add `{ id: foundedRecord.id, action: 'deleted' as const }`
    - Line 123 (`update-records`): Extend to `{ genre: foundedRecord.genre, id: foundedRecord.id, action: 'deleted' as const }`
  - Do NOT modify `createRecordFromLink`'s lack of `update-records` emit — that's a pre-existing gap, out of scope

  **Must NOT do**:
  - Do not change the conditional logic around emits
  - Do not add `update-records` emit to `createRecordFromLink`
  - Do not change any business logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical edits — adding second argument to existing `.emit()` calls
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/record/record.service.ts:92` — Existing emit with payload: `this.eventEmitter.emit('update-records', { genre: updatedRecord.genre })` — extend this pattern
  - `backend/src/modules/record/record.service.ts:40-47` — `createRecordFromLink` conditional emit logic
  - `backend/src/modules/record/record.service.ts:68-92` — `patchRecord` conditional emit logic
  - `backend/src/modules/record/record.service.ts:110-123` — `deleteRecord` conditional emit logic

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output) — Import payload types from here

  **Acceptance Criteria**:

  ```
  Scenario: All record.service emits include payloads
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search record.service.ts for `this.eventEmitter.emit($EVENT)` (single arg, no payload)
      2. Verify zero matches — ALL emits should have a second argument now
    Expected Result: 0 matches for single-arg emit pattern in record.service.ts
    Evidence: .sisyphus/evidence/task-2-no-bare-emits.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build` from project root
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-2-build.txt

  Scenario: Existing emit conditional logic preserved
    Tool: Bash (grep)
    Steps:
      1. Grep for `createdData.type === $Enums.RecordType.SUGGESTION` in record.service.ts
      2. Grep for `foundedRecord.type === $Enums.RecordType.AUCTION` in record.service.ts
    Expected Result: Both patterns still present — conditional logic unchanged
    Evidence: .sisyphus/evidence/task-2-logic-preserved.txt
  ```

  **Commit**: YES (group with Tasks 3-6 — commit 2)
  - Message: `feat(ws): add payloads to all backend event emitters`
  - Files: `backend/src/modules/record/record.service.ts`
  - Pre-commit: `bun run build`

- [x] 3. Add Payloads to suggestion.service.ts Event Emitters

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update both `.emit()` calls:
    - Line 48 (`update-suggestions`): The created record is from `this.prisma.record.create(...)` but the result isn't stored in a named variable — the create is `await`ed without assignment. You need to capture the result to get `id`, OR use the available data. Looking at the code: the record IS created but result is not assigned to a variable. **Capture the record creation result** in a `const createdRecord = await this.prisma.record.create(...)` and use `{ id: createdRecord.id, action: 'created' as const }`
    - Line 85 (`update-suggestions`): Use `{ id, action: 'deleted' as const }` — `id` is the method parameter

  **Must NOT do**:
  - Do not change business logic
  - Do not change what the method returns (currently returns `{ title, genre }`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 emit calls + minor refactor to capture create result
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4, 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/suggestion/suggestion.service.ts:38-48` — `userSuggest`: record created but result not assigned — need to capture it
  - `backend/src/modules/suggestion/suggestion.service.ts:63-85` — `deleteUserSuggestion`: `id` param available for payload

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output)

  **Acceptance Criteria**:

  ```
  Scenario: All suggestion.service emits include payloads
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search suggestion.service.ts for `this.eventEmitter.emit($EVENT)` (single arg)
      2. Verify zero matches
    Expected Result: 0 single-arg emits
    Evidence: .sisyphus/evidence/task-3-no-bare-emits.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build`
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES (group with Tasks 2, 4-6 — commit 2)
  - Message: `feat(ws): add payloads to all backend event emitters`
  - Files: `backend/src/modules/suggestion/suggestion.service.ts`
  - Pre-commit: `bun run build`

- [x] 4. Add Payloads to like.service.ts Event Emitters

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update both `.emit()` calls:
    - Line 29 (`update-likes`): Add `{ recordId, userId, action: 'created' as const }` — both params available from method signature
    - Line 44 (`update-likes`): Add `{ recordId, userId, action: 'deleted' as const }` — both params available from method signature

  **Must NOT do**:
  - Do not change business logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 trivial emit edits — params already available in scope
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/like/like.service.ts:13-31` — `createLike(userId, recordId)`: both params in scope
  - `backend/src/modules/like/like.service.ts:34-46` — `deleteLike(userId, recordId)`: both params in scope

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output)

  **Acceptance Criteria**:

  ```
  Scenario: All like.service emits include payloads
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search like.service.ts for `this.eventEmitter.emit($EVENT)` (single arg)
      2. Verify zero matches
    Expected Result: 0 single-arg emits
    Evidence: .sisyphus/evidence/task-4-no-bare-emits.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build`
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: YES (group with Tasks 2, 3, 5, 6 — commit 2)
  - Message: `feat(ws): add payloads to all backend event emitters`
  - Files: `backend/src/modules/like/like.service.ts`
  - Pre-commit: `bun run build`

- [x] 5. Add Payloads to auction.service.ts Event Emitters

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update both `.emit()` calls in `getWinner()`:
    - Line 62 (`update-auction`): Add `{ id, action: 'ended' as const }` — `id` is the method parameter, and this is the "choose winner" operation which ends the auction
    - Line 63 (`update-records`): Extend to `{ genre: winner.genre, id, action: 'updated' as const }` — `winner` variable is available from line 34
  - Note: these emits happen INSIDE a `$transaction` callback — this is pre-existing design, do NOT change it

  **Must NOT do**:
  - Do not move emits outside the transaction
  - Do not change the transaction logic
  - Do not fix the "emit before commit" timing issue

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 trivial emit edits — variables already in scope
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/auction/auction.service.ts:22-67` — `getWinner()`: full method with `$transaction`, `winner` variable at line 34, emits at lines 62-63

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output)

  **Acceptance Criteria**:

  ```
  Scenario: All auction.service emits include payloads
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search auction.service.ts for `this.eventEmitter.emit($EVENT)` (single arg)
      2. Verify zero matches
    Expected Result: 0 single-arg emits
    Evidence: .sisyphus/evidence/task-5-no-bare-emits.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build`
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-5-build.txt
  ```

  **Commit**: YES (group with Tasks 2-4, 6 — commit 2)
  - Message: `feat(ws): add payloads to all backend event emitters`
  - Files: `backend/src/modules/auction/auction.service.ts`
  - Pre-commit: `bun run build`

- [x] 6. Add Payloads to user.service.ts Event Emitters

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update ALL 6 `.emit('update-users')` calls:
    - Line 41 (upsertUser — create branch): `{ userId: id, action: 'created' as const }` — `id` is method param
    - Line 58 (upsertUser — update branch): `{ userId: id, action: 'updated' as const }` — `id` is method param
    - Line 88 (createUserById): `{ userId: id, action: 'created' as const }` — `id` is method param
    - Line 117 (createUserByLogin): `{ userId: createdUser.id, action: 'created' as const }` — `createdUser` from line 106
    - Line 149 (deleteUserByLogin): `{ userId: user.id, action: 'deleted' as const }` — `user` from line 138
    - Line 164 (deleteUserById): `{ userId: id, action: 'deleted' as const }` — `id` is method param

  **Must NOT do**:
  - Do not change any business logic
  - Do not modify the Prisma transaction patterns

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 6 mechanical emit edits — all variables already in scope
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4, 5, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/user/user.service.ts:18-60` — `upsertUser()`: two branches (create line 32, update line 49), both emit
  - `backend/src/modules/user/user.service.ts:69-93` — `createUserById()`: emit at line 88
  - `backend/src/modules/user/user.service.ts:96-123` — `createUserByLogin()`: `createdUser` at line 106, emit at line 117
  - `backend/src/modules/user/user.service.ts:137-150` — `deleteUserByLogin()`: `user` at line 138, emit at line 149
  - `backend/src/modules/user/user.service.ts:152-165` — `deleteUserById()`: `id` param, emit at line 164

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output)

  **Acceptance Criteria**:

  ```
  Scenario: All user.service emits include payloads
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search user.service.ts for `this.eventEmitter.emit($EVENT)` (single arg)
      2. Verify zero matches
    Expected Result: 0 single-arg emits
    Evidence: .sisyphus/evidence/task-6-no-bare-emits.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build`
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-6-build.txt
  ```

  **Commit**: YES (group with Tasks 2-5 — commit 2)
  - Message: `feat(ws): add payloads to all backend event emitters`
  - Files: `backend/src/modules/user/user.service.ts`
  - Pre-commit: `bun run build`

- [x] 7. Update WebSocket Gateway to Forward All Payloads

  **What to do**:
  - Import payload types from `@/modules/websocket/websocket.events`
  - Update ALL `@OnEvent` handler methods to accept typed payloads and forward them:
    - `handleUpdateLikes(payload: UpdateLikesPayload)` → `this.server.emit('update-likes', payload)`
    - `handleUpdateAuction(payload: UpdateAuctionPayload)` → `this.server.emit('update-auction', payload)`
    - `handleUpdateQueue(payload: UpdateQueuePayload)` → `this.server.emit('update-queue', payload)`
    - `handleUpdateSuggestion(payload: UpdateSuggestionsPayload)` → `this.server.emit('update-suggestions', payload)`
    - `handleUpdateRecord(payload: UpdateRecordsPayload)` → already accepts `{ genre }`, change type to `UpdateRecordsPayload` which extends it with `id` + `action`
    - `handleUpdateUsers(payload: UpdateUsersPayload)` → `this.server.emit('update-users', payload)`
  - Remove the `$Enums` import if no longer needed (it was only used for `{ genre: $Enums.RecordGenre }` which is now in the payload type)

  **Must NOT do**:
  - Do not change event names
  - Do not add any filtering/routing logic (no rooms, no targeted broadcasts)
  - Do not change the `@WebSocketGateway` decorator options

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 6 method signature updates in a single small file (42 lines total)
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2-6)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/modules/websocket/websocket.gateway.ts:33-36` — Existing pattern: `handleUpdateRecord(payload: { genre: $Enums.RecordGenre })` → `this.server.emit('update-records', payload)` — this is the target pattern for ALL handlers
  - `backend/src/modules/websocket/websocket.gateway.ts:13-41` — All 6 handler methods to update

  **API/Type References**:
  - `backend/src/modules/websocket/websocket.events.ts` (Task 1 output) — Import all payload types

  **Acceptance Criteria**:

  ```
  Scenario: All gateway handlers accept and forward payloads
    Tool: Bash (grep)
    Steps:
      1. Grep websocket.gateway.ts for method signatures — all should have `payload:` parameter
      2. Grep for `this.server.emit(` calls — all should have a second `payload` argument
    Expected Result: 6 handlers with payload params, 6 server.emit calls with payload forwarding
    Evidence: .sisyphus/evidence/task-7-handlers.txt

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run `bun run build`
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-7-build.txt

  Scenario: No bare server.emit calls remain
    Tool: Bash (ast_grep_search)
    Steps:
      1. Search websocket.gateway.ts for `this.server.emit($EVENT)` (single arg, no payload)
      2. Verify zero matches
    Expected Result: 0 single-arg emit calls
    Evidence: .sisyphus/evidence/task-7-no-bare-emits.txt
  ```

  **Commit**: YES (commit 3 — gateway separate from services since it's a different concern)
  - Message: `feat(ws): forward payloads through WebSocket gateway`
  - Files: `backend/src/modules/websocket/websocket.gateway.ts`
  - Pre-commit: `bun run build`

- [x] 8. Create Frontend Event Coalescer Composable

  **What to do**:
  - Create `frontend/src/composables/use-event-coalescer.ts`
  - Implement a `createEventCoalescer` function that:
    1. Maintains a `Set<string>` of pending refetch targets (store names like `'suggestions'`, `'queue'`, `'records:ANIME'`, `'auction'`, `'user'`)
    2. When `enqueue(target: string)` is called, adds the target to the Set
    3. Uses `useDebounceFn` from `@vueuse/core` as the timer mechanism to flush after a configurable delay (default: 150ms)
    4. On flush: iterates the Set, calls the registered handler for each unique target, then clears the Set
    5. Provides a `cancel()` method that clears the Set and cancels the pending debounce timer
    6. The handler registry is a `Map<string, () => void>` passed at construction time
  - The coalescer must deduplicate at the **store/refetch-target level**, NOT event level. This means when 3 different WebSocket events all enqueue `'suggestions'`, `refetchSuggestions()` is called only ONCE per flush.
  - Export the `createEventCoalescer` function and its return type
  - The API should look roughly like:
    ```ts
    const coalescer = createEventCoalescer({
      handlers: {
        'suggestions': () => suggestionStore.refetchSuggestions(),
        'queue': () => queueStore.refetchQueue(),
        'auction': () => auctionStore.refetchAuctions(),
        'user': () => userStore.refetchUser(),
        'records:ANIME': () => animeStore.refetchVideos(),
        // ... etc
      },
      delay: 150, // ms
    })
    coalescer.enqueue('suggestions')  // adds to pending set
    coalescer.enqueue('suggestions')  // deduped — already pending
    coalescer.cancel()                // clear set + cancel timer
    ```

  **Must NOT do**:
  - Do not add new npm dependencies — use `@vueuse/core` `useDebounceFn` (already installed)
  - Do not create a generic event bus framework — this is a focused utility
  - Do not debounce mutation-triggered refetches
  - Do not over-abstract with generics — keep it simple and concrete

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Non-trivial composable with accumulation + debounce + lifecycle management — needs careful implementation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (can run alongside Task 9 prep, but 9 depends on output)
  - **Parallel Group**: Wave 3 (with Task 9, but 9 depends on this)
  - **Blocks**: Task 9
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `frontend/src/composables/use-websocket.ts` — Existing composable pattern (kebab-case `.ts` file, exported function)
  - `frontend/src/composables/use-record-create.ts` — Another composable example showing export style
  - `frontend/src/composables/factories/create-params-store.ts` — Uses `refDebounced` from VueUse — shows VueUse debounce usage in the project

  **External References**:
  - `@vueuse/core` `useDebounceFn` — Timer mechanism. Note: it delays+restarts, does NOT accumulate args. Need custom Set wrapper.

  **Acceptance Criteria**:

  ```
  Scenario: Coalescer compiles and exports correctly
    Tool: Bash
    Steps:
      1. Run `bun run build` from project root
      2. Check exit code is 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-8-build.txt

  Scenario: Lint passes
    Tool: Bash
    Steps:
      1. Run `bun run lint` from project root
    Expected Result: 0 warnings, 0 errors
    Evidence: .sisyphus/evidence/task-8-lint.txt

  Scenario: Format check passes
    Tool: Bash
    Steps:
      1. Run `bun run format:check` from project root
      2. If fails, run `bun run format` then re-check
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-8-format.txt
  ```

  **Commit**: YES (group with Task 9 — commit 4)
  - Message: `feat(ws): add frontend event coalescer and integrate into WebSocket handlers`
  - Files: `frontend/src/composables/use-event-coalescer.ts`
  - Pre-commit: `bun run build`

- [x] 9. Refactor use-websocket.ts with Coalescer and Payload-Aware Handlers

  **What to do**:
  - Import `createEventCoalescer` from `@/composables/use-event-coalescer`
  - Create the coalescer instance inside `useWebSocket()` with handlers mapped to all store refetch functions:
    - `'suggestions'` → `suggestionStore.refetchSuggestions()`
    - `'queue'` → `queueStore.refetchQueue()`
    - `'auction'` → `auctionStore.refetchAuctions()` (only if admin — use `userStore.isAdmin` check inside handler)
    - `'user'` → `userStore.refetchUser()`
    - `'records:ANIME'` → `animeStore.refetchVideos()`
    - `'records:CARTOON'` → `cartoonStore.refetchVideos()`
    - `'records:SERIES'` → `seriesStore.refetchVideos()`
    - `'records:MOVIE'` → `movieStore.refetchVideos()`
    - `'records:GAME'` → `gamesStore.refetchGames()`
  - Refactor ALL `.on()` handlers to:
    1. Use optional chaining on payload access (`payload?.genre`, `payload?.id`) for backwards compat
    2. Route through the coalescer instead of calling refetch directly
    3. Fallback: if payload is `undefined`/missing, enqueue all potentially affected targets (same behavior as today but through coalescer)
  - Specific handler logic:
    - `update-records`: If `payload?.genre` exists, `coalescer.enqueue('records:' + payload.genre)`. If missing, enqueue all 5 genre targets (fallback).
    - `update-suggestions`: `coalescer.enqueue('suggestions')`
    - `update-queue`: `coalescer.enqueue('queue')`
    - `update-auction`: `coalescer.enqueue('suggestions')` + `coalescer.enqueue('auction')` — both targets, but coalescer deduplicates suggestions if another event also enqueues it
    - `update-likes`: `coalescer.enqueue('suggestions')` — same as today, but now deduped with other suggestion-triggering events
    - `update-users`: `coalescer.enqueue('user')`
  - Update `disconnect()` to call `coalescer.cancel()` before socket disconnect to prevent stale refetches
  - Keep `connect`, `disconnect`, `isConnected`, `socket` return values unchanged

  **Must NOT do**:
  - Do not change the socket.io connection config (transports, URL)
  - Do not add surgical cache updates — only route through coalescer for debounced refetch
  - Do not modify any store's refetch implementation
  - Do not remove the `connect_error` handler
  - Do not change the `onMounted`/`onUnmounted` lifecycle hooks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Central refactoring of the WebSocket consumer — touches all event handlers, integrates coalescer, backwards compat required
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 8)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 2-8 (needs backend payloads + gateway + coalescer all done)

  **References**:

  **Pattern References**:
  - `frontend/src/composables/use-websocket.ts:1-102` — FULL current implementation — this is the file being refactored. Keep the same structure, same exports, same lifecycle hooks.
  - `frontend/src/composables/use-websocket.ts:27-86` — Current `connect()` function with all `.on()` handlers — this is what gets refactored
  - `frontend/src/composables/use-websocket.ts:88-91` — Current `disconnect()` — add `coalescer.cancel()` call here
  - `frontend/src/composables/use-websocket.ts:44-68` — Current `update-records` handler with `switch(payload.genre)` — replace with coalescer enqueue + optional chaining

  **API/Type References**:
  - `frontend/src/composables/use-event-coalescer.ts` (Task 8 output) — Import `createEventCoalescer`
  - `frontend/src/lib/api.ts` `RecordGenre` — Used for typing payload.genre (already imported on line 3)

  **Acceptance Criteria**:

  ```
  Scenario: Build succeeds after refactoring
    Tool: Bash
    Steps:
      1. Run `bun run build` from project root
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: Lint passes
    Tool: Bash
    Steps:
      1. Run `bun run lint` from project root
    Expected Result: 0 warnings, 0 errors
    Evidence: .sisyphus/evidence/task-9-lint.txt

  Scenario: Format check passes
    Tool: Bash
    Steps:
      1. Run `bun run format:check`
      2. If fails, run `bun run format` then re-check
    Expected Result: exit 0
    Evidence: .sisyphus/evidence/task-9-format.txt

  Scenario: All event handlers use coalescer (no direct refetch calls)
    Tool: Bash (grep)
    Steps:
      1. Grep use-websocket.ts for `.refetch` calls
      2. Verify zero direct refetch calls in event handlers — all should go through coalescer.enqueue()
      3. Verify coalescer.cancel() is called in disconnect()
    Expected Result: Zero direct refetch calls in .on() handlers; coalescer.enqueue() used instead; cancel() in disconnect()
    Evidence: .sisyphus/evidence/task-9-coalescer-usage.txt

  Scenario: Backwards compat — optional chaining used
    Tool: Bash (grep)
    Steps:
      1. Grep use-websocket.ts for `payload\.` (dot access without optional chaining)
      2. Verify zero matches — all payload access should use `payload?.`
    Expected Result: Zero unsafe payload accesses
    Evidence: .sisyphus/evidence/task-9-optional-chaining.txt

  Scenario: Exports unchanged
    Tool: Bash (grep)
    Steps:
      1. Grep use-websocket.ts for `return {` block
      2. Verify it still returns `socket`, `isConnected`, `connect`, `disconnect`
    Expected Result: Same 4 return values as before
    Evidence: .sisyphus/evidence/task-9-exports.txt
  ```

  **Commit**: YES (group with Task 8 — commit 4)
  - Message: `feat(ws): add frontend event coalescer and integrate into WebSocket handlers`
  - Files: `frontend/src/composables/use-websocket.ts`
  - Pre-commit: `bun run build && bun run lint && bun run format:check`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bunx --bun tsc --noEmit` + `bun lint` + `bun run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together). Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| # | Commit | Files | Pre-commit |
|---|--------|-------|------------|
| 1 | `feat(ws): add WebSocket event payload types and constants` | `backend/src/modules/websocket/websocket.events.ts` | `bun run build` |
| 2 | `feat(ws): add payloads to all backend event emitters` | `record.service.ts`, `suggestion.service.ts`, `like.service.ts`, `auction.service.ts`, `user.service.ts` | `bun run build` |
| 3 | `feat(ws): forward payloads through WebSocket gateway` | `websocket.gateway.ts` | `bun run build` |
| 4 | `feat(ws): add frontend event coalescer and integrate into WebSocket handlers` | `use-event-coalescer.ts`, `use-websocket.ts` | `bun run build && bun run lint && bun run format:check` |

---

## Success Criteria

### Verification Commands
```bash
bun run build          # Expected: exit 0, no errors
bun run lint           # Expected: 0 warnings, 0 errors
bun run format:check   # Expected: exit 0
bunx --bun tsc --noEmit  # Expected: exit 0
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All builds pass
- [x] All 6 events carry payloads end-to-end
- [x] Coalescer deduplicates at store level
- [x] Fallback works when payload is undefined
