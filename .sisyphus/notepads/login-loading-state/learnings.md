## 2026-04-05
- Twitch login buttons that navigate away need `await nextTick()` after toggling loading state so the spinner paints before redirect.
- `Loader2` with `animate-spin` matches the project spinner pattern used in `Sonner.vue`.
