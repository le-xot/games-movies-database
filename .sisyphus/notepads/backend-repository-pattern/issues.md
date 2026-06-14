# Issues — backend-repository-pattern

## [2026-04-05] Pre-identified issues from research phase

### Known Issues
1. `RecordService.deleteRecord()` — latent bug: like.deleteMany + record.delete without transaction. Should be wrapped in a transaction when implementing the repository.
2. `AuthModule` anomaly: directly provides PrismaService in providers (not via PrismaModule import). Fix in Task 13 only.
3. Frontend LSP errors for module resolution — pre-existing, NOT caused by this plan. Ignore.

### File Naming Traps
- `suggesttion.dto.ts` (double t typo) — do NOT rename
- Existing `*.entity.ts` files are Swagger shapes — do NOT rename
- New domain entity files must be `*-domain.entity.ts` in modules that already have a Swagger entity
Must NOT Have 3d failed: controller route decorator count changed (baseline 35, current 38)
Must NOT Have 3g failed: frontend files changed within HEAD~20..HEAD
