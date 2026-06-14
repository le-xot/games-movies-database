# Issues — websocket-granular

## [2026-04-04] Known Pre-existing Issues (DO NOT FIX)
- `createRecordFromLink` in record.service.ts doesn't emit update-records — pre-existing gap, NOT in scope
- Transaction-timing issue in auction.service.getWinner() (emits before commit) — pre-existing, NOT in scope
