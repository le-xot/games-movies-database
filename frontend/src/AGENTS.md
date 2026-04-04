# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-04-04
**Root:** frontend/src/

## OVERVIEW
Vue 3 SPA using Vite, Tailwind 4, shadcn-vue, Pinia, and auto-generated API client.

## STRUCTURE
```
frontend/src/
├── assets/      # Global styles, OKLCH colors, dark mode, autofill hacks
├── components/  # UI primitives (ui/), data tables (table/), forms (form/, record/)
├── composables/ # Global Pinia stores (auth, api, websocket)
├── layout/      # section-specific wrappers (db/, home/)
├── lib/         # API client, router, router-paths, image/link helpers
└── pages/       # Route components (13 feature folders with local logic)
```

## WHERE TO LOOK
| Task | Location | Pattern |
|------|----------|---------|
| Add Page | `pages/{name}/` | Create `{name}.vue` + `composables/` if complex |
| Update API | `lib/api.ts` | **NEVER EDIT**. Generated from backend `/docs-json` |
| Route | `lib/router/` | Add to `router-paths.ts` then `router.ts` |
| Styling | `assets/index.css` | Tailwind 4 CSS variables + global overrides |
| Utils | `lib/utils.ts` | Primary `cn()` helper (clsx + tailwind-merge) |

## COMPOSABLES (GLOBAL STORES)
| Name | Purpose |
|------|---------|
| `useApi` | Singleton API client (baseUrl: /api, credentials: include) |
| `useUser` | Auth state, login/logout, /auth/me data, admin/login getters |
| `useWebsocket` | Socket.io client; triggers refetches on server events |
| `useBreakpoints` | Tailwind breakpoint tracking via @vueuse/core |
| `useRecordCreate` | Mutation for creating records from links |
| `useNewRecords` | localStorage tracking for "new" record badges |
| `useTitle` | Document title management |

## COMPONENT PATTERNS
- **Setup**: Always use `<script setup lang="ts">`.
- **Imports**: Always include `.vue` extension. Use `@/` alias for all internal paths.
- **UI Primitives**: shadcn-vue + reka-ui. Import via barrel: `import { Button } from '@/components/ui/button'`.
- **Validation**: vee-validate 5 + zod 4.
- **Data Tables**: @tanstack/vue-table for logic, virtua for virtualization.
- **Toasts**: vue-sonner (wrapper in `components/ui/sonner`).
- **Events**: Kebab-case enforced for custom events.
- **Order**: `<template>` or `<script>` first, `<style>` last.

## ANTI-PATTERNS
- **NEVER** edit `lib/api.ts`. It's overwritten on every frontend dev start.
- **Avoid** `lib/lib/utils.ts`. It's a duplicate; use `@/lib/utils` for `cn()`.
- **Don't** remove the autofill hack in `index.css` (9999s transition delay).
- **Don't** use icon libraries other than lucide-vue-next or vue3-simple-icons.
- **Don't** bypass `useUser` guards for auth-protected routes.
