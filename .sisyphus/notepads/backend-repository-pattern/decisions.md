# Decisions — backend-repository-pattern

## [2026-04-05] Plan initialized — all architectural decisions pre-approved via Metis + Momus review

### Repository Pattern
- Use abstract classes as repository contracts (NestJS DI compatibility)
- Naming: `XRepository` (abstract) + `PrismaXRepository` (implementation)
- Co-located with modules: `modules/x/repositories/`

### Entities
- Plain TypeScript interfaces — no decorators
- Domain entities do NOT map 1:1 to Prisma models (they may be simpler/different)
- Naming: `XDomain` for interfaces, `*-domain.entity.ts` for files in modules with existing Swagger entities

### Transactions
- Callback pattern: `repository.withTransaction(async (repos) => { ... })`
- Auction service: already callback-style, adapt to repository
- Suggestion + User: array-style → convert to callback

### Testing
- bun test (zero-config, built-in)
- Manual DI: `new XService(mockRepository)` — NOT @nestjs/testing
- Test-first: write tests for current behavior, THEN refactor

### Enums
- 7 string enums: UserRole, RecordStatus, RecordType, RecordGenre, RecordGrade, LimitType, ThirdPartService
- Values must exactly match Prisma enum values (same strings)
- Location: `backend/src/enums/*.enum.ts` + `backend/src/enums/index.ts` barrel
F1 scoring counted plan audit sections 2a-2g and 3a-3g as 7 Must Have and 7 Must NOT Have checks.
