# Profile Rework — Learnings

## [2026-04-05] Initial Setup

### Project Conventions
- Package manager: Bun only
- Formatter: oxfmt, linter: oxlint
- Single quotes enforced
- 2 spaces indent, max 100 chars/line
- Vue files: PascalCase
- .ts files: kebab-case
- Path alias: `@/` → `./src/`

### Key Discoveries
- Auth for QA: JWT must be crafted directly via `cd backend && bun -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: process.env.TWITCH_ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '1h' }));"`
- No Suggestion Prisma model — suggestions stored as Record with type: RecordType.SUGGESTION
- Swagger at `/docs` and `/docs-json` (NOT `/api/docs`)
- LoginForm already has RouterLink — do NOT change LoginForm avatar
- QueueCard uses `item.login` and `item.profileImageUrl` directly (NOT `item.user.login`)
- genreTags in use-table-select.ts does NOT have GAME entry yet
- New `@Get('profile/:login')` must be placed ABOVE existing `@Get(':id')` and `@Get(':login')` in user.controller.ts
- `/db/suggestion` (singular) is correct route (NOT `/db/suggestions`)
- Backend models: User, Record, Like, AuctionsHistory, Limit, SuggestionRules — NO Suggestion model
- API client regeneration only happens during `bun dev:frontend` startup — must restart after T1
- Frontend build in this repo requires `frontend/tsconfig.node.json` to allow emit for the referenced Node project; `noEmit` triggered TS6310 during `bun run build`.

## [2026-04-05] Profile record card extraction
- Extracted the duplicated profile record markup into `ProfileRecordCard.vue` with a single `record` prop.
- The shared card now handles poster fallback, date formatting, and grade badge rendering without genre branching.
- `ProfilePage.vue` now only supplies records to the reusable card for both videos and games.
- Frontend build is currently blocked by an unrelated pre-existing `frontend/tsconfig.node.json` TS6310 issue in this workspace.

## [2026-04-05] Avatar profile links
- Avatar profile links were added directly in the page cards instead of creating a shared avatar component.
- `QueueCard.vue` uses `item.login` for the profile route, while `AuctionCard.vue` and `SuggestionCard.vue` use `item.user.login`.
- `AdminPage.vue` links each user avatar to `/db/profile/${user.login}` with `RouterLink` from `vue-router`.

## Task 6: Profile Header and Stats Components
- Vue components can successfully combine shadcn-vue elements (Avatar, Card, Badge) to quickly form elegant profile blocks.
- Mapped constants like `genreTags` and `gradeTags` from `use-table-select.ts` are a robust way to standardize labels across the application, especially for displaying lists like `recordsByGenre`.

### Task 7: Profile Page Integration
- Extracted all page contents into `ProfilePageContent.vue` and left `ProfilePage.vue` as a thin wrapper. This pattern maintains cleaner route-level boundaries and improves separation of concerns.
- Implemented robust error states (404) catching, skeleton loaders, and empty states depending on whether the currently logged in user matches the requested profile.
- Used computed properties (`isOwnProfile` and `profileUser`) extensively to reactively determine if the viewed profile belongs to the authenticated user. Because `useProfile` doesn't explicitly return user details outside the `records`, we securely derived `profileUser` from `records.value[0]?.user`. If a user has no records, we show the fallback empty state cleanly without rendering a broken header.
Task 7 complete

## [2026-04-05] Quality gate verification
- `bun lint` passed cleanly with 0 warnings and 0 errors.
- `bun format:check` initially failed on 8 files, then passed after running `bun format`.
- `bun build` succeeded via the workspace build scripts (`bun build:frontend` + `bun build:backend`); the direct root `bun build` invocation only prints Bun's missing-entrypoint help in this repo.
