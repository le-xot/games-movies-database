# Learnings — backend-repository-pattern

## [2026-04-05] Plan initialized

### Key Architectural Decisions
- Abstract classes (not interfaces) for repository contracts — NestJS DI requires concrete tokens
- Domain entities as plain TypeScript interfaces — NO @ApiProperty() decorators
- `*-domain.entity.ts` naming for modules with existing Swagger entity files (record, user)
- Transaction callback pattern: repository method wraps `this.prisma.$transaction(async (tx) => { ... })`
- 7 app-level string enums matching Prisma enum values exactly
- Test-first approach: write tests BEFORE refactoring each service
- Manual DI in tests (no @nestjs/testing) — bun compatibility not guaranteed
- `RecordFilterOptions` includes: search, status, type, grade, genre, userId
- `RecordSortOptions` includes: orderBy ('title'|'id'), direction ('asc'|'desc')
- Task 8 repo methods: `findRecordByLinkAndGenre(link, genre)` and `findSuggestionRulesByGenre(genre)`
- Task 12 getWinner: explicit `id` param, NOT random — `selectWinner(id: number)`
- `const enum` is FORBIDDEN — incompatible with IsEnum() and includes()
- No generic/abstract base repository class — each repository is specific

### Existing File Warnings
- Existing `*.entity.ts` files are Swagger response shapes — DO NOT rename
- `enums.names.ts` contains string constants for Swagger, not actual TypeScript enums
- `suggesttion.dto.ts` has a typo (double t) — do NOT rename
- `AuthModule` has anomaly: directly provides PrismaService in providers (not via PrismaModule) — fix in Task 13
- `RecordService.deleteRecord()` has latent bug: like.deleteMany + record.delete without transaction

### Codebase Structure
- 9 services use PrismaService: limit, queue, like, spotify, records-providers, suggestion, record, user, auction
- 3 transaction hotspots: auction (callback-style), suggestion and user (array-style → convert to callback)
- ~22 files import $Enums or types from @prisma/client
- No Prisma middleware, extensions or raw SQL — clean decoupling possible
- JWT payload: `{ id: userId }`, secret from `env.JWT_SECRET`, token in `request.cookies.token`
- Seeded admin from `TWITCH_ADMIN_ID`/`TWITCH_ADMIN_LOGIN` env vars

### Scope Guardrails
- ONLY auth and websocket files may be changed for $Enums replacement (Task 2) and auth.module.ts DI fix (Task 13)
- NO changes to: img, twitch, jwt, twir, weather modules
- NO changes to frontend, api.ts, seed.js, migrations
- NO new API endpoints, DTOs, Swagger contract changes
- Task 1: bun test is zero-config in backend; added `bun test` script and verified `.spec.ts` discovery.
  - `createMock` needs a Proxy fallback so abstract prototype methods remain callable even when Bun mock assignment does not materialize as expected.

## [2026-04-05] Task 2 completed — $Enums migration

### Files fixed beyond the original 17 (discovered at build time):
- `suggestion.service.ts` — was missing `UpdateSuggestionsPayload` import (used in `satisfies` expressions)
- `auction.service.ts` — `winner.genre` (Prisma type) needed `as unknown as RecordGenre` cast for `UpdateRecordsPayload`
- `auction.controller.ts` — `getAuctions()`/`getWinner()` return types needed `as unknown as Promise<RecordEntity>` casts
- `limit.service.ts` — `prisma.limit.update()` return needed `as unknown as Promise<LimitEntity>` cast
- `queue.service.ts` — `g.type`, `v.type`, `v.genre` needed casts in `QueueItemDto` mapping
- `suggestion.controller.ts` — `getSuggestions()` return needed `as unknown as Promise<RecordEntity[]>` cast
- `records-providers.service.ts` — three type annotations still used `$Enums.RecordGenre` namespace form (not caught by ast_grep value pattern)

### Build result: clean (exit 0)
### $Enums grep result: zero matches in backend/src/

### Pattern observations:
- `ast_grep` pattern `$Enums.Foo.$VAR` only matches *value* usages, NOT type annotations like `$Enums.Foo` used as a TypeScript type — scan remaining files manually after ast_grep runs
- Prisma→app enum type incompatibility requires `as unknown as AppEnum` casts at every Prisma result boundary where the field is typed explicitly
- Controllers returning `Promise<EntityType>` directly from service calls (which return Prisma types) also need casts

