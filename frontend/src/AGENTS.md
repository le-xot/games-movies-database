# FRONTEND KNOWLEDGE BASE

**Updated:** 2026-10-26
**Root:** frontend/src/

## OVERVIEW

Vue 3 SPA using Vite, Tailwind 4, shadcn-vue, Pinia, and an Eden Treaty API client (types come from the backend's Elysia routes, no codegen).

## STRUCTURE

```
frontend/src/
├── app.vue        # Корневой компонент (подключает CommandPalette)
├── main.ts        # createApp + pinia + router
├── assets/        # Global styles, OKLCH colors, dark mode, autofill hacks
├── components/    # Shared components (PascalCase .vue) + ui/ (shadcn-vue, DO NOT EDIT)
│   ├── account/   # AccountDialog, AccountHeader, AccountNickname, ConnectedAccounts, AccountDangerZone, AccountAvatarRow, AccountNotifications
│   ├── dialog/    # Dialog
│   ├── form/      # LoginForm, LoginDialog
│   ├── layout/    # db/ (LayoutHeader, LayoutSidebar, LayoutBody, LayoutDatabase, NavItem, use-db-navigation) + home/ (LayoutHome)
│   ├── media/     # DataCards, filters, search, badge/
│   ├── palette/   # CommandPalette + composables/ + constants/
│   └── ui/        # shadcn-vue primitives (managed, do not edit)
├── composables/   # Plain composables (useWebSocket, useRating, useScrollContainer, factories/)
├── lib/           # Eden API client (api.ts), cn() helper
├── pages/         # Route components (feature folders, PascalCase .vue)
├── router/        # Vue Router config + route paths
├── stores/        # Pinia stores + plain useApi helper
├── types/         # RouteMeta / RouteNamedMap augmentation (vue-router.d.ts)
└── utils/         # Image proxy, watch link generation, plural-ru, time, api-error
```

## WHERE TO LOOK

| Task             | Location                     | Pattern                                                                                                                          |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Add Page         | `pages/{name}/`              | `{Name}Page.vue` + `composables/` if complex; жанровые разделы — только `composables/`, рендер общий `pages/media/MediaPage.vue` |
| Update API       | `lib/api.ts`                 | Eden Treaty; типы из `App` (`@backend/gateway`), реэкспорт из `@backend/api-types`                                               |
| Route            | `router/`                    | Add to `router-paths.ts` then `router.ts`; имена — в `types/vue-router.d.ts`                                                     |
| Styling          | `assets/index.css`           | Tailwind 4 CSS variables + global overrides                                                                                      |
| Utils            | `lib/utils.ts`               | Primary `cn()` helper (clsx + tailwind-merge)                                                                                    |
| Add media genre  | `pages/{genre}/composables/` | Shared `pages/media/MediaPage.vue`; genre from `route.meta.genre`; factories in `composables/factories/`                         |
| Account UI       | `components/account/`        | Modal sections; opened via `use-account-dialog` store                                                                            |
| Login modal      | `components/form/`           | `LoginDialog.vue`; opened via `use-login-dialog` store                                                                           |
| Command palette  | `components/palette/`        | Hotkey + поиск; открытие через `use-command-palette` store                                                                       |
| Sidebar / nav    | `components/layout/db/`      | `LayoutSidebar.vue`, `NavItem.vue`, `use-db-navigation.ts`                                                                       |
| Pinia stores     | `stores/`                    | `defineStore` pattern, import via `@/stores/use-{name}`                                                                          |
| Image/link utils | `utils/`                     | `getImageUrl()`, `generateWatchLink()`                                                                                           |

## STORES (Pinia — `stores/`)

| Name                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `useUser`           | Auth state, login/logout, /auth/me data, admin/login getters |
| `useAccountDialog`  | Account modal open state (`ACCOUNT_DIALOG_ON_LOAD_KEY`)      |
| `useLoginDialog`    | Login modal open state                                       |
| `useCommandPalette` | Command palette open state (`isOpen`, `open/close/toggle`)   |
| `useNewRecords`     | localStorage tracking for "new" record badges                |
| `useTitle`          | Document title management                                    |

`useApi` (`stores/use-api.ts`) — **не** Pinia store, а обычная функция, возвращающая Eden-клиент из `lib/api.ts`: клиент — `Proxy`, и `reactive()` ломает его ловушки.

## COMPOSABLES (Plain — `composables/`)

| Name                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `useWebSocket`         | Native WebSocket (`/ws`), кадры `{event, payload}`; рефетчит по событиям |
| `useRating`            | Mutation for rating a record (PUT/DELETE `/ratings` via Eden)            |
| `useScrollContainer`   | `provide`/`inject` для scroll-контейнера медиа-страниц                   |
| `createEventCoalescer` | Debounced event batching for WebSocket updates                           |
| `websocket-resync`     | Догоняющий рефетч после реконнекта                                       |
| `query-keys`           | Ключи кэша @pinia/colada                                                 |
| `factories/`           | `create-params-store`, `create-records-store` для медиа-страниц          |

## COMPONENT PATTERNS

- **Setup**: Always use `<script setup lang="ts">`.
- **Naming**: `.vue` files use PascalCase (e.g., `AnimePage.vue`, `DataCards.vue`). `.ts` files use kebab-case (e.g., `use-api.ts`). Exception: `app.vue` (root component).
- **Barrel imports**: Shared component directories have `index.ts` barrels. Example: `import { DataCards } from '@/components/media'`
- **Imports**: `.vue` imports MUST keep extension; `.ts` imports MUST NOT have extension. Use `@/` alias for all internal paths.
- **UI Primitives**: shadcn-vue + reka-ui. Import via barrel: `import { Button } from '@/components/ui/button'`.
- **Validation**: vee-validate 5.
- **Toasts**: vue-sonner (wrapper in `components/ui/sonner`).
- **Events**: custom events are kebab-case (соглашение, правилом линтера не проверяется).
- **Loading states**: don't render empty states while `isLoading`; keep previous data with colada `placeholderData`; skeletons come from `@/components/ui/skeleton` and render immediately.
- **Order**: `<template>` or `<script>` first, `<style>` last.

## ANTI-PATTERNS

- **NEVER** заводить кодоген контракта: типы идут из Eden (`App`) и `@backend/api-types` (статические `export type` из `gateway/*`); файлов `openapi.json` и `src/lib/api-types.ts` в проекте нет.
- **Don't** remove the autofill hack in `index.css` (9999s transition delay).
- **Don't** use icon libraries other than @lucide/vue or vue3-simple-icons.
- **Don't** bypass `useUser` guards for auth-protected routes.
- **Don't** import stores from `@/composables/` — use `@/stores/` instead
- **Don't** rename `.vue` files to kebab-case — PascalCase is the convention
