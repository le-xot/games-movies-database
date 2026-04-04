# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-04-04
**Root:** frontend/src/

## OVERVIEW

Vue 3 SPA using Vite, Tailwind 4, shadcn-vue, Pinia, and auto-generated API client.

## STRUCTURE

```
frontend/src/
├── assets/        # Global styles, OKLCH colors, dark mode, autofill hacks
├── components/    # Shared components (PascalCase .vue) + ui/ (shadcn-vue, DO NOT EDIT)
│   ├── dialog/    # Dialog, DialogButton
│   ├── form/      # LoginForm
│   ├── layout/    # LayoutHeader, LayoutBody, LayoutDatabase, LayoutHome
│   ├── record/    # RecordCreateForm
│   ├── table/     # DataTable, filters, pagination, search, table-col/
│   └── ui/        # shadcn-vue primitives (managed, do not edit)
├── composables/   # Plain composables (useWebSocket, useRecordCreate) + factories/
├── lib/           # API client (auto-generated), cn() helper
├── pages/         # Route components (13 feature folders, PascalCase .vue)
├── router/        # Vue Router config + route paths
├── stores/        # Pinia stores (useApi, useUser, useBreakpoints, useNewRecords, useTitle)
└── utils/         # Image proxy, watch link generation
```

## WHERE TO LOOK

| Task                      | Location                 | Pattern                                                                                   |
| ------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| Add Page                  | `pages/{name}/`          | Create `{Name}Page.vue` + `composables/` if complex                                       |
| Update API                | `lib/api.ts`             | **NEVER EDIT**. Generated from backend `/docs-json`                                       |
| Route                     | `router/`                | Add to `router-paths.ts` then `router.ts`                                                 |
| Styling                   | `assets/index.css`       | Tailwind 4 CSS variables + global overrides                                               |
| Utils                     | `lib/utils.ts`           | Primary `cn()` helper (clsx + tailwind-merge)                                             |
| Add media page composable | `composables/factories/` | 3 factories: `create-params-store.ts`, `create-records-store.ts`, `create-table-store.ts` |
| Generic filter            | `components/table/`      | `TableFilterGeneric.vue + use-table-filter.ts`                                            |
| Pinia stores              | `stores/`                | `defineStore` pattern, import via `@/stores/use-{name}`                                   |
| Image/link utils          | `utils/`                 | `getImageUrl()`, `generateWatchLink()`                                                    |

## STORES (Pinia — `stores/`)

| Name              | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `useApi`          | Singleton API client (baseUrl: /api, credentials: include)   |
| `useUser`         | Auth state, login/logout, /auth/me data, admin/login getters |
| `useBreakpoints`  | Tailwind breakpoint tracking via @vueuse/core                |
| `useNewRecords`   | localStorage tracking for "new" record badges                |
| `useTitle`        | Document title management                                    |

## COMPOSABLES (Plain — `composables/`)

| Name              | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `useWebSocket`    | Socket.io client; triggers refetches on server events        |
| `useRecordCreate` | Mutation for creating records from links                     |

## COMPONENT PATTERNS

- **Setup**: Always use `<script setup lang="ts">`.
- **Naming**: `.vue` files use PascalCase (e.g., `AnimePage.vue`, `DataTable.vue`). `.ts` files use kebab-case (e.g., `use-api.ts`). Exception: `app.vue` (root component).
- **Barrel imports**: Shared component directories have `index.ts` barrels. Example: `import { DataTable } from '@/components/table'`
- **Imports**: `.vue` imports MUST keep extension; `.ts` imports MUST NOT have extension. Use `@/` alias for all internal paths.
- **UI Primitives**: shadcn-vue + reka-ui. Import via barrel: `import { Button } from '@/components/ui/button'`.
- **Validation**: vee-validate 5 + zod 4.
- **Data Tables**: @tanstack/vue-table for logic, virtua for virtualization.
- **Toasts**: vue-sonner (wrapper in `components/ui/sonner`).
- **Events**: Kebab-case enforced for custom events.
- **Order**: `<template>` or `<script>` first, `<style>` last.
- **LocalStorage**: Per-genre keys for column visibility: `columnsVisibility:<genre>` (e.g. `columnsVisibility:anime`).

## ANTI-PATTERNS

- **NEVER** edit `lib/api.ts`. It's overwritten on every frontend dev start.
- **Don't** remove the autofill hack in `index.css` (9999s transition delay).
- **Don't** use icon libraries other than lucide-vue-next or vue3-simple-icons.
- **Don't** bypass `useUser` guards for auth-protected routes.
- **Don't** import stores from `@/composables/` — use `@/stores/` instead
- **Don't** rename `.vue` files to kebab-case — PascalCase is enforced
