2026-04-05: Websocket gateway handlers now accept typed payloads from EventEmitter and forward the payload unchanged to Socket.IO emits.

2026-04-05: createEventCoalescer implemented in use-event-coalescer.ts. VueUse v14's useDebounceFn does NOT expose .cancel() in its TypeScript types (returns PromisifyFn which is just a plain function). The implementation uses native setTimeout/clearTimeout instead for type-safe debounce+cancel. The Set<string> accumulator pattern works: enqueue() adds target + restarts timer, flush() iterates Set + calls handlers + clears Set, cancel() clears Set + clears timer. No new deps needed — setTimeout is built-in.

2026-04-05 (Task 9): use-websocket.ts refactored to use createEventCoalescer. Key patterns:
- createEventCoalescer() called at composable scope (outside connect()), so same instance survives reconnects
- RecordGenre import removed — payload typed as `{ genre?: string }` with optional chaining avoids import ordering issues and is backwards-compatible
- `coalescer.cancel()` called in disconnect() BEFORE socket.disconnect() to prevent any pending flushes after teardown
- update-records now gracefully handles missing payload: if payload?.genre is falsy, enqueues all 5 record targets
- All 6 .on() handlers route through coalescer.enqueue() — zero direct .refetch*() calls remain
- oxfmt + oxlint both pass with 0 warnings/errors; build exits 0