## [2026-04-05] Task 3 completed — Domain entity interfaces + TransactionManager

### Files created:
- `backend/src/modules/limit/entities/limit.entity.ts` — `LimitDomain`
- `backend/src/modules/like/entities/like.entity.ts` — `LikeDomain`
- `backend/src/modules/spotify/entities/spotify-token.entity.ts` — `SpotifyTokenDomain`
- `backend/src/modules/suggestion/entities/suggestion-rules.entity.ts` — `SuggestionRulesDomain`
- `backend/src/modules/record/entities/record-domain.entity.ts` — `RecordDomain`, `RecordWithRelations`, `RecordFilterOptions`, `RecordSortOptions`
- `backend/src/modules/user/entities/user-domain.entity.ts` — `UserDomain`, `ProfileStatsDomain`
- `backend/src/modules/auction/entities/auction-history.entity.ts` — `AuctionHistoryDomain`
- `backend/src/database/transaction.interface.ts` — `TransactionManager`

### Key observations:
- Prisma `AuctionsHistory` model fields (`winnerId: Int` FK to Record.id, `createdAt`) differ from the domain interface spec (`recordId`, `startedAt`, `endedAt?`, `winnerId?: string`) — domain shape diverges from Prisma model by design (service layer abstraction)
- `displayName` and `avatarUrl` in `UserDomain` are NOT in the Prisma `User` model (which has `profileImageUrl` and `color`) — these are mapped/derived fields used by the service layer
- The `*-domain.entity.ts` naming convention successfully avoids collision with existing Swagger `*.entity.ts` files
- All domain interface files: zero decorators, zero @prisma/client imports, pure TypeScript
- `TransactionManager.transaction<T>(fn: () => Promise<T>)` — fn takes no tx context; Prisma implementation will capture tx client via scoped constructor injection (Tasks 9-12)
- Build: exit code 0, zero @prisma/client matches in entities directories

## [2026-04-05] Task 4 completed — Limit repository refactor

### Files added/updated:
- `backend/src/modules/limit/repositories/limit.repository.ts` — abstract repository contract
- `backend/src/modules/limit/repositories/prisma-limit.repository.ts` — Prisma-backed implementation
- `backend/src/modules/limit/limit.service.ts` — now depends on `LimitRepository`
- `backend/src/modules/limit/limit.module.ts` — wires repository provider through DI
- `backend/src/modules/limit/__tests__/limit.service.spec.ts` — manual DI test for `changeLimit()`

### Notes:
- `changeLimit()` now delegates update logic to the repository, keeping service logic thin.
- Manual Bun tests with `createMock()` worked without `@nestjs/testing`.
- Prisma data field mapping remained `quantity` in this module, so the repository preserves the existing API shape at the service boundary.

## [2026-04-05] Task 6 completed — Like repository refactor

### Files added/updated:
- `backend/src/modules/like/repositories/like.repository.ts` — abstract class with 7 methods
- `backend/src/modules/like/repositories/prisma-like.repository.ts` — Prisma-backed implementation
- `backend/src/modules/like/like.service.ts` — now depends on `LikeRepository`, no PrismaService
- `backend/src/modules/like/like.module.ts` — wires `{ provide: LikeRepository, useClass: PrismaLikeRepository }`
- `backend/src/modules/like/__tests__/like.service.spec.ts` — 9 tests for all 5 service methods

### Notes:
- LikeService has 5 methods: createLike, deleteLike, getLikesByRecordId, getLikesByUserId, getLikes
- `deleteByUserAndRecord` returns a count (number) — NotFoundException thrown when count === 0
- EventEmitter2 `update-likes` events with `{ recordId, userId, action: 'created'|'deleted' }` fully preserved
- Abstract LikeRepository uses 7 methods: findByUserAndRecord, create, deleteByUserAndRecord, findByRecord, findByUser, findMany, countAll
- Mocking `mockEventEmitter = { emit: mock(() => {}) }` and casting as `any` works cleanly
- `not.toHaveBeenCalled()` guard: on BadRequestException, `create` is not called; on NotFoundException, `emit` is not called
- 9 tests pass, tsc --noEmit exits 0

