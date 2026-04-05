# Decisions — websocket-granular

## [2026-04-04] Architecture Decisions
- Payloads only: no surgical cache updates, no room-based broadcasting, no event name changes
- Payload shape: entity ID + action. update-records also keeps genre.
- Coalescing: frontend-side debounce at store/refetch-target level (not event level)
- Backwards compat: optional chaining on all payload access (payload?.genre, payload?.id)
- No new npm deps — use useDebounceFn from @vueuse/core as timer mechanism inside custom Set accumulator
- Cancel pending debounce on disconnect() to prevent stale refetches
- DO NOT share types between backend/frontend — each side defines its own types
- Event name constants should be centralized in `WsEvents` and match the existing gateway strings exactly.