## [2026-04-05] Task 5 completed — Queue repository refactor

### Files added/updated:
- `backend/src/modules/queue/repositories/queue.repository.ts` — abstract repository contract
- `backend/src/modules/queue/repositories/prisma-queue.repository.ts` — Prisma-backed implementation
- `backend/src/modules/queue/queue.service.ts` — now depends on `QueueRepository`, no PrismaService
- `backend/src/modules/queue/queue.module.ts` — wires `{ provide: QueueRepository, useClass: PrismaQueueRepository }`
- `backend/src/modules/queue/__tests__/queue.service.spec.ts` — manual DI test for `getQueue()`

### Notes:
- `getQueue()` keeps all DTO mapping logic in the service and only delegates record fetching to the repository.
- The queue service uses `RecordType.WRITTEN` as the repository filter input and still splits games/videos in memory.
- Manual Bun tests with `createMock()` worked cleanly for abstract repository injection.
- Evidence saved for the queue test run and the no-Prisma check.

## [2026-04-05] Task 8 completed — RecordsProviders repository refactor

### Files created/updated:
- `backend/src/modules/records-providers/repositories/records-providers.repository.ts` — abstract class with 2 methods
- `backend/src/modules/records-providers/repositories/prisma-records-providers.repository.ts` — Prisma-backed implementation
- `backend/src/modules/records-providers/records-providers.service.ts` — now depends on `RecordsProvidersRepository`, no PrismaService
- `backend/src/modules/records-providers/records-providers.module.ts` — wires `{ provide: RecordsProvidersRepository, useClass: PrismaRecordsProvidersRepository }`
- `backend/src/modules/records-providers/__tests__/records-providers.service.spec.ts` — 9 tests covering duplicate check + suggestion rules validation + repo call assertions

### Key pattern: avoid importing env-validating modules in tests
- `TwitchService` imports `@/utils/enviroments` at module scope, which calls `envalid.cleanEnv()` and exits if DATASOURCE_URL/JWT_SECRET/TWITCH_CALLBACK_URL are missing
- Fix: replace `createMock(TwitchService)` with a plain object: `{ getAppAccessToken: mock(() => Promise.resolve('token')) } as any`
- This avoids loading the TwitchService module entirely, bypassing env validation
- General rule: for services that depend on env-validating modules (twitch, spotify, auth), use plain object mocks instead of `createMock(ActualClass)`

### Repository method signatures:
- `findRecordByLinkAndGenre(link: string, genre: RecordGenre): Promise<RecordDomain | null>` — wraps `prisma.record.findFirst({ where: { link, genre } })`
- `findSuggestionRulesByGenre(genre: RecordGenre): Promise<SuggestionRulesDomain | null>` — wraps `prisma.suggestionRules.findUnique({ where: { genre } })`
- Both use `as unknown as Promise<Domain | null>` cast pattern for Prisma→domain type boundary

### Test result: 9 pass, 0 fail | Build: exit 0

## [2026-04-05] Task 7 completed — Spotify repository refactor

### Files created/updated:
- `backend/src/modules/spotify/repositories/spotify-token.repository.ts` — abstract class with 3 methods
- `backend/src/modules/spotify/repositories/prisma-spotify-token.repository.ts` — Prisma-backed implementation
- `backend/src/modules/spotify/spotify.service.ts` — now depends on `SpotifyTokenRepository`, no PrismaService
- `backend/src/modules/spotify/spotify.module.ts` — wires `{ provide: SpotifyTokenRepository, useClass: PrismaSpotifyTokenRepository }`
- `backend/src/modules/spotify/__tests__/spotify.service.spec.ts` — 8 tests for all 4 service methods

### Repository method signatures:
- `findByService(service: ThirdPartService): Promise<SpotifyTokenDomain | null>` — wraps `findUnique({ where: { service } })`
- `upsert(service, data): Promise<SpotifyTokenDomain>` — wraps `upsert({ where: { service }, create: payload, update: payload })`
- `update(service, data): Promise<SpotifyTokenDomain>` — wraps `update({ where: { service }, data })`
- All use `as unknown as Promise<SpotifyTokenDomain>` cast pattern

### Key env-mock challenge:
- `SpotifyService` directly imports `env` from `@/utils/enviroments` at module level (not tree-shakeable)
- Unlike `TwitchService` (which CAN be tree-shaken when used only as DI type), `spotify.service.ts` uses `env.*` as values
- `envalid.cleanEnv()` runs at module initialization and fails when `NODE_ENV=test` (bun's default)
- Solution: `backend/bunfig.toml` created with `[define] "process.env.NODE_ENV" = '"development"'` which replaces the value at compile time for all test runs from the `backend/` directory
- Also added `[test] preload = ["./src/__tests__/setup.ts"]` and populated `setup.ts` to set `NODE_ENV=development` as runtime fallback
- Tests MUST be run from `backend/` directory (`bun test src/modules/spotify/`) — NOT from root — because `bunfig.toml` and `.env` are only loaded when cwd is `backend/`
- `mock.module('@/utils/enviroments', ...)` does NOT work as a static module mock in bun v1.3.4 — ES module static imports are evaluated before mock.module runs even with hoisting

### Test result: 8 pass, 0 fail | Build: exit 0 | grep PrismaService: 0 matches

## [2026-04-05] Task 12 completed — Auction repository refactor

### Files created/updated:
- `backend/src/modules/auction/repositories/auction.repository.ts` — abstract class with 2 methods
- `backend/src/modules/auction/repositories/prisma-auction.repository.ts` — Prisma-backed implementation with full `$transaction` callback
- `backend/src/modules/auction/auction.service.ts` — now depends on `AuctionRepository`, no PrismaService
- `backend/src/modules/auction/auction.module.ts` — wires `{ provide: AuctionRepository, useClass: PrismaAuctionRepository }`
- `backend/src/modules/auction/__tests__/auction.service.spec.ts` — 3 tests for both service methods

### Repository method signatures:
- `findAuctions(): Promise<RecordWithRelations[]>` — wraps `prisma.record.findMany({ where: { type: AUCTION }, include: { user: true } })`
- `selectWinner(id: number): Promise<RecordWithRelations>` — full 5-step `$transaction` callback: findUnique (verify), update (mark WRITTEN), auctionsHistory.create, like.deleteMany, record.deleteMany

### Key pattern observations:
- EventEmitter2 event emissions (`update-auction`, `update-records`) correctly stay in the service, NOT moved into the repository
- The `logger.warn()` for missing record also stays in the repository since it's part of the transaction guard logic
- `logger.log('Auction winner chosen...')` moved to service (after `await selectWinner()` returns)
- Test data typed as `any` to avoid Prisma→domain type boundary conflicts in `expect().toEqual()`
- LSP showed stale cache error for the test file import after creating the repository — this resolves itself and tsc confirmed zero errors
- 52 total tests pass (3 new auction tests + 49 pre-existing)

### Test result: 3 pass, 0 fail | Build: exit 0 | grep PrismaService: 0 matches

## [2026-04-05] Task 13 completed — AuthModule DI cleanup

### Files updated:
- `backend/src/modules/auth/auth.module.ts` — removed `PrismaService` import and provider entry

### Verification:
- `grep 'PrismaService' backend/src/modules/auth/auth.module.ts` → zero matches
- `grep -rn 'PrismaService' backend/src/modules/ --include='*.ts' | grep -v 'repositories/'` → zero non-repository matches
- `bun test` → 52 pass, 0 fail
- `bunx --bun tsc --noEmit` → exit 0

### Note:
- `AuthService` still depends only on `UserService`, `TwitchService`, and `JwtService`; `AuthModule` no longer leaks `PrismaService` directly.
## 2026-04-05 - UserService spec

- `TwitchService` must stay a plain object in tests; `createMock(TwitchService)` can trigger env validation at import time.
- `UserService` branching is easiest to cover by mocking repo methods directly and asserting `eventEmitter.emit` side effects.
- Bun's `expect(...).rejects.toThrow(NotFoundException)` works cleanly for Nest exceptions in service specs.
F1 audit result: Must Have [7/7], Must NOT Have [5/7], verdict=REJECT.
Verified repository-pattern plan artifacts via command-based audit; evidence saved under .sisyphus/evidence/final-qa/.
